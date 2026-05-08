import { useMemo } from "react";
import { useLibrary } from "@/lib/store";
import { MOODS, type MoodKey } from "@/lib/moods";
import { Waves } from "lucide-react";

const MONTHS = 6;
const SLOTS: Array<"start" | "middle" | "end"> = ["start", "middle", "end"];
const SLOT_LABELS: Record<"start" | "middle" | "end", string> = {
  start: "Start",
  middle: "Middle",
  end: "End",
};

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth()).padStart(2, "0")}`;
}
function monthLabel(d: Date): string {
  return d.toLocaleString(undefined, { month: "short" });
}
function moodColor(m: MoodKey): string {
  const meta = MOODS[m];
  return `hsl(${meta.h} ${meta.s}% ${meta.l}%)`;
}

export function MoodDriftInsight() {
  const snapshots = useLibrary((s) => s.readSnapshots);

  const months = useMemo(() => {
    const now = new Date();
    const arr: Array<{ key: string; label: string; date: Date }> = [];
    for (let i = MONTHS - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      arr.push({ key: monthKey(d), label: monthLabel(d), date: d });
    }
    return arr;
  }, []);

  const grid = useMemo(() => {
    const byMonth = new Map<
      string,
      { start: Map<MoodKey, number>; middle: Map<MoodKey, number>; end: Map<MoodKey, number>; total: number }
    >();
    months.forEach((m) =>
      byMonth.set(m.key, {
        start: new Map(),
        middle: new Map(),
        end: new Map(),
        total: 0,
      }),
    );
    snapshots.forEach((sn) => {
      const k = monthKey(new Date(sn.finishedAt));
      const slot = byMonth.get(k);
      if (!slot) return;
      SLOTS.forEach((s) => {
        const m = sn.arc[s];
        slot[s].set(m, (slot[s].get(m) ?? 0) + 1);
      });
      slot.total++;
    });

    return months.map((m) => {
      const slot = byMonth.get(m.key)!;
      const dominant = (which: "start" | "middle" | "end"): MoodKey | null => {
        let best: MoodKey | null = null;
        let bestN = 0;
        slot[which].forEach((n, k) => {
          if (n > bestN) {
            bestN = n;
            best = k;
          }
        });
        return best;
      };
      return {
        key: m.key,
        label: m.label,
        total: slot.total,
        start: dominant("start"),
        middle: dominant("middle"),
        end: dominant("end"),
      };
    });
  }, [snapshots, months]);

  const totalReads = grid.reduce((a, g) => a + g.total, 0);
  if (totalReads === 0) {
    return (
      <section className="rounded-2xl bg-card/70 p-6 border border-border/40">
        <div className="flex items-center gap-2 mb-1">
          <Waves className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-display text-2xl">Mood drift</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Finish a few books — once you log how each one started, peaked, and landed, you'll see how
          your taste arcs shift across the months.
        </p>
      </section>
    );
  }

  // Compare last filled month vs earliest filled month for the headline
  const filled = grid.filter((g) => g.total > 0);
  const first = filled[0];
  const last = filled[filled.length - 1];
  const drifted =
    first && last && first !== last && (first.start !== last.start || first.end !== last.end);
  const headline = !drifted
    ? `You've been landing on ${last?.end ? MOODS[last.end].label.toLowerCase() : "—"} endings lately.`
    : `You moved from ${MOODS[first!.start!].label.toLowerCase()} → ${MOODS[first!.end!].label.toLowerCase()} arcs to ${MOODS[last!.start!].label.toLowerCase()} → ${MOODS[last!.end!].label.toLowerCase()} arcs.`;

  return (
    <section className="rounded-2xl bg-card/70 p-6 border border-border/40 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <Waves className="h-4 w-4" style={{ color: "var(--mood-strong)" }} />
            <h2 className="font-display text-2xl">Mood drift</h2>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Last {MONTHS} months · dominant arc per month from finished reads
          </p>
        </div>
        <div className="text-xs text-muted-foreground">
          {totalReads} {totalReads === 1 ? "read" : "reads"} tracked
        </div>
      </div>

      <p className="text-sm text-foreground/80 -mt-1">{headline}</p>

      <div className="space-y-2">
        {SLOTS.map((slot) => (
          <div key={slot} className="flex items-center gap-2">
            <div className="w-14 shrink-0 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              {SLOT_LABELS[slot]}
            </div>
            <div className="grid flex-1 gap-1" style={{ gridTemplateColumns: `repeat(${MONTHS}, minmax(0, 1fr))` }}>
              {grid.map((g) => {
                const mood = g[slot] as MoodKey | null;
                return (
                  <div
                    key={g.key}
                    title={
                      mood
                        ? `${g.label}: ${MOODS[mood].label} ${MOODS[mood].emoji} (${g.total} reads)`
                        : `${g.label}: no finished reads`
                    }
                    className="h-9 rounded-md border border-border/40 flex items-center justify-center text-sm"
                    style={{
                      background: mood ? moodColor(mood) : "transparent",
                      opacity: mood ? 0.85 : 0.35,
                    }}
                  >
                    {mood ? MOODS[mood].emoji : ""}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        <div className="flex items-center gap-2">
          <div className="w-14 shrink-0" />
          <div className="grid flex-1 gap-1" style={{ gridTemplateColumns: `repeat(${MONTHS}, minmax(0, 1fr))` }}>
            {grid.map((g) => (
              <div
                key={g.key}
                className="text-[10px] text-center text-muted-foreground tracking-wide"
              >
                {g.label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
