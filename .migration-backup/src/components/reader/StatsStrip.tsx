import { useLibrary } from "@/lib/store";
import { useMemo } from "react";

export function StatsStrip() {
  const books = useLibrary((s) => s.books);
  const stats = useMemo(() => {
    const finished = books.filter((b) => b.shelf === "finished");
    const pages = books.reduce((acc, b) => acc + b.progress, 0);
    const reactions = books.flatMap((b) => b.reactions);
    const counts: Record<string, number> = {};
    reactions.forEach((r) => (counts[r] = (counts[r] || 0) + 1));
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
    return { finished: finished.length, pages, top };
  }, [books]);

  const items = [
    { label: "Books finished", value: stats.finished, sub: "this year" },
    { label: "Pages read", value: stats.pages.toLocaleString(), sub: "all time" },
    { label: "Top emotion", value: stats.top, sub: "most logged" },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {items.map((it) => (
        <div
          key={it.label}
          className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur p-5 shadow-soft"
        >
          <div className="text-xs uppercase tracking-widest text-muted-foreground">
            {it.label}
          </div>
          <div className="font-display text-3xl mt-1 text-foreground">{it.value}</div>
          <div className="text-xs text-muted-foreground mt-1">{it.sub}</div>
        </div>
      ))}
    </div>
  );
}
