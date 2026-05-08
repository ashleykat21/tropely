import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useLibrary } from "@/lib/store";
import { MOODS } from "@/lib/moods";
import { BookCover } from "./BookCover";
import { MoodChip } from "./MoodChip";
import { EmojiReactionBar } from "./EmojiReactionBar";
import { SessionLogPanel } from "./SessionLogPanel";
import { ReflectionDialog } from "./ReflectionDialog";
import { MoodArc } from "./MoodArc";
import { CheckpointsPanel } from "./CheckpointsPanel";
import { EditBookDialog } from "./EditBookDialog";
import { FocusMode } from "./FocusMode";
import { HighlightOCR } from "./HighlightOCR";
import { ReadingPace } from "./ReadingPace";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BookOpen, Plus, Minus, PauseCircle, PlayCircle, RotateCcw, Smartphone, Heart, Headphones } from "lucide-react";
import { toast } from "sonner";
import { fetchPosition, getDeviceLabel, pushPosition, type RemotePosition } from "@/lib/positionSync";

export function CurrentBookCard() {
  const { books, currentId, updateProgress, addReaction, reflections, moveShelf, startReread, toggleFavorite, updateAudioProgress } = useLibrary();
  const book = books.find((b) => b.id === currentId) ?? books.find((b) => b.shelf === "reading");
  const [pageInput, setPageInput] = useState<string>(book ? String(book.progress) : "0");
  const [reflectOpen, setReflectOpen] = useState(false);
  const triggeredFor = useRef<string | null>(null);
  const [remote, setRemote] = useState<RemotePosition | null>(null);
  const lastPushedRef = useRef<number>(-1);
  const myDevice = getDeviceLabel();

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

  // Fetch remote position when switching books.
  useEffect(() => {
    if (!book) return;
    let cancelled = false;
    fetchPosition(book.title, book.author).then((p) => {
      if (!cancelled) setRemote(p);
    });
    return () => {
      cancelled = true;
    };
  }, [book?.id, book?.title, book?.author]);

  // Push local progress changes (debounced via simple ref-guard).
  useEffect(() => {
    if (!book) return;
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
  }, [book?.id, book?.progress, book?.title, book?.author, book?.pages]);

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
      className="grain relative overflow-hidden rounded-3xl mood-surface p-6 sm:p-10 shadow-soft border border-border/40"
    >
      <div className="grid gap-8 sm:grid-cols-[180px_1fr] sm:gap-10">
        <div className="mx-auto w-40 sm:w-44 animate-drift">
          <BookCover src={book.cover} title={book.title} />
        </div>

        <div className="flex flex-col gap-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <MoodChip mood={book.mood} />
              <span className="text-xs uppercase tracking-widest text-muted-foreground">
                Currently reading
              </span>
              <button
                onClick={() => {
                  toggleFavorite(book.id);
                  toast.success(book.favorite ? "Removed from Favorites" : "Added to Favorites ♥");
                }}
                className="ml-auto rounded-full border border-border/60 bg-background/60 p-1.5 hover:bg-background transition"
                aria-label={book.favorite ? "Unfavorite" : "Favorite"}
                title={book.favorite ? "Unfavorite" : "Add to Favorites"}
              >
                <Heart className={`h-3.5 w-3.5 ${book.favorite ? "fill-red-500 text-red-500" : "text-muted-foreground"}`} />
              </button>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl leading-[1.05] text-mood-ink">
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
          </div>

          {/* Progress */}
          <div className="space-y-2">
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
                  className="h-7 rounded-full text-[11px] px-3"
                  onClick={() => {
                    updateProgress(book.id, remote.page);
                    toast.success(`Synced to page ${remote.page}.`);
                  }}
                >
                  Catch up
                </Button>
              </div>
            )}
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
                  className="h-8 w-20 rounded-full bg-white/60 text-center font-display text-sm"
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
            <div className="flex items-center gap-2 pt-1">
              <Button
                size="icon"
                variant="outline"
                className="rounded-full h-8 w-8"
                onClick={() => updateProgress(book.id, book.progress - 10)}
                aria-label="Remove 10 pages"
              >
                <Minus className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="icon"
                variant="outline"
                className="rounded-full h-8 w-8"
                onClick={() => updateProgress(book.id, book.progress + 10)}
                aria-label="Add 10 pages"
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
              <span className="text-xs text-muted-foreground">Quick log · 10 pages</span>
              {book.shelf === "paused" ? (
                <Button
                  className="ml-auto rounded-full gap-2"
                  style={{ background: "var(--mood-strong)" }}
                  onClick={() => { moveShelf(book.id, "reading"); toast.success("Welcome back."); }}
                >
                  <PlayCircle className="h-4 w-4" /> Resume book
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    className="ml-auto rounded-full gap-2"
                    onClick={() => { moveShelf(book.id, "paused"); toast("Paused — pick it up whenever."); }}
                  >
                    <PauseCircle className="h-4 w-4" /> Pause
                  </Button>
                  <Button className="rounded-full gap-2" style={{ background: "var(--mood-strong)" }}>
                    <BookOpen className="h-4 w-4" /> Resume reading
                  </Button>
                </>
              )}
            </div>
          </div>

          {isListened && (
            <AudioListenPanel
              total={totalAudio}
              listened={listenedAudio}
              pct={audioPct}
              left={audioLeft}
              fmt={fmtHM}
              onChange={(mins) => updateAudioProgress(book.id, mins)}
            />
          )}

          {/* Reactions */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">How does this chapter feel?</p>
              {book.reactions.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Logged: {book.reactions.slice(-6).join(" ")}
                </p>
              )}
            </div>
            <EmojiReactionBar onReact={(e) => addReaction(book.id, e)} />
          </div>

          <SessionLogPanel book={book} />
          <ReadingPace book={book} />
          {book.shelf === "finished" && (
            <div className="flex">
              <Button
                variant="outline"
                className="rounded-full gap-2"
                onClick={() => {
                  startReread(book.id);
                  toast.success("Re-read started — back to page 0.");
                }}
              >
                <RotateCcw className="h-4 w-4" /> Read again
              </Button>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <FocusMode book={book} />
            <HighlightOCR />
          </div>
          <MoodArc bookId={book.id} />
          <CheckpointsPanel book={book} />
        </div>
      </div>
      <ReflectionDialog book={book} open={reflectOpen} onOpenChange={setReflectOpen} />
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
