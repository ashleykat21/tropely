import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useLibrary } from "@/lib/store";
import { MOODS } from "@/lib/moods";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { EyeOff, UserPlus, UserCheck, Ban, Globe, Users as UsersIcon, Lock } from "lucide-react";
import { MoodSignatureCard } from "@/components/social/MoodSignatureCard";
import { BuddyReads } from "@/components/social/BuddyReads";
import { enqueue } from "@/lib/offlineQueue";
import { TwinsPanel } from "./Twins";
type Activity = {
  id: string;
  user_id: string;
  kind: string;
  book_title: string;
  book_author: string | null;
  mood: string | null;
  emoji: string | null;
  note: string | null;
  created_at: string;
  visibility?: string;
};

export default function Social() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const { books, currentId } = useLibrary();
  const defaultShareVisibility = useLibrary((s) => s.defaultShareVisibility);
  const current = books.find((b) => b.id === currentId);
  const [feed, setFeed] = useState<Activity[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [following, setFollowing] = useState<Set<string>>(new Set());
  const [followersCount, setFollowersCount] = useState(0);
  const [blocked, setBlocked] = useState<Set<string>>(new Set());
  const [shareVis, setShareVis] = useState<"public" | "followers" | "private">(defaultShareVisibility);
  const [filter, setFilter] = useState<"all" | "following">("all");

  useEffect(() => {
    if (!loading && !user) nav("/auth");
  }, [user, loading, nav]);

  const load = async () => {
    const { data } = await supabase
      .from("activity")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    setFeed((data as Activity[]) ?? []);
    const ids = [...new Set((data ?? []).map((a) => a.user_id))];
    if (ids.length) {
      const { data: ps } = await supabase.from("profiles").select("user_id,display_name").in("user_id", ids);
      setProfiles(Object.fromEntries((ps ?? []).map((p) => [p.user_id, p.display_name ?? "Reader"])));
    }
  };

  const loadFollows = async () => {
    if (!user) return;
    const [{ data: outgoing }, { count }, { data: blocks }] = await Promise.all([
      supabase.from("follows").select("following_id").eq("follower_id", user.id),
      supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", user.id),
      supabase.from("blocked_users" as any).select("blocked_id").eq("blocker_id", user.id),
    ]);
    setFollowing(new Set((outgoing ?? []).map((r: any) => r.following_id)));
    setFollowersCount(count ?? 0);
    setBlocked(new Set((blocks ?? []).map((r: any) => r.blocked_id)));
  };

  useEffect(() => {
    if (user) {
      load();
      loadFollows();
    }
  }, [user]);

  const toggleFollow = async (otherId: string) => {
    if (!user || otherId === user.id) return;
    if (following.has(otherId)) {
      const { error } = await supabase
        .from("follows")
        .delete()
        .eq("follower_id", user.id)
        .eq("following_id", otherId);
      if (error) return toast.error(error.message);
      setFollowing((s) => {
        const n = new Set(s);
        n.delete(otherId);
        return n;
      });
    } else {
      const { error } = await supabase
        .from("follows")
        .insert({ follower_id: user.id, following_id: otherId });
      if (error) return toast.error(error.message);
      setFollowing((s) => new Set(s).add(otherId));
    }
  };

  const blockUser = async (otherId: string) => {
    if (!user || otherId === user.id) return;
    const { error } = await supabase
      .from("blocked_users" as any)
      .insert({ blocker_id: user.id, blocked_id: otherId });
    if (error) return toast.error(error.message);
    setBlocked((s) => new Set(s).add(otherId));
    setFeed((f) => f.filter((a) => a.user_id !== otherId));
    toast.success("User blocked. You won't see their activity.");
  };

  const share = async (kind: string) => {
    if (!user || !current) return toast.error("Add a book first.");
    if (shareVis === "private") {
      return toast.message("Visibility is set to Only me — nothing was shared.");
    }
    const row = {
      user_id: user.id,
      kind,
      book_title: current.title,
      book_author: current.author,
      book_cover: current.cover,
      mood: current.mood,
      emoji: current.reactions[current.reactions.length - 1] ?? null,
      visibility: shareVis,
    };
    const online = typeof navigator === "undefined" || navigator.onLine !== false;
    if (online) {
      const { error } = await supabase.from("activity").insert(row);
      if (error) {
        await enqueue({ kind: "insert", table: "activity", row });
        toast.message("You're offline — we'll share this when you're back.");
      } else {
        toast.success("Shared (spoiler-safe).");
        load();
      }
    } else {
      await enqueue({ kind: "insert", table: "activity", row });
      toast.message("You're offline — we'll share this when you're back.");
    }
  };

  return (
    <AppShell>
      <div className="space-y-8 max-w-3xl">
        <header className="space-y-2 animate-fade-up">
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Social</p>
          <h1 className="font-display text-4xl sm:text-5xl leading-[1.05]">
            A quiet feed of{" "}
            <span className="italic" style={{ color: "var(--mood-strong)" }}>
              shared feelings
            </span>
            .
          </h1>
          <p className="text-muted-foreground flex items-center gap-1.5 text-sm">
            <EyeOff className="h-3.5 w-3.5" /> Spoiler-safe by design — no plot, just emotion.
          </p>
          <p className="text-xs text-muted-foreground">
            Following <span className="text-foreground font-medium">{following.size}</span>
            {" · "}
            <span className="text-foreground font-medium">{followersCount}</span>{" "}
            {followersCount === 1 ? "follower" : "followers"}
          </p>
          <div className="pt-2">
            <MoodSignatureCard />
          </div>
        </header>

        {current && (
          <section className="rounded-2xl mood-surface p-5 border border-border/40 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Now reading</div>
              <div className="font-display text-xl">{current.title}</div>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <div className="flex gap-1 rounded-full border border-border/60 bg-background/50 p-0.5 text-xs">
                {([
                  { k: "public", icon: Globe, label: "All" },
                  { k: "followers", icon: UsersIcon, label: "Followers" },
                  { k: "private", icon: Lock, label: "Only me" },
                ] as const).map((opt) => {
                  const Icon = opt.icon;
                  const active = shareVis === opt.k;
                  return (
                    <button
                      key={opt.k}
                      onClick={() => setShareVis(opt.k)}
                      className={`rounded-full px-2 py-1 inline-flex items-center gap-1 transition ${
                        active ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
                      }`}
                      title={opt.label}
                    >
                      <Icon className="h-3 w-3" />
                      <span className="hidden sm:inline">{opt.label}</span>
                    </button>
                  );
                })}
              </div>
              <Button variant="outline" className="rounded-full" onClick={() => share("started")}>
                Share start
              </Button>
              <Button className="rounded-full" onClick={() => share("reacted")}>
                Share a feeling
              </Button>
            </div>
          </section>
        )}

        <BuddyReads />

        <section className="pt-2">
          <TwinsPanel />
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilter("all")}
              className={`rounded-full border px-3 py-1 text-xs transition ${
                filter === "all" ? "bg-foreground text-background border-foreground" : "border-border hover:bg-foreground/5"
              }`}
            >
              Everyone
            </button>
            <button
              onClick={() => setFilter("following")}
              className={`rounded-full border px-3 py-1 text-xs transition ${
                filter === "following" ? "bg-foreground text-background border-foreground" : "border-border hover:bg-foreground/5"
              }`}
            >
              Following
            </button>
          </div>
          {(() => {
            const filteredByBlock = feed.filter((a) => !blocked.has(a.user_id));
            const visible =
              filter === "following"
                ? filteredByBlock.filter((a) => following.has(a.user_id) || a.user_id === user?.id)
                : filteredByBlock;
            if (visible.length === 0) {
              return (
                <div className="rounded-2xl border border-dashed border-border/60 p-10 text-center text-muted-foreground">
                  {filter === "following"
                    ? "Follow a few readers to fill this quiet room."
                    : "No activity yet. Share something to start the wave."}
                </div>
              );
            }
            return visible.map((a) => {
              const m = a.mood && (MOODS as any)[a.mood];
              const isMe = a.user_id === user?.id;
              const isFollowing = following.has(a.user_id);
              return (
                <article key={a.id} className="rounded-2xl bg-card/80 backdrop-blur border border-border/50 p-5">
                  <div className="flex items-center justify-between mb-2 gap-2">
                    <div className="text-sm font-medium">{profiles[a.user_id] ?? "Reader"}</div>
                    <div className="flex items-center gap-2">
                      {!isMe && (
                        <>
                          <Button
                            size="sm"
                            variant={isFollowing ? "secondary" : "outline"}
                            className="h-7 rounded-full gap-1 text-xs"
                            onClick={() => toggleFollow(a.user_id)}
                          >
                            {isFollowing ? (
                              <>
                                <UserCheck className="h-3 w-3" /> Following
                              </>
                            ) : (
                              <>
                                <UserPlus className="h-3 w-3" /> Follow
                              </>
                            )}
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 rounded-full text-muted-foreground hover:text-destructive"
                            onClick={() => {
                              if (confirm("Block this reader? Their activity will disappear from your feed.")) {
                                blockUser(a.user_id);
                              }
                            }}
                            title="Block"
                          >
                            <Ban className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                      <div className="text-[11px] text-muted-foreground">
                        {new Date(a.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <p className="text-foreground/90">
                    {a.emoji && <span className="mr-1.5">{a.emoji}</span>}
                    {a.kind === "started" ? (
                      <>
                        started <span className="font-display">{a.book_title}</span>
                      </>
                    ) : a.kind === "finished" ? (
                      <>
                        finished <span className="font-display">{a.book_title}</span>
                      </>
                    ) : (
                      <>
                        felt <span className="italic">{a.kind}</span> about{" "}
                        <span className="font-display">{a.book_title}</span>
                      </>
                    )}
                    {a.book_author && <span className="text-muted-foreground"> · {a.book_author}</span>}
                  </p>
                  {m && (
                    <div
                      className="mt-2 inline-flex items-center gap-1.5 text-xs rounded-full px-2.5 py-1 border border-border/60"
                      style={{ background: `hsl(${m.h} ${m.s}% ${m.l}% / 0.15)` }}
                    >
                      {m.emoji} {m.label}
                    </div>
                  )}
                </article>
              );
            });
          })()}
        </section>

      </div>
    </AppShell>
  );
}
