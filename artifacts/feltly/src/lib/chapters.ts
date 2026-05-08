import type { Book, SessionLog, ReactionLog, Reflection, JournalEntry } from "./store";
import { computeStreak } from "./streak";

export type Chapter = {
  id: string;
  title: string;
  emoji: string;
  /** One-line literary flavor — shown when unlocked */
  tagline: string;
  /** What you need to do — shown when locked */
  hint: string;
  unlocked: boolean;
  /** 0..1 toward unlocking */
  progress: number;
};

type Args = {
  books: Book[];
  sessions: SessionLog[];
  reactionLog: ReactionLog[];
  reflections: Reflection[];
  journal: JournalEntry[];
};

export function computeChapters(args: Args): Chapter[] {
  const { books, sessions, journal } = args;

  const finished    = books.filter((b) => b.shelf === "finished").length;
  const totalPages  = sessions.reduce((a, s) => a + s.pagesRead, 0);
  const streak      = computeStreak(sessions);
  const moods       = new Set(books.map((b) => b.mood));
  const tropes      = new Set(books.flatMap((b) => b.tropes ?? []));
  const authors     = new Set(books.map((b) => b.author.trim().toLowerCase())).size;
  const nightSess   = sessions.filter((s) => { const h = new Date(s.at).getHours(); return h >= 22 || h < 5; }).length;
  const dawnSess    = sessions.filter((s) => { const h = new Date(s.at).getHours(); return h >= 5 && h < 8; }).length;
  const quotes      = journal.filter((j) => j.kind === "quote").length;
  const notes       = journal.length;
  const totalMins   = Math.round(sessions.reduce((a, s) => a + (s.durationSec ?? 0), 0) / 60);
  const longSess    = sessions.filter((s) => (s.durationSec ?? 0) >= 60 * 60).length;

  const ch = (
    id: string,
    title: string,
    emoji: string,
    tagline: string,
    hint: string,
    unlocked: boolean,
    progress: number,
  ): Chapter => ({ id, title, emoji, tagline, hint, unlocked, progress: Math.min(1, Math.max(0, progress)) });

  return [
    ch("first-page",       "The First Page",        "📖",
      "Every great library began with a single spine.",
      "Add your first book.",
      books.length >= 1, books.length),

    ch("the-awakening",    "The Awakening",          "🌅",
      "The story doesn't end. It moves into you.",
      "Finish your first book.",
      finished >= 1, finished),

    ch("finding-vibe",     "Finding Your Vibe",      "🎭",
      "You know the feeling before you find the word for it.",
      `Read books in 3 different moods. (${moods.size}/3)`,
      moods.size >= 3, moods.size / 3),

    ch("trope-curious",    "Trope Curious",          "🎪",
      "You've started to name the shapes stories are made of.",
      "Tag your first trope on any book.",
      tropes.size >= 1, tropes.size),

    ch("the-ritual",       "The Ritual",             "🕯️",
      "Reading every day is a small act of devotion.",
      `Reach a 7-day reading streak. Best: ${streak.longest} day${streak.longest === 1 ? "" : "s"}.`,
      streak.longest >= 7, streak.longest / 7),

    ch("long-road",        "The Long Road",          "🗺️",
      "Every page is a step away from where you started.",
      `Read 500 pages total. (${totalPages.toLocaleString()}/500)`,
      totalPages >= 500, totalPages / 500),

    ch("midnight-reader",  "Midnight Pages",         "🌙",
      "Some books can only be read in the dark.",
      `Log 5 sessions after 10 pm. (${nightSess}/5)`,
      nightSess >= 5, nightSess / 5),

    ch("the-chronicler",   "The Chronicler",         "✍️",
      "A reader who writes doubles their life.",
      `Write 10 journal entries or quotes. (${notes}/10)`,
      notes >= 10, notes / 10),

    ch("the-devoted",      "The Devoted",            "🔥",
      "Thirty days is no longer habit. It's who you are.",
      `Reach a 30-day streak. Best: ${streak.longest} day${streak.longest === 1 ? "" : "s"}.`,
      streak.longest >= 30, streak.longest / 30),

    ch("world-traveller",  "World Traveller",        "🌍",
      "Every author is a country you visit, and you return changed.",
      `Read books by 10 different authors. (${authors}/10)`,
      authors >= 10, authors / 10),

    ch("the-thousand",     "The Thousand",           "📚",
      "A thousand pages of living inside someone else's mind.",
      `Read 1,000 pages total. (${totalPages.toLocaleString()}/1,000)`,
      totalPages >= 1000, totalPages / 1000),

    ch("quote-keeper",     "The Quote Keeper",       "❝",
      "You save the lines that saved you.",
      `Collect 10 quotes in your journal. (${quotes}/10)`,
      quotes >= 10, quotes / 10),

    ch("trope-architect",  "The Architect",          "🧭",
      "You can see the grammar now — the invisible scaffolding of every story.",
      `Tag 15 different tropes. (${tropes.size}/15)`,
      tropes.size >= 15, tropes.size / 15),

    ch("full-spectrum",    "Full Spectrum",          "🌈",
      "You've felt everything a library can make you feel.",
      `Read in all 8 moods. (${moods.size}/8)`,
      moods.size >= 8, moods.size / 8),

    ch("deep-hours",       "The Deep Hours",         "⌛",
      "You stayed when it would have been easier to stop.",
      `Log 5 sessions of an hour or more. (${longSess}/5)`,
      longSess >= 5, longSess / 5),

    ch("the-dawn",         "First Light",            "🌄",
      "The morning was quiet and the book was open and that was enough.",
      `Read 5 sessions before 8 am. (${dawnSess}/5)`,
      dawnSess >= 5, dawnSess / 5),

    ch("the-unbroken",     "The Unbroken",           "💎",
      "One hundred days of choosing the page over everything else.",
      `Reach a 100-day streak. Best: ${streak.longest} day${streak.longest === 1 ? "" : "s"}.`,
      streak.longest >= 100, streak.longest / 100),

    ch("the-sage",         "The Sage",               "🌟",
      "You have lived more lives than most people dare to imagine.",
      `Finish 25 books. (${finished}/25)`,
      finished >= 25, finished / 25),
  ];
}

/** The last (rarest) unlocked chapter — used for profile flair. */
export function topUnlockedChapter(chapters: Chapter[]): Chapter | null {
  for (let i = chapters.length - 1; i >= 0; i--) {
    if (chapters[i].unlocked) return chapters[i];
  }
  return null;
}

const SEEN_KEY = "tropely-chapters-seen-v1";

export function getSeenChapterIds(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(SEEN_KEY) ?? "[]")); }
  catch { return new Set(); }
}

export function markChaptersSeen(ids: string[]): void {
  try {
    const seen = getSeenChapterIds();
    ids.forEach((id) => seen.add(id));
    localStorage.setItem(SEEN_KEY, JSON.stringify([...seen]));
  } catch {}
}
