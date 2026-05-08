/**
 * Offline-first write queue — now backed by the API server instead of Supabase.
 */

export type QueuedOp =
  | {
      kind: "upsert";
      table: "reading_positions";
      onConflict?: string;
      row: Record<string, unknown>;
      id: string;
      enqueuedAt: number;
    }
  | {
      kind: "insert";
      table: "activity" | "buddy_messages";
      row: Record<string, unknown>;
      id: string;
      enqueuedAt: number;
    };

const STORAGE_KEY = "feltly:offline-queue:v1";
const MAX_AGE_MS = 1000 * 60 * 60 * 24 * 14;

function load(): QueuedOp[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as QueuedOp[];
    const now = Date.now();
    return parsed.filter((op) => now - op.enqueuedAt < MAX_AGE_MS);
  } catch {
    return [];
  }
}

function save(queue: QueuedOp[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  } catch {}
}

let listeners: Array<(count: number) => void> = [];
export function subscribePending(fn: (count: number) => void): () => void {
  listeners.push(fn);
  fn(load().length);
  return () => { listeners = listeners.filter((l) => l !== fn); };
}
function notify() {
  const c = load().length;
  listeners.forEach((fn) => fn(c));
}

async function executeOp(op: QueuedOp): Promise<boolean> {
  try {
    if (op.kind === "upsert" && op.table === "reading_positions") {
      const res = await fetch("/api/reading-positions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(op.row),
      });
      return res.ok;
    }
    if (op.kind === "insert" && op.table === "activity") {
      const res = await fetch("/api/activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(op.row),
      });
      return res.ok;
    }
    return true;
  } catch {
    return false;
  }
}

let flushing = false;
export async function flush(): Promise<void> {
  if (flushing) return;
  if (typeof navigator !== "undefined" && navigator.onLine === false) return;
  flushing = true;
  try {
    const queue = load();
    if (queue.length === 0) return;
    const remaining: QueuedOp[] = [];
    for (const op of queue) {
      const ok = await executeOp(op);
      if (!ok) remaining.push(op);
    }
    save(remaining);
    notify();
  } finally {
    flushing = false;
  }
}

type QueuedOpInput =
  | Omit<Extract<QueuedOp, { kind: "upsert" }>, "id" | "enqueuedAt">
  | Omit<Extract<QueuedOp, { kind: "insert" }>, "id" | "enqueuedAt">;

export async function enqueue(op: QueuedOpInput): Promise<void> {
  const full = { ...op, id: crypto.randomUUID(), enqueuedAt: Date.now() } as QueuedOp;
  if (typeof navigator === "undefined" || navigator.onLine !== false) {
    const ok = await executeOp(full);
    if (ok) return;
  }
  const queue = load();
  queue.push(full);
  save(queue);
  notify();
}

let initialized = false;
export function initOfflineQueue() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  window.addEventListener("online", () => { void flush(); });
  setInterval(() => { void flush(); }, 30_000);
  void flush();
}

export function getPendingCount(): number {
  return load().length;
}
