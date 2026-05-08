import { useLibrary } from "@/lib/store";
import { MOODS, type MoodKey } from "@/lib/moods";

function moodColor(m: MoodKey, alpha = 1) {
  const { h, s, l } = MOODS[m];
  return `hsla(${h}, ${s}%, ${l}%, ${alpha})`;
}

export function MoodArc({ bookId }: { bookId: string }) {
  const { sessions } = useLibrary();
  const points = sessions
    .filter((s) => s.bookId === bookId)
    .slice()
    .sort((a, b) => a.at - b.at);

  if (points.length < 2) {
    return (
      <div className="rounded-2xl bg-white/50 border border-border/50 p-4 text-xs text-muted-foreground">
        Log a couple of sessions to see this book's mood arc take shape.
      </div>
    );
  }

  const W = 320;
  const H = 64;
  const pad = 8;
  const moodOrder: MoodKey[] = ["melancholy", "calm", "mysterious", "dreamy", "cozy", "intense", "joyful"];
  const yFor = (m: MoodKey) => {
    const i = moodOrder.indexOf(m);
    const t = i / (moodOrder.length - 1);
    return pad + t * (H - pad * 2);
  };
  const xFor = (i: number) => pad + (i / (points.length - 1)) * (W - pad * 2);

  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${xFor(i).toFixed(1)} ${yFor(p.mood).toFixed(1)}`)
    .join(" ");

  return (
    <div className="rounded-2xl bg-white/60 border border-border/50 p-3 space-y-1.5">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Mood arc</p>
        <p className="text-[10px] text-muted-foreground">{points.length} sessions</p>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-16" preserveAspectRatio="none">
        <path
          d={path}
          fill="none"
          stroke="hsl(var(--foreground) / 0.25)"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {points.map((p, i) => (
          <circle
            key={p.id}
            cx={xFor(i)}
            cy={yFor(p.mood)}
            r={4}
            fill={moodColor(p.mood, 0.95)}
            stroke="white"
            strokeWidth={1.5}
          >
            <title>{`${MOODS[p.mood].emoji} ${MOODS[p.mood].label} · ${p.pagesRead}p`}</title>
          </circle>
        ))}
      </svg>
      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <span>{MOODS[points[0].mood].emoji} start</span>
        <span>now {MOODS[points[points.length - 1].mood].emoji}</span>
      </div>
    </div>
  );
}