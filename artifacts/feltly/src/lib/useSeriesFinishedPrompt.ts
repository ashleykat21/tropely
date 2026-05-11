import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useLibrary } from "./store";

export function useSeriesFinishedPrompt() {
  const books = useLibrary((s) => s.books);
  const collections = useLibrary((s) => s.collections);
  const prevFinishedIds = useRef<Set<string>>(new Set(
    books.filter((b) => b.shelf === "finished").map((b) => b.id)
  ));

  useEffect(() => {
    const nowFinished = new Set(books.filter((b) => b.shelf === "finished").map((b) => b.id));
    const newlyFinished = books.filter(
      (b) => b.shelf === "finished" && !prevFinishedIds.current.has(b.id)
    );

    for (const book of newlyFinished) {
      const seriesColl = collections.find(
        (c) => c.isSeries && c.bookIds.includes(book.id)
      );
      if (!seriesColl) continue;

      const posInSeries = seriesColl.bookIds.indexOf(book.id);
      const nextBookId = seriesColl.bookIds[posInSeries + 1];

      if (!nextBookId) {
        toast(`You finished the last book in "${seriesColl.name}" — what a journey! 🎉`, {
          duration: 8000,
        });
        continue;
      }

      const nextBook = books.find((b) => b.id === nextBookId);

      if (nextBook) {
        const searchUrl = `https://openlibrary.org/search?q=${encodeURIComponent(nextBook.title + " " + nextBook.author)}`;
        toast(`Next in "${seriesColl.name}": ${nextBook.title}`, {
          description: "Tap to find it on Open Library.",
          duration: 10000,
          action: {
            label: "Find it →",
            onClick: () => window.open(searchUrl, "_blank", "noopener,noreferrer"),
          },
        });
      } else {
        const seriesSearchUrl = `https://openlibrary.org/search?q=${encodeURIComponent(seriesColl.name + " series")}`;
        toast(`You finished a book in "${seriesColl.name}"`, {
          description: "Ready for the next one? Find the full series on Open Library.",
          duration: 10000,
          action: {
            label: "Find series →",
            onClick: () => window.open(seriesSearchUrl, "_blank", "noopener,noreferrer"),
          },
        });
      }
    }

    prevFinishedIds.current = nowFinished;
  }, [books, collections]);
}
