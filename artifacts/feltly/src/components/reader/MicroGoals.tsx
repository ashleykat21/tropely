import { useMemo } from "react";
import { useLibrary } from "@/lib/store";
import { Sparkles, Coffee, Zap, BookOpen } from "lucide-react";
import { toast } from "sonner";

const MICRO_GOALS = [
  { id: "5p", label: "5 pages", pages: 5, icon: Coffee, copy: "A tiny dip — finish before your tea cools." },
  { id: "1ch", label: "1 chapter", pages: 15, icon: BookOpen, copy: "One chapter. Just the next one." },
  { id: "20m", label: "20 minutes", pages: 25, icon: Zap, copy: "Short focused burst — no phone." },
];

export function MicroGoals() {
  const { books, currentId, sessions, logSession } = useLibrary();
  const book = books.find((b) => b.id === currentId) ?? books.find((b) => b.shelf === "reading");

  const todayPages = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return sessions.filter((s) => s.at >= start.getTime()).reduce((a, s) => a + s.pagesRead, 0);
  }, [sessions]);

  if (!book) return null;

  return (
    <section className="rounded-2xl bg-card/70 p-5 border border-border/40 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4" style={{ color: "var(--mood-strong)" }} />
          <h3 className="font-display text-lg">Micro-goals</h3>
        </div>
        <span className="text-[11px] text-muted-foreground">
          {todayPages} {todayPages === 1 ? "page" : "pages"} today
        </span>
      </div>
      <p className="text-xs text-muted-foreground -mt-1">
        Tiny bites that beat a blank streak.
      </p>
      <div className="grid grid-cols-3 gap-2">
        {MICRO_GOALS.map((g) => {
          const Icon = g.icon;
          return (
            <button
              key={g.id}
              className="rounded-xl border border-border/40 bg-background/40 p-3 text-left hover:border-foreground/40 transition group"
              onClick={() => {
                logSession({
                  bookId: book.id,
                  mood: book.mood,
                  pagesRead: g.pages,
                  fromPage: book.progress,
                  toPage: book.progress + g.pages,
                });
                toast.success(`+${g.pages} pages logged`, { description: g.copy });
              }}
            >
              <Icon className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition" />
              <div className="font-display text-base mt-1">{g.label}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">+{g.pages}p</div>
            </button>
          );
        })}
      </div>
    </section>
  );
}