import { auth } from "./firebase";

async function getAuthToken(): Promise<string | null> {
  return auth.currentUser ? auth.currentUser.getIdToken() : null;
}

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
  isbn?: string[];
};

export async function searchBooks(query: string): Promise<OLBook[]> {
  if (!query.trim()) return [];
  const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=20&fields=key,title,author_name,first_publish_year,number_of_pages_median,cover_i,isbn`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Open Library search failed");
  const data = await res.json();
  return (data.docs ?? []) as OLBook[];
}

export async function searchBooksByISBN(isbn: string): Promise<OLBook[]> {
  const url = `https://openlibrary.org/search.json?isbn=${encodeURIComponent(isbn)}&fields=key,title,author_name,first_publish_year,number_of_pages_median,cover_i,isbn`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Open Library ISBN search failed");
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
  opts?: {
    characterName?: string;
    tropes?: string[];
    currentPage?: number;
    totalPages?: number;
    spoilerStrictness?: "relaxed" | "balanced" | "strict";
  },
): Promise<string> {
  const token = await getAuthToken();
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

export async function fetchActivity() {
  const token = await getAuthToken();
  const res = await fetch(`${API_BASE_URL}/api/activity`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error(`Activity error: ${res.status}`);
  return res.json();
}

// ── Social feed ──────────────────────────────────────────────────────────────

export type SocialActivity = {
  id: string;
  userId: string;
  username: string;
  avatarUrl?: string;
  type: "finished" | "started" | "quote" | "rating" | "milestone";
  bookTitle: string;
  bookCover?: string;
  text?: string;
  rating?: number;
  spoilerLevel?: "safe" | "mild" | "spoiler";
  createdAt: string;
};

export async function fetchSocialFeed(cursor?: string): Promise<{ items: SocialActivity[]; nextCursor?: string }> {
  const token = await getAuthToken();
  const url = `${API_BASE_URL}/api/social/feed${cursor ? `?cursor=${cursor}` : ""}`;
  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error(`Social feed error: ${res.status}`);
  return res.json();
}

export async function postActivity(payload: {
  type: string;
  bookTitle?: string;
  text?: string;
  rating?: number;
  spoilerLevel?: string;
}) {
  const token = await getAuthToken();
  await fetch(`${API_BASE_URL}/api/social/post`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });
}

export async function fetchProfiles(query: string) {
  const token = await getAuthToken();
  const res = await fetch(`${API_BASE_URL}/api/profiles?q=${encodeURIComponent(query)}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error(`Profiles error: ${res.status}`);
  return res.json();
}

export async function followUser(userId: string) {
  const token = await getAuthToken();
  await fetch(`${API_BASE_URL}/api/social/follow`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ userId }),
  });
}

export async function unfollowUser(userId: string) {
  const token = await getAuthToken();
  await fetch(`${API_BASE_URL}/api/social/unfollow`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ userId }),
  });
}

// ── New releases ─────────────────────────────────────────────────────────────

export type BookRelease = {
  id: string;
  title: string;
  author: string;
  cover?: string;
  releaseDate: string;
  description?: string;
  tropes?: string[];
  openLibraryKey?: string;
};

export async function fetchNewReleases(): Promise<BookRelease[]> {
  const token = await getAuthToken();
  const res = await fetch(`${API_BASE_URL}/api/releases/new`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) return [];
  return res.json();
}

export async function fetchUpcomingReleases(): Promise<BookRelease[]> {
  const token = await getAuthToken();
  const res = await fetch(`${API_BASE_URL}/api/releases/upcoming`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) return [];
  return res.json();
}

export async function subscribeToRelease(releaseId: string) {
  const token = await getAuthToken();
  await fetch(`${API_BASE_URL}/api/releases/${releaseId}/subscribe`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}

// ── Reading positions ────────────────────────────────────────────────────────

export async function syncReadingPosition(bookId: string, page: number) {
  const token = await getAuthToken();
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

export async function fetchBuddyReads() {
  const token = await getAuthToken();
  const res = await fetch(`${API_BASE_URL}/api/buddy-reads`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error(`Buddy reads error: ${res.status}`);
  return res.json();
}

export async function fetchBuddyReadMessages(roomId: string) {
  const token = await getAuthToken();
  const res = await fetch(`${API_BASE_URL}/api/buddy-reads/${roomId}/messages`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error(`Buddy reads messages error: ${res.status}`);
  return res.json();
}

export async function postBuddyReadMessage(roomId: string, content: string) {
  const token = await getAuthToken();
  await fetch(`${API_BASE_URL}/api/buddy-reads/${roomId}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ content }),
  });
}

// ── Follows ──────────────────────────────────────────────────────────────────

export async function fetchFollows() {
  const token = await getAuthToken();
  const res = await fetch(`${API_BASE_URL}/api/follows`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error(`Follows error: ${res.status}`);
  return res.json();
}

// ── Mood tag books ───────────────────────────────────────────────────────────

export async function moodTagBooks(
  books: { key: string; title: string; description?: string }[],
): Promise<Record<string, string[]>> {
  const token = await getAuthToken();
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
