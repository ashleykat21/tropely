import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ── Types ────────────────────────────────────────────────────────────────────

export type Shelf = "reading" | "want" | "finished" | "dnf" | "paused";

export type Mood =
  | "hopeful" | "tense" | "melancholy" | "joyful" | "romantic"
  | "eerie" | "reflective" | "adventurous" | "cozy" | "intense";

export type Book = {
  id: string;
  title: string;
  author: string;
  translator?: string;
  narrator?: string;
  pages: number;
  progress: number;
  shelf: Shelf;
  mood?: Mood;
  cover?: string;
  addedAt: string;
  tags?: string[];
  tropes?: string[];
  ageRating?: number;
  openLibraryKey?: string;
  consumption?: "read" | "listen";
  audioMinutes?: number;
  checkpoints?: { page: number; label: string }[];
  reactions?: Record<string, string>;
};

export type SessionLog = {
  id: string;
  bookId: string;
  date: string;
  fromPage: number;
  toPage: number;
  minutes?: number;
  mood?: Mood;
  note?: string;
};

export type JournalEntry = {
  id: string;
  bookId: string;
  kind: "quote" | "note";
  text: string;
  page?: number;
  date: string;
  tags?: string[];
};

export type Reflection = {
  id: string;
  bookId: string;
  text: string;
  rating?: number;
  date: string;
};

export type Highlight = {
  id: string;
  bookId: string;
  text: string;
  trope?: string;
  mood?: Mood;
  page?: number;
  date: string;
};

// ── Store shape ──────────────────────────────────────────────────────────────

type LibraryState = {
  books: Book[];
  currentId: string | null;
  sessions: SessionLog[];
  journal: JournalEntry[];
  reflections: Reflection[];
  highlights: Highlight[];
  age: number | null;
  dailyGoalPages: number;
  dailyGoalMinutes: number;
  isPremium: boolean;
  annualGoal: number;
  hasOnboarded: boolean;
  reminderEnabled: boolean;
  reminderTime: string;
  preferredTropes: string[];

  // actions
  addBook: (b: Omit<Book, "id" | "addedAt">) => string;
  updateBook: (id: string, patch: Partial<Book>) => void;
  removeBook: (id: string) => void;
  setCurrent: (id: string) => void;
  moveToShelf: (id: string, shelf: Shelf) => void;
  addSession: (s: Omit<SessionLog, "id">) => void;
  addJournalEntry: (e: Omit<JournalEntry, "id">) => void;
  updateJournalEntry: (id: string, patch: Partial<JournalEntry>) => void;
  deleteJournalEntry: (id: string) => void;
  setReflection: (bookId: string, text: string, rating?: number) => void;
  setAge: (age: number) => void;
  setDailyGoalPages: (n: number) => void;
  setDailyGoalMinutes: (n: number) => void;
  setPremium: (v: boolean) => void;
  setAnnualGoal: (n: number) => void;
  setHasOnboarded: (v: boolean) => void;
  setReminderEnabled: (v: boolean) => void;
  setReminderTime: (t: string) => void;
  setPreferredTropes: (tropes: string[]) => void;
  addHighlight: (h: Omit<Highlight, "id">) => void;
  deleteHighlight: (id: string) => void;
};

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export const useStore = create<LibraryState>()(
  persist(
    (set, get) => ({
      books: [],
      currentId: null,
      sessions: [],
      journal: [],
      reflections: [],
      highlights: [],
      age: null,
      dailyGoalPages: 20,
      dailyGoalMinutes: 30,
      isPremium: false,
      annualGoal: 24,
      hasOnboarded: false,
      reminderEnabled: false,
      reminderTime: "20:00",
      preferredTropes: [],

      addBook: (b) => {
        const id = uid();
        set((s) => ({
          books: [
            ...s.books,
            { ...b, id, addedAt: new Date().toISOString() },
          ],
          currentId: b.shelf === "reading" ? id : s.currentId,
        }));
        return id;
      },

      updateBook: (id, patch) =>
        set((s) => ({
          books: s.books.map((b) => (b.id === id ? { ...b, ...patch } : b)),
        })),

      removeBook: (id) =>
        set((s) => ({
          books: s.books.filter((b) => b.id !== id),
          currentId: s.currentId === id ? null : s.currentId,
        })),

      setCurrent: (id) => set({ currentId: id }),

      moveToShelf: (id, shelf) =>
        set((s) => ({
          books: s.books.map((b) => (b.id === id ? { ...b, shelf } : b)),
        })),

      addSession: (s) =>
        set((st) => ({
          sessions: [{ ...s, id: uid() }, ...st.sessions],
        })),

      addJournalEntry: (e) =>
        set((s) => ({
          journal: [{ ...e, id: uid() }, ...s.journal],
        })),

      updateJournalEntry: (id, patch) =>
        set((s) => ({
          journal: s.journal.map((e) => (e.id === id ? { ...e, ...patch } : e)),
        })),

      deleteJournalEntry: (id) =>
        set((s) => ({ journal: s.journal.filter((e) => e.id !== id) })),

      setReflection: (bookId, text, rating) =>
        set((s) => {
          const existing = s.reflections.find((r) => r.bookId === bookId);
          if (existing) {
            return {
              reflections: s.reflections.map((r) =>
                r.bookId === bookId ? { ...r, text, rating, date: new Date().toISOString() } : r,
              ),
            };
          }
          return {
            reflections: [
              ...s.reflections,
              { id: uid(), bookId, text, rating, date: new Date().toISOString() },
            ],
          };
        }),

      setAge: (age) => set({ age }),
      setDailyGoalPages: (n) => set({ dailyGoalPages: n }),
      setDailyGoalMinutes: (n) => set({ dailyGoalMinutes: n }),
      setPremium: (v) => set({ isPremium: v }),
      setAnnualGoal: (n) => set({ annualGoal: n }),
      setHasOnboarded: (v) => set({ hasOnboarded: v }),
      setReminderEnabled: (v) => set({ reminderEnabled: v }),
      setReminderTime: (t) => set({ reminderTime: t }),
      setPreferredTropes: (tropes) => set({ preferredTropes: tropes }),

      addHighlight: (h) =>
        set((s) => ({
          highlights: [{ ...h, id: uid() }, ...s.highlights],
        })),

      deleteHighlight: (id) =>
        set((s) => ({
          highlights: s.highlights.filter((h) => h.id !== id),
        })),
    }),
    {
      name: "tropely-library",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

// ── Streak utility ────────────────────────────────────────────────────────────

export function computeStreak(sessions: SessionLog[]): number {
  if (sessions.length === 0) return 0;
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
  const dates = new Set(sessions.map((s) => s.date.slice(0, 10)));
  if (!dates.has(today) && !dates.has(yesterday)) return 0;
  let streak = 0;
  let cursor = new Date(today);
  for (let i = 0; i < 1000; i++) {
    if (dates.has(cursor.toISOString().slice(0, 10))) {
      streak++;
      cursor = new Date(cursor.getTime() - 86_400_000);
    } else {
      break;
    }
  }
  return streak;
}
