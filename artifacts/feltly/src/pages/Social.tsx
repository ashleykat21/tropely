import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/lib/auth";
import { useLibrary } from "@/lib/store";
import { MOODS } from "@/lib/moods";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { EyeOff, Eye, UserPlus, UserCheck, Ban, Globe, Users as UsersIcon, Lock, ShieldCheck } from "lucide-react";
import { MoodSignatureCard } from "@/components/social/MoodSignatureCard";
import { BuddyReads } from "@/components/social/BuddyReads";
import { TwinsPanel } from "./Twins";
import { useFamilyStore } from "@/lib/familyStore";
import { Input } from "@/components/ui/input";

type Activity = {
  id: string;
  userId: string;
  kind: string;
  bookTitle: string;
  bookAuthor: string | null;
  mood: string | null;
  emoji: string | null;
  note: string | null;
  createdAt: string;
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
  const [buddyUnlocked, setBuddyUnlocked] = useState(false);
  const [buddyPin, setBuddyPin] = useState("");
  const [buddyPinError, setBuddyPinError] = useState(false);
  const [communityFeed, setCommunityFeed] = useState<Activity[]>([]);
  const [feedLoaded, setFeedLoaded] = useState(false);
  const age = useLibrary((s) => s.age);
  const parentalPin = useLibrary((s) => s.parentalPin);
  const { profiles: familyProfiles, activeProfileId } = useFamilyStore();
  const activeProfile = familyProfiles.find((p) => p.id === activeProfileId);
  const isSoftLocked = activeProfile?.role === "child" && (age ?? 99) <= 10 && !!parentalPin && !buddyUnlocked;
  const [blurTitles, setBlurTitles] = useState(false);

  useEffect(() => {
    if (!loading && !user) nav("/auth");
  }, [user, loading, nav]);

  const load = async () => {
    try {
      const res = await fetch("/api/activity", { credentials: "include" });
      if (!res.ok) { setFeedLoaded(true); return; }
      const data: Activity[] = await res.json();
      setFeed(data);
      setFeedLoaded(true);
      const ids = [...new Set(data.map((a) => a.userId))];
      if (ids.length) {
        const pRes = await fetch(`/api/profiles?ids=${ids.join(",")}`, { credentials: "include" });
        if (pRes.ok) {
          const ps = await pRes.json();
          setProfiles(Object.fromEntries((ps as { userId: string; displayName?: string }[]).map((p) => [p.userId, p.displayName ?? "Reader"])));
        }
      }
      if (data.length === 0) {
        const cRes = await fetch("/api/activity?filter=public", { credentials: "include" });
        if (cRes.ok) setCommunityFeed(await cRes.json());
      }
    } catch { setFeedLoaded(true); }
  };

  const loadFollows = async () => {
    if (!user) return;
    try {
      const res = await fetch("/api/follows", { credentials: "include" });
      if (!res.ok) return;
      const data = await res.json();
      setFollowing(new Set(data.following ?? []));
      setFollowersCount(data.followersCount ?? 0);
      setBlocked(new Set(data.blocked ?? []));
    } catch {}
  };

  useEffect(() => {
    if (user) {
      load();
      loadFollows();
    }
  }, [user?.id]);

  const toggleFollow = async (otherId: string) => {
    if (!user || otherId === user.id) return;
    try {
      const res = await fetch(`/api/follows/${otherId}`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) { toast.error("Failed to update follow."); return; }
      const data = await res.json();
      setFollowing((s) => {
        const n = new Set(s);
        if (data.following) n.add(otherId); else n.delete(otherId);
        return n;
      });
    } catch { toast.error("Network error."); }
  };

  const blockUser = async (otherId: string) => {
    if (!user || otherId === user.id) return;
    try {
      const res = await fetch(`/api/block/${otherId}`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) { toast.error("Failed to block."); return; }
      setBlocked((s) => new Set(s).add(otherId));
      setFeed((f) => f.filter((a) => a.userId !== otherId));
      toast.success("User blocked. You won't see their activity.");
    } catch { toast.error("Network error."); }
  };

  const share = async (kind: string) => {
    if (!user || !current) {
      toast.error("Add a book first.");
      return;
    }
    if (shareVis === "private") {
      toast.message("Visibility is set to Only me — nothing was shared.");
      return;
    }
    try {
      const res = await fetch("/api/activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          kind,
          bookTitle: current.title,
          bookAuthor: current.author,
          bookCover: current.cover,
          mood: current.mood,
          emoji: current.reactions[current.reactions.length - 1] ?? null,
          visibility: shareVis,
        }),
      });
      if (res.ok) {
        toast.success("Shared (spoiler-safe).");
        load();
      } else {
        toast.error("Failed to share.");
      }
    } catch {
      toast.message("You're offline — try again when you're back.");
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
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <p className="text-muted-foreground flex items-center gap-1.5 text-sm">
              <EyeOff className="h-3.5 w-3.5" /> Spoiler-safe by design — no plot, just emotion.
            </p>
            <button
              onClick={() => setBlurTitles((v) => !v)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition ${
                blurTitles
                  ? "bg-foreground text-background border-foreground"
                  : "border-border hover:bg-foreground/5 text-muted-foreground"
              }`}
              title={blurTitles ? "Show book titles" : "Blur book titles"}
            >
              {blurTitles ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
              {blurTitles ? "Show titles" : "Blur titles"}
            </button>
          </div>
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
                        active ? "bg-foreground text-background font-medium" : "text-muted-foreground hover:text-foreground"
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

        {isSoftLocked ? (
          <div className="relative rounded-2xl overflow-hidden">
            <div className="blur-sm pointer-events-none select-none" aria-hidden="true">
              <BuddyReads />
            </div>
            <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm">
              <div className="rounded-2xl bg-card border border-border/60 p-6 text-center space-y-4 max-w-xs w-full mx-4 shadow-soft">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-foreground text-background mx-auto">
                  <Lock className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-display text-lg">Buddy Reads</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Enter the parental PIN to access buddy reads and messaging.
                  </p>
                </div>
                <Input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={buddyPin}
                  onChange={(e) => { setBuddyPin(e.target.value.replace(/\D/g, "").slice(0, 4)); setBuddyPinError(false); }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && buddyPin.length === 4) {
                      if (buddyPin === parentalPin) { setBuddyUnlocked(true); }
                      else { setBuddyPinError(true); setBuddyPin(""); }
                    }
                  }}
                  placeholder="••••"
                  className={`text-center tracking-[0.5em] font-display h-11 ${buddyPinError ? "border-red-400 focus-visible:ring-red-300" : ""}`}
                  autoFocus
                />
                {buddyPinError && <p className="text-xs text-red-500">Incorrect PIN.</p>}
                <Button
                  className="w-full rounded-full"
                  disabled={buddyPin.length < 4}
                  onClick={() => {
                    if (buddyPin === parentalPin) setBuddyUnlocked(true);
                    else { setBuddyPinError(true); setBuddyPin(""); }
                  }}
                >
                  <ShieldCheck className="h-4 w-4 mr-2" /> Unlock
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <BuddyReads />
        )}

        <section className="pt-2">
          <TwinsPanel />
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilter("all")}
              className={`rounded-full border px-3 py-1 text-xs transition ${
                filter === "all" ? "bg-foreground text-background border-foreground font-medium" : "border-border hover:bg-foreground/5"
              }`}
            >
              Everyone
            </button>
            <button
              onClick={() => setFilter("following")}
              className={`rounded-full border px-3 py-1 text-xs transition ${
                filter === "following" ? "bg-foreground text-background border-foreground font-medium" : "border-border hover:bg-foreground/5"
              }`}
            >
              Following
            </button>
          </div>
          {(() => {
            const filteredByBlock = feed.filter((a) => !blocked.has(a.userId));
            const visible =
              filter === "following"
                ? filteredByBlock.filter((a) => following.has(a.userId) || a.userId === user?.id)
                : filteredByBlock;
            if (visible.length === 0) {
              if (filter === "all" && feedLoaded && communityFeed.length > 0) {
                return (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground px-1">
                      <Globe className="h-3 w-3" /> Reading around the world
                    </div>
                    {communityFeed.slice(0, 8).map((a) => {
                      const m = a.mood && (MOODS as any)[a.mood];
                      return (
                        <article key={a.id} className="rounded-2xl mood-surface border border-border/30 p-4">
                          <div className="flex items-center justify-between mb-1.5 gap-2">
                            <div className="text-sm font-medium text-muted-foreground">A reader</div>
                            <div className="text-[10px] text-muted-foreground">
                              {new Date(a.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                            </div>
                          </div>
                          <p className="text-foreground text-sm">
                            {a.emoji && <span className="mr-1.5">{a.emoji}</span>}
                            {a.kind === "started" ? <>started <span className={`font-display transition-all ${blurTitles ? "blur-sm select-none" : ""}`}>{a.bookTitle}</span></> :
                             a.kind === "finished" ? <>finished <span className={`font-display transition-all ${blurTitles ? "blur-sm select-none" : ""}`}>{a.bookTitle}</span></> :
                             <>felt <span className="italic">{a.kind}</span> about <span className={`font-display transition-all ${blurTitles ? "blur-sm select-none" : ""}`}>{a.bookTitle}</span></>}
                            {a.bookAuthor && <span className={`text-muted-foreground transition-all ${blurTitles ? "blur-sm select-none" : ""}`}> · {a.bookAuthor}</span>}
                          </p>
                          {m && (
                            <div className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-foreground rounded-full px-2 py-0.5 border border-border/40" style={{ background: `hsl(${m.h} ${m.s}% ${m.l}% / 0.12)` }}>
                              {m.emoji} {m.label}
                            </div>
                          )}
                        </article>
                      );
                    })}
                    <p className="text-xs text-center text-muted-foreground pt-2">
                      Share your own reading to join the feed.
                    </p>
                  </div>
                );
              }
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
              const isMe = a.userId === user?.id;
              const isFollowing = following.has(a.userId);
              return (
                <article key={a.id} className="rounded-2xl mood-surface border border-border/50 p-5">
                  <div className="flex items-center justify-between mb-2 gap-2">
                    <div className="text-sm font-medium">{profiles[a.userId] ?? "Reader"}</div>
                    <div className="flex items-center gap-2 flex-wrap justify-end">
                      {!isMe && (
                        <>
                          <Button
                            size="sm"
                            variant={isFollowing ? "secondary" : "outline"}
                            className="h-7 rounded-full gap-1 text-xs"
                            onClick={() => toggleFollow(a.userId)}
                          >
                            {isFollowing ? (
                              <><UserCheck className="h-3 w-3" /><span className="hidden sm:inline">Following</span></>
                            ) : (
                              <><UserPlus className="h-3 w-3" /><span className="hidden sm:inline">Follow</span></>
                            )}
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 rounded-full text-muted-foreground hover:text-destructive"
                            onClick={() => {
                              if (confirm("Block this reader? Their activity will disappear from your feed.")) {
                                blockUser(a.userId);
                              }
                            }}
                            title="Block"
                          >
                            <Ban className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                      <div className="text-[10px] text-muted-foreground whitespace-nowrap">
                        {new Date(a.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      </div>
                    </div>
                  </div>
                  <p className="text-foreground">
                    {a.emoji && <span className="mr-1.5">{a.emoji}</span>}
                    {a.kind === "started" ? (
                      <>started <span className={`font-display transition-all ${blurTitles ? "blur-sm select-none" : ""}`}>{a.bookTitle}</span></>
                    ) : a.kind === "finished" ? (
                      <>finished <span className={`font-display transition-all ${blurTitles ? "blur-sm select-none" : ""}`}>{a.bookTitle}</span></>
                    ) : (
                      <>felt <span className="italic">{a.kind}</span> about{" "}
                        <span className={`font-display transition-all ${blurTitles ? "blur-sm select-none" : ""}`}>{a.bookTitle}</span></>
                    )}
                    {a.bookAuthor && <span className={`text-muted-foreground transition-all ${blurTitles ? "blur-sm select-none" : ""}`}> · {a.bookAuthor}</span>}
                  </p>
                  {m && (
                    <div
                      className="mt-2 inline-flex items-center gap-1.5 text-xs text-foreground rounded-full px-2.5 py-1 border border-border/60"
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
