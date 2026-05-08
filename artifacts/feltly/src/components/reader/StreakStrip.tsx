import { useEffect, useMemo } from "react";
import { useLibrary } from "@/lib/store";
import { computeStreak } from "@/lib/streak";
import { Flame, Target, Calendar, Snowflake, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePremium } from "@/lib/usePremium";
import { toast } from "sonner";

const startOfDay = (ms: number) => {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

export function StreakStrip() {
  const sessions = useLibrary((s) => s.sessions);
  const dailyGoal = useLibrary((s) => s.dailyGoalPages);
  const freeze = useLibrary((s) => s.freeze);
  const reconcileFreeze = useLibrary((s) => s.reconcileFreeze);
  const isPremium = usePremium((s) => s.isPremium);

  // Premium only: accrue weekly freeze + auto-cover missed yesterdays.
  useEffect(() => {
    if (isPremium) reconcileFreeze();
  }, [reconcileFreeze, isPremium]);

  const streak = useMemo(() => computeStreak(sessions, freeze), [sessions, freeze]);

  // 7-day dot row (oldest → today)
  const last7 = useMemo(() => {
    const today = startOfDay(Date.now());
    const map = new Map<number, number>();
    for (const s of sessions) {
      const d = startOfDay(s.at);
      map.set(d, (map.get(d) ?? 0) + s.pagesRead);
    }
    return Array.from({ length: 7 }, (_, i) => {
      const day = today - (6 - i) * 86400000;
      return { day, pages: map.get(day) ?? 0 };
    });
  }, [sessions]);

  const goalPct = Math.min(1, streak.todayPages / dailyGoal);
  const goalMet = streak.todayPages >= dailyGoal;

  return (
    <section className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur p-4 shadow-soft grid gap-4 sm:grid-cols-3 sm:items-center">
      {/* Streak */}
      <div className="flex items-center gap-2.5">
        <div
          className={cn(
            "grid h-9 w-9 place-items-center rounded-xl",
            streak.current > 0 ? "bg-foreground text-background" : "bg-muted text-muted-foreground"
          )}
        >
          <Flame className="h-4 w-4" />
        </div>
        <div>
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground">
            <span>Streak</span>
            {isPremium && streak.freezesAvailable > 0 && (
              <span
                className="inline-flex items-center gap-0.5 rounded-full bg-sky-100 text-sky-700 px-1.5 py-0.5 normal-case tracking-normal text-[10px] font-medium"
                title={`${streak.freezesAvailable} streak freeze${streak.freezesAvailable === 1 ? "" : "s"} — auto-saves you on a missed day`}
              >
                <Snowflake className="h-2.5 w-2.5" />
                {streak.freezesAvailable}
              </span>
            )}
            {!isPremium && (
              <button
                onClick={() => toast("Streak freezes are Premium", {
                  description: "Earn weekly streak freezes that auto-cover missed reading days. Upgrade to unlock.",
                  icon: <Snowflake className="h-4 w-4" />,
                })}
                className="inline-flex items-center gap-0.5 rounded-full bg-muted text-muted-foreground px-1.5 py-0.5 normal-case tracking-normal text-[10px] font-medium hover:bg-muted/80 transition"
                title="Streak freeze — Premium"
              >
                <Lock className="h-2.5 w-2.5" />
                Freeze
              </button>
            )}
          </div>
          <div className="font-display text-xl leading-none mt-0.5">
            {streak.current} <span className="text-sm text-muted-foreground">day{streak.current === 1 ? "" : "s"}</span>
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">
            {streak.freezeSavedToday
              ? "A freeze covered yesterday — you're safe."
              : streak.longest > streak.current
              ? `Best: ${streak.longest}`
              : streak.current > 0
              ? "Personal best — keep going."
              : "Log a session today to start one."}
          </div>
        </div>
      </div>

      {/* Daily goal */}
      <div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-muted-foreground">
            <Target className="h-3 w-3" /> Today's goal
          </div>
          <div className="text-xs text-muted-foreground">
            {streak.todayPages} / {dailyGoal} pages
          </div>
        </div>
        <div className="relative h-2 mt-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${goalPct * 100}%`,
              background: goalMet ? "var(--mood-strong)" : "hsl(var(--foreground) / 0.6)",
            }}
          />
        </div>
        <div className={cn("text-[11px] mt-1.5", goalMet ? "text-foreground" : "text-muted-foreground")}>
          {goalMet
            ? "Goal hit. Streak safe for today."
            : `${dailyGoal - streak.todayPages} more pages to lock in today.`}
        </div>
      </div>

      {/* 7-day dots */}
      <div>
        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-muted-foreground">
          <Calendar className="h-3 w-3" /> Last 7 days
        </div>
        <div className="flex items-end gap-1.5 mt-3 h-10">
          {last7.map((d, i) => {
            const max = Math.max(dailyGoal, ...last7.map((x) => x.pages));
            const h = max ? (d.pages / max) * 100 : 0;
            const hit = d.pages >= dailyGoal;
            const isToday = i === 6;
            return (
              <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-md transition"
                  style={{
                    height: `${Math.max(h, d.pages > 0 ? 12 : 4)}%`,
                    background: hit ? "var(--mood-strong)" : "hsl(var(--foreground) / 0.25)",
                    opacity: d.pages > 0 ? 1 : 0.3,
                  }}
                />
                <div
                  className={cn(
                    "text-[9px] uppercase tracking-wider",
                    isToday ? "text-foreground font-medium" : "text-muted-foreground"
                  )}
                >
                  {new Date(d.day).toLocaleDateString(undefined, { weekday: "narrow" })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}