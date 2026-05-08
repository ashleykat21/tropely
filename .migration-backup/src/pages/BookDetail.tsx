import { useEffect, useMemo } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { useLibrary } from "@/lib/store";
import { BookCover } from "@/components/reader/BookCover";
import { MoodChip } from "@/components/reader/MoodChip";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen, NotebookPen, Quote, Sparkles, Trash2, Clock, Share2 } from "lucide-react";
import { MOODS } from "@/lib/moods";
import { renderQuoteCard, shareOrDownload } from "@/lib/shareImage";
import { toast } from "sonner";

export default function BookDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { books, journal, sessions, reflections, setCurrent, removeBook } = useLibrary();
  const book = books.find((b) => b.id === id);

  useEffect(() => {
    if (!book) return;
    setCurrent(book.id);
  }, [book?.id]);

  const bookSessions = useMemo(
    () => sessions.filter((s) => s.bookId === id).sort((a, b) => b.at - a.at),
    [sessions, id]
  );
  const bookJournal = useMemo(
    () => journal.filter((j) => j.bookId === id).sort((a, b) => b.createdAt - a.createdAt),
    [journal, id]
  );
  const reflection = reflections.find((r) => r.bookId === id);

  if (!book) {
    return (
      <AppShell>
        <div className="max-w-xl text-center space-y-4 py-16">
          <div className="font-display text-3xl">This book has drifted off your shelf.</div>
          <Button variant="outline" className="rounded-full" onClick={() => nav("/")}>
            <ArrowLeft className="h-4 w-4 mr-1.5" /> Back home
          </Button>
        </div>
      </AppShell>
    );
  }

  const pct = Math.round((book.progress / Math.max(1, book.pages)) * 100);
  const totalSessionPages = bookSessions.reduce((a, s) => a + s.pagesRead, 0);
  const totalSessionMins = Math.round(
    bookSessions.reduce((a, s) => a + (s.durationSec ?? 0), 0) / 60
  );

  return (
    <AppShell>
      <div className="space-y-8 max-w-3xl">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition">
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </Link>

        <header className="grid sm:grid-cols-[160px_1fr] gap-6 items-start">
          <div className="w-36 mx-auto sm:mx-0">
            <BookCover src={book.cover} title={book.title} />
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <MoodChip mood={book.mood} />
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{book.shelf}</span>
            </div>
            <h1 className="font-display text-4xl leading-[1.05]">{book.title}</h1>
            <p className="text-muted-foreground">by {book.author}</p>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span>p. {book.progress}/{book.pages}</span>
              <span>· {pct}%</span>
              {(book.tags?.length ?? 0) > 0 && (
                <span className="truncate">· {book.tags!.join(" · ")}</span>
              )}
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              <Button className="rounded-full" onClick={() => { setCurrent(book.id); nav("/"); }}>
                <BookOpen className="h-4 w-4 mr-1.5" /> Open in reader
              </Button>
              <Button
                variant="outline"
                className="rounded-full text-destructive hover:text-destructive"
                onClick={() => {
                  if (confirm(`Remove "${book.title}" from your library?`)) {
                    removeBook(book.id);
                    nav("/");
                  }
                }}
              >
                <Trash2 className="h-4 w-4 mr-1.5" /> Remove
              </Button>
            </div>
          </div>
        </header>

        <div className="grid sm:grid-cols-3 gap-3">
          <div className="rounded-2xl mood-surface p-4 border border-border/40">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Sessions</div>
            <div className="font-display text-2xl mt-1">{bookSessions.length}</div>
          </div>
          <div className="rounded-2xl mood-surface p-4 border border-border/40">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Pages logged</div>
            <div className="font-display text-2xl mt-1">{totalSessionPages}</div>
          </div>
          <div className="rounded-2xl mood-surface p-4 border border-border/40">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Time read</div>
            <div className="font-display text-2xl mt-1">{totalSessionMins}m</div>
          </div>
        </div>

        {reflection && (
          <section className="rounded-2xl bg-card/70 p-6 border border-border/40 space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" style={{ color: "var(--mood-strong)" }} />
              <h2 className="font-display text-2xl">Reflection</h2>
            </div>
            <p className="text-sm text-foreground/90">{reflection.takeaway}</p>
            {reflection.favoriteQuote && (
              <p className="italic text-sm text-muted-foreground border-l-2 border-border pl-3">
                "{reflection.favoriteQuote}"
              </p>
            )}
            <div className="flex gap-2 text-[11px] text-muted-foreground pt-1">
              <span>{MOODS[reflection.arc.start].emoji} → {MOODS[reflection.arc.middle].emoji} → {MOODS[reflection.arc.end].emoji}</span>
              <span>· {reflection.rating}/5</span>
            </div>
          </section>
        )}

        <section className="rounded-2xl bg-card/70 p-6 border border-border/40 space-y-3">
          <div className="flex items-center gap-2">
            <NotebookPen className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-display text-2xl">Journal & highlights</h2>
            <span className="text-xs text-muted-foreground ml-auto">{bookJournal.length} entries</span>
          </div>
          {bookJournal.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Capture notes, quotes, or reflections from the Journal page.
            </p>
          )}
          {bookJournal.map((j) => {
            const Icon = j.kind === "quote" ? Quote : j.kind === "reflection" ? Sparkles : NotebookPen;
            return (
              <div key={j.id} className="rounded-xl border border-border/50 p-3 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <Icon className="h-3 w-3" /> {j.kind} {j.page ? `· p.${j.page}` : ""}
                  </span>
                  <span>{new Date(j.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="text-sm text-foreground/90 italic">"{j.text}"</p>
                {j.kind === "quote" && book && (
                  <div className="flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 rounded-full text-xs"
                      onClick={async () => {
                        const t = toast.loading("Creating share image…");
                        try {
                          const blob = await renderQuoteCard({
                            quote: j.text,
                            bookTitle: book.title,
                            bookAuthor: book.author,
                            page: j.page,
                          });
                          const r = await shareOrDownload(blob, `feltly-quote-${j.id}.png`);
                          toast.dismiss(t);
                          toast.success(r === "shared" ? "Shared" : "Saved to your device");
                        } catch (e: any) {
                          toast.dismiss(t);
                          toast.error(e?.message || "Couldn't create image");
                        }
                      }}
                    >
                      <Share2 className="h-3 w-3 mr-1" /> Share
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </section>

        <section className="rounded-2xl bg-card/70 p-6 border border-border/40 space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-display text-2xl">Reading sessions</h2>
          </div>
          {bookSessions.length === 0 && (
            <p className="text-sm text-muted-foreground">No sessions logged yet.</p>
          )}
          {bookSessions.map((s) => (
            <div key={s.id} className="flex items-center justify-between text-sm border-b border-border/30 last:border-0 py-1.5">
              <span>
                {MOODS[s.mood].emoji} p.{s.fromPage} → p.{s.toPage}{" "}
                <span className="text-muted-foreground">(+{s.pagesRead})</span>
              </span>
              <span className="text-[11px] text-muted-foreground">
                {new Date(s.at).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          ))}
        </section>
      </div>
    </AppShell>
  );
}