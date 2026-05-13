import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useLibrary } from "@/lib/store";
import { MOODS, type MoodKey } from "@/lib/moods";
import { Sparkles } from "lucide-react";

function getTimeOfDay(): "morning" | "afternoon" | "evening" | "night" {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "morning";
  if (h >= 12 && h < 18) return "afternoon";
  if (h >= 18 && h < 22) return "evening";
  return "night";
}

const TIME_META: Record<string, { label: string; emoji: string }> = {
  morning:   { label: "This morning",  emoji: "🌅" },
  afternoon: { label: "This afternoon", emoji: "☀️" },
  evening:   { label: "This evening",  emoji: "🌆" },
  night:     { label: "Tonight",       emoji: "🌙" },
};

export function MoodReadSchedule() {
  const books    = useLibrary((s) => s.books);
  const sessions = useLibrary((s) => s.sessions);
  const setCurrent = useLibrary((s) => s.setCurrent);
  const navigate   = useNavigate();

  const { suggestion, matchedMood, timeOfDay } = useMemo(() => {
    const timeOfDay = getTimeOfDay();
    const tbrBooks  = books.filter((b) => b.shelf === "want");
    if (tbrBooks.length === 0) return { suggestion: null, matchedMood: null, timeOfDay };

    const hourRange: Record<string, [number, number]> = {
      morning:   [5, 11],
      afternoon: [12, 17],
      evening:   [18, 21],
      night:     [22, 4],
    };
    const [lo, hi] = hourRange[timeOfDay];

    const moodFreq: Partial<Record<MoodKey, number>> = {};
    sessions.forEach((s) => {
      const h = new Date(s.at).getHours();
      const inRange = lo <= hi ? h >= lo && h <= hi : h >= lo || h <= hi;
      if (inRange) {
        moodFreq[s.mood] = (moodFreq[s.mood] ?? 0) + s.pagesRead;
      }
    });

    const topMood = (Object.entries(moodFreq) as [MoodKey, number][])
      .sort((a, b) => b[1] - a[1])[0]?.[0];

    let suggestion = null;
    let matchedMood: MoodKey | null = null;

    if (topMood) {
      const match = tbrBooks.find((b) => b.mood === topMood);
      if (match) { suggestion = match; matchedMood = topMood; }
    }
    if (!suggestion && tbrBooks.length > 0) {
      suggestion  = tbrBooks[0];
      matchedMood = suggestion.mood ?? null;
    }

    return { suggestion, matchedMood, timeOfDay };
  }, [books, sessions]);

  if (!suggestion) return null;

  const m    = matchedMood ? MOODS[matchedMood] : null;
  const time = TIME_META[timeOfDay];

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div
        className="rounded-2xl border border-border/40 p-4 space-y-3"
        style={{ background: m ? `hsl(${m.h} ${m.s}% ${m.l}% / 0.10)` : "var(--mood-soft)" }}
      >
        <div className="flex items-center gap-1.5">
          <Sparkles
            className="h-3.5 w-3.5"
            style={{ color: m ? `hsl(${m.h} ${m.s}% ${m.l}%)` : "var(--mood-strong)" }}
          />
          <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            {time.emoji} {time.label}&apos;s pick
          </span>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="font-display text-base leading-snug truncate">{suggestion.title}</div>
            <div className="text-xs text-muted-foreground truncate">{suggestion.author}</div>
            {m && (
              <div
                className="mt-1 inline-flex items-center gap-1 text-[11px]"
                style={{ color: `hsl(${m.h} ${m.s}% ${Math.max(30, m.l - 10)}%)` }}
              >
                {m.emoji} Matches your {timeOfDay} mood
              </div>
            )}
          </div>

          <button
            onClick={() => {
              setCurrent(suggestion!.id);
              navigate("/");
            }}
            className="shrink-0 rounded-full px-3 py-1.5 text-xs font-medium text-white transition active:scale-95"
            style={{
              background: m
                ? `hsl(${m.h} ${m.s}% ${m.l}%)`
                : "hsl(var(--foreground))",
            }}
          >
            Start reading
          </button>
        </div>
      </div>
    </div>
  );
}
