import { useMemo } from "react";
import { useLibrary } from "@/lib/store";
import { useNavigate } from "react-router-dom";
import { MOODS } from "@/lib/moods";
import { Bookmark, CalendarHeart, Compass, X } from "lucide-react";

function SlumpCard() {
  const sessions = useLibrary((s) => s.sessions);
  const books = useLibrary((s) => s.books);
  const currentId = useLibrary((s) => s.currentId);

  const { daysSince, current } = useMemo(() => {
    const current =
      books.find((b) => b.id === currentId) ??
      books.find((b) => b.shelf === "reading");
    if (!sessions.length) return { daysSince: Infinity, current };
    const last = Math.max(...sessions.map((s) => s.at));
    const daysSince = Math.floor((Date.now() - last) / (1000 * 60 * 60 * 24));
    return { daysSince, current };
  }, [sessions, books, currentId]);

  const hasReading = books.some((b) => b.shelf === "reading");
  if (!hasReading || daysSince < 5) return null;

  return (
    <div className="rounded-2xl border border-border/50 bg-card/60 p-4 flex items-center gap-3">
      <span className="text-2xl leading-none shrink-0">📖</span>
      <div className="min-w-0">
        <div className="font-display text-sm">
          {daysSince === Infinity
            ? "Ready when you are."
            : `${daysSince} day${daysSince === 1 ? "" : "s"} since your last session.`}
        </div>
        <div className="text-xs text-muted-foreground mt-0.5 truncate">
          {current
            ? `"${current.title}" is waiting for you.`
            : "Your book is waiting."}
        </div>
      </div>
    </div>
  );
}

function AnniversaryCard() {
  const finishes = useLibrary((s) => s.finishes);
  const books = useLibrary((s) => s.books);

  const anniversary = useMemo(() => {
    const today = new Date();
    const todayM = today.getMonth();
    const todayD = today.getDate();
    const thisYear = today.getFullYear();

    for (const f of finishes) {
      const d = new Date(f.finishedAt);
      if (
        d.getMonth() === todayM &&
        d.getDate() === todayD &&
        d.getFullYear() < thisYear
      ) {
        const book = books.find((b) => b.id === f.bookId);
        if (book) {
          return { book, yearsAgo: thisYear - d.getFullYear() };
        }
      }
    }
    return null;
  }, [finishes, books]);

  if (!anniversary) return null;

  return (
    <div className="rounded-2xl border border-border/50 bg-card/60 p-4 flex items-center gap-3">
      <CalendarHeart
        className="h-5 w-5 shrink-0"
        style={{ color: "var(--mood-strong)" }}
      />
      <div className="min-w-0">
        <div className="font-display text-sm">
          {anniversary.yearsAgo === 1 ? "One year" : `${anniversary.yearsAgo} years`} ago today
        </div>
        <div className="text-xs text-muted-foreground truncate">
          You finished{" "}
          <span className="text-foreground font-medium">"{anniversary.book.title}"</span>{" "}
          by {anniversary.book.author}.
        </div>
      </div>
    </div>
  );
}

function MoodTBRCard() {
  const books = useLibrary((s) => s.books);
  const currentId = useLibrary((s) => s.currentId);
  const nextReadId = useLibrary((s) => s.nextReadId);
  const nav = useNavigate();

  const suggestion = useMemo(() => {
    const tbr = books.filter((b) => b.shelf === "want" && b.id !== nextReadId);
    if (!tbr.length) return null;

    const current =
      books.find((b) => b.id === currentId) ??
      books.find((b) => b.shelf === "reading");

    if (current) {
      const match = tbr.find((b) => b.mood === current.mood);
      if (match) {
        return {
          book: match,
          reason: `matches your ${MOODS[current.mood].label} mood`,
        };
      }
    }

    const recent = [...tbr].sort((a, b) => b.addedAt - a.addedAt)[0];
    return { book: recent, reason: "next on your shelf" };
  }, [books, currentId, nextReadId]);

  if (!suggestion) return null;

  return (
    <div
      className="rounded-2xl border border-border/50 bg-card/60 p-4 flex items-center gap-3 cursor-pointer hover:bg-card/80 transition"
      onClick={() => nav(`/book/${suggestion.book.id}`)}
      role="button"
      tabIndex={0}
    >
      <Compass className="h-4.5 w-4.5 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
          Consider reading next
        </div>
        <div className="font-display text-sm leading-tight truncate">
          {suggestion.book.title}
        </div>
        <div className="text-xs text-muted-foreground truncate">
          {suggestion.reason}
        </div>
      </div>
      {suggestion.book.cover && (
        <img
          src={suggestion.book.cover}
          alt=""
          className="w-8 h-11 shrink-0 rounded object-cover"
        />
      )}
    </div>
  );
}

function NextReadCard() {
  const books = useLibrary((s) => s.books);
  const nextReadId = useLibrary((s) => s.nextReadId);
  const setNextRead = useLibrary((s) => s.setNextRead);
  const nav = useNavigate();

  const book = books.find((b) => b.id === nextReadId && b.shelf === "want");
  if (!book) return null;

  return (
    <div
      className="rounded-2xl border border-foreground/20 bg-foreground/[0.03] p-4 flex items-center gap-3 cursor-pointer hover:bg-foreground/[0.05] transition"
      onClick={() => nav(`/book/${book.id}`)}
      role="button"
      tabIndex={0}
    >
      <Bookmark
        className="h-4 w-4 shrink-0"
        style={{ color: "var(--mood-strong)" }}
      />
      <div className="min-w-0 flex-1">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
          Reading next
        </div>
        <div className="font-display text-sm leading-tight truncate">{book.title}</div>
        <div className="text-xs text-muted-foreground truncate">by {book.author}</div>
      </div>
      {book.cover && (
        <img
          src={book.cover}
          alt=""
          className="w-8 h-11 shrink-0 rounded object-cover"
        />
      )}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setNextRead(null);
        }}
        className="text-muted-foreground hover:text-foreground transition p-1 rounded-full shrink-0"
        aria-label="Unpin next read"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}

export function HomeSmartCards() {
  return (
    <div className="space-y-2 w-full max-w-3xl mx-auto">
      <NextReadCard />
      <AnniversaryCard />
      <MoodTBRCard />
      <SlumpCard />
    </div>
  );
}
