import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { useLibrary } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Users, Plus, Send, EyeOff, BookOpen, Lock, Trash2 } from "lucide-react";
import { usePremium } from "@/lib/usePremium";
import { BuddyMoodComparison } from "./BuddyMoodComparison";
import { type MoodKey } from "@/lib/moods";

const FREE_MEMBER_CAP = 3;
const FREE_ROOM_CAP = 1;

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
  const { books, currentId, sessions } = useLibrary();
  const age = useLibrary((s) => s.age);
  const isSafeMode = age !== null && age < 13;
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
    try {
      const res = await fetch("/api/buddy-reads", { credentials: "include" });
      if (!res.ok) return;
      const data = await res.json();
      setRooms((data.rooms ?? []) as Room[]);
      setMembers((data.members ?? []) as Member[]);
      setProfiles(data.profiles ?? {});
    } catch { /* silent */ }
  };

  useEffect(() => {
    if (user) loadRooms();
  }, [user]);

  // Load messages when room opens; poll for updates
  useEffect(() => {
    if (!openRoom) return;
    const loadMsgs = async () => {
      try {
        const res = await fetch(`/api/buddy-reads/${openRoom}/messages`, { credentials: "include" });
        if (res.ok) setMessages(await res.json());
      } catch { /* silent */ }
    };
    loadMsgs();
    const iv = setInterval(loadMsgs, 5000);
    return () => clearInterval(iv);
  }, [openRoom]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages.length]);

  const createRoom = async () => {
    if (!user) { toast.error("You need to be signed in."); return; }
    if (!current) { toast.error("Set a current book first (Home → Add a book)."); return; }
    if (!isPremium) {
      const myRooms = rooms.filter((r) => r.owner_id === user.id);
      if (myRooms.length >= FREE_ROOM_CAP) {
        toast.error("Free accounts can create 1 buddy read. Upgrade to Premium for unlimited."); return;
      }
    }
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
    const res = await fetch("/api/buddy-reads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast.error(`Couldn't create room: ${(err as { error?: string }).error ?? res.status}`);
      return;
    }
    setCreateOpen(false);
    setChaptersDraft("");
    toast.success("Buddy read created.");
    await loadRooms();
  };

  const join = async (roomId: string) => {
    if (!user) return;
    const ms = members.filter((m) => m.buddy_read_id === roomId);
    // Owner + members; cap at 3 total participants for free users.
    if (!isPremium && ms.length + 1 >= FREE_MEMBER_CAP) {
      toast.error("Free buddy reads are limited to 2 members. Upgrade to Premium for unlimited."); return;
    }
    const res = await fetch(`/api/buddy-reads/${roomId}/join`, {
      method: "POST",
      credentials: "include",
    });
    if (!res.ok) { const e = await res.json().catch(() => ({})); toast.error(e.error ?? "Failed to join."); }
    else loadRooms();
  };

  const updateMyPage = async (page: number) => {
    if (!user || !openRoom || !myMember) return;
    const res = await fetch(`/api/buddy-reads/${openRoom}/members/${myMember.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ currentPage: page }),
    });
    if (res.ok) loadRooms();
  };

  const send = async () => {
    if (!user || !openRoom || !draft.trim()) return;
    const page = myMember?.current_page ?? 0;
    const ch = chapterFor(page);
    const text = draft.trim();
    setDraft("");
    const res = await fetch(`/api/buddy-reads/${openRoom}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ content: text, pageAt: page, chapter: ch }),
    });
    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      toast.error(e.error ?? "Failed to send.");
    } else {
      const newMsg = await res.json();
      setMessages((m) => [...m, newMsg]);
    }
  };

  const deleteRoom = async (roomId: string) => {
    if (!user) return;
    const res = await fetch(`/api/buddy-reads/${roomId}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (res.ok) {
      if (openRoom === roomId) setOpenRoom(null);
      toast.success("Buddy read deleted.");
      await loadRooms();
    } else {
      const e = await res.json().catch(() => ({}));
      toast.error((e as { error?: string }).error ?? "Failed to delete.");
    }
  };

  const myPage = myMember?.current_page ?? 0;

  return (
    <section className="rounded-2xl mood-surface border border-border/40 p-5 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="space-y-1">
          <div className="group-heading">Together</div>
          <h2 className="font-display text-2xl flex items-center gap-2">
            <Users className="h-5 w-5" /> Buddy reads
          </h2>
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <EyeOff className="h-3 w-3" /> Messages from past your page are softly hidden.
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-full gap-2 h-11 px-5">
              <Plus className="h-4 w-4" /> New room
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
        <div className="rounded-2xl border border-dashed border-border/60 p-8 text-center space-y-3">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-foreground/5">
            <Users className="h-5 w-5" style={{ color: "var(--mood-strong)" }} />
          </div>
          <div className="font-display text-xl">Read a book together.</div>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            {current
              ? `Invite a friend to read "${current.title}" alongside you — or join one when a friend shares an invite. Spoiler-safe by chapter, in a private room for reactions.`
              : "Pick a current book first, then invite a friend or join a buddy read — chapter-locked and spoiler-safe."}
          </p>
          <div className="pt-1">
            {current ? (
              <Button
                size="sm"
                className="rounded-full gap-1.5"
                onClick={() => setCreateOpen(true)}
              >
                <Plus className="h-3.5 w-3.5" /> Start a buddy read
              </Button>
            ) : (
              <Button
                asChild
                size="sm"
                variant="outline"
                className="rounded-full gap-1.5"
              >
                <Link to="/discover">
                  <BookOpen className="h-3.5 w-3.5" /> Pick a current book
                </Link>
              </Button>
            )}
          </div>
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
              <div className="flex items-center gap-2 p-3 hover:bg-foreground/5 transition">
                <button
                  onClick={() => setOpenRoom(opened ? null : r.id)}
                  className="flex-1 min-w-0 text-left min-h-[44px] py-1"
                  aria-expanded={opened}
                >
                  <div className="font-display text-base truncate leading-tight">{r.book_title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {totalParticipants}/{isPremium ? "∞" : FREE_MEMBER_CAP} {totalParticipants === 1 ? "member" : "members"}
                    <span className="mx-1.5 text-border" aria-hidden="true">·</span>
                    {r.total_pages} pages
                    {(r.chapters?.length ?? 0) > 0 && <><span className="mx-1.5 text-border" aria-hidden="true">·</span>{r.chapters!.length} chapters</>}
                  </div>
                </button>
                <div className="flex items-center gap-1.5 shrink-0">
                  {!mine && !isOwner && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full h-10 px-4"
                      disabled={roomFull}
                      onClick={(e) => {
                        e.stopPropagation();
                        join(r.id);
                      }}
                    >
                      {roomFull ? <><Lock className="h-3.5 w-3.5 mr-1" /> Full</> : "Join"}
                    </Button>
                  )}
                  {isOwner && (
                    <button
                      title="Delete this buddy read"
                      aria-label={`Delete buddy read for ${r.book_title}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm(`Delete the buddy read for "${r.book_title}"? This cannot be undone.`)) {
                          deleteRoom(r.id);
                        }
                      }}
                      className="inline-grid h-11 w-11 place-items-center rounded-full text-muted-foreground hover:text-red-500 hover:bg-red-50 transition"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

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
                            ? "bg-foreground text-background border-foreground font-medium"
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
                              ? "bg-foreground text-background border-foreground font-medium"
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

                  {/* Mood comparison (premium) */}
                  <div className="px-3 pb-2">
                    <BuddyMoodComparison
                      totalPages={r.total_pages}
                      members={ms.map((m) => {
                        const bookSessions = sessions.filter(
                          (s) => s.bookId === books.find((b) => b.title === r.book_title)?.id && s.at > 0
                        );
                        const userSessions = bookSessions
                          .filter((s) => {
                            void s;
                            return m.user_id === user?.id;
                          })
                          .sort((a, b) => a.at - b.at)
                          .map((s) => ({ page: s.toPage, mood: s.mood as MoodKey }));
                        return {
                          userId: m.user_id,
                          name: profiles[m.user_id] ?? "Reader",
                          currentPage: m.current_page,
                          moods: userSessions,
                        };
                      })}
                    />
                  </div>

                  {/* My page control */}
                  {mine && (
                    <div className="px-3 pb-2 flex items-center gap-2">
                      <Label className="text-xs text-muted-foreground">My page</Label>
                      <Input
                        type="number"
                        className="h-10 w-24"
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
                    isSafeMode ? (
                      <div className="border-t border-border/50 p-3 flex items-center gap-2 text-xs text-muted-foreground">
                        <Lock className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                        <span>Safe mode — messaging is restricted for readers under 13. A parent can update this in Profile.</span>
                      </div>
                    ) : (
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
                          className="h-11"
                          aria-label="Buddy read message"
                        />
                        <Button className="rounded-full h-11 w-11 p-0 shrink-0" onClick={send} disabled={!draft.trim()} aria-label="Send message">
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    )
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