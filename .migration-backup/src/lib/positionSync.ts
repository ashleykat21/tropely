import { supabase } from "@/integrations/supabase/client";
import { enqueue } from "./offlineQueue";

const DEVICE_KEY = "feltly:device-label";

export function getDeviceLabel(): string {
  if (typeof window === "undefined") return "this device";
  let label = localStorage.getItem(DEVICE_KEY);
  if (label) return label;
  const ua = navigator.userAgent;
  if (/iPhone/i.test(ua)) label = "iPhone";
  else if (/iPad/i.test(ua)) label = "iPad";
  else if (/Android/i.test(ua)) label = "Android";
  else if (/Mac/i.test(ua)) label = "Mac";
  else if (/Windows/i.test(ua)) label = "Windows";
  else label = "Web";
  localStorage.setItem(DEVICE_KEY, label);
  return label;
}

export function bookKey(title: string, author: string): string {
  return `${title}::${author}`.trim().toLowerCase().replace(/\s+/g, " ");
}

export type RemotePosition = {
  book_key: string;
  book_title: string;
  page: number;
  total_pages: number | null;
  device_label: string | null;
  updated_at: string;
};

/** Best-effort upsert. Silent on failure (offline / signed out). */
export async function pushPosition(args: {
  title: string;
  author: string;
  page: number;
  totalPages?: number;
}) {
  try {
    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;
    if (!user) return;
    const key = bookKey(args.title, args.author);
    await enqueue({
      kind: "upsert",
      table: "reading_positions",
      onConflict: "user_id,book_key",
      row: {
        user_id: user.id,
        book_key: key,
        book_title: args.title,
        page: Math.max(0, Math.round(args.page)),
        total_pages: args.totalPages ?? null,
        device_label: getDeviceLabel(),
        updated_at: new Date().toISOString(),
      },
    });
  } catch {
    // best effort
  }
}

export async function fetchPosition(title: string, author: string): Promise<RemotePosition | null> {
  try {
    const key = bookKey(title, author);
    const { data, error } = await supabase
      .from("reading_positions")
      .select("book_key, book_title, page, total_pages, device_label, updated_at")
      .eq("book_key", key)
      .maybeSingle();
    if (error) return null;
    return (data as RemotePosition) ?? null;
  } catch {
    return null;
  }
}