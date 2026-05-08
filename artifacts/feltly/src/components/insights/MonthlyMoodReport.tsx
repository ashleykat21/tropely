import { useMemo, useState } from "react";
import { useLibrary } from "@/lib/store";
import { MOODS, type MoodKey } from "@/lib/moods";
import { Button } from "@/components/ui/button";
import { Share2, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

export function MonthlyMoodReport() {
  const { sessions, books, reactionLog, journal } = useLibrary();
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const report = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const inMonth = (t: number) => {
      const d = new Date(t);
      return d.getFullYear() === year && d.getMonth() === month;
    };
    const monthSessions = sessions.filter((s) => inMonth(s.at));
    const monthReactions = reactionLog.filter((r) => inMonth(r.at));
    const monthJournal = journal.filter((j) => inMonth(j.createdAt));
    const finishedThisMonth = books.filter(
      (b) => b.shelf === "finished" && inMonth(b.addedAt + 1) // approx; uses addedAt as proxy
    );

    const moodCounts: Record<string, number> = {};
    monthSessions.forEach((s) => (moodCounts[s.mood] = (moodCounts[s.mood] || 0) + s.pagesRead));
    const dominant = (Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null) as MoodKey | null;

    const emojiCounts: Record<string, number> = {};
    monthReactions.forEach((r) => (emojiCounts[r.emoji] = (emojiCounts[r.emoji] || 0) + 1));
    const topEmojis = Object.entries(emojiCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    const totalPages = monthSessions.reduce((a, s) => a + s.pagesRead, 0);

    return {
      totalPages,
      sessionsCount: monthSessions.length,
      reactionsCount: monthReactions.length,
      journalCount: monthJournal.length,
      finishedCount: finishedThisMonth.length,
      dominant,
      topEmojis,
    };
  }, [cursor, sessions, books, reactionLog, journal]);

  const monthLabel = cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const dom = report.dominant ? MOODS[report.dominant] : null;

  const share = async () => {
    const text = `My ${monthLabel} in reading: ${report.totalPages} pages, mostly ${
      dom ? dom.label.toLowerCase() : "varied"
    } ${dom?.emoji ?? ""} · ${report.topEmojis.map(([e]) => e).join("")}`;
    try {
      if (navigator.share) await navigator.share({ text });
      else {
        await navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard.");
      }
    } catch {
      /* dismissed */
    }
  };

  return (
    <section
      className="rounded-2xl p-6 border border-border/40 space-y-5 relative overflow-hidden"
      style={
        dom
          ? {
              background: `linear-gradient(135deg, hsl(${dom.h} ${dom.s}% ${dom.l}% / 0.18), hsl(var(--card)))`,
            }
          : { background: "hsl(var(--card) / 0.7)" }
      }
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Monthly mood report</p>
          <h3 className="font-display text-2xl mt-1">{monthLabel}</h3>
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

      {report.totalPages === 0 && report.reactionsCount === 0 ? (
        <p className="text-sm text-muted-foreground">A quiet month. No pages logged yet.</p>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Pages", value: report.totalPages },
              { label: "Sessions", value: report.sessionsCount },
              { label: "Reactions", value: report.reactionsCount },
              { label: "Notes", value: report.journalCount },
            ].map((s) => (
              <div key={s.label} className="rounded-xl bg-background/40 p-3">
                <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{s.label}</div>
                <div className="font-display text-2xl mt-1">{s.value}</div>
              </div>
            ))}
          </div>

          {dom && (
            <p className="text-sm">
              You read mostly{" "}
              <span className="font-medium" style={{ color: `hsl(${dom.h} ${dom.s}% ${Math.max(20, dom.l - 20)}%)` }}>
                {dom.emoji} {dom.label.toLowerCase()}
              </span>{" "}
              this month.
            </p>
          )}

          {report.topEmojis.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Felt:</span>
              <div className="text-2xl">{report.topEmojis.map(([e]) => e).join(" ")}</div>
            </div>
          )}

          <Button variant="outline" size="sm" className="rounded-full" onClick={share}>
            <Share2 className="h-3.5 w-3.5 mr-1.5" /> Share month
          </Button>
        </>
      )}
    </section>
  );
}