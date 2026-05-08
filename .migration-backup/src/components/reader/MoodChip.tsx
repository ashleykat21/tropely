import { MOODS, MoodKey } from "@/lib/moods";
import { cn } from "@/lib/utils";

export function MoodChip({ mood, className }: { mood: MoodKey; className?: string }) {
  const m = MOODS[mood];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
        "bg-white/60 backdrop-blur border border-border/60 text-foreground/80",
        className
      )}
    >
      <span aria-hidden>{m.emoji}</span>
      {m.label}
    </span>
  );
}
