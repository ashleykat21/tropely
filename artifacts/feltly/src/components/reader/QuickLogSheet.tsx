import { useEffect, useMemo, useRef, useState } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { useLibrary } from "@/lib/store";
import { MOODS, type MoodKey } from "@/lib/moods";
import { cn } from "@/lib/utils";
import { BookOpen, Check, ChevronsUpDown, PauseCircle, PlayCircle, RotateCcw, Timer, Zap } from "lucide-react";
import { toast } from "sonner";

const MOOD_KEYS = Object.keys(MOODS) as MoodKey[];

interface QuickLogSheetProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onPickBook: () => void;
}

const fmtTimer = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

export function QuickLogSheet({ open, onOpenChange, onPickBook }: QuickLogSheetProps) {
  const { books, currentId, sessions, logSession, updateProgress, setCurrent } = useLibrary();

  const activeBooks = useMemo(
    () => books.filter((b) => b.shelf === "reading" || b.shelf === "paused"),
    [books],
  );

  const fallbackBook =
    activeBooks.find((b) => b.id === currentId) ??
    activeBooks.find((b) => b.shelf === "reading") ??
    activeBooks[0] ??
    books.find((b) => b.id === currentId);

  const [selectedId, setSelectedId] = useState<string | null>(fallbackBook?.id ?? null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [setAsCurrent, setSetAsCurrent] = useState(false);

  // --- Timer state ---
  const [timerRunning, setTimerRunning] = useState(false);
  const [, setTimerTick] = useState(0);
  const timerStartedAt = useRef<number | null>(null);
  const timerAccumulated = useRef(0);

  const timerLiveSeconds =
    timerAccumulated.current +
    (timerRunning && timerStartedAt.current
      ? Math.floor((Date.now() - timerStartedAt.current) / 1000)
      : 0);

  useEffect(() => {
    if (!timerRunning) return;
    const id = window.setInterval(() => setTimerTick((t) => t + 1), 1000);
    return () => window.clearInterval(id);
  }, [timerRunning]);

  const startTimer = () => {
    if (timerRunning) return;
    timerStartedAt.current = Date.now();
    setTimerRunning(true);
  };

  const pauseTimer = () => {
    if (!timerRunning) return;
    timerAccumulated.current = timerLiveSeconds;
    timerStartedAt.current = null;
    setTimerRunning(false);
  };

  const resetTimer = () => {
    timerAccumulated.current = 0;
    timerStartedAt.current = null;
    setTimerRunning(false);
    setTimerTick(0);
  };

  const book =
    activeBooks.find((b) => b.id === selectedId) ??
    books.find((b) => b.id === selectedId) ??
    fallbackBook;

  const lastSession = useMemo(() => {
    if (!book) return undefined;
    return [...sessions]
      .filter((s) => s.bookId === book.id)
      .sort((a, b) => b.at - a.at)[0]
      ?? [...sessions].sort((a, b) => b.at - a.at)[0];
  }, [sessions, book?.id]);

  const defaultPages = String(lastSession?.pagesRead ?? 10);
  const defaultMood: MoodKey = lastSession?.mood ?? book?.mood ?? "calm";

  const [pages, setPages] = useState<string>(defaultPages);
  const [mood, setMood] = useState<MoodKey>(defaultMood);
  const [note, setNote] = useState("");
  const [showFull, setShowFull] = useState(false);

  // Reset selection + form whenever the sheet (re)opens.
  useEffect(() => {
    if (!open) return;
    setSelectedId(fallbackBook?.id ?? null);
    setSetAsCurrent(false);
    setShowFull(false);
    setNote("");
    // Don't reset timer when reopening — let it keep running
  }, [open]);

  // Re-prefill pages/mood when the active book changes.
  useEffect(() => {
    if (!open) return;
    setPages(defaultPages);
    setMood(defaultMood);
  }, [open, book?.id]);

  const save = (mode: "quick" | "full") => {
    if (!book) return;
    const n = parseInt(pages, 10);
    if (Number.isNaN(n) || n <= 0) {
      toast.error("How many pages did you read?");
      return;
    }
    const newProgress = Math.min(book.pages, book.progress + n);
    const fromPage = Math.max(0, newProgress - n);
    const elapsed = timerLiveSeconds > 0 ? timerLiveSeconds : undefined;
    logSession({
      bookId: book.id,
      mood: mode === "quick" ? defaultMood : mood,
      pagesRead: n,
      fromPage,
      toPage: newProgress,
      note: mode === "full" && note.trim() ? note.trim() : undefined,
      durationSec: elapsed,
    });
    if (newProgress !== book.progress) {
      updateProgress(book.id, newProgress);
    }
    if (setAsCurrent && book.id !== currentId) {
      setCurrent(book.id);
    }
    resetTimer();
    onOpenChange(false);
    const justFinished = newProgress >= book.pages && book.progress < book.pages;
    if (justFinished) {
      toast.success(`Marked "${book.title}" finished. 🎉`);
    } else {
      toast.success(
        mode === "quick" ? "Session logged." : `Session logged — ${n} pages.`,
      );
    }
  };

  const showPicker = activeBooks.length > 1;
  const isDifferentFromCurrent = !!book && book.id !== currentId;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-3xl max-h-[90vh] overflow-y-auto border-border/60"
      >
        <SheetHeader className="pr-8">
          <SheetTitle className="font-display text-xl">Log a session</SheetTitle>
          <SheetDescription>
            {book ? (
              <>
                <span className="text-foreground font-medium">{book.title}</span>
                <span className="text-muted-foreground"> · page {book.progress} of {book.pages}</span>
              </>
            ) : (
              "Pick a book to start tracking your reading."
            )}
          </SheetDescription>
        </SheetHeader>

        {!book ? (
          <div className="mt-4 rounded-2xl border border-dashed border-border/60 bg-card/40 p-6 text-center space-y-3">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-foreground/5">
              <BookOpen className="h-5 w-5" style={{ color: "var(--mood-strong)" }} />
            </div>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              No current book yet. Choose what you&apos;re reading and your sessions will collect here.
            </p>
            <div className="flex flex-col items-center gap-2 pt-1">
              <Button
                className="rounded-full gap-1.5"
                onClick={onPickBook}
              >
                <BookOpen className="h-3.5 w-3.5" /> Pick a book
              </Button>
              <p className="text-[11px] text-muted-foreground/80">
                We&apos;ll bring you right back here once a book is set.
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {/* Reading timer */}
            <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card/60 px-4 py-3">
              <Timer className="h-4 w-4 text-muted-foreground shrink-0" />
              <span
                className="font-display tabular-nums text-xl flex-1"
                style={{ color: timerRunning ? "var(--mood-strong)" : timerLiveSeconds > 0 ? "var(--foreground)" : "var(--muted-foreground)" }}
              >
                {timerLiveSeconds > 0 ? fmtTimer(timerLiveSeconds) : "0:00"}
              </span>
              {timerRunning ? (
                <Button size="sm" variant="outline" className="rounded-full gap-1.5 h-8" onClick={pauseTimer}>
                  <PauseCircle className="h-3.5 w-3.5" /> Pause
                </Button>
              ) : (
                <Button
                  size="sm"
                  className="rounded-full gap-1.5 h-8"
                  style={{ background: "var(--mood-strong)" }}
                  onClick={startTimer}
                >
                  <PlayCircle className="h-3.5 w-3.5" /> {timerLiveSeconds > 0 ? "Resume" : "Start timer"}
                </Button>
              )}
              {timerLiveSeconds > 0 && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="rounded-full h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                  onClick={resetTimer}
                  title="Reset timer"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>

            {showPicker && (
              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-widest text-muted-foreground">
                  Logging to
                </label>
                <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="w-full flex items-center gap-2 rounded-full border border-border bg-white/80 px-3 py-2 text-left text-sm hover:bg-white transition"
                    >
                      <BookOpen className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="flex-1 min-w-0 truncate">
                        <span className="font-medium text-foreground">{book.title}</span>
                        <span className="text-muted-foreground"> · {book.author}</span>
                      </span>
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground capitalize">
                        {book.shelf}
                      </span>
                      <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    align="start"
                    className="w-[--radix-popover-trigger-width] p-1"
                  >
                    <ul className="max-h-64 overflow-y-auto">
                      {activeBooks.map((b) => (
                        <li key={b.id}>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedId(b.id);
                              setPickerOpen(false);
                            }}
                            className={cn(
                              "w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-foreground/5",
                              b.id === book.id && "bg-foreground/5",
                            )}
                          >
                            <Check
                              className={cn(
                                "h-3.5 w-3.5 shrink-0",
                                b.id === book.id ? "opacity-100" : "opacity-0",
                              )}
                            />
                            <span className="flex-1 min-w-0 truncate">
                              <span className="font-medium text-foreground">{b.title}</span>
                              <span className="text-muted-foreground"> · {b.author}</span>
                            </span>
                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground capitalize shrink-0">
                              {b.shelf}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </PopoverContent>
                </Popover>
              </div>
            )}

            <div className="flex items-end gap-3">
              <div className="w-28">
                <label className="text-xs uppercase tracking-widest text-muted-foreground">
                  Pages
                </label>
                <Input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  value={pages}
                  onChange={(e) => setPages(e.target.value)}
                  className="bg-white/80 h-11 mt-1 font-display text-lg text-center"
                  autoFocus
                />
              </div>
              <div className="flex-1 text-xs text-muted-foreground pb-2">
                Last time you logged{" "}
                <span className="text-foreground font-medium">
                  {lastSession?.pagesRead ?? 10} pages
                </span>{" "}
                feeling{" "}
                <span className="inline-flex items-center gap-0.5 text-foreground font-medium">
                  <span>{MOODS[defaultMood].emoji}</span>
                  <span>{MOODS[defaultMood].label}</span>
                </span>
                .
              </div>
            </div>

            {showFull && (
              <div className="space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="space-y-1.5">
                  <label className="text-xs uppercase tracking-widest text-muted-foreground">
                    How did this session feel?
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {MOOD_KEYS.map((k) => (
                      <button
                        key={k}
                        onClick={() => setMood(k)}
                        className={cn(
                          "rounded-full border px-2.5 py-1 text-xs flex items-center gap-1 transition",
                          mood === k
                            ? "bg-foreground text-background border-foreground"
                            : "bg-white/80 border-border hover:bg-white",
                        )}
                      >
                        <span>{MOODS[k].emoji}</span>
                        <span>{MOODS[k].label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs uppercase tracking-widest text-muted-foreground">
                    Note (optional)
                  </label>
                  <Textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="A thread you want to remember…"
                    className="min-h-[64px] bg-white/80"
                  />
                </div>
              </div>
            )}

            {isDifferentFromCurrent && (
              <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                <Checkbox
                  checked={setAsCurrent}
                  onCheckedChange={(v) => setSetAsCurrent(v === true)}
                />
                <span>Also make this my current book on Home</span>
              </label>
            )}

            <div className="flex flex-wrap items-center gap-2 pt-1">
              {!showFull ? (
                <>
                  <Button
                    className="rounded-full gap-1.5 h-11"
                    style={{ background: "var(--mood-strong)" }}
                    onClick={() => save("quick")}
                  >
                    <Zap className="h-4 w-4" /> Quick log
                  </Button>
                  <Button
                    variant="outline"
                    className="rounded-full h-11"
                    onClick={() => setShowFull(true)}
                  >
                    Add mood &amp; note
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    className="rounded-full h-11"
                    style={{ background: "var(--mood-strong)" }}
                    onClick={() => save("full")}
                  >
                    Save session
                  </Button>
                  <Button
                    variant="ghost"
                    className="rounded-full h-11"
                    onClick={() => setShowFull(false)}
                  >
                    Quick log instead
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
