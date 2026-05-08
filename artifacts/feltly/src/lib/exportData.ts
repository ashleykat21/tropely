import type {
  Book,
  JournalEntry,
  ReactionLog,
  SessionLog,
  Reflection,
  Shelf,
  FinishRecord,
  Collection,
  PageMarker,
  ReadSnapshot,
  MoodPreferences,
  SpoilerStrictness,
  ShelfTheme,
} from "@/lib/store";

export type ExportPayload = {
  feltlyExportVersion: 1;
  exportedAt: string;
  books: Book[];
  currentId?: string | null;
  journal: JournalEntry[];
  sessions: SessionLog[];
  reactionLog: ReactionLog[];
  reflections: Reflection[];
  finishes: FinishRecord[];
  collections?: Collection[];
  markers?: PageMarker[];
  readSnapshots?: ReadSnapshot[];
  yearlyGoal?: number;
  dailyGoalPages?: number;
  dailyGoalMinutes?: number;
  moodPreferences?: MoodPreferences | null;
  spoilerStrictness?: SpoilerStrictness;
  shelfTheme?: ShelfTheme;
  privateLibrary?: boolean;
  defaultShareVisibility?: "public" | "followers" | "private";
  showBadgeFlair?: boolean;
  customShelfNames?: Partial<Record<Shelf, string>>;
  lifetimeEarned?: string[];
  lifetimeRewards?: string[];
  readingFontScale?: number;
  readingDensity?: "compact" | "default" | "comfortable";
  hasOnboarded?: boolean;
  hasSeenWalkthrough?: boolean;
  age?: number | null;
  freeze?: unknown;
  nextReadId?: string | null;
  parentalPin?: string;
};

export function buildExportPayload(s: {
  books: Book[];
  currentId: string | null;
  journal: JournalEntry[];
  sessions: SessionLog[];
  reactionLog: ReactionLog[];
  reflections: Reflection[];
  finishes: FinishRecord[];
  collections: Collection[];
  markers: PageMarker[];
  readSnapshots: ReadSnapshot[];
  yearlyGoal: number;
  dailyGoalPages: number;
  dailyGoalMinutes: number;
  moodPreferences: MoodPreferences | null;
  spoilerStrictness: SpoilerStrictness;
  shelfTheme: ShelfTheme;
  privateLibrary: boolean;
  defaultShareVisibility: "public" | "followers" | "private";
  showBadgeFlair: boolean;
  customShelfNames: Partial<Record<Shelf, string>>;
  lifetimeEarned: string[];
  lifetimeRewards: string[];
  readingFontScale: number;
  readingDensity: "compact" | "default" | "comfortable";
  hasOnboarded: boolean;
  hasSeenWalkthrough: boolean;
  age: number | null;
  freeze: unknown;
  nextReadId: string | null;
  parentalPin?: string;
}): ExportPayload {
  return {
    feltlyExportVersion: 1,
    exportedAt: new Date().toISOString(),
    books: s.books,
    currentId: s.currentId,
    journal: s.journal,
    sessions: s.sessions,
    reactionLog: s.reactionLog,
    reflections: s.reflections,
    finishes: s.finishes,
    collections: s.collections,
    markers: s.markers,
    readSnapshots: s.readSnapshots,
    yearlyGoal: s.yearlyGoal,
    dailyGoalPages: s.dailyGoalPages,
    dailyGoalMinutes: s.dailyGoalMinutes,
    moodPreferences: s.moodPreferences,
    spoilerStrictness: s.spoilerStrictness,
    shelfTheme: s.shelfTheme,
    privateLibrary: s.privateLibrary,
    defaultShareVisibility: s.defaultShareVisibility,
    showBadgeFlair: s.showBadgeFlair,
    customShelfNames: s.customShelfNames,
    lifetimeEarned: s.lifetimeEarned,
    lifetimeRewards: s.lifetimeRewards,
    readingFontScale: s.readingFontScale,
    readingDensity: s.readingDensity,
    hasOnboarded: s.hasOnboarded,
    hasSeenWalkthrough: s.hasSeenWalkthrough,
    age: s.age,
    freeze: s.freeze,
    nextReadId: s.nextReadId,
    parentalPin: s.parentalPin,
  };
}

export type ImportFormat = "feltly" | "goodreads" | "storygraph";

