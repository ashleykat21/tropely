import type { SessionLog } from "./store";

export type BestTime = {
  hour: number; // 0-23
  label: string; // "9pm"
  pages: number;
  sessionCount: number;
  avgPages: number;
};

const fmtHour = (h: number) => {
  const ampm = h < 12 ? "am" : "pm";
  const hr = h % 12 === 0 ? 12 : h % 12;
  return `${hr}${ampm}`;
};

export function bestReadingTime(sessions: SessionLog[]): BestTime | null {
  if (sessions.length < 5) return null;
  const byHour: { pages: number; count: number }[] = Array.from({ length: 24 }, () => ({ pages: 0, count: 0 }));
  for (const s of sessions) {
    const h = new Date(s.at).getHours();
    byHour[h].pages += s.pagesRead;
    byHour[h].count += 1;
  }
  // Find hour with highest avg pages * count weight
  let bestHour = -1;
  let bestScore = 0;
  byHour.forEach((b, h) => {
    if (b.count === 0) return;
    const avg = b.pages / b.count;
    const score = avg * Math.log2(1 + b.count);
    if (score > bestScore) {
      bestScore = score;
      bestHour = h;
    }
  });
  if (bestHour < 0) return null;
  const b = byHour[bestHour];
  return {
    hour: bestHour,
    label: fmtHour(bestHour),
    pages: b.pages,
    sessionCount: b.count,
    avgPages: Math.round(b.pages / b.count),
  };
}

/** Suggest a comfortable session length in minutes from the user's median pace. */
export function suggestedSessionMinutes(sessions: SessionLog[]): number | null {
  const timed = sessions.filter((s) => (s.durationSec ?? 0) > 60 && s.pagesRead > 0);
  if (timed.length < 3) return null;
  // Median minutes
  const mins = timed.map((s) => Math.round(s.durationSec! / 60)).sort((a, b) => a - b);
  const median = mins[Math.floor(mins.length / 2)];
  // Round to nearest 5 minutes, clamp to [10, 60]
  const r = Math.max(10, Math.min(60, Math.round(median / 5) * 5));
  return r;
}