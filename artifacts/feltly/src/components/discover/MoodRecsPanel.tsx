import { useEffect, useRef, useState } from "react";
import { useLibrary } from "@/lib/store";
import { usePremium } from "@/lib/usePremium";
import { MOODS, type MoodKey } from "@/lib/moods";
import { Button } from "@/components/ui/button";
import { Loader2, Lock, RefreshCw, Sparkles, Plus } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

type Rec = {
  title: string;
  author: string;
  mood: MoodKey;
  why: string;
  coverId?: number;
};

const MOOD_KEYS = Object.keys(MOODS) as MoodKey[];
const isMoodKey = (s: unknown): s is MoodKey =>
  typeof s === "string" && MOOD_KEYS.includes(s as MoodKey);

async function fetchCoverId(title: string, author: string): Promise<number | undefined> {
  try {
    const q = encodeURIComponent(`${title} ${author}`);
    const res = await fetch(
      `https://openlibrary.org/search.json?q=${q}&limit=3&fields=cover_i,title`
    );
    if (!res.ok) return undefined;
    const data = await res.json();
    return (data.docs as { cover_i?: number }[]).find((d) => d.cover_i)?.cover_i;
  } catch {
    return undefined;
  }
}

export function MoodRecsPanel({
  onAdd,
}: {
  onAdd: (title: string, author: string, mood: MoodKey) => void;
}) {
  const isPremium = usePremium((s) => s.isPremium);
  const { books, sessions, moodPreferences } = useLibrary();
  const [recs, setRecs] = useState<Rec[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const hasFetched = useRef(false);

  const finishedBooks = books
    .filter((b) => b.shelf === "finished")
    .map((b) => ({
      title: b.title,
      author: b.author,
      mood: b.mood,
      tags: b.tags,
    }));

  const readingBooks = books
    .filter((b) => b.shelf === "reading" || b.shelf === "paused")
    .map((b) => ({ title: b.title, author: b.author, mood: b.mood }));

  const currentBook = books.find(
    (b) => b.shelf === "reading" || b.shelf === "paused"
  );

  const currentBookData = currentBook
    ? {
        title: currentBook.title,
        author: currentBook.author,
        mood: currentBook.mood,
        progress: currentBook.progress,
        pages: currentBook.pages,
      }
    : undefined;

  const recentSessions = sessions.slice(0, 10).map((s) => ({ mood: s.mood }));
  void recentSessions;

  const load = async () => {
    if (finishedBooks.length === 0 && !currentBookData) {
      toast.error("Add some books first so I know your taste.");
      return;
    }
    setLoading(true);
    setFetched(false);
    try {
      const res = await fetch("/api/mood-recs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          finishedBooks,
          readingBooks,
          currentBook: currentBookData,
          moodPreferences,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error((j as { error?: string }).error ?? `HTTP ${res.status}`);
      }
      const data = await res.json();
      const raw = (data.recommendations ?? []) as {
        title?: string;
        author?: string;
        mood?: string;
        why?: string;
      }[];

      const cleaned: Rec[] = raw
        .filter((r) => r.title && r.author)
        .map((r) => ({
          title: r.title!,
          author: r.author!,
          mood: isMoodKey(r.mood) ? r.mood : "mysterious",
          why: r.why ?? "",
        }));

      // Fetch covers in the background
      setRecs(cleaned);
      setFetched(true);

      // Enrich with cover IDs non-blocking
      Promise.all(
        cleaned.map((r, i) =>
          fetchCoverId(r.title, r.author).then((coverId) => ({ i, coverId }))
        )
      ).then((results) => {
        setRecs((prev) =>
          prev.map((r, i) => {
            const match = results.find((x) => x.i === i);
            return match?.coverId ? { ...r, coverId: match.coverId } : r;
          })
        );
      });
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Couldn\u2019t load recommendations.");
    } finally {
      setLoading(false);
    }
  };

  // Auto-load once when the user is premium and has books
  useEffect(() => {
    if (!isPremium || hasFetched.current) return;
    if (finishedBooks.length === 0 && !currentBookData) return;
    hasFetched.current = true;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPremium]);

  if (!isPremium) {
    return (
      <div className="rounded-2xl border border-border/50 bg-card/50 p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4" style={{ color: "var(--mood-strong)" }} />
          <p className="text-sm font-medium">For your reading soul</p>
          <span className="ml-auto flex items-center gap-1 rounded-full border border-border/60 bg-background/70 px-2.5 py-0.5 text-[10px] font-medium">
            <Lock className="h-2.5 w-2.5" /> Premium
          </span>
        </div>
        <p className="text-xs text-muted-foreground max-w-md">
          AI-curated picks based on the emotions your reading history reveals about you.
        </p>
        <Link
          to="/profile"
          className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/80 px-3 py-1.5 text-xs hover:bg-background transition"
        >
          <Sparkles className="h-3 w-3" style={{ color: "var(--mood-strong)" }} />
          Unlock Premium
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4" style={{ color: "var(--mood-strong)" }} />
          <p className="text-sm font-medium">For your reading soul</p>
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 text-xs gap-1.5 rounded-full"
          onClick={load}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <RefreshCw className="h-3 w-3" />
          )}
          {fetched ? "Refresh" : "Generate"}
        </Button>
      </div>

      {loading && recs.length === 0 && (
        <div className="rounded-2xl border border-border/40 bg-card/40 p-8 flex items-center justify-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Reading your emotional history&hellip;
        </div>
      )}

      {!loading && !fetched && recs.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border/50 bg-card/30 p-6 text-center space-y-3">
          <p className="text-sm text-muted-foreground">
            Based on your mood history, I&apos;ll find books that match your emotional wavelength.
          </p>
          <Button
            size="sm"
            className="rounded-full gap-1.5"
            onClick={load}
            disabled={loading}
          >
            <Sparkles className="h-3.5 w-3.5" /> Find my books
          </Button>
        </div>
      )}

      {recs.length > 0 && (
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3">
          {recs.map((r) => {
            const m = MOODS[r.mood] ?? MOODS.mysterious;
            const moodColor = `hsl(${m.h} ${m.s}% ${m.l}%)`;
            return (
              <article
                key={`${r.title}-${r.author}`}
                className="group rounded-2xl border border-border/50 bg-card/60 backdrop-blur p-3 space-y-2.5"
              >
                <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-muted shadow-book">
                  {r.coverId ? (
                    <img
                      src={`https://covers.openlibrary.org/b/id/${r.coverId}-M.jpg`}
                      alt={r.title}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div
                      className="grid h-full place-items-center font-display text-sm text-white/90 p-3 text-center"
                      style={{
                        background: `linear-gradient(135deg, ${moodColor} 0%, hsl(${m.h} ${m.s}% ${Math.max(m.l - 15, 10)}%) 100%)`,
                      }}
                    >
                      {r.title.slice(0, 28)}
                    </div>
                  )}
                  <div
                    className={cn(
                      "pointer-events-none absolute inset-0 mix-blend-soft-light opacity-60"
                    )}
                    aria-hidden
                    style={{
                      background: `linear-gradient(160deg, ${moodColor} 0%, transparent 55%)`,
                    }}
                  />
                  <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-background/85 backdrop-blur px-2 py-0.5 text-[10px] font-medium border border-border/50 shadow-sm">
                    <span aria-hidden>{m.emoji}</span>
                    <span style={{ color: moodColor }}>{m.label}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="font-display text-sm leading-tight line-clamp-2">{r.title}</div>
                  <div className="text-xs text-muted-foreground line-clamp-1">{r.author}</div>
                  {r.why && (
                    <div className="text-[10px] italic text-muted-foreground/90 line-clamp-3 leading-snug">
                      &ldquo;{r.why}&rdquo;
                    </div>
                  )}
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full w-full h-8 text-xs"
                  onClick={() => {
                    onAdd(r.title, r.author, r.mood);
                    toast.success(`Added \u201c${r.title}\u201d to Want to Read.`);
                  }}
                >
                  <Plus className="h-3 w-3 mr-1" /> Want to read
                </Button>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
