import { fetch } from "expo/fetch";

let _authTokenGetter: (() => Promise<string | null>) | null = null;

export function setApiAuthGetter(getter: () => Promise<string | null>) {
  _authTokenGetter = getter;
}

async function getHeaders(extra?: Record<string, string>): Promise<Record<string, string>> {
  const token = _authTokenGetter ? await _authTokenGetter() : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

function baseUrl(): string {
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  return domain ? `https://${domain}` : "";
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${baseUrl()}${path}`, {
    headers: await getHeaders(),
  });
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
  return res.json() as Promise<T>;
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${baseUrl()}${path}`, {
    method: "POST",
    headers: await getHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`POST ${path} failed: ${res.status}`);
  return res.json() as Promise<T>;
}

export async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${baseUrl()}${path}`, {
    method: "PATCH",
    headers: await getHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`PATCH ${path} failed: ${res.status}`);
  return res.json() as Promise<T>;
}

export async function apiDelete<T>(path: string): Promise<T> {
  const res = await fetch(`${baseUrl()}${path}`, {
    method: "DELETE",
    headers: await getHeaders(),
  });
  if (!res.ok) throw new Error(`DELETE ${path} failed: ${res.status}`);
  return res.json() as Promise<T>;
}

export interface OLSearchResult {
  key: string;
  title: string;
  author_name?: string[];
  cover_i?: number;
  number_of_pages_median?: number;
  first_publish_year?: number;
  subject?: string[];
}

export async function searchBooks(query: string): Promise<OLSearchResult[]> {
  const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=20&fields=key,title,author_name,cover_i,number_of_pages_median,first_publish_year,subject`;
  const res = await fetch(url);
  const data = (await res.json()) as { docs: OLSearchResult[] };
  return data.docs ?? [];
}

export function coverUrl(coverId: number | undefined, size: "S" | "M" | "L" = "M"): string | undefined {
  if (!coverId) return undefined;
  return `https://covers.openlibrary.org/b/id/${coverId}-${size}.jpg`;
}

export async function companionChat(
  bookKey: string,
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  bookTitle: string,
  tropes: string[] = []
): Promise<string> {
  const data = await apiPost<{ reply: string }>(`/api/companion/${encodeURIComponent(bookKey)}/chat`, {
    messages,
    bookTitle,
    tropes,
  });
  return data.reply ?? "";
}
