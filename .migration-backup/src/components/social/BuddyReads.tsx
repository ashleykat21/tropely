import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useLibrary } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Users, Plus, Send, EyeOff, BookOpen, Lock } from "lucide-react";
import { usePremium } from "@/lib/usePremium";

const FREE_MEMBER_CAP = 3;

type Room = {
  id: string;
  owner_id: string;
  book_title: string;
  book_author: string | null;
  total_pages: number;
  spoiler_page: number;
  created_at: string;
  chapters?: { label: string; page: number }[] | null;
};

type Member = { id: string; buddy_read_id: string; user_id: string; current_page: number };
type Message = {
  id: string;
  buddy_read_id: string;
  user_id: string;
  content: string;
  page_at: number;
  chapter: number | null;
  created_at: string;
};

export function BuddyReads() {
  const { user } = useAuth();
  const isPremium = usePremium((s) => s.isPremium);
  const { books, currentId } = useLibrary();
  const current = books.find((b) => b.id === currentId);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [openRoom, setOpenRoom] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [createOpen, setCreateOpen] = useState(false);
  const [activeChapter, setActiveChapter] = useState<number | "all">("all");
  const [chaptersDraft, setChaptersDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const myMember = useMemo(
    () => members.find((m) => m.buddy_read_id === openRoom && m.user_id === user?.id),
    [members, openRoom, user]
  );
  const room = rooms.find((r) => r.id === openRoom);
  const roomChapters = (room?.chapters ?? []) as { label: string; page: number }[];

  // Derive a chapter index for a given page based on the room's chapter markers.
  const chapterFor = (page: number) => {
    if (roomChapters.length === 0) return null;
    let idx = 0;
    for (let i = 0; i < roomChapters.length; i++) {
      if (page >= roomChapters[i].page) idx = i;
    }
    return idx;
  };

  const loadRooms = async () => {
    const { data: rs } = await supabase
      .from("buddy_reads")
      .select("*")
      .order("created_at", { ascending: false });
    setRooms(((rs as unknown) as Room[]) ?? []);
    const ids = (rs ?? []).map((r) => r.id);
    if (ids.length) {
      const { data: ms } = await supabase.from("buddy_members").select("*").in("buddy_read_id", ids);
      setMembers((ms as Member[]) ?? []);
      const userIds = [...new Set((ms ?? []).map((m) => m.user_id))];
      if (userIds.length) {
        const { data: ps } = await supabase
          .from("profiles")
          .select("user_id,display_name")
          .in("user_id", userIds);
        setProfiles(Object.fromEntries((ps ?? []).map((p) => [p.user_id, p.display_name ?? "Reader"])));
      }
    } else {
      setMembers([]);
    }
  };

  useEffect(() => {
    if (user) loadRooms();
  }, [user]);

  // Realtime for messages + members of the open room
  useEffect(() => {
    if (!openRoom) return;
    const loadMsgs = async () => {
      const { data } = await supabase
        .from("buddy_messages")
        .select("*")
        .eq("buddy_read_id", openRoom)
        .order("created_at", { ascending: true });
      setMessages((data as Message[]) ?? []);
    };
    loadMsgs();

    const ch = supabase
      .channel(`buddy-${openRoom}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "buddy_messages", filter: `buddy_read_id=eq.${openRoom}` },
        (payload) => setMessages((m) => [...m, payload.new as Message])
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "buddy_members", filter: `buddy_read_id=eq.${openRoom}` },
        () => loadRooms()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
  }, [openRoom]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages.length]);

  const createRoom = async () => {
    console.log("[BuddyReads] createRoom clicked", { user: user?.id, current });
    if (!user) return toast.error("You need to be signed in.");
    if (!current) return toast.error("Set a current book first (Home → Add a book).");
    // Parse "Ch.1:14, Ch.2:38" → [{label,page}]
    const chapters = chaptersDraft
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => {
        const [labelRaw, pageRaw] = s.split(":").map((p) => p.trim());
        const page = parseInt(pageRaw ?? "", 10);
        return { label: labelRaw || `Ch. ${page}`, page: isFinite(page) ? page : 0 };
      })
      .filter((c) => c.page > 0);
    const payload = {
      owner_id: user.id,
      book_title: current.title,
      book_author: current.author ?? null,
      book_cover: current.cover ?? null,
      total_pages: Number.isFinite(current.pages) && current.pages > 0 ? current.pages : 300,
      spoiler_page: Number.isFinite(current.progress) ? current.progress : 0,
      chapters,
    };
    console.log("[BuddyReads] inserting buddy_read", payload);
    const { data, error } = await supabase
      .from("buddy_reads")
      .insert(payload)
      .select()
      .single();
    if (error) {
      console.error("[BuddyReads] insert error", error);
      return toast.error(`Couldn't create room: ${error.message}`);
    }
    console.log("[BuddyReads] inserted", data);
    setCreateOpen(false);
    setChaptersDraft("");
    toast.success("Buddy read created.");
    await loadRooms();
    console.log("[BuddyReads] rooms reloaded");
  };

  const join = async (roomId: string) => {
    if (!user) return;
    const ms = members.filter((m) => m.buddy_read_id === roomId);
    // Owner + members; cap at 3 total participants for free users.
    if (!isPremium && ms.length + 1 >= FREE_MEMBER_CAP) {
      return toast.error("Free buddy reads are limited to 3 members. Upgrade to Premium for unlimited.");
    }
    const { error } = await supabase
      .from("buddy_members")
      .insert({ buddy_read_id: roomId, user_id: user.id, current_page: 0 });
    if (error) toast.error(error.message);
    else loadRooms();
  };

  const updateMyPage = async (page: number) => {
    if (!user || !openRoom || !myMember) return;
    const { error } = await supabase
      .from("buddy_members")
      .update({ current_page: page })
      .eq("id", myMember.id);
    if (!error) loadRooms();
  };

  const send = async () => {
    if (!user || !openRoom || !draft.trim()) return;
    const page = myMember?.current_page ?? 0;
    const ch = chapterFor(page);
    const text = draft.trim();
    setDraft("");
    const { error } = await supabase.from("buddy_messages").insert({
      buddy_read_id: openRoom,
      user_id: user.id,
      content: text,
      page_at: page,
      chapter: ch,
    });
    if (error) toast.error(error.message);
    else {
      // Fan out a push to co-members (excluding self)
      const room = rooms.find((r) => r.id === openRoom);
      const memberIds = members
        .filter((m) => m.buddy_read_id === openRoom)
        .map((m) => m.user_id);
      const recipients = Array.from(new Set([
        ...memberIds,
        ...(room ? [room.owner_id] : []),
      ])).filter((id) => id !== user.id);
      if (recipients.length) {
        const sender = profiles[user.id] || "A reader";
        supabase.functions
          .invoke("send-push", {
            body: {
              user_ids: recipients,
              title: `${sender} in ${room?.book_title ?? "your buddy read"}`,
              body: text.length > 140 ? text.slice(0, 137) + "…" : text,
              url: "/social",
              tag: `buddy-${openRoom}`,
            },
          })
          .catch(() => {});
      }
    }
  };

  const myPage = myMember?.current_page ?? 0;

  return (
    <section className="rounded-2xl bg-card/70 border border-border/40 p-5 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-display text-2xl flex items-center gap-2">
            <Users className="h-5 w-5" /> Buddy reads
          </h2>
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <EyeOff className="h-3 w-3" /> Messages from past your page are softly hidden.
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="rounded-full gap-1.5">
              <Plus className="h-3.5 w-3.5" /> New room
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display text-xl">Start a buddy read</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 text-sm">
              {current ? (
                <div className="rounded-xl border border-border/50 p-3">
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Book</div>
                  <div className="font-display">{current.title}</div>
                  <div className="text-muted-foreground text-xs">{current.author} · {current.pages} pages</div>
                </div>
              ) : (
                <p className="text-muted-foreground">Set a current book in your library first.</p>
              )}
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-xs">
                  <BookOpen className="h-3 w-3" /> Chapter markers (optional)
                </Label>
                <Input
                  value={chaptersDraft}
                  onChange={(e) => setChaptersDraft(e.target.value)}
                  placeholder="Ch. 1:1, Ch. 2:24, Ch. 3:58"
                />
                <p className="text-[10px] text-muted-foreground">
                  Comma-separated, format <code>Label:startPage</code>. Lets members discuss chapter by chapter.
                </p>
              </div>
              {!isPremium && (
                <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Lock className="h-3 w-3" /> Free rooms cap at {FREE_MEMBER_CAP} members. Upgrade for unlimited.
                </p>
              )}
              <Button className="w-full rounded-full" onClick={createRoom} disabled={!current}>
                Create room
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {rooms.length === 0 && (
        <div className="text-sm text-muted-foreground py-3">
          No buddy reads yet. Create one from the book you're currently reading.
        </div>
      )}

      <div className="space-y-2">
        {rooms.map((r) => {
          const ms = members.filter((m) => m.buddy_read_id === r.id);
          const mine = ms.find((m) => m.user_id === user?.id);
          const isOwner = r.owner_id === user?.id;
          const opened = openRoom === r.id;
          // total participants = owner (if not also a member) + members
          const ownerIsMember = ms.some((m) => m.user_id === r.owner_id);
          const totalParticipants = ms.length + (ownerIsMember ? 0 : 1);
          const roomFull = !isPremium && totalParticipants >= FREE_MEMBER_CAP;
          return (
            <div key={r.id} className="rounded-xl border border-border/50 overflow-hidden">
              <button
                onClick={() => setOpenRoom(opened ? null : r.id)}
                className="w-full flex items-center justify-between p-3 hover:bg-foreground/5 transition text-left"
              >
                <div className="min-w-0">
                  <div className="font-display truncate">{r.book_title}</div>
                  <div className="text-xs text-muted-foreground">
                    {totalParticipants}/{isPremium ? "∞" : FREE_MEMBER_CAP} {totalParticipants === 1 ? "member" : "members"} ·{" "}
                    {r.total_pages} pages
                    {(r.chapters?.length ?? 0) > 0 && <> · {r.chapters!.length} chapters</>}
                  </div>
                </div>
                {!mine && !isOwner && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-full"
                    disabled={roomFull}
                    onClick={(e) => {
                      e.stopPropagation();
                      join(r.id);
                    }}
                  >
                    {roomFull ? <><Lock className="h-3 w-3 mr-1" /> Full</> : "Join"}
                  </Button>
                )}
              </button>

              {opened && (
                <div className="border-t border-border/50 bg-background/40">
                  {/* Chapter selector */}
                  {(r.chapters?.length ?? 0) > 0 && (
                    <div className="px-3 pt-3 flex flex-wrap gap-1.5 items-center">
                      <span className="text-[10px] uppercase tracking-widest text-muted-foreground mr-1">
                        Discuss
                      </span>
                      <button
                        onClick={() => setActiveChapter("all")}
                        className={`rounded-full border px-2.5 py-0.5 text-[11px] transition ${
                          activeChapter === "all"
                            ? "bg-foreground text-background border-foreground"
                            : "bg-background/60 border-border hover:bg-background"
                        }`}
                      >
                        All
                      </button>
                      {(r.chapters ?? []).map((c, i) => (
                        <button
                          key={i}
                          onClick={() => setActiveChapter(i)}
                          className={`rounded-full border px-2.5 py-0.5 text-[11px] transition ${
                            activeChapter === i
                              ? "bg-foreground text-background border-foreground"
                              : "bg-background/60 border-border hover:bg-background"
                          }`}
                        >
                          {c.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Member progress bars */}
                  <div className="p-3 space-y-1.5">
                    {ms.map((m) => (
                      <div key={m.id} className="flex items-center gap-2 text-xs">
                        <span className="w-24 truncate">{profiles[m.user_id] ?? "Reader"}</span>
                        <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full"
                            style={{
                              width: `${Math.min(100, (m.current_page / r.total_pages) * 100)}%`,
                              background: "var(--mood-strong)",
                            }}
                          />
                        </div>
                        <span className="text-muted-foreground tabular-nums w-16 text-right">
                          p.{m.current_page}/{r.total_pages}
                        </span>
                      </div>
                    ))}
                    {ms.length === 0 && (
                      <p className="text-xs text-muted-foreground">No members yet.</p>
                    )}
                  </div>

                  {/* My page control */}
                  {mine && (
                    <div className="px-3 pb-2 flex items-center gap-2">
                      <Label className="text-xs text-muted-foreground">My page</Label>
                      <Input
                        type="number"
                        className="h-7 w-24"
                        value={mine.current_page}
                        min={0}
                        max={r.total_pages}
                        onChange={(e) => {
                          const v = parseInt(e.target.value) || 0;
                          updateMyPage(Math.max(0, Math.min(r.total_pages, v)));
                        }}
                      />
                    </div>
                  )}

                  {/* Chat */}
                  <div ref={scrollRef} className="max-h-64 overflow-y-auto p-3 space-y-2">
                    {(() => {
                      const filtered = activeChapter === "all"
                        ? messages
                        : messages.filter((m) => m.chapter === activeChapter);
                      if (filtered.length === 0) return (
                      <p className="text-xs text-muted-foreground text-center py-4">
                        {activeChapter === "all"
                          ? "Be the first to share a feeling."
                          : "No discussion in this chapter yet."}
                      </p>
                      );
                      return filtered.map((msg) => {
                      const aheadOfMe = msg.page_at > myPage;
                      const mineMsg = msg.user_id === user?.id;
                      return (
                        <div
                          key={msg.id}
                          className={`rounded-xl border px-3 py-2 text-sm ${
                            mineMsg ? "border-foreground/20 bg-foreground/5" : "border-border/50 bg-card/60"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 text-[10px] text-muted-foreground mb-1">
                            <span>
                              {profiles[msg.user_id] ?? "Reader"} · p.{msg.page_at}
                              {msg.chapter != null && roomChapters[msg.chapter] && (
                                <> · {roomChapters[msg.chapter].label}</>
                              )}
                            </span>
                            <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                          </div>
                          {aheadOfMe && !mineMsg ? (
                            <button
                              onClick={() => updateMyPage(msg.page_at)}
                              className="text-xs italic text-muted-foreground hover:text-foreground transition"
                              title="Tap to mark you've reached this page"
                            >
                              <EyeOff className="inline h-3 w-3 mr-1" />
                              Hidden — sent from page {msg.page_at}. Tap when you've caught up.
                            </button>
                          ) : (
                            <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                          )}
                        </div>
                      );
                      });
                    })()}
                  </div>

                  {(mine || isOwner) && (
                    <div className="border-t border-border/50 p-2 flex items-center gap-2">
                      <Input
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            send();
                          }
                        }}
                        placeholder={`Send from p.${myPage}…`}
                        className="h-9"
                      />
                      <Button size="sm" className="rounded-full" onClick={send} disabled={!draft.trim()}>
                        <Send className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}