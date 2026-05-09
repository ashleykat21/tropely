export type Shelf = "reading" | "want" | "finished";
export type MoodKey =
  | "peaceful"
  | "tense"
  | "heartbroken"
  | "hopeful"
  | "amused"
  | "nostalgic"
  | "inspired"
  | "unsettled";
export type SortKey = "recent" | "title" | "pages" | "rating";
export type JournalType = "note" | "quote" | "reflection";

export interface ReadingSession {
  id: string;
  date: number;
  pages: number;
  minutes: number;
  mood: MoodKey;
  note?: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  cover?: string;
  isbn?: string;
  pageCount?: number;
  currentPage: number;
  shelf: Shelf;
  moods: MoodKey[];
  tropes: string[];
  sessions: ReadingSession[];
  reflection?: string;
  rating?: number;
  addedAt: number;
  finishedAt?: number;
  openLibraryKey?: string;
}

export interface JournalEntry {
  id: string;
  bookId: string;
  bookTitle: string;
  date: number;
  content: string;
  type: JournalType;
}

export interface UserProfile {
  name: string;
  dailyGoalPages: number;
  dailyGoalMinutes: number;
}

export const MOODS: {
  key: MoodKey;
  label: string;
  color: string;
  bg: string;
}[] = [
  { key: "peaceful", label: "Peaceful", color: "#7BB37D", bg: "#EBF4EB" },
  { key: "tense", label: "Tense", color: "#C85B5B", bg: "#F5EBEB" },
  { key: "heartbroken", label: "Heartbroken", color: "#B56B8A", bg: "#F5EAEF" },
  { key: "hopeful", label: "Hopeful", color: "#C49B3C", bg: "#F5F0E0" },
  { key: "amused", label: "Amused", color: "#D17147", bg: "#F5EDE6" },
  { key: "nostalgic", label: "Nostalgic", color: "#7B6BA8", bg: "#EEE9F5" },
  { key: "inspired", label: "Inspired", color: "#4A8BB5", bg: "#E6EFF5" },
  { key: "unsettled", label: "Unsettled", color: "#8A7A6B", bg: "#F0ECE8" },
];

export const TROPES = [
  "Found Family",
  "Enemies to Lovers",
  "Slow Burn",
  "Dark Academia",
  "Redemption Arc",
  "Mystery Box",
  "Unreliable Narrator",
  "Coming of Age",
  "Second Chance",
  "Forbidden Love",
  "Chosen One",
  "Anti-Hero",
  "Twist Ending",
  "Epistolary",
  "Time Loop",
  "Gothic",
];
