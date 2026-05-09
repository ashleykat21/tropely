import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { FreezeState } from "@/lib/streak";
import { reconcileFreezes } from "@/lib/streak";
import type { MoodKey } from "@/constants/colors";

export type Shelf = "reading" | "finished" | "want" | "dropped" | "paused";

export interface Book {
  id: string;
  title: string;
  author: string;
  translator?: string;
  narrator?: string;
  cover?: string;
  pages?: number;
  progress: number;
  shelf: Shelf;
  mood?: MoodKey;
  tropes?: string[];
  tags?: string[];
  addedAt: number;
  openLibraryKey?: string;
  rating?: number;
  isFavorite?: boolean;
  seriesName?: string;
  seriesPosition?: number;
}

export type JournalKind = "note" | "quote" | "reflection" | "trigger" | "reread";

export interface JournalEntry {
  id: string;
  bookId?: string;
  mood?: MoodKey;
  kind?: JournalKind;
  text: string;
  createdAt: number;
  isSpoiler?: boolean;
  reactions?: string[];
}

export interface SessionLog {
  id: string;
  bookId: string;
  pagesRead: number;
  minutes?: number;
  at: number;
  mood?: MoodKey;
  note?: string;
}

export interface Reflection {
  id: string;
  bookId: string;
  rating?: number;
  review?: string;
  createdAt: number;
}

export interface MoodPreferences {
  favoriteMoods: MoodKey[];
  favoriteGenres: string[];
}

export interface CompanionMessage {
  id: string;
  bookKey: string;
  role: "user" | "assistant";
  content: string;
  at: number;
}

function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

interface AppState {
  books: Book[];
  journal: JournalEntry[];
  sessions: SessionLog[];
  reflections: Reflection[];
  companionMessages: CompanionMessage[];
  freeze: FreezeState | undefined;
  preferences: MoodPreferences | null;
  onboarded: boolean;
  dailyGoal: number;
  dailyGoalMinutes: number;
  yearlyGoal: number;
  profilePicture: string | null;
  shelfTheme: string;
  achievementFlair: string | null;
  familyAccount: boolean | null;
  isUnder16: boolean | null;

  addBook: (b: Omit<Book, "id" | "addedAt" | "progress">) => string;
  updateBook: (id: string, patch: Partial<Book>) => void;
  removeBook: (id: string) => void;
  moveShelf: (id: string, shelf: Shelf) => void;
  updateProgress: (id: string, pages: number) => void;
  toggleFavorite: (id: string) => void;

  addJournal: (e: Omit<JournalEntry, "id" | "createdAt">) => void;
  removeJournal: (id: string) => void;
  reactToJournal: (id: string, emoji: string) => void;

  logSession: (s: Omit<SessionLog, "id" | "at">) => void;

  saveReflection: (r: Omit<Reflection, "id" | "createdAt">) => void;

  addCompanionMessage: (m: Omit<CompanionMessage, "id" | "at">) => void;
  clearCompanionHistory: (bookKey: string) => void;

  completeOnboarding: (prefs: MoodPreferences) => void;
  resetOnboarding: () => void;

  setDailyGoal: (pages: number) => void;
  setDailyGoalMinutes: (m: number) => void;
  setYearlyGoal: (count: number) => void;
  setProfilePicture: (uri: string | null) => void;
  setShelfTheme: (theme: string) => void;
  setAchievementFlair: (id: string | null) => void;
  setFamilyAccount: (v: boolean) => void;
  setIsUnder16: (v: boolean) => void;

  reconcileFreeze: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      books: [],
      journal: [],
      sessions: [],
      reflections: [],
      companionMessages: [],
      freeze: undefined,
      preferences: null,
      onboarded: false,
      dailyGoal: 20,
      dailyGoalMinutes: 30,
      yearlyGoal: 24,
      profilePicture: null,
      shelfTheme: "darkWalnut",
      achievementFlair: null,
      familyAccount: null,
      isUnder16: null,

      addBook: (b) => {
        const id = genId();
        set((s) => ({
          books: [
            ...s.books,
            { ...b, id, addedAt: Date.now(), progress: 0 },
          ],
        }));
        return id;
      },

      updateBook: (id, patch) =>
        set((s) => ({
          books: s.books.map((b) => (b.id === id ? { ...b, ...patch } : b)),
        })),

      removeBook: (id) =>
        set((s) => ({ books: s.books.filter((b) => b.id !== id) })),

