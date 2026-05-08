export type ChangelogEntry = {
  id: string;
  date: string;
  title: string;
  body: string;
  cta?: { label: string; href: string };
};

export const CHANGELOG: ChangelogEntry[] = [
  {
    id: "family-profiles",
    date: "2026-05-01",
    title: "Family profiles",
    body: "Add up to 6 reader profiles under one account — each with its own library, mood history, and parental-pin lock. Switch instantly from the avatar menu in any header.",
    cta: { label: "Set up family", href: "/profile" },
  },
  {
    id: "tropely-wrap",
    date: "2026-04-28",
    title: "Tropely Wrap",
    body: "Your year in reading, visualised. Mood arcs, trope obsessions, reading-speed curves, and a shareable card for every book you finished — all in one scroll.",
    cta: { label: "See your Wrap", href: "/wrap" },
  },
  {
    id: "reading-twins",
    date: "2026-04-22",
    title: "Reading twins",
    body: "Discover readers whose mood fingerprint and trope picks almost exactly mirror yours. Follow them, peek at their shelf, and find your next read through someone who just gets it.",
    cta: { label: "Find your twin", href: "/twins" },
  },
  {
    id: "buddy-reads",
    date: "2026-04-18",
    title: "Buddy reads",
    body: "Read the same book together — share spoiler-safe notes chapter by chapter, react to each other's highlights, and watch your mood arcs diverge in real time.",
    cta: { label: "Start a buddy read", href: "/social" },
  },
  {
    id: "quick-log",
    date: "2026-04-13",
    title: "Quick-log sheet",
    body: "Tap the \u201cLog\u201d button anywhere in the app to record pages, mood, and a note in one motion \u2014 no need to navigate to a book detail page first.",
  },
  {
    id: "discover-filters",
    date: "2026-04-08",
    title: "Stackable Discover filters",
    body: "Combine mood, trope, pace, and age-rating filters freely in Discover. Every combination updates results instantly so you can narrow down to exactly the vibe you need.",
    cta: { label: "Try Discover", href: "/discover" },
  },
  {
    id: "cross-device-sync",
    date: "2026-03-24",
    title: "Cross-device sync",
    body: "Your library now follows you across browsers and devices. Progress, journal entries, and trope picks merge automatically — even when you've been reading offline.",
  },
  {
    id: "audiobook-autofinish",
    date: "2026-03-12",
    title: "Audiobook auto-finish",
    body: "Log listening time in minutes and Tropely will automatically move the book to Finished, record the completion date, and prompt a reflection when the last minute is reached.",
  },
  {
    id: "citations-hover",
    date: "2026-02-28",
    title: "Quote citations with hover preview",
    body: "Every saved quote now shows the page number and a hover card with the book cover — making it easy to trace a favourite line back to its context.",
  },
  {
    id: "companion-memory",
    date: "2026-02-14",
    title: "Companion memory",
    body: "Your AI reading companion now remembers your mood across every book you've finished, tracks which tropes appear across your whole library, and personalises each conversation to your history.",
    cta: { label: "Chat with companion", href: "/companion" },
  },
];

function startOfDay(iso: string): number {
  return new Date(iso + "T00:00:00").getTime();
}

type Group = { label: string; entries: ChangelogEntry[] };

export function groupChangelog(entries: ChangelogEntry[]): Group[] {
  const now = Date.now();
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
  const todayDate = new Date(now);
  const currentMonth = todayDate.getMonth();
  const currentYear = todayDate.getFullYear();

  const thisWeek: ChangelogEntry[] = [];
  const thisMonth: ChangelogEntry[] = [];
  const earlier: ChangelogEntry[] = [];

  for (const entry of entries) {
    const ts = startOfDay(entry.date);
    if (ts >= sevenDaysAgo) {
      thisWeek.push(entry);
    } else {
      const d = new Date(ts);
      if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
        thisMonth.push(entry);
      } else {
        earlier.push(entry);
      }
    }
  }

  const groups: Group[] = [];
  if (thisWeek.length) groups.push({ label: "This week", entries: thisWeek });
  if (thisMonth.length) groups.push({ label: "Earlier this month", entries: thisMonth });
  if (earlier.length) groups.push({ label: "Earlier", entries: earlier });
  return groups;
}

export function latestChangelogTimestamp(): number {
  if (!CHANGELOG.length) return 0;
  return Math.max(...CHANGELOG.map((e) => new Date(e.date + "T00:00:00").getTime()));
}
