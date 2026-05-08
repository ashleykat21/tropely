import { useMemo, useState } from "react";
import { useLibrary } from "@/lib/store";
import { MOODS } from "@/lib/moods";
import { Quote, NotebookPen, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type Filter = "all" | "quote" | "note" | "reflection";

export function HighlightsGallery() {
  const journal = useLibrary((s) => s.journal);
  const books = useLibrary((s) => s.books);
  const [filter, setFilter] = useState<Filter>("quote");

  const items = useMemo(
    () =>
      journal
        .filter((j) => (filter === "all" ? true : j.kind === filter))
        .slice(0, 30),
    [journal, filter]
  );

  const bookOf = (id: string) => books.find((b) => b.id === id);

  if (journal.length === 0) {
    return (
      <section className="rounded-2xl bg-card/70 p-6 border border-border/40">
        <h2 className="font-display text-2xl mb-2">Highlights</h2>
        <p className="text-sm text-muted-foreground">
          Save quotes and notes from the Journal page — they'll gather here.
        </p>
      </section>
    );
  }

  const tabs: { key: Filter; label: string; icon: any }[] = [
    { key: "quote", label: "Quotes", icon: Quote },
    { key: "note", label: "Notes", icon: NotebookPen },
    { key: "reflection", label: "Reflections", icon: Sparkles },
    { key: "all", label: "All", icon: NotebookPen },
  ];

  return (
    <section className="rounded-2xl bg-card/70 p-6 border border-border/40 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="font-display text-2xl">Highlights gallery</h2>
        <div className="flex flex-wrap gap-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setFilter(t.key)}
              className={cn(
                "rounded-full border px-2.5 py-1 text-xs transition flex items-center gap-1",
                filter === t.key
                  ? "bg-foreground text-background border-foreground"
                  : "bg-white/60 border-border hover:bg-white"
              )}
            >
              <t.icon className="h-3 w-3" />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No {filter}s yet.</p>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {items.map((j) => {
            const book = bookOf(j.bookId);
            const moodColor = j.mood ? MOODS[j.mood] : null;
            return (
              <div
                key={j.id}
                className="rounded-xl border border-border/50 bg-background/40 p-4 space-y-2"
                style={
                  moodColor
                    ? {
                        borderLeft: `3px solid hsl(${moodColor.h} ${moodColor.s}% ${moodColor.l}%)`,
                      }
                    : undefined
                }
              >
                {j.kind === "quote" ? (
                  <p className="font-display text-base italic leading-snug">
                    "{j.text}"
                  </p>
                ) : (
                  <p className="text-sm leading-snug whitespace-pre-wrap">{j.text}</p>
                )}
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span className="truncate">
                    {book ? `${book.title} · ${book.author}` : "Unknown book"}
                    {j.page ? ` · p.${j.page}` : ""}
                  </span>
                  <span>{new Date(j.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
