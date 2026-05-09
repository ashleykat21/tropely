import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { MoodKey, ReactionEmoji } from "./moods";
import { reconcileFreezes, type FreezeState } from "./streak";
import { suggestTropes } from "./tropes";
import { refreshCompanionMemory } from "./companionMemory";
import quietTide from "@/assets/book-quiet-tide.jpg";
import letters from "@/assets/book-letters.jpg";
import hollow from "@/assets/book-hollow.jpg";

export type Shelf = "reading" | "want" | "finished" | "dnf" | "paused";
export type AgeRating = number;

export type TriggerType =
  | "gut-punch"
  | "relief"
  | "plot-twist"
  | "laughed-out-loud"
  | "heartbreak"
  | "turning-point";

export type JournalEntry = {
  id: string;
  bookId: string;
  kind: "note" | "quote" | "reflection" | "trigger" | "reread";
  text: string;
  page?: number;
  mood?: MoodKey;
  createdAt: number;
  reactions?: ReactionEmoji[];
  triggerType?: TriggerType;
};

export type ReactionLog = {
  emoji: ReactionEmoji;
  bookId: string;
  at: number;
};

export type SessionLog = {
  id: string;
  bookId: string;
  mood: MoodKey;
  pagesRead: number;
  fromPage: number;
  toPage: number;
  note?: string;
  at: number;
  durationSec?: number;
};

export type FinishRecord = {
  id: string;
  bookId: string;
  finishedAt: number;
  rating?: number;
};

export type Reflection = {
  id: string;
  bookId: string;
  rating: number; // 1-5
  takeaway: string;
  arc: { start: MoodKey; middle: MoodKey; end: MoodKey };
  favoriteQuote?: string;
  createdAt: number;
};

export type ReadSnapshot = {
  id: string;
  bookId: string;
  readIndex: number; // 0 = first read, 1 = first reread, etc.
  finishedAt: number;
  arc: { start: MoodKey; middle: MoodKey; end: MoodKey };
  rating: number;
  tropes: string[];
  note?: string; // "how did it land differently?" text
};

export type Book = {
  id: string;
  title: string;
  author: string;
  translator?: string;
  narrator?: string;
  cover?: string;
  pages: number;
  progress: number; // pages read
  mood: MoodKey;
  shelf: Shelf;
  reactions: ReactionEmoji[];
  addedAt: number;
  checkpoints?: Checkpoint[];
  tags?: string[]; // genres / themes
  tropes?: string[];
  rereadCount?: number;
  priority?: number; // TBR ordering — lower = higher priority
  format?: "paperback" | "hardcover" | "ebook" | "audiobook";
  audioMinutes?: number; // total minutes for audiobooks
  audioMinutesListened?: number;
  favorite?: boolean;
  ageRating?: AgeRating;
  // How the user experienced this book — independent of physical format.
  consumption?: "read" | "listened";
  // Series name — populated from Open Library / user entry; used for auto-collection.
  series?: string;
};

export type Checkpoint = {
  id: string;
  page: number;
  label: string;
};

export type PageMarker = {
  id: string;
  bookId: string;
  page: number;
  label: string;
  at: number;
};

export type SpoilerStrictness = "relaxed" | "balanced" | "strict";

export type MoodPreferences = {
  favorites: MoodKey[]; // moods user gravitates toward
  avoid: MoodKey[];     // moods user wants less of
  pace: "slow" | "medium" | "fast";
  spoilerStrictness: SpoilerStrictness;
  age?: number;
  favoriteTropes?: string[]; // tropes selected during onboarding
};

export type ShelfTheme = {
  background: string; // tailwind/bg or css color
  accent: string;     // accent color (HSL string)
  texture: "none" | "linen" | "paper" | "wood" | "velvet";
};

export type BookcaseShelfStyle = "classic-wood" | "light-oak" | "dark-walnut" | "cozy-pastel" | "minimal-cream";
export type BookcaseSpineStyle = "colorful" | "neutral" | "mood-based" | "genre-based";
export type BookcaseStyle = {
  shelf: BookcaseShelfStyle;
  spine: BookcaseSpineStyle;
};

export type Collection = {
  id: string;
  name: string;
  // Optional series metadata; collections double as "series".
  isSeries?: boolean;
  bookIds: string[];
  createdAt: number;
};

