import type { Book, JournalEntry, ReactionLog, SessionLog, Reflection } from "@/lib/store";

export type ExportPayload = {
  exportedAt: string;
  version: 1;
  books: Book[];
  journal: JournalEntry[];
  sessions: SessionLog[];
  reactionLog: ReactionLog[];
  reflections: Reflection[];
};

export function downloadExport(payload: ExportPayload, format: "json" | "csv") {
  const ts = new Date().toISOString().slice(0, 10);
  if (format === "json") {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    triggerDownload(blob, `feltly-export-${ts}.json`);
    return;
  }
  const rows: string[] = [
    ["title", "author", "shelf", "mood", "pages", "progress", "tags", "addedAt"].join(","),
  ];
  payload.books.forEach((b) => {
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
      ].join(",")
    );
  });
  const blob = new Blob([rows.join("\n")], { type: "text/csv" });
  triggerDownload(blob, `feltly-library-${ts}.csv`);
}

/** Export only highlights/journal entries as CSV. */
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