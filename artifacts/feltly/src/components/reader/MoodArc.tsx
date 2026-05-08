import { useMemo, useState } from "react";
import { useLibrary } from "@/lib/store";
import { MOODS, type MoodKey } from "@/lib/moods";

function moodColor(m: MoodKey, alpha = 1) {
  const { h, s, l } = MOODS[m];
  return `hsla(${h}, ${s}%, ${l}%, ${alpha})`;
}

// Catmull-Rom → cubic bezier conversion for smooth curves
function catmullRomPath(pts: [number, number][], tension = 0.35): string {
  if (pts.length < 2) return "";
  let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const cp1x = p1[0] + (p2[0] - p0[0]) * tension;
    const cp1y = p1[1] + (p2[1] - p0[1]) * tension;
    const cp2x = p2[0] - (p3[0] - p1[0]) * tension;
    const cp2y = p2[1] - (p3[1] - p1[1]) * tension;
    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)} ${cp2x.toFixed(1)} ${cp2y.toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
}

const TRIGGER_ICONS: Record<string, string> = {
  "gut-punch": "😢",
  "relief": "😮\u200d💨",
  "plot-twist": "🌀",
  "laughed-out-loud": "😂",
  "heartbreak": "💔",
  "turning-point": "⚡",
};

const MOOD_ORDER: MoodKey[] = [
  "joyful", "cozy", "calm", "dreamy", "mysterious", "intense", "melancholy",
];

