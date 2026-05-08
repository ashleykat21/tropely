import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useLibrary, type JournalEntry } from "@/lib/store";
import { REACTION_EMOJIS } from "@/lib/moods";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Quote, NotebookPen, Sparkles, Trash2, Lock, Flag } from "lucide-react";
import { cn } from "@/lib/utils";
import { AddBookDialog } from "@/components/reader/AddBookDialog";

const KINDS: { key: JournalEntry["kind"]; label: string; icon: typeof Quote }[] = [
  { key: "note", label: "Note", icon: NotebookPen },
  { key: "quote", label: "Quote", icon: Quote },
  { key: "reflection", label: "Reflection", icon: Sparkles },
];

const Journal = () => {
  const { books, journal, addJournal, removeJournal, reactToJournal, currentId } = useLibrary();
  const [bookId, setBookId] = useState<string>(currentId ?? books[0]?.id ?? "");
  const [kind, setKind] = useState<JournalEntry["kind"]>("note");
  const [text, setText] = useState("");
  const [page, setPage] = useState<number | "">("");
  const [checkpointId, setCheckpointId] = useState<string>("");
  const [revealLocked, setRevealLocked] = useState(false);

  const filtered = journal.filter((j) => j.bookId === bookId);
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
        <section className="rounded-2xl mood-surface p-5 sm:p-6 border border-border/40 shadow-soft space-y-4">
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
          <Textarea
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
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-2xl">
              {book ? `Entries · ${book.title}` : "Entries"}
            </h2>
            {filtered.some((e) => book && typeof e.page === "number" && e.page > book.progress) && (
              <button
                onClick={() => setRevealLocked((v) => !v)}
                className="text-xs text-muted-foreground underline"
              >
                {revealLocked ? "Hide locked" : "Reveal locked"}
              </button>
            )}
          </div>
          {filtered.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border/60 p-10 text-center text-muted-foreground">
              No entries yet for this book.
            </div>
          )}
          {filtered.map((e) => {
            const Icon = KINDS.find((k) => k.key === e.kind)!.icon;
            const locked = !!book && typeof e.page === "number" && e.page > book.progress;
            const hidden = locked && !revealLocked;
            return (
              <article
                key={e.id}
                className="group rounded-2xl bg-card/80 backdrop-blur border border-border/50 p-5 shadow-soft"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-widest">
                    <Icon className="h-3.5 w-3.5" />
                    {e.kind}
                    {e.page !== undefined && <span>· p. {e.page}</span>}
                    {locked && (
                      <span className="flex items-center gap-1 text-foreground/70">
                        <Lock className="h-3 w-3" /> locked
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => removeJournal(e.id)}
                    className="opacity-0 group-hover:opacity-100 transition text-muted-foreground hover:text-destructive"
                    aria-label="Delete entry"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <p
                  className={cn(
                    "text-foreground/90 transition",
                    e.kind === "quote" && "font-display text-xl italic leading-snug",
                    hidden && "blur-sm select-none pointer-events-none"
                  )}
                >
                  {hidden ? "This note is locked until you reach the checkpoint." : e.text}
                </p>
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