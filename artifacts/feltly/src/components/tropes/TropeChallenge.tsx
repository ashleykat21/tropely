import { useMemo, useState } from "react";
import { useLibrary } from "@/lib/store";
import { TROPE_CATEGORIES } from "@/lib/tropes";
import { Button } from "@/components/ui/button";
import { RefreshCw, Sparkles, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

const TRENDING = [
  "Enemies to Lovers", "Dark Academia", "Found Family", "Slow Burn",
  "Morally Grey Protagonist", "Dual Timeline", "Dystopia", "Unreliable Narrator",
  "Coming of Age", "Chosen One", "Forced Proximity", "Political Intrigue",
];

type ChallengeKind = "new-territory" | "deepen" | "spotlight" | "combo" | "wildcard" | "deep-cut";

type Challenge = {
  key: string;
  kind: ChallengeKind;
  trope: string;
  category: string;
  emoji: string;
  tagline: string;
  secondTrope?: string;
  booksWithTrope: number;
};

const KIND_META: Record<ChallengeKind, { label: string; badge: string }> = {
  "new-territory": { label: "New territory", badge: "🌱" },
  deepen:          { label: "Go deeper",     badge: "🌿" },
  spotlight:       { label: "Trending",      badge: "✨" },
  combo:           { label: "Pair it up",    badge: "🔗" },
  wildcard:        { label: "Wildcard",      badge: "🎲" },
  "deep-cut":      { label: "Deep cut",      badge: "🌳" },
};

function pick<T>(arr: T[], seed: number): T | undefined {
  if (!arr.length) return undefined;
  return arr[((seed % arr.length) + arr.length) % arr.length];
}

export function TropeChallenge() {
  const books = useLibrary((s) => s.books);
  const nav = useNavigate();
  const [seed, setSeed] = useState(0);

  const challenges = useMemo<Challenge[]>(() => {
    const usedTropes = new Set<string>();
    books.forEach((b) => (b.tropes ?? []).forEach((t) => usedTropes.add(t)));

    const tropeCounts: Record<string, number> = {};
    books.forEach((b) =>
      (b.tropes ?? []).forEach((t) => { tropeCounts[t] = (tropeCounts[t] || 0) + 1; })
    );

    const untouchedCategories = TROPE_CATEGORIES.filter(
      (c) => c.tropes.every((t) => !usedTropes.has(t))
    );
    const startedCategories = TROPE_CATEGORIES.filter(
      (c) => c.tropes.some((t) => usedTropes.has(t)) && c.tropes.some((t) => !usedTropes.has(t))
    );
    const deepCategories = TROPE_CATEGORIES.filter(
      (c) => c.tropes.filter((t) => usedTropes.has(t)).length >= 3
    );

    const used = new Set<string>();
    const result: Challenge[] = [];

    const addChallenge = (c: Omit<Challenge, "booksWithTrope">) => {
      if (used.has(c.trope) || (c.secondTrope && used.has(c.secondTrope))) return;
      used.add(c.trope);
      if (c.secondTrope) used.add(c.secondTrope);
      result.push({ ...c, booksWithTrope: tropeCounts[c.trope] ?? 0 });
    };

    // 1. New territory — whole untouched category
    for (let i = 0; i < 2 && result.length < 6; i++) {
      const cat = pick(untouchedCategories, seed + i);
      if (!cat) break;
      const trope = pick(cat.tropes.filter((t) => !used.has(t)), seed + i * 7);
      if (!trope) break;
      addChallenge({
        key: `nt-${i}`,
        kind: "new-territory",
        trope,
        category: cat.name,
        emoji: cat.emoji,
        tagline: `You haven't explored ${cat.name} yet — this is a great entry point.`,
      });
    }

    // 2. Deepen — started categories, pick an untried trope
    for (let i = 0; i < 2 && result.length < 6; i++) {
      const cat = pick(startedCategories, seed + i * 31);
      if (!cat) break;
      const untried = cat.tropes.filter((t) => !usedTropes.has(t) && !used.has(t));
      const trope = pick(untried, seed + i * 11);
      if (!trope) break;
      const covered = cat.tropes.filter((t) => usedTropes.has(t)).length;
      addChallenge({
        key: `dep-${i}`,
        kind: "deepen",
        trope,
        category: cat.name,
        emoji: cat.emoji,
        tagline: `You've read ${covered} of ${cat.tropes.length} ${cat.name} tropes. Keep the streak going.`,
      });
    }

    // 3. Trending spotlight — TRENDING list, not yet tagged
    const spotlightPool = TRENDING.filter((t) => !usedTropes.has(t) && !used.has(t));
    const spotlightTrope = pick(spotlightPool, seed + 5);
    if (spotlightTrope && result.length < 6) {
      const cat = TROPE_CATEGORIES.find((c) => c.tropes.includes(spotlightTrope));
      if (cat) {
        addChallenge({
          key: "spotlight",
          kind: "spotlight",
          trope: spotlightTrope,
          category: cat.name,
          emoji: cat.emoji,
          tagline: "This trope is having a moment in the reading community right now.",
        });
      }
    }

    // 4. Combo — two complementary untried tropes from a started category
    if (result.length < 6 && startedCategories.length > 0) {
      const cat = pick(startedCategories, seed + 13);
      if (cat) {
        const untried = cat.tropes.filter((t) => !usedTropes.has(t) && !used.has(t));
        const t1 = pick(untried, seed + 17);
        const t2 = pick(untried.filter((t) => t !== t1), seed + 19);
        if (t1 && t2) {
          addChallenge({
            key: "combo",
            kind: "combo",
            trope: t1,
            secondTrope: t2,
            category: cat.name,
            emoji: cat.emoji,
            tagline: "Find a single book that hits both of these at once.",
          });
        }
      }
    }

    // 5. Deep cut — rarest trope in a deeply explored category (the ones not yet touched)
    if (result.length < 6 && deepCategories.length > 0) {
      const cat = pick(deepCategories, seed + 23);
      if (cat) {
        const untried = cat.tropes.filter((t) => !usedTropes.has(t) && !used.has(t));
        const trope = pick(untried, seed + 29);
        if (trope) {
          addChallenge({
            key: "deepcut",
            kind: "deep-cut",
            trope,
            category: cat.name,
            emoji: cat.emoji,
            tagline: `You know ${cat.name} well. This is the one that's still missing.`,
          });
        }
      }
    }

    // 6. Wildcard — any random untried trope
    if (result.length < 6) {
      const allUntried = TROPE_CATEGORIES.flatMap((c) =>
        c.tropes
          .filter((t) => !usedTropes.has(t) && !used.has(t))
          .map((t) => ({ t, cat: c }))
      );
      const pick2 = allUntried[((seed * 37 + 7) % allUntried.length + allUntried.length) % allUntried.length];
      if (pick2) {
        addChallenge({
          key: "wildcard",
          kind: "wildcard",
          trope: pick2.t,
          category: pick2.cat.name,
          emoji: pick2.cat.emoji,
          tagline: "Something you might never have thought to pick up — why not?",
        });
      }
    }

    return result.slice(0, 6);
  }, [books, seed]);

  if (challenges.length === 0) {
    return (
      <section className="rounded-2xl bg-card/70 p-6 border border-border/40">
        <h2 className="font-display text-2xl mb-2">Trope challenges</h2>
        <p className="text-sm text-muted-foreground">
          You've explored every trope category. Truly impressive range. 🌟
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl bg-card/70 p-6 border border-border/40 space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="space-y-0.5">
          <h2 className="font-display text-2xl">Trope challenges</h2>
          <p className="text-xs text-muted-foreground">
            Tropes worth exploring — shuffle for a fresh set.
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="rounded-full gap-1.5 text-xs"
          onClick={() => setSeed((s) => s + 1)}
        >
          <RefreshCw className="h-3 w-3" /> Shuffle
        </Button>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {challenges.map(({ key, kind, trope, secondTrope, category, emoji, tagline, booksWithTrope }) => {
          const meta = KIND_META[kind];
          return (
            <div
              key={key}
              className={cn(
                "rounded-xl border bg-background/60 p-4 space-y-2.5 flex flex-col",
                kind === "spotlight" ? "border-foreground/30 bg-foreground/[0.03]" : "border-border/50"
              )}
            >
              {/* Header row */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-2xl leading-none">{emoji}</span>
                <span className="inline-flex items-center gap-1 rounded-full border border-border/50 bg-background px-2 py-0.5 text-[10px] text-muted-foreground">
                  {meta.badge} {meta.label}
                </span>
              </div>

              {/* Trope name(s) */}
              <div className="space-y-0.5">
                <div className="font-display text-sm leading-snug">
                  {secondTrope ? (
                    <>
                      <span>{trope}</span>
                      <span className="text-muted-foreground mx-1.5">+</span>
                      <span>{secondTrope}</span>
                    </>
                  ) : trope}
                </div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{category}</div>
              </div>

              {/* Tagline */}
              <p className="text-[11px] text-muted-foreground leading-snug flex-1">{tagline}</p>

              {/* Footer */}
              <div className="flex items-center justify-between pt-0.5 gap-2">
                {booksWithTrope > 0 && !secondTrope ? (
                  <span className="text-[10px] text-muted-foreground">
                    {booksWithTrope} book{booksWithTrope !== 1 ? "s" : ""} on your shelf
                  </span>
                ) : <span />}
                <button
                  onClick={() => nav(`/discover?q=${encodeURIComponent(secondTrope ? `${trope} ${secondTrope}` : trope)}`)}
                  className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition"
                >
                  <Search className="h-2.5 w-2.5" />
                  Find books
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Monthly goal callout */}
      <div className="rounded-xl bg-foreground/[0.03] border border-border/40 px-4 py-3 flex items-center gap-3">
        <Sparkles className="h-4 w-4 shrink-0 text-muted-foreground" />
        <p className="text-xs text-muted-foreground flex-1">
          <span className="font-medium text-foreground">Monthly goal idea:</span> pick one challenge
          above and tag it on a book you finish this month to earn the{" "}
          <span className="italic">Trope explorer</span> achievement.
        </p>
      </div>
    </section>
  );
}
