import { useState } from "react";
import { useLibrary, type TriggerType } from "@/lib/store";
import { type Book } from "@/lib/store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, Zap } from "lucide-react";

const TRIGGERS: { type: TriggerType; emoji: string; label: string }[] = [
  { type: "gut-punch",        emoji: "😢", label: "Gut-punch"    },
  { type: "relief",           emoji: "😮\u200d💨", label: "Relief"   },
  { type: "plot-twist",       emoji: "🌀", label: "Plot twist"  },
  { type: "laughed-out-loud", emoji: "😂", label: "LOL"         },
  { type: "heartbreak",       emoji: "💔", label: "Heartbreak"  },
  { type: "turning-point",    emoji: "⚡", label: "Turning point"},
];

export function EmotionalTriggerPanel({ book }: { book: Book }) {
  const { addJournal, journal } = useLibrary();
  const [expanded, setExpanded] = useState(false);

  const recentTriggers = journal
    .filter((j) => j.bookId === book.id && j.kind === "trigger")
    .slice(0, 5);

  const tap = (t: { type: TriggerType; emoji: string; label: string }) => {
    addJournal({
      bookId: book.id,
      kind: "trigger",
      text: t.label,
      page: book.progress,
      triggerType: t.type,
    });
    toast.success(`${t.emoji} Marked at page ${book.progress}.`);
  };

  return (
    <div className="rounded-2xl border border-border/50 bg-white/40 overflow-hidden">
      <button
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-white/30 transition"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-center gap-2">
          <Zap className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-sm font-medium">Mark this moment</span>
          {recentTriggers.length > 0 && (
            <span className="text-[10px] text-muted-foreground">
              · {recentTriggers.length} marked
            </span>
          )}
        </div>
        {expanded ? (
          <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-border/40">
          <p className="text-[11px] text-muted-foreground pt-3">
            Tag an emotional beat at page {book.progress} — it appears on your mood arc.
          </p>
          <div className="flex flex-wrap gap-2">
            {TRIGGERS.map((t) => (
              <button
                key={t.type}
                onClick={() => tap(t)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full border border-border/60 bg-white/70",
                  "px-3 py-1.5 text-xs font-medium hover:bg-white hover:border-border transition active:scale-95"
                )}
              >
                <span>{t.emoji}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </div>

          {recentTriggers.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Recent moments
              </p>
              {recentTriggers.map((j) => {
                const found = TRIGGERS.find((t) => t.type === j.triggerType);
                return (
                  <div
                    key={j.id}
                    className="flex items-center gap-2 text-xs text-muted-foreground"
                  >
                    <span>{found?.emoji ?? "⚡"}</span>
                    <span className="font-medium text-foreground">{found?.label ?? j.text}</span>
                    {j.page != null && (
                      <span className="ml-auto tabular-nums">p.{j.page}</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
