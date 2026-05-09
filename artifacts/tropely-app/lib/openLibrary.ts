export interface OLBook {
  key: string;
  title: string;
  author_name?: string[];
  cover_i?: number;
  number_of_pages_median?: number;
  isbn?: string[];
}

export async function searchBooks(query: string): Promise<OLBook[]> {
  if (!query.trim()) return [];
  const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=20&fields=key,title,author_name,cover_i,number_of_pages_median,isbn`;
  try {
    const res = await fetch(url);
    const data = await res.json() as { docs?: OLBook[] };
    return (data.docs ?? []);
  } catch {
    return [];
  }
}

export function coverUrl(
  coverId: number | undefined,
  size: "S" | "M" | "L" = "M"
): string | undefined {
  if (!coverId) return undefined;
  return `https://covers.openlibrary.org/b/id/${coverId}-${size}.jpg`;
}
