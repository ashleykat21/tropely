import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { useLibrary, type JournalEntry } from "@/lib/store";
import { REACTION_EMOJIS } from "@/lib/moods";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Quote, NotebookPen, Sparkles, Trash2, Lock, Flag, Search, X, Zap, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { AddBookDialog } from "@/components/reader/AddBookDialog";
import { toast } from "sonner";

const SAVED_LABEL: Record<JournalEntry["kind"], string> = {
  note: "Note saved.",
  quote: "Quote saved.",
  reflection: "Reflection saved.",
  trigger: "Trigger saved.",
  reread: "Reread note saved.",
};

const PROMPTS: Record<JournalEntry["kind"], string[]> = {
  note: [
    "What surprised me in this chapter…",
    "A detail I don't want to forget…",
    "Something that felt off — or exactly right…",
  ],
  quote: [
    "The line I can't stop thinking about…",
    "A sentence that hit harder than expected…",
    "The most beautiful line so far…",
  ],
  reflection: [
    "What did this chapter stir up in me?",
    "How did the mood shift here?",
    "Which character am I rooting for — and why?",
  ],
  trigger: [
    "This moment caught me off guard…",
    "I felt it in my chest when…",
  ],
  reread: [
    "What brought me back to this book…",
    "I kept thinking about this story because…",
  ],
};

const KINDS: { key: JournalEntry["kind"]; label: string; icon: typeof Quote }[] = [
  { key: "note", label: "Note", icon: NotebookPen },
  { key: "quote", label: "Quote", icon: Quote },
  { key: "reflection", label: "Reflection", icon: Sparkles },
  { key: "trigger", label: "Trigger", icon: Zap },
  { key: "reread", label: "Reread", icon: RotateCcw },
];

