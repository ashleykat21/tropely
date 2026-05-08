import { useLibrary } from "@/lib/store";
import { useMemo } from "react";

export function StatsStrip() {
  const books = useLibrary((s) => s.books);
  const sessions = useLibrary((s) => s.sessions);

  const stats = useMemo(() => {
    const finished = books.filter((b) => b.shelf === "finished");
    const pages = books.reduce((acc, b) => acc + b.progress, 0);
    const tropesAll = books.flatMap((b) => b.tropes ?? []);
    const tropeCounts: Record<string, number> = {};
    tropesAll.forEach((t) => (tropeCounts[t] = (tropeCounts[t] || 0) + 1));
    const topTrope = Object.entries(tropeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
    const totalSec = sessions
      .filter((s) => s.durationSec && s.durationSec > 0)
      .reduce((a, s) => a + (s.durationSec ?? 0), 0);
    const hoursRaw = totalSec / 3600;
    const hours = hoursRaw < 1
      ? totalSec > 0 ? `${Math.round(hoursRaw * 60)}m` : "—"
      : `${hoursRaw.toFixed(1)}h`;
    return { finished: finished.length, pages, topTrope, hours };
  }, [books, sessions]);

  const items = [
    { label: "Books finished", value: stats.finished, sub: "this year" },
    { label: "Pages read", value: stats.pages.toLocaleString(), sub: "all time" },
    { label: "Hours read", value: stats.hours, sub: "timed sessions" },
    { label: "Top trope", value: stats.topTrope, sub: "across your library" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {items.map((it) => (
        <div
          key={it.label}
          className="rounded-xl border border-border/50 bg-card/80 backdrop-blur px-3 py-2.5 shadow-soft"
        >
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground leading-tight">
            {it.label}
          </div>
          <div className="font-display text-xl mt-0.5 text-foreground leading-none">{it.value}</div>
          <div className="text-[10px] text-muted-foreground mt-1">{it.sub}</div>
        </div>
      ))}
    </div>
  );
}
