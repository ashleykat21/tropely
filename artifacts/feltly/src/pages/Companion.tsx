import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/lib/auth";
import { useLibrary } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Sparkles, Send, Trash2, Lock, BookOpen, Drama, AlertCircle, RotateCcw, X, NotebookPen, Quote } from "lucide-react";
import type { Book, JournalEntry, SessionLog } from "@/lib/store";
import { MOODS } from "@/lib/moods";
import { Clock } from "lucide-react";
import { toast } from "sonner";
import { AddBookDialog } from "@/components/reader/AddBookDialog";
import { WhatIKnowPanel } from "@/components/companion/WhatIKnowPanel";
import { usePremium } from "@/lib/usePremium";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type Msg = { role: "user" | "assistant"; content: string };
type Mode = "reflect" | "character";

// ── Recent characters per book (localStorage) ──────────────────────────────
const RECENT_CHARS_KEY = (bk: string) => `feltly-companion-chars:${bk}`;
const getRecentChars = (bk: string): string[] => {
  try { return JSON.parse(localStorage.getItem(RECENT_CHARS_KEY(bk)) ?? "[]"); }
  catch { return []; }
};
const saveRecentChar = (bk: string, name: string) => {
  const prev = getRecentChars(bk).filter((c) => c.toLowerCase() !== name.toLowerCase());
  localStorage.setItem(RECENT_CHARS_KEY(bk), JSON.stringify([name, ...prev].slice(0, 8)));
};

const COMPANION_FREE_LIMIT = 5;
const todayKey = () => `feltly-companion-daily:${new Date().toISOString().slice(0, 10)}`;
const getDailyCount = () => parseInt(localStorage.getItem(todayKey()) ?? "0", 10);
const incrDailyCount = () => localStorage.setItem(todayKey(), String(getDailyCount() + 1));

