import { useParams, useNavigate } from "react-router-dom";
import { useLibrary } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { MOODS, type MoodKey } from "@/lib/moods";
import { useMemo } from "react";
import { ArrowLeft, BookOpen, Headphones, Star, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function PublicProfile() {
  const { username } = useParams<{ username: string }>();
  const { user } = useAuth();
  const nav = useNavigate();
  const { books, sessions, reactionLog } = useLibrary();

  const isOwnProfile = !username || username === user?.id || username === "me";

  const stats = useMemo(() => {
    const finished = books.filter((b) => b.shelf === "finished");
    const reading = books.filter((b) => b.shelf === "reading");
    const totalPages = sessions.reduce((a, s) => a + s.pagesRead, 0) || books.reduce((a, b) => a + b.progress, 0);

    const moodCounts: Record<string, number> = {};
    books.forEach((b) => { moodCounts[b.mood] = (moodCounts[b.mood] ?? 0) + 1; });
    const topMoods = (Object.entries(moodCounts) as [MoodKey, number][])
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    const tropeCounts: Record<string, number> = {};
    books.forEach((b) => (b.tropes ?? []).forEach((t) => { tropeCounts[t] = (tropeCounts[t] ?? 0) + 1; }));
    const topTropes = Object.entries(tropeCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

    const readCount = finished.filter((b) => b.consumption === "read").length;
    const listenedCount = finished.filter((b) => b.consumption === "listened").length;

    return { finished, reading, totalPages, topMoods, topTropes, readCount, listenedCount };
  }, [books, sessions]);

  const shareProfile = async () => {
    const url = `${window.location.origin}/u/${user?.id ?? "me"}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Profile link copied!");
    } catch {
      toast.error("Couldn't copy link.");
    }
  };

  const displayName = isOwnProfile
    ? (user?.displayName ?? user?.email?.split("@")[0] ?? "Reader")
    : username ?? "Reader";

  if (!isOwnProfile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 space-y-4 text-center">
        <div className="font-display text-3xl">Reading profile</div>
        <p className="text-muted-foreground text-sm max-w-xs">
          Public reader profiles are coming soon. For now, only your own profile is viewable.
        </p>
        <Button variant="outline" className="rounded-full" onClick={() => nav(-1)}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Go back
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen mood-surface">
      <div className="max-w-2xl mx-auto px-6 py-10 space-y-8">
        <button
          onClick={() => nav(-1)}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </button>

        <header className="space-y-3">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Reading profile</p>
              <h1 className="font-display text-4xl sm:text-5xl leading-tight mt-1">
                {displayName}
              </h1>
            </div>
            <Button variant="outline" className="rounded-full gap-1.5" onClick={shareProfile}>
              <Share2 className="h-3.5 w-3.5" /> Share
            </Button>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground pt-1">
            <span><span className="font-display text-2xl text-foreground">{stats.finished.length}</span> finished</span>
            <span><span className="font-display text-2xl text-foreground">{stats.reading.length}</span> reading now</span>
            <span><span className="font-display text-2xl text-foreground">{stats.totalPages.toLocaleString()}</span> pages</span>
          </div>
        </header>

        {stats.topMoods.length > 0 && (
          <section className="rounded-2xl border border-border/40 bg-card/60 p-5 space-y-3">
            <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Mood palette</p>
            <div className="flex flex-wrap gap-2">
              {stats.topMoods.map(([k, v]) => {
                const m = MOODS[k];
                return (
                  <div
                    key={k}
                    className="flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm"
                    style={{ borderColor: `hsl(${m.h} ${m.s}% ${m.l}% / 0.4)`, background: `hsl(${m.h} ${m.s}% ${m.l}% / 0.08)` }}
                  >
                    <span>{m.emoji}</span>
                    <span className="font-medium">{m.label}</span>
                    <span className="text-muted-foreground text-xs">{v}</span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {(stats.readCount > 0 || stats.listenedCount > 0) && (
          <section className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-border/40 bg-card/60 p-4 flex items-center gap-3">
              <BookOpen className="h-5 w-5 text-muted-foreground shrink-0" />
              <div>
                <div className="font-display text-2xl">{stats.readCount}</div>
                <div className="text-xs text-muted-foreground">books read</div>
              </div>
            </div>
            <div className="rounded-2xl border border-border/40 bg-card/60 p-4 flex items-center gap-3">
              <Headphones className="h-5 w-5 text-muted-foreground shrink-0" />
              <div>
                <div className="font-display text-2xl">{stats.listenedCount}</div>
                <div className="text-xs text-muted-foreground">audiobooks</div>
              </div>
            </div>
          </section>
        )}

        {stats.topTropes.length > 0 && (
          <section className="rounded-2xl border border-border/40 bg-card/60 p-5 space-y-3">
            <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Top tropes</p>
            <div className="space-y-1.5">
              {stats.topTropes.map(([trope, count]) => (
                <div key={trope} className="flex items-center gap-3">
                  <div className="flex-1 text-sm truncate">{trope}</div>
                  <div className="text-xs text-muted-foreground shrink-0">{count}×</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {stats.finished.length > 0 && (
          <section className="space-y-3">
            <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Finished recently</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[...stats.finished].reverse().slice(0, 6).map((b) => {
                const m = MOODS[b.mood];
                return (
                  <div
                    key={b.id}
                    className="rounded-xl border border-border/40 bg-card/60 p-3 space-y-1.5"
                  >
                    <div className="text-sm font-display leading-snug line-clamp-2">{b.title}</div>
                    <div className="text-xs text-muted-foreground truncate">{b.author}</div>
                    {m && (
                      <div className="flex items-center gap-1 text-[11px]">
                        <span>{m.emoji}</span>
                        <span className="text-muted-foreground">{m.label}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <div className="text-center pt-4">
          <p className="text-xs text-muted-foreground">
            This profile is spoiler-safe — no titles are shared from your social activity.
          </p>
        </div>
      </div>
    </div>
  );
}