export type ImportPayload = {
  format: ImportFormat;
  books: Book[];
  finishes: FinishRecord[];
  journal: JournalEntry[];
  sessions: SessionLog[];
  reactionLog: ReactionLog[];
  reflections: Reflection[];
};

export type ImportDiff = {
  newBooks: Book[];
  updatableBooks: Array<{
    importedBook: Book;
    existingId: string;
    toShelf: Shelf;
    toProgress: number;
    importedFinishedAt?: number;
  }>;
  alreadyCurrent: Book[];
  skippedCount: number;
};

function normalizeKey(title: string, author: string) {
  return `${title.toLowerCase().trim()}||${author.toLowerCase().trim()}`;
}

const SHELF_PRIORITY: Record<Shelf, number> = {
  want: 0,
  dnf: 1,
  paused: 2,
  reading: 3,
  finished: 4,
};

export function computeImportDiff(
  payload: ImportPayload,
  existingBooks: Book[],
  existingFinishes: FinishRecord[]
): ImportDiff {
  const existingByKey = new Map<string, Book>();
  for (const b of existingBooks) {
    existingByKey.set(normalizeKey(b.title, b.author), b);
  }
  const booksWithFinishRecord = new Set(existingFinishes.map((f) => f.bookId));

  const newBooks: Book[] = [];
  const updatableBooks: ImportDiff["updatableBooks"] = [];
  const alreadyCurrent: Book[] = [];
  let skippedCount = 0;

  for (const imported of payload.books) {
    if (!imported.title?.trim()) { skippedCount++; continue; }
    const key = normalizeKey(imported.title, imported.author);
    const existing = existingByKey.get(key);
    if (!existing) {
      newBooks.push(imported);
    } else {
      const importedPriority = SHELF_PRIORITY[imported.shelf] ?? 0;
      const existingPriority = SHELF_PRIORITY[existing.shelf] ?? 0;
      const shelfNeedsUpgrade = importedPriority > existingPriority;
      const importedFinish = payload.finishes.find(
        (f) => f.bookId === imported.id
      );
      const finishNeedsAdding =
        !!importedFinish && !booksWithFinishRecord.has(existing.id);

      if (shelfNeedsUpgrade || finishNeedsAdding) {
        const toShelf = shelfNeedsUpgrade ? imported.shelf : existing.shelf;
        const toProgress =
          toShelf === "finished"
            ? Math.max(existing.progress, existing.pages)
            : existing.progress;
        updatableBooks.push({
          importedBook: imported,
          existingId: existing.id,
          toShelf,
          toProgress,
          importedFinishedAt: finishNeedsAdding
            ? importedFinish!.finishedAt
            : undefined,
        });
      } else {
        alreadyCurrent.push(imported);
      }
    }
  }

  return { newBooks, updatableBooks, alreadyCurrent, skippedCount };
}

function parseCSVLines(text: string): string[][] {
  const results: string[][] = [];
  let current: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 2; continue; }
        inQuotes = false;
      } else {
        field += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        current.push(field);
        field = "";
      } else if (ch === '\r' && text[i + 1] === '\n') {
        current.push(field);
        field = "";
        if (current.length > 0) results.push(current);
        current = [];
        i += 2;
        continue;
      } else if (ch === '\n' || ch === '\r') {
        current.push(field);
        field = "";
        if (current.length > 0) results.push(current);
        current = [];
      } else {
        field += ch;
      }
    }
    i++;
  }
  current.push(field);
  if (current.some((f) => f.length > 0)) results.push(current);
  return results;
}

function normalizeGoodreadsShelf(raw: string): Shelf {
  const s = raw.toLowerCase().trim();
  if (s === "read") return "finished";
  if (s === "currently-reading") return "reading";
  if (s === "to-read") return "want";
  return "want";
}

function normalizeStoryGraphShelf(raw: string): Shelf {
  const s = raw.toLowerCase().trim();
  if (s === "read") return "finished";
  if (s === "currently-reading") return "reading";
  if (s === "to-read") return "want";
  if (s === "did-not-finish") return "dnf";
  if (s === "paused") return "paused";
  return "want";
}

function safeDateMs(raw: string | undefined): number | undefined {
  if (!raw || !raw.trim()) return undefined;
  const d = new Date(raw.trim());
  return isNaN(d.getTime()) ? undefined : d.getTime();
}

