import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Book, FinishRecord } from "@/lib/store";
import type { ImportFormat, ImportPayload, ImportDiff } from "@/lib/exportData";
import { cn } from "@/lib/utils";

export type { ImportDiff };

const SHELF_LABELS: Record<string, string> = {
  finished: "Finished",
  reading: "Reading",
  want: "Want to Read",
  dnf: "DNF",
  paused: "Paused",
};

const FORMAT_LABELS: Record<ImportFormat, string> = {
  feltly: "Feltly backup",
  goodreads: "Goodreads export",
  storygraph: "StoryGraph export",
};

type ApplyArgs = {
  newBooks: Book[];
  shelfUpdates: Array<{ existingId: string; importedId: string; toShelf: import("@/lib/store").Shelf; toProgress: number }>;
  newFinishes: FinishRecord[];
  journal: import("@/lib/store").JournalEntry[];
  sessions: import("@/lib/store").SessionLog[];
  reactionLog: import("@/lib/store").ReactionLog[];
  reflections: import("@/lib/store").Reflection[];
};

type Props = {
  open: boolean;
  payload: ImportPayload | null;
  diff: ImportDiff | null;
  onApply: (args: ApplyArgs) => void;
  onCancel: () => void;
};

export function ImportPreviewModal({ open, payload, diff, onApply, onCancel }: Props) {
  const [applying, setApplying] = useState(false);

  if (!payload || !diff) return null;

  const { newBooks, updatableBooks, alreadyCurrent, skippedCount } = diff;
  const formatLabel = FORMAT_LABELS[payload.format];
  const nonBookRecords =
    (payload.journal?.length ?? 0) +
    (payload.sessions?.length ?? 0) +
    (payload.reflections?.length ?? 0) +
    (payload.reactionLog?.length ?? 0);
  const totalWillChange = newBooks.length + updatableBooks.length + nonBookRecords;

  const previewNew = newBooks.slice(0, 8);
  const moreNew = Math.max(0, newBooks.length - previewNew.length);
  const previewUpdatable = updatableBooks.slice(0, 4);
  const moreUpdatable = Math.max(0, updatableBooks.length - previewUpdatable.length);

  const handleApply = () => {
    setApplying(true);
    try {
      const shelfUpdates = updatableBooks.map((u) => ({
        existingId: u.existingId,
        importedId: u.importedBook.id,
        toShelf: u.toShelf,
        toProgress: u.toProgress,
      }));
      // Finishes for matched books: remap the imported bookId → existing store id
      const newFinishesFromUpdatable: FinishRecord[] = updatableBooks
        .filter((u) => u.importedFinishedAt)
        .map((u) => ({
          id: crypto.randomUUID(),
          bookId: u.existingId,
          finishedAt: u.importedFinishedAt!,
        }));
      // Finishes for new books: only those whose bookId is in the new-books set
      const newBookIds = new Set(newBooks.map((b) => b.id));
      const newFinishesFromNewBooks = (payload.finishes ?? []).filter(
        (f) => newBookIds.has(f.bookId)
      );
      onApply({
        newBooks,
        shelfUpdates,
        newFinishes: [...newFinishesFromNewBooks, ...newFinishesFromUpdatable],
        journal: payload.journal ?? [],
        sessions: payload.sessions ?? [],
        reactionLog: payload.reactionLog ?? [],
        reflections: payload.reflections ?? [],
      });
    } finally {
      setApplying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onCancel(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Import preview</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Source:</span>
            <Badge variant="secondary" className="rounded-full text-xs font-normal">
              {formatLabel}
            </Badge>
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            {[
              { count: newBooks.length, label: "New" },
              { count: updatableBooks.length, label: "Conflicts" },
              { count: alreadyCurrent.length, label: "Already in library" },
              { count: skippedCount, label: "Skipped" },
            ].map(({ count, label }) => (
              <div key={label} className="rounded-xl border border-border/50 bg-background/50 p-2.5 text-center">
                <div className="font-display text-xl text-foreground">{count}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{label}</div>
              </div>
            ))}
          </div>

          {newBooks.length === 0 && updatableBooks.length === 0 && nonBookRecords > 0 ? (
            <div className="rounded-xl border border-border/40 bg-background/40 px-4 py-3 text-sm text-muted-foreground">
              No book changes — your library is up to date. Journal entries and reading activity from this backup will still be merged.
            </div>
          ) : totalWillChange === 0 ? (
            <div className="rounded-xl border border-border/40 bg-background/40 p-4 text-center text-sm text-muted-foreground">
              No changes — your library is already up to date.
            </div>
          ) : (
            <ScrollArea className="h-56 rounded-xl border border-border/40">
              <div className="p-2 space-y-0.5">
                {previewNew.map((b) => (
                  <BookRow key={b.id} book={b} badge="new" />
                ))}
                {moreNew > 0 && (
                  <div className="px-2.5 py-1.5 text-xs text-muted-foreground text-center">
                    + {moreNew} more new book{moreNew === 1 ? "" : "s"}
                  </div>
                )}
                {previewUpdatable.map(({ importedBook, existingId }) => (
                  <BookRow key={existingId} book={importedBook} badge="update" />
                ))}
                {moreUpdatable > 0 && (
                  <div className="px-2.5 py-1.5 text-xs text-muted-foreground text-center">
                    + {moreUpdatable} more book{moreUpdatable === 1 ? "" : "s"} to update
                  </div>
                )}
              </div>
            </ScrollArea>
          )}

          {updatableBooks.length > 0 && (
            <p className="text-[11px] text-muted-foreground">
              {updatableBooks.length} book{updatableBooks.length === 1 ? "" : "s"} in your library will have
              their shelf or finish date updated. Mood, tropes, and notes are never overwritten.
            </p>
          )}

          {alreadyCurrent.length > 0 && (
            <p className="text-[11px] text-muted-foreground">
              {alreadyCurrent.length} book{alreadyCurrent.length === 1 ? "" : "s"} already match your library and will be left unchanged.
            </p>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            variant="ghost"
            className="rounded-full"
            onClick={onCancel}
            disabled={applying}
          >
            Cancel
          </Button>
          <Button
            className="rounded-full"
            onClick={handleApply}
            disabled={applying || totalWillChange === 0}
          >
            {applying
              ? "Importing…"
              : totalWillChange === 0
              ? "Nothing to import"
              : `Import ${totalWillChange === newBooks.length
                  ? `${newBooks.length} book${newBooks.length === 1 ? "" : "s"}`
                  : `${newBooks.length} new, update ${updatableBooks.length}`
                }`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function BookRow({ book, badge }: { book: Book; badge: "new" | "update" }) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 hover:bg-foreground/[0.03] transition">
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium leading-snug truncate">{book.title}</div>
        <div className="text-xs text-muted-foreground truncate">{book.author}</div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[10px] border",
            book.shelf === "finished"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : book.shelf === "reading"
              ? "border-blue-200 bg-blue-50 text-blue-700"
              : "border-border/60 bg-background/60 text-muted-foreground"
          )}
        >
          {SHELF_LABELS[book.shelf] ?? book.shelf}
        </span>
        <span
          className={cn(
            "rounded-full px-1.5 py-0.5 text-[9px] uppercase tracking-wider border font-medium",
            badge === "new"
              ? "border-violet-200 bg-violet-50 text-violet-700"
              : "border-amber-200 bg-amber-50 text-amber-700"
          )}
        >
          {badge === "new" ? "new" : "upd"}
        </span>
      </div>
    </div>
  );
}
