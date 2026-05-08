import { supabase } from "@/integrations/supabase/client";

/**
 * Tiny offline-first write queue.
 *
 * Calls go through `enqueue(op)`. We try immediately; on failure or while
 * offline, the op is persisted to localStorage and retried on `online` events
 * and on a 30s heartbeat. Ops are user-scoped (carry `user_id`) and idempotent
 * by design — we use upserts where possible.
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
const MAX_AGE_MS = 1000 * 60 * 60 * 24 * 14; // 14 days

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
  } catch {
    // localStorage may be full
  }
}

let listeners: Array<(count: number) => void> = [];
export function subscribePending(fn: (count: number) => void): () => void {
  listeners.push(fn);
  fn(load().length);
  return () => {
    listeners = listeners.filter((l) => l !== fn);
  };
}
function notify() {
  const c = load().length;
  listeners.forEach((fn) => fn(c));
}

async function executeOp(op: QueuedOp): Promise<boolean> {
  try {
    if (op.kind === "upsert") {
      const { error } = await supabase
        .from(op.table)
        .upsert(op.row as never, op.onConflict ? { onConflict: op.onConflict } : undefined);
      return !error;
    }
    const { error } = await supabase.from(op.table).insert(op.row as never);
    return !error;
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
    let queue = load();
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
  const full = {
    ...op,
    id: crypto.randomUUID(),
    enqueuedAt: Date.now(),
  } as QueuedOp;

  // Try immediately; if it works, never persist.
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
  window.addEventListener("online", () => {
    void flush();
  });
  // Periodic flush in case 'online' missed
  setInterval(() => {
    void flush();
  }, 30_000);
  // Initial flush on load
  void flush();
}

export function getPendingCount(): number {
  return load().length;
}