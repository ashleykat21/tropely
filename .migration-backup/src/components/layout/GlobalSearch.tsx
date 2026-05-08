import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLibrary } from "@/lib/store";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Search, BookOpen, NotebookPen, Quote, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const { books, journal, setCurrent } = useLibrary();
  const nav = useNavigate();

  // ⌘K / Ctrl+K shortcut
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
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
          (b.tags ?? []).some((t) => t.toLowerCase().includes(lower))
      )
      .slice(0, 8);
  }, [books, lower]);

  const journalMatches = useMemo(() => {
    if (!lower) return [];
    return journal
      .filter((j) => j.text.toLowerCase().includes(lower))
      .slice(0, 8);
  }, [journal, lower]);

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
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search books, authors, tags, journal…"
            className="border-0 shadow-none focus-visible:ring-0 px-0 h-8"
          />
          <kbd className="text-[10px] text-muted-foreground border border-border/60 rounded px-1.5 py-0.5">esc</kbd>
        </div>
        <div className="max-h-[60vh] overflow-y-auto">
          {bookMatches.length === 0 && journalMatches.length === 0 && (
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

          {journalMatches.length > 0 && (
            <div className="px-2 py-2 border-t border-border/40">
              <div className="px-2 pb-1 text-[10px] uppercase tracking-widest text-muted-foreground">Highlights & notes</div>
              {journalMatches.map((j) => {
                const book = books.find((b) => b.id === j.bookId);
                const Icon = j.kind === "quote" ? Quote : j.kind === "reflection" ? Sparkles : NotebookPen;
                return (
                  <button
                    key={j.id}
                    onClick={() => book && goBook(book.id)}
                    className="w-full flex items-start gap-3 rounded-lg px-2 py-2 hover:bg-foreground/5 text-left transition"
                  >
                    <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm line-clamp-2 italic text-foreground/90">"{j.text}"</div>
                      {book && (
                        <div className="text-[11px] text-muted-foreground truncate mt-0.5">
                          {book.title} {j.page ? `· p.${j.page}` : ""}
                        </div>
                      )}
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