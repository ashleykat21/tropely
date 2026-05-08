import type { SessionLog } from "./store";

const startOfDay = (ms: number) => {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

export type StreakInfo = {
  current: number;        // consecutive days ending today (or yesterday if grace)
  longest: number;
  todayPages: number;
  readToday: boolean;
  lastActiveDay: number | null; // ms at startOfDay
  freezesAvailable: number;
  freezeSavedToday: boolean; // true if today's gap is being covered by a freeze
};

export type FreezeState = {
  available: number;       // current freeze tokens (max 3)
  lastEarnedWeek: string;  // ISO yyyy-Www of last accrual
  consumedDays: number[];  // startOfDay timestamps already covered by a freeze
};

export function isoWeek(ms: number): string {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getFullYear()}-W${String(week).padStart(2, "0")}`;
}

export function computeStreak(sessions: SessionLog[], freeze?: FreezeState): StreakInfo {
  if (sessions.length === 0) {
    return {
      current: 0,
      longest: 0,
      todayPages: 0,
      readToday: false,
      lastActiveDay: null,
      freezesAvailable: freeze?.available ?? 0,
      freezeSavedToday: false,
    };
  }

  const byDay = new Map<number, number>();
  for (const s of sessions) {
    const d = startOfDay(s.at);
    byDay.set(d, (byDay.get(d) ?? 0) + s.pagesRead);
  }
  const days = [...byDay.keys()].sort((a, b) => a - b);

  // Longest streak
  let longest = 1;
  let run = 1;
  for (let i = 1; i < days.length; i++) {
    if (days[i] - days[i - 1] === 86400000) {
      run++;
      longest = Math.max(longest, run);
    } else {
      run = 1;
    }
  }

  const today = startOfDay(Date.now());
  const yesterday = today - 86400000;
  const lastActive = days[days.length - 1];
  const consumed = new Set(freeze?.consumedDays ?? []);

  // Current streak: walk back from today, allowing freeze-covered gap days.
  let current = 0;
  let freezeSavedToday = false;
  if (lastActive === today || lastActive === yesterday) {
    let cursor = lastActive;
    while (byDay.has(cursor) || consumed.has(cursor)) {
      current++;
      cursor -= 86400000;
    }
    if (consumed.has(today)) freezeSavedToday = true;
  }

  return {
    current,
    longest: Math.max(longest, current),
    todayPages: byDay.get(today) ?? 0,
    readToday: byDay.has(today),
    lastActiveDay: lastActive,
    freezesAvailable: freeze?.available ?? 0,
    freezeSavedToday,
  };
}

/**
 * Accrue 1 freeze per ISO week (max 3). Auto-consume one to cover yesterday
 * if the user had an active streak but missed yesterday and hasn't read today yet.
 */
export function reconcileFreezes(
  sessions: SessionLog[],
  prev: FreezeState | undefined,
  now = Date.now()
): FreezeState {
  const state: FreezeState = {
    available: prev?.available ?? 1,
    lastEarnedWeek: prev?.lastEarnedWeek ?? "",
    consumedDays: prev?.consumedDays ?? [],
  };
  const week = isoWeek(now);
  if (state.lastEarnedWeek !== week) {
    state.available = Math.min(3, state.available + 1);
    state.lastEarnedWeek = week;
  }

  if (sessions.length === 0) return state;

  const byDay = new Set<number>();
  for (const s of sessions) byDay.add(startOfDay(s.at));
  const today = startOfDay(now);
  const yesterday = today - 86400000;
  const dayBefore = today - 2 * 86400000;
  const consumed = new Set(state.consumedDays);

  // Auto-consume one freeze to cover yesterday if user had a streak going
  // (read day-before-yesterday) but missed yesterday.
  if (
    !byDay.has(yesterday) &&
    !consumed.has(yesterday) &&
    byDay.has(dayBefore) &&
    state.available > 0
  ) {
    state.available -= 1;
    consumed.add(yesterday);
  }

  // Garbage-collect consumed days older than 60 days
  const cutoff = today - 60 * 86400000;
  state.consumedDays = [...consumed].filter((d) => d >= cutoff);
  return state;
}