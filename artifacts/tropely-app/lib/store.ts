import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import {
  Book,
  JournalEntry,
  MoodKey,
  ReadingSession,
  UserProfile,
} from "@/types";

interface Store {
  books: Book[];
  journals: JournalEntry[];
  profile: UserProfile;
  addBook: (book: Book) => void;
  updateBook: (id: string, updates: Partial<Book>) => void;
  removeBook: (id: string) => void;
  logSession: (bookId: string, session: ReadingSession) => void;
  addJournal: (entry: JournalEntry) => void;
  removeJournal: (id: string) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
}

export const useStore = create<Store>()(
  persist(
    (set) => ({
      books: [],
      journals: [],
      profile: {
        name: "Reader",
        dailyGoalPages: 20,
        dailyGoalMinutes: 30,
      },

      addBook: (book) =>
        set((s) => ({ books: [book, ...s.books] })),

      updateBook: (id, updates) =>
        set((s) => ({
          books: s.books.map((b) => (b.id === id ? { ...b, ...updates } : b)),
        })),

      removeBook: (id) =>
        set((s) => ({ books: s.books.filter((b) => b.id !== id) })),

      logSession: (bookId, session) =>
        set((s) => ({
          books: s.books.map((b) => {
            if (b.id !== bookId) return b;
            const allMoods = Array.from(
              new Set([...b.moods, session.mood])
            ) as MoodKey[];
            const newPage = Math.min(
              b.currentPage + session.pages,
              b.pageCount ?? 999999
            );
            return {
              ...b,
              sessions: [...b.sessions, session],
              moods: allMoods,
              currentPage: newPage,
            };
          }),
        })),

      addJournal: (entry) =>
        set((s) => ({ journals: [entry, ...s.journals] })),

      removeJournal: (id) =>
        set((s) => ({
          journals: s.journals.filter((j) => j.id !== id),
        })),

      updateProfile: (updates) =>
        set((s) => ({ profile: { ...s.profile, ...updates } })),
    }),
    {
      name: "tropely-store-v1",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export function todaySessions(books: Book[]) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const ts = startOfDay.getTime();
  return books.flatMap((b) => b.sessions.filter((s) => s.date >= ts));
}

export function streak(books: Book[]): number {
  const days = new Set<string>();
  books.forEach((b) =>
    b.sessions.forEach((s) => {
      const d = new Date(s.date);
      days.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
    })
  );
  if (days.size === 0) return 0;
  let count = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if (days.has(key)) {
      count++;
    } else if (i > 0) {
      break;
    }
  }
  return count;
}
