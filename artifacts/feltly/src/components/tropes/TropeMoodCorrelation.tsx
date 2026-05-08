import { useMemo } from "react";
import { useLibrary } from "@/lib/store";
import { MOODS, type MoodKey } from "@/lib/moods";
import { tropeCategory } from "@/lib/tropes";

export function TropeMoodCorrelation() {
  const books = useLibrary((s) => s.books);

  const correlations = useMemo(() => {
    const tropeData: Record<string, Record<string, number>> = {};
    books.forEach((b) => {
      (b.tropes ?? []).forEach((t) => {
        if (!tropeData[t]) tropeData[t] = {};
        tropeData[t][b.mood] = (tropeData[t][b.mood] || 0) + 1;
      });
    });
    return Object.entries(tropeData)
      .filter(([, moodMap]) => Object.values(moodMap).reduce((a, b) => a + b, 0) >= 2)
      .map(([trope, moodMap]) => {
        const total = Object.values(moodMap).reduce((a, b) => a + b, 0);
        const topMood = Object.entries(moodMap).sort((a, b) => b[1] - a[1])[0];
        return { trope, moodMap, total, topMood: topMood?.[0] as MoodKey };
      })
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);
  }, [books]);

  if (correlations.length === 0) return null;

  return (
    <section className="rounded-2xl bg-card/70 p-6 border border-border/40 space-y-4">
      <div className="space-y-0.5">
        <h2 className="font-display text-2xl">Trope × Mood</h2>
        <p className="text-xs text-muted-foreground">How each trope tends to make you feel.</p>
      </div>
      <div className="space-y-3">
        {correlations.map(({ trope, moodMap, total }) => {
          const cat = tropeCategory(trope);
          const entries = (Object.entries(moodMap) as [MoodKey, number][]).sort(
            (a, b) => b[1] - a[1]
          );
          return (
            <div key={trope} className="flex items-center gap-3">
              <div className="w-5 text-center flex-shrink-0">{cat?.emoji ?? "📖"}</div>
              <div className="w-36 sm:w-48 text-sm truncate flex-shrink-0">{trope}</div>
              <div className="flex gap-0.5 flex-1 h-8 rounded-lg overflow-hidden">
                {entries.map(([mood, count]) => (
                  <div
                    key={mood}
                    title={`${MOODS[mood].label}: ${count} book${count > 1 ? "s" : ""}`}
                    style={{
                      width: `${(count / total) * 100}%`,
                      background: `hsl(${MOODS[mood].h} ${MOODS[mood].s}% ${MOODS[mood].l}%)`,
                    }}
                    className="flex items-center justify-center text-sm min-w-[28px]"
                  >
                    {MOODS[mood].emoji}
                  </div>
                ))}
              </div>
              <div className="text-[11px] text-muted-foreground w-14 text-right flex-shrink-0 tabular-nums">
                {total}×
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-[10px] text-muted-foreground">
        Tropes with 2+ books shown. Hover a segment to see the mood and count.
      </p>
    </section>
  );
}
