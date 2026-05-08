import { useMemo } from "react";
import { useLibrary } from "@/lib/store";
import { MOODS, type MoodKey } from "@/lib/moods";
import { Dna, Clock, Headphones, BookOpen, Sun, Moon, Sunset } from "lucide-react";
import { cn } from "@/lib/utils";

function timeOfDayLabel(hour: number): { label: string; Icon: typeof Sun } {
  if (hour >= 5 && hour < 12) return { label: "Morning reader", Icon: Sun };
  if (hour >= 12 && hour < 17) return { label: "Afternoon reader", Icon: Sunset };
  if (hour >= 17 && hour < 21) return { label: "Evening reader", Icon: Sunset };
  return { label: "Night owl reader", Icon: Moon };
}

export function ReadingDNA() {
  const sessions = useLibrary((s) => s.sessions);
  const books = useLibrary((s) => s.books);

  const dna = useMemo(() => {
    if (sessions.length === 0) return null;

    // --- Top 3 moods by pages read ---
    const moodPages: Partial<Record<MoodKey, number>> = {};
    for (const s of sessions) {
      moodPages[s.mood] = (moodPages[s.mood] ?? 0) + s.pagesRead;
    }
    const topMoods = (Object.entries(moodPages) as [MoodKey, number][])
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
    const totalMoodPages = topMoods.reduce((a, [, p]) => a + p, 0);

    // --- Avg session length ---
    const timedSessions = sessions.filter((s) => (s.durationSec ?? 0) > 30);
    const avgMinutes =
      timedSessions.length > 0
        ? Math.round(
            timedSessions.reduce((a, s) => a + (s.durationSec ?? 0), 0) /
              timedSessions.length /
              60
          )
        : null;

    // --- Format preference ---
    const listenedBooks = books.filter((b) => b.consumption === "listened").length;
    const readBooks = books.filter((b) => b.consumption === "read").length;
    const totalTagged = listenedBooks + readBooks;
    const listenedPct = totalTagged > 0 ? Math.round((listenedBooks / totalTagged) * 100) : null;

    // --- Peak reading hour ---
    const hourCounts: number[] = Array(24).fill(0);
    for (const s of sessions) {
      hourCounts[new Date(s.at).getHours()]++;
    }
    const peakHour = hourCounts.indexOf(Math.max(...hourCounts));
    const tod = timeOfDayLabel(peakHour);

    // --- Total pages + sessions ---
    const totalPages = sessions.reduce((a, s) => a + s.pagesRead, 0);

    return { topMoods, totalMoodPages, avgMinutes, listenedPct, tod, totalPages, sessionCount: sessions.length };
  }, [sessions, books]);

  if (!dna) {
    return (
      <section className="rounded-2xl bg-card/70 p-6 border border-border/40">
        <div className="flex items-center gap-2 mb-2">
          <Dna className="h-4 w-4" />
          <h2 className="font-display text-2xl">Reading DNA</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Log a few reading sessions to generate your Reading DNA.
        </p>
      </section>
    );
  }

  const { topMoods, totalMoodPages, avgMinutes, listenedPct, tod, totalPages, sessionCount } = dna;

  return (
    <section className="rounded-2xl bg-card/70 p-6 border border-border/40 space-y-5">
      <div>
        <div className="flex items-center gap-2">
          <Dna className="h-4 w-4" />
          <h2 className="font-display text-2xl">Reading DNA</h2>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          Your fingerprint across {sessionCount} {sessionCount === 1 ? "session" : "sessions"} · {totalPages.toLocaleString()} pages
        </p>
      </div>

      {/* Mood bar */}
      <div className="space-y-2">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Dominant moods</p>
        <div className="flex h-4 rounded-full overflow-hidden gap-px">
          {topMoods.map(([mk, pages]) => {
            const pct = (pages / totalMoodPages) * 100;
            return (
              <div
                key={mk}
                style={{
                  width: `${pct}%`,
                  background: `hsl(${MOODS[mk].h} ${MOODS[mk].s}% ${MOODS[mk].l}%)`,
                }}
                title={`${MOODS[mk].emoji} ${MOODS[mk].label} — ${Math.round(pct)}%`}
              />
            );
          })}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {topMoods.map(([mk, pages]) => {
            const pct = Math.round((pages / totalMoodPages) * 100);
            return (
              <span key={mk} className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <span
                  className="h-2.5 w-2.5 rounded-sm"
                  style={{ background: `hsl(${MOODS[mk].h} ${MOODS[mk].s}% ${MOODS[mk].l}%)` }}
                />
                {MOODS[mk].emoji} {MOODS[mk].label}
                <span className="text-[10px] opacity-70">{pct}%</span>
              </span>
            );
          })}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {/* Avg session */}
        <div className={cn(
          "rounded-xl border border-border/40 bg-background/40 p-3 space-y-1",
          !avgMinutes && "opacity-50"
        )}>
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-muted-foreground">
            <Clock className="h-3 w-3" /> Avg session
          </div>
          <div className="font-display text-xl leading-none">
            {avgMinutes !== null ? `${avgMinutes}` : "—"}
          </div>
          <div className="text-[10px] text-muted-foreground">
            {avgMinutes !== null ? "min / session" : "log timed sessions"}
          </div>
        </div>

        {/* Format split */}
        <div className={cn(
          "rounded-xl border border-border/40 bg-background/40 p-3 space-y-1",
          listenedPct === null && "opacity-50"
        )}>
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-muted-foreground">
            {(listenedPct ?? 0) >= 50
              ? <Headphones className="h-3 w-3" />
              : <BookOpen className="h-3 w-3" />}
            Format
          </div>
          <div className="font-display text-xl leading-none">
            {listenedPct !== null
              ? (listenedPct >= 50 ? `${listenedPct}%` : `${100 - listenedPct}%`)
              : "—"}
          </div>
          <div className="text-[10px] text-muted-foreground">
            {listenedPct !== null
              ? (listenedPct >= 50 ? "audio listener" : "physical reader")
              : "tag books to see"}
          </div>
        </div>

        {/* Peak time */}
        <div className="rounded-xl border border-border/40 bg-background/40 p-3 space-y-1">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-muted-foreground">
            <tod.Icon className="h-3 w-3" /> Peak time
          </div>
          <div className="font-display text-xl leading-none">
            {String(dna.tod.label.split(" ")[0]).slice(0, 4)}
          </div>
          <div className="text-[10px] text-muted-foreground">{tod.label}</div>
        </div>
      </div>
    </section>
  );
}
