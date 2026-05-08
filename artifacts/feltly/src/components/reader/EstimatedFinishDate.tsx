import { useMemo } from "react";
import { useLibrary, type Book } from "@/lib/store";
import { Calendar } from "lucide-react";
import { LockedFeature } from "@/components/premium/LockedFeature";

export function EstimatedFinishDate({ book }: { book: Book }) {
  const sessions = useLibrary((s) => s.sessions);

  const result = useMemo(() => {
    const bookSessions = sessions.filter(
      (s) => s.bookId === book.id && s.pagesRead > 0
    );
    const pagesLeft = Math.max(0, book.pages - book.progress);
    if (pagesLeft === 0) return null;

    // Use book-specific sessions if we have enough, else fall back to all sessions
    const pool = bookSessions.length >= 2 ? bookSessions : sessions.filter((s) => s.pagesRead > 0).slice(0, 30);
    if (pool.length < 2) return null;

    const totalPages = pool.reduce((a, s) => a + s.pagesRead, 0);
    const minAt = Math.min(...pool.map((s) => s.at));
    const maxAt = Math.max(...pool.map((s) => s.at));
    const daySpan = Math.max(1, (maxAt - minAt) / 86_400_000);
    const pagesPerDay = totalPages / daySpan;
    if (pagesPerDay <= 0) return null;

    const daysLeft = Math.ceil(pagesLeft / pagesPerDay);
    const date = new Date(Date.now() + daysLeft * 86_400_000);
    return { date, daysLeft, pagesPerDay: Math.round(pagesPerDay) };
  }, [sessions, book.id, book.pages, book.progress]);

  if (!result) return null;

  const dateStr = result.date.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    ...(result.date.getFullYear() !== new Date().getFullYear() ? { year: "numeric" } : {}),
  });

  return (
    <LockedFeature
      title="Estimated Finish Date"
      description="See when you'll finish your book based on your reading pace. Upgrade to unlock."
    >
      <div className="flex items-center gap-2 rounded-2xl border border-border/40 bg-background/40 px-4 py-3">
        <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <div className="flex flex-wrap items-baseline gap-1.5 text-xs">
          <span className="text-muted-foreground">Finish by</span>
          <span className="font-display text-base text-foreground">{dateStr}</span>
          <span className="text-muted-foreground">
            &middot;{" "}
            {result.daysLeft === 0
              ? "today!"
              : result.daysLeft === 1
              ? "tomorrow"
              : `~${result.daysLeft} days`}
          </span>
          <span className="ml-auto text-[10px] uppercase tracking-widest text-muted-foreground">
            {result.pagesPerDay} pg/day pace
          </span>
        </div>
      </div>
    </LockedFeature>
  );
}
