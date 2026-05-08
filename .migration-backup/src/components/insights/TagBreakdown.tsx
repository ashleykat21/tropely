import { useMemo } from "react";
import { useLibrary } from "@/lib/store";

export function TagBreakdown() {
  const { books } = useLibrary();

  const counts = useMemo(() => {
    const m = new Map<string, number>();
    books.forEach((b) => (b.tags ?? []).forEach((t) => m.set(t, (m.get(t) ?? 0) + 1)));
    return [...m.entries()].sort((a, z) => z[1] - a[1]).slice(0, 12);
  }, [books]);

  if (counts.length === 0) {
    return (
      <section className="rounded-2xl bg-card/70 p-6 border border-border/40">
        <h2 className="font-display text-2xl mb-1">Genres & themes</h2>
        <p className="text-sm text-muted-foreground">
          Add genres or themes (e.g. <em>grief, ocean, literary</em>) to your books to see your
          taste fingerprint emerge.
        </p>
      </section>
    );
  }

  const max = Math.max(...counts.map(([, v]) => v));

  return (
    <section className="rounded-2xl bg-card/70 p-6 border border-border/40 space-y-4">
      <div>
        <h2 className="font-display text-2xl">Genres & themes</h2>
        <p className="text-xs text-muted-foreground">What your shelves are made of.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {counts.map(([tag, v]) => {
          const weight = 0.35 + (v / max) * 0.65;
          return (
            <span
              key={tag}
              className="rounded-full px-3 py-1.5 text-sm border border-border/60"
              style={{
                background: `hsl(var(--mood-h) var(--mood-s) var(--mood-l) / ${weight * 0.25})`,
                fontSize: `${0.8 + (v / max) * 0.4}rem`,
              }}
            >
              {tag} <span className="text-muted-foreground">· {v}</span>
            </span>
          );
        })}
      </div>
    </section>
  );
}