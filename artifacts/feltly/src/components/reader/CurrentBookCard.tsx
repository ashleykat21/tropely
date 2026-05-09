import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useLibrary } from "@/lib/store";
import { MOODS } from "@/lib/moods";
import { BookCover } from "./BookCover";
import { MoodChip } from "./MoodChip";
import { EmojiReactionBar } from "./EmojiReactionBar";
import { SessionLogPanel } from "./SessionLogPanel";
import { ReflectionDialog } from "./ReflectionDialog";
import { RereadStartDialog, RereadFinishDialog } from "./RereadPromptDialog";
import { MoodArc } from "./MoodArc";
import { CheckpointsPanel } from "./CheckpointsPanel";
import { PageMarkersPanel } from "./PageMarkersPanel";
import { EditBookDialog } from "./EditBookDialog";
import { FocusMode } from "./FocusMode";
import { HighlightOCR } from "./HighlightOCR";
import { ReadingPace } from "./ReadingPace";
import { EstimatedFinishDate } from "./EstimatedFinishDate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Minus, PauseCircle, PlayCircle, RotateCcw, Smartphone, Heart, Headphones, Square, Trash2, ChevronDown, ChevronUp as ChevronUpIcon } from "lucide-react";
import { toast } from "sonner";
import { fetchPosition, getDeviceLabel, pushPosition, type RemotePosition } from "@/lib/positionSync";
import { usePremium } from "@/lib/usePremium";
import { EmotionalTriggerPanel } from "./EmotionalTriggerPanel";
import { AudioSessionPanel } from "./AudioSessionPanel";
import { TropeButton } from "./TropeButton";
import { MoodPlaylist } from "@/components/insights/MoodPlaylist";

