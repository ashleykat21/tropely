import { useMemo, useState } from "react";
import { useLibrary } from "@/lib/store";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { MOODS, type MoodKey } from "@/lib/moods";

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

export function ReadingCalendar() {
  const { sessions, books } = useLibrary();
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const { cells, monthStats } = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const first = new Date(year, month, 1);
    const startWeekday = first.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const byDay: Record<string, { pages: number; mood?: MoodKey }> = {};
    sessions.forEach((s) => {
      const d = new Date(s.at);
      if (d.getFullYear() !== year || d.getMonth() !== month) return;
      const k = String(d.getDate());
      if (!byDay[k]) byDay[k] = { pages: 0, mood: s.mood };
      byDay[k].pages += s.pagesRead;
    });

    const cells: (null | { day: number; pages: number; mood?: MoodKey })[] = [];
    for (let i = 0; i < startWeekday; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const entry = byDay[String(d)];
      cells.push({ day: d, pages: entry?.pages ?? 0, mood: entry?.mood });
    }

    const totalPages = Object.values(byDay).reduce((a, b) => a + b.pages, 0);
    const activeDays = Object.keys(byDay).length;

    return { cells, monthStats: { totalPages, activeDays, daysInMonth } };
  }, [cursor, sessions, books]);

  const monthLabel = cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  return (
    <section className="rounded-2xl bg-card/70 p-6 border border-border/40 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4" style={{ color: "var(--mood-strong)" }} />
          <h3 className="font-display text-2xl">Reading calendar</h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            className="rounded-full h-8 w-8 grid place-items-center hover:bg-foreground/5"
            onClick={() => {
              const d = new Date(cursor);
              d.setMonth(d.getMonth() - 1);
              setCursor(d);
            }}
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="text-sm font-medium min-w-[8rem] text-center">{monthLabel}</div>
          <button
            className="rounded-full h-8 w-8 grid place-items-center hover:bg-foreground/5"
            onClick={() => {
              const d = new Date(cursor);
              d.setMonth(d.getMonth() + 1);
              setCursor(d);
            }}
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {DAY_LABELS.map((d, i) => (
          <div key={i} className="text-center text-[10px] uppercase tracking-widest text-muted-foreground py-1">
            {d}
          </div>
        ))}
        {cells.map((c, i) => {
          if (!c) return <div key={i} />;
          const m = c.mood ? MOODS[c.mood] : null;
          const intensity = Math.min(1, c.pages / 60);
          return (
            <div
              key={i}
              className="aspect-square rounded-lg border border-border/30 flex flex-col items-center justify-center text-[11px] transition relative overflow-hidden"
              style={
                m && c.pages > 0
                  ? {
                      background: `hsl(${m.h} ${m.s}% ${m.l}% / ${0.18 + intensity * 0.5})`,
                      borderColor: `hsl(${m.h} ${m.s}% ${m.l}% / 0.4)`,
                    }
                  : undefined
              }
              title={c.pages > 0 ? `${c.pages} pages` : "No pages"}
            >
              <span className="text-muted-foreground text-[10px]">{c.day}</span>
              {c.pages > 0 && <span className="text-[9px] font-display">{c.pages}p</span>}
            </div>
          );
        })}
      </div>

      <div className="flex gap-4 text-xs text-muted-foreground">
        <span>
          <span className="font-display text-foreground text-base">{monthStats.totalPages}</span> pages
        </span>
        <span>
          <span className="font-display text-foreground text-base">{monthStats.activeDays}</span>/
          {monthStats.daysInMonth} days read
        </span>
      </div>
    </section>
  );
}