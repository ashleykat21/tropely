import { useEffect, useMemo, useState } from "react";
import { Loader2, Plus, Sparkles } from "lucide-react";
import { useLibrary, type Shelf } from "@/lib/store";
import { MOODS, type MoodKey } from "@/lib/moods";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type OLDoc = {
  key: string;
  title: string;
  author_name?: string[];
  cover_i?: number;
  number_of_pages_median?: number;
  first_publish_year?: number;
  subject?: string[];
};

type Suggestion = {
  doc: OLDoc;
  mood: MoodKey;
  score: number;
  basis: { title: string; mood: MoodKey };
};

const MOOD_KEYS = Object.keys(MOODS) as MoodKey[];

const moodFor = (seed: string): MoodKey => {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return MOOD_KEYS[h % MOOD_KEYS.length];
};

// Pick the user's "anchors": top 3 finished/loved books to seed similarity
function pickAnchors(books: ReturnType<typeof useLibrary.getState>["books"]) {
  const scored = books
    .map((b) => {
      const finishedBoost = b.shelf === "finished" ? 3 : b.shelf === "reading" ? 1 : 0;
      const reactionBoost = Math.min(3, b.reactions.length * 0.5);
      return { book: b, s: finishedBoost + reactionBoost };
    })
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, 3);
  return scored.map((x) => x.book);
}

export function SimilarRail({
  onAdd,
}: {
  onAdd: (doc: OLDoc, mood: MoodKey, shelf: Shelf) => void;
}) {
  const { books, moodPreferences } = useLibrary();
  const anchors = useMemo(() => pickAnchors(books), [books]);

  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  useEffect(() => {
    if (anchors.length === 0) {
      setSuggestions([]);
      return;
    }
    let cancelled = false;
    const seen = new Set(books.map((b) => `${b.title.toLowerCase()}::${b.author.toLowerCase()}`));
    const favSet = new Set(moodPreferences?.favorites ?? []);
    const avoidSet = new Set(moodPreferences?.avoid ?? []);

    const fetchOne = async (anchor: typeof anchors[number]): Promise<Suggestion[]> => {
      const fields =
        "key,title,author_name,cover_i,number_of_pages_median,first_publish_year,subject";
      try {
        const url = `https://openlibrary.org/search.json?author=${encodeURIComponent(
          anchor.author
        )}&limit=10&fields=${fields}`;
        const res = await fetch(url);
        if (!res.ok) return [];
        const data = await res.json();
        const docs: OLDoc[] = data.docs ?? [];
        return docs
          .filter((d) => d.cover_i && d.title)
          .filter((d) => {
            const k = `${d.title.toLowerCase()}::${(d.author_name?.[0] ?? "").toLowerCase()}`;
            return !seen.has(k);
          })
          .slice(0, 6)
          .map((d) => {
            const mood: MoodKey = moodFor(d.key) === anchor.mood ? anchor.mood : moodFor(d.key);
            // Score: anchor mood match, fav boost, avoid penalty, recency tie-break
            let score = 50;
            if (mood === anchor.mood) score += 25;
            if (favSet.has(mood)) score += 15;
            if (avoidSet.has(mood)) score -= 25;
            if (d.first_publish_year && d.first_publish_year >= new Date().getFullYear() - 5) {
              score += 5;
            }
            return {
              doc: d,
              mood,
              score,
              basis: { title: anchor.title, mood: anchor.mood },
            };
          });
      } catch {
        return [];
      }
    };

    (async () => {
      setLoading(true);
      try {
        const lists = await Promise.all(anchors.map(fetchOne));
        if (cancelled) return;
        const merged: Suggestion[] = [];
        const taken = new Set<string>();
        for (const list of lists) {
          for (const s of list) {
            const k = `${s.doc.title.toLowerCase()}::${(s.doc.author_name?.[0] ?? "").toLowerCase()}`;
            if (taken.has(k)) continue;
            taken.add(k);
            merged.push(s);
          }
        }
        merged.sort((a, b) => b.score - a.score);
        setSuggestions(merged.slice(0, 8));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [anchors, moodPreferences, books]);

  if (anchors.length === 0) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="space-y-0.5">
          <h2 className="font-display text-2xl">Because you loved…</h2>
          <p className="text-xs text-muted-foreground">
            Drawn from {anchors.map((a) => `"${a.title}"`).join(" · ")}
          </p>
        </div>
        {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
      </div>

      {!loading && suggestions.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
          Nothing new under those authors right now. Try Discover or come back after
          finishing another book.
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          {suggestions.map((s) => {
            const m = MOODS[s.mood];
            const moodColor = `hsl(${m.h} ${m.s}% ${m.l}%)`;
            const r = s.doc;
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
                    <div className="grid h-full place-items-center font-display text-base text-muted-foreground p-3 text-center">
                      {r.title.slice(0, 24)}
                    </div>
                  )}
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 mix-blend-soft-light opacity-60"
                    style={{
                      background: `linear-gradient(160deg, ${moodColor} 0%, transparent 55%)`,
                    }}
                  />
                  <div className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-background/85 backdrop-blur px-2 py-0.5 text-[10px] font-medium border border-border/50">
                    <Sparkles className="h-3 w-3" style={{ color: moodColor }} />
                    {s.score}% match
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="font-display text-sm leading-tight line-clamp-2">{r.title}</div>
                  <div className="text-xs text-muted-foreground line-clamp-1">
                    {r.author_name?.[0] ?? "Unknown"}
                  </div>
                  <div className="text-[10px] italic text-muted-foreground/90 line-clamp-2">
                    Like “{s.basis.title}” · {m.emoji} {m.label.toLowerCase()}
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-full flex-1 h-8 text-xs"
                    onClick={() => {
                      onAdd(r, s.mood, "want");
                      toast.success(`Added "${r.title}" to Want to read`);
                    }}
                  >
                    <Plus className="h-3 w-3 mr-1" /> Want
                  </Button>
                  <Button
                    size="sm"
                    className="rounded-full flex-1 h-8 text-xs"
                    onClick={() => {
                      onAdd(r, s.mood, "reading");
                      toast.success(`Added "${r.title}" to Reading`);
                    }}
                  >
                    Reading
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}