type State = {
  books: Book[];
  currentId: string | null;
  journal: JournalEntry[];
  reactionLog: ReactionLog[];
  sessions: SessionLog[];
  reflections: Reflection[];
  finishes: FinishRecord[];
  yearlyGoal: number;
  spoilerStrictness: SpoilerStrictness;
  hasOnboarded: boolean;
  hasSeenWalkthrough: boolean;
  moodPreferences: MoodPreferences | null;
  dailyGoalPages: number;
  dailyGoalMinutes: number;
  age: number | null;
  shelfTheme: ShelfTheme;
  privateLibrary: boolean;
  defaultShareVisibility: "public" | "followers" | "private";
  showBadgeFlair: boolean;
  customShelfNames: Partial<Record<Shelf, string>>;
  lifetimeEarned: string[]; // permanently-earned badge ids (lifetime mode)
  lifetimeRewards: string[]; // claimed lifetime reward badge ids
  freeze: FreezeState;
  collections: Collection[];
  markers: PageMarker[];
  nextReadId: string | null;
  readSnapshots: ReadSnapshot[];
  parentalPin?: string;
  readingFontScale: number;
  readingDensity: "compact" | "default" | "comfortable";
  companionFinishedToastsShown: string[];
  lastChangelogReadAt: number;
  bookcaseMode: boolean;
  bookcaseStyle: BookcaseStyle;
  setReadingFontScale: (scale: number) => void;
  setLastChangelogReadAt: (ts: number) => void;
  setReadingDensity: (d: "compact" | "default" | "comfortable") => void;
  setParentalPin: (pin: string | undefined) => void;
  setBookcaseMode: (v: boolean) => void;
  setBookcaseStyle: (s: Partial<BookcaseStyle>) => void;
  createCollection: (name: string, isSeries?: boolean) => string;
  renameCollection: (id: string, name: string) => void;
  deleteCollection: (id: string) => void;
  addToCollection: (id: string, bookId: string) => void;
  removeFromCollection: (id: string, bookId: string) => void;
  reorderCollectionBooks: (id: string, bookIds: string[]) => void;
  reconcileFreeze: () => void;
  autoTagReadingBooks: () => void;
  autoAssignSeries: (bookId: string) => { collectionId: string; seriesName: string } | null;
  setCurrent: (id: string) => void;
  addBook: (b: Omit<Book, "id" | "addedAt" | "reactions" | "progress"> & { progress?: number }) => string;
  updateProgress: (id: string, pages: number) => void;
  updateBook: (id: string, patch: Partial<Pick<Book, "title" | "author" | "translator" | "narrator" | "pages" | "mood" | "cover" | "tags" | "tropes" | "consumption" | "audioMinutes" | "ageRating">>) => void;
  setBookPriority: (id: string, priority: number) => void;
  updateAudioProgress: (id: string, minutes: number) => void;
  addReaction: (id: string, emoji: ReactionEmoji) => void;
  moveShelf: (id: string, shelf: Shelf) => void;
  removeBook: (id: string) => void;
  addJournal: (e: Omit<JournalEntry, "id" | "createdAt">) => void;
  removeJournal: (id: string) => void;
  reactToJournal: (id: string, emoji: ReactionEmoji) => void;
  logSession: (s: Omit<SessionLog, "id" | "at">) => void;
  saveReflection: (r: Omit<Reflection, "id" | "createdAt">) => void;
  addCheckpoint: (bookId: string, page: number, label: string) => void;
  removeCheckpoint: (bookId: string, checkpointId: string) => void;
  setBookTags: (bookId: string, tags: string[]) => void;
  setSpoilerStrictness: (s: SpoilerStrictness) => void;
  completeOnboarding: (prefs: MoodPreferences) => void;
  resetOnboarding: () => void;
  setHasSeenWalkthrough: (v: boolean) => void;
  setDailyGoal: (pages: number) => void;
  setDailyGoalMinutes: (m: number) => void;
  setYearlyGoal: (count: number) => void;
  startReread: (bookId: string) => void;
  saveRereadSnapshot: (bookId: string, note: string) => void;
  annotateReadSnapshot: (bookId: string, readIndex: number, note: string) => void;
  setAge: (age: number | null) => void;
  setShelfTheme: (t: ShelfTheme) => void;
  setPrivateLibrary: (v: boolean) => void;
  setDefaultShareVisibility: (v: "public" | "followers" | "private") => void;
  setShowBadgeFlair: (v: boolean) => void;
  setCustomShelfName: (shelf: Shelf, name: string) => void;
  toggleFavorite: (bookId: string) => void;
  recordLifetimeEarned: (ids: string[]) => void;
  claimLifetimeReward: (id: string) => void;
  markCompanionFinishedToastShown: (key: string) => void;
  addMarker: (entry: Omit<PageMarker, "id" | "at">) => void;
  removeMarker: (id: string) => void;
  setNextRead: (id: string | null) => void;
  restoreFromExport: (data: {
    books: Book[];
    journal: JournalEntry[];
    sessions: SessionLog[];
    reactionLog: ReactionLog[];
    reflections: Reflection[];
  }) => void;
  mergeFromExport: (data: {
    books: Book[];
    journal: JournalEntry[];
    sessions: SessionLog[];
    reactionLog: ReactionLog[];
    reflections: Reflection[];
  }) => { addedBooks: number; addedJournal: number };
  applyImportedData: (data: {
    newBooks: Book[];
    shelfUpdates: Array<{ existingId: string; importedId: string; toShelf: Shelf; toProgress: number }>;
    newFinishes: FinishRecord[];
    journal?: JournalEntry[];
    sessions?: SessionLog[];
    reactionLog?: ReactionLog[];
    reflections?: Reflection[];
  }) => { addedBooks: number; updatedBooks: number; addedFinishes: number; addedJournal: number };
  applyRemoteSnapshot: (data: Partial<ProfileData> & { readSnapshots?: ReadSnapshot[] }) => void;
};