const Journal = () => {
  const { books, journal, addJournal, removeJournal, reactToJournal, currentId } = useLibrary();
  const [bookId, setBookId] = useState<string>(currentId ?? books[0]?.id ?? "");
  const [kind, setKind] = useState<JournalEntry["kind"]>("note");
  const [text, setText] = useState("");
  const [page, setPage] = useState<number | "">("");
  const [checkpointId, setCheckpointId] = useState<string>("");
  const [revealLocked, setRevealLocked] = useState(false);
  const [search, setSearch] = useState("");
  const ALL_ID = "__all__";

  const composerRef = useRef<HTMLTextAreaElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const [focusedEntryId, setFocusedEntryId] = useState<string | null>(null);
  const entryRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    const state = location.state as
      | {
          prefill?: { bookId?: string; kind?: JournalEntry["kind"]; text?: string; page?: number };
          focusEntryId?: string;
          bookId?: string;
        }
      | null;
    const p = state?.prefill;
    if (p) {
      if (p.bookId && books.some((b) => b.id === p.bookId)) setBookId(p.bookId);
      if (p.kind) setKind(p.kind);
      if (p.text) setText(p.text);
      if (typeof p.page === "number") setPage(p.page);
      toast.success("Captured highlight ready — review and save.");
      navigate(location.pathname, { replace: true, state: null });
      requestAnimationFrame(() => {
        composerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        setTimeout(() => composerRef.current?.focus(), 250);
      });
      return;
    }
    if (state?.focusEntryId) {
      const targetId = state.focusEntryId;
      const targetEntry = journal.find((j) => j.id === targetId);
      if (targetEntry) {
        if (state.bookId && books.some((b) => b.id === state.bookId)) {
          setBookId(state.bookId);
        } else {
          setBookId(targetEntry.bookId);
        }
        // Reveal locked notes so the cited one is visible.
        const owningBook = books.find((b) => b.id === targetEntry.bookId);
        if (
          owningBook &&
          typeof targetEntry.page === "number" &&
          targetEntry.page > owningBook.progress
        ) {
          setRevealLocked(true);
        }
        setSearch("");
        setFocusedEntryId(targetId);
      } else {
        toast("That note isn't in your journal anymore.");
      }
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location, navigate, books, journal]);

  // Scroll to and clear the highlight after a moment.
  useEffect(() => {
    if (!focusedEntryId) return;
    const el = entryRefs.current[focusedEntryId];
    if (el) {
      requestAnimationFrame(() => {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    }
    const t = setTimeout(() => setFocusedEntryId(null), 2400);
    return () => clearTimeout(t);
  }, [focusedEntryId, bookId]);

  const filtered = useMemo(() => {
    const byBook = bookId === ALL_ID ? journal : journal.filter((j) => j.bookId === bookId);
    const q = search.trim().toLowerCase();
    return q ? byBook.filter((j) => j.text.toLowerCase().includes(q)) : byBook;
  }, [journal, bookId, search]);

  const book = books.find((b) => b.id === bookId);
  const checkpoints = book?.checkpoints ?? [];

  if (books.length === 0) {
    return (
      <AppShell>
        <div className="space-y-8 max-w-3xl">
          <header className="space-y-2 animate-fade-up">
            <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Journal</p>
            <h1 className="font-display text-4xl sm:text-5xl leading-[1.05]">
              Hold onto what{" "}
              <span className="italic" style={{ color: "var(--mood-strong)" }}>
                moves you
              </span>
              .
            </h1>
          </header>
          <div className="rounded-2xl border border-dashed border-border/60 p-10 text-center space-y-3">
            <p className="text-muted-foreground">
              Your journal lives next to your books. Add one to start capturing notes,
              quotes, and reflections.
            </p>
            <div className="flex justify-center">
              <AddBookDialog />
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  const submit = () => {
    if (!text.trim() || !bookId) return;
    let effectivePage = typeof page === "number" ? page : undefined;
    if (checkpointId) {
      const cp = checkpoints.find((c) => c.id === checkpointId);
      if (cp) effectivePage = cp.page;
    }
    addJournal({ bookId, kind, text: text.trim(), page: effectivePage });
    toast.success(SAVED_LABEL[kind]);
    setText("");
    setPage("");
    setCheckpointId("");
  };

  return (
    <AppShell>
      <div className="space-y-8 max-w-3xl">
        <header className="space-y-2 animate-fade-up">
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Journal</p>
          <h1 className="font-display text-4xl sm:text-5xl leading-[1.05]">
            Hold onto what{" "}
            <span className="italic" style={{ color: "var(--mood-strong)" }}>
              moves you
            </span>
            .
          </h1>
        </header>

        {/* Book selector */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setBookId(ALL_ID)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm transition",
              bookId === ALL_ID
                ? "bg-foreground text-background border-foreground"
                : "bg-card/70 border-border hover:bg-card"
            )}
          >
            All books
          </button>
          {books.map((b) => (
            <button
              key={b.id}
              onClick={() => setBookId(b.id)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm transition",
                bookId === b.id
                  ? "bg-foreground text-background border-foreground"
                  : "bg-card/70 border-border hover:bg-card"
              )}
            >
              {b.title}
            </button>
          ))}
        </div>

        {/* Composer */}
        <section className="reader-card rounded-2xl mood-surface sm:p-6 border border-border/40 shadow-soft reader-stack">
          <div className="flex flex-wrap gap-2">
            {KINDS.map((k) => (
              <button
                key={k.key}
                onClick={() => setKind(k.key)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-sm flex items-center gap-1.5 transition",
                  kind === k.key
                    ? "bg-foreground text-background border-foreground"
                    : "bg-white/60 border-border hover:bg-white"
                )}
              >
                <k.icon className="h-3.5 w-3.5" />
                {k.label}
              </button>
            ))}
          </div>
          {/* Writing prompts */}
          <div className="flex flex-wrap gap-1.5">
            {PROMPTS[kind].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setText((prev) => prev ? prev : p)}
                className="rounded-full border border-border/50 bg-white/50 px-2.5 py-1 text-[11px] text-muted-foreground hover:text-foreground hover:bg-white/80 transition text-left"
              >
                {p}
              </button>
            ))}
          </div>
          <Textarea
            ref={composerRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={
              kind === "quote"
                ? "“The line you can't stop thinking about…”"
                : kind === "reflection"
                ? "What did this chapter stir up?"
                : "Anything you want to remember…"
            }
            className="min-h-[120px] bg-white/70 border-border/60"
          />
          <div className="flex items-end gap-3">
            <div className="w-32">
              <Label className="text-xs">Page</Label>
              <Input
                type="number"
                value={page}
                onChange={(e) => setPage(e.target.value ? parseInt(e.target.value) : "")}
                placeholder="—"
                className="bg-white/70"
                disabled={!!checkpointId}
              />
            </div>
            <Button onClick={submit} className="ml-auto rounded-full">
              Save entry
            </Button>
          </div>

          {checkpoints.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1">
                <Flag className="h-3 w-3" /> Lock to checkpoint (optional)
              </Label>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setCheckpointId("")}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-xs transition",
                    checkpointId === ""
                      ? "bg-foreground text-background border-foreground"
                      : "bg-white/60 border-border hover:bg-white"
                  )}
                >
                  None
                </button>
                {checkpoints.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCheckpointId(c.id)}
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-xs transition",
                      checkpointId === c.id
                        ? "bg-foreground text-background border-foreground"
                        : "bg-white/60 border-border hover:bg-white"
                    )}
                  >
                    p.{c.page} · {c.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Entries */}
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h2 className="font-display text-2xl">
              {bookId === ALL_ID ? "All entries" : book ? `Entries · ${book.title}` : "Entries"}
            </h2>
            <div className="flex items-center gap-2 ml-auto">
              {filtered.some((e) => book && typeof e.page === "number" && e.page > book.progress) && (
                <button
                  onClick={() => setRevealLocked((v) => !v)}
                  className="text-xs text-muted-foreground underline"
                >
                  {revealLocked ? "Hide locked" : "Reveal locked"}
                </button>
              )}
            </div>
          </div>
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search entries…"
              className="w-full rounded-xl border border-border/60 bg-card/60 pl-9 pr-9 py-2 text-sm outline-none focus:border-foreground/40 transition"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          {filtered.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border/60 p-10 text-center space-y-3">
              {search ? (
                <p className="text-muted-foreground">No entries match &ldquo;{search}&rdquo;.</p>
              ) : (
                <>
                  <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-foreground/5">
                    <NotebookPen className="h-5 w-5" style={{ color: "var(--mood-strong)" }} />
                  </div>
                  <div className="space-y-1">
                    <div className="font-display text-xl">Capture your first note or quote.</div>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto">
                      Anything that moves you — a line, a question, a feeling. It&apos;ll live next to the page you&apos;re on.
                    </p>
                  </div>
                  <div className="flex justify-center pt-1">
                    <Button
                      className="rounded-full gap-1.5"
                      onClick={() => {
                        composerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                        setTimeout(() => composerRef.current?.focus(), 250);
                      }}
                    >
                      <NotebookPen className="h-3.5 w-3.5" /> Write your first note
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
          {filtered.map((e) => {
            const Icon = (KINDS.find((k) => k.key === e.kind)?.icon ?? NotebookPen);
            const entryBook = books.find((b) => b.id === e.bookId);
            const locked = !!entryBook && typeof e.page === "number" && e.page > entryBook.progress;
            const hidden = locked && !revealLocked;
            return (
              <article
                key={e.id}
                ref={(node) => {
                  entryRefs.current[e.id] = node;
                }}
                className={cn(
                  "group rounded-2xl bg-card/80 backdrop-blur border border-border/50 p-5 shadow-soft transition",
                  focusedEntryId === e.id && "ring-2 ring-foreground/60 shadow-lg",
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-widest">
                    <Icon className="h-3.5 w-3.5" />
                    {e.kind}
                    {e.page !== undefined && <span>· p. {e.page}</span>}
                    {bookId === ALL_ID && entryBook && (
                      <span className="normal-case tracking-normal border border-border/60 rounded-full px-2 py-0.5 bg-background/40">
                        {entryBook.title}
                      </span>
                    )}
                    {locked && (
                      <span className="flex items-center gap-1 text-foreground/70">
                        <Lock className="h-3 w-3" /> locked
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => removeJournal(e.id)}
                    className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition text-muted-foreground hover:text-destructive"
                    aria-label="Delete entry"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                {hidden ? (
                  <p className="text-foreground/70 italic blur-sm select-none pointer-events-none">
                    This note is locked until you reach the checkpoint.
                  </p>
                ) : e.kind === "quote" ? (
                  <p className="pull-quote">{e.text}</p>
                ) : (
                  <div className="prose-reader text-foreground/90">{e.text}</div>
                )}
                <div className="text-[11px] text-muted-foreground mt-3">
                  {new Date(e.createdAt).toLocaleString()}
                </div>
                {!hidden && (
                  <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                    {(e.reactions ?? []).length > 0 && (
                      <div className="text-base mr-1">{(e.reactions ?? []).join(" ")}</div>
                    )}
                    <div className="flex items-center gap-0.5 rounded-full bg-background/60 border border-border/40 px-1.5 py-0.5">
                      {REACTION_EMOJIS.slice(0, 6).map((em) => (
                        <button
                          key={em}
                          onClick={() => reactToJournal(e.id, em)}
                          className="text-sm hover:scale-125 transition px-1"
                          aria-label={`React ${em}`}
                        >
                          {em}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </section>
      </div>
    </AppShell>
  );
};

export default Journal;