import { useMemo } from "react";
import { useLibrary } from "@/lib/store";
import { MOODS, type MoodKey } from "@/lib/moods";
import { BookOpen, Headphones } from "lucide-react";

const WEEKS = 8;
const MS_DAY = 86400000;

function startOfWeek(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  // Monday-aligned weeks (ISO-ish): shift so Monday = 0
  const day = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - day);
  return x;
}

export function WeeklyMoodSplit() {
  const sessions = useLibrary((s) => s.sessions);
  const books = useLibrary((s) => s.books);

  const consumptionByBook = useMemo(() => {
    const m = new Map<string, "read" | "listened" | undefined>();
    books.forEach((b) => m.set(b.id, b.consumption));
    return m;
  }, [books]);

  const weeks = useMemo(() => {
    const thisWeekStart = startOfWeek(new Date()).getTime();
    type Bucket = Record<MoodKey, { read: number; listened: number }>;
    const empty = (): Bucket =>
      Object.fromEntries(
        (Object.keys(MOODS) as MoodKey[]).map((k) => [k, { read: 0, listened: 0 }])
      ) as Bucket;
    const arr = Array.from({ length: WEEKS }, (_, i) => ({
      start: thisWeekStart - (WEEKS - 1 - i) * 7 * MS_DAY,
      buckets: empty(),
      total: 0,
    }));
    sessions.forEach((s) => {
      const wkStart = startOfWeek(new Date(s.at)).getTime();
      const slot = arr.find((a) => a.start === wkStart);
      if (!slot) return;
      const consumption = consumptionByBook.get(s.bookId);
      const bucket = slot.buckets[s.mood as MoodKey];
      if (!bucket) return;
      if (consumption === "listened") bucket.listened += s.pagesRead;
      else bucket.read += s.pagesRead;
      slot.total += s.pagesRead;
    });
    return arr;
  }, [sessions, consumptionByBook]);

  const maxTotal = Math.max(1, ...weeks.map((w) => w.total));
  const moodKeys = Object.keys(MOODS) as MoodKey[];
  const grandTotal = weeks.reduce((a, w) => a + w.total, 0);

  // Active moods (any pages this period) for compact legend.
  const activeMoods = moodKeys.filter((k) =>
    weeks.some((w) => w.buckets[k].read + w.buckets[k].listened > 0)
  );

  const fmtWeekLabel = (start: number) => {
    const d = new Date(start);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  return (
    <section className="rounded-2xl bg-card/70 p-6 border border-border/40 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-display text-2xl">Weekly mood split</h2>
          <p className="text-xs text-muted-foreground">
            Last {WEEKS} weeks · pages per mood, read vs listened
          </p>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-sm bg-foreground/70" />
            <BookOpen className="h-3 w-3" /> Read
          </span>
          <span className="inline-flex items-center gap-1">
            <span
              className="h-2.5 w-2.5 rounded-sm border border-foreground/40"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(45deg, hsl(var(--foreground) / 0.55) 0 3px, transparent 3px 5px)",
              }}
            />
            <Headphones className="h-3 w-3" /> Listened
          </span>
        </div>
      </div>

      {grandTotal === 0 ? (
        <p className="text-sm text-muted-foreground">
          Log a few reading sessions to see your weekly mood split.
        </p>
      ) : (
        <>
          <div className="flex items-end gap-2 h-44">
            {weeks.map((w) => {
              const heightPct = (w.total / maxTotal) * 100;
              return (
                <div key={w.start} className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
                  <div className="text-[10px] text-muted-foreground tabular-nums">
                    {w.total > 0 ? w.total : ""}
                  </div>
                  <div
                    className="w-full rounded-md overflow-hidden flex flex-col-reverse border border-border/40 bg-muted/40"
                    style={{
                      height: `${heightPct}%`,
                      minHeight: w.total > 0 ? 8 : 4,
                      opacity: w.total > 0 ? 1 : 0.35,
                    }}
                    title={`Week of ${fmtWeekLabel(w.start)} — ${w.total} pages`}
                  >
                    {moodKeys.map((mk) => {
                      const seg = w.buckets[mk];
                      const segTotal = seg.read + seg.listened;
                      if (segTotal === 0) return null;
                      const segPctOfTotal = (segTotal / Math.max(1, w.total)) * 100;
                      const readShare = segTotal > 0 ? seg.read / segTotal : 1;
                      const moodColor = `hsl(${MOODS[mk].h} ${MOODS[mk].s}% ${MOODS[mk].l}%)`;
                      return (
                        <div
                          key={mk}
                          className="w-full flex flex-row"
                          style={{ height: `${segPctOfTotal}%` }}
                          title={`${MOODS[mk].emoji} ${MOODS[mk].label}: ${seg.read} read · ${seg.listened} listened`}
                        >
                          <div
                            style={{
                              width: `${readShare * 100}%`,
                              background: moodColor,
                            }}
                          />
                          <div
                            style={{
                              width: `${(1 - readShare) * 100}%`,
                              background: moodColor,
                              backgroundImage:
                                "repeating-linear-gradient(45deg, hsl(var(--background) / 0.55) 0 3px, transparent 3px 5px)",
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                  <div className="text-[10px] text-muted-foreground tabular-nums">
                    {fmtWeekLabel(w.start)}
                  </div>
                </div>
              );
            })}
          </div>

          {activeMoods.length > 0 && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 pt-1">
              {activeMoods.map((mk) => (
                <span
                  key={mk}
                  className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground"
                >
                  <span
                    className="h-2.5 w-2.5 rounded-sm"
                    style={{
                      background: `hsl(${MOODS[mk].h} ${MOODS[mk].s}% ${MOODS[mk].l}%)`,
                    }}
                  />
                  {MOODS[mk].emoji} {MOODS[mk].label}
                </span>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}