export function parseGoodreadsCSV(text: string): ImportPayload {
  const lines = parseCSVLines(text);
  if (lines.length < 2) throw new Error("No rows found in this CSV.");
  const headers = lines[0].map((h) => h.toLowerCase().trim());
  const col = (name: string) => headers.indexOf(name);
  const titleIdx = col("title");
  const authorIdx = col("author");
  const pagesIdx = col("number of pages");
  const shelfIdx = col("exclusive shelf");
  const dateReadIdx = col("date read");
  const dateAddedIdx = col("date added");
  if (titleIdx === -1) {
    throw new Error("This doesn't look like a Goodreads export — missing the 'Title' column.");
  }
  if (shelfIdx === -1) {
    throw new Error("This doesn't look like a Goodreads export — missing the 'Exclusive Shelf' column.");
  }
  const books: Book[] = [];
  const finishes: FinishRecord[] = [];
  for (const row of lines.slice(1)) {
    const title = row[titleIdx]?.trim();
    if (!title) continue;
    const pages = parseInt(row[pagesIdx] ?? "0", 10) || 280;
    const shelf = normalizeGoodreadsShelf(row[shelfIdx] ?? "to-read");
    const addedAtMs = safeDateMs(row[dateAddedIdx]) ?? Date.now();
    const finishedAtMs = safeDateMs(row[dateReadIdx]);
    const id = crypto.randomUUID();
    books.push({
      id,
      title,
      author: row[authorIdx]?.trim() || "Unknown",
      pages,
      progress: shelf === "finished" ? pages : 0,
      mood: "calm",
      shelf,
      reactions: [],
      addedAt: addedAtMs,
    });
    if (shelf === "finished" && finishedAtMs) {
      finishes.push({
        id: crypto.randomUUID(),
        bookId: id,
        finishedAt: finishedAtMs,
      });
    }
  }
  return { format: "goodreads", books, finishes, journal: [], sessions: [], reactionLog: [], reflections: [] };
}

export function parseStoryGraphCSV(text: string): ImportPayload {
  const lines = parseCSVLines(text);
  if (lines.length < 2) throw new Error("No rows found in this CSV.");
  const headers = lines[0].map((h) => h.toLowerCase().trim());
  const col = (name: string) => headers.indexOf(name);
  const titleIdx = col("title");
  const authorsIdx = col("authors");
  const pagesIdx = col("number of pages");
  const statusIdx = col("read status");
  const dateReadIdx = col("date read");
  const tagsIdx = col("tags");
  if (titleIdx === -1) {
    throw new Error("This doesn't look like a StoryGraph export — missing the 'Title' column.");
  }
  if (statusIdx === -1) {
    throw new Error("This doesn't look like a StoryGraph export — missing the 'Read Status' column.");
  }
  const books: Book[] = [];
  const finishes: FinishRecord[] = [];
  for (const row of lines.slice(1)) {
    const title = row[titleIdx]?.trim();
    if (!title) continue;
    const pages = parseInt(row[pagesIdx] ?? "0", 10) || 280;
    const shelf = normalizeStoryGraphShelf(row[statusIdx] ?? "to-read");
    const rawTags = row[tagsIdx]?.trim() ?? "";
    const tags = rawTags ? rawTags.split("|").map((t) => t.trim()).filter(Boolean) : undefined;
    const finishedAtMs = safeDateMs(row[dateReadIdx]);
    const id = crypto.randomUUID();
    books.push({
      id,
      title,
      author: row[authorsIdx]?.trim() || "Unknown",
      pages,
      progress: shelf === "finished" ? pages : 0,
      mood: "calm",
      shelf,
      reactions: [],
      addedAt: Date.now(),
      tags: tags?.length ? tags : undefined,
    });
    if (shelf === "finished" && finishedAtMs) {
      finishes.push({
        id: crypto.randomUUID(),
        bookId: id,
        finishedAt: finishedAtMs,
      });
    }
  }
  return { format: "storygraph", books, finishes, journal: [], sessions: [], reactionLog: [], reflections: [] };
}

export function detectFormat(text: string, filename: string): "json" | "goodreads-csv" | "storygraph-csv" {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".json")) return "json";
  if (lower.endsWith(".csv")) {
    const firstLine = text.slice(0, 600).toLowerCase();
    if (firstLine.includes("exclusive shelf")) return "goodreads-csv";
    if (firstLine.includes("read status") && firstLine.includes("authors")) return "storygraph-csv";
    if (firstLine.includes("goodreads")) return "goodreads-csv";
    throw new Error(
      'Unrecognized CSV format. Please export from Goodreads (includes "Exclusive Shelf" column) or StoryGraph (includes "Read Status" and "Authors" columns).'
    );
  }
  const firstLine = text.slice(0, 600).toLowerCase();
  if (firstLine.includes("exclusive shelf")) return "goodreads-csv";
  if (firstLine.includes("read status") && firstLine.includes("authors")) return "storygraph-csv";
  return "json";
}