export default function Companion() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const isPremium = usePremium((s) => s.isPremium);
  const { books, currentId, sessions, reflections, journal, spoilerStrictness } = useLibrary();
  const readingBooks = books.filter((b) => b.shelf === "reading");
  const [selectedBookId, setSelectedBookId] = useState<string | undefined>(() => {
    const cur = books.find((b) => b.id === currentId);
    return cur?.shelf === "reading" ? cur.id : readingBooks[0]?.id;
  });
  const book = books.find((b) => b.id === selectedBookId) ?? readingBooks[0];

  // Keep selectedBookId valid if the selected book is removed/finished
  useEffect(() => {
    if (!readingBooks.find((b) => b.id === selectedBookId)) {
      setSelectedBookId(readingBooks[0]?.id);
    }
  }, [books.length, currentId]);

  const bookSessions = book ? sessions.filter((s) => s.bookId === book.id).slice(0, 5) : [];
  const bookReflection = book ? reflections.find((r) => r.bookId === book.id) : null;
  const bookJournal = book ? journal.filter((j) => j.bookId === book.id).slice(0, 8) : [];

  // Spoiler-safe context: include entries with no page or whose page is at or
  // before the reader's current page. Checkpoint locks naturally fall out of
  // this — any entry tied to a checkpoint past the current page has page >
  // progress and is excluded.
  const allBookJournal = book ? journal.filter((j) => j.bookId === book.id) : [];
  const inScopeJournal = book
    ? allBookJournal.filter(
        (j) => typeof j.page !== "number" || j.page <= book.progress
      )
    : [];
  const inScopeSessions = book
    ? sessions
        .filter((s) => s.bookId === book.id && s.toPage <= book.progress && (s.note?.trim().length ?? 0) > 0)
        .slice(0, 5)
    : [];

  // Per-session toggles — not persisted.
  const [useNotes, setUseNotes] = useState(true);
  const [useHighlights, setUseHighlights] = useState(true);
  const [useSessionNotes, setUseSessionNotes] = useState(true);
  const [useMemory, setUseMemory] = useState(true);
  const [pastSummary, setPastSummary] = useState<{
    summary: string;
    uptoPage: number | null;
    updatedAt: string;
    manualSummary: string | null;
    pinnedFacts: string[];
  } | null>(null);

  const [dailyCount, setDailyCount] = useState(getDailyCount);
  const freeRemaining = isPremium ? Infinity : Math.max(0, COMPANION_FREE_LIMIT - dailyCount);

  const [mode, setMode] = useState<Mode>("reflect");
  const [characterInput, setCharacterInput] = useState("");
  const [activeCharacter, setActiveCharacter] = useState("");

  // Each mode/character gets its own history key
  const bKeyBase = book ? `${book.title}::${book.author}` : "";
  const bKey =
    mode === "character" && activeCharacter
      ? `${bKeyBase}::chr::${activeCharacter}`
      : bKeyBase;

  // Filter past-page memory: never show a summary captured past current page.
  const memoryInScope = book && pastSummary
    ? (pastSummary.uptoPage === null || pastSummary.uptoPage <= book.progress)
    : false;

  const reflectGreeting: Msg = {
    role: "assistant",
    content: book
      ? `Tell me where you are in \u201c${book.title}.\u201d What\u2019s lingering?`
      : "Add a book to your shelf and we'll talk.",
  };

  const characterGreeting = (name: string): Msg => ({
    role: "assistant",
    content: book
      ? `You\u2019re speaking with ${name} from \u201c${book.title}.\u201d What would you like to ask?`
      : "Add a book to your shelf first.",
  });

  const greeting = mode === "character" && activeCharacter
    ? characterGreeting(activeCharacter)
    : reflectGreeting;

  const [messages, setMessages] = useState<Msg[]>([greeting]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [lastFailedText, setLastFailedText] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const charInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && !user) nav("/auth");
  }, [user, loading, nav]);

  // Load conversation history whenever the key changes
  useEffect(() => {
    if (!user || !bKey) return;
    let cancelled = false;
    setHistoryLoaded(false);
    setMessages([greeting]);
    (async () => {
      try {
        const res = await fetch(`/api/companion/${encodeURIComponent(bKey)}/messages`, {
          credentials: "include",
        });
        if (cancelled) return;
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            setMessages(
              data.map((d: { role: string; content: string }) => ({
                role: d.role as "user" | "assistant",
                content: d.content,
              }))
            );
          } else {
            setMessages([greeting]);
          }
        }
      } catch {}
      if (!cancelled) setHistoryLoaded(true);
    })();
    return () => { cancelled = true; };
  }, [user?.id, bKey]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const clearHistory = async () => {
    if (!user || !book) return;
    try {
      await fetch(`/api/companion/${encodeURIComponent(bKey)}/messages`, {
        method: "DELETE",
        credentials: "include",
      });
    } catch {}
    setMessages([greeting]);
    toast.success("Conversation cleared.");
  };

  const forgetMemory = async () => {
    if (!user || !bKeyBase) return;
    try {
      await fetch(`/api/companion/${encodeURIComponent(bKeyBase)}/summary`, {
        method: "DELETE",
        credentials: "include",
      });
    } catch {}
    setPastSummary(null);
    toast.success("Past-conversation memory cleared.");
  };

  const saveMemory = async (manualSummary: string | null, pinnedFacts: string[]) => {
    if (!user || !bKeyBase) return;
    const res = await fetch(`/api/companion/${encodeURIComponent(bKeyBase)}/summary`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ manualSummary, pinnedFacts }),
    });
    if (res.ok) {
      const data = await res.json();
      setPastSummary((prev) =>
        prev
          ? {
              ...prev,
              manualSummary: data.manualSummary ?? null,
              pinnedFacts: data.pinnedFacts ?? [],
            }
          : {
              summary: data.summary ?? "",
              uptoPage: data.uptoPage ?? null,
              updatedAt: data.updatedAt ?? new Date().toISOString(),
              manualSummary: data.manualSummary ?? null,
              pinnedFacts: data.pinnedFacts ?? [],
            }
      );
    }
  };

  const resetToAuto = async () => {
    await saveMemory(null, []);
  };

  // Load the rolling summary for this book whenever the book changes.
  useEffect(() => {
    if (!user || !bKeyBase) {
      setPastSummary(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/companion/${encodeURIComponent(bKeyBase)}/summary`, {
          credentials: "include",
        });
        if (cancelled) return;
        if (res.ok) {
          const data = await res.json();
          setPastSummary(
            data
              ? {
                  summary: data.summary,
                  uptoPage: data.uptoPage ?? null,
                  updatedAt: data.updatedAt,
                  manualSummary: data.manualSummary ?? null,
                  pinnedFacts: data.pinnedFacts ?? [],
                }
              : null
          );
        }
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [user?.id, bKeyBase]);

  // When the user leaves the Companion page, ensure a fresh summary is captured.
  useEffect(() => {
    return () => {
      if (!user || !bKeyBase || !book) return;
      try {
        const body = JSON.stringify({ currentPage: book.progress, bookTitle: book.title });
        const url = `/api/companion/${encodeURIComponent(bKeyBase)}/summarize`;
        if (navigator.sendBeacon) {
          navigator.sendBeacon(url, new Blob([body], { type: "application/json" }));
        } else {
          fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body,
            keepalive: true,
          }).catch(() => {});
        }
      } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, bKeyBase, book?.id, book?.progress]);

  const switchMode = (next: Mode) => {
    if (next === "character" && !isPremium) {
      toast("Character chat is a premium feature", {
        description: "Upgrade to speak with characters from your books.",
        action: { label: "Upgrade", onClick: () => nav("/premium") },
      });
      return;
    }
    setMode(next);
    setInput("");
    if (next === "character") {
      setActiveCharacter("");
      setCharacterInput("");
      setTimeout(() => charInputRef.current?.focus(), 80);
    }
  };

  const confirmCharacter = (nameOverride?: string) => {
    const name = (nameOverride ?? characterInput).trim();
    if (!name) return;
    setActiveCharacter(name);
    setCharacterInput(name);
    if (bKeyBase) saveRecentChar(bKeyBase, name);
  };

  const reflectSuggestions = book
    ? [
        bookSessions[0]
          ? `How is page ${book.progress} sitting with me?`
          : `Help me start \u201c${book.title}.\u201d`,
        bookJournal.find((j) => j.kind === "quote")
          ? "Reflect on a line I saved."
          : "What should I notice next?",
        bookReflection
          ? "What did I take away from this book?"
          : "What\u2019s the emotional arc so far?",
        ...((book.checkpoints ?? [])
          .filter((c) => book.progress >= c.page)
          .slice(-1)
          .map((c) => `What changed for me by \u201c${c.label}\u201d (p. ${c.page})?`)),
      ]
    : [];

  const characterSuggestions = activeCharacter
    ? [
        `How are you feeling right now?`,
        `What are you most afraid of?`,
        `What do you want more than anything?`,
        `What do you think of me?`,
      ]
    : [];

  const suggestions = mode === "character" ? characterSuggestions : reflectSuggestions;

  const send = async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    const ready = mode === "reflect" ? !!book : !!(book && activeCharacter);
    if (!text || busy || !ready) return;
    if (!isPremium && dailyCount >= COMPANION_FREE_LIMIT) {
      toast("Daily limit reached", {
        description: `Free accounts get ${COMPANION_FREE_LIMIT} Companion messages per day. Upgrade for unlimited.`,
        icon: <Lock className="h-4 w-4" />,
      });
      return;
    }
    setLastError(null);
    setLastFailedText(null);
    const userMsg: Msg = { role: "user", content: text };
    setMessages((m) => [...m, userMsg]);
    if (!overrideText) setInput("");
    if (!isPremium) {
      incrDailyCount();
      setDailyCount(getDailyCount());
    }
    setBusy(true);

    try {
      const ctxJournal = inScopeJournal
        .filter((j) => (j.kind === "quote" ? useHighlights : useNotes))
        .slice(0, 8)
        .map((j) => ({
          id: j.id,
          kind: j.kind,
          page: j.page,
          text: j.text.length > 280 ? j.text.slice(0, 277) + "…" : j.text,
        }));
      const ctxSessions = useSessionNotes
        ? inScopeSessions.slice(0, 5).map((s) => ({
            id: s.id,
            fromPage: s.fromPage,
            toPage: s.toPage,
            mood: s.mood,
            note: (s.note ?? "").length > 240 ? (s.note ?? "").slice(0, 237) + "…" : s.note,
          }))
        : [];

      const res = await fetch(`/api/companion/${encodeURIComponent(bKey)}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          content: text,
          bookTitle: book?.title,
          bookAuthor: book?.author,
          currentPage: book?.progress,
          totalPages: book?.pages,
          mood: book?.mood,
          tropes: book?.tropes ?? [],
          spoilerStrictness,
          journalEntries: ctxJournal,
          sessionNotes: ctxSessions,
          memoryKey: bKeyBase,
          useMemory: useMemory && memoryInScope,
          ...(mode === "character" && activeCharacter
            ? { characterName: activeCharacter }
            : {}),
        }),
      });

      if (!res.ok || !res.body) {
        const j = await res.json().catch(() => ({}));
        throw new Error((j as Record<string, string>).error ?? `HTTP ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      setMessages((m) => [...m, { role: "assistant", content: "" }]);
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          try {
            const j = JSON.parse(data);
            if (j.done) break;
            if (j.error) throw new Error(j.error);
            if (j.content) {
              acc += j.content;
              setMessages((m) => [
                ...m.slice(0, -1),
                { role: "assistant", content: acc },
              ]);
            }
          } catch (parseErr: unknown) {
            if (parseErr instanceof Error && !parseErr.message.startsWith("JSON"))
              throw parseErr;
          }
        }
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Companion went quiet.";
      setLastError(msg);
      setLastFailedText(text);
      // Drop the in-progress assistant placeholder and the user message — the
      // inline retry banner shows the failed text so the user can resend it.
      setMessages((m) => {
        const trimmed = m[m.length - 1]?.role === "assistant" && m[m.length - 1]?.content === ""
          ? m.slice(0, -1)
          : m;
        return trimmed[trimmed.length - 1]?.role === "user"
          ? trimmed.slice(0, -1)
          : trimmed;
      });
    } finally {
      setBusy(false);
    }
  };

  const retryLast = () => {
    if (!lastFailedText) return;
    const txt = lastFailedText;
    setLastError(null);
    setLastFailedText(null);
    send(txt);
  };

  const isReady = mode === "reflect" ? !!book : !!(book && activeCharacter);

  return (
    <AppShell>
      <div className="space-y-6 max-w-3xl">
        {/* Header */}
        <header className="space-y-3 animate-fade-up">
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground flex items-center gap-1.5">
            <Sparkles className="h-3 w-3" /> AI Companion
          </p>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h1 className="font-display text-4xl sm:text-5xl leading-[1.05]">
              {mode === "character" && activeCharacter ? (
                <>
                  Speaking with{" "}
                  <span className="italic" style={{ color: "var(--mood-strong)" }}>
                    {activeCharacter}
                  </span>
                  .
                </>
              ) : (
                <>
                  Reflect on what you{" "}
                  <span className="italic" style={{ color: "var(--mood-strong)" }}>
                    just read
                  </span>
                  .
                </>
              )}
            </h1>

            {/* Mode switcher */}
            <div className="flex items-center gap-1 rounded-full border border-border/60 bg-background/60 p-1 shrink-0">
              <button
                onClick={() => switchMode("reflect")}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition",
                  mode === "reflect"
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <BookOpen className="h-3 w-3" />
                Reflect
              </button>
              <button
                onClick={() => switchMode("character")}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition",
                  mode === "character"
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Drama className="h-3 w-3" />
                In Character
                {!isPremium && <Lock className="h-2.5 w-2.5 opacity-40 ml-0.5" />}
              </button>
            </div>
          </div>

            {/* Free tier counter */}
          {!isPremium && (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-border/50 bg-card/60 px-3 py-2 text-xs">
              <span className="text-muted-foreground">
                <span className="font-display text-sm text-foreground">{freeRemaining}</span>
                {" "}of {COMPANION_FREE_LIMIT} free messages left today
              </span>
              <Link
                to="/profile"
                className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/80 px-2.5 py-1 text-[10px] uppercase tracking-wider hover:bg-background transition"
              >
                <Sparkles className="h-2.5 w-2.5" style={{ color: "var(--mood-strong)" }} />
                Upgrade
              </Link>
            </div>
          )}
        {/* Sub-header line */}
          {book && mode === "reflect" && (
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                Talking about{" "}
                <span className="font-medium text-foreground">{book.title}</span> · page{" "}
                {book.progress}/{book.pages}. No spoilers ahead.
              </p>
              {historyLoaded && messages.length > 1 && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={clearHistory}
                  className="text-xs gap-1.5 h-7"
                >
                  <Trash2 className="h-3 w-3" /> Clear
                </Button>
              )}
            </div>
          )}

          {book && mode === "character" && activeCharacter && (
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{activeCharacter}</span> from{" "}
                <span className="font-medium text-foreground">{book.title}</span> · up to page{" "}
                {book.progress}. Spoiler-safe.
              </p>
              <div className="flex items-center gap-2">
                {historyLoaded && messages.length > 1 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={clearHistory}
                    className="text-xs gap-1.5 h-7"
                  >
                    <Trash2 className="h-3 w-3" /> Clear
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => { setActiveCharacter(""); setCharacterInput(""); setMessages([greeting]); }}
                  className="text-xs h-7"
                >
                  Change character
                </Button>
              </div>
            </div>
          )}
        </header>

        {/* Book picker — only shown when reading more than one book */}
        {readingBooks.length > 1 && (
          <div className="space-y-2 animate-fade-up">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Talking about</p>
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
              {readingBooks.map((b) => {
                const isSelected = b.id === book?.id;
                return (
                  <button
                    key={b.id}
                    onClick={() => {
                      setSelectedBookId(b.id);
                      setMode("reflect");
                      setActiveCharacter("");
                      setCharacterInput("");
                    }}
                    className={cn(
                      "shrink-0 flex items-center gap-2.5 rounded-xl border px-3 py-2 text-left transition",
                      isSelected
                        ? "border-foreground bg-foreground text-background"
                        : "border-border/60 bg-card/60 hover:bg-card text-foreground"
                    )}
                  >
                    {b.cover ? (
                      <img src={b.cover} alt={b.title} className="h-9 w-6 rounded object-cover shrink-0 shadow-sm" />
                    ) : (
                      <div className="h-9 w-6 rounded bg-muted shrink-0" />
                    )}
                    <div className="min-w-0">
                      <div className="text-xs font-medium truncate max-w-[130px]">{b.title}</div>
                      <div className={cn("text-[10px] truncate max-w-[130px]", isSelected ? "opacity-70" : "text-muted-foreground")}>
                        {b.author}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* What I know panel */}
        {book && (
          <WhatIKnowPanel
            book={book}
            inScopeJournal={inScopeJournal}
            inScopeSessions={inScopeSessions}
            totalJournalForBook={allBookJournal.length}
            useNotes={useNotes}
            useHighlights={useHighlights}
            useSessionNotes={useSessionNotes}
            onToggleNotes={setUseNotes}
            onToggleHighlights={setUseHighlights}
            onToggleSessionNotes={setUseSessionNotes}
            pastSummary={pastSummary}
            memoryInScope={memoryInScope}
            useMemory={useMemory}
            onToggleMemory={setUseMemory}
            onForgetMemory={forgetMemory}
            onSaveMemory={saveMemory}
            onResetToAuto={resetToAuto}
          />
        )}

        {/* No book state */}
        {!book && (
          <div className="rounded-2xl border border-dashed border-border/60 p-8 text-center space-y-4">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-foreground/5">
              <Sparkles className="h-5 w-5" style={{ color: "var(--mood-strong)" }} />
            </div>
            <div className="space-y-1">
              <div className="font-display text-xl">Pick a book to talk about.</div>
              <p className="text-sm text-muted-foreground">
                The Companion needs a current read to stay spoiler-safe and personal.
              </p>
            </div>
            {books.length > 0 ? (
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">
                  From your library
                </p>
                <div className="flex flex-wrap justify-center gap-1.5">
                  {books
                    .filter((b) => b.shelf !== "finished")
                    .slice(0, 8)
                    .map((b) => (
                      <button
                        key={b.id}
                        onClick={() => useLibrary.getState().setCurrent(b.id)}
                        className="rounded-full border border-border/60 bg-background/70 px-3 py-1.5 text-xs hover:bg-background transition"
                      >
                        {b.title}
                      </button>
                    ))}
                </div>
                <div className="flex justify-center pt-1">
                  <AddBookDialog />
                </div>
              </div>
            ) : (
              <div className="flex justify-center">
                <AddBookDialog />
              </div>
            )}
          </div>
        )}

        {/* Character picker */}
        {book && mode === "character" && !activeCharacter && (() => {
          const recentChars = getRecentChars(bKeyBase);
          return (
            <div className="rounded-2xl border border-border/40 bg-card/60 p-6 space-y-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Drama className="h-4 w-4" style={{ color: "var(--mood-strong)" }} />
                  <span className="font-medium text-sm">Who do you want to speak with?</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Enter any character from <span className="italic">{book.title}</span>. The AI will
                  speak in their voice — only knowing what they know up to page {book.progress}.
                </p>
              </div>

              {/* Recent characters */}
              {recentChars.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Resume a conversation</p>
                  <div className="flex flex-wrap gap-2">
                    {recentChars.map((name) => (
                      <button
                        key={name}
                        onClick={() => confirmCharacter(name)}
                        className="flex items-center gap-1.5 rounded-full border border-border/60 bg-background/80 px-3 py-1.5 text-xs font-medium hover:bg-background transition"
                      >
                        <span
                          className="grid h-4 w-4 place-items-center rounded-full text-[9px] font-bold text-background shrink-0"
                          style={{ background: "var(--mood-strong)" }}
                        >
                          {name[0]?.toUpperCase()}
                        </span>
                        {name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Type a new character */}
              <div className="space-y-2">
                {recentChars.length > 0 && (
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Or start a new chat</p>
                )}
                <div className="flex gap-2">
                  <Input
                    ref={charInputRef}
                    value={characterInput}
                    onChange={(e) => setCharacterInput(e.target.value)}
                    placeholder="Character name…"
                    className="rounded-full bg-background/70"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") confirmCharacter();
                    }}
                  />
                  <Button
                    onClick={() => confirmCharacter()}
                    disabled={!characterInput.trim()}
                    className="rounded-full shrink-0"
                  >
                    Begin
                  </Button>
                </div>
              </div>

              {/* Generic role suggestions */}
              <div className="space-y-2">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Not sure? Try one of these</p>
                <div className="flex flex-wrap gap-2">
                  {["the protagonist", "the narrator", "the antagonist", "a side character"].map((label) => (
                    <button
                      key={label}
                      onClick={() => setCharacterInput(label)}
                      className="rounded-full border border-border/60 bg-background/60 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-background transition"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}

        {/* Chat area */}
        <section className="rounded-2xl mood-surface border border-border/40 p-4 sm:p-6 min-h-[320px] sm:min-h-[420px] flex flex-col">
          <div className="flex-1 space-y-4 overflow-auto max-h-[45vh] sm:max-h-[55vh]">
            {messages.map((m, i) => (
              <div key={i} className={`flex flex-col gap-1 ${m.role === "user" ? "items-end" : "items-start"}`}>
                {m.role === "assistant" && mode === "character" && activeCharacter && (
                  <div className="flex items-center gap-1.5 ml-1">
                    <span
                      className="grid h-5 w-5 place-items-center rounded-full text-[10px] font-bold text-background"
                      style={{ background: "var(--mood-strong)" }}
                    >
                      {activeCharacter[0]?.toUpperCase()}
                    </span>
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      {activeCharacter}
                    </span>
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                    m.role === "user"
                      ? "bg-foreground text-background"
                      : mode === "character" && activeCharacter
                      ? "border border-border/60 bg-white/80"
                      : "bg-white/70 border border-border/60"
                  )}
                >
                  {m.role === "assistant"
                    ? renderWithRefs(
                        m.content,
                        allBookJournal,
                        inScopeSessions,
                        book,
                        (id) => {
                          const entry = allBookJournal.find((j) => j.id === id);
                          if (!entry) return;
                          nav("/journal", { state: { focusEntryId: entry.id, bookId: entry.bookId } });
                        },
                        (sid) => {
                          const session = inScopeSessions.find((s) => s.id === sid);
                          if (!session) return;
                          nav(`/book/${session.bookId}`, { state: { focusSessionId: session.id } });
                        },
                        (sid) => {
                          const session = inScopeSessions.find((s) => s.id === sid);
                          if (!session) return;
                          nav(`/insights`, { state: { focusSessionId: session.id } });
                        },
                      )
                    : m.content || <span className="opacity-50">\u2026</span>}
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </div>

          {/* Suggestions */}
          {isReady && !busy && suggestions.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => setInput(s)}
                  className="rounded-full border border-border/60 bg-white/70 px-3 py-1.5 text-xs text-foreground/80 hover:bg-white transition"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Inline error + retry */}
          {lastError && (
            <div
              role="alert"
              className="mt-4 rounded-xl border border-amber-300/60 bg-amber-50/70 px-3 py-2.5 flex items-start gap-2 text-sm"
            >
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-amber-600" />
              <div className="flex-1 min-w-0">
                <p className="text-amber-900/90">{lastError}</p>
                {lastFailedText && (
                  <p className="text-xs text-amber-800/70 mt-0.5 truncate">
                    "{lastFailedText}"
                  </p>
                )}
              </div>
              <button
                onClick={retryLast}
                className="inline-flex items-center gap-1 rounded-full border border-amber-400/60 bg-white/80 px-2.5 py-1 text-xs hover:bg-white transition shrink-0"
              >
                <RotateCcw className="h-3 w-3" /> Retry
              </button>
              <button
                onClick={() => { setLastError(null); setLastFailedText(null); }}
                className="text-amber-700/70 hover:text-amber-900 transition shrink-0"
                aria-label="Dismiss"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Input */}
          <div className="mt-4 flex items-end gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                !book
                  ? "Add a book first."
                  : mode === "character" && !activeCharacter
                  ? "Choose a character above first."
                  : mode === "character"
                  ? `Say something to ${activeCharacter}\u2026`
                  : "What\u2019s resonating right now?"
              }
              className="min-h-[52px] bg-white/70"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              disabled={!isReady || busy}
            />
            <Button
              onClick={() => send()}
              disabled={!isReady || busy}
              className="rounded-full h-[52px] px-5"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function buildEntryContext(
  entry: JournalEntry,
  book: Book | undefined,
  entries: JournalEntry[],
): { section?: string; nearby?: { kind: JournalEntry["kind"]; page?: number; text: string; delta: number } } {
  const out: { section?: string; nearby?: { kind: JournalEntry["kind"]; page?: number; text: string; delta: number } } = {};
  if (typeof entry.page === "number" && book?.checkpoints?.length) {
    const before = book.checkpoints
      .filter((c) => c.page <= entry.page!)
      .sort((a, b) => b.page - a.page)[0];
    if (before) out.section = before.label;
  }
  if (typeof entry.page === "number") {
    const candidate = entries
      .filter((e) => e.id !== entry.id && typeof e.page === "number" && Math.abs(e.page! - entry.page!) <= 5)
      .map((e) => ({ e, delta: Math.abs(e.page! - entry.page!) }))
      .sort((a, b) => a.delta - b.delta)[0];
    if (candidate) {
      out.nearby = {
        kind: candidate.e.kind,
        page: candidate.e.page,
        text: candidate.e.text,
        delta: candidate.e.page! - entry.page!,
      };
    }
  }
  return out;
}

function buildSessionContext(
  session: SessionLog,
  book: Book | undefined,
  entries: JournalEntry[],
): { section?: string; nearby?: { kind: JournalEntry["kind"]; page?: number; text: string } } {
  const out: { section?: string; nearby?: { kind: JournalEntry["kind"]; page?: number; text: string } } = {};
  if (book?.checkpoints?.length) {
    const before = book.checkpoints
      .filter((c) => c.page <= session.toPage)
      .sort((a, b) => b.page - a.page)[0];
    if (before) out.section = before.label;
  }
  const within = entries
    .filter(
      (e) =>
        typeof e.page === "number" &&
        e.page! >= session.fromPage &&
        e.page! <= session.toPage,
    )
    .sort((a, b) => (a.page ?? 0) - (b.page ?? 0))[0];
  if (within) {
    out.nearby = { kind: within.kind, page: within.page, text: within.text };
  }
  return out;
}

function renderWithRefs(
  text: string,
  entries: JournalEntry[],
  sessions: SessionLog[],
  book: Book | undefined,
  onJump: (id: string) => void,
  onJumpSession: (id: string) => void,
  onJumpSessionInsights: (id: string) => void,
) {
  if (!text) return <span className="opacity-50">…</span>;
  const re = /\[\[ref:([A-Za-z0-9_:-]+)\]\]/g;
  const out: React.ReactNode[] = [];
  let last = 0;
  let i = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const id = m[1];
    if (id.startsWith("session:")) {
      const sid = id.slice("session:".length);
      const session = sessions.find((s) => s.id === sid);
      if (session) {
        out.push(
          <SessionRefChip
            key={`ref-${i++}-${m.index}`}
            session={session}
            context={buildSessionContext(session, book, entries)}
            onJump={() => onJumpSession(sid)}
            onJumpInsights={() => onJumpSessionInsights(sid)}
          />,
        );
      }
    } else {
      const entry = entries.find((e) => e.id === id);
      if (entry) {
        out.push(
          <RefChip
            key={`ref-${i++}-${m.index}`}
            entry={entry}
            context={buildEntryContext(entry, book, entries)}
            onJump={() => onJump(id)}
          />,
        );
      }
    }
    // If entry not found, drop the marker silently.
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return <>{out}</>;
}

function SessionRefChip({
  session,
  context,
  onJump,
  onJumpInsights,
}: {
  session: SessionLog;
  context?: { section?: string; nearby?: { kind: JournalEntry["kind"]; page?: number; text: string } };
  onJump: () => void;
  onJumpInsights: () => void;
}) {
  const [open, setOpen] = useState(false);
  const lastPointerType = useRef<string>("mouse");
  const closeTimer = useRef<number | null>(null);

  const moodInfo = MOODS[session.mood];
  const label = `p.${session.fromPage}–${session.toPage}`;
  const ariaText =
    `Reading session from page ${session.fromPage} to ${session.toPage}` +
    (moodInfo ? `, mood ${moodInfo.label}` : "") +
    (session.note ? `: ${session.note.length > 80 ? session.note.slice(0, 79) + "…" : session.note}` : "") +
    ".";

  const isCoarse = (pt: string) =>
    pt === "touch" || pt === "pen" ||
    (typeof window !== "undefined" &&
      window.matchMedia?.("(pointer: coarse)").matches);

  const clearCloseTimer = () => {
    if (closeTimer.current !== null) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`${ariaText} Press Enter to open the book detail.`}
          onPointerDown={(e) => { lastPointerType.current = e.pointerType || "mouse"; }}
          onPointerEnter={(e) => {
            if (isCoarse(e.pointerType)) return;
            clearCloseTimer();
            setOpen(true);
          }}
          onPointerLeave={(e) => {
            if (isCoarse(e.pointerType)) return;
            clearCloseTimer();
            closeTimer.current = window.setTimeout(() => setOpen(false), 120);
          }}
          onFocus={() => { clearCloseTimer(); setOpen(true); }}
          onBlur={() => {
            clearCloseTimer();
            closeTimer.current = window.setTimeout(() => setOpen(false), 120);
          }}
          onClick={(e) => {
            if (isCoarse(lastPointerType.current) && !open) {
              e.preventDefault();
              setOpen(true);
              return;
            }
            onJump();
          }}
          className="inline-flex items-center gap-1 mx-0.5 align-baseline rounded-full border border-border/60 bg-background/80 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-foreground/80 hover:bg-background hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 transition"
        >
          <Clock className="h-2.5 w-2.5" />
          {label}
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="start"
        className="w-72 space-y-2"
        onOpenAutoFocus={(e) => { e.preventDefault(); }}
        onPointerEnter={clearCloseTimer}
        onPointerLeave={() => {
          clearCloseTimer();
          closeTimer.current = window.setTimeout(() => setOpen(false), 120);
        }}
      >
        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>Session</span>
          <span aria-hidden="true">·</span>
          <span>p. {session.fromPage}–{session.toPage}</span>
          {moodInfo && (
            <>
              <span aria-hidden="true">·</span>
              <span>{moodInfo.emoji} {moodInfo.label}</span>
            </>
          )}
        </div>
        {context?.section && (
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground/80">
            In <span className="text-foreground/80 normal-case tracking-normal italic">{context.section}</span>
          </p>
        )}
        {session.note ? (
          <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap break-words max-h-48 overflow-auto">
            {session.note}
          </p>
        ) : (
          <p className="text-sm italic text-muted-foreground">No note saved for this session.</p>
        )}
        {context?.nearby && (
          <div className="rounded-lg border border-border/40 bg-background/40 px-2.5 py-1.5">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">
              {context.nearby.kind === "quote" ? "Highlight" : "Note"} during this session
              {typeof context.nearby.page === "number" && ` · p. ${context.nearby.page}`}
            </p>
            <p className="text-xs leading-snug text-foreground/80 line-clamp-3 break-words">
              {context.nearby.text}
            </p>
          </div>
        )}
        <div className="flex items-center justify-between gap-2 pt-0.5">
          <button
            type="button"
            onClick={() => { setOpen(false); onJump(); }}
            className="inline-flex items-center gap-1 text-xs font-medium text-foreground hover:underline focus-visible:outline-none focus-visible:underline"
          >
            Open in book detail →
          </button>
          <button
            type="button"
            onClick={() => { setOpen(false); onJumpInsights(); }}
            className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground hover:underline focus-visible:outline-none focus-visible:underline"
          >
            View in Insights →
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function RefChip({
  entry,
  context,
  onJump,
}: {
  entry: JournalEntry;
  context?: { section?: string; nearby?: { kind: JournalEntry["kind"]; page?: number; text: string; delta: number } };
  onJump: () => void;
}) {
  const [open, setOpen] = useState(false);
  const lastPointerType = useRef<string>("mouse");
  const closeTimer = useRef<number | null>(null);

  const Icon = entry.kind === "quote" ? Quote : NotebookPen;
  const label =
    typeof entry.page === "number"
      ? `p.${entry.page}`
      : entry.kind === "quote"
        ? "highlight"
        : "note";
  const kindLabel = entry.kind === "quote" ? "Highlight" : "Note";
  const ariaText =
    `${kindLabel}${typeof entry.page === "number" ? ` on page ${entry.page}` : ""}: ` +
    `${entry.text.length > 80 ? entry.text.slice(0, 79) + "…" : entry.text}.`;

  const isCoarse = (pt: string) =>
    pt === "touch" || pt === "pen" ||
    (typeof window !== "undefined" &&
      window.matchMedia?.("(pointer: coarse)").matches);

  const clearCloseTimer = () => {
    if (closeTimer.current !== null) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`${ariaText} Press Enter to open in Journal.`}
          onPointerDown={(e) => {
            lastPointerType.current = e.pointerType || "mouse";
          }}
          onPointerEnter={(e) => {
            if (isCoarse(e.pointerType)) return;
            clearCloseTimer();
            setOpen(true);
          }}
          onPointerLeave={(e) => {
            if (isCoarse(e.pointerType)) return;
            clearCloseTimer();
            closeTimer.current = window.setTimeout(() => setOpen(false), 120);
          }}
          onFocus={() => {
            clearCloseTimer();
            setOpen(true);
          }}
          onBlur={() => {
            clearCloseTimer();
            closeTimer.current = window.setTimeout(() => setOpen(false), 120);
          }}
          onClick={(e) => {
            if (isCoarse(lastPointerType.current) && !open) {
              // First tap on touch: show preview, don't navigate.
              e.preventDefault();
              setOpen(true);
              return;
            }
            // Desktop click, or second tap on touch: navigate.
            onJump();
          }}
          className="inline-flex items-center gap-1 mx-0.5 align-baseline rounded-full border border-border/60 bg-background/80 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-foreground/80 hover:bg-background hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 transition"
        >
          <Icon className="h-2.5 w-2.5" />
          {label}
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="start"
        className="w-72 space-y-2"
        onOpenAutoFocus={(e) => {
          // Keep focus on the chip so keyboard users don't lose their place.
          e.preventDefault();
        }}
        onPointerEnter={clearCloseTimer}
        onPointerLeave={() => {
          clearCloseTimer();
          closeTimer.current = window.setTimeout(() => setOpen(false), 120);
        }}
      >
        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
          <Icon className="h-3 w-3" />
          <span>{kindLabel}</span>
          {typeof entry.page === "number" && (
            <>
              <span aria-hidden="true">·</span>
              <span>p. {entry.page}</span>
            </>
          )}
        </div>
        {context?.section && (
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground/80">
            In <span className="text-foreground/80 normal-case tracking-normal italic">{context.section}</span>
          </p>
        )}
        <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap break-words max-h-48 overflow-auto">
          {entry.text}
        </p>
        {context?.nearby && (
          <div className="rounded-lg border border-border/40 bg-background/40 px-2.5 py-1.5">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">
              {context.nearby.delta === 0
                ? "Also on this page"
                : context.nearby.delta < 0
                  ? `${Math.abs(context.nearby.delta)}p before`
                  : `${context.nearby.delta}p after`}
              {" · "}
              {context.nearby.kind === "quote" ? "highlight" : "note"}
              {typeof context.nearby.page === "number" && ` · p. ${context.nearby.page}`}
            </p>
            <p className="text-xs leading-snug text-foreground/80 line-clamp-3 break-words">
              {context.nearby.text}
            </p>
          </div>
        )}
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            onJump();
          }}
          className="inline-flex items-center gap-1 text-xs font-medium text-foreground hover:underline focus-visible:outline-none focus-visible:underline"
        >
          Open in Journal →
        </button>
      </PopoverContent>
    </Popover>
  );
}