export function CurrentBookCard() {
  const { books, currentId, updateProgress, addReaction, reflections, readSnapshots, moveShelf, startReread, toggleFavorite, updateAudioProgress } = useLibrary();
  const isPremium = usePremium((s) => s.isPremium);
  const book = books.find((b) => b.id === currentId) ?? books.find((b) => b.shelf === "reading");
  const [pageInput, setPageInput] = useState<string>(book ? String(book.progress) : "0");
  const [reflectOpen, setReflectOpen] = useState(false);
  const triggeredFor = useRef<string | null>(null);
  const [remote, setRemote] = useState<RemotePosition | null>(null);
  const lastPushedRef = useRef<number>(-1);
  const myDevice = getDeviceLabel();

  // --- Lifted timer state ---
  const [timerRunning, setTimerRunning] = useState(false);
  const [, setTimerTick] = useState(0);
  const timerStartedAt = useRef<number | null>(null);
  const timerAccumulated = useRef(0);
  const timerStartPage = useRef<number>(0);
  const [sessionElapsed, setSessionElapsed] = useState(0);
  const [sessionOpen, setSessionOpen] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [rereadStartOpen, setRereadStartOpen] = useState(false);
  const [rereadFinishOpen, setRereadFinishOpen] = useState(false);

  useEffect(() => {
    if (!timerRunning) return;
    const id = window.setInterval(() => setTimerTick((t) => t + 1), 1000);
    return () => window.clearInterval(id);
  }, [timerRunning]);

  // Allow other screens (e.g. Insights empty state) to pop open the session
  // logger via a window event.
  useEffect(() => {
    const handler = () => setSessionOpen(true);
    window.addEventListener("feltly:open-session-log", handler);
    return () => window.removeEventListener("feltly:open-session-log", handler);
  }, []);

  const timerLiveSeconds =
    timerAccumulated.current +
    (timerRunning && timerStartedAt.current
      ? Math.floor((Date.now() - timerStartedAt.current) / 1000)
      : 0);

  const fmtTimer = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const startTimer = (currentProgress: number) => {
    if (timerRunning) return;
    timerStartedAt.current = Date.now();
    if (timerAccumulated.current === 0) timerStartPage.current = currentProgress;
    setTimerRunning(true);
  };

  const pauseTimer = () => {
    if (!timerRunning) return;
    timerAccumulated.current = timerLiveSeconds;
    timerStartedAt.current = null;
    setTimerRunning(false);
  };

  const discardTimer = () => {
    timerAccumulated.current = 0;
    timerStartedAt.current = null;
    setTimerRunning(false);
    toast.message("Reading time discarded.");
  };

  const stopAndLog = (currentProgress: number) => {
    const total = timerLiveSeconds;
    timerAccumulated.current = 0;
    timerStartedAt.current = null;
    setTimerRunning(false);
    if (total <= 0) return;
    const inferred = Math.max(1, currentProgress - timerStartPage.current);
    setSessionElapsed(total);
    setSessionOpen(true);
    toast.success(`Timer stopped at ${fmtTimer(total)} — ready to log.`);
    void inferred;
  };

  useEffect(() => {
    if (book) setPageInput(String(book.progress));
  }, [book?.id, book?.progress]);

  // Trigger reflection dialog when a book is finished and has no reflection yet.
  useEffect(() => {
    if (!book) return;
    const isDone = book.progress >= book.pages && book.pages > 0;
    const hasReflection = reflections.some((r) => r.bookId === book.id);
    if (isDone && !hasReflection && triggeredFor.current !== book.id) {
      triggeredFor.current = book.id;
      setReflectOpen(true);
    }
  }, [book?.id, book?.progress, book?.pages, reflections, book]);

  // Fetch remote position when switching books — Premium only.
  useEffect(() => {
    if (!book || !isPremium) return;
    let cancelled = false;
    fetchPosition(book.title, book.author).then((p) => {
      if (!cancelled) setRemote(p);
    });
    return () => {
      cancelled = true;
    };
  }, [book?.id, book?.title, book?.author, isPremium]);

  // Push local progress changes (debounced) — Premium only.
  useEffect(() => {
    if (!book || !isPremium) return;
    if (lastPushedRef.current === book.progress) return;
    lastPushedRef.current = book.progress;
    const t = setTimeout(() => {
      pushPosition({
        title: book.title,
        author: book.author,
        page: book.progress,
        totalPages: book.pages,
      });
    }, 800);
    return () => clearTimeout(t);
  }, [book?.id, book?.progress, book?.title, book?.author, book?.pages, isPremium]);

  if (!book) return null;
  const pct = Math.round((book.progress / book.pages) * 100);
  const pagesLeft = Math.max(0, book.pages - book.progress);
  const isListened = book.consumption === "listened";
  const totalAudio = book.audioMinutes ?? 0;
  const listenedAudio = Math.min(book.audioMinutesListened ?? 0, totalAudio);
  const audioPct = totalAudio > 0 ? Math.round((listenedAudio / totalAudio) * 100) : 0;
  const audioLeft = Math.max(0, totalAudio - listenedAudio);
  const fmtHM = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h}h`;
    return `${m}m`;
  };

  const showRemoteBanner =
    isPremium &&
    remote &&
    remote.device_label &&
    remote.device_label !== myDevice &&
    remote.page > book.progress;

  const commitPage = () => {
    const n = parseInt(pageInput, 10);
    if (Number.isNaN(n)) {
      setPageInput(String(book.progress));
      return;
    }
    updateProgress(book.id, n);
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
      className="grain relative overflow-hidden rounded-3xl mood-surface p-4 sm:p-6 shadow-soft border border-border/40"
    >

      <div className="grid gap-5 sm:grid-cols-[148px_1fr] sm:gap-6">
        <div className="mx-auto w-32 sm:w-36 animate-drift">
          <BookCover src={book.cover} title={book.title} />
        </div>

        <div className="flex flex-col gap-3">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <TropeButton tropes={book.tropes ?? []} bookId={book.id} />
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/60 px-3 py-1 text-xs font-medium">
                {isListened ? (
                  <Headphones className="h-3 w-3 text-muted-foreground" />
                ) : null}
                {isListened ? "Currently listening" : "Currently reading"}
                {book.mood && (
                  <>
                    <span className="text-border">·</span>
                    <span style={{ color: "var(--mood-strong)" }}>
                      {MOODS[book.mood].emoji} {MOODS[book.mood].label}
                    </span>
                  </>
                )}
              </span>
              <button
                onClick={() => {
                  toggleFavorite(book.id);
                  toast.success(book.favorite ? "Removed from Favorites" : "Added to Favorites ♥");
                }}
                className="ml-auto inline-grid h-11 w-11 place-items-center rounded-full border border-border/60 bg-background/60 hover:bg-background transition"
                aria-label={book.favorite ? "Unfavorite" : "Favorite"}
                title={book.favorite ? "Unfavorite" : "Add to Favorites"}
              >
                <Heart className={`h-4 w-4 ${book.favorite ? "fill-red-500 text-red-500" : "text-muted-foreground"}`} />
              </button>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl leading-[1.05] text-mood-ink">
              {book.title}
            </h2>
            <div className="flex items-center gap-1 text-muted-foreground">
              <p>by {book.author}</p>
              <EditBookDialog book={book} />
              {(book.rereadCount ?? 0) > 0 && (
                <span className="ml-2 text-[10px] uppercase tracking-widest rounded-full border border-border/60 bg-background/50 px-2 py-0.5">
                  Re-read · {book.rereadCount! + 1}× total
                </span>
              )}
            </div>
            {book.translator && (
              <p className="text-xs text-muted-foreground -mt-1">
                Translated by {book.translator}
              </p>
            )}
            {book.narrator && isListened && (
              <p className="text-xs text-muted-foreground -mt-1 flex items-center gap-1">
                <Headphones className="h-3 w-3" />
                Narrated by {book.narrator}
              </p>
            )}
          </div>

          {/* Progress */}
          <div className="space-y-3">
            <div className="group-heading">Progress</div>
            {showRemoteBanner && remote && (
              <div className="flex items-center justify-between gap-2 rounded-2xl border border-border/60 bg-card/70 px-3 py-2 text-xs">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    Left off on <span className="font-medium text-foreground">{remote.device_label}</span> at page{" "}
                    <span className="font-medium text-foreground">{remote.page}</span>
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-10 rounded-full text-xs px-4"
                  onClick={() => {
                    updateProgress(book.id, remote.page);
                    toast.success(`Synced to page ${remote.page}.`);
                  }}
                >
                  Catch up
                </Button>
              </div>
            )}

            {isListened ? (
              <AudioListenPanel
                total={totalAudio}
                listened={listenedAudio}
                pct={audioPct}
                left={audioLeft}
                fmt={fmtHM}
                onChange={(mins) => updateAudioProgress(book.id, mins)}
              />
            ) : (
              <>
                <div className="flex items-end justify-between gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Page</span>
                    <Input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      max={book.pages}
                      value={pageInput}
                      onChange={(e) => setPageInput(e.target.value)}
                      onBlur={commitPage}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                      }}
                      className="h-11 w-20 rounded-full bg-white/60 text-center font-display text-base"
                      aria-label="Current page"
                    />
                    <span className="text-muted-foreground">of {book.pages}</span>
                  </div>
                  <div className="text-right leading-none">
                    <div className="font-display text-2xl text-mood-ink">{pct}%</div>
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      {pagesLeft} left
                    </div>
                  </div>
                </div>
                <div className="relative h-2 overflow-hidden rounded-full bg-white/50">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="h-full rounded-full"
                    style={{ background: "var(--mood-strong)" }}
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <div className="inline-flex items-center rounded-full border border-border/60 bg-background/60 p-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="rounded-full h-10 w-10"
                      onClick={() => updateProgress(book.id, book.progress - 10)}
                      aria-label="Remove 10 pages"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="px-1.5 text-xs text-muted-foreground select-none">+10</span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="rounded-full h-10 w-10"
                      onClick={() => updateProgress(book.id, book.progress + 10)}
                      aria-label="Add 10 pages"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="ml-auto flex items-center gap-2">
                    {timerLiveSeconds > 0 && (
                      <span
                        className="font-display tabular-nums text-base"
                        style={{ color: timerRunning ? "var(--mood-strong)" : "var(--muted-foreground)" }}
                      >
                        {fmtTimer(timerLiveSeconds)}
                      </span>
                    )}
                    {!timerRunning && timerAccumulated.current > 0 && (
                      <>
                        <Button size="sm" variant="ghost" className="h-11 rounded-full gap-1.5 px-4"
                          onClick={() => stopAndLog(book.progress)}>
                          <Square className="h-3.5 w-3.5" /> Log
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-11 w-11 rounded-full text-muted-foreground hover:text-destructive"
                          onClick={discardTimer}
                          aria-label="Discard reading time"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    {timerRunning ? (
                      <Button
                        variant="outline"
                        className="rounded-full gap-2 h-11 px-5"
                        onClick={pauseTimer}
                      >
                        <PauseCircle className="h-4 w-4" /> Pause reading
                      </Button>
                    ) : (
                      <Button
                        className="rounded-full gap-2 h-11 px-5"
                        style={{ background: "var(--mood-strong)" }}
                        onClick={() => {
                          if (book.shelf === "paused") {
                            moveShelf(book.id, "reading");
                            toast.success("Welcome back.");
                          }
                          startTimer(book.progress);
                        }}
                      >
                        <PlayCircle className="h-4 w-4" /> Resume reading
                      </Button>
                    )}
                  </div>
                </div>
              </>
            )}

            {isListened && (
              <div className="flex justify-end pt-1">
                {book.shelf === "paused" ? (
                  <Button
                    className="rounded-full gap-2 h-11 px-5"
                    style={{ background: "var(--mood-strong)" }}
                    onClick={() => { moveShelf(book.id, "reading"); toast.success("Welcome back."); }}
                  >
                    <PlayCircle className="h-4 w-4" /> Resume listening
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="rounded-full gap-2 h-11 px-5"
                    onClick={() => { moveShelf(book.id, "paused"); toast("Paused — pick it up whenever."); }}
                  >
                    <PauseCircle className="h-4 w-4" /> Pause listening
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Emoji mood row — directly below progress */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground">
                {isListened ? "How does this chapter sound?" : "How does this chapter feel?"}
              </span>
              {book.reactions.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  {book.reactions.slice(-6).join(" ")}
                </span>
              )}
            </div>
            <EmojiReactionBar onReact={(e) => addReaction(book.id, e)} />
          </div>

          {/* Action pill buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSessionOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/60 px-4 py-2 text-xs font-medium text-foreground hover:bg-background transition"
            >
              <Plus className="h-3.5 w-3.5" /> Log a session
            </button>
            <FocusMode book={book} />
            {book.shelf === "finished" && (
              <button
                className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/60 px-4 py-2 text-xs font-medium text-foreground hover:bg-background transition"
                onClick={() => setRereadStartOpen(true)}
              >
                <RotateCcw className="h-3.5 w-3.5" /> Read again
              </button>
            )}
          </div>

          {/* Audio session is core when listening — keep visible */}
          {isListened && <AudioSessionPanel book={book} />}

          {/* Core reading loop — session log panel (opened by button above) */}
          <SessionLogPanel
            book={book}
            elapsed={sessionElapsed}
            onClearElapsed={() => setSessionElapsed(0)}
            open={sessionOpen}
            onOpenChange={setSessionOpen}
          />

          {/* Everything else folds into one disclosure to keep the card breathable */}
          <button
            onClick={() => setShowDetails((v) => !v)}
            className="flex w-full items-center justify-between rounded-xl border border-border/40 bg-card/40 px-4 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-card/60 transition min-h-[44px]"
            aria-expanded={showDetails}
          >
            <span>Tools &amp; details</span>
            {showDetails ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          {showDetails && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-1 duration-200">
              <ReadingPace book={book} />
              {book.shelf === "reading" && <EstimatedFinishDate book={book} />}
              <EmotionalTriggerPanel book={book} />
              <MoodPlaylist />
              <div className="flex flex-wrap gap-2">
                <FocusMode book={book} />
                <HighlightOCR />
              </div>
              <MoodArc bookId={book.id} />
              <CheckpointsPanel book={book} />
              <PageMarkersPanel book={book} />
            </div>
          )}
        </div>
      </div>
      <ReflectionDialog
        book={book}
        open={reflectOpen}
        onOpenChange={setReflectOpen}
        onSaved={(book.rereadCount ?? 0) > 0 ? () => setRereadFinishOpen(true) : undefined}
      />
      <RereadStartDialog
        book={book}
        open={rereadStartOpen}
        onOpenChange={setRereadStartOpen}
        onDone={() => {
          startReread(book.id);
          toast.success("Re-read started — back to page 0.");
        }}
      />
      <RereadFinishDialog
        book={book}
        open={rereadFinishOpen}
        onOpenChange={setRereadFinishOpen}
        previousSnapshot={
          readSnapshots
            .filter((sn) => sn.bookId === book.id)
            .sort((a, b) => a.readIndex - b.readIndex)[0] ?? null
        }
      />
    </motion.section>
  );
}

function AudioListenPanel({
  total,
  listened,
  pct,
  left,
  fmt,
  onChange,
}: {
  total: number;
  listened: number;
  pct: number;
  left: number;
  fmt: (m: number) => string;
  onChange: (mins: number) => void;
}) {
  const [h, setH] = useState<string>(String(Math.floor(listened / 60)));
  const [m, setM] = useState<string>(String(listened % 60));

  useEffect(() => {
    setH(String(Math.floor(listened / 60)));
    setM(String(listened % 60));
  }, [listened]);

  const commit = (nh = h, nm = m) => {
    const mins = Math.max(
      0,
      (parseInt(nh || "0", 10) || 0) * 60 + (parseInt(nm || "0", 10) || 0)
    );
    const clamped = total > 0 ? Math.min(mins, total) : mins;
    onChange(clamped);
  };

  const bump = (deltaMin: number) => {
    const next = Math.max(0, listened + deltaMin);
    const clamped = total > 0 ? Math.min(next, total) : next;
    onChange(clamped);
    if (clamped >= total && total > 0) {
      toast.success("Audiobook finished 🎧");
    }
  };

  if (total === 0) {
    return (
      <div className="rounded-2xl border border-border/50 bg-background/40 px-4 py-3 text-sm flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Headphones className="h-3.5 w-3.5" />
          <span>Set the audiobook length in book details to log listening time.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2 rounded-2xl border border-border/50 bg-background/40 p-4">
      <div className="flex items-end justify-between gap-3 text-sm">
        <div className="flex items-center gap-2 flex-wrap">
          <Headphones className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-muted-foreground">Listened</span>
          <Input
            type="number"
            min={0}
            max={99}
            inputMode="numeric"
            value={h}
            onChange={(e) => setH(e.target.value.replace(/[^0-9]/g, "").slice(0, 2))}
            onBlur={() => commit()}
            onKeyDown={(e) => {
              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
            }}
            className="h-8 w-14 rounded-full bg-white/60 text-center font-display text-sm"
            aria-label="Hours listened"
          />
          <span className="text-muted-foreground text-xs">hr</span>
          <Input
            type="number"
            min={0}
            max={59}
            inputMode="numeric"
            value={m}
            onChange={(e) => setM(e.target.value.replace(/[^0-9]/g, "").slice(0, 2))}
            onBlur={() => commit()}
            onKeyDown={(e) => {
              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
            }}
            className="h-8 w-14 rounded-full bg-white/60 text-center font-display text-sm"
            aria-label="Minutes listened"
          />
          <span className="text-muted-foreground text-xs">min of {fmt(total)}</span>
        </div>
        <div className="text-right leading-none">
          <div className="font-display text-2xl text-mood-ink">{pct}%</div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
            {fmt(left)} left
          </div>
        </div>
      </div>
      <div className="relative h-2 overflow-hidden rounded-full bg-white/50">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ background: "var(--mood-strong)" }}
        />
      </div>
      <div className="flex items-center gap-2 pt-1 flex-wrap">
        <Button
          size="sm"
          variant="outline"
          className="rounded-full h-8 gap-1"
          onClick={() => bump(-15)}
          aria-label="Subtract 15 minutes"
        >
          <Minus className="h-3.5 w-3.5" /> 15m
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="rounded-full h-8 gap-1"
          onClick={() => bump(15)}
          aria-label="Add 15 minutes"
        >
          <Plus className="h-3.5 w-3.5" /> 15m
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="rounded-full h-8 gap-1"
          onClick={() => bump(30)}
          aria-label="Add 30 minutes"
        >
          <Plus className="h-3.5 w-3.5" /> 30m
        </Button>
        <span className="text-xs text-muted-foreground">Quick log</span>
      </div>
    </div>
  );
}
