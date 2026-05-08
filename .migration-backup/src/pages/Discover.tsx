import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, Loader2, Sparkles, CalendarClock, Wand2 } from "lucide-react";
import { useLibrary, type Shelf } from "@/lib/store";
import { MOODS, type MoodKey } from "@/lib/moods";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { SimilarRail } from "@/components/discover/SimilarRail";

type OLResult = {
  key: string;
  title: string;
  author_name?: string[];
  cover_i?: number;
  number_of_pages_median?: number;
  first_publish_year?: number;
  first_publish_date?: string;
  publish_date?: string[];
};

type FeedKey = "new" | "upcoming" | "search";

const CURRENT_YEAR = new Date().getFullYear();
const NEXT_YEAR = CURRENT_YEAR + 1;

const MOOD_KEYS = Object.keys(MOODS) as MoodKey[];

// Deterministic mood from a stable string (book key) so it doesn't flicker on re-render.
const moodFor = (seed: string): MoodKey => {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return MOOD_KEYS[h % MOOD_KEYS.length];
};

type MoodTag = { mood: MoodKey; match: number; reason: string };

const Discover = () => {
  const { user } = useAuth();
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<OLResult[]>([]);
  const [feed, setFeed] = useState<FeedKey>("new");
  const [newReleases, setNewReleases] = useState<OLResult[]>([]);
  const [upcoming, setUpcoming] = useState<OLResult[]>([]);
  const [feedLoading, setFeedLoading] = useState(false);
  const [aiTags, setAiTags] = useState<Record<string, MoodTag>>({});
  const [aiMood, setAiMood] = useState<MoodKey | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const addBook = useLibrary((s) => s.addBook);
  const moodPreferences = useLibrary((s) => s.moodPreferences);
  const age = useLibrary((s) => s.age);
  const [autoTried, setAutoTried] = useState(false);

  const search = async (term: string) => {
    if (!term.trim()) return;
    setLoading(true);
    setFeed("search");
    try {
      const res = await fetch(
        `https://openlibrary.org/search.json?q=${encodeURIComponent(term)}&limit=18&fields=key,title,author_name,cover_i,number_of_pages_median,first_publish_year`
      );
      const data = await res.json();
      setResults(data.docs ?? []);
    } catch {
      toast.error("Couldn't reach the book library. Try again.");
    } finally {
      setLoading(false);
    }
  };

  // Load new releases (this year) + upcoming (next year) from Open Library
  useEffect(() => {
    let cancelled = false;
    const fetchFeeds = async () => {
      setFeedLoading(true);
      try {
        const fields =
          "key,title,author_name,cover_i,number_of_pages_median,first_publish_year";
        const [newRes, upRes] = await Promise.all([
          fetch(
            `https://openlibrary.org/search.json?q=first_publish_year%3A${CURRENT_YEAR}&sort=new&limit=24&fields=${fields}`
          ).then((r) => r.json()),
          fetch(
            `https://openlibrary.org/search.json?q=first_publish_year%3A${NEXT_YEAR}&sort=new&limit=24&fields=${fields}`
          ).then((r) => r.json()),
        ]);
        if (cancelled) return;
        const filterCovers = (docs: OLResult[]) =>
          docs.filter((d) => d.cover_i && d.title);
        setNewReleases(filterCovers(newRes.docs ?? []).slice(0, 18));
        setUpcoming(filterCovers(upRes.docs ?? []).slice(0, 18));
      } catch {
        if (!cancelled) toast.error("Couldn't load releases. Try again.");
      } finally {
        if (!cancelled) setFeedLoading(false);
      }
    };
    fetchFeeds();
    return () => {
      cancelled = true;
    };
  }, []);

  const add = (r: OLResult, shelf: Shelf) => {
    const mood = aiTags[r.key]?.mood ?? moodFor(r.key);
    addBook({
      title: r.title,
      author: r.author_name?.[0] ?? "Unknown",
      cover: r.cover_i ? `https://covers.openlibrary.org/b/id/${r.cover_i}-L.jpg` : undefined,
      pages: r.number_of_pages_median || 280,
      mood,
      shelf,
    });
    toast.success(`Added "${r.title}" to ${shelf === "want" ? "Want to read" : shelf}`);
  };

  const visible = useMemo<OLResult[]>(() => {
    const base = feed === "search" ? results : feed === "upcoming" ? upcoming : newReleases;
    // Age-aware filter: hide explicit adult-coded titles for under-18 readers and
    // softly bias toward middle-grade / YA when the reader is younger.
    const adult = /\b(erotic|erotica|smut|explicit|nsfw|sex|porn)\b/i;
    const ya = /\b(young adult|teen|coming of age|middle grade|ya )\b/i;
    const filtered = (() => {
      if (!age) return base;
      if (age < 13) {
        return base.filter((b) => !adult.test(b.title));
      }
      if (age < 18) {
        return base.filter((b) => !adult.test(b.title));
      }
      return base;
    })();
    const ageScore = (b: OLResult) => {
      if (!age) return 0;
      if (age < 18 && ya.test(b.title)) return 1;
      return 0;
    };
    if (!aiMood) {
      if (!age) return filtered;
      return [...filtered].sort((a, b) => ageScore(b) - ageScore(a));
    }
    // Sort by AI match descending if tags are present, then age score
    return [...filtered].sort((a, b) => {
      const m = (aiTags[b.key]?.match ?? -1) - (aiTags[a.key]?.match ?? -1);
      if (m !== 0) return m;
      return ageScore(b) - ageScore(a);
    });
  }, [feed, results, newReleases, upcoming, aiMood, aiTags, age]);

  // Reset AI tags when the underlying feed changes (results are different books)
  useEffect(() => {
    setAiTags({});
    setAiMood(null);
  }, [feed, results, newReleases, upcoming]);

  // Auto-rerank by user's #1 favorite mood once feeds load (post-onboarding warm start).
  useEffect(() => {
    if (autoTried || !user || !moodPreferences || moodPreferences.favorites.length === 0) return;
    if (feed !== "new" || newReleases.length === 0 || aiMood) return;
    setAutoTried(true);
    matchMood(moodPreferences.favorites[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, moodPreferences, newReleases, feed]);

  const matchMood = async (mood: MoodKey) => {
    if (!user) {
      toast.error("Sign in to use mood-matching.");
      return;
    }
    const base = feed === "search" ? results : feed === "upcoming" ? upcoming : newReleases;
    if (base.length === 0) return;
    setAiLoading(true);
    setAiMood(mood);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error("Sign in to use mood-matching.");
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mood-tag-books`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          targetMood: mood,
          books: base.slice(0, 20).map((b) => ({
            key: b.key,
            title: b.title,
            author: b.author_name?.[0] ?? "Unknown",
          })),
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? `HTTP ${res.status}`);
      }
      const j = await res.json();
      const map: Record<string, MoodTag> = {};
      for (const t of j.tags ?? []) {
        if (t.mood) map[t.key] = { mood: t.mood, match: t.match ?? 0, reason: t.reason ?? "" };
      }
      setAiTags(map);
      toast.success(`Re-sorted by ${MOODS[mood].label.toLowerCase()} match.`);
    } catch (e: any) {
      toast.error(e.message ?? "Couldn't tag moods.");
      setAiMood(null);
    } finally {
      setAiLoading(false);
    }
  };

  const showingFeed = feed !== "search";

  return (
    <AppShell>
      <div className="space-y-8 max-w-4xl">
        <header className="space-y-2 animate-fade-up">
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Discover</p>
          <h1 className="font-display text-4xl sm:text-5xl leading-[1.05]">
            Find your next{" "}
            <span className="italic" style={{ color: "var(--mood-strong)" }}>
              feeling
            </span>
            .
          </h1>
          <p className="text-muted-foreground max-w-md">
            Fresh off the press and what's coming next. Add by mood, not by stars.
          </p>
        </header>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            search(q);
          }}
          className="flex gap-2"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                if (e.target.value === "" && feed === "search") setFeed("new");
              }}
              placeholder="Title, author, or ISBN…"
              className="pl-9 rounded-full bg-card/80 h-11"
            />
          </div>
          <Button type="submit" className="rounded-full h-11 px-5" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
          </Button>
        </form>

        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex gap-1 rounded-full border border-border/60 bg-card/80 backdrop-blur p-1">
            <button
              onClick={() => setFeed("new")}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-sm transition flex items-center gap-1.5",
                feed === "new"
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Sparkles className="h-3.5 w-3.5" />
              New releases
            </button>
            <button
              onClick={() => setFeed("upcoming")}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-sm transition flex items-center gap-1.5",
                feed === "upcoming"
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <CalendarClock className="h-3.5 w-3.5" />
              Upcoming
            </button>
            {feed === "search" && (
              <button
                onClick={() => setFeed("new")}
                className="rounded-full px-3.5 py-1.5 text-sm bg-foreground text-background"
              >
                Search results
              </button>
            )}
          </div>
          {showingFeed && (
            <p className="text-xs text-muted-foreground">
              {feed === "new" ? `Published in ${CURRENT_YEAR}` : `Coming in ${NEXT_YEAR}`}
            </p>
          )}
        </div>

        {/* Mood-match picker */}
        <div className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur p-4 space-y-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Wand2 className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm">
                {aiMood ? (
                  <>Sorted for <span className="font-medium">{MOODS[aiMood].label.toLowerCase()}</span> reading.</>
                ) : (
                  <>What mood are you in? I'll re-rank these.</>
                )}
              </p>
            </div>
            {aiMood && (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs"
                onClick={() => { setAiMood(null); setAiTags({}); }}
              >
                Clear
              </Button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {MOOD_KEYS.map((k) => (
              <button
                key={k}
                disabled={aiLoading}
                onClick={() => matchMood(k)}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-xs flex items-center gap-1 transition disabled:opacity-50",
                  aiMood === k
                    ? "bg-foreground text-background border-foreground"
                    : "bg-white/70 border-border hover:bg-white"
                )}
              >
                <span>{MOODS[k].emoji}</span>
                <span>{MOODS[k].label}</span>
              </button>
            ))}
            {aiLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground self-center ml-1" />}
          </div>
        </div>

        {/* Personalized similarity rail */}
        <SimilarRail
          onAdd={(r, mood, shelf) =>
            addBook({
              title: r.title,
              author: r.author_name?.[0] ?? "Unknown",
              cover: r.cover_i ? `https://covers.openlibrary.org/b/id/${r.cover_i}-L.jpg` : undefined,
              pages: r.number_of_pages_median || 280,
              mood,
              shelf,
            })
          }
        />

        {(loading || (showingFeed && feedLoading)) && visible.length === 0 && (
          <div className="grid place-items-center py-16 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        )}

        {!loading && !feedLoading && visible.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border/60 p-10 text-center text-muted-foreground">
            {feed === "search"
              ? "No matches. Try another title or author."
              : "Nothing to show right now."}
          </div>
        )}

        <div className="grid gap-5 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          {visible.map((r) => {
            const tag = aiTags[r.key];
            const mk: MoodKey = tag?.mood ?? moodFor(r.key);
            const m = MOODS[mk];
            const moodColor = `hsl(${m.h} ${m.s}% ${m.l}%)`;
            return (
            <article
              key={r.key}
              className="space-y-3 rounded-2xl bg-card/60 backdrop-blur p-3 border border-border/50"
            >
              <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-muted shadow-book">
                {r.cover_i ? (
                  <img
                    src={`https://covers.openlibrary.org/b/id/${r.cover_i}-M.jpg`}
                    alt={r.title}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="grid h-full place-items-center font-display text-xl text-muted-foreground p-3 text-center">
                    {r.title.slice(0, 24)}
                  </div>
                )}
                {showingFeed && (
                  <>
                    <div
                      aria-hidden
                      className="pointer-events-none absolute inset-0 mix-blend-soft-light opacity-70"
                      style={{
                        background: `linear-gradient(160deg, ${moodColor} 0%, transparent 55%, ${moodColor} 100%)`,
                      }}
                    />
                    <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-background/85 backdrop-blur px-2 py-0.5 text-[10px] font-medium border border-border/50 shadow-sm">
                      <span aria-hidden>{m.emoji}</span>
                      <span style={{ color: moodColor }}>{m.label}</span>
                    </div>
                    {tag && aiMood && (
                      <div className="absolute right-2 top-2 rounded-full bg-foreground text-background px-2 py-0.5 text-[10px] font-medium shadow-sm">
                        {tag.match}% match
                      </div>
                    )}
                  </>
                )}
              </div>
              <div className="space-y-1">
                <div className="font-display text-sm leading-tight line-clamp-2">{r.title}</div>
                <div className="text-xs text-muted-foreground line-clamp-1">
                  {r.author_name?.[0] ?? "Unknown"}
                </div>
                {tag?.reason && (
                  <div className="text-[10px] italic text-muted-foreground/90 line-clamp-2">
                    “{tag.reason}”
                  </div>
                )}
                {r.first_publish_year && (
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground/80">
                    {feed === "upcoming" ? "Expected " : ""}
                    {r.first_publish_year}
                  </div>
                )}
              </div>
              <div className="flex gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full flex-1 h-8 text-xs"
                  onClick={() => add(r, "want")}
                >
                  <Plus className="h-3 w-3 mr-1" /> Want
                </Button>
                <Button
                  size="sm"
                  className="rounded-full flex-1 h-8 text-xs"
                  onClick={() => add(r, "reading")}
                >
                  Reading
                </Button>
              </div>
            </article>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
};

export default Discover;