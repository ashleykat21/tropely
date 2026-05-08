import { useState, useRef } from "react";
import { ChevronDown, ChevronUp, Info, BookOpen, NotebookPen, Quote, MessageCircle, Brain, X, Pencil, Pin, Plus, RotateCcw, Check } from "lucide-react";
import type { Book } from "@/lib/store";
import type { JournalEntry, SessionLog } from "@/lib/store";
import { cn } from "@/lib/utils";

const MAX_PINNED = 5;
const MAX_MANUAL_CHARS = 2000;
const MAX_FACT_CHARS = 200;

type Props = {
  book: Book;
  inScopeJournal: JournalEntry[];
  inScopeSessions: SessionLog[];
  totalJournalForBook: number;
  useNotes: boolean;
  useHighlights: boolean;
  useSessionNotes: boolean;
  onToggleNotes: (v: boolean) => void;
  onToggleHighlights: (v: boolean) => void;
  onToggleSessionNotes: (v: boolean) => void;
  pastSummary: {
    summary: string;
    uptoPage: number | null;
    updatedAt: string;
    manualSummary: string | null;
    pinnedFacts: string[];
  } | null;
  memoryInScope: boolean;
  useMemory: boolean;
  onToggleMemory: (v: boolean) => void;
  onForgetMemory: () => void;
  /** Called whenever the reader saves manual summary or pinned facts. */
  onSaveMemory: (manualSummary: string | null, pinnedFacts: string[]) => Promise<void>;
  /** Clears both manual summary and pinned facts (reset to auto). */
  onResetToAuto: () => Promise<void>;
};

const KIND_ICON: Record<string, typeof Quote> = {
  quote: Quote,
  note: NotebookPen,
  reflection: MessageCircle,
  trigger: MessageCircle,
  reread: NotebookPen,
};

