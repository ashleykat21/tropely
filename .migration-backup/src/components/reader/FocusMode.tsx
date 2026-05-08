import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Focus, X, Play, Pause, Volume2, VolumeX, Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Book } from "@/lib/store";
import { useLibrary } from "@/lib/store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { usePremium } from "@/lib/usePremium";

type Ambient = { id: string; label: string; emoji: string; type: "white" | "brown" | "rain" | "off" };

const AMBIENTS: Ambient[] = [
  { id: "off", label: "Silence", emoji: "🤫", type: "off" },
  { id: "rain", label: "Rain", emoji: "🌧️", type: "rain" },
  { id: "brown", label: "Hum", emoji: "🌫️", type: "brown" },
  { id: "white", label: "Static", emoji: "📻", type: "white" },
];

function createAmbient(ctx: AudioContext, type: Ambient["type"]) {
  if (type === "off") return null;
  const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  if (type === "white") {
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  } else if (type === "brown") {
    let last = 0;
    for (let i = 0; i < data.length; i++) {
      const w = Math.random() * 2 - 1;
      last = (last + 0.02 * w) / 1.02;
      data[i] = last * 3.5;
    }
  } else if (type === "rain") {
    let last = 0;
    for (let i = 0; i < data.length; i++) {
      const w = Math.random() * 2 - 1;
      last = last * 0.96 + w * 0.08;
      data[i] = last + (Math.random() < 0.002 ? (Math.random() - 0.5) * 0.6 : 0);
    }
  }
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  src.loop = true;
  return src;
}

export function FocusMode({ book }: { book: Book }) {
  const { updateProgress } = useLibrary();
  const isPremium = usePremium((s) => s.isPremium);
  const [open, setOpen] = useState(false);
  const [ambient, setAmbient] = useState<Ambient>(AMBIENTS[0]);
  const [running, setRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(0.4);
  const [startPage, setStartPage] = useState(book.progress);
  const [endPage, setEndPage] = useState(book.progress);

  const ctxRef = useRef<AudioContext | null>(null);
  const srcRef = useRef<AudioBufferSourceNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [running]);

  // Audio lifecycle
  useEffect(() => {
    if (!open) return;
    if (ambient.type === "off" || muted) {
      srcRef.current?.stop();
      srcRef.current?.disconnect();
      srcRef.current = null;
      return;
    }
    const ctx = ctxRef.current ?? new (window.AudioContext || (window as any).webkitAudioContext)();
    ctxRef.current = ctx;
    if (ctx.state === "suspended") ctx.resume();
    srcRef.current?.stop();
    srcRef.current?.disconnect();
    const src = createAmbient(ctx, ambient.type);
    if (!src) return;
    const gain = ctx.createGain();
    gain.gain.value = volume;
    gainRef.current = gain;
    src.connect(gain).connect(ctx.destination);
    src.start();
    srcRef.current = src;
    return () => {
      try { src.stop(); src.disconnect(); } catch {}
    };
  }, [open, ambient.type, muted]);

  useEffect(() => {
    if (gainRef.current) gainRef.current.gain.value = muted ? 0 : volume;
  }, [volume, muted]);

  useEffect(() => {
    if (!open) {
      srcRef.current?.stop();
      srcRef.current?.disconnect();
      srcRef.current = null;
      ctxRef.current?.close().catch(() => {});
      ctxRef.current = null;
    }
  }, [open]);

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
              description: "Upgrade in the app store to unlock distraction-free reading & ambient sounds.",
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
            className="fixed inset-0 z-50 mood-surface flex items-center justify-center"
            style={{ backdropFilter: "blur(4px)" }}
          >
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 grid h-10 w-10 place-items-center rounded-full bg-background/40 hover:bg-background/60 transition"
              aria-label="Exit focus mode"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="text-center space-y-8 px-6 max-w-md">
              <div className="space-y-1.5">
                <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                  Reading · {book.title}
                </div>
                <h1 className="font-display text-5xl sm:text-7xl tabular-nums text-mood-ink">
                  {fmt(seconds)}
                </h1>
              </div>

              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  className="rounded-full gap-2"
                  onClick={() => setRunning((r) => !r)}
                >
                  {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  {running ? "Pause" : "Resume"}
                </Button>
              </div>

              <div className="space-y-3">
                <div className="text-xs text-muted-foreground uppercase tracking-widest">Ambient</div>
                <div className="flex flex-wrap justify-center gap-2">
                  {AMBIENTS.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => setAmbient(a)}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-xs transition",
                        ambient.id === a.id
                          ? "bg-foreground text-background border-foreground"
                          : "bg-background/50 border-border hover:bg-background/70"
                      )}
                    >
                      {a.emoji} {a.label}
                    </button>
                  ))}
                </div>
                {ambient.type !== "off" && (
                  <div className="flex items-center gap-2 justify-center">
                    <button
                      onClick={() => setMuted((m) => !m)}
                      className="grid h-7 w-7 place-items-center rounded-full bg-background/50 hover:bg-background/70 transition"
                      aria-label="Mute"
                    >
                      {muted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                    </button>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={volume}
                      onChange={(e) => setVolume(parseFloat(e.target.value))}
                      className="w-32 accent-foreground"
                    />
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-border/40 bg-background/40 p-4 space-y-3">
                <div className="text-xs text-muted-foreground uppercase tracking-widest">
                  When you stop, what page are you on?
                </div>
                <div className="flex items-center justify-center gap-3 text-sm">
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
                    className="h-9 w-24 rounded-full bg-background/60 text-center font-display"
                  />
                  <span className="text-muted-foreground">/ {book.pages}</span>
                </div>
                <Button className="w-full rounded-full" onClick={finish}>
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