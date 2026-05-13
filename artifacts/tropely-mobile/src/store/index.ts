import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ── Types (mirrors web app store) ────────────────────────────────────────────

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

// ── Store shape ──────────────────────────────────────────────────────────────

type LibraryState = {
  books: Book[];
  currentId: string | null;
  sessions: SessionLog[];
  journal: JournalEntry[];
  reflections: Reflection[];
  age: number | null;
  dailyGoalPages: number;
  dailyGoalMinutes: number;
  isPremium: boolean;

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
      age: null,
      dailyGoalPages: 20,
      dailyGoalMinutes: 30,
      isPremium: false,

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
    }),
    {
      name: "tropely-library",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
