import { create, StateCreator } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { MoodKey } from "@/constants/theme";

// ── Types ────────────────────────────────────────────────────────────────────

export type { MoodKey };
export type Shelf = "reading" | "want" | "finished" | "dnf" | "paused";
export type SpoilerStrictness = "relaxed" | "balanced" | "strict";
export type ShareVisibility = "public" | "friends" | "private";

export type Mood =
  | "hopeful" | "tense" | "melancholy" | "joyful" | "romantic"
  | "eerie" | "reflective" | "adventurous" | "cozy" | "intense";

export type ReadingFormat = "physical" | "ebook" | "audiobook" | "unknown";
export type SessionState = "not_started" | "active" | "paused" | "completed" | "deleted";

export type EmojiReaction = {
  emoji: string;
  label: string;
};

export type ReadingSession = {
  id: string;
  bookId: string;
  state: SessionState;
  format: ReadingFormat;
  startedAt: string;
  pausedAt?: string;
  endedAt?: string;
  startPage?: number;
  endPage?: number;
  startMinutes?: number;
  endMinutes?: number;
  durationMinutes?: number;
  chapterNumber?: number;
  reactions: string[];
  note?: string;
  mood?: Mood;
};

export type AvatarId = string;

export type InboxItem = {
  id: string;
  type: "buddy_invite" | "buddy_message" | "achievement" | "system";
  title: string;
  body: string;
  read: boolean;
  date: string;
  bookId?: string;
  roomId?: string;
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
  readingFormat?: ReadingFormat;
  totalDurationMinutes?: number;
  selectedEdition?: string;
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
  // Avatar
  selectedAvatar: AvatarId;
  setSelectedAvatar: (id: AvatarId) => void;
  // Adult confirmation
  adultConfirmed: boolean;
  setAdultConfirmed: (v: boolean) => void;
  // Quiz answers
  selectedGenres: string[];
  setSelectedGenres: (g: string[]) => void;
  selectedTropesQuiz: string[];
  setSelectedTropesQuiz: (t: string[]) => void;
  readingVibe: string;
  setReadingVibe: (v: string) => void;
  // Active session
  activeSession: ReadingSession | null;
  startSession: (bookId: string, format: ReadingFormat, startPage?: number, startMinutes?: number) => void;
  pauseSession: () => void;
  resumeSession: () => void;
  finishSession: (endPage?: number, endMinutes?: number, reactions?: string[], mood?: Mood, note?: string) => void;
  deleteSession: () => void;
  // UI mood and spoiler
  activeMood: MoodKey | null;
  setActiveMood: (mood: MoodKey | null) => void;
  spoilerStrictness: SpoilerStrictness;
  setSpoilerStrictness: (s: SpoilerStrictness) => void;
  defaultShareVisibility: ShareVisibility;
  setDefaultShareVisibility: (v: ShareVisibility) => void;
  // Inbox
  inbox: InboxItem[];
  addInboxItem: (item: Omit<InboxItem, "id">) => void;
  markInboxRead: (id: string) => void;
  clearInbox: () => void;
  // Premium entitlements
  premiumTestingModeEnabled: boolean;
  premiumSource: "testing" | "referral" | "subscription" | "admin" | "none";
  premiumExpiresAt: string | null;
  referralRewardMonths: number;
  activeBuddyReadRoomLimit: number;
  maxUsersPerBuddyReadRoom: number;
  aiMessageLimit: number;
  characterAIEnabled: boolean;
  advancedInsightsEnabled: boolean;
  advancedRecommendationsEnabled: boolean;
  // Active focus book for Today screen
  activeFocusBookId: string | null;
  setActiveFocusBook: (id: string | null) => void;
  // Mood atmosphere override
  moodAtmosphereOverride: string | null;
  setMoodAtmosphereOverride: (a: string | null) => void;
  // Premium setters
  setPremiumTestingMode: (v: boolean) => void;
  setPremiumSource: (s: "testing" | "referral" | "subscription" | "admin" | "none") => void;
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
  selectedAvatar: "cozy_romance",
  adultConfirmed: false,
  selectedGenres: [],
  selectedTropesQuiz: [],
  readingVibe: "",
  activeSession: null,
  inbox: [],
  activeMood: null,
  spoilerStrictness: "balanced",
  defaultShareVisibility: "friends",
  premiumTestingModeEnabled: true,
  premiumSource: "testing",
  premiumExpiresAt: null,
  referralRewardMonths: 0,
  activeBuddyReadRoomLimit: 3,
  maxUsersPerBuddyReadRoom: 3,
  aiMessageLimit: 10,
  characterAIEnabled: false,
  advancedInsightsEnabled: false,
  advancedRecommendationsEnabled: false,
  activeFocusBookId: null,
  moodAtmosphereOverride: null,

  setSelectedAvatar: (id) => set({ selectedAvatar: id }),
  setAdultConfirmed: (v) => set({ adultConfirmed: v }),
  setSelectedGenres: (g) => set({ selectedGenres: g }),
  setSelectedTropesQuiz: (t) => set({ selectedTropesQuiz: t }),
  setReadingVibe: (v) => set({ readingVibe: v }),

  startSession: (bookId, format, startPage, startMinutes) =>
    set({
      activeSession: {
        id: uid(),
        bookId,
        state: "active",
        format,
        startedAt: new Date().toISOString(),
        startPage,
        startMinutes,
        reactions: [],
      },
    }),

  pauseSession: () =>
    set((s) => {
      if (!s.activeSession || s.activeSession.state !== "active") return s;
      return { activeSession: { ...s.activeSession, state: "paused", pausedAt: new Date().toISOString() } };
    }),

  resumeSession: () =>
    set((s) => {
      if (!s.activeSession || s.activeSession.state !== "paused") return s;
      return { activeSession: { ...s.activeSession, state: "active", pausedAt: undefined } };
    }),

  finishSession: (endPage, endMinutes, reactions, mood, note) =>
    set((s) => {
      if (!s.activeSession) return s;
      const startedAt = new Date(s.activeSession.startedAt).getTime();
      const durationMinutes = Math.round((Date.now() - startedAt) / 60_000);
      const completed: ReadingSession = {
        ...s.activeSession,
        state: "completed",
        endedAt: new Date().toISOString(),
        endPage,
        endMinutes,
        durationMinutes,
        reactions: reactions ?? s.activeSession.reactions,
        mood: mood ?? s.activeSession.mood,
        note: note ?? s.activeSession.note,
      };
      return { activeSession: null };
    }),

  deleteSession: () => set({ activeSession: null }),

  addInboxItem: (item) =>
    set((s) => ({ inbox: [{ ...item, id: uid() }, ...s.inbox] })),

  markInboxRead: (id) =>
    set((s) => ({ inbox: s.inbox.map((item) => (item.id === id ? { ...item, read: true } : item)) })),

  clearInbox: () => set({ inbox: [] }),

  setActiveMood: (mood) => set({ activeMood: mood }),
  setSpoilerStrictness: (s) => set({ spoilerStrictness: s }),
  setDefaultShareVisibility: (v) => set({ defaultShareVisibility: v }),
  setActiveFocusBook: (id) => set({ activeFocusBookId: id }),
  setMoodAtmosphereOverride: (a) => set({ moodAtmosphereOverride: a }),
  setPremiumTestingMode: (v) => set({ premiumTestingModeEnabled: v }),
  setPremiumSource: (s) => set({ premiumSource: s }),

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
