import { useMemo } from "react";
import { useLibrary } from "@/lib/store";
import { MOODS, type MoodKey } from "@/lib/moods";
import { Clock, AlertCircle, Layers } from "lucide-react";

const HOUR_BUCKETS = [
  { key: "morning", label: "Morning", range: [5, 11], emoji: "🌅" },
  { key: "afternoon", label: "Afternoon", range: [12, 17], emoji: "☀️" },
  { key: "evening", label: "Evening", range: [18, 21], emoji: "🌆" },
  { key: "night", label: "Late night", range: [22, 4], emoji: "🌙" },
] as const;

function bucketFor(hour: number) {
  if (hour >= 5 && hour <= 11) return "morning";
  if (hour >= 12 && hour <= 17) return "afternoon";
  if (hour >= 18 && hour <= 21) return "evening";
  return "night";
}

export function PremiumDeepInsights() {
  const { sessions, books, reactionLog } = useLibrary();

  // Time-of-day reading
  const todStats = useMemo(() => {
    const counts: Record<string, { sessions: number; pages: number }> = {};
    HOUR_BUCKETS.forEach((b) => (counts[b.key] = { sessions: 0, pages: 0 }));
    sessions.forEach((s) => {
      const h = new Date(s.at).getHours();
      const k = bucketFor(h);
      counts[k].sessions += 1;
      counts[k].pages += s.pagesRead;
    });
    const max = Math.max(1, ...Object.values(counts).map((c) => c.pages));
    return HOUR_BUCKETS.map((b) => ({
      ...b,
      ...counts[b.key],
      pct: counts[b.key].pages / max,
    }));
  }, [sessions]);

  const peakBucket = todStats.reduce((a, b) => (b.pages > a.pages ? b : a), todStats[0]);

  // Mood × tag (genre) heat
  const moodTag = useMemo(() => {
    const map: Record<string, Record<MoodKey, number>> = {};
    books.forEach((b) => {
      (b.tags ?? []).forEach((t) => {
        if (!map[t]) map[t] = {} as Record<MoodKey, number>;
        map[t][b.mood] = (map[t][b.mood] || 0) + 1;
      });
    });
    const rows = Object.entries(map)
      .map(([tag, ms]) => {
        const top = Object.entries(ms).sort((a, b) => b[1] - a[1])[0];
        const total = Object.values(ms).reduce((a, b) => a + b, 0);
        return { tag, mood: top[0] as MoodKey, count: top[1], total };
      })
      .sort((a, b) => b.total - a.total)
      .slice(0, 6);
    return rows;
  }, [books]);

  // Slump detection — sessions in last 7d vs prior 7d
  const slump = useMemo(() => {
    const now = Date.now();
    const day = 86400000;
    const last7 = sessions.filter((s) => now - s.at < 7 * day).reduce((a, s) => a + s.pagesRead, 0);
    const prior7 = sessions
      .filter((s) => now - s.at >= 7 * day && now - s.at < 14 * day)
      .reduce((a, s) => a + s.pagesRead, 0);
    const recentReactions = reactionLog.filter((r) => now - r.at < 7 * day).length;
    let status: "thriving" | "steady" | "slowing" | "slump" = "steady";
    let message = "Your pace is steady.";
    if (prior7 > 0 && last7 < prior7 * 0.5 && last7 < 30) {
      status = "slump";
      message = `Pages dropped ${Math.round((1 - last7 / Math.max(1, prior7)) * 100)}% this week. Try a shorter, cozy read?`;
    } else if (last7 === 0 && sessions.length > 0) {
      status = "slump";
      message = "No pages logged this week. A 5-minute reset can break the spell.";
    } else if (last7 < prior7) {
      status = "slowing";
      message = "Slightly slower than last week — that's okay.";
    } else if (last7 > prior7 * 1.3 || recentReactions > 5) {
      status = "thriving";
      message = "You're on a roll. Pages and feelings are flowing.";
    }
    return { status, message, last7, prior7 };
  }, [sessions, reactionLog]);

  const hasSessions = sessions.length > 0;

  return (
    <div className="space-y-6">
      {/* Slump card */}
      <section className="rounded-2xl mood-surface p-6 border border-border/40">
        <div className="flex items-start gap-3">
          <div
            className="grid h-10 w-10 place-items-center rounded-xl shrink-0"
            style={{
              background:
                slump.status === "slump"
                  ? "hsl(20 70% 65% / 0.2)"
                  : slump.status === "thriving"
                  ? "hsl(140 50% 55% / 0.2)"
                  : "var(--mood-soft)",
            }}
          >
            <AlertCircle className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Reading rhythm</div>
            <h3 className="font-display text-xl mt-1 capitalize">{slump.status}</h3>
            <p className="text-sm text-muted-foreground mt-1">{slump.message}</p>
            {hasSessions && (
              <div className="flex gap-4 text-xs text-muted-foreground mt-3">
                <span><span className="font-display text-foreground text-base">{slump.last7}</span> pages this week</span>
                <span><span className="font-display text-foreground text-base">{slump.prior7}</span> pages last week</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Time of day */}
      <section className="rounded-2xl bg-card/70 p-6 border border-border/40 space-y-4">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4" style={{ color: "var(--mood-strong)" }} />
          <h3 className="font-display text-2xl">When you read</h3>
        </div>
        {!hasSessions ? (
          <p className="text-sm text-muted-foreground">Log a session to see your peak reading hours.</p>
        ) : (
          <>
            <div className="grid grid-cols-4 gap-3">
              {todStats.map((b) => (
                <div key={b.key} className="text-center space-y-2">
                  <div className="h-24 flex items-end justify-center">
                    <div
                      className="w-8 rounded-t-lg transition-all"
                      style={{
                        height: `${Math.max(8, b.pct * 100)}%`,
                        background: "var(--mood-strong)",
                        opacity: b.pages > 0 ? 1 : 0.25,
                      }}
                    />
                  </div>
                  <div className="text-lg">{b.emoji}</div>
                  <div className="text-[11px] text-muted-foreground">{b.label}</div>
                  <div className="text-xs font-display">{b.pages}p</div>
                </div>
              ))}
            </div>
            {peakBucket.pages > 0 && (
              <p className="text-sm text-muted-foreground">
                You read most in the <span className="text-foreground font-medium">{peakBucket.label.toLowerCase()}</span> {peakBucket.emoji}
              </p>
            )}
          </>
        )}
      </section>

      {/* Mood × Genre */}
      <section className="rounded-2xl bg-card/70 p-6 border border-border/40 space-y-4">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4" style={{ color: "var(--mood-strong)" }} />
          <h3 className="font-display text-2xl">Mood × genre</h3>
        </div>
        {moodTag.length === 0 ? (
          <p className="text-sm text-muted-foreground">Tag your books with genres or themes to see correlations.</p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-2">
            {moodTag.map((row) => {
              const m = MOODS[row.mood];
              return (
                <div
                  key={row.tag}
                  className="flex items-center justify-between rounded-xl border border-border/40 px-3 py-2"
                  style={{ background: `hsl(${m.h} ${m.s}% ${m.l}% / 0.12)` }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{m.emoji}</span>
                    <div>
                      <div className="text-sm font-medium lowercase">{row.tag}</div>
                      <div className="text-[11px] text-muted-foreground">feels mostly {m.label.toLowerCase()}</div>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">{row.total}</div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}