export async function importDataFromFile(file: File): Promise<ImportPayload> {
  const text = await file.text();
  const fmt = detectFormat(text, file.name);

  if (fmt === "goodreads-csv") return parseGoodreadsCSV(text);
  if (fmt === "storygraph-csv") return parseStoryGraphCSV(text);

  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("File is not valid JSON.");
  }
  const p = data as {
    feltlyExportVersion?: number;
    tropelyExportVersion?: number;
    version?: number;
    books?: unknown;
    journal?: unknown;
    sessions?: unknown;
    reactionLog?: unknown;
    reflections?: unknown;
    finishes?: unknown;
  };
  if (
    typeof data !== "object" ||
    data === null ||
    !Array.isArray(p.books) ||
    (p.feltlyExportVersion !== 1 && p.tropelyExportVersion !== 1 && p.version !== 1)
  ) {
    throw new Error(
      "This doesn't look like a Feltly backup file. Make sure you're choosing a JSON file exported from Feltly."
    );
  }
  return {
    format: "feltly",
    books: Array.isArray(p.books) ? (p.books as Book[]) : [],
    finishes: Array.isArray(p.finishes) ? (p.finishes as FinishRecord[]) : [],
    journal: Array.isArray(p.journal) ? (p.journal as JournalEntry[]) : [],
    sessions: Array.isArray(p.sessions) ? (p.sessions as SessionLog[]) : [],
    reactionLog: Array.isArray(p.reactionLog) ? (p.reactionLog as ReactionLog[]) : [],
    reflections: Array.isArray(p.reflections) ? (p.reflections as Reflection[]) : [],
  };
}

export function downloadExport(payload: ExportPayload, format: "json" | "csv") {
  const ts = new Date().toISOString().slice(0, 10);
  if (format === "json") {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    triggerDownload(blob, `feltly-export-${ts}.json`);
    return;
  }
  const finishByBookId = new Map<string, number>();
  for (const f of payload.finishes ?? []) {
    const prev = finishByBookId.get(f.bookId);
    if (!prev || f.finishedAt > prev) finishByBookId.set(f.bookId, f.finishedAt);
  }
  const rows: string[] = [
    ["title", "author", "shelf", "mood", "pages", "progress", "tags", "addedAt", "finishedAt"].join(","),
  ];
  payload.books.forEach((b) => {
    const finishedAt = finishByBookId.get(b.id);
    rows.push(
      [
        csvCell(b.title),
        csvCell(b.author),
        b.shelf,
        b.mood,
        b.pages,
        b.progress,
        csvCell((b.tags ?? []).join("|")),
        new Date(b.addedAt).toISOString(),
        finishedAt ? new Date(finishedAt).toISOString() : "",
      ].join(",")
    );
  });
  const blob = new Blob([rows.join("\n")], { type: "text/csv" });
  triggerDownload(blob, `feltly-library-${ts}.csv`);
}

export function downloadHighlightsCsv(payload: ExportPayload) {
  const ts = new Date().toISOString().slice(0, 10);
  const byBook: Record<string, { title: string; author: string }> = {};
  payload.books.forEach((b) => (byBook[b.id] = { title: b.title, author: b.author }));
  const rows: string[] = [
    ["bookTitle", "bookAuthor", "kind", "page", "mood", "text", "createdAt"].join(","),
  ];
  payload.journal.forEach((j) => {
    const b = byBook[j.bookId] ?? { title: "", author: "" };
    rows.push(
      [
        csvCell(b.title),
        csvCell(b.author),
        j.kind,
        j.page ?? "",
        j.mood ?? "",
        csvCell(j.text),
        new Date(j.createdAt).toISOString(),
      ].join(",")
    );
  });
  const blob = new Blob([rows.join("\n")], { type: "text/csv" });
  triggerDownload(blob, `feltly-highlights-${ts}.csv`);
}

function csvCell(s: string | number) {
  const v = String(s ?? "");
  if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
