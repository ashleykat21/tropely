import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useLibrary, type Book } from "@/lib/store";
import { MOODS, type MoodKey } from "@/lib/moods";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Quote, Plus, Play, Pause, Square, Timer } from "lucide-react";
import { toast } from "sonner";

const MOOD_KEYS = Object.keys(MOODS) as MoodKey[];

export function SessionLogPanel({ book }: { book: Book }) {
  const { logSession, addJournal, updateProgress } = useLibrary();
  const [open, setOpen] = useState(false);
  const [mood, setMood] = useState<MoodKey>(book.mood);
  const [pages, setPages] = useState<string>("10");
  const [note, setNote] = useState("");
  const [elapsed, setElapsed] = useState(0); // seconds carried into the form

  const [quoteOpen, setQuoteOpen] = useState(false);
  const [quote, setQuote] = useState("");
  const [quotePage, setQuotePage] = useState<string>(String(book.progress));

  // Timer state
  const [running, setRunning] = useState(false);
  const [tick, setTick] = useState(0); // forces rerender each second
  const startedAt = useRef<number | null>(null);
  const accumulated = useRef(0);
  const startPage = useRef<number>(book.progress);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setTick((t) => t + 1), 1000);
    return () => window.clearInterval(id);
  }, [running]);

  const liveSeconds =
    accumulated.current + (running && startedAt.current ? Math.floor((Date.now() - startedAt.current) / 1000) : 0);

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const startTimer = () => {
    if (running) return;
    startedAt.current = Date.now();
    if (accumulated.current === 0) startPage.current = book.progress;
    setRunning(true);
  };
  const pauseTimer = () => {
    if (!running) return;
    accumulated.current = liveSeconds;
    startedAt.current = null;
    setRunning(false);
  };
  const stopAndPrefill = () => {
    const total = liveSeconds;
    accumulated.current = 0;
    startedAt.current = null;
    setRunning(false);
    if (total <= 0) return;
    const inferred = Math.max(1, book.progress - startPage.current);
    setPages(String(inferred));
    setElapsed(total);
    setOpen(true);
    setQuoteOpen(false);
    toast.success(`Timer stopped at ${fmt(total)} — ready to log.`);
  };

  const submit = () => {
    const n = parseInt(pages, 10);
    if (Number.isNaN(n) || n <= 0) {
      toast.error("How many pages did you read?");
      return;
    }
    logSession({
      bookId: book.id,
      mood,
      pagesRead: n,
      fromPage: Math.max(0, book.progress - n),
      toPage: book.progress,
      note: note.trim() || undefined,
      durationSec: elapsed > 0 ? elapsed : undefined,
    });
    setOpen(false);
    setNote("");
    setElapsed(0);
    toast.success("Session logged.");
  };

  const saveQuote = () => {
    if (!quote.trim()) return;
    addJournal({
      bookId: book.id,
      kind: "quote",
      text: quote.trim(),
      page: quotePage ? parseInt(quotePage, 10) : undefined,
    });
    setQuote("");
    setQuoteOpen(false);
    toast.success("Quote saved to your highlights.");
  };

  return (
    <div className="space-y-3 pt-2">
      {/* Timer strip */}
      <div className="flex items-center gap-2 rounded-full border border-border/60 bg-white/60 px-3 py-1.5">
        <Timer className="h-3.5 w-3.5 text-muted-foreground" />
        <span
          className={cn(
            "font-display tabular-nums text-sm",
            running && "text-mood-ink"
          )}
        >
          {fmt(liveSeconds)}
        </span>
        {!running ? (
          <Button size="sm" variant="outline" className="h-7 rounded-full ml-1 gap-1" onClick={startTimer}>
            <Play className="h-3 w-3" /> {accumulated.current > 0 ? "Resume" : "Start"}
          </Button>
        ) : (
          <Button size="sm" variant="outline" className="h-7 rounded-full ml-1 gap-1" onClick={pauseTimer}>
            <Pause className="h-3 w-3" /> Pause
          </Button>
        )}
        {(running || accumulated.current > 0) && (
          <Button size="sm" variant="ghost" className="h-7 rounded-full gap-1" onClick={stopAndPrefill}>
            <Square className="h-3 w-3" /> Stop & log
          </Button>
        )}
        {accumulated.current > 0 && !running && (
          <span className="text-[10px] text-muted-foreground">
            from p.{startPage.current} → p.{book.progress}
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          className="rounded-full"
          onClick={() => { setOpen((o) => !o); setQuoteOpen(false); }}
        >
          <Plus className="h-3.5 w-3.5 mr-1" /> Log a session
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="rounded-full"
          onClick={() => { setQuoteOpen((o) => !o); setOpen(false); }}
        >
          <Quote className="h-3.5 w-3.5 mr-1" /> Save a quote
        </Button>
      </div>

      {open && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-white/60 border border-border/60 p-4 space-y-3"
        >
          {elapsed > 0 && (
            <div className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Timer className="h-3 w-3" />
              Duration: <span className="font-medium text-foreground">{fmt(elapsed)}</span>
              <button
                onClick={() => setElapsed(0)}
                className="ml-2 underline hover:text-foreground"
              >
                clear
              </button>
            </div>
          )}
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
                      : "bg-white/80 border-border hover:bg-white"
                  )}
                >
                  <span>{MOODS[k].emoji}</span>
                  <span>{MOODS[k].label}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-end gap-3">
            <div className="w-28">
              <label className="text-xs text-muted-foreground">Pages read</label>
              <Input
                type="number"
                inputMode="numeric"
                min={1}
                value={pages}
                onChange={(e) => setPages(e.target.value)}
                className="bg-white/80 h-9"
              />
            </div>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="A thread you want to remember… (optional)"
              className="min-h-[40px] bg-white/80 flex-1"
            />
            <Button onClick={submit} className="rounded-full h-9">Save</Button>
          </div>
        </motion.div>
      )}

      {quoteOpen && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-white/60 border border-border/60 p-4 space-y-3"
        >
          <Textarea
            value={quote}
            onChange={(e) => setQuote(e.target.value)}
            placeholder="“The line you can't stop thinking about…”"
            className="min-h-[80px] bg-white/80 font-display italic"
          />
          <div className="flex items-end gap-3">
            <div className="w-28">
              <label className="text-xs text-muted-foreground">Page</label>
              <Input
                type="number"
                value={quotePage}
                onChange={(e) => setQuotePage(e.target.value)}
                className="bg-white/80 h-9"
              />
            </div>
            <Button onClick={saveQuote} className="ml-auto rounded-full h-9">Save quote</Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
