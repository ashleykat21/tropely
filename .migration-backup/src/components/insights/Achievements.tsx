import { useEffect, useMemo, useState } from "react";
import { useLibrary } from "@/lib/store";
import { computeBadges } from "@/lib/badges";
import { Award, Lock, Trophy, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function Achievements() {
  const {
    books, sessions, reactionLog, reflections, journal,
    lifetimeRewards, recordLifetimeEarned, claimLifetimeReward,
  } = useLibrary();
  const [scope, setScope] = useState<"month" | "lifetime">("month");

  const badges = useMemo(
    () => computeBadges({ books, sessions, reactionLog, reflections, journal, scope }),
    [books, sessions, reactionLog, reflections, journal, scope]
  );

  const lifetimeBadges = useMemo(
    () => computeBadges({ books, sessions, reactionLog, reflections, journal, scope: "lifetime" }),
    [books, sessions, reactionLog, reflections, journal]
  );
  useEffect(() => {
    const ids = lifetimeBadges.filter((b) => b.earned).map((b) => b.id);
    if (ids.length) recordLifetimeEarned(ids);
  }, [lifetimeBadges, recordLifetimeEarned]);

  const earned = badges.filter((b) => b.earned).length;
  const monthLabel = new Date().toLocaleString(undefined, { month: "long" });
  const nextReset = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1);
  const daysLeft = Math.max(
    0,
    Math.ceil((nextReset.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  );

  const isLifetime = scope === "lifetime";
  const claimable = isLifetime
    ? badges.filter((b) => b.earned && !lifetimeRewards.includes(b.id))
    : [];

  return (
    <section className="rounded-2xl bg-card/70 p-6 border border-border/40 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Award className="h-4 w-4" style={{ color: "var(--mood-strong)" }} />
          <h2 className="font-display text-2xl">
            Achievements · {isLifetime ? "Lifetime" : monthLabel}
          </h2>
        </div>
        <div className="text-xs text-muted-foreground">
          {earned}/{badges.length} earned
        </div>
      </div>

      <div className="flex items-center gap-2 -mt-1 flex-wrap">
        <div className="flex gap-1 rounded-full border border-border/60 bg-background/50 p-0.5 text-xs">
          {(["month", "lifetime"] as const).map((k) => (
            <button
              key={k}
              onClick={() => setScope(k)}
              className={cn(
                "rounded-full px-3 py-1 transition inline-flex items-center gap-1",
                scope === k
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {k === "lifetime" && <Trophy className="h-3 w-3" />}
              {k === "month" ? "Monthly" : "Lifetime"}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          {isLifetime
            ? `${lifetimeRewards.length} trophy reward${lifetimeRewards.length === 1 ? "" : "s"} claimed.`
            : `Resets on the 1st — ${daysLeft} day${daysLeft === 1 ? "" : "s"} left.`}
        </p>
      </div>

      {isLifetime && claimable.length > 0 && (
        <div className="rounded-xl border border-amber-300/60 bg-amber-50/60 p-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm">
            <Sparkles className="h-4 w-4 text-amber-600" />
            <span>
              You have {claimable.length} unclaimed lifetime{" "}
              {claimable.length === 1 ? "reward" : "rewards"}.
            </span>
          </div>
          <Button
            size="sm"
            className="rounded-full"
            onClick={() => {
              claimable.forEach((b) => claimLifetimeReward(b.id));
              toast.success(`Claimed ${claimable.length} trophy reward${claimable.length === 1 ? "" : "s"}!`);
            }}
          >
            Claim all
          </Button>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {badges.map((b) => {
          const claimed = isLifetime && b.earned && lifetimeRewards.includes(b.id);
          const unclaimed = isLifetime && b.earned && !lifetimeRewards.includes(b.id);
          return (
            <div
              key={b.id}
              className={cn(
                "rounded-xl border p-3 transition",
                b.earned
                  ? "border-foreground/30 bg-foreground/[0.04]"
                  : "border-border/50 bg-background/40 opacity-80",
                claimed && "border-amber-400/70 bg-amber-50/40"
              )}
            >
              <div className="flex items-center justify-between">
                <div className="text-2xl leading-none">{b.emoji}</div>
                {!b.earned ? (
                  <Lock className="h-3 w-3 text-muted-foreground" />
                ) : claimed ? (
                  <Trophy className="h-3 w-3 text-amber-600" />
                ) : null}
              </div>
              <div className="font-display text-sm mt-2 leading-tight">{b.label}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5 leading-snug">{b.desc}</div>
              {!b.earned && (
                <>
                  <div className="h-1 mt-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(b.progress ?? 0) * 100}%`,
                        background: "var(--mood-strong)",
                      }}
                    />
                  </div>
                  <div className="text-[9px] text-muted-foreground mt-1">{b.hint}</div>
                </>
              )}
              {unclaimed && (
                <button
                  onClick={() => {
                    claimLifetimeReward(b.id);
                    toast.success(`🏆 ${b.label} trophy claimed!`);
                  }}
                  className="mt-2 w-full rounded-full bg-foreground text-background text-[10px] py-1 hover:opacity-90 transition"
                >
                  Claim trophy 🏆
                </button>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
