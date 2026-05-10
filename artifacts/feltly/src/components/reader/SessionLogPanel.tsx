import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLibrary, type Book } from "@/lib/store";
import { MOODS, type MoodKey } from "@/lib/moods";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Quote, Plus, Timer, Sparkles, X } from "lucide-react";
import { toast } from "sonner";

const MOOD_KEYS = Object.keys(MOODS) as MoodKey[];

const MOOD_PROMPTS: Record<MoodKey, string[]> = {
  cozy: [
    "What made this session feel like home?",
    "Which line felt like a warm cup of tea?",
    "What comfort did this story offer today?",
  ],
  melancholy: [
    "What feeling did the story leave in your chest?",
    "Did anything in these pages mirror something real for you?",
    "Which ache resonated the most — and why?",
  ],
  intense: [
    "What had your heart racing the most?",
    "Did the tension feel earned? What built it?",
    "What would you do if you were in that moment?",
  ],
  dreamy: [
    "What image from these pages is still floating in your mind?",
    "Which detail made the world feel alive?",
    "What did you wish you could step into?",
  ],
  joyful: [
    "What made you smile — or actually laugh?",
    "Which character felt like sunshine today?",
    "What do you want to remember about this feeling?",
  ],
  mysterious: [
    "What question is still turning over in your mind?",
    "Did anything feel like a clue you're not sure about yet?",
    "What do you suspect — and what's throwing you off?",
  ],
  calm: [
    "What slowed your mind down in the best way?",
    "Was there a sentence you had to sit with for a moment?",
    "What did this session let you put down for a while?",
  ],
};

function getPrompt(mood: MoodKey): string {
  const prompts = MOOD_PROMPTS[mood] ?? ["What stayed with you from this session?"];
  return prompts[Math.floor(Math.random() * prompts.length)];
}

interface SessionLogPanelProps {
  book: Book;
  elapsed: number;
  onClearElapsed: () => void;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

const fmt = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

export function SessionLogPanel({ book, elapsed, onClearElapsed, open, onOpenChange }: SessionLogPanelProps) {
  const { logSession, addJournal } = useLibrary();
  const [mood, setMood] = useState<MoodKey>(book.mood);
  const [pages, setPages] = useState<string>("10");
  const [note, setNote] = useState("");
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [quote, setQuote] = useState("");
  const [quotePage, setQuotePage] = useState<string>(String(book.progress));
  const [postPrompt, setPostPrompt] = useState<{ prompt: string; savedMood: MoodKey } | null>(null);
  const [promptNote, setPromptNote] = useState("");

  useEffect(() => {
    setQuotePage(String(book.progress));
  }, [book.progress]);

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
    onOpenChange(false);
    onClearElapsed();
    setNote("");
    toast.success("Session logged.");
    setPostPrompt({ prompt: getPrompt(mood), savedMood: mood });
    setPromptNote("");
  };

  const savePromptNote = () => {
    if (!promptNote.trim()) { setPostPrompt(null); return; }
    addJournal({
      bookId: book.id,
      kind: "note",
      text: promptNote.trim(),
      mood: postPrompt?.savedMood,
    });
    setPostPrompt(null);
    setPromptNote("");
    toast.success("Reflection saved to your journal.");
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
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          className="rounded-full"
          onClick={() => { onOpenChange(!open); setQuoteOpen(false); }}
        >
          <Plus className="h-3.5 w-3.5 mr-1" /> Log a session
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="rounded-full"
          onClick={() => { setQuoteOpen((o) => !o); onOpenChange(false); }}
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
                onClick={onClearElapsed}
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

      <AnimatePresence>
        {postPrompt && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            className="rounded-2xl border border-border/60 bg-white/70 p-4 space-y-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Sparkles className="h-3 w-3 shrink-0" style={{ color: "var(--mood-strong)" }} />
                <span className="uppercase tracking-wider">Reflection prompt</span>
              </div>
              <button
                onClick={() => setPostPrompt(null)}
                className="text-muted-foreground hover:text-foreground transition -mt-0.5"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="text-sm font-display italic leading-snug">
              {postPrompt.prompt}
            </p>
            <Textarea
              value={promptNote}
              onChange={(e) => setPromptNote(e.target.value)}
              placeholder="Write anything — or skip…"
              className="min-h-[60px] bg-white/80 text-sm"
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setPostPrompt(null)}
                className="text-xs text-muted-foreground hover:text-foreground transition"
              >
                Skip
              </button>
              <Button
                size="sm"
                className="rounded-full"
                onClick={savePromptNote}
                disabled={!promptNote.trim()}
              >
                Save to journal
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {quoteOpen && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-white/60 border border-border/60 p-4 space-y-3"
        >
          <Textarea
            value={quote}
            onChange={(e) => setQuote(e.target.value)}
            placeholder={`\u201cThe line you can\u2019t stop thinking about\u2026\u201d`}
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
