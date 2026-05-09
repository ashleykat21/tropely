import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, Loader2, Sparkles, CalendarClock, Wand2, X, AlertCircle, RotateCcw } from "lucide-react";
import { useLibrary, type Shelf } from "@/lib/store";
import { suggestTropes, TROPE_CATEGORIES } from "@/lib/tropes";
import { MOODS, type MoodKey } from "@/lib/moods";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { SimilarRail } from "@/components/discover/SimilarRail";
import { MoodRecsPanel } from "@/components/discover/MoodRecsPanel";
import { TrendingTropes } from "@/components/tropes/TrendingTropes";

type OLResult = {
  key: string;
  title: string;
  author_name?: string[];
  cover_i?: number;
  number_of_pages_median?: number;
  first_publish_year?: number;
  first_publish_date?: string;
  publish_date?: string[];
  series?: string[];
};

type FeedKey = "new" | "upcoming" | "search";

const CURRENT_YEAR = new Date().getFullYear();
const NEXT_YEAR = CURRENT_YEAR + 1;

const MOOD_KEYS = Object.keys(MOODS) as MoodKey[];

const moodFor = (seed: string): MoodKey => {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return MOOD_KEYS[h % MOOD_KEYS.length];
};

type MoodTag = { mood: MoodKey; match: number; reason: string };

