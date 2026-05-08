import { useMemo } from "react";
import { useLibrary } from "@/lib/store";
import { tropeCategory } from "@/lib/tropes";

export function TopTropesInsight() {
  const books = useLibrary((s) => s.books);

  const topTropes = useMemo(() => {
    const counts: Record<string, number> = {};
    books.forEach((b) => {
      (b.tropes ?? []).forEach((t) => {
        counts[t] = (counts[t] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12);
  }, [books]);

  if (topTropes.length === 0) return null;

  const max = topTropes[0][1];

  return (
    <section className="rounded-2xl bg-card/70 p-6 border border-border/40 space-y-4">
      <div className="space-y-0.5">
        <h2 className="font-display text-2xl">Your trope fingerprint</h2>
        <p className="text-xs text-muted-foreground">
          The narrative patterns that keep drawing you in.
        </p>
      </div>
      <div className="space-y-2">
        {topTropes.map(([trope, count]) => {
          const cat = tropeCategory(trope);
          const pct = (count / max) * 100;
          return (
            <div key={trope} className="flex items-center gap-3">
              <div className="w-5 text-center text-base leading-none flex-shrink-0">
                {cat?.emoji ?? "📖"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm truncate">{trope}</span>
                  <span className="text-[11px] text-muted-foreground tabular-nums flex-shrink-0 ml-2">
                    {count} {count === 1 ? "book" : "books"}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, background: "var(--mood-strong)" }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