export function WhatIKnowPanel({
  book,
  inScopeJournal,
  inScopeSessions,
  totalJournalForBook,
  useNotes,
  useHighlights,
  useSessionNotes,
  onToggleNotes,
  onToggleHighlights,
  onToggleSessionNotes,
  pastSummary,
  memoryInScope,
  useMemory,
  onToggleMemory,
  onForgetMemory,
  onSaveMemory,
  onResetToAuto,
}: Props) {
  const [open, setOpen] = useState(true);

  // Summary edit state
  const [editing, setEditing] = useState(false);
  const [editDraft, setEditDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);

  // Pinned facts state
  const [addingFact, setAddingFact] = useState(false);
  const [factDraft, setFactDraft] = useState("");
  const factInputRef = useRef<HTMLInputElement>(null);

  const highlights = inScopeJournal.filter((j) => j.kind === "quote");
  const notes = inScopeJournal.filter((j) => j.kind !== "quote");
  const hiddenPastPage = totalJournalForBook - inScopeJournal.length;

  // Derive display values; safe when pastSummary is null
  const pinnedFacts = pastSummary?.pinnedFacts ?? [];
  const displayedSummary = pastSummary?.manualSummary ?? pastSummary?.summary ?? "";
  const hasManualEdit = !!pastSummary?.manualSummary;
  // Show reset when there's anything to reset (manual edits OR pinned facts)
  const hasUserCustomization = hasManualEdit || pinnedFacts.length > 0;

  const startEdit = () => {
    setEditDraft(displayedSummary);
    setEditing(true);
    setResetConfirm(false);
  };

  const cancelEdit = () => {
    setEditing(false);
    setEditDraft("");
    setResetConfirm(false);
  };

  const saveEdit = async () => {
    setSaving(true);
    try {
      const trimmed = editDraft.trim();
      await onSaveMemory(trimmed || null, pinnedFacts);
      setEditing(false);
      setEditDraft("");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    setSaving(true);
    try {
      await onResetToAuto();
      setResetConfirm(false);
      setEditing(false);
      setEditDraft("");
    } finally {
      setSaving(false);
    }
  };

  const startAddFact = () => {
    setAddingFact(true);
    setFactDraft("");
    setTimeout(() => factInputRef.current?.focus(), 60);
  };

  const confirmAddFact = async () => {
    const trimmed = factDraft.trim();
    if (!trimmed) return;
    setSaving(true);
    try {
      // onSaveMemory creates a stub row server-side if no summary row exists yet
      await onSaveMemory(pastSummary?.manualSummary ?? null, [...pinnedFacts, trimmed]);
      setAddingFact(false);
      setFactDraft("");
    } finally {
      setSaving(false);
    }
  };

  const removeFact = async (index: number) => {
    const next = pinnedFacts.filter((_, i) => i !== index);
    setSaving(true);
    try {
      await onSaveMemory(pastSummary?.manualSummary ?? null, next);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-2xl border border-border/50 bg-card/60 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-foreground/[0.02] transition"
      >
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4" style={{ color: "var(--mood-strong)" }} />
          <span className="font-medium text-sm">What I know</span>
          <span className="text-xs text-muted-foreground">
            {inScopeJournal.length + inScopeSessions.length + (pastSummary ? 1 : 0)} item
            {inScopeJournal.length + inScopeSessions.length + (pastSummary ? 1 : 0) === 1 ? "" : "s"} in scope
          </span>
        </div>
        {open ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 text-sm border-t border-border/40">
          <div className="flex items-start gap-2 pt-3">
            <BookOpen className="h-3.5 w-3.5 mt-0.5 text-muted-foreground" />
            <div className="space-y-0.5">
              <div>
                <span className="font-medium">{book.title}</span>{" "}
                <span className="text-muted-foreground">· page {book.progress}/{book.pages}</span>
              </div>
              <div className="text-xs text-muted-foreground">
                Mood: <span className="capitalize">{book.mood}</span>
              </div>
            </div>
          </div>

          {/* ───────────── Past conversations memory ───────────── */}
          {/* This section is ALWAYS visible so readers can add pinned facts
              for any book, even before the auto-summary has generated. */}
          <div className="space-y-2">
            {/* Section header — Forget + toggle only shown once a row exists */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs uppercase tracking-widest text-muted-foreground">
                <Brain className="h-3 w-3" />
                Past conversations
              </div>
              {pastSummary && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={onForgetMemory}
                    className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/60 px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground transition"
                    aria-label="Forget past-conversation memory"
                    title="Forget all memory for this book"
                  >
                    <X className="h-2.5 w-2.5" /> Forget
                  </button>
                  <ToggleChip
                    active={useMemory}
                    onChange={onToggleMemory}
                    label={useMemory ? "Using" : "Off"}
                  />
                </div>
              )}
            </div>

            {/* ── Pinned reminders — always editable, not gated by pastSummary ── */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-muted-foreground">
                  <Pin className="h-2.5 w-2.5" />
                  Pinned reminders
                  <span className="normal-case tracking-normal text-muted-foreground/60 ml-0.5">
                    ({pinnedFacts.length}/{MAX_PINNED})
                  </span>
                </div>
                {pinnedFacts.length < MAX_PINNED && !addingFact && !editing && (
                  <button
                    type="button"
                    onClick={startAddFact}
                    className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground hover:text-foreground transition"
                  >
                    <Plus className="h-2.5 w-2.5" /> Add
                  </button>
                )}
              </div>

              {pinnedFacts.length === 0 && !addingFact && (
                <p className="text-[11px] text-muted-foreground/70 italic pl-0.5">
                  Pin facts the Companion should always remember — like "I'm reading with my book club" or "skip spoilers about the prologue."
                </p>
              )}

              {pinnedFacts.length > 0 && (
                <ul className="space-y-1">
                  {pinnedFacts.map((fact, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-1.5 rounded-lg bg-background/70 px-2.5 py-1.5 text-xs"
                    >
                      <Pin className="h-2.5 w-2.5 mt-0.5 text-muted-foreground shrink-0" />
                      <span className="flex-1 leading-snug">{fact}</span>
                      <button
                        type="button"
                        onClick={() => removeFact(i)}
                        disabled={saving}
                        className="ml-1 text-muted-foreground hover:text-foreground transition shrink-0"
                        aria-label="Remove pinned reminder"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {addingFact && (
                <div className="space-y-1.5">
                  <input
                    ref={factInputRef}
                    type="text"
                    value={factDraft}
                    onChange={(e) => setFactDraft(e.target.value.slice(0, MAX_FACT_CHARS))}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") { e.preventDefault(); void confirmAddFact(); }
                      if (e.key === "Escape") { setAddingFact(false); setFactDraft(""); }
                    }}
                    placeholder="e.g. I'm reading this with my book club"
                    className="w-full rounded-lg border border-border/60 bg-background/80 px-2.5 py-1.5 text-xs placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-foreground/20"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={confirmAddFact}
                      disabled={!factDraft.trim() || saving}
                      className="inline-flex items-center gap-1 rounded-full bg-foreground text-background px-2.5 py-1 text-[10px] uppercase tracking-wider disabled:opacity-40 transition"
                    >
                      <Check className="h-2.5 w-2.5" /> Pin it
                    </button>
                    <button
                      type="button"
                      onClick={() => { setAddingFact(false); setFactDraft(""); }}
                      className="text-[10px] text-muted-foreground hover:text-foreground transition"
                    >
                      Cancel
                    </button>
                    <span className="ml-auto text-[10px] text-muted-foreground/60">
                      {factDraft.length}/{MAX_FACT_CHARS}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* ── Auto/manual summary — only when pastSummary exists and in scope ── */}
            {pastSummary && useMemory && memoryInScope && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-muted-foreground">
                    <Brain className="h-2.5 w-2.5" />
                    {hasManualEdit ? "Your edited summary" : "Auto-generated summary"}
                  </div>
                  {!editing && !addingFact && (
                    <button
                      type="button"
                      onClick={startEdit}
                      className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground hover:text-foreground transition"
                    >
                      <Pencil className="h-2.5 w-2.5" /> Edit
                    </button>
                  )}
                </div>

                {!editing && (
                  <>
                    <div className="rounded-lg bg-background/70 px-2.5 py-2 text-xs whitespace-pre-line leading-relaxed">
                      {displayedSummary || (
                        <span className="text-muted-foreground/60 italic">No summary yet.</span>
                      )}
                      <div className="mt-1 text-[10px] text-muted-foreground">
                        {hasManualEdit
                          ? "Manually edited · auto-refresh keeps adding but won't overwrite your edits."
                          : (
                            <>
                              Captured{" "}
                              {pastSummary.uptoPage !== null
                                ? `around p.${pastSummary.uptoPage}`
                                : "from earlier sessions"}
                              .
                            </>
                          )}
                      </div>
                    </div>
                    {/* Reset link — shown whenever there are user customizations (edits OR pinned facts) */}
                    {hasUserCustomization && (
                      <div>
                        {resetConfirm ? (
                          <span className="text-[10px] text-muted-foreground">
                            Discard your edits and pinned facts?{" "}
                            <button
                              type="button"
                              onClick={handleReset}
                              disabled={saving}
                              className="text-foreground underline underline-offset-2 hover:no-underline transition"
                            >
                              Yes, reset
                            </button>
                            {" · "}
                            <button
                              type="button"
                              onClick={() => setResetConfirm(false)}
                              className="text-muted-foreground hover:text-foreground transition"
                            >
                              Keep mine
                            </button>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setResetConfirm(true)}
                            className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition"
                          >
                            <RotateCcw className="h-2.5 w-2.5" /> Reset to auto-summary
                          </button>
                        )}
                      </div>
                    )}
                  </>
                )}

                {editing && (
                  <div className="space-y-2">
                    <textarea
                      value={editDraft}
                      onChange={(e) => setEditDraft(e.target.value.slice(0, MAX_MANUAL_CHARS))}
                      rows={6}
                      className="w-full rounded-lg border border-border/60 bg-background/80 px-2.5 py-2 text-xs leading-relaxed placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-foreground/20 resize-y"
                      placeholder="Write anything you want the Companion to remember…"
                      autoFocus
                    />
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={saveEdit}
                        disabled={saving}
                        className="inline-flex items-center gap-1 rounded-full bg-foreground text-background px-2.5 py-1 text-[10px] uppercase tracking-wider disabled:opacity-40 transition"
                      >
                        <Check className="h-2.5 w-2.5" /> Save
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        disabled={saving}
                        className="text-[10px] text-muted-foreground hover:text-foreground transition"
                      >
                        Cancel
                      </button>
                      <span className="ml-auto text-[10px] text-muted-foreground/60">
                        {editDraft.length}/{MAX_MANUAL_CHARS}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground/70 leading-relaxed">
                      Auto-refresh will keep adding to your summary, but it won't undo your edits.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Reset link when summary is out of scope / toggle is off but customizations exist */}
            {hasUserCustomization && (!pastSummary || !useMemory || !memoryInScope) && !editing && !addingFact && (
              <div>
                {resetConfirm ? (
                  <span className="text-[10px] text-muted-foreground">
                    Discard your edits and pinned facts?{" "}
                    <button
                      type="button"
                      onClick={handleReset}
                      disabled={saving}
                      className="text-foreground underline underline-offset-2 hover:no-underline transition"
                    >
                      Yes, reset
                    </button>
                    {" · "}
                    <button
                      type="button"
                      onClick={() => setResetConfirm(false)}
                      className="text-muted-foreground hover:text-foreground transition"
                    >
                      Keep mine
                    </button>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setResetConfirm(true)}
                    className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition"
                  >
                    <RotateCcw className="h-2.5 w-2.5" /> Reset to auto-summary
                  </button>
                )}
              </div>
            )}

            {/* No memory yet — contextual note */}
            {!pastSummary && pinnedFacts.length === 0 && !addingFact && (
              <p className="text-[11px] text-muted-foreground/70">
                Auto-summary appears after a few chat sessions. You can pin reminders any time above.
              </p>
            )}
          </div>

          {/* Highlights */}
          {highlights.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs uppercase tracking-widest text-muted-foreground">
                  <Quote className="h-3 w-3" />
                  Highlights ({highlights.length})
                </div>
                <ToggleChip
                  active={useHighlights}
                  onChange={onToggleHighlights}
                  label={useHighlights ? "Using" : "Off"}
                />
              </div>
              {useHighlights && (
                <ul className="space-y-1">
                  {highlights.slice(0, 3).map((h) => (
                    <li key={h.id} className="rounded-lg bg-background/70 px-2.5 py-1.5 text-xs">
                      <span className="text-muted-foreground">
                        {typeof h.page === "number" ? `p.${h.page} · ` : ""}
                      </span>
                      <span className="italic">"{truncate(h.text, 110)}"</span>
                    </li>
                  ))}
                  {highlights.length > 3 && (
                    <li className="text-[11px] text-muted-foreground pl-1">
                      +{highlights.length - 3} more
                    </li>
                  )}
                </ul>
              )}
            </div>
          )}

          {/* Notes / reflections */}
          {notes.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs uppercase tracking-widest text-muted-foreground">
                  <NotebookPen className="h-3 w-3" />
                  Notes ({notes.length})
                </div>
                <ToggleChip
                  active={useNotes}
                  onChange={onToggleNotes}
                  label={useNotes ? "Using" : "Off"}
                />
              </div>
              {useNotes && (
                <ul className="space-y-1">
                  {notes.slice(0, 3).map((n) => {
                    const Icon = KIND_ICON[n.kind] ?? NotebookPen;
                    return (
                      <li
                        key={n.id}
                        className="rounded-lg bg-background/70 px-2.5 py-1.5 text-xs flex gap-1.5"
                      >
                        <Icon className="h-3 w-3 mt-0.5 text-muted-foreground shrink-0" />
                        <span>
                          <span className="text-muted-foreground">
                            {typeof n.page === "number" ? `p.${n.page} · ` : ""}
                          </span>
                          {truncate(n.text, 110)}
                        </span>
                      </li>
                    );
                  })}
                  {notes.length > 3 && (
                    <li className="text-[11px] text-muted-foreground pl-1">
                      +{notes.length - 3} more
                    </li>
                  )}
                </ul>
              )}
            </div>
          )}

          {/* Session notes */}
          {inScopeSessions.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs uppercase tracking-widest text-muted-foreground">
                  <MessageCircle className="h-3 w-3" />
                  Session notes ({inScopeSessions.length})
                </div>
                <ToggleChip
                  active={useSessionNotes}
                  onChange={onToggleSessionNotes}
                  label={useSessionNotes ? "Using" : "Off"}
                />
              </div>
              {useSessionNotes && (
                <ul className="space-y-1">
                  {inScopeSessions.slice(0, 2).map((s) => (
                    <li key={s.id} className="rounded-lg bg-background/70 px-2.5 py-1.5 text-xs">
                      <span className="text-muted-foreground">
                        p.{s.fromPage}–{s.toPage} · {s.mood} ·{" "}
                      </span>
                      {truncate(s.note ?? "", 110)}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Empty state */}
          {inScopeJournal.length === 0 && inScopeSessions.length === 0 && !pastSummary && (
            <p className="text-xs text-muted-foreground">
              No saved highlights or notes yet up to page {book.progress}. The Companion will rely
              only on the book and your current page.
            </p>
          )}

          <p
            className={cn(
              "text-[11px] text-muted-foreground border-t border-border/30 pt-2",
              "leading-relaxed"
            )}
          >
            Spoiler-safe: nothing past page {book.progress} is shared with the Companion
            {hiddenPastPage > 0 ? ` (${hiddenPastPage} entr${hiddenPastPage === 1 ? "y" : "ies"} past your page hidden).` : "."}
          </p>
        </div>
      )}
    </section>
  );
}

function ToggleChip({
  active,
  onChange,
  label,
}: {
  active: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!active)}
      className={cn(
        "rounded-full border px-2.5 py-0.5 text-[10px] uppercase tracking-wider transition",
        active
          ? "border-foreground/40 bg-foreground text-background"
          : "border-border/60 bg-background/60 text-muted-foreground hover:text-foreground"
      )}
      aria-pressed={active}
    >
      {label}
    </button>
  );
}

function truncate(s: string, n: number) {
  const t = s.trim();
  return t.length > n ? t.slice(0, n - 1) + "…" : t;
}
