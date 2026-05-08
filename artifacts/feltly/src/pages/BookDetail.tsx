import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useLocation, Link } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { useLibrary } from "@/lib/store";
import { BookCover } from "@/components/reader/BookCover";
import { MoodChip } from "@/components/reader/MoodChip";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen, NotebookPen, Quote, Sparkles, Trash2, Clock, Share2, Globe, Loader2, Tag, Clapperboard, Pencil, X, Plus, RotateCcw, Star } from "lucide-react";
import { tropeCategory, ALL_TROPES } from "@/lib/tropes";
import { MOODS } from "@/lib/moods";
import { renderQuoteCard, shareOrDownload } from "@/lib/shareImage";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type OLResult = {
  key: string;
  title: string;
  author_name?: string[];
  cover_i?: number;
  number_of_pages_median?: number;
  first_publish_year?: number;
};

type OLData = { description: string; subjects: string[]; similar: OLResult[]; tropeBooks: OLResult[] } | null;

function useOpenLibraryData(title: string, author: string, trope: string, enabled: boolean): { data: OLData; loading: boolean } {
  const [data, setData] = useState<OLData>(null);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!enabled || !title) return;
    let cancelled = false;
    setLoading(true);
    const q = `https://openlibrary.org/search.json?title=${encodeURIComponent(title)}&author=${encodeURIComponent(author)}&limit=1&fields=key,subject`;
    fetch(q)
      .then((r) => r.json())
      .then(async (d) => {
        if (cancelled) return;
        const doc = d.docs?.[0];
        let description = "";
        let subjects: string[] = [];
        if (doc?.key) {
          const work = await fetch(`https://openlibrary.org${doc.key}.json`).then((r) => r.json()).catch(() => ({}));
          if (cancelled) return;
          description =
            typeof work.description === "string"
              ? work.description
              : typeof work.description?.value === "string"
              ? work.description.value
              : "";
          subjects = (work.subjects ?? doc.subject ?? []).slice(0, 12) as string[];
        }
        const fields = "key,title,author_name,cover_i,number_of_pages_median,first_publish_year";
        // Fetch more books by the same author
        const simRes = await fetch(
          `https://openlibrary.org/search.json?author=${encodeURIComponent(author)}&limit=10&fields=${fields}`
        ).then((r) => r.json()).catch(() => ({ docs: [] }));
        if (cancelled) return;
        const similar: OLResult[] = (simRes.docs ?? [])
          .filter((b: OLResult) => b.title.toLowerCase() !== title.toLowerCase() && b.cover_i)
          .slice(0, 6);
        // Fetch books matching the trope term
        let tropeBooks: OLResult[] = [];
        if (trope) {
          const tropeRes = await fetch(
            `https://openlibrary.org/search.json?q=${encodeURIComponent(trope)}&limit=12&fields=${fields}`
          ).then((r) => r.json()).catch(() => ({ docs: [] }));
          if (!cancelled) {
            tropeBooks = (tropeRes.docs ?? [])
              .filter((b: OLResult) => b.title.toLowerCase() !== title.toLowerCase() && b.cover_i)
              .slice(0, 6);
          }
        }
        if (!cancelled) {
          setData({ description, subjects, similar, tropeBooks });
          setLoading(false);
        }
      })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [title, author, trope, enabled]);
  return { data, loading };
}

