import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLibrary } from "@/lib/store";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Search, BookOpen, NotebookPen, Quote, Sparkles, Layers, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { ALL_TROPES, tropeCategory } from "@/lib/tropes";
import { MOODS, type MoodKey } from "@/lib/moods";

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const { books, journal, setCurrent } = useLibrary();
  const nav = useNavigate();

  // ⌘K / Ctrl+K and `/` shortcuts to open global search.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
        return;
      }
      if (e.key === "/" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const target = e.target as HTMLElement | null;
        const tag = target?.tagName;
        if (
          tag === "INPUT" ||
          tag === "TEXTAREA" ||
          tag === "SELECT" ||
          target?.isContentEditable
        ) {
          return;
        }
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const lower = q.trim().toLowerCase();
  const bookMatches = useMemo(() => {
    if (!lower) return books.slice(0, 6);
    return books
      .filter(
        (b) =>
          b.title.toLowerCase().includes(lower) ||
          b.author.toLowerCase().includes(lower) ||
          (b.tags ?? []).some((t) => t.toLowerCase().includes(lower)) ||
          (b.tropes ?? []).some((t) => t.toLowerCase().includes(lower))
      )
      .slice(0, 8);
  }, [books, lower]);

  const tropeMatches = useMemo(() => {
    if (!lower || lower.length < 2) return [];
    // Prioritise tropes the user has in their library; fall back to the
    // general catalog so search still surfaces something useful.
    const ownedTropes = new Set<string>();
    books.forEach((b) => (b.tropes ?? []).forEach((t) => ownedTropes.add(t)));
    const owned = Array.from(ownedTropes).filter((t) =>
      t.toLowerCase().includes(lower)
    );
    if (owned.length > 0) return owned.slice(0, 5);
    return ALL_TROPES.filter((t) => t.toLowerCase().includes(lower)).slice(0, 5);
  }, [lower, books]);

  const journalMatches = useMemo(() => {
    if (!lower) return [];
    return journal
      .filter((j) => j.text.toLowerCase().includes(lower))
      .slice(0, 8);
  }, [journal, lower]);

  const moodMatches = useMemo(() => {
    if (!lower || lower.length < 2) return [] as { key: MoodKey; label: string; emoji: string; count: number }[];
    return (Object.keys(MOODS) as MoodKey[])
      .filter((k) => MOODS[k].label.toLowerCase().includes(lower) || k.includes(lower))
      .map((k) => ({
        key: k,
        label: MOODS[k].label,
        emoji: MOODS[k].emoji,
        count: books.filter((b) => b.mood === k).length,
      }))
      .slice(0, 5);
  }, [lower, books]);

  const goBook = (id: string) => {
    setCurrent(id);
    nav(`/book/${id}`);
    setOpen(false);
    setQ("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          className="grid h-9 w-9 place-items-center rounded-full border border-border/60 bg-card/70 hover:bg-card transition"
          aria-label="Search library"
        >
          <Search className="h-4 w-4" />
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden" aria-describedby={undefined}>
        <DialogTitle className="sr-only">Search library</DialogTitle>
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search books, authors, tags, journal…"
            className="border-0 shadow-none focus-visible:ring-0 px-0 h-8"
          />
          <kbd className="hidden sm:inline-block text-[10px] text-muted-foreground border border-border/60 rounded px-1.5 py-0.5">⌘K</kbd>
          <kbd className="text-[10px] text-muted-foreground border border-border/60 rounded px-1.5 py-0.5">esc</kbd>
        </div>
        <div className="max-h-[60vh] overflow-y-auto">
          {bookMatches.length === 0 && journalMatches.length === 0 && tropeMatches.length === 0 && moodMatches.length === 0 && (
            <div className="text-sm text-muted-foreground p-8 text-center">
              {lower ? "Nothing matches that quiet word." : "Type to search."}
            </div>
          )}

          {bookMatches.length > 0 && (
            <div className="px-2 py-2">
              <div className="px-2 pb-1 text-[10px] uppercase tracking-widest text-muted-foreground">Books</div>
              {bookMatches.map((b) => (
                <button
                  key={b.id}
                  onClick={() => goBook(b.id)}
                  className={cn(
                    "w-full flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-foreground/5 text-left transition"
                  )}
                >
                  <BookOpen className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-display truncate">{b.title}</div>
                    <div className="text-[11px] text-muted-foreground truncate">
                      {b.author} · {b.shelf}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {moodMatches.length > 0 && (
            <div className="px-2 py-2 border-t border-border/40">
              <div className="px-2 pb-1 text-[10px] uppercase tracking-widest text-muted-foreground">Moods</div>
              {moodMatches.map((m) => {
                const moodBooks = books.filter((b) => b.mood === m.key);
                return (
                  <button
                    key={m.key}
                    onClick={() => {
                      nav("/discover");
                      setOpen(false);
                      setQ("");
                    }}
                    className="w-full flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-foreground/5 text-left transition"
                  >
                    <span className="text-base shrink-0">{m.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium">{m.label}</div>
                      <div className="text-[11px] text-muted-foreground truncate">
                        {m.count > 0
                          ? `${m.count} book${m.count === 1 ? "" : "s"} in your library`
                          : "Browse this mood in Discover"}
                      </div>
                    </div>
                    <Heart className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                );
              })}
            </div>
          )}

          {tropeMatches.length > 0 && (
            <div className="px-2 py-2 border-t border-border/40">
              <div className="px-2 pb-1 text-[10px] uppercase tracking-widest text-muted-foreground">Tropes</div>
              {tropeMatches.map((trope) => {
                const cat = tropeCategory(trope);
                const tropeBooks = books.filter((b) => (b.tropes ?? []).includes(trope));
                return (
                  <button
                    key={trope}
                    onClick={() => {
                      nav("/tropes");
                      setOpen(false);
                      setQ("");
                    }}
                    className="w-full flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-foreground/5 text-left transition"
                  >
                    <Layers className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium">
                        {cat?.emoji} {trope}
                      </div>
                      {tropeBooks.length > 0 ? (
                        <div className="text-[11px] text-muted-foreground truncate">
                          {tropeBooks.map((b) => b.title).join(" · ")}
                        </div>
                      ) : (
                        <div className="text-[11px] text-muted-foreground truncate">
                          Browse this trope
                        </div>
                      )}
                    </div>
                    {tropeBooks.length > 0 && (
                      <span className="text-[11px] text-muted-foreground flex-shrink-0">
                        {tropeBooks.length} book{tropeBooks.length > 1 ? "s" : ""}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {journalMatches.length > 0 && (
            <div className="px-2 py-2 border-t border-border/40">
              <div className="px-2 pb-1 text-[10px] uppercase tracking-widest text-muted-foreground">Highlights & notes</div>
              {journalMatches.map((j) => {
                const book = books.find((b) => b.id === j.bookId);
                const Icon = j.kind === "quote" ? Quote : j.kind === "reflection" ? Sparkles : NotebookPen;
                const kindLabel =
                  j.kind === "quote" ? "Quote"
                  : j.kind === "reflection" ? "Reflection"
                  : j.kind === "trigger" ? "Trigger"
                  : j.kind === "reread" ? "Reread"
                  : "Note";
                return (
                  <button
                    key={j.id}
                    onClick={() => {
                      nav("/journal", { state: { focusEntryId: j.id, bookId: j.bookId } });
                      setOpen(false);
                      setQ("");
                    }}
                    className="w-full flex items-start gap-3 rounded-lg px-2 py-2 hover:bg-foreground/5 text-left transition"
                  >
                    <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-[10px] rounded-full border border-border/60 bg-background/60 px-1.5 py-px text-muted-foreground uppercase tracking-wider shrink-0">
                          {kindLabel}
                        </span>
                        {book && (
                          <span className="text-[11px] text-muted-foreground truncate">
                            {book.title}{j.page ? ` · p.${j.page}` : ""}
                          </span>
                        )}
                      </div>
                      <div className="text-sm line-clamp-2 italic text-foreground/90">"{j.text}"</div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}