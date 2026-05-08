import { TROPE_CATEGORIES } from "@/lib/tropes";
import { cn } from "@/lib/utils";

const TRENDING = [
  "Enemies to Lovers",
  "Dark Academia",
  "Found Family",
  "Slow Burn",
  "Morally Grey Protagonist",
  "Dual Timeline",
  "Dystopia",
  "Unreliable Narrator",
  "Coming of Age",
  "Chosen One",
  "Forced Proximity",
  "Political Intrigue",
];

function categoryEmoji(trope: string): string {
  for (const cat of TROPE_CATEGORIES) {
    if (cat.tropes.includes(trope)) return cat.emoji;
  }
  return "📖";
}

interface TrendingTropesProps {
  userTropes: string[];
  onTropeClick?: (trope: string) => void;
}

export function TrendingTropes({ userTropes, onTropeClick }: TrendingTropesProps) {
  const userSet = new Set(userTropes);
  const matchCount = TRENDING.filter((t) => userSet.has(t)).length;

  return (
    <section className="rounded-2xl mood-surface p-6 border border-border/40 space-y-4">
      <div className="space-y-0.5">
        <h2 className="font-display text-2xl">Community trending</h2>
        <p className="text-xs text-muted-foreground">
          {onTropeClick
            ? "Popular tropes right now — tap one to search for books."
            : "Popular tropes among readers right now. Your matches are highlighted."}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {TRENDING.map((trope) => {
          const matched = userSet.has(trope);
          const emoji = categoryEmoji(trope);
          const chip = (
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition",
                matched
                  ? "bg-foreground text-background border-foreground"
                  : "border-border/60 bg-background/60 text-foreground/70",
                onTropeClick && "cursor-pointer hover:border-foreground hover:text-foreground"
              )}
            >
              {emoji} {trope}
              {matched && !onTropeClick && <span className="text-[10px] opacity-60">✓</span>}
            </span>
          );
          if (onTropeClick) {
            return (
              <button key={trope} type="button" onClick={() => onTropeClick(trope)}>
                {chip}
              </button>
            );
          }
          return <span key={trope}>{chip}</span>;
        })}
      </div>
      {userSet.size > 0 && !onTropeClick && (
        <p className="text-[11px] text-muted-foreground">
          Your library matches{" "}
          <span className="font-medium text-foreground">{matchCount}</span> of {TRENDING.length}{" "}
          trending tropes.
        </p>
      )}
    </section>
  );
}
