import { useMemo, useState } from "react";
import { useLibrary } from "@/lib/store";
import { MOODS } from "@/lib/moods";
import { Zap, Info } from "lucide-react";
import { cn } from "@/lib/utils";

const WORDS_PER_PAGE = 250;

type SpeedSession = {
  id: string;
  bookTitle: string;
  mood: string;
  wpm: number;
  pages: number;
  durationMin: number;
  at: number;
};

export function ReadingSpeedCalculator() {
  const { sessions, books } = useLibrary();
  const [showInfo, setShowInfo] = useState(false);

  const { timedSessions, avgWpm, fastestWpm, slowestWpm, speedTier } = useMemo(() => {
    const byBook = new Map(books.map((b) => [b.id, b]));

    const timedSessions: SpeedSession[] = sessions
      .filter((s) => s.durationSec && s.durationSec > 30 && s.pagesRead > 0)
      .map((s) => {
        const durationMin = (s.durationSec ?? 0) / 60;
        const words = s.pagesRead * WORDS_PER_PAGE;
        const wpm = Math.round(words / durationMin);
        const book = byBook.get(s.bookId);
        return {
          id: s.id,
          bookTitle: book?.title ?? "Unknown book",
          mood: s.mood,
          wpm,
          pages: s.pagesRead,
          durationMin,
          at: s.at,
        };
      })
      .filter((s) => s.wpm > 0 && s.wpm < 1500)
      .sort((a, b) => b.at - a.at);

    if (timedSessions.length === 0) {
      return { timedSessions: [], avgWpm: 0, fastestWpm: 0, slowestWpm: 0, speedTier: "" };
    }

    const wpmValues = timedSessions.map((s) => s.wpm);
    const avgWpm = Math.round(wpmValues.reduce((a, b) => a + b, 0) / wpmValues.length);
    const fastestWpm = Math.max(...wpmValues);
    const slowestWpm = Math.min(...wpmValues);

    let speedTier = "Average reader";
    if (avgWpm < 150) speedTier = "Deep & deliberate";
    else if (avgWpm < 220) speedTier = "Steady pacer";
    else if (avgWpm < 300) speedTier = "Average reader";
    else if (avgWpm < 400) speedTier = "Confident reader";
    else speedTier = "Speed reader";

    return { timedSessions, avgWpm, fastestWpm, slowestWpm, speedTier };
  }, [sessions, books]);

  if (timedSessions.length === 0) {
    return (
      <section className="rounded-2xl bg-card/70 p-6 border border-border/40 space-y-3">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4" style={{ color: "var(--mood-strong)" }} />
          <h3 className="font-display text-2xl">Reading speed</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Log sessions using the timer to start tracking your reading speed (words per minute).
        </p>
      </section>
    );
  }

  const speedPct = Math.min(1, avgWpm / 500);

  return (
    <section className="rounded-2xl bg-card/70 p-6 border border-border/40 space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4" style={{ color: "var(--mood-strong)" }} />
          <h3 className="font-display text-2xl">Reading speed</h3>
        </div>
        <button
          onClick={() => setShowInfo((v) => !v)}
          className="rounded-full h-7 w-7 grid place-items-center border border-border/60 hover:bg-foreground/5 transition text-muted-foreground"
          title="How is this calculated?"
        >
          <Info className="h-3.5 w-3.5" />
        </button>
      </div>

      {showInfo && (
        <div className="rounded-xl border border-border/40 bg-background/40 p-3 text-xs text-muted-foreground space-y-1">
          <p>
            Based on sessions where you used the timer. Assumes <strong>250 words per page</strong> — a
            common average for prose. Audiobooks and very short sessions are excluded.
          </p>
          <p className="text-[10px] opacity-70">
            Typical readers: 200–300 wpm. Speed readers: 400+ wpm. Deep readers sometimes prefer 150–200 wpm.
          </p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Average", value: avgWpm },
          { label: "Fastest", value: fastestWpm },
          { label: "Slowest", value: slowestWpm },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border/30 bg-background/40 p-3 text-center">
            <div className="font-display text-2xl">{s.value.toLocaleString()}</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">
              {s.label} <span className="text-[9px]">wpm</span>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Speed tier</span>
          <span className="font-medium">{speedTier}</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${speedPct * 100}%`, background: "var(--mood-strong)" }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>Slow</span>
          <span>Fast</span>
        </div>
      </div>

      {timedSessions.slice(0, 5).length > 0 && (
        <div className="space-y-1">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Recent timed sessions</p>
          {timedSessions.slice(0, 5).map((s) => {
            const m = MOODS[s.mood as keyof typeof MOODS];
            const speedBar = Math.min(1, s.wpm / 500);
            return (
              <div key={s.id} className="flex items-center gap-3 py-1.5 border-b border-border/30 last:border-0">
                <span className="shrink-0">{m?.emoji ?? "📖"}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs truncate">{s.bookTitle}</div>
                  <div className="text-[10px] text-muted-foreground">
                    {s.pages}p · {Math.round(s.durationMin)}min
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div
                    className="text-sm font-display tabular-nums"
                    style={{ color: s.wpm >= avgWpm ? "var(--mood-strong)" : undefined }}
                  >
                    {s.wpm}
                  </div>
                  <div className="text-[9px] text-muted-foreground">wpm</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-[11px] text-muted-foreground">
        From {timedSessions.length} timed session{timedSessions.length !== 1 ? "s" : ""}.
        Keep using the timer when logging to improve accuracy.
      </p>
    </section>
  );
}
