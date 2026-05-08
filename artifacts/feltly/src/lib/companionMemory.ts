export function bookMemoryKey(book: { title: string; author: string }): string {
  return `${book.title}::${book.author}`;
}

export function refreshCompanionMemory(opts: {
  book: { title: string; author: string };
  bookId?: string;
  finishedAt?: number;
  currentPage: number;
  finished?: boolean;
}): void {
  if (typeof window === "undefined") return;
  const key = bookMemoryKey(opts.book);
  const url = `/api/companion/${encodeURIComponent(key)}/summarize`;
  const body = JSON.stringify({
    currentPage: opts.currentPage,
    bookTitle: opts.book.title,
    finished: !!opts.finished,
  });

  // For finished refreshes with a known bookId, use fetch so we can detect
  // success and dispatch the event that triggers the one-shot toast.
  if (opts.finished && opts.bookId) {
    const { bookId, book, finishedAt } = opts;
    void fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body,
      keepalive: true,
    })
      .then((res) => {
        if (res.ok) {
          window.dispatchEvent(
            new CustomEvent("feltly:companion-memory-finished", {
              detail: { bookId, bookTitle: book.title, finishedAt: finishedAt ?? Date.now() },
            })
          );
        }
      })
      .catch(() => {});
    return;
  }

  // Non-finish refreshes: fire-and-forget via sendBeacon (or fetch fallback).
  try {
    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      const blob = new Blob([body], { type: "application/json" });
      const ok = navigator.sendBeacon(url, blob);
      if (ok) return;
    }
    void fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body,
      keepalive: true,
    }).catch(() => {});
  } catch {
    // best-effort background refresh
  }
}