const seed: Book[] = [
  {
    id: "1",
    title: "The Quiet Tide",
    author: "Ela Marsh",
    cover: quietTide,
    pages: 320,
    progress: 184,
    mood: "calm",
    shelf: "reading",
    reactions: ["😌", "🥲"],
    addedAt: Date.now() - 86400000 * 4,
    tropes: ["Slow Burn", "Found Family", "Dual Timeline"],
  },
  {
    id: "2",
    title: "Letters to a Stranger",
    author: "Yuna Park",
    cover: letters,
    pages: 248,
    progress: 248,
    mood: "cozy",
    shelf: "finished",
    reactions: ["🥰", "😌", "😭"],
    addedAt: Date.now() - 86400000 * 30,
    tropes: ["Epistolary", "Slow Burn", "Friends to Lovers"],
  },
  {
    id: "3",
    title: "Hollow Year",
    author: "Dorian Vex",
    cover: hollow,
    pages: 412,
    progress: 0,
    mood: "intense",
    shelf: "want",
    reactions: [],
    addedAt: Date.now() - 86400000 * 2,
    tropes: ["Coming of Age", "Redemption Arc", "Political Intrigue"],
  },
];

// Heuristic series detection from a book title. Returns the series base name
// when the title contains an explicit series/volume marker, otherwise null.
// Examples it catches:
//   "Mistborn #2", "Mistborn (Book 2)", "Mistborn, Vol. 3",
//   "Harry Potter and the Chamber of Secrets" (split on " and the "),
//   "The Stormlight Archive: Words of Radiance"
export function detectSeriesName(title: string): string | null {
  if (!title) return null;
  const t = title.trim();
  // "Series #N" / "Series Book N" / "Series, Volume N"
  const numbered = t.match(
    /^(.+?)\s*[,:\-–—(]?\s*(?:#|book|vol\.?|volume|part|no\.?)\s*\d+/i
  );
  if (numbered?.[1]) return cleanSeries(numbered[1]);
  // "Series: Subtitle"
  const colon = t.match(/^(.+?):\s+\S+/);
  if (colon?.[1] && colon[1].split(" ").length <= 6) return cleanSeries(colon[1]);
  // "Series and the X" / "Series and X"
  const andThe = t.match(/^(.+?)\s+and\s+the\s+/i);
  if (andThe?.[1]) return cleanSeries(andThe[1]);
  return null;
}

function cleanSeries(s: string): string | null {
  const cleaned = s.replace(/[\s,:\-–—(]+$/g, "").trim();
  if (cleaned.length < 2 || cleaned.length > 60) return null;
  return cleaned;
}

export type ProfileData = Pick<
  State,
  | "books" | "currentId" | "journal" | "reactionLog" | "sessions"
  | "reflections" | "finishes" | "yearlyGoal" | "spoilerStrictness"
  | "hasOnboarded" | "hasSeenWalkthrough" | "moodPreferences" | "dailyGoalPages" | "dailyGoalMinutes" | "age"
  | "shelfTheme" | "privateLibrary" | "defaultShareVisibility"
  | "showBadgeFlair" | "customShelfNames" | "lifetimeEarned"
  | "lifetimeRewards" | "freeze" | "collections" | "markers" | "nextReadId" | "parentalPin"
  | "readingFontScale" | "readingDensity" | "companionFinishedToastsShown"
  | "lastChangelogReadAt"
>;

export const FRESH_PROFILE_STATE: ProfileData = {
  books: [],
  currentId: null,
  journal: [],
  reactionLog: [],
  sessions: [],
  reflections: [],
  finishes: [],
  yearlyGoal: 24,
  spoilerStrictness: "balanced",
  hasOnboarded: false,
  hasSeenWalkthrough: false,
  moodPreferences: null,
  dailyGoalPages: 20,
  dailyGoalMinutes: 30,
  age: null,
  shelfTheme: { background: "default", accent: "var(--mood-strong)", texture: "none" },
  privateLibrary: false,
  defaultShareVisibility: "public",
  showBadgeFlair: true,
  customShelfNames: {},
  lifetimeEarned: [],
  lifetimeRewards: [],
  freeze: { available: 1, lastEarnedWeek: "", consumedDays: [] },
  collections: [],
  markers: [],
  nextReadId: null,
  parentalPin: undefined,
  readingFontScale: 1,
  readingDensity: "default",
  companionFinishedToastsShown: [],
  lastChangelogReadAt: 0,
};

const debouncedStorage = (() => {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return {
    getItem: (key: string): string | null => {
      try { return localStorage.getItem(key); } catch { return null; }
    },
    setItem: (key: string, value: string): void => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        try { localStorage.setItem(key, value); } catch {}
      }, 400);
    },
    removeItem: (key: string): void => {
      try { localStorage.removeItem(key); } catch {}
    },
  };
})();

