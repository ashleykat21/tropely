import { useLibrary } from "@/lib/store";
import { Trophy } from "lucide-react";
import { Input } from "@/components/ui/input";

export function YearlyGoalCard() {
  const { books, finishes, yearlyGoal, setYearlyGoal } = useLibrary();
  const year = new Date().getFullYear();
  const startOfYear = new Date(year, 0, 1).getTime();
  // Count distinct books finished this year (use finishes log; fallback to books)
  const finishedThisYear = new Set(
    finishes.filter((f) => f.finishedAt >= startOfYear).map((f) => f.bookId)
  );
  // Include finished-shelf books even without explicit finish record
  books
    .filter((b) => b.shelf === "finished" && b.addedAt >= startOfYear)
    .forEach((b) => finishedThisYear.add(b.id));

  const count = finishedThisYear.size;
  const pct = Math.min(1, count / Math.max(1, yearlyGoal));
  const ahead = count >= yearlyGoal;

  return (
    <section className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur p-5 shadow-soft">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4" style={{ color: "var(--mood-strong)" }} />
          <h3 className="font-display text-lg">{year} reading goal</h3>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-muted-foreground">Goal</span>
          <Input
            type="number"
            min={1}
            max={500}
            className="h-7 w-16 text-center"
            value={yearlyGoal}
            onChange={(e) => setYearlyGoal(parseInt(e.target.value || "0", 10))}
          />
          <span className="text-muted-foreground">books</span>
        </div>
      </div>
      <div className="mt-3 flex items-end justify-between gap-3">
        <div>
          <div className="font-display text-3xl leading-none">
            {count} <span className="text-base text-muted-foreground">/ {yearlyGoal}</span>
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">
            {ahead
              ? "Goal hit. Anything else is a bonus."
              : `${yearlyGoal - count} more to reach ${yearlyGoal}.`}
          </div>
        </div>
        <div className="text-right">
          <div className="font-display text-xl">{Math.round(pct * 100)}%</div>
        </div>
      </div>
      <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${pct * 100}%`,
            background: ahead ? "var(--mood-strong)" : "hsl(var(--foreground) / 0.6)",
          }}
        />
      </div>
    </section>
  );
}