export function MoodArc({ bookId }: { bookId: string }) {
  const { sessions, journal } = useLibrary();
  const [hovered, setHovered] = useState<number | null>(null);

  const points = useMemo(
    () =>
      sessions
        .filter((s) => s.bookId === bookId)
        .slice()
        .sort((a, b) => a.toPage - b.toPage || a.at - b.at),
    [sessions, bookId]
  );

  const triggers = useMemo(
    () => journal.filter((j) => j.bookId === bookId && j.kind === "trigger" && j.page != null),
    [journal, bookId]
  );

  if (points.length < 2) {
    return (
      <div className="rounded-2xl bg-white/50 border border-border/50 p-4 text-xs text-muted-foreground">
        Log a couple of sessions to see this book&apos;s mood arc take shape.
      </div>
    );
  }

  const W = 340;
  const H = 80;
  const padX = 10;
  const padY = 10;

  const yFor = (m: MoodKey) => {
    const i = MOOD_ORDER.indexOf(m);
    const t = i / (MOOD_ORDER.length - 1);
    return padY + t * (H - padY * 2);
  };

  const maxPage = Math.max(...points.map((p) => p.toPage), 1);
  const xFor = (page: number) => padX + (page / maxPage) * (W - padX * 2);
  const xForIdx = (i: number) =>
    points.length === 1
      ? W / 2
      : padX + (i / (points.length - 1)) * (W - padX * 2);

  const coords: [number, number][] = points.map((p, i) => [
    xForIdx(i),
    yFor(p.mood),
  ]);

  const linePath = catmullRomPath(coords);
  const areaPath =
    linePath +
    ` L ${coords[coords.length - 1][0].toFixed(1)} ${H} L ${coords[0][0].toFixed(1)} ${H} Z`;

  const startMood = points[0].mood;
  const endMood = points[points.length - 1].mood;
  const gradId = `arc-grad-${bookId.replace(/\W/g, "")}`;

  return (
    <div className="rounded-2xl bg-white/60 border border-border/50 p-3 space-y-2 select-none">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Mood arc</p>
        <p className="text-[10px] text-muted-foreground">
          {points.length} session{points.length !== 1 ? "s" : ""}
          {triggers.length > 0 && ` · ${triggers.length} moment${triggers.length !== 1 ? "s" : ""} marked`}
        </p>
      </div>

      {/* Y-axis mood labels */}
      <div className="flex gap-2 items-start">
        <div
          className="flex flex-col justify-between text-[9px] text-muted-foreground/70 shrink-0"
          style={{ height: H }}
        >
          {MOOD_ORDER.map((m) => (
            <span key={m} title={MOODS[m].label}>
              {MOODS[m].emoji}
            </span>
          ))}
        </div>

        {/* Chart */}
        <div className="relative flex-1 min-w-0">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="w-full"
            style={{ height: H }}
            preserveAspectRatio="none"
            onMouseLeave={() => setHovered(null)}
          >
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={moodColor(startMood, 0.5)} />
                <stop offset="100%" stopColor={moodColor(endMood, 0.5)} />
              </linearGradient>
              <linearGradient id={`${gradId}-fill`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={moodColor(endMood, 0.2)} />
                <stop offset="100%" stopColor={moodColor(endMood, 0.02)} />
              </linearGradient>
            </defs>

            {/* Horizontal guide lines */}
            {MOOD_ORDER.map((m) => (
              <line
                key={m}
                x1={0}
                y1={yFor(m)}
                x2={W}
                y2={yFor(m)}
                stroke="hsl(var(--border))"
                strokeWidth={0.5}
                strokeOpacity={0.4}
              />
            ))}

            {/* Area fill */}
            <path d={areaPath} fill={`url(#${gradId}-fill)`} />

            {/* Curve */}
            <path
              d={linePath}
              fill="none"
              stroke={`url(#${gradId})`}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Trigger markers */}
            {triggers.map((t) => {
              const tx = xFor(t.page!);
              return (
                <g key={t.id}>
                  <line
                    x1={tx}
                    y1={0}
                    x2={tx}
                    y2={H}
                    stroke="hsl(var(--foreground) / 0.12)"
                    strokeWidth={1}
                    strokeDasharray="2 2"
                  />
                  <text
                    x={tx}
                    y={5}
                    textAnchor="middle"
                    fontSize={8}
                    className="pointer-events-none"
                  >
                    {TRIGGER_ICONS[t.triggerType ?? ""] ?? "⚡"}
                  </text>
                </g>
              );
            })}

            {/* Session dots */}
            {coords.map(([cx, cy], i) => {
              const p = points[i];
              const isHovered = hovered === i;
              return (
                <g key={p.id} onMouseEnter={() => setHovered(i)}>
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isHovered ? 7 : 5}
                    fill={moodColor(p.mood, 0.95)}
                    stroke="white"
                    strokeWidth={isHovered ? 2 : 1.5}
                    style={{ transition: "r 0.15s, stroke-width 0.15s", cursor: "default" }}
                  />
                  {isHovered && (
                    <>
                      <rect
                        x={Math.min(Math.max(cx - 36, 0), W - 72)}
                        y={cy - 28}
                        width={72}
                        height={20}
                        rx={6}
                        fill="hsl(var(--card))"
                        stroke="hsl(var(--border))"
                        strokeWidth={0.8}
                        filter="drop-shadow(0 1px 2px rgba(0,0,0,.12))"
                      />
                      <text
                        x={Math.min(Math.max(cx, 36), W - 36)}
                        y={cy - 14}
                        textAnchor="middle"
                        fontSize={9}
                        fill="hsl(var(--foreground))"
                        className="pointer-events-none font-medium"
                      >
                        {MOODS[p.mood].emoji} {MOODS[p.mood].label} · p.{p.toPage}
                      </text>
                    </>
                  )}
                </g>
              );
            })}
          </svg>

          {/* X-axis labels */}
          <div className="flex justify-between text-[9px] text-muted-foreground/70 mt-0.5 px-0">
            <span>p.{points[0].fromPage}</span>
            <span>p.{points[points.length - 1].toPage}</span>
          </div>
        </div>
      </div>

      {/* Start / end mood summary */}
      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <span>
          Started{" "}
          <span className="font-medium text-foreground">
            {MOODS[startMood].emoji} {MOODS[startMood].label}
          </span>
        </span>
        <span>
          Now{" "}
          <span className="font-medium text-foreground">
            {MOODS[endMood].emoji} {MOODS[endMood].label}
          </span>
        </span>
      </div>
    </div>
  );
}
