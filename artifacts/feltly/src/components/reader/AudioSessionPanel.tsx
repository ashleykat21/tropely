import { useState } from "react";
import { useLibrary, type Book } from "@/lib/store";
import { MOODS, type MoodKey } from "@/lib/moods";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Headphones, Play, ChevronDown, ChevronUp, Lock, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { usePremium } from "@/lib/usePremium";

const SPEEDS = [0.75, 1.0, 1.25, 1.5, 1.75, 2.0];

function fmtHM(mins: number) {
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function AudioSessionPanel({ book }: { book: Book }) {
  const { updateAudioProgress, logSession } = useLibrary();
  const isPremium = usePremium((s) => s.isPremium);

  const [expanded, setExpanded] = useState(false);
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(30);
  const [speed, setSpeed] = useState(1.0);
  const [mood, setMood] = useState<MoodKey>(book.mood);

  const total = book.audioMinutes ?? 0;
  const listened = Math.min(book.audioMinutesListened ?? 0, total);
  const pct = total > 0 ? Math.round((listened / total) * 100) : 0;
  const left = Math.max(0, total - listened);

  const realMinutes = hours * 60 + minutes;
  const effectiveSpeed = isPremium ? speed : 1.0;
  const adjustedMinutes = realMinutes * effectiveSpeed;

  const logListen = () => {
    if (realMinutes <= 0) { toast.error("Enter a listening time."); return; }
    const newListened = Math.min(total, listened + adjustedMinutes);
    updateAudioProgress(book.id, newListened);

    const pagesProxy = Math.max(1, Math.round(adjustedMinutes / 2));
    const fromPage = Math.round((listened / Math.max(1, total)) * book.pages);
    const toPage = Math.min(book.pages, Math.round((newListened / Math.max(1, total)) * book.pages));

    logSession({
      bookId: book.id,
      mood,
      pagesRead: pagesProxy,
      fromPage,
      toPage,
      durationSec: realMinutes * 60,
      note: `Listened ${fmtHM(realMinutes)}${isPremium && speed !== 1.0 ? ` at ${speed}x` : ""}`,
    });

    toast.success(
      isPremium && speed !== 1.0
        ? `Logged ${fmtHM(realMinutes)} (${fmtHM(adjustedMinutes)} adjusted at ${speed}x)`
        : `Logged ${fmtHM(realMinutes)}`
    );
    setHours(0);
    setMinutes(30);
    setExpanded(false);
  };

  return (
    <div className="rounded-xl border border-border/40 bg-card/60 overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-foreground/5 transition"
      >
        <div className="flex items-center gap-2">
          <Headphones className="h-4 w-4" style={{ color: "var(--mood-strong)" }} />
          <div className="text-left">
            <div className="text-sm font-medium">Log listening session</div>
            <div className="text-[11px] text-muted-foreground">
              {pct}% listened &middot; {fmtHM(left)} left
            </div>
          </div>
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>

      {/* Progress bar */}
      <div className="h-1 bg-muted">
        <div
          className="h-full transition-all"
          style={{ width: `${pct}%`, background: "var(--mood-strong)" }}
        />
      </div>

      {expanded && (
        <div className="p-4 space-y-4 border-t border-border/40">
          {/* Time input */}
          <div className="space-y-1.5">
            <Label className="text-xs">Listening time</Label>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 flex-1">
                <Input
                  type="number"
                  value={hours}
                  min={0}
                  max={24}
                  className="h-9 text-center"
                  onChange={(e) => setHours(Math.max(0, parseInt(e.target.value) || 0))}
                />
                <span className="text-xs text-muted-foreground">h</span>
              </div>
              <div className="flex items-center gap-1 flex-1">
                <Input
                  type="number"
                  value={minutes}
                  min={0}
                  max={59}
                  className="h-9 text-center"
                  onChange={(e) => setMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                />
                <span className="text-xs text-muted-foreground">m</span>
              </div>
            </div>
          </div>

          {/* Playback speed — premium only */}
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1.5">
              Playback speed
              {!isPremium && (
                <span className="inline-flex items-center gap-0.5 text-[9px] uppercase tracking-wider border border-border/60 rounded-full px-1.5 py-0.5 text-muted-foreground">
                  <Lock className="h-2.5 w-2.5" /> Premium
                </span>
              )}
              {isPremium && speed !== 1.0 && (
                <span className="ml-1 text-muted-foreground font-normal">
                  ({fmtHM(realMinutes)} &rarr; {fmtHM(adjustedMinutes)} adjusted)
                </span>
              )}
            </Label>
            <div className="flex flex-wrap gap-1.5">
              {SPEEDS.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    if (!isPremium && s !== 1.0) {
                      toast("Playback speed tracking is Premium", {
                        description: "Upgrade to log adjusted pages at custom speeds.",
                        icon: <Sparkles className="h-4 w-4" />,
                      });
                      return;
                    }
                    setSpeed(s);
                  }}
                  className={`rounded-full border px-2.5 py-1 text-[11px] transition flex items-center gap-1 ${
                    effectiveSpeed === s
                      ? "bg-foreground text-background border-foreground"
                      : "bg-white/60 border-border hover:bg-white"
                  } ${!isPremium && s !== 1.0 ? "opacity-40 cursor-not-allowed" : ""}`}
                >
                  {!isPremium && s !== 1.0 && <Lock className="h-2.5 w-2.5" />}
                  {s}x
                </button>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground">
              {isPremium
                ? "Adjusts equivalent pages read to match your actual pace."
                : "Unlock speed tracking with Premium to log adjusted pages."}
            </p>
          </div>

          {/* Mood */}
          <div className="space-y-1.5">
            <Label className="text-xs">How did it feel?</Label>
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(MOODS) as MoodKey[]).map((k) => (
                <button
                  key={k}
                  onClick={() => setMood(k)}
                  className={`rounded-full border px-2.5 py-1 text-[11px] transition ${
                    mood === k
                      ? "bg-foreground text-background border-foreground"
                      : "bg-white/60 border-border hover:bg-white"
                  }`}
                >
                  {MOODS[k].emoji} {MOODS[k].label}
                </button>
              ))}
            </div>
          </div>

          <Button
            className="w-full rounded-full gap-1.5"
            onClick={logListen}
            disabled={realMinutes <= 0}
            style={{ background: "var(--mood-strong)" }}
          >
            <Play className="h-3.5 w-3.5" />
            Log {fmtHM(realMinutes)}
            {isPremium && speed !== 1.0 && ` at ${speed}x`}
          </Button>
        </div>
      )}
    </div>
  );
}