type Length = "short" | "medium" | "long";
const LENGTHS: { key: Length; label: string; hint: string }[] = [
  { key: "short", label: "Short", hint: "Under 250 pages" },
  { key: "medium", label: "Medium", hint: "250–450 pages" },
  { key: "long", label: "Long", hint: "450+ pages" },
];
const lengthOf = (p: number | undefined): Length | null => {
  if (!p || p < 1) return null;
  if (p < 250) return "short";
  if (p <= 450) return "medium";
  return "long";
};

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
  const [aiFailed, setAiFailed] = useState(false);
  const [lastRequestedMood, setLastRequestedMood] = useState<MoodKey | null>(null);
  const [activeLength, setActiveLength] = useState<Length | null>(null);
  const [activeTrope, setActiveTrope] = useState<string | null>(null);
  const addBook = useLibrary((s) => s.addBook);
  const updateBook = useLibrary((s) => s.updateBook);
  const autoAssignSeries = useLibrary((s) => s.autoAssignSeries);
  const moodPreferences = useLibrary((s) => s.moodPreferences);
  const age = useLibrary((s) => s.age);
  const books = useLibrary((s) => s.books);
  const [catFilter, setCatFilter] = useState<string | null>(null);
  const [autoTried, setAutoTried] = useState(false);
  const [pendingTrope, setPendingTrope] = useState<{
    bookId: string; title: string; suggestions: string[]; chosen: string[];
  } | null>(null);

  const userTropes = useMemo(() => {
    const seen = new Set<string>();
    books.forEach((b) => (b.tropes ?? []).forEach((t) => seen.add(t)));
    return Array.from(seen);
  }, [books]);

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

  const searchTrope = (trope: string) => {
    setQ(trope);
    search(trope);
  };

  /** Map each category name → best OpenLibrary search term */
  const CAT_SEARCH: Record<string, string> = {
    "Romance": "romance novel",
    "Fantasy & Adventure": "epic fantasy adventure",
    "Thriller & Mystery": "thriller mystery",
    "Literary": "literary fiction",
    "Sci-Fi": "science fiction",
    "Horror": "horror",
    "Historical Fiction": "historical fiction",
    "Contemporary": "contemporary fiction",
    "Paranormal & Urban Fantasy": "paranormal urban fantasy",
    "Cozy & Comfort": "cozy mystery",
  };

  const searchCategory = (catName: string) => {
    const term = CAT_SEARCH[catName] ?? catName;
    setCatFilter(catName);
    setQ(term);
    search(term);
  };

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
    return () => { cancelled = true; };
  }, []);

  const add = (r: OLResult, shelf: Shelf) => {
    const mood = aiTags[r.key]?.mood ?? moodFor(r.key);
    const seriesFromOL = r.series?.[0]?.trim() || undefined;
    const newId = addBook({
      title: r.title,
      author: r.author_name?.[0] ?? "Unknown",
      cover: r.cover_i ? `https://covers.openlibrary.org/b/id/${r.cover_i}-L.jpg` : undefined,
      pages: r.number_of_pages_median || 280,
      mood,
      shelf,
      ...(seriesFromOL ? { series: seriesFromOL } : {}),
    });
    const series = autoAssignSeries(newId);
    if (series) {
      toast.success(`Added to series: ${series.seriesName}`);
    } else {
      toast.success(`Added "${r.title}" to ${shelf === "want" ? "Want to read" : shelf}`);
    }
    const suggestions = suggestTropes(r.title, r.author_name ?? []);
    if (suggestions.length > 0) {
      setPendingTrope({ bookId: newId, title: r.title, suggestions: suggestions.slice(0, 3), chosen: [] });
    }
  };

  useEffect(() => {
    if (!pendingTrope) return;
    const t = setTimeout(() => setPendingTrope(null), 10000);
    return () => clearTimeout(t);
  }, [pendingTrope]);

  const baseFeed = useMemo<OLResult[]>(() => {
    return feed === "search" ? results : feed === "upcoming" ? upcoming : newReleases;
  }, [feed, results, upcoming, newReleases]);

  const tropeOptions = useMemo<string[]>(() => {
    const counts = new Map<string, number>();
    baseFeed.forEach((r) => {
      suggestTropes(r.title, r.author_name ?? []).slice(0, 2).forEach((t) => {
        counts.set(t, (counts.get(t) ?? 0) + 1);
      });
    });
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([t]) => t);
  }, [baseFeed]);

  const visible = useMemo<OLResult[]>(() => {
    const adult = /\b(erotic|erotica|smut|explicit|nsfw|sex|porn)\b/i;
    const ya = /\b(young adult|teen|coming of age|middle grade|ya )\b/i;
    const ageFiltered = (() => {
      if (!age) return baseFeed;
      if (age < 18) return baseFeed.filter((b) => !adult.test(b.title));
      return baseFeed;
    })();
    const filtered = ageFiltered.filter((r) => {
      if (activeLength) {
        const lk = lengthOf(r.number_of_pages_median);
        if (lk !== activeLength) return false;
      }
      if (activeTrope) {
        const tropes = suggestTropes(r.title, r.author_name ?? []);
        if (!tropes.includes(activeTrope)) return false;
      }
      return true;
    });
    const ageScore = (b: OLResult) => {
      if (!age) return 0;
      if (age < 18 && ya.test(b.title)) return 1;
      return 0;
    };
    if (!aiMood) {
      if (!age) return filtered;
      return [...filtered].sort((a, b) => ageScore(b) - ageScore(a));
    }
    return [...filtered].sort((a, b) => {
      const m = (aiTags[b.key]?.match ?? -1) - (aiTags[a.key]?.match ?? -1);
      if (m !== 0) return m;
      return ageScore(b) - ageScore(a);
    });
  }, [baseFeed, aiMood, aiTags, age, activeLength, activeTrope]);

  const clearAllFilters = () => {
    setAiMood(null);
    setAiTags({});
    setActiveLength(null);
    setActiveTrope(null);
    setAiFailed(false);
  };
  const activeFilterCount =
    (aiMood ? 1 : 0) + (activeLength ? 1 : 0) + (activeTrope ? 1 : 0);

  useEffect(() => {
    setAiTags({});
    setAiMood(null);
  }, [feed, results, newReleases, upcoming]);

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
    setAiFailed(false);
    setLastRequestedMood(mood);
    setAiMood(mood);
    try {
      const res = await fetch("/api/mood-tag-books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
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
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Couldn't tag moods.");
      setAiMood(null);
      setAiFailed(true);
    } finally {
      setAiLoading(false);
    }
  };

  const retryAi = () => {
    if (lastRequestedMood) matchMood(lastRequestedMood);
    else if (moodPreferences?.favorites?.[0]) matchMood(moodPreferences.favorites[0]);
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
              trope
            </span>
            .
          </h1>
          <p className="text-muted-foreground max-w-md text-sm">
            Browse by story shape, then let the mood underneath guide you in.
          </p>
        </header>

        {/* Search */}
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
              placeholder="Title, author, trope, or ISBN…"
              className="pl-9 rounded-full bg-card/80 h-11"
            />
          </div>
          <Button type="submit" className="rounded-full h-11 px-5" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
          </Button>
        </form>

        {/* Trope category pills */}
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Browse by genre</p>
          <div className="flex flex-wrap gap-1.5">
            {TROPE_CATEGORIES.map((cat) => (
              <button
                key={cat.name}
                onClick={() => {
                  if (catFilter === cat.name) {
                    setCatFilter(null);
                    setQ("");
                    setFeed("new");
                  } else {
                    searchCategory(cat.name);
                  }
                }}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs flex items-center gap-1.5 transition",
                  catFilter === cat.name
                    ? "bg-foreground text-background border-foreground"
                    : "bg-card/70 border-border/60 text-muted-foreground hover:text-foreground hover:bg-card"
                )}
              >
                <span>{cat.emoji}</span>
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Per-genre trope chips — show up to 10 tropes from the selected genre */}
        {catFilter && (() => {
          const cat = TROPE_CATEGORIES.find((c) => c.name === catFilter);
          if (!cat || cat.tropes.length === 0) return null;
          return (
            <div className="space-y-1.5 -mt-3">
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                {cat.emoji} Tropes in {cat.name}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {cat.tropes.slice(0, 10).map((trope) => (
                  <button
                    key={trope}
                    onClick={() => {
                      setQ(trope);
                      search(trope);
                    }}
                    className="rounded-full border border-border/60 bg-card/70 px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-card transition"
                  >
                    {trope}
                  </button>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Feed tabs */}
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

        {/* Browse by trope */}
        <TrendingTropes userTropes={userTropes} onTropeClick={searchTrope} />

        {/* Filters — combinable mood + length + trope */}
        <div className="space-y-3 rounded-2xl border border-border/50 bg-card/50 p-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Wand2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <p className="text-sm text-muted-foreground">Combine filters to refine the results:</p>
            {aiLoading && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
          </div>

          {/* Mood pills */}
          <div className="space-y-1.5">
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/80">Mood undertone</p>
            <div className="flex flex-wrap gap-1.5">
              {MOOD_KEYS.map((k) => (
                <button
                  key={k}
                  disabled={aiLoading}
                  onClick={() => (aiMood === k ? (setAiMood(null), setAiTags({})) : matchMood(k))}
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
            </div>
          </div>

          {/* Length pills */}
          <div className="space-y-1.5">
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/80">Length</p>
            <div className="flex flex-wrap gap-1.5">
              {LENGTHS.map((l) => (
                <button
                  key={l.key}
                  onClick={() => setActiveLength(activeLength === l.key ? null : l.key)}
                  title={l.hint}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-xs transition",
                    activeLength === l.key
                      ? "bg-foreground text-background border-foreground"
                      : "bg-white/70 border-border hover:bg-white"
                  )}
                >
                  {l.label}
                  <span className="ml-1 text-[10px] opacity-60">
                    {l.key === "short" ? "<250p" : l.key === "medium" ? "250–450p" : "450p+"}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Trope pills */}
          {tropeOptions.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/80">Trope</p>
              <div className="flex flex-wrap gap-1.5">
                {tropeOptions.map((t) => (
                  <button
                    key={t}
                    onClick={() => setActiveTrope(activeTrope === t ? null : t)}
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-xs transition",
                      activeTrope === t
                        ? "bg-foreground text-background border-foreground"
                        : "bg-white/70 border-border hover:bg-white"
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* AI failure banner */}
        {aiFailed && !aiLoading && (
          <div className="rounded-xl border border-amber-300/60 bg-amber-50/60 px-4 py-3 flex items-center gap-3 text-sm">
            <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
            <p className="text-amber-900/90 flex-1">
              Mood tagging didn't go through. Other filters still work — give it another try?
            </p>
            <button
              onClick={retryAi}
              className="inline-flex items-center gap-1 rounded-full border border-amber-400/60 bg-white/70 px-3 py-1 text-xs hover:bg-white transition"
            >
              <RotateCcw className="h-3 w-3" /> Retry
            </button>
            <button
              onClick={() => setAiFailed(false)}
              className="text-amber-700/70 hover:text-amber-900 transition"
              aria-label="Dismiss"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Active filter chips */}
        {activeFilterCount > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/80">Active</span>
            {aiMood && (
              <button
                onClick={() => { setAiMood(null); setAiTags({}); }}
                className="inline-flex items-center gap-1 rounded-full bg-foreground text-background pl-2.5 pr-1.5 py-1 text-xs hover:opacity-90 transition"
              >
                {MOODS[aiMood].emoji} {MOODS[aiMood].label}
                <X className="h-3 w-3 ml-0.5" />
              </button>
            )}
            {activeLength && (
              <button
                onClick={() => setActiveLength(null)}
                className="inline-flex items-center gap-1 rounded-full bg-foreground text-background pl-2.5 pr-1.5 py-1 text-xs hover:opacity-90 transition"
              >
                {LENGTHS.find((l) => l.key === activeLength)?.label}
                <X className="h-3 w-3 ml-0.5" />
              </button>
            )}
            {activeTrope && (
              <button
                onClick={() => setActiveTrope(null)}
                className="inline-flex items-center gap-1 rounded-full bg-foreground text-background pl-2.5 pr-1.5 py-1 text-xs hover:opacity-90 transition"
              >
                {activeTrope}
                <X className="h-3 w-3 ml-0.5" />
              </button>
            )}
            <button
              onClick={clearAllFilters}
              className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground transition ml-1"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Mood-matched recommendations — premium */}
        <MoodRecsPanel
          onAdd={(title, author, mood) =>
            addBook({ title, author, pages: 280, mood, shelf: "want" })
          }
        />

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
          <div className="rounded-2xl border border-dashed border-border/60 p-10 text-center text-muted-foreground space-y-3">
            <p>
              {activeFilterCount > 0
                ? "No books match every active filter. Try loosening one."
                : feed === "search"
                ? "No matches. Try another title or author."
                : "Nothing to show right now."}
            </p>
            {activeFilterCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/70 px-3 py-1.5 text-xs hover:bg-card transition"
              >
                <X className="h-3 w-3" /> Clear all filters
              </button>
            )}
          </div>
        )}

        {/* Section label for feed */}
        {visible.length > 0 && (
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              {feed === "search" ? "Search results" : feed === "upcoming" ? `Coming ${NEXT_YEAR}` : `New ${CURRENT_YEAR}`}
            </p>
            <p className="text-xs text-muted-foreground">{visible.length} books</p>
          </div>
        )}

        <div className="grid gap-5 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          {visible.map((r) => {
            const tag = aiTags[r.key];
            const mk: MoodKey = tag?.mood ?? moodFor(r.key);
            const m = MOODS[mk];
            const moodColor = `hsl(${m.h} ${m.s}% ${m.l}%)`;
            const cardTropes = suggestTropes(r.title, r.author_name ?? []);
            const firstTrope = cardTropes[0] ?? null;
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
                  {/* Mood colour overlay */}
                  {showingFeed && (
                    <div
                      aria-hidden
                      className="pointer-events-none absolute inset-0 mix-blend-soft-light opacity-70"
                      style={{
                        background: `linear-gradient(160deg, ${moodColor} 0%, transparent 55%, ${moodColor} 100%)`,
                      }}
                    />
                  )}
                  {/* Trope pill — primary badge on cover */}
                  {firstTrope && (
                    <div className="absolute left-2 top-2 rounded-full bg-background/90 backdrop-blur px-2.5 py-1 text-[10px] font-medium border border-border/50 shadow-sm leading-tight max-w-[calc(100%-1rem)] truncate">
                      {firstTrope}
                    </div>
                  )}
                  {tag && aiMood && (
                    <div className="absolute right-2 top-2 rounded-full bg-foreground text-background px-2 py-0.5 text-[10px] font-medium shadow-sm">
                      {tag.match}% match
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <div className="font-display text-sm leading-tight line-clamp-2">{r.title}</div>
                  <div className="text-xs text-muted-foreground line-clamp-1">
                    {r.author_name?.[0] ?? "Unknown"}
                  </div>
                  {/* Mood undertone under title/author */}
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground/80">
                    <span>{m.emoji}</span>
                    <span>{m.label}</span>
                  </div>
                  {tag?.reason && (
                    <div className="text-[10px] italic text-muted-foreground/90 line-clamp-2">
                      "{tag.reason}"
                    </div>
                  )}
                  {r.first_publish_year && (
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground/60">
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

      {/* Trope suggestion banner */}
      {pendingTrope && (
        <div className="fixed bottom-[4.5rem] sm:bottom-6 left-0 right-0 px-4 z-30 flex justify-center pointer-events-none">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-background/95 backdrop-blur shadow-xl p-4 space-y-3 pointer-events-auto animate-fade-up">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium leading-snug">
                Tag tropes on &ldquo;{pendingTrope.title.slice(0, 28)}{pendingTrope.title.length > 28 ? "…" : ""}&rdquo;?
              </p>
              <button
                onClick={() => setPendingTrope(null)}
                className="text-muted-foreground hover:text-foreground transition shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {pendingTrope.suggestions.map((t) => (
                <button
                  key={t}
                  onClick={() =>
                    setPendingTrope((p) =>
                      p
                        ? {
                            ...p,
                            chosen: p.chosen.includes(t)
                              ? p.chosen.filter((x) => x !== t)
                              : [...p.chosen, t],
                          }
                        : p
                    )
                  }
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-xs transition",
                    pendingTrope.chosen.includes(t)
                      ? "bg-foreground text-background border-foreground"
                      : "border-border hover:bg-foreground/5"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
            <button
              onClick={() => {
                if (pendingTrope.chosen.length > 0) {
                  updateBook(pendingTrope.bookId, { tropes: pendingTrope.chosen });
                }
                setPendingTrope(null);
              }}
              className="w-full rounded-full bg-foreground text-background text-xs py-1.5 hover:opacity-90 transition"
            >
              {pendingTrope.chosen.length > 0
                ? `Save ${pendingTrope.chosen.length} trope${pendingTrope.chosen.length !== 1 ? "s" : ""}`
                : "Skip"}
            </button>
          </div>
        </div>
      )}
    </AppShell>
  );
};

export default Discover;
