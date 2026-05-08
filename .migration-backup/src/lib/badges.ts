import type { Book, SessionLog, ReactionLog, Reflection, JournalEntry } from "./store";
import { computeStreak } from "./streak";

export type Badge = {
  id: string;
  label: string;
  desc: string;
  emoji: string;
  earned: boolean;
  progress?: number; // 0..1 toward earning
  hint?: string;
};

export function computeBadges(args: {
  books: Book[];
  sessions: SessionLog[];
  reactionLog: ReactionLog[];
  reflections: Reflection[];
  journal: JournalEntry[];
  scope?: "month" | "lifetime";
}): Badge[] {
  // Monthly view resets on the 1st; lifetime view counts everything.
  const scope = args.scope ?? "month";
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const inScope = (ts: number) => (scope === "lifetime" ? true : ts >= monthStart);

  const books = args.books.filter((b) => inScope(b.addedAt));
  const sessions = args.sessions.filter((s) => inScope(s.at));
  const reactionLog = args.reactionLog.filter((r) => inScope(r.at));
  const reflections = args.reflections.filter((r) => inScope(r.createdAt));
  const journal = args.journal.filter((j) => inScope(j.createdAt));
  const isLifetime = scope === "lifetime";
  // Lifetime tiers should feel meaningful — bump thresholds so trophies aren't trivially earned.
  const T = (monthly: number, lifetimeMult: number) =>
    isLifetime ? Math.max(monthly + 1, Math.round(monthly * lifetimeMult)) : monthly;
  const finished = books.filter((b) => b.shelf === "finished").length;
  const totalPages = sessions.reduce((a, s) => a + s.pagesRead, 0);
  const streak = computeStreak(sessions);
  const moods = new Set(books.map((b) => b.mood));
  const genres = new Set(books.flatMap((b) => b.tags ?? []));
  const reactions = reactionLog.length;
  const nightSessions = sessions.filter((s) => {
    const h = new Date(s.at).getHours();
    return h >= 22 || h < 5;
  }).length;
  const dawnSessions = sessions.filter((s) => {
    const h = new Date(s.at).getHours();
    return h >= 5 && h < 8;
  }).length;
  const totalSessions = sessions.length;
  const totalMinutes = sessions.reduce((a, s) => a + Math.round((s.durationSec ?? 0) / 60), 0);
  const longSession = sessions.some((s) => (s.durationSec ?? 0) >= 60 * 60); // 1h+
  const dnf = books.filter((b) => b.shelf === "dnf").length;
  const rereads = books.reduce((a, b) => a + (b.rereadCount ?? 0), 0);
  const translated = books.filter((b) => !!b.translator).length;
  const audiobooks = books.filter((b) => b.format === "audiobook").length;
  const quotes = journal.filter((j) => j.kind === "quote").length;
  const fiveStar = reflections.filter((r) => r.rating >= 5).length;
  const distinctAuthors = new Set(books.map((b) => b.author.trim().toLowerCase())).size;
  const longestBook = books.reduce((a, b) => Math.max(a, b.shelf === "finished" ? b.pages : 0), 0);
  const weekendSessions = sessions.filter((s) => {
    const d = new Date(s.at).getDay();
    return d === 0 || d === 6;
  }).length;

  const list: Omit<Badge, "earned">[] = [
    { id: "first-book", label: "First page", desc: "Add your first book.", emoji: "📖", progress: Math.min(1, books.length), hint: "Add a book." },
    { id: "finisher", label: "Finisher", desc: "Finish your first book.", emoji: "🏁", progress: Math.min(1, finished), hint: "Finish 1 book." },
    (() => { const n = T(10, 2.5); return { id: "marathoner", label: "Marathoner", desc: `Finish ${n} books.`, emoji: "🥇", progress: Math.min(1, finished / n), hint: `${finished}/${n} finished.` }; })(),
    (() => { const n = T(100, 2); return { id: "century-books", label: "Centurion", desc: `Finish ${n} books.`, emoji: "🏛️", progress: Math.min(1, finished / n), hint: `${finished}/${n} finished.` }; })(),
    (() => { const n = T(100, 5); return { id: "century", label: "Century", desc: `Read ${n} pages total.`, emoji: "💯", progress: Math.min(1, totalPages / n), hint: `${totalPages}/${n} pages.` }; })(),
    (() => { const n = T(1000, 3); return { id: "thousand", label: "Thousand cuts", desc: `Read ${n.toLocaleString()} pages total.`, emoji: "🗡️", progress: Math.min(1, totalPages / n), hint: `${totalPages}/${n} pages.` }; })(),
    (() => { const n = T(10000, 2.5); return { id: "ten-thousand", label: "Page mountain", desc: `Read ${n.toLocaleString()} pages total.`, emoji: "🗻", progress: Math.min(1, totalPages / n), hint: `${totalPages}/${n} pages.` }; })(),
    (() => { const n = T(3, 2); return { id: "streak-3", label: "Lit candle", desc: `${n}-day reading streak.`, emoji: "🕯️", progress: Math.min(1, streak.longest / n), hint: `Best ${streak.longest} day streak.` }; })(),
    (() => { const n = T(7, 2); return { id: "streak-7", label: "Week of pages", desc: `${n}-day reading streak.`, emoji: "🔥", progress: Math.min(1, streak.longest / n), hint: `Best ${streak.longest} day streak.` }; })(),
    (() => { const n = T(30, 2); return { id: "streak-30", label: "Devoted", desc: `${n}-day reading streak.`, emoji: "🌙", progress: Math.min(1, streak.longest / n), hint: `Best ${streak.longest} day streak.` }; })(),
    (() => { const n = T(100, 1.8); return { id: "streak-100", label: "Unbreakable", desc: `${n}-day reading streak.`, emoji: "💎", progress: Math.min(1, streak.longest / n), hint: `Best ${streak.longest} day streak.` }; })(),
    (() => { const n = T(5, 1.4); return { id: "moods-5", label: "Mood explorer", desc: `Read books in ${n} different moods.`, emoji: "🎭", progress: Math.min(1, moods.size / n), hint: `${moods.size}/${n} moods.` }; })(),
    { id: "moods-all", label: "Full spectrum", desc: "Read books in all 8 moods.", emoji: "🌈", progress: Math.min(1, moods.size / 8), hint: `${moods.size}/8 moods.` },
    (() => { const n = T(5, 2); return { id: "genres-5", label: "Genre wanderer", desc: `Tag ${n} different genres.`, emoji: "🧭", progress: Math.min(1, genres.size / n), hint: `${genres.size}/${n} genres.` }; })(),
    (() => { const n = T(15, 2); return { id: "genres-15", label: "Genre cartographer", desc: `Tag ${n} different genres.`, emoji: "🗺️", progress: Math.min(1, genres.size / n), hint: `${genres.size}/${n} genres.` }; })(),
    (() => { const n = T(50, 4); return { id: "reactor", label: "Big feelings", desc: `Log ${n} emoji reactions.`, emoji: "💖", progress: Math.min(1, reactions / n), hint: `${reactions}/${n} reactions.` }; })(),
    (() => { const n = T(500, 4); return { id: "reactor-500", label: "Heart on sleeve", desc: `Log ${n.toLocaleString()} emoji reactions.`, emoji: "💞", progress: Math.min(1, reactions / n), hint: `${reactions}/${n} reactions.` }; })(),
    (() => { const n = T(10, 5); return { id: "journaler", label: "Journaler", desc: `Write ${n} journal entries.`, emoji: "✍️", progress: Math.min(1, journal.length / n), hint: `${journal.length}/${n} entries.` }; })(),
    (() => { const n = T(100, 3); return { id: "scribe", label: "Scribe", desc: `Write ${n} journal entries.`, emoji: "📜", progress: Math.min(1, journal.length / n), hint: `${journal.length}/${n} entries.` }; })(),
    (() => { const n = T(25, 4); return { id: "quote-collector", label: "Quote collector", desc: `Save ${n} quotes.`, emoji: "❝", progress: Math.min(1, quotes / n), hint: `${quotes}/${n} quotes.` }; })(),
    (() => { const n = T(3, 5); return { id: "reflective", label: "Reflective", desc: `Save ${n} finish reflections.`, emoji: "🪞", progress: Math.min(1, reflections.length / n), hint: `${reflections.length}/${n} reflections.` }; })(),
    (() => { const n = T(5, 4); return { id: "five-star", label: "All the stars", desc: `Give ${n} books a 5-star reflection.`, emoji: "⭐", progress: Math.min(1, fiveStar / n), hint: `${fiveStar}/${n} five-stars.` }; })(),
    (() => { const n = T(10, 5); return { id: "night-owl", label: "Night owl", desc: `Read ${n} sessions after 10pm.`, emoji: "🦉", progress: Math.min(1, nightSessions / n), hint: `${nightSessions}/${n} late sessions.` }; })(),
    (() => { const n = T(10, 5); return { id: "early-bird", label: "Early bird", desc: `Read ${n} sessions before 8am.`, emoji: "🐦", progress: Math.min(1, dawnSessions / n), hint: `${dawnSessions}/${n} dawn sessions.` }; })(),
    (() => { const n = T(20, 5); return { id: "weekend-warrior", label: "Weekend warrior", desc: `Log ${n} weekend sessions.`, emoji: "🛋️", progress: Math.min(1, weekendSessions / n), hint: `${weekendSessions}/${n} weekend sessions.` }; })(),
    (() => {
      const need = isLifetime ? 10 : 1;
      const longCount = sessions.filter((s) => (s.durationSec ?? 0) >= 60 * 60).length;
      const earned = isLifetime ? longCount >= need : longSession;
      return { id: "marathon-session", label: "Marathon session", desc: isLifetime ? `Log ${need} hour-long sessions.` : "Read for an hour straight.", emoji: "⏱️", progress: earned ? 1 : Math.min(1, longCount / need), hint: earned ? "Done!" : isLifetime ? `${longCount}/${need} 60+ min sessions.` : "Log a 60+ minute session." };
    })(),
    (() => { const n = T(50, 4); return { id: "hours-50", label: `${n} hours read`, desc: `Log ${n} total hours of reading.`, emoji: "⌛", progress: Math.min(1, totalMinutes / (n * 60)), hint: `${Math.round(totalMinutes / 60)}/${n} hours.` }; })(),
    (() => { const n = T(50, 6); return { id: "session-50", label: "Habit formed", desc: `Log ${n} reading sessions.`, emoji: "📚", progress: Math.min(1, totalSessions / n), hint: `${totalSessions}/${n} sessions.` }; })(),
    (() => { const need = isLifetime ? 5 : 1; return { id: "dnf-honest", label: "Bravely honest", desc: isLifetime ? `Mark ${need} books as DNF.` : "Mark a book as DNF.", emoji: "🪶", progress: Math.min(1, dnf / need), hint: dnf >= need ? "Done!" : isLifetime ? `${dnf}/${need} DNFs.` : "It's OK to stop." }; })(),
    (() => { const need = isLifetime ? 5 : 1; return { id: "rereader", label: "Rereader", desc: isLifetime ? `Reread ${need} books.` : "Reread a book.", emoji: "🔁", progress: Math.min(1, rereads / need), hint: rereads >= need ? "Done!" : isLifetime ? `${rereads}/${need} rereads.` : "Start a reread." }; })(),
    (() => { const n = T(5, 4); return { id: "translator-fan", label: "In translation", desc: `Read ${n} translated books.`, emoji: "🌍", progress: Math.min(1, translated / n), hint: `${translated}/${n} translated.` }; })(),
    (() => { const n = T(5, 4); return { id: "audiophile", label: "Audiophile", desc: `Add ${n} audiobooks.`, emoji: "🎧", progress: Math.min(1, audiobooks / n), hint: `${audiobooks}/${n} audiobooks.` }; })(),
    (() => { const n = T(25, 4); return { id: "author-collector", label: "Author collector", desc: `Read ${n} different authors.`, emoji: "🧑‍🎤", progress: Math.min(1, distinctAuthors / n), hint: `${distinctAuthors}/${n} authors.` }; })(),
    (() => { const n = isLifetime ? 800 : 600; return { id: "tome", label: "Tome conqueror", desc: `Finish a ${n}+ page book.`, emoji: "📕", progress: longestBook >= n ? 1 : Math.min(1, longestBook / n), hint: `Longest finished: ${longestBook} pages.` }; })(),
  ];

  // Some achievements only make sense as lifetime trophies.
  const lifetimeOnly = new Set(["streak-100"]);
  const filtered = isLifetime ? list : list.filter((b) => !lifetimeOnly.has(b.id));
  return filtered.map((b) => ({ ...b, earned: (b.progress ?? 0) >= 1 }));
}

// The single "best" badge a user has earned, used for profile flair.
// Picks the latest (most rare) earned badge by walking the list backwards.
export function topEarnedBadge(badges: Badge[]): Badge | null {
  for (let i = badges.length - 1; i >= 0; i--) {
    if (badges[i].earned) return badges[i];
  }
  return null;
}