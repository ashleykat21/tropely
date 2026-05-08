import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Focus, X, Play, Pause, Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Book } from "@/lib/store";
import { useLibrary } from "@/lib/store";
import { toast } from "sonner";
import { usePremium } from "@/lib/usePremium";

export function FocusMode({ book }: { book: Book }) {
  const { updateProgress } = useLibrary();
  const isPremium = usePremium((s) => s.isPremium);
  const [open, setOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [startPage, setStartPage] = useState(book.progress);
  const [endPage, setEndPage] = useState(book.progress);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [running]);

  const fmt = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h > 0 ? h + ":" : ""}${m.toString().padStart(h > 0 ? 2 : 1, "0")}:${sec
      .toString()
      .padStart(2, "0")}`;
  };

  const finish = () => {
    if (endPage > startPage) {
      updateProgress(book.id, endPage);
      toast.success(`+${endPage - startPage} pages in ${fmt(seconds)}.`);
    }
    setOpen(false);
    setRunning(false);
    setSeconds(0);
  };

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        className="rounded-full gap-1.5"
        onClick={() => {
          if (!isPremium) {
            toast("Focus Mode is a premium feature", {
              description: "Upgrade to unlock distraction-free reading.",
              icon: <Sparkles className="h-4 w-4" />,
            });
            return;
          }
          setStartPage(book.progress);
          setEndPage(book.progress);
          setSeconds(0);
          setRunning(true);
          setOpen(true);
        }}
      >
        {isPremium ? <Focus className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
        Focus mode
      </Button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{
              background:
                "linear-gradient(180deg, hsl(36 44% 97% / 0.96) 0%, hsl(var(--mood-h) calc(var(--mood-s) - 5%) 94% / 0.94) 100%)",
              backdropFilter: "blur(8px)",
            }}
          >
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 grid h-10 w-10 place-items-center rounded-full bg-background/40 hover:bg-background/60 transition"
              aria-label="Exit focus mode"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="text-center space-y-10 px-6 max-w-lg">
              <div className="space-y-2">
                <div className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
                  Reading
                </div>
                <div className="font-display text-xl sm:text-2xl text-foreground/90 leading-snug">
                  {book.title}
                </div>
                <h1 className="font-display text-6xl sm:text-8xl tabular-nums text-mood-ink mt-3">
                  {fmt(seconds)}
                </h1>
              </div>

              <div className="flex items-center justify-center gap-2">
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-full gap-2 h-12 px-6 text-base"
                  onClick={() => setRunning((r) => !r)}
                >
                  {running ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                  {running ? "Pause" : "Resume"}
                </Button>
              </div>

              <div className="rounded-2xl border border-border/50 bg-background/60 p-5 space-y-4 shadow-soft">
                <div className="text-xs text-muted-foreground uppercase tracking-widest">
                  When you stop, what page are you on?
                </div>
                <div className="flex items-center justify-center gap-3 text-base">
                  <span className="text-muted-foreground">From p.{startPage}</span>
                  <span className="text-muted-foreground">→</span>
                  <input
                    type="number"
                    min={startPage}
                    max={book.pages}
                    value={endPage}
                    onChange={(e) =>
                      setEndPage(Math.max(startPage, Math.min(book.pages, parseInt(e.target.value) || startPage)))
                    }
                    className="h-11 w-28 rounded-full bg-background/80 text-center font-display text-lg border border-border/60"
                  />
                  <span className="text-muted-foreground">/ {book.pages}</span>
                </div>
                <Button className="w-full rounded-full h-11" onClick={finish}>
                  Finish session
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
