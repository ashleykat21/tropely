// Central API base URL — reads from env, falls back to production.
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? "https://usenevora.com";

// ── Open Library search ──────────────────────────────────────────────────────

export type OLBook = {
  key: string;
  title: string;
  author_name?: string[];
  first_publish_year?: number;
  number_of_pages_median?: number;
  cover_i?: number;
};

export async function searchBooks(query: string): Promise<OLBook[]> {
  if (!query.trim()) return [];
  const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=20&fields=key,title,author_name,first_publish_year,number_of_pages_median,cover_i`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Open Library search failed");
  const data = await res.json();
  return (data.docs ?? []) as OLBook[];
}

export function olCoverUrl(coverId: number, size: "S" | "M" | "L" = "M") {
  return `https://covers.openlibrary.org/b/id/${coverId}-${size}.jpg`;
}

// ── Companion / AI chat ──────────────────────────────────────────────────────

export type CompanionMessage = { role: "user" | "assistant"; content: string };

export async function sendCompanionMessage(
  bookKey: string,
  messages: CompanionMessage[],
  getToken: () => Promise<string | null>,
  opts?: { characterName?: string; tropes?: string[] },
): Promise<string> {
  const token = await getToken();
  const res = await fetch(`${API_BASE_URL}/api/companion/${encodeURIComponent(bookKey)}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ messages, ...opts }),
  });
  if (!res.ok) throw new Error(`Companion error: ${res.status}`);
  const data = await res.json();
  return data.content ?? data.message ?? "";
}

// ── Activity feed ────────────────────────────────────────────────────────────

export async function fetchActivity(getToken: () => Promise<string | null>) {
  const token = await getToken();
  const res = await fetch(`${API_BASE_URL}/api/activity`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error(`Activity error: ${res.status}`);
  return res.json();
}

// ── Reading positions ────────────────────────────────────────────────────────

export async function syncReadingPosition(
  bookId: string,
  page: number,
  getToken: () => Promise<string | null>,
) {
  const token = await getToken();
  await fetch(`${API_BASE_URL}/api/reading-positions`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ bookId, page }),
  });
}

// ── Buddy reads ──────────────────────────────────────────────────────────────

export async function fetchBuddyReads(getToken: () => Promise<string | null>) {
  const token = await getToken();
  const res = await fetch(`${API_BASE_URL}/api/buddy-reads`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error(`Buddy reads error: ${res.status}`);
  return res.json();
}

export async function fetchBuddyReadMessages(
  roomId: string,
  getToken: () => Promise<string | null>,
) {
  const token = await getToken();
  const res = await fetch(`${API_BASE_URL}/api/buddy-reads/${roomId}/messages`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error(`Buddy reads messages error: ${res.status}`);
  return res.json();
}

export async function postBuddyReadMessage(
  roomId: string,
  content: string,
  getToken: () => Promise<string | null>,
) {
  const token = await getToken();
  await fetch(`${API_BASE_URL}/api/buddy-reads/${roomId}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ content }),
  });
}

// ── Mood tag books ───────────────────────────────────────────────────────────

export async function moodTagBooks(
  books: { key: string; title: string; description?: string }[],
  getToken: () => Promise<string | null>,
): Promise<Record<string, string[]>> {
  const token = await getToken();
  const res = await fetch(`${API_BASE_URL}/api/mood-tag-books`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ books }),
  });
  if (!res.ok) return {};
  return res.json();
}