export const useLibrary = create<State>()(
  persist(
    (set) => ({
      books: seed,
      currentId: "1",
      journal: [],
      reactionLog: [],
      sessions: [],
      reflections: [],
      finishes: [],
      yearlyGoal: 24,
      spoilerStrictness: "balanced",
      hasOnboarded: false,
      hasSeenWalkthrough: false,
      moodPreferences: null,
      dailyGoalPages: 20,
      dailyGoalMinutes: 30,
      age: null,
      shelfTheme: { background: "default", accent: "var(--mood-strong)", texture: "none" },
      privateLibrary: false,
      defaultShareVisibility: "public",
      showBadgeFlair: true,
      customShelfNames: {},
      lifetimeEarned: [],
      lifetimeRewards: [],
      freeze: { available: 1, lastEarnedWeek: "", consumedDays: [] },
      collections: [],
      markers: [],
      nextReadId: null,
      readSnapshots: [],
      readingFontScale: 1,
      readingDensity: "default",
      companionFinishedToastsShown: [],
      lastChangelogReadAt: 0,
      bookcaseMode: false,
      bookcaseStyle: { shelf: "classic-wood" as const, spine: "colorful" as const },
      setReadingFontScale: (scale) =>
        set({ readingFontScale: Math.max(0.85, Math.min(1.25, scale)) }),
      setLastChangelogReadAt: (ts) => set({ lastChangelogReadAt: ts }),
      setReadingDensity: (readingDensity) => set({ readingDensity }),
      setParentalPin: (pin) => set({ parentalPin: pin }),
      setBookcaseMode: (bookcaseMode) => set({ bookcaseMode }),
      setBookcaseStyle: (s) =>
        set((prev) => ({ bookcaseStyle: { ...prev.bookcaseStyle, ...s } })),
      createCollection: (name, isSeries) => {
        const id = crypto.randomUUID();
        set((s) => ({
          collections: [
            ...s.collections,
            { id, name: name.trim() || "Untitled", isSeries: !!isSeries, bookIds: [], createdAt: Date.now() },
          ],
        }));
        return id;
      },
      renameCollection: (id, name) =>
        set((s) => ({
          collections: s.collections.map((c) => (c.id === id ? { ...c, name: name.trim() || c.name } : c)),
        })),
      deleteCollection: (id) =>
        set((s) => ({ collections: s.collections.filter((c) => c.id !== id) })),
      addToCollection: (id, bookId) =>
        set((s) => ({
          collections: s.collections.map((c) =>
            c.id === id && !c.bookIds.includes(bookId)
              ? { ...c, bookIds: [...c.bookIds, bookId] }
              : c
          ),
        })),
      removeFromCollection: (id, bookId) =>
        set((s) => ({
          collections: s.collections.map((c) =>
            c.id === id ? { ...c, bookIds: c.bookIds.filter((b) => b !== bookId) } : c
          ),
        })),
      reorderCollectionBooks: (id, bookIds) =>
        set((s) => ({
          collections: s.collections.map((c) => (c.id === id ? { ...c, bookIds } : c)),
        })),
      reconcileFreeze: () =>
        set((s) => ({ freeze: reconcileFreezes(s.sessions, s.freeze) })),
      autoTagReadingBooks: () =>
        set((s) => ({
          books: s.books.map((b) => {
            if (b.shelf !== "reading" || (b.tropes?.length ?? 0) > 0) return b;
            const suggested = suggestTropes(b.title, b.tags ?? [], b.mood);
            return suggested.length ? { ...b, tropes: suggested } : b;
          }),
        })),
      setCurrent: (id) => set({ currentId: id }),
      addBook: (b) => {
        const id = crypto.randomUUID();
        const autoTropes =
          b.shelf === "reading" && !(b.tropes?.length)
            ? suggestTropes(b.title, b.tags ?? [], b.mood)
            : (b.tropes ?? []);
        set((s) => ({
          books: [
            ...s.books,
            {
              ...b,
              id,
              addedAt: Date.now(),
              reactions: [],
              progress: b.progress ?? 0,
              tropes: autoTropes,
            },
          ],
        }));
        return id;
      },
      autoAssignSeries: (bookId) => {
        let result: { collectionId: string; seriesName: string } | null = null;
        set((s) => {
          const book = s.books.find((b) => b.id === bookId);
          if (!book) return s;
          // Prefer the explicit series field (from Open Library), fall back to title heuristic.
          const seriesName = (book.series?.trim()) || detectSeriesName(book.title);
          if (!seriesName) return s;
          const norm = (x: string) => x.trim().toLowerCase();
          const existing = s.collections.find(
            (c) => c.isSeries && norm(c.name) === norm(seriesName)
          );
          if (existing) {
            result = { collectionId: existing.id, seriesName };
            if (existing.bookIds.includes(bookId)) return s;
            return {
              collections: s.collections.map((c) =>
                c.id === existing.id ? { ...c, bookIds: [...c.bookIds, bookId] } : c
              ),
            };
          }
          const collectionId = crypto.randomUUID();
          result = { collectionId, seriesName };
          return {
            collections: [
              ...s.collections,
              {
                id: collectionId,
                name: seriesName,
                isSeries: true,
                bookIds: [bookId],
                createdAt: Date.now(),
              },
            ],
          };
        });
        return result;
      },
      updateProgress: (id, pages) => {
        let memoryRefresh:
          | { book: Book; currentPage: number; finished: boolean; finishedAt?: number }
          | null = null;
        set((s) => {
          let newFinish: FinishRecord | null = null;
          const books = s.books.map((b) => {
            if (b.id !== id) return b;
            const nextProgress = Math.max(0, Math.min(b.pages, pages));
            const justFinished =
              nextProgress >= b.pages && b.progress < b.pages && b.pages > 0;
            const crossedCheckpoint = (b.checkpoints ?? []).some(
              (c) => b.progress < c.page && nextProgress >= c.page
            );
            const updated: Book = {
              ...b,
              progress: nextProgress,
              shelf: nextProgress >= b.pages ? "finished" : b.shelf,
            };
            if (justFinished) {
              const finishedAt = Date.now();
              newFinish = {
                id: crypto.randomUUID(),
                bookId: b.id,
                finishedAt,
              };
              memoryRefresh = {
                book: updated,
                currentPage: nextProgress,
                finished: true,
                finishedAt,
              };
            } else if (crossedCheckpoint) {
              memoryRefresh = {
                book: updated,
                currentPage: nextProgress,
                finished: false,
              };
            }
            return updated;
          });
          return {
            books,
            finishes: newFinish ? [newFinish, ...s.finishes] : s.finishes,
          };
        });
        if (memoryRefresh) {
          const r = memoryRefresh as {
            book: Book;
            currentPage: number;
            finished: boolean;
            finishedAt?: number;
          };
          refreshCompanionMemory({
            book: { title: r.book.title, author: r.book.author },
            bookId: r.book.id,
            currentPage: r.currentPage,
            finished: r.finished,
            finishedAt: r.finishedAt,
          });
        }
      },
      updateBook: (id, patch) =>
        set((s) => ({
          books: s.books.map((b) => {
            if (b.id !== id) return b;
            const next = { ...b, ...patch };
            if (typeof patch.pages === "number" && patch.pages > 0) {
              next.pages = Math.max(1, Math.round(patch.pages));
              next.progress = Math.min(next.progress, next.pages);
            }
            if (typeof patch.audioMinutes === "number") {
              next.audioMinutes = Math.max(0, Math.round(patch.audioMinutes));
              if (typeof next.audioMinutesListened === "number") {
                next.audioMinutesListened = Math.min(
                  next.audioMinutesListened,
                  next.audioMinutes
                );
              }
            }
            if (patch.tags) {
              next.tags = Array.from(
                new Set(patch.tags.map((t) => t.trim().toLowerCase()).filter(Boolean))
              ).slice(0, 8);
            }
            return next;
          }),
        })),
      addReaction: (id, emoji) =>
        set((s) => ({
          books: s.books.map((b) => (b.id === id ? { ...b, reactions: [...b.reactions, emoji] } : b)),
          reactionLog: [...s.reactionLog, { emoji, bookId: id, at: Date.now() }],
        })),
      moveShelf: (id, shelf) => {
        let memoryBook: Book | null = null;
        const moveShelfFinishedAt = shelf === "finished" ? Date.now() : undefined;
        set((s) => ({
          books: s.books.map((b) => {
            if (b.id !== id) return b;
            const updated: Book = { ...b, shelf };
            if (shelf === "reading" && !(b.tropes?.length)) {
              const suggested = suggestTropes(b.title, b.tags ?? [], b.mood);
              if (suggested.length) updated.tropes = suggested;
            }
            if (shelf === "finished" && b.shelf !== "finished") {
              memoryBook = updated;
            }
            return updated;
          }),
        }));
        if (memoryBook) {
          const b = memoryBook as Book;
          refreshCompanionMemory({
            book: { title: b.title, author: b.author },
            bookId: b.id,
            currentPage: b.progress,
            finished: true,
            finishedAt: moveShelfFinishedAt,
          });
        }
      },
      removeBook: (id) => set((s) => ({ books: s.books.filter((b) => b.id !== id) })),
      addJournal: (e) =>
        set((s) => ({
          journal: [
            { ...e, id: crypto.randomUUID(), createdAt: Date.now() },
            ...s.journal,
          ],
        })),
      removeJournal: (id) => set((s) => ({ journal: s.journal.filter((j) => j.id !== id) })),
      reactToJournal: (id, emoji) =>
        set((s) => ({
          journal: s.journal.map((j) =>
            j.id === id ? { ...j, reactions: [...(j.reactions ?? []), emoji] } : j
          ),
        })),
      logSession: (entry) =>
        set((s) => ({
          sessions: [
            { ...entry, id: crypto.randomUUID(), at: Date.now() },
            ...s.sessions,
          ],
        })),
      saveReflection: (r) =>
        set((s) => ({
          reflections: [
            { ...r, id: crypto.randomUUID(), createdAt: Date.now() },
            ...s.reflections.filter((x) => x.bookId !== r.bookId),
          ],
        })),
      addCheckpoint: (bookId, page, label) =>
        set((s) => ({
          books: s.books.map((b) =>
            b.id === bookId
              ? {
                  ...b,
                  checkpoints: [
                    ...(b.checkpoints ?? []),
                    { id: crypto.randomUUID(), page: Math.max(1, Math.min(b.pages, page)), label: label.trim() || `Page ${page}` },
                  ].sort((a, z) => a.page - z.page),
                }
              : b
          ),
        })),
      removeCheckpoint: (bookId, checkpointId) =>
        set((s) => ({
          books: s.books.map((b) =>
            b.id === bookId
              ? { ...b, checkpoints: (b.checkpoints ?? []).filter((c) => c.id !== checkpointId) }
              : b
          ),
        })),
      setBookTags: (bookId, tags) =>
        set((s) => ({
          books: s.books.map((b) =>
            b.id === bookId
              ? {
                  ...b,
                  tags: Array.from(
                    new Set(
                      tags
                        .map((t) => t.trim().toLowerCase())
                        .filter((t) => t.length > 0 && t.length < 30)
                    )
                  ).slice(0, 8),
                }
              : b
          ),
        })),
      setSpoilerStrictness: (spoilerStrictness) => set({ spoilerStrictness }),
      completeOnboarding: (prefs) =>
        set({
          hasOnboarded: true,
          moodPreferences: prefs,
          spoilerStrictness: prefs.spoilerStrictness,
          age: prefs.age ?? null,
        }),
      resetOnboarding: () => set({ hasOnboarded: false, moodPreferences: null, hasSeenWalkthrough: false }),
      setHasSeenWalkthrough: (v) => set({ hasSeenWalkthrough: v }),
      setDailyGoal: (dailyGoalPages) =>
        set({ dailyGoalPages: Math.max(1, Math.min(500, Math.round(dailyGoalPages))) }),
      setDailyGoalMinutes: (dailyGoalMinutes) =>
        set({ dailyGoalMinutes: Math.max(0, Math.min(480, Math.round(dailyGoalMinutes))) }),
      setYearlyGoal: (yearlyGoal) =>
        set({ yearlyGoal: Math.max(1, Math.min(500, Math.round(yearlyGoal))) }),
      startReread: (bookId) =>
        set((s) => {
          const book = s.books.find((b) => b.id === bookId);
          if (!book) return {};
          const reflection = s.reflections.find((r) => r.bookId === bookId);
          const readIndex = book.rereadCount ?? 0;
          const snapshot: ReadSnapshot = {
            id: crypto.randomUUID(),
            bookId,
            readIndex,
            finishedAt: Date.now(),
            arc: reflection?.arc ?? { start: book.mood, middle: book.mood, end: book.mood },
            rating: reflection?.rating ?? 0,
            tropes: book.tropes ?? [],
          };
          return {
            readSnapshots: [...s.readSnapshots, snapshot],
            books: s.books.map((b) =>
              b.id === bookId
                ? { ...b, progress: 0, shelf: "reading", rereadCount: (b.rereadCount ?? 0) + 1 }
                : b
            ),
          };
        }),
      saveRereadSnapshot: (bookId, note) =>
        set((s) => {
          const book = s.books.find((b) => b.id === bookId);
          const reflection = s.reflections.find((r) => r.bookId === bookId);
          if (!book || !reflection) return {};
          const readIndex = book.rereadCount ?? 0;
          const already = s.readSnapshots.find(
            (sn) => sn.bookId === bookId && sn.readIndex === readIndex
          );
          if (already) {
            return {
              readSnapshots: s.readSnapshots.map((sn) =>
                sn.bookId === bookId && sn.readIndex === readIndex ? { ...sn, note } : sn
              ),
            };
          }
          return {
            readSnapshots: [
              ...s.readSnapshots,
              {
                id: crypto.randomUUID(),
                bookId,
                readIndex,
                finishedAt: Date.now(),
                arc: reflection.arc,
                rating: reflection.rating,
                tropes: book.tropes ?? [],
                note,
              },
            ],
          };
        }),
      annotateReadSnapshot: (bookId, readIndex, note) =>
        set((s) => ({
          readSnapshots: s.readSnapshots.map((sn) =>
            sn.bookId === bookId && sn.readIndex === readIndex ? { ...sn, note } : sn
          ),
        })),
      setAge: (age) => set({ age }),
      setShelfTheme: (shelfTheme) => set({ shelfTheme }),
      setPrivateLibrary: (privateLibrary) => set({ privateLibrary }),
      setDefaultShareVisibility: (defaultShareVisibility) => set({ defaultShareVisibility }),
      setShowBadgeFlair: (showBadgeFlair) => set({ showBadgeFlair }),
      setCustomShelfName: (shelf, name) =>
        set((s) => {
          const next = { ...s.customShelfNames };
          if (name.trim()) next[shelf] = name.trim();
          else delete next[shelf];
          return { customShelfNames: next };
        }),
      toggleFavorite: (bookId) =>
        set((s) => {
          const book = s.books.find((b) => b.id === bookId);
          if (!book) return s;
          const next = !book.favorite;
          const books = s.books.map((b) =>
            b.id === bookId ? { ...b, favorite: next } : b
          );
          // Maintain a single auto-managed "Favorites" collection.
          let collections = s.collections;
          let fav = collections.find((c) => c.name === "Favorites");
          if (next) {
            if (!fav) {
              fav = {
                id: crypto.randomUUID(),
                name: "Favorites",
                isSeries: false,
                bookIds: [bookId],
                createdAt: Date.now(),
              };
              collections = [...collections, fav];
            } else if (!fav.bookIds.includes(bookId)) {
              collections = collections.map((c) =>
                c.id === fav!.id ? { ...c, bookIds: [...c.bookIds, bookId] } : c
              );
            }
          } else if (fav) {
            collections = collections.map((c) =>
              c.id === fav!.id ? { ...c, bookIds: c.bookIds.filter((id) => id !== bookId) } : c
            );
          }
          return { books, collections };
        }),
      recordLifetimeEarned: (ids) =>
        set((s) => {
          const merged = Array.from(new Set([...s.lifetimeEarned, ...ids]));
          if (merged.length === s.lifetimeEarned.length) return s;
          return { lifetimeEarned: merged };
        }),
      claimLifetimeReward: (id) =>
        set((s) =>
          s.lifetimeRewards.includes(id)
            ? s
            : { lifetimeRewards: [...s.lifetimeRewards, id] }
        ),
      markCompanionFinishedToastShown: (key) =>
        set((s) => {
          if (s.companionFinishedToastsShown.includes(key)) return s;
          return { companionFinishedToastsShown: [...s.companionFinishedToastsShown, key] };
        }),
      addMarker: (entry) =>
        set((s) => ({
          markers: [
            { ...entry, id: crypto.randomUUID(), at: Date.now() },
            ...s.markers,
          ],
        })),
      removeMarker: (id) =>
        set((s) => ({ markers: s.markers.filter((m) => m.id !== id) })),
      setNextRead: (id) => set({ nextReadId: id }),
      setBookPriority: (id, priority) =>
        set((s) => ({
          books: s.books.map((b) => (b.id === id ? { ...b, priority } : b)),
        })),
      updateAudioProgress: (id, minutes) => {
        let memoryRefresh: { book: Book; finishedAt?: number } | null = null;
        set((s) => {
          let newFinish: FinishRecord | null = null;
          const books = s.books.map((b) => {
            if (b.id !== id) return b;
            const next = Math.max(0, Math.round(minutes));
            const total = b.audioMinutes ?? 0;
            const prev = b.audioMinutesListened ?? 0;
            const justFinished =
              total > 0 && next >= total && prev < total && b.shelf !== "finished";
            const updated: Book = {
              ...b,
              audioMinutesListened: next,
              shelf: justFinished ? "finished" : b.shelf,
            };
            if (justFinished) {
              const finishedAt = Date.now();
              memoryRefresh = { book: updated, finishedAt };
              newFinish = {
                id: crypto.randomUUID(),
                bookId: b.id,
                finishedAt,
              };
            }
            return updated;
          });
          return {
            books,
            finishes: newFinish ? [newFinish, ...s.finishes] : s.finishes,
          };
        });
        if (memoryRefresh) {
          const r = memoryRefresh as { book: Book; finishedAt?: number };
          refreshCompanionMemory({
            book: { title: r.book.title, author: r.book.author },
            bookId: r.book.id,
            currentPage: r.book.progress,
            finished: true,
            finishedAt: r.finishedAt,
          });
        }
      },
      restoreFromExport: (data) =>
        set(() => ({
          books: data.books,
          journal: data.journal,
          sessions: data.sessions,
          reactionLog: data.reactionLog,
          reflections: data.reflections,
        })),
      applyRemoteSnapshot: (data) =>
        set((s) => ({
          books: data.books ?? s.books,
          currentId: data.currentId ?? s.currentId,
          journal: data.journal ?? s.journal,
          reactionLog: data.reactionLog ?? s.reactionLog,
          sessions: data.sessions ?? s.sessions,
          reflections: data.reflections ?? s.reflections,
          finishes: data.finishes ?? s.finishes,
          yearlyGoal: data.yearlyGoal ?? s.yearlyGoal,
          spoilerStrictness: data.spoilerStrictness ?? s.spoilerStrictness,
          hasOnboarded: data.hasOnboarded ?? s.hasOnboarded,
          hasSeenWalkthrough: data.hasSeenWalkthrough ?? s.hasSeenWalkthrough,
          moodPreferences: data.moodPreferences ?? s.moodPreferences,
          dailyGoalPages: data.dailyGoalPages ?? s.dailyGoalPages,
          dailyGoalMinutes: data.dailyGoalMinutes ?? s.dailyGoalMinutes,
          age: data.age ?? s.age,
          shelfTheme: data.shelfTheme ?? s.shelfTheme,
          privateLibrary: data.privateLibrary ?? s.privateLibrary,
          defaultShareVisibility: data.defaultShareVisibility ?? s.defaultShareVisibility,
          showBadgeFlair: data.showBadgeFlair ?? s.showBadgeFlair,
          customShelfNames: data.customShelfNames ?? s.customShelfNames,
          lifetimeEarned: data.lifetimeEarned ?? s.lifetimeEarned,
          lifetimeRewards: data.lifetimeRewards ?? s.lifetimeRewards,
          freeze: data.freeze ?? s.freeze,
          collections: data.collections ?? s.collections,
          markers: data.markers ?? s.markers,
          nextReadId: data.nextReadId ?? s.nextReadId,
          parentalPin: data.parentalPin ?? s.parentalPin,
          readingFontScale: data.readingFontScale ?? s.readingFontScale,
          readingDensity: data.readingDensity ?? s.readingDensity,
          readSnapshots: data.readSnapshots ?? s.readSnapshots,
          companionFinishedToastsShown: data.companionFinishedToastsShown ?? s.companionFinishedToastsShown,
          lastChangelogReadAt: data.lastChangelogReadAt ?? s.lastChangelogReadAt,
        })),
      mergeFromExport: (data) => {
        let addedBooks = 0;
        let addedJournal = 0;
        set((s) => {
          const existingBookIds = new Set(s.books.map((b) => b.id));
          const newBooks = data.books.filter((b) => !existingBookIds.has(b.id));
          addedBooks = newBooks.length;
          const existingJournalIds = new Set(s.journal.map((j) => j.id));
          const newJournal = (data.journal ?? []).filter((j) => !existingJournalIds.has(j.id));
          addedJournal = newJournal.length;
          const existingSessionIds = new Set(s.sessions.map((ss) => ss.id));
          const newSessions = (data.sessions ?? []).filter((ss) => !existingSessionIds.has(ss.id));
          const existingReflectionIds = new Set(s.reflections.map((r) => r.id));
          const newReflections = (data.reflections ?? []).filter((r) => !existingReflectionIds.has(r.id));
          return {
            books: [...s.books, ...newBooks],
            journal: [...s.journal, ...newJournal],
            sessions: [...s.sessions, ...newSessions],
            reflections: [...s.reflections, ...newReflections],
          };
        });
        return { addedBooks, addedJournal };
      },
      applyImportedData: (data) => {
        let addedBooks = 0;
        let updatedBooks = 0;
        let addedFinishes = 0;
        let addedJournal = 0;
        set((s) => {
          // Add new books (won't conflict with existing by id)
          const existingIds = new Set(s.books.map((b) => b.id));
          const trulyNew = data.newBooks.filter((b) => !existingIds.has(b.id));
          addedBooks = trulyNew.length;

          // Apply shelf/progress upgrades to matched books — never overwrite mood/tropes/notes
          const updatesById = new Map(
            data.shelfUpdates.map((u) => [u.existingId, u])
          );
          let updCount = 0;
          const updatedBooksList = s.books.map((b) => {
            const u = updatesById.get(b.id);
            if (!u) return b;
            updCount++;
            return {
              ...b,
              shelf: u.toShelf,
              progress: Math.max(b.progress, u.toProgress),
            };
          });
          updatedBooks = updCount;

          // Merge finish records — skip if a record for that bookId already exists
          const booksWithFinish = new Set(s.finishes.map((f) => f.bookId));
          const existingFinishIds = new Set(s.finishes.map((f) => f.id));
          const uniqueNewFinishes = (data.newFinishes ?? []).filter(
            (f) => !existingFinishIds.has(f.id) && !booksWithFinish.has(f.bookId)
          );
          addedFinishes = uniqueNewFinishes.length;

          // Build remap: imported book id → existing store id (for title+author matches)
          const importedToExistingId = new Map(
            data.shelfUpdates.map((u) => [u.importedId, u.existingId])
          );
          // Also map new books to themselves so all bookIds are resolved
          for (const b of trulyNew) importedToExistingId.set(b.id, b.id);
          const remapBookId = (id: string) => importedToExistingId.get(id) ?? id;
          // Determine valid resolved ids (existing + newly added)
          const validBookIds = new Set([
            ...s.books.map((b) => b.id),
            ...trulyNew.map((b) => b.id),
          ]);
          const resolveId = (id: string) => {
            const resolved = remapBookId(id);
            return validBookIds.has(resolved) ? resolved : null;
          };

          // Merge journal entries — remap bookId, skip orphans
          const existingJournalIds = new Set(s.journal.map((j) => j.id));
          const newJournal = (data.journal ?? [])
            .filter((j) => !existingJournalIds.has(j.id))
            .map((j) => ({ ...j, bookId: resolveId(j.bookId) ?? j.bookId }))
            .filter((j) => validBookIds.has(j.bookId));
          addedJournal = newJournal.length;

          // Merge sessions — remap bookId, skip orphans
          const existingSessionIds = new Set(s.sessions.map((ss) => ss.id));
          const newSessions = (data.sessions ?? [])
            .filter((ss) => !existingSessionIds.has(ss.id))
            .map((ss) => ({ ...ss, bookId: resolveId(ss.bookId) ?? ss.bookId }))
            .filter((ss) => validBookIds.has(ss.bookId));

          // Merge reflections — remap bookId, skip orphans
          const existingReflectionIds = new Set(s.reflections.map((r) => r.id));
          const newReflections = (data.reflections ?? [])
            .filter((r) => !existingReflectionIds.has(r.id))
            .map((r) => ({ ...r, bookId: resolveId(r.bookId) ?? r.bookId }))
            .filter((r) => validBookIds.has(r.bookId));

          // Merge reactionLog — remap bookId, dedupe by (emoji, bookId, at)
          const seenReactions = new Set(
            s.reactionLog.map((r) => `${r.emoji}::${r.bookId}::${r.at}`)
          );
          const newReactions = (data.reactionLog ?? [])
            .map((r) => ({ ...r, bookId: resolveId(r.bookId) ?? r.bookId }))
            .filter(
              (r) =>
                validBookIds.has(r.bookId) &&
                !seenReactions.has(`${r.emoji}::${r.bookId}::${r.at}`)
            );

          return {
            books: [...updatedBooksList, ...trulyNew],
            finishes: [...s.finishes, ...uniqueNewFinishes],
            journal: [...s.journal, ...newJournal],
            sessions: [...s.sessions, ...newSessions],
            reflections: [...s.reflections, ...newReflections],
            reactionLog: [...s.reactionLog, ...newReactions],
          };
        });
        return { addedBooks, updatedBooks, addedFinishes, addedJournal };
      },
    }),
    { name: "moodread-library-v4", storage: createJSONStorage(() => debouncedStorage) }
  )
);