export default function BookDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const location = useLocation();
  const focusSessionId = (location.state as { focusSessionId?: string } | null)?.focusSessionId ?? null;
  const sessionRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [highlightedSessionId, setHighlightedSessionId] = useState<string | null>(null);
  const { books, journal, sessions, reflections, readSnapshots, setCurrent, removeBook, updateBook } = useLibrary();
  const book = books.find((b) => b.id === id);
  const [tab, setTab] = useState<"overview" | "about">("overview");
  const [editingTropes, setEditingTropes] = useState(false);
  const [localTropes, setLocalTropes] = useState<string[]>([]);
  const [tropeSearch, setTropeSearch] = useState("");

  useEffect(() => {
    if (!book) return;
    setCurrent(book.id);
  }, [book?.id]);

  // When arriving with a focusSessionId (e.g. from a Companion citation),
  // scroll the matching session into view and briefly highlight it. Clear the
  // navigation state so a back/refresh doesn't re-trigger the highlight.
  useEffect(() => {
    if (!focusSessionId) return;
    const target = sessionRefs.current.get(focusSessionId);
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "center" });
    setHighlightedSessionId(focusSessionId);
    nav(location.pathname, { replace: true, state: null });
    const t = window.setTimeout(() => setHighlightedSessionId(null), 2400);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusSessionId, book?.id]);

  const bookSessions = useMemo(
    () => sessions.filter((s) => s.bookId === id).sort((a, b) => b.at - a.at),
    [sessions, id]
  );

  const pagesPerHour = useMemo(() => {
    const timed = bookSessions.filter((s) => s.durationSec && s.durationSec > 0);
    if (!timed.length) return 0;
    const totalPages = timed.reduce((a, s) => a + s.pagesRead, 0);
    const totalHrs = timed.reduce((a, s) => a + (s.durationSec ?? 0), 0) / 3600;
    return totalHrs > 0 ? Math.round(totalPages / totalHrs) : 0;
  }, [bookSessions]);
  const bookJournal = useMemo(
    () => journal.filter((j) => j.bookId === id).sort((a, b) => b.createdAt - a.createdAt),
    [journal, id]
  );
  const reflection = reflections.find((r) => r.bookId === id);
  const bookSnapshots = useMemo(
    () => (readSnapshots ?? []).filter((sn) => sn.bookId === id).sort((a, b) => a.readIndex - b.readIndex),
    [readSnapshots, id]
  );
  const firstTrope = (book?.tropes ?? [])[0] ?? "";
  const { data: olData, loading: olLoading } = useOpenLibraryData(
    book?.title ?? "",
    book?.author ?? "",
    firstTrope,
    tab === "about"
  );

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
            {/* Tropes — read or edit */}
            <div className="pt-1">
              {!editingTropes ? (
                <div className="flex flex-wrap gap-1.5 items-center">
                  {(book.tropes?.length ?? 0) === 0 && (
                    <span className="text-xs text-muted-foreground">No tropes tagged</span>
                  )}
                  {(book.tropes ?? []).map((t) => {
                    const cat = tropeCategory(t);
                    return (
                      <span
                        key={t}
                        className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/60 px-2.5 py-0.5 text-[11px]"
                      >
                        <span>{cat?.emoji ?? <Clapperboard className="h-2.5 w-2.5" />}</span>
                        {t}
                      </span>
                    );
                  })}
                  <button
                    onClick={() => { setLocalTropes(book.tropes ?? []); setTropeSearch(""); setEditingTropes(true); }}
                    className="inline-flex items-center gap-1 rounded-full border border-dashed border-border/60 px-2.5 py-0.5 text-[11px] text-muted-foreground hover:text-foreground hover:border-foreground/40 transition"
                  >
                    <Pencil className="h-2.5 w-2.5" />
                    {(book.tropes?.length ?? 0) === 0 ? "Add tropes" : "Edit"}
                  </button>
                </div>
              ) : (
                <div className="rounded-2xl border border-border/60 bg-card/60 p-3 space-y-2.5">
                  {/* Current selection */}
                  <div className="flex flex-wrap gap-1.5 min-h-[24px]">
                    {localTropes.length === 0 && (
                      <span className="text-xs text-muted-foreground">No tropes selected</span>
                    )}
                    {localTropes.map((t) => (
                      <button
                        key={t}
                        onClick={() => setLocalTropes((prev) => prev.filter((x) => x !== t))}
                        className="inline-flex items-center gap-1 rounded-full bg-foreground/10 border border-foreground/20 px-2.5 py-0.5 text-[11px] hover:bg-destructive/10 hover:border-destructive/30 transition"
                      >
                        {t} <X className="h-2.5 w-2.5 ml-0.5" />
                      </button>
                    ))}
                  </div>
                  {/* Search */}
                  <input
                    value={tropeSearch}
                    onChange={(e) => setTropeSearch(e.target.value)}
                    placeholder="Search tropes…"
                    className="w-full rounded-lg border border-border/60 bg-background/60 px-3 py-1.5 text-xs outline-none focus:border-foreground/40"
                  />
                  {/* Available tropes */}
                  <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                    {ALL_TROPES
                      .filter((t) => !localTropes.includes(t) && t.toLowerCase().includes(tropeSearch.toLowerCase()))
                      .slice(0, 24)
                      .map((t) => {
                        const cat = tropeCategory(t);
                        return (
                          <button
                            key={t}
                            onClick={() => setLocalTropes((prev) => [...prev, t])}
                            className="inline-flex items-center gap-1 rounded-full border border-border/50 bg-background/40 px-2.5 py-0.5 text-[11px] hover:bg-foreground/8 transition"
                          >
                            <span>{cat?.emoji}</span> {t}
                          </button>
                        );
                      })}
                  </div>
                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => { updateBook(book.id, { tropes: localTropes }); setEditingTropes(false); toast.success("Tropes saved."); }}
                      className="rounded-full bg-foreground text-background px-3 py-1 text-xs font-medium"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingTropes(false)}
                      className="rounded-full border border-border/60 px-3 py-1 text-xs text-muted-foreground hover:text-foreground transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
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

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
          <div className="rounded-2xl mood-surface p-4 border border-border/40">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Avg speed</div>
            <div className="font-display text-2xl mt-1">{pagesPerHour > 0 ? `${pagesPerHour}` : "—"}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">pg / hr</div>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-2">
          {(["overview", "about"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "rounded-full border px-4 py-1.5 text-sm transition capitalize",
                tab === t
                  ? "bg-foreground text-background border-foreground"
                  : "border-border hover:bg-foreground/5"
              )}
            >
              {t === "about" ? (
                <span className="inline-flex items-center gap-1.5">
                  <Globe className="h-3 w-3" /> About this book
                </span>
              ) : "Your notes"}
            </button>
          ))}
        </div>

        {/* About tab */}
        {tab === "about" && (
          <section className="space-y-5">
            {olLoading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                <Loader2 className="h-4 w-4 animate-spin" /> Fetching from Open Library…
              </div>
            )}
            {!olLoading && !olData && (
              <div className="rounded-2xl border border-dashed border-border/60 p-8 text-center text-muted-foreground text-sm">
                No Open Library data found for this title.
              </div>
            )}
            {!olLoading && olData && (
              <>
                {olData.description && (
                  <div className="reader-card rounded-2xl bg-card/70 sm:p-8 border border-border/40 reader-stack">
                    <h2 className="font-display text-2xl">About this book</h2>
                    <div className="prose-reader whitespace-pre-line text-foreground/85">
                      {olData.description.length > 800
                        ? olData.description.slice(0, 800) + "…"
                        : olData.description}
                    </div>
                  </div>
                )}
                {olData.subjects.length > 0 && (
                  <div className="rounded-2xl bg-card/70 p-6 border border-border/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-muted-foreground" />
                        <h2 className="font-display text-xl">Subjects</h2>
                      </div>
                      <span className="text-[10px] text-muted-foreground">Tap to add as trope</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {olData.subjects.map((s) => {
                        const already = (book.tropes ?? []).includes(s);
                        return (
                          <button
                            key={s}
                            onClick={() => {
                              if (already) { toast("Already tagged as a trope."); return; }
                              updateBook(book.id, { tropes: [...(book.tropes ?? []), s] });
                              toast.success(`"${s}" added as a trope.`);
                            }}
                            className={cn(
                              "rounded-full border px-3 py-1 text-xs transition flex items-center gap-1",
                              already
                                ? "border-foreground/30 bg-foreground/10 text-foreground/60 cursor-default"
                                : "border-border/60 bg-background/60 text-foreground/80 hover:border-foreground/40 hover:bg-foreground/5"
                            )}
                          >
                            {!already && <Plus className="h-2.5 w-2.5" />}
                            {s}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                {olData.similar.length > 0 && (
                  <div className="rounded-2xl bg-card/70 p-6 border border-border/40 space-y-3">
                    <h2 className="font-display text-xl">More by {book.author}</h2>
                    <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
                      {olData.similar.map((s) => (
                        <a
                          key={s.key}
                          href={`https://openlibrary.org${s.key}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-none w-24 space-y-1.5 group"
                        >
                          <div className="aspect-[2/3] rounded-lg overflow-hidden bg-muted shadow-book">
                            <img
                              src={`https://covers.openlibrary.org/b/id/${s.cover_i}-M.jpg`}
                              alt={s.title}
                              loading="lazy"
                              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                          <p className="text-[11px] text-foreground/80 leading-tight line-clamp-2">
                            {s.title}
                          </p>
                          {s.first_publish_year && (
                            <p className="text-[10px] text-muted-foreground">{s.first_publish_year}</p>
                          )}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                {olData.tropeBooks.length > 0 && firstTrope && (
                  <div className="rounded-2xl bg-card/70 p-6 border border-border/40 space-y-3">
                    <h2 className="font-display text-xl">More with "{firstTrope}"</h2>
                    <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
                      {olData.tropeBooks.map((s) => (
                        <a
                          key={s.key}
                          href={`https://openlibrary.org${s.key}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-none w-24 space-y-1.5 group"
                        >
                          <div className="aspect-[2/3] rounded-lg overflow-hidden bg-muted shadow-book">
                            <img
                              src={`https://covers.openlibrary.org/b/id/${s.cover_i}-M.jpg`}
                              alt={s.title}
                              loading="lazy"
                              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                          <p className="text-[11px] text-foreground/80 leading-tight line-clamp-2">{s.title}</p>
                          {s.author_name?.[0] && (
                            <p className="text-[10px] text-muted-foreground truncate">{s.author_name[0]}</p>
                          )}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                <p className="text-[10px] text-muted-foreground text-center">
                  Data from{" "}
                  <a
                    href={`https://openlibrary.org/search?title=${encodeURIComponent(book.title)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline underline-offset-2 hover:text-foreground"
                  >
                    Open Library
                  </a>
                </p>
              </>
            )}
          </section>
        )}

        {/* Overview tab */}
        {tab === "overview" && <>

        {reflection && (
          <section className="rounded-2xl bg-card/70 p-6 border border-border/40 space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" style={{ color: "var(--mood-strong)" }} />
              <h2 className="font-display text-2xl">Reflection</h2>
            </div>
            <div className="prose-reader text-foreground/90">{reflection.takeaway}</div>
            {reflection.favoriteQuote && (
              <p className="pull-quote">{reflection.favoriteQuote}</p>
            )}
            <div className="flex gap-2 text-[11px] text-muted-foreground pt-1">
              <span>{MOODS[reflection.arc.start].emoji} → {MOODS[reflection.arc.middle].emoji} → {MOODS[reflection.arc.end].emoji}</span>
              <span>· {reflection.rating}/5</span>
            </div>
          </section>
        )}

        {bookSnapshots.length > 0 && (
          <section className="rounded-2xl bg-card/70 p-6 border border-border/40 space-y-4">
            <div className="flex items-center gap-2">
              <RotateCcw className="h-4 w-4 text-muted-foreground" />
              <h2 className="font-display text-2xl">Mood drift</h2>
              <span className="text-xs text-muted-foreground ml-auto">
                {bookSnapshots.length} read{bookSnapshots.length !== 1 ? "s" : ""} captured
              </span>
            </div>
            {bookSnapshots.length >= 2 && (() => {
              const first = bookSnapshots[0];
              const last = bookSnapshots[bookSnapshots.length - 1];
              const changes: string[] = [];
              if (first.arc.start !== last.arc.start)
                changes.push(`opened ${MOODS[first.arc.start].label.toLowerCase()} → ${MOODS[last.arc.start].label.toLowerCase()}`);
              if (first.arc.end !== last.arc.end)
                changes.push(`landed ${MOODS[first.arc.end].label.toLowerCase()} → ${MOODS[last.arc.end].label.toLowerCase()}`);
              if (changes.length === 0)
                return (
                  <p className="text-sm text-muted-foreground -mt-1">
                    The arc has held steady across rereads — same mood signature each time.
                  </p>
                );
              return (
                <p className="text-sm text-foreground/80 -mt-1">
                  Between your first read and latest, the book {changes.join(" and ")}.
                </p>
              );
            })()}
            <div className="grid gap-3 sm:grid-cols-2">
              {bookSnapshots.map((snap) => (
                <div
                  key={snap.id}
                  className="rounded-xl border border-border/50 bg-background/50 p-4 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      {snap.readIndex === 0 ? "First read" : `Reread ${snap.readIndex}`}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(snap.finishedAt).toLocaleDateString([], { month: "short", year: "numeric" })}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-base tracking-wide">
                      {MOODS[snap.arc.start].emoji}
                      <span className="text-muted-foreground/50 mx-1 text-xs">→</span>
                      {MOODS[snap.arc.middle].emoji}
                      <span className="text-muted-foreground/50 mx-1 text-xs">→</span>
                      {MOODS[snap.arc.end].emoji}
                    </span>
                    {snap.rating > 0 && (
                      <span className="ml-auto flex items-center gap-0.5 text-[11px] text-muted-foreground">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3 w-3 ${i < snap.rating ? "fill-foreground text-foreground" : "text-muted-foreground/30"}`}
                          />
                        ))}
                      </span>
                    )}
                  </div>
                  {snap.tropes.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {snap.tropes.slice(0, 4).map((t) => (
                        <span
                          key={t}
                          className="rounded-full border border-border/50 bg-muted/50 px-2 py-0.5 text-[10px] text-muted-foreground"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                  {snap.note && (
                    <p className="text-xs text-foreground/80 italic border-l-2 border-border pl-2.5">
                      "{snap.note}"
                    </p>
                  )}
                </div>
              ))}
              {reflection && (
                <div className="rounded-xl border border-dashed border-border/50 bg-background/30 p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      {bookSnapshots.length === 0 ? "This read" : `Reread ${bookSnapshots.length}`}
                    </span>
                    <span className="text-[10px] text-muted-foreground italic">current reflection</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-base tracking-wide">
                      {MOODS[reflection.arc.start].emoji}
                      <span className="text-muted-foreground/50 mx-1 text-xs">→</span>
                      {MOODS[reflection.arc.middle].emoji}
                      <span className="text-muted-foreground/50 mx-1 text-xs">→</span>
                      {MOODS[reflection.arc.end].emoji}
                    </span>
                    <span className="ml-auto flex items-center gap-0.5 text-[11px] text-muted-foreground">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3 w-3 ${i < reflection.rating ? "fill-foreground text-foreground" : "text-muted-foreground/30"}`}
                        />
                      ))}
                    </span>
                  </div>
                </div>
              )}
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
              <div key={j.id} className="rounded-xl border border-border/50 p-4 sm:p-5 space-y-2.5 bg-background/30">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground uppercase tracking-widest">
                  <span className="inline-flex items-center gap-1.5">
                    <Icon className="h-3 w-3" /> {j.kind} {j.page ? `· p.${j.page}` : ""}
                  </span>
                  <span className="normal-case tracking-normal">{new Date(j.createdAt).toLocaleDateString()}</span>
                </div>
                {j.kind === "quote" ? (
                  <p className="pull-quote">{j.text}</p>
                ) : (
                  <div className="prose-reader text-foreground/90">{j.text}</div>
                )}
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
                          const r = await shareOrDownload(blob, `tropely-quote-${j.id}.png`);
                          toast.dismiss(t);
                          toast.success(r === "shared" ? "Shared" : "Saved to your device");
                        } catch (e: unknown) {
                          toast.dismiss(t);
                          toast.error((e instanceof Error ? e.message : null) || "Couldn't create image");
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
            <div
              key={s.id}
              ref={(el) => {
                if (el) sessionRefs.current.set(s.id, el);
                else sessionRefs.current.delete(s.id);
              }}
              data-session-id={s.id}
              className={cn(
                "flex items-center justify-between text-sm border-b border-border/30 last:border-0 py-1.5 -mx-2 px-2 rounded-md transition-colors duration-500",
                highlightedSessionId === s.id &&
                  "bg-[var(--mood-soft)] ring-2 ring-[var(--mood-strong)]/40"
              )}
            >
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
        </>}
      </div>
    </AppShell>
  );
}