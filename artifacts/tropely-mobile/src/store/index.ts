import { create, StateCreator } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ── Types ────────────────────────────────────────────────────────────────────

export type Shelf = "reading" | "want" | "finished" | "dnf" | "paused";

export type Mood =
  | "hopeful" | "tense" | "melancholy" | "joyful" | "romantic"
  | "eerie" | "reflective" | "adventurous" | "cozy" | "intense";

export type MoodKey =
  | "cozy" | "calm" | "intense" | "melancholy" | "dreamy" | "joyful" | "mysterious";

export type SpoilerStrictness = "relaxed" | "balanced" | "strict";
export type ShareVisibility = "public" | "friends" | "private";

export type Challenge = {
  id: string;
  title: string;
  target: number;
  unit: "books" | "pages" | "minutes";
  progress: number;
  completed: boolean;
  dueDate?: string;
};

export type PageMarker = {
  id: string;
  bookId: string;
  page: number;
  note?: string;
  date: string;
};

export type Checkpoint = {
  id: string;
  bookId: string;
  page: number;
  label: string;
  locked: boolean;
};

export type TriggerEntry = {
  id: string;
  bookId: string;
  trigger: string;
  page?: number;
  note?: string;
  date: string;
};

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
  kind: "quote" | "note" | "reflection" | "trigger";
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

// ── Slice types ───────────────────────────────────────────────────────────────

type LibrarySlice = {
  books: Book[];
  currentId: string | null;
  sessions: SessionLog[];
  reflections: Reflection[];
  highlights: Highlight[];
  addBook: (b: Omit<Book, "id" | "addedAt">) => string;
  updateBook: (id: string, patch: Partial<Book>) => void;
  removeBook: (id: string) => void;
  setCurrent: (id: string) => void;
  moveToShelf: (id: string, shelf: Shelf) => void;
  addSession: (s: Omit<SessionLog, "id">) => void;
  setReflection: (bookId: string, text: string, rating?: number) => void;
  addHighlight: (h: Omit<Highlight, "id">) => void;
  deleteHighlight: (id: string) => void;
};

type JournalSlice = {
  journal: JournalEntry[];
  addJournalEntry: (e: Omit<JournalEntry, "id">) => void;
  updateJournalEntry: (id: string, patch: Partial<JournalEntry>) => void;
  deleteJournalEntry: (id: string) => void;
};

type SettingsSlice = {
  age: number | null;
  dailyGoalPages: number;
  dailyGoalMinutes: number;
  isPremium: boolean;
  annualGoal: number;
  hasOnboarded: boolean;
  reminderEnabled: boolean;
  reminderTime: string;
  preferredTropes: string[];
  spoilerLock: boolean;
  equippedBadgeId: string | null;
  monthlyProgress: Record<string, { month: string; completed: boolean; progress: number }>;
  yearlyBadges: { year: number; badges: string[] }[];
  referralCode: string | null;
  referralCount: number;
  freeMonthsEarned: number;
  // v1 additions
  activeMood: MoodKey | null;
  spoilerStrictness: SpoilerStrictness;
  defaultShareVisibility: ShareVisibility;
  activeFlair: string | null;
  challenges: Challenge[];
  markers: PageMarker[];
  checkpoints: Checkpoint[];
  triggers: TriggerEntry[];
  hasSeenTour: boolean;
  setAge: (age: number) => void;
  setDailyGoalPages: (n: number) => void;
  setDailyGoalMinutes: (n: number) => void;
  setPremium: (v: boolean) => void;
  setAnnualGoal: (n: number) => void;
  setHasOnboarded: (v: boolean) => void;
  setReminderEnabled: (v: boolean) => void;
  setReminderTime: (t: string) => void;
  setPreferredTropes: (tropes: string[]) => void;
  setSpoilerLock: (v: boolean) => void;
  setEquippedBadge: (id: string | null) => void;
  setReferralCode: (code: string) => void;
  incrementReferralCount: () => void;
  // v1 setters
  setActiveMood: (mood: MoodKey | null) => void;
  setSpoilerStrictness: (s: SpoilerStrictness) => void;
  setDefaultShareVisibility: (v: ShareVisibility) => void;
  setActiveFlair: (flair: string | null) => void;
  addChallenge: (c: Omit<Challenge, "id" | "progress" | "completed">) => void;
  updateChallengeProgress: (id: string, progress: number) => void;
  completeChallenge: (id: string) => void;
  removeChallenge: (id: string) => void;
  addMarker: (m: Omit<PageMarker, "id">) => void;
  removeMarker: (id: string) => void;
  addCheckpoint: (c: Omit<Checkpoint, "id">) => void;
  removeCheckpoint: (id: string) => void;
  addTrigger: (t: Omit<TriggerEntry, "id">) => void;
  setHasSeenTour: (v: boolean) => void;
};

type AllSlices = LibrarySlice & JournalSlice & SettingsSlice;

// ── Helper ───────────────────────────────────────────────────────────────────

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// ── Slice creators ────────────────────────────────────────────────────────────

const createLibrarySlice: StateCreator<AllSlices, [], [], LibrarySlice> = (set) => ({
  books: [],
  currentId: null,
  sessions: [],
  reflections: [],
  highlights: [],

  addBook: (b) => {
    const id = uid();
    set((s) => ({
      books: [...s.books, { ...b, id, addedAt: new Date().toISOString() }],
      currentId: b.shelf === "reading" ? id : s.currentId,
    }));
    return id;
  },

  updateBook: (id, patch) =>
    set((s) => ({ books: s.books.map((b) => (b.id === id ? { ...b, ...patch } : b)) })),

  removeBook: (id) =>
    set((s) => ({
      books: s.books.filter((b) => b.id !== id),
      currentId: s.currentId === id ? null : s.currentId,
    })),

  setCurrent: (id) => set({ currentId: id }),

  moveToShelf: (id, shelf) =>
    set((s) => ({ books: s.books.map((b) => (b.id === id ? { ...b, shelf } : b)) })),

  addSession: (s) =>
    set((st) => ({ sessions: [{ ...s, id: uid() }, ...st.sessions] })),

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

  addHighlight: (h) =>
    set((s) => ({ highlights: [{ ...h, id: uid() }, ...s.highlights] })),

  deleteHighlight: (id) =>
    set((s) => ({ highlights: s.highlights.filter((h) => h.id !== id) })),
});

const createJournalSlice: StateCreator<AllSlices, [], [], JournalSlice> = (set) => ({
  journal: [],

  addJournalEntry: (e) =>
    set((s) => ({ journal: [{ ...e, id: uid() }, ...s.journal] })),

  updateJournalEntry: (id, patch) =>
    set((s) => ({ journal: s.journal.map((e) => (e.id === id ? { ...e, ...patch } : e)) })),

  deleteJournalEntry: (id) =>
    set((s) => ({ journal: s.journal.filter((e) => e.id !== id) })),
});

const createSettingsSlice: StateCreator<AllSlices, [], [], SettingsSlice> = (set) => ({
  age: null,
  dailyGoalPages: 20,
  dailyGoalMinutes: 30,
  isPremium: false,
  annualGoal: 24,
  hasOnboarded: false,
  reminderEnabled: false,
  reminderTime: "20:00",
  preferredTropes: [],
  spoilerLock: true,
  equippedBadgeId: null,
  monthlyProgress: {},
  yearlyBadges: [],
  referralCode: null,
  referralCount: 0,
  freeMonthsEarned: 0,
  activeMood: null,
  spoilerStrictness: "balanced",
  defaultShareVisibility: "friends",
  activeFlair: null,
  challenges: [],
  markers: [],
  checkpoints: [],
  triggers: [],
  hasSeenTour: false,

  setAge: (age) => set({ age }),
  setDailyGoalPages: (n) => set({ dailyGoalPages: n }),
  setDailyGoalMinutes: (n) => set({ dailyGoalMinutes: n }),
  setPremium: (v) => set({ isPremium: v }),
  setAnnualGoal: (n) => set({ annualGoal: n }),
  setHasOnboarded: (v) => set({ hasOnboarded: v }),
  setReminderEnabled: (v) => set({ reminderEnabled: v }),
  setReminderTime: (t) => set({ reminderTime: t }),
  setPreferredTropes: (tropes) => set({ preferredTropes: tropes }),
  setSpoilerLock: (v) => set({ spoilerLock: v }),
  setEquippedBadge: (id) => set({ equippedBadgeId: id }),
  setReferralCode: (code) => set({ referralCode: code }),
  incrementReferralCount: () =>
    set((s) => {
      const next = s.referralCount + 1;
      return {
        referralCount: next,
        freeMonthsEarned: s.freeMonthsEarned + (next % 3 === 0 ? 1 : 0),
      };
    }),
  setActiveMood: (mood) => set({ activeMood: mood }),
  setSpoilerStrictness: (s) => set({ spoilerStrictness: s }),
  setDefaultShareVisibility: (v) => set({ defaultShareVisibility: v }),
  setActiveFlair: (flair) => set({ activeFlair: flair }),
  addChallenge: (c) =>
    set((s) => ({
      challenges: [...s.challenges, { ...c, id: uid(), progress: 0, completed: false }],
    })),
  updateChallengeProgress: (id, progress) =>
    set((s) => ({
      challenges: s.challenges.map((c) => (c.id === id ? { ...c, progress } : c)),
    })),
  completeChallenge: (id) =>
    set((s) => ({
      challenges: s.challenges.map((c) => (c.id === id ? { ...c, completed: true } : c)),
    })),
  removeChallenge: (id) =>
    set((s) => ({ challenges: s.challenges.filter((c) => c.id !== id) })),
  addMarker: (m) =>
    set((s) => ({ markers: [{ ...m, id: uid() }, ...s.markers] })),
  removeMarker: (id) =>
    set((s) => ({ markers: s.markers.filter((m) => m.id !== id) })),
  addCheckpoint: (c) =>
    set((s) => ({ checkpoints: [...s.checkpoints, { ...c, id: uid() }] })),
  removeCheckpoint: (id) =>
    set((s) => ({ checkpoints: s.checkpoints.filter((c) => c.id !== id) })),
  addTrigger: (t) =>
    set((s) => ({ triggers: [{ ...t, id: uid() }, ...s.triggers] })),
  setHasSeenTour: (v) => set({ hasSeenTour: v }),
});

// ── Store ─────────────────────────────────────────────────────────────────────

export const useStore = create<AllSlices>()(
  persist(
    (...a) => ({
      ...createLibrarySlice(...a),
      ...createJournalSlice(...a),
      ...createSettingsSlice(...a),
    }),
    {
      name: "tropely-library",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

// ── Convenience selectors ─────────────────────────────────────────────────────

export function useBooks() { return useStore((s) => s.books); }
export function useSessions() { return useStore((s) => s.sessions); }
export function useJournal() { return useStore((s) => s.journal); }
export function useSpoilerLock() { return useStore((s) => s.spoilerLock); }
export function useCurrentBook() {
  return useStore(
    (s) =>
      s.books.find((b) => b.id === s.currentId && b.shelf === "reading") ??
      s.books.find((b) => b.shelf === "reading") ??
      null,
  );
}

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