      moveShelf: (id, shelf) => {
        set((s) => ({
          books: s.books.map((b) => {
            if (b.id !== id) return b;
            const updates: Partial<Book> = { shelf };
            if (shelf === "reading" && b.shelf === "want") updates.progress = 0;
            return { ...b, ...updates };
          }),
        }));
      },

      updateProgress: (id, pages) =>
        set((s) => ({
          books: s.books.map((b) => (b.id === id ? { ...b, progress: pages } : b)),
        })),

      toggleFavorite: (id) =>
        set((s) => ({
          books: s.books.map((b) =>
            b.id === id ? { ...b, isFavorite: !b.isFavorite } : b
          ),
        })),

      addJournal: (e) =>
        set((s) => ({
          journal: [
            { ...e, id: genId(), createdAt: Date.now() },
            ...s.journal,
          ],
        })),

      removeJournal: (id) =>
        set((s) => ({ journal: s.journal.filter((e) => e.id !== id) })),

      reactToJournal: (id, emoji) =>
        set((s) => ({
          journal: s.journal.map((e) => {
            if (e.id !== id) return e;
            const current = e.reactions ?? [];
            const has = current.includes(emoji);
            return { ...e, reactions: has ? current.filter((r) => r !== emoji) : [...current, emoji] };
          }),
        })),

      logSession: (s) => {
        set((st) => ({
          sessions: [
            ...st.sessions,
            { ...s, id: genId(), at: Date.now() },
          ],
        }));
        const { sessions, freeze } = get();
        const next = reconcileFreezes(sessions, freeze);
        set({ freeze: next });
      },

      saveReflection: (r) => {
        set((s) => {
          const existing = s.reflections.findIndex((x) => x.bookId === r.bookId);
          const entry = { ...r, id: genId(), createdAt: Date.now() };
          if (existing >= 0) {
            const updated = [...s.reflections];
            updated[existing] = { ...updated[existing], ...entry };
            return { reflections: updated };
          }
          return { reflections: [...s.reflections, entry] };
        });
        if (r.rating !== undefined) {
          set((s) => ({
            books: s.books.map((b) =>
              b.id === r.bookId ? { ...b, rating: r.rating } : b
            ),
          }));
        }
      },

      addCompanionMessage: (m) =>
        set((s) => ({
          companionMessages: [
            ...s.companionMessages,
            { ...m, id: genId(), at: Date.now() },
          ],
        })),

      clearCompanionHistory: (bookKey) =>
        set((s) => ({
          companionMessages: s.companionMessages.filter(
            (m) => m.bookKey !== bookKey
          ),
        })),

      completeOnboarding: (prefs) =>
        set({ preferences: prefs, onboarded: true }),

      resetOnboarding: () =>
        set({ preferences: null, onboarded: false }),

      setDailyGoal: (pages) => set({ dailyGoal: pages }),
      setDailyGoalMinutes: (m) => set({ dailyGoalMinutes: m }),
      setYearlyGoal: (count) => set({ yearlyGoal: count }),
      setProfilePicture: (uri) => set({ profilePicture: uri }),
      setShelfTheme: (theme) => set({ shelfTheme: theme }),
      setAchievementFlair: (id) => set({ achievementFlair: id }),
      setFamilyAccount: (v) => set({ familyAccount: v }),
      setIsUnder16: (v) => set({ isUnder16: v }),

      reconcileFreeze: () => {
        const { sessions, freeze } = get();
        set({ freeze: reconcileFreezes(sessions, freeze) });
      },
    }),
    {
      name: "tropely-store",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export const selectors = {
  readingBooks: (s: AppState) => s.books.filter((b) => b.shelf === "reading"),
  wantBooks: (s: AppState) => s.books.filter((b) => b.shelf === "want"),
  finishedBooks: (s: AppState) => s.books.filter((b) => b.shelf === "finished"),
  bookById: (id: string) => (s: AppState) => s.books.find((b) => b.id === id),
  reflectionFor: (bookId: string) => (s: AppState) =>
    s.reflections.find((r) => r.bookId === bookId),
  todaySessions: (s: AppState) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return s.sessions.filter((sess) => sess.at >= today.getTime());
  },
  companionHistory: (bookKey: string) => (s: AppState) =>
    s.companionMessages
      .filter((m) => m.bookKey === bookKey)
      .sort((a, b) => a.at - b.at),
};
