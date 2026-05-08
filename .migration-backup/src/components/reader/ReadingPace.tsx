import { useMemo } from "react";
import { useLibrary, type Book } from "@/lib/store";
import { Gauge, Clock } from "lucide-react";

export function ReadingPace({ book }: { book: Book }) {
  const sessions = useLibrary((s) => s.sessions);

  const stats = useMemo(() => {
    const bookSessions = sessions.filter(
      (s) => s.bookId === book.id && (s.durationSec ?? 0) > 30 && s.pagesRead > 0
    );
    const totalPages = bookSessions.reduce((a, s) => a + s.pagesRead, 0);
    const totalSec = bookSessions.reduce((a, s) => a + (s.durationSec ?? 0), 0);
    if (totalSec === 0 || totalPages === 0) return null;
    const pagesPerHour = (totalPages / totalSec) * 3600;
    const pagesLeft = Math.max(0, book.pages - book.progress);
    const minutesToFinish = pagesPerHour > 0 ? (pagesLeft / pagesPerHour) * 60 : 0;
    return {
      pagesPerHour: Math.round(pagesPerHour),
      minutesToFinish: Math.round(minutesToFinish),
      sessionCount: bookSessions.length,
    };
  }, [sessions, book.id, book.pages, book.progress]);

  if (!stats) return null;

  const eta =
    stats.minutesToFinish < 60
      ? `${stats.minutesToFinish} min`
      : `${(stats.minutesToFinish / 60).toFixed(1)} hr`;

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border/40 bg-background/40 px-4 py-3 text-sm">
      <div className="flex items-center gap-2">
        <Gauge className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="font-display text-base">{stats.pagesPerHour}</span>
        <span className="text-xs text-muted-foreground">pages / hr</span>
      </div>
      <div className="h-4 w-px bg-border/60" />
      <div className="flex items-center gap-2">
        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">~{eta} to finish</span>
      </div>
      <span className="ml-auto text-[10px] uppercase tracking-widest text-muted-foreground">
        from {stats.sessionCount} timed {stats.sessionCount === 1 ? "session" : "sessions"}
      </span>
    </div>
  );
}
