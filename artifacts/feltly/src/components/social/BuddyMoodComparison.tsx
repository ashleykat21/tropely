import { useMemo } from "react";
import { MOODS, type MoodKey } from "@/lib/moods";
import { Lock, Sparkles } from "lucide-react";
import { usePremium } from "@/lib/usePremium";
import { toast } from "sonner";

const MOOD_ORDER: MoodKey[] = [
  "joyful", "cozy", "calm", "dreamy", "mysterious", "intense", "melancholy",
];

type MoodEntry = { page: number; mood: MoodKey };

type Props = {
  members: { userId: string; name: string; currentPage: number; moods: MoodEntry[] }[];
  totalPages: number;
};

const COLORS = [
  "hsl(190 50% 55%)",
  "hsl(350 55% 58%)",
  "hsl(45 70% 58%)",
  "hsl(270 45% 62%)",
  "hsl(28 60% 58%)",
];

function MoodArcLine({
  entries,
  totalPages,
  color,
}: {
  entries: MoodEntry[];
  totalPages: number;
  color: string;
}) {
  const W = 100, H = 100;
  if (entries.length < 2) {
    if (entries.length === 1) {
      const y = (MOOD_ORDER.indexOf(entries[0].mood) / (MOOD_ORDER.length - 1)) * H;
      const x = (entries[0].page / Math.max(1, totalPages)) * W;
      return (
        <circle cx={`${x}%`} cy={`${y}%`} r="2.5" fill={color} />
      );
    }
    return null;
  }

  const pts = entries.map((e): [number, number] => [
    (e.page / Math.max(1, totalPages)) * W,
    (MOOD_ORDER.indexOf(e.mood) / (MOOD_ORDER.length - 1)) * H,
  ]);

  // Catmull-Rom to bezier
  const d = pts.map((p, i) => {
    if (i === 0) return `M ${p[0]} ${p[1]}`;
    const p0 = pts[i - 2] ?? pts[i - 1];
    const p1 = pts[i - 1];
    const p2 = p;
    const p3 = pts[i + 1] ?? p2;
    const cp1x = p1[0] + (p2[0] - p0[0]) / 6;
    const cp1y = p1[1] + (p2[1] - p0[1]) / 6;
    const cp2x = p2[0] - (p3[0] - p1[0]) / 6;
    const cp2y = p2[1] - (p3[1] - p1[1]) / 6;
    return `C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2[0]} ${p2[1]}`;
  }).join(" ");

  return (
    <>
      <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" opacity="0.85" />
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="2" fill={color} />
      ))}
    </>
  );
}

export function BuddyMoodComparison({ members, totalPages }: Props) {
  const isPremium = usePremium((s) => s.isPremium);

  const hasMoodData = useMemo(
    () => members.some((m) => m.moods.length > 0),
    [members]
  );

  if (!isPremium) {
    return (
      <div
        className="relative rounded-xl border border-border/40 bg-card/50 p-4 cursor-not-allowed overflow-hidden"
        onClick={() =>
          toast("Mood comparison is a premium feature", {
            description: "Upgrade to compare emotional arcs with your reading buddies.",
            icon: <Sparkles className="h-4 w-4" />,
          })
        }
      >
        <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] z-10 rounded-xl flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Lock className="h-3.5 w-3.5" />
          <span>Mood comparison · Premium</span>
        </div>
        <div className="opacity-30 pointer-events-none select-none space-y-2">
          <div className="text-xs font-medium">Mood arcs</div>
          <div className="h-20 rounded-lg bg-muted" />
        </div>
      </div>
    );
  }

  if (!hasMoodData) {
    return (
      <div className="rounded-xl border border-border/40 bg-card/50 p-4 text-center">
        <p className="text-xs text-muted-foreground">
          No mood data yet. Members need to log sessions with a mood to see the comparison.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/40 bg-card/50 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-xs font-medium flex items-center gap-1.5">
          <Sparkles className="h-3 w-3" style={{ color: "var(--mood-strong)" }} />
          Mood comparison
        </div>
        <div className="flex flex-wrap gap-2">
          {members.map((m, i) => (
            <span key={m.userId} className="flex items-center gap-1 text-[10px]">
              <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
              {m.name}
            </span>
          ))}
        </div>
      </div>

      <div className="relative">
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between pointer-events-none w-16 pr-1">
          {MOOD_ORDER.map((k) => (
            <span key={k} className="text-[9px] text-muted-foreground/60 leading-none">
              {MOODS[k].emoji}
            </span>
          ))}
        </div>

        {/* Chart */}
        <div className="ml-16">
          <svg
            viewBox="0 0 100 100"
            className="w-full"
            style={{ height: 120 }}
            preserveAspectRatio="none"
          >
            {/* Grid lines */}
            {MOOD_ORDER.map((_, i) => {
              const y = (i / (MOOD_ORDER.length - 1)) * 100;
              return (
                <line
                  key={i}
                  x1="0" y1={y} x2="100" y2={y}
                  stroke="currentColor"
                  strokeOpacity="0.07"
                  strokeWidth="0.5"
                  vectorEffect="non-scaling-stroke"
                />
              );
            })}

            {/* Member arcs */}
            {members.map((m, i) => (
              <MoodArcLine
                key={m.userId}
                entries={m.moods}
                totalPages={totalPages}
                color={COLORS[i % COLORS.length]}
              />
            ))}
          </svg>

          {/* Current page markers */}
          <div className="relative h-3 mt-1">
            {members.map((m, i) => {
              const pct = Math.min(100, (m.currentPage / Math.max(1, totalPages)) * 100);
              return (
                <div
                  key={m.userId}
                  title={`${m.name} — p.${m.currentPage}`}
                  className="absolute -top-0.5 w-0.5 h-3 rounded-full"
                  style={{
                    left: `${pct}%`,
                    background: COLORS[i % COLORS.length],
                    opacity: 0.8,
                  }}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Mood legend */}
      <div className="flex flex-wrap gap-2">
        {members.map((m, i) => {
          const last = m.moods[m.moods.length - 1];
          if (!last) return null;
          const mood = MOODS[last.mood];
          return (
            <span
              key={m.userId}
              className="inline-flex items-center gap-1 text-[10px] rounded-full border border-border/40 px-2 py-0.5"
              style={{ borderColor: `${COLORS[i % COLORS.length]}55` }}
            >
              <span style={{ color: COLORS[i % COLORS.length] }}>{m.name.split(" ")[0]}</span>
              {" "}{mood.emoji} {mood.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}
