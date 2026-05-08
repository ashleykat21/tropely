import { useMemo, useState, type ElementType } from "react";
import { useLibrary } from "@/lib/store";
import { MOODS } from "@/lib/moods";
import { Quote, NotebookPen, Sparkles, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePremium } from "@/lib/usePremium";
import { toast } from "sonner";

const FREE_CAP = 5;

type Filter = "all" | "quote" | "note" | "reflection";

export function HighlightsGallery() {
  const journal = useLibrary((s) => s.journal);
  const books = useLibrary((s) => s.books);
  const [filter, setFilter] = useState<Filter>("quote");
  const isPremium = usePremium((s) => s.isPremium);

  const allItems = useMemo(
    () => journal.filter((j) => (filter === "all" ? true : j.kind === filter)),
    [journal, filter]
  );

  const items = isPremium ? allItems : allItems.slice(0, FREE_CAP);
  const hiddenCount = allItems.length - items.length;

  const bookOf = (id: string) => books.find((b) => b.id === id);

  if (journal.length === 0) {
    return (
      <section className="rounded-2xl bg-card/70 p-6 border border-border/40">
        <h2 className="font-display text-2xl mb-2">Highlights</h2>
        <p className="text-sm text-muted-foreground">
          Save quotes and notes from the Journal page &mdash; they&apos;ll gather here.
        </p>
      </section>
    );
  }

  const tabs: { key: Filter; label: string; icon: ElementType }[] = [
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
        <>
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
                      ? { borderLeft: `3px solid hsl(${moodColor.h} ${moodColor.s}% ${moodColor.l}%)` }
                      : undefined
                  }
                >
                  {j.kind === "quote" ? (
                    <p className="font-display text-base italic leading-snug">
                      &ldquo;{j.text}&rdquo;
                    </p>
                  ) : (
                    <p className="text-sm leading-snug whitespace-pre-wrap">{j.text}</p>
                  )}
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span className="truncate">
                      {book ? `${book.title} \u00b7 ${book.author}` : "Unknown book"}
                      {j.page ? ` \u00b7 p.${j.page}` : ""}
                    </span>
                    <span>{new Date(j.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Premium upsell when capped */}
          {!isPremium && hiddenCount > 0 && (
            <button
              onClick={() =>
                toast("Unlock your full highlights gallery", {
                  description: `${hiddenCount} more ${hiddenCount === 1 ? "entry" : "entries"} hidden. Upgrade to Premium to see everything.`,
                  icon: <Sparkles className="h-4 w-4" />,
                })
              }
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-dashed border-border/60 py-4 text-sm text-muted-foreground hover:bg-foreground/5 transition"
            >
              <Lock className="h-3.5 w-3.5" />
              {hiddenCount} more {hiddenCount === 1 ? "entry" : "entries"} &mdash; Premium
            </button>
          )}
        </>
      )}
    </section>
  );
}
