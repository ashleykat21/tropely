import { useMemo } from "react";
import { useLibrary } from "@/lib/store";
import { BookOpen, Clock, Target } from "lucide-react";

export function DailyReadout() {
  const sessions = useLibrary((s) => s.sessions);
  const dailyGoalPages = useLibrary((s) => s.dailyGoalPages);
  const dailyGoalMinutes = useLibrary((s) => s.dailyGoalMinutes);

  const todayStart = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }, []);

  const { pages, minutes } = useMemo(() => {
    const today = sessions.filter((s) => s.at >= todayStart);
    return {
      pages: today.reduce((a, s) => a + s.pagesRead, 0),
      minutes: today.reduce((a, s) => a + Math.round((s.durationSec ?? 0) / 60), 0),
    };
  }, [sessions, todayStart]);

  const pagesPct = Math.min(1, pages / Math.max(1, dailyGoalPages));
  const minsPct = dailyGoalMinutes > 0 ? Math.min(1, minutes / dailyGoalMinutes) : 0;
  const done = pagesPct >= 1 || (dailyGoalMinutes > 0 && minsPct >= 1);
  const ringPct = dailyGoalMinutes > 0 ? Math.max(pagesPct, minsPct) : pagesPct;

  const R = 18;
  const CIRC = 2 * Math.PI * R;
  const dash = ringPct * CIRC;

  return (
    <div className="w-full max-w-3xl mx-auto rounded-xl border border-border/40 bg-card/60 backdrop-blur px-4 py-3 flex items-center gap-4 flex-wrap">
      <div className="flex items-center gap-2 shrink-0">
        <svg width="44" height="44" viewBox="0 0 44 44" className="-rotate-90">
          <circle cx="22" cy="22" r={R} fill="none" stroke="hsl(var(--muted))" strokeWidth="3.5" />
          <circle
            cx="22" cy="22" r={R} fill="none"
            stroke="var(--mood-strong)"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${CIRC}`}
            style={{ transition: "stroke-dasharray 0.6s ease" }}
          />
        </svg>
        <div>
          <span className="text-xs font-medium block leading-tight">Today</span>
          {done
            ? <span className="text-[11px] leading-tight" style={{ color: "var(--mood-strong)" }}>Goal hit 🎉</span>
            : <span className="text-[11px] text-muted-foreground leading-tight">{Math.round(ringPct * 100)}%</span>
          }
        </div>
      </div>

      <div className="flex items-center gap-2 flex-1 min-w-[110px]">
        <BookOpen className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <div className="flex-1 space-y-0.5">
          <span className="text-xs text-foreground">
            {pages} / {dailyGoalPages} pages
          </span>
          <div className="h-1 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pagesPct * 100}%`, background: "var(--mood-strong)" }}
            />
          </div>
        </div>
      </div>

      {dailyGoalMinutes > 0 && (
        <div className="flex items-center gap-2 flex-1 min-w-[110px]">
          <Clock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <div className="flex-1 space-y-0.5">
            <span className="text-xs text-foreground">
              {minutes} / {dailyGoalMinutes} min
            </span>
            <div className="h-1 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${minsPct * 100}%`, background: "var(--mood-strong)" }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
