import { useMemo, useState } from "react";
import { useLibrary } from "@/lib/store";
import { MOODS, type MoodKey } from "@/lib/moods";
import { CalendarRange } from "lucide-react";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const CELL = 13; // px
const GAP = 3;   // px

type Cell = {
  date: Date;
  pages: number;
  mood: MoodKey | null;
  sessions: number;
};

function streak(days: Cell[]): { current: number; longest: number } {
  const sorted = [...days].sort((a, b) => a.date.getTime() - b.date.getTime());
  let cur = 0, best = 0, run = 0;
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  for (let i = sorted.length - 1; i >= 0; i--) {
    const d = sorted[i];
    if (d.pages === 0) { if (i === sorted.length - 1) continue; break; }
    run++;
    if (i === sorted.length - 1 || sorted[i + 1].pages > 0) cur = run;
  }
  run = 0;
  for (const d of sorted) {
    if (d.pages > 0) { run++; best = Math.max(best, run); }
    else run = 0;
  }
  void today;
  void cur;
  return { current: cur, longest: best };
}

export function ReadingHeatMap() {
  const { sessions } = useLibrary();
  const [hovered, setHovered] = useState<Cell | null>(null);

  const { weeks, monthLabels, stats } = useMemo(() => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    // Start on the Sunday 52 full weeks ago
    const startDay = new Date(today);
    startDay.setDate(startDay.getDate() - 364);
    const firstSunday = new Date(startDay);
    firstSunday.setDate(firstSunday.getDate() - firstSunday.getDay());
    firstSunday.setHours(0, 0, 0, 0);

    // Build a day map keyed by YYYY-MM-DD
    type DayInfo = { pages: number; moodPages: Partial<Record<MoodKey, number>>; count: number };
    const dayMap: Record<string, DayInfo> = {};
    for (const s of sessions) {
      const d = new Date(s.at);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!dayMap[key]) dayMap[key] = { pages: 0, moodPages: {}, count: 0 };
      dayMap[key].pages += s.pagesRead;
      dayMap[key].count++;
      dayMap[key].moodPages[s.mood] = (dayMap[key].moodPages[s.mood] ?? 0) + s.pagesRead;
    }

    const weeks: Cell[][] = [];
    const monthLabels: { label: string; weekIndex: number }[] = [];
    let seenMonths = new Set<string>();
    let weekIdx = 0;
    const allCells: Cell[] = [];

    let cursor = new Date(firstSunday);
    while (cursor <= today) {
      const week: Cell[] = [];
      for (let dow = 0; dow < 7; dow++) {
        const d = new Date(cursor);
        d.setDate(d.getDate() + dow);
        const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        const info = dayMap[key];
        let topMood: MoodKey | null = null;
        if (info) {
          const entries = Object.entries(info.moodPages) as [MoodKey, number][];
          topMood = entries.sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
        }
        const cell: Cell = {
          date: new Date(d),
          pages: info?.pages ?? 0,
          mood: topMood,
          sessions: info?.count ?? 0,
        };
        week.push(cell);
        if (d <= today) allCells.push(cell);

        // Track month label
        const monthKey = `${d.getFullYear()}-${d.getMonth()}`;
        if (dow === 0 && !seenMonths.has(monthKey) && d <= today) {
          seenMonths.add(monthKey);
          monthLabels.push({
            label: d.toLocaleDateString(undefined, { month: "short" }),
            weekIndex: weekIdx,
          });
        }
      }
      weeks.push(week);
      cursor.setDate(cursor.getDate() + 7);
      weekIdx++;
    }

    const activeDays = allCells.filter((c) => c.pages > 0).length;
    const totalPages = allCells.reduce((a, c) => a + c.pages, 0);
    const { current, longest } = streak(allCells);

    return { weeks, monthLabels, stats: { activeDays, totalPages, current, longest } };
  }, [sessions]);

  const maxPages = Math.max(1, ...weeks.flatMap((w) => w.map((c) => c.pages)));

  const cellColor = (cell: Cell): string => {
    if (cell.pages === 0) return "hsl(var(--border))";
    const m = cell.mood ? MOODS[cell.mood] : null;
    const intensity = 0.25 + (cell.pages / maxPages) * 0.75;
    if (!m) return `hsl(var(--foreground) / ${intensity * 0.6})`;
    return `hsl(${m.h} ${m.s}% ${m.l}% / ${intensity})`;
  };

  const totalW = weeks.length * (CELL + GAP) - GAP;

  return (
    <section className="rounded-2xl bg-card/70 p-6 border border-border/40 space-y-4">
      <div className="flex items-center gap-2">
        <CalendarRange className="h-4 w-4" style={{ color: "var(--mood-strong)" }} />
        <h3 className="font-display text-2xl">Reading heat map</h3>
        <span className="ml-auto text-[10px] uppercase tracking-widest text-muted-foreground">
          Past year
        </span>
      </div>

      <div className="overflow-x-auto pb-2">
        <div style={{ width: totalW, position: "relative" }}>
          {/* Month labels */}
          <div className="flex" style={{ height: 18, marginBottom: 4, marginLeft: 28 }}>
            {monthLabels.map((ml) => (
              <div
                key={`${ml.label}-${ml.weekIndex}`}
                className="absolute text-[10px] text-muted-foreground"
                style={{ left: ml.weekIndex * (CELL + GAP) + 28 }}
              >
                {ml.label}
              </div>
            ))}
          </div>

          {/* Grid */}
          <div className="flex gap-[3px]">
            {/* Day labels */}
            <div className="flex flex-col gap-[3px] mr-1 shrink-0">
              {DAYS.map((d, i) => (
                <div
                  key={d}
                  style={{ height: CELL, fontSize: 9 }}
                  className="flex items-center text-muted-foreground/60"
                >
                  {i % 2 === 1 ? d.slice(0, 1) : ""}
                </div>
              ))}
            </div>

            {/* Weeks */}
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-[3px]">
                {week.map((cell, di) => {
                  const isFuture = cell.date > new Date();
                  return (
                    <div
                      key={di}
                      onMouseEnter={() => !isFuture && setHovered(cell)}
                      onMouseLeave={() => setHovered(null)}
                      style={{
                        width: CELL,
                        height: CELL,
                        borderRadius: 3,
                        background: isFuture ? "transparent" : cellColor(cell),
                        opacity: isFuture ? 0 : 1,
                        cursor: cell.pages > 0 ? "default" : "default",
                        transition: "opacity 0.1s",
                      }}
                    />
                  );
                })}
              </div>
            ))}
          </div>

          {/* Tooltip */}
          {hovered && hovered.pages > 0 && (
            <div className="pointer-events-none fixed z-50 rounded-xl border border-border/60 bg-card px-3 py-2 text-xs shadow-lg space-y-0.5"
              style={{ transform: "translateX(-50%)" }}>
              <div className="font-medium">
                {hovered.date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
              </div>
              <div className="text-muted-foreground">
                {hovered.pages} pages · {hovered.sessions} session{hovered.sessions !== 1 ? "s" : ""}
                {hovered.mood && ` · ${MOODS[hovered.mood].emoji} ${MOODS[hovered.mood].label}`}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
        <span>Less</span>
        {[0.15, 0.35, 0.55, 0.75, 0.95].map((a) => (
          <div
            key={a}
            style={{ width: 11, height: 11, borderRadius: 2, background: `hsl(var(--mood-strong) / ${a})` }}
          />
        ))}
        <span>More</span>
        <div className="ml-auto flex flex-wrap gap-2">
          {(Object.keys(MOODS) as MoodKey[]).map((k) => {
            const m = MOODS[k];
            return (
              <span key={k} className="flex items-center gap-1">
                <span
                  style={{ display: "inline-block", width: 9, height: 9, borderRadius: 2, background: `hsl(${m.h} ${m.s}% ${m.l}%)` }}
                />
                {m.label}
              </span>
            );
          })}
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-4 gap-3 pt-1">
        {[
          { label: "Active days", value: stats.activeDays },
          { label: "Pages read", value: stats.totalPages.toLocaleString() },
          { label: "Best streak", value: `${stats.longest}d` },
          { label: "Current streak", value: `${stats.current}d` },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border/30 bg-background/40 p-3 text-center">
            <div className="font-display text-xl">{s.value}</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
