import { create } from "zustand";
import { persist } from "zustand/middleware";
import { MoodKey, ReactionEmoji } from "./moods";
import { reconcileFreezes, type FreezeState } from "./streak";
import quietTide from "@/assets/book-quiet-tide.jpg";
import letters from "@/assets/book-letters.jpg";
import hollow from "@/assets/book-hollow.jpg";

export type Shelf = "reading" | "want" | "finished" | "dnf" | "paused";

export type JournalEntry = {
  id: string;
  bookId: string;
  kind: "note" | "quote" | "reflection";
  text: string;
  page?: number;
  mood?: MoodKey;
  createdAt: number;
  reactions?: ReactionEmoji[];
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

export type Book = {
  id: string;
  title: string;
  author: string;
  translator?: string;
  cover?: string;
  pages: number;
  progress: number; // pages read
  mood: MoodKey;
  shelf: Shelf;
  reactions: ReactionEmoji[];
  addedAt: number;
  checkpoints?: Checkpoint[];
  tags?: string[]; // genres / themes
  rereadCount?: number;
  priority?: number; // TBR ordering — lower = higher priority
  format?: "paperback" | "hardcover" | "ebook" | "audiobook";
  audioMinutes?: number; // total minutes for audiobooks
  audioMinutesListened?: number;
  favorite?: boolean;
  // How the user experienced this book — independent of physical format.
  consumption?: "read" | "listened";
};

export type Checkpoint = {
  id: string;
  page: number;
  label: string;
};

export type SpoilerStrictness = "relaxed" | "balanced" | "strict";

export type MoodPreferences = {
  favorites: MoodKey[]; // moods user gravitates toward
  avoid: MoodKey[];     // moods user wants less of
  pace: "slow" | "medium" | "fast";
  spoilerStrictness: SpoilerStrictness;
  age?: number;
};

export type ShelfTheme = {
  background: string; // tailwind/bg or css color
  accent: string;     // accent color (HSL string)
  texture: "none" | "linen" | "paper" | "wood" | "velvet";
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
  moodPreferences: MoodPreferences | null;
  dailyGoalPages: number;
  age: number | null;
  shelfTheme: ShelfTheme;
  privateLibrary: boolean;
  defaultShareVisibility: "public" | "followers" | "private";
  showBadgeFlair: boolean;
  lifetimeEarned: string[]; // permanently-earned badge ids (lifetime mode)
  lifetimeRewards: string[]; // claimed lifetime reward badge ids
  freeze: FreezeState;
  collections: Collection[];
  createCollection: (name: string, isSeries?: boolean) => string;
  renameCollection: (id: string, name: string) => void;
  deleteCollection: (id: string) => void;
  addToCollection: (id: string, bookId: string) => void;
  removeFromCollection: (id: string, bookId: string) => void;
  reorderCollectionBooks: (id: string, bookIds: string[]) => void;
  reconcileFreeze: () => void;
  autoAssignSeries: (bookId: string) => { collectionId: string; seriesName: string } | null;
  setCurrent: (id: string) => void;
  addBook: (b: Omit<Book, "id" | "addedAt" | "reactions" | "progress"> & { progress?: number }) => string;
  updateProgress: (id: string, pages: number) => void;
  updateBook: (id: string, patch: Partial<Pick<Book, "title" | "author" | "translator" | "pages" | "mood" | "cover" | "tags" | "consumption" | "audioMinutes">>) => void;
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
  setDailyGoal: (pages: number) => void;
  setYearlyGoal: (count: number) => void;
  startReread: (bookId: string) => void;
  setAge: (age: number | null) => void;
  setShelfTheme: (t: ShelfTheme) => void;
  setPrivateLibrary: (v: boolean) => void;
  setDefaultShareVisibility: (v: "public" | "followers" | "private") => void;
  setShowBadgeFlair: (v: boolean) => void;
  toggleFavorite: (bookId: string) => void;
  recordLifetimeEarned: (ids: string[]) => void;
  claimLifetimeReward: (id: string) => void;
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
      moodPreferences: null,
      dailyGoalPages: 20,
      age: null,
      shelfTheme: { background: "default", accent: "var(--mood-strong)", texture: "none" },
      privateLibrary: false,
      defaultShareVisibility: "public",
      showBadgeFlair: true,
      lifetimeEarned: [],
      lifetimeRewards: [],
      freeze: { available: 1, lastEarnedWeek: "", consumedDays: [] },
      collections: [],
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
      setCurrent: (id) => set({ currentId: id }),
      addBook: (b) => {
        const id = crypto.randomUUID();
        set((s) => ({
          books: [
            ...s.books,
            {
              ...b,
              id,
              addedAt: Date.now(),
              reactions: [],
              progress: b.progress ?? 0,
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
          const seriesName = detectSeriesName(book.title);
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
      updateProgress: (id, pages) =>
        set((s) => {
          let newFinish: FinishRecord | null = null;
          const books = s.books.map((b) => {
            if (b.id !== id) return b;
            const nextProgress = Math.max(0, Math.min(b.pages, pages));
            const justFinished =
              nextProgress >= b.pages && b.progress < b.pages && b.pages > 0;
            if (justFinished) {
              newFinish = {
                id: crypto.randomUUID(),
                bookId: b.id,
                finishedAt: Date.now(),
              };
            }
            return {
              ...b,
              progress: nextProgress,
              shelf: nextProgress >= b.pages ? "finished" : b.shelf,
            };
          });
          return {
            books,
            finishes: newFinish ? [newFinish, ...s.finishes] : s.finishes,
          };
        }),
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
      moveShelf: (id, shelf) =>
        set((s) => ({ books: s.books.map((b) => (b.id === id ? { ...b, shelf } : b)) })),
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
      resetOnboarding: () => set({ hasOnboarded: false, moodPreferences: null }),
      setDailyGoal: (dailyGoalPages) =>
        set({ dailyGoalPages: Math.max(1, Math.min(500, Math.round(dailyGoalPages))) }),
      setYearlyGoal: (yearlyGoal) =>
        set({ yearlyGoal: Math.max(1, Math.min(500, Math.round(yearlyGoal))) }),
      startReread: (bookId) =>
        set((s) => ({
          books: s.books.map((b) =>
            b.id === bookId
              ? {
                  ...b,
                  progress: 0,
                  shelf: "reading",
                  rereadCount: (b.rereadCount ?? 0) + 1,
                }
              : b
          ),
        })),
      setAge: (age) => set({ age }),
      setShelfTheme: (shelfTheme) => set({ shelfTheme }),
      setPrivateLibrary: (privateLibrary) => set({ privateLibrary }),
      setDefaultShareVisibility: (defaultShareVisibility) => set({ defaultShareVisibility }),
      setShowBadgeFlair: (showBadgeFlair) => set({ showBadgeFlair }),
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
      setBookPriority: (id, priority) =>
        set((s) => ({
          books: s.books.map((b) => (b.id === id ? { ...b, priority } : b)),
        })),
      updateAudioProgress: (id, minutes) =>
        set((s) => ({
          books: s.books.map((b) =>
            b.id === id ? { ...b, audioMinutesListened: Math.max(0, Math.round(minutes)) } : b
          ),
        })),
    }),
    { name: "moodread-library-v4" }
  )
);
