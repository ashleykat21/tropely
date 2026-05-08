import { useMemo, useState } from "react";
import { useLibrary } from "@/lib/store";
import { MOODS } from "@/lib/moods";
import { useNavigate } from "react-router-dom";
import { BookCover } from "./BookCover";
import { cn } from "@/lib/utils";
import { Shuffle } from "lucide-react";
import { tropeCategory } from "@/lib/tropes";
import { toast } from "sonner";

export function MoodTbrPicker() {
  const books = useLibrary((s) => s.books);
  const setCurrent = useLibrary((s) => s.setCurrent);
  const moveShelf = useLibrary((s) => s.moveShelf);
  const nav = useNavigate();
  const [selectedTrope, setSelectedTrope] = useState<string | null>(null);

  const tbrBooks = useMemo(() => books.filter((b) => b.shelf === "want"), [books]);

  const tropeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    tbrBooks.forEach((b) => {
      (b.tropes ?? []).forEach((t) => { counts[t] = (counts[t] || 0) + 1; });
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 14);
  }, [tbrBooks]);

  const hasTaggedTropes = tropeCounts.length > 0;

  const matches = useMemo(
    () => selectedTrope ? tbrBooks.filter((b) => (b.tropes ?? []).includes(selectedTrope)) : [],
    [tbrBooks, selectedTrope]
  );

  if (tbrBooks.length === 0) return null;

  const startReading = (bookId: string) => {
    const b = books.find((x) => x.id === bookId);
    setCurrent(bookId);
    moveShelf(bookId, "reading");
    toast.success(b ? `Moved "${b.title}" to Reading.` : "Moved to Reading.");
    nav("/");
  };

  return (
    <section className="w-full max-w-3xl mx-auto rounded-xl border border-border/40 bg-card/60 backdrop-blur p-4 space-y-3">
      <p className="text-sm font-medium text-foreground leading-none">
        {hasTaggedTropes ? "What trope do you want to live next?" : "Tag tropes on your TBR to filter by story shape here."}
      </p>

      {hasTaggedTropes ? (
        <div className="flex flex-wrap gap-1.5">
          {tropeCounts.map(([trope, count]) => {
            const cat = tropeCategory(trope);
            const active = selectedTrope === trope;
            return (
              <button
                key={trope}
                onClick={() => setSelectedTrope(active ? null : trope)}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-xs flex items-center gap-1 transition",
                  active
                    ? "bg-foreground text-background border-foreground"
                    : "bg-white/70 border-border hover:bg-white"
                )}
              >
                <span>{cat?.emoji ?? "📖"}</span>
                <span>{trope}</span>
                {count > 1 && <span className="opacity-50 text-[10px]">{count}</span>}
              </button>
            );
          })}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          Open any TBR book → detail page → add tropes to enable filtering here.
        </p>
      )}

      {selectedTrope && matches.length === 0 && (
        <p className="text-xs text-muted-foreground">
          No TBR books tagged with "{selectedTrope}".
        </p>
      )}

      {matches.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wider">
            Tap a book to start reading
          </p>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {matches.slice(0, 6).map((b) => {
              const m = MOODS[b.mood as keyof typeof MOODS];
              return (
                <button
                  key={b.id}
                  onClick={() => startReading(b.id)}
                  className="group shrink-0 w-20 text-left space-y-1"
                  title={`Start "${b.title}"`}
                >
                  <div className="rounded-lg overflow-hidden transition-transform duration-150 group-hover:scale-[1.04]">
                    <BookCover src={b.cover} title={b.title} />
                  </div>
                  <div className="text-[10px] font-display leading-tight line-clamp-2 text-muted-foreground group-hover:text-foreground transition">
                    {b.title}
                  </div>
                  {m && (
                    <div className="text-[9px] text-muted-foreground/60 leading-tight">
                      {m.emoji} {m.label}
                    </div>
                  )}
                </button>
              );
            })}
            {matches.length > 6 && (
              <div className="shrink-0 w-20 flex flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border/60 text-muted-foreground text-[10px]">
                <Shuffle className="h-4 w-4" />
                +{matches.length - 6} more
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
