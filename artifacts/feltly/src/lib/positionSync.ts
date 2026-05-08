import { enqueue } from "./offlineQueue";

const DEVICE_KEY = "feltly:device-label";
const DEVICE_ID_KEY = "feltly:device-id";

export function getDeviceLabel(): string {
  if (typeof window === "undefined") return "this device";
  let label = localStorage.getItem(DEVICE_KEY);
  if (label) return label;
  const ua = navigator.userAgent;
  let browser = "Browser";
  if (/EdgA?\/|Edg\//i.test(ua)) browser = "Edge";
  else if (/Chrome\/[0-9]/i.test(ua) && !/Chromium/i.test(ua)) browser = "Chrome";
  else if (/Firefox\//i.test(ua)) browser = "Firefox";
  else if (/Safari\//i.test(ua) && !/Chrome/i.test(ua)) browser = "Safari";
  let os = "";
  if (/iPhone/i.test(ua)) os = " on iPhone";
  else if (/iPad/i.test(ua)) os = " on iPad";
  else if (/Android/i.test(ua)) os = " on Android";
  else if (/Macintosh|Mac OS/i.test(ua)) os = " on Mac";
  else if (/Windows/i.test(ua)) os = " on Windows";
  label = `${browser}${os}`;
  localStorage.setItem(DEVICE_KEY, label);
  return label;
}

export function getDeviceId(): string {
  if (typeof window === "undefined") return "ssr";
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (id) return id;
  id = crypto.randomUUID();
  localStorage.setItem(DEVICE_ID_KEY, id);
  return id;
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

export async function pushPosition(args: {
  title: string;
  author: string;
  page: number;
  totalPages?: number;
}) {
  try {
    const key = bookKey(args.title, args.author);
    await enqueue({
      kind: "upsert",
      table: "reading_positions",
      onConflict: "user_id,book_key",
      row: {
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

export async function fetchPosition(_title: string, _author: string): Promise<RemotePosition | null> {
  // Position sync via offline queue — fetch not required for now
  return null;
}
