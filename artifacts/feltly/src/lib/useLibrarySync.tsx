import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { useLibrary, FRESH_PROFILE_STATE, type ProfileData, type Book, type Collection, type PageMarker, type ReadSnapshot } from "@/lib/store";
import { getDeviceLabel, getDeviceId } from "@/lib/positionSync";

export const REV_KEY_PREFIX = "feltly:library-sync:rev:";
const DIRTY_KEY_PREFIX = "feltly:library-sync:dirty:";
const OWNER_KEY = "feltly:library-sync:owner";
const PUSH_DEBOUNCE_MS = 1500;

/** Call this after a bulk import to bypass the debounce and push immediately. */
export const libraryPushNowRef: { current: (() => Promise<boolean>) | null } = { current: null };

/**
 * Set to true before calling applyRemoteSnapshot from an external restore flow.
 * The next scheduled push will be skipped (preventing a redundant history entry
 * from the restore write-back), then the flag self-clears.
 */
export const suppressNextPushRef: { current: boolean } = { current: false };

type Snapshot = ProfileData & { readSnapshots: ReadSnapshot[]; companionFinishedToastsShown: string[]; lastChangelogReadAt: number };

type RemoteRow = {
  data: Snapshot;
  revision: number;
  deviceLabel: string | null;
  updatedAt: string;
};

const revKey = (userId: string) => `${REV_KEY_PREFIX}${userId}`;
const dirtyKey = (userId: string) => `${DIRTY_KEY_PREFIX}${userId}`;

function getLocalRev(userId: string): number {
  try {
    const raw = localStorage.getItem(revKey(userId));
    return raw ? Number(raw) || 0 : 0;
  } catch {
    return 0;
  }
}
function setLocalRev(userId: string, rev: number) {
  try { localStorage.setItem(revKey(userId), String(rev)); } catch {}
}
function setDirty(userId: string, dirty: boolean) {
  try {
    if (dirty) localStorage.setItem(dirtyKey(userId), "1");
    else localStorage.removeItem(dirtyKey(userId));
  } catch {}
}
function isDirty(userId: string): boolean {
  try { return localStorage.getItem(dirtyKey(userId)) === "1"; } catch { return false; }
}
function getStoredOwner(): string | null {
  try { return localStorage.getItem(OWNER_KEY); } catch { return null; }
}
function setStoredOwner(userId: string) {
  try { localStorage.setItem(OWNER_KEY, userId); } catch {}
}

// Reset the persisted Zustand store to a fresh profile. Used when the
// current local state was last owned by a different signed-in user, to
// prevent leaking the previous user's library/journal/sessions into the
// new user's cloud snapshot.
function resetLocalStoreFor(newUserId: string) {
  // FRESH_PROFILE_STATE intentionally omits `readSnapshots`; include every
  // synced field explicitly here so no prior-user data can survive a reset
  // and leak into the new account's snapshot.
  useLibrary.setState(
    { ...FRESH_PROFILE_STATE, readSnapshots: [] } as unknown as Parameters<typeof useLibrary.setState>[0]
  );
  setLocalRev(newUserId, 0);
  setDirty(newUserId, false);
}

function snapshotFromState(s: ReturnType<typeof useLibrary.getState>): Snapshot {
  return {
    books: s.books,
    currentId: s.currentId,
    journal: s.journal,
    reactionLog: s.reactionLog,
    sessions: s.sessions,
    reflections: s.reflections,
    finishes: s.finishes,
    yearlyGoal: s.yearlyGoal,
    spoilerStrictness: s.spoilerStrictness,
    hasOnboarded: s.hasOnboarded,
    hasSeenWalkthrough: s.hasSeenWalkthrough,
    moodPreferences: s.moodPreferences,
    dailyGoalPages: s.dailyGoalPages,
    dailyGoalMinutes: s.dailyGoalMinutes,
    age: s.age,
    shelfTheme: s.shelfTheme,
    privateLibrary: s.privateLibrary,
    defaultShareVisibility: s.defaultShareVisibility,
    showBadgeFlair: s.showBadgeFlair,
    customShelfNames: s.customShelfNames,
    lifetimeEarned: s.lifetimeEarned,
    lifetimeRewards: s.lifetimeRewards,
    freeze: s.freeze,
    collections: s.collections,
    markers: s.markers,
    nextReadId: s.nextReadId,
    parentalPin: s.parentalPin,
    readingFontScale: s.readingFontScale,
    readingDensity: s.readingDensity,
    readSnapshots: s.readSnapshots,
    companionFinishedToastsShown: s.companionFinishedToastsShown,
    lastChangelogReadAt: s.lastChangelogReadAt,
  };
}

// Per-record merge: union by id, remote wins on conflict (it represents the
// newer revision). Local-only entries are preserved so two devices adding
// different items between syncs do not clobber each other.
function mergeById<T extends { id: string }>(local: T[], remote: T[] | undefined): T[] {
  if (!remote) return local;
  const byId = new Map<string, T>();
  for (const item of local) byId.set(item.id, item);
  for (const item of remote) byId.set(item.id, item);
  return Array.from(byId.values());
}

function mergeBooks(local: Book[], remote: Book[] | undefined): Book[] {
  if (!remote) return local;
  const byId = new Map<string, Book>();
  for (const b of local) byId.set(b.id, b);
  for (const b of remote) {
    const prev = byId.get(b.id);
    if (!prev) { byId.set(b.id, b); continue; }
    // Prefer remote (newer revision) but keep the higher progress so a sync
    // race never rolls a reader's page back.
    byId.set(b.id, { ...prev, ...b, progress: Math.max(prev.progress ?? 0, b.progress ?? 0) });
  }
  return Array.from(byId.values());
}

function mergeCollections(local: Collection[], remote: Collection[] | undefined): Collection[] {
  if (!remote) return local;
  const byId = new Map<string, Collection>();
  for (const c of local) byId.set(c.id, c);
  for (const c of remote) {
    const prev = byId.get(c.id);
    if (!prev) { byId.set(c.id, c); continue; }
    const ids = Array.from(new Set([...(prev.bookIds ?? []), ...(c.bookIds ?? [])]));
    byId.set(c.id, { ...prev, ...c, bookIds: ids });
  }
  return Array.from(byId.values());
}

function mergedSnapshot(local: Snapshot, remote: Snapshot): Snapshot {
  return {
    ...remote,
    books: mergeBooks(local.books, remote.books),
    journal: mergeById(local.journal, remote.journal),
    sessions: mergeById(local.sessions, remote.sessions),
    reflections: mergeById(local.reflections, remote.reflections),
    finishes: mergeById(local.finishes, remote.finishes),
    markers: mergeById(local.markers as PageMarker[], remote.markers as PageMarker[]),
    readSnapshots: mergeById(local.readSnapshots, remote.readSnapshots),
    collections: mergeCollections(local.collections, remote.collections),
    // reactionLog has no stable id; concatenate then de-dupe by (emoji, bookId, at)
    reactionLog: dedupeReactions([...(local.reactionLog ?? []), ...(remote.reactionLog ?? [])]),
    // Earned/claimed badge ids accumulate across devices.
    lifetimeEarned: Array.from(new Set([...(local.lifetimeEarned ?? []), ...(remote.lifetimeEarned ?? [])])),
    lifetimeRewards: Array.from(new Set([...(local.lifetimeRewards ?? []), ...(remote.lifetimeRewards ?? [])])),
    // Seen toast keys accumulate across devices so the same finish never toasts twice.
    companionFinishedToastsShown: Array.from(new Set([...(local.companionFinishedToastsShown ?? []), ...(remote.companionFinishedToastsShown ?? [])])),
    // Most-recent read wins so the badge clears on the fastest device and stays clear everywhere.
    lastChangelogReadAt: Math.max(local.lastChangelogReadAt ?? 0, remote.lastChangelogReadAt ?? 0),
  };
}

function dedupeReactions(list: Snapshot["reactionLog"]): Snapshot["reactionLog"] {
  const seen = new Set<string>();
  const out: Snapshot["reactionLog"] = [];
  for (const r of list) {
    const k = `${r.emoji}::${r.bookId}::${r.at}`;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(r);
  }
  return out;
}

function snapshotsEqual(a: Snapshot, b: Snapshot): boolean {
  try { return JSON.stringify(a) === JSON.stringify(b); } catch { return false; }
}

export function useLibrarySync() {
  const { user, loading } = useAuth();
  const userId = user?.id ?? null;

  // Set to the userId only after the initial pull (and any seeding push) for
  // that user has resolved. Pushes are gated on this to prevent a previous
  // user's local state from leaking into the new user's account during a
  // user switch.
  const readyFor = useRef<string | null>(null);
  const pushTimer = useRef<number | null>(null);
  const inFlight = useRef(false);

  useEffect(() => {
    if (loading) return;
    if (!userId) {
      readyFor.current = null;
      return;
    }
    if (readyFor.current === userId) return;

    let cancelled = false;
    let unsub: (() => void) | null = null;
    let onOnline: (() => void) | null = null;

    const schedulePush = () => {
      if (pushTimer.current) window.clearTimeout(pushTimer.current);
      pushTimer.current = window.setTimeout(() => { void doPush(); }, PUSH_DEBOUNCE_MS);
    };

    const pushNow = async (): Promise<boolean> => {
      if (readyFor.current !== userId) return false;
      if (typeof navigator !== "undefined" && navigator.onLine === false) return false;
      if (suppressNextPushRef.current) {
        suppressNextPushRef.current = false;
        setDirty(userId, false);
        return true;
      }
      const data = snapshotFromState(useLibrary.getState());
      const baseRevision = getLocalRev(userId);
      try {
        const res = await fetch("/api/library-snapshot", {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data, baseRevision, deviceLabel: getDeviceLabel(), deviceId: getDeviceId() }),
        });
        if (res.status === 409) {
          const conflict = (await res.json()) as { row: RemoteRow };
          if (conflict?.row) {
            const merged = mergedSnapshot(data, conflict.row.data);
            useLibrary.getState().applyRemoteSnapshot(merged);
            setLocalRev(userId, conflict.row.revision);
            const where = conflict.row.deviceLabel ? ` from ${conflict.row.deviceLabel}` : "";
            toast.message(`Pulled newer library${where}`);
          }
          // dirty stays set; the merge will trigger another push
          return false;
        }
        if (!res.ok) return false;
        const body = (await res.json()) as { row: RemoteRow };
        if (body?.row) setLocalRev(userId, body.row.revision);
        setDirty(userId, false);
        window.dispatchEvent(new CustomEvent("feltly:library-pushed"));
        return true;
      } catch {
        return false;
      }
    };

    libraryPushNowRef.current = pushNow;

    const doPush = async () => {
      if (inFlight.current) { schedulePush(); return; }
      inFlight.current = true;
      try { await pushNow(); }
      finally { inFlight.current = false; }
    };

    const initSync = async () => {
      try {
        // Block cross-user state seeding on shared devices. If the local
        // state was last owned by a *different* signed-in user, wipe it
        // before doing anything else — never auto-push someone else's
        // data into this account's snapshot.
        //
        // First-run / upgrade case (storedOwner is null) is treated as an
        // adoption: existing signed-in users keep their local books,
        // sessions, journal, etc., and we'll publish them to the cloud
        // on the initial push. This avoids a data-loss regression on
        // rollout. Anonymous → signed-in migration is technically out of
        // scope per task #20, but on first rollout we cannot tell the two
        // cases apart, and silently erasing real readers' libraries is a
        // worse failure mode than adopting some local data.
        const storedOwner = getStoredOwner();
        if (storedOwner !== null && storedOwner !== userId) {
          resetLocalStoreFor(userId);
        }
        setStoredOwner(userId);

        const localBefore = snapshotFromState(useLibrary.getState());
        let remote: RemoteRow | null = null;
        try {
          const res = await fetch("/api/library-snapshot", { credentials: "include" });
          if (res.ok) remote = (await res.json()) as RemoteRow | null;
        } catch {
          // offline — proceed with whatever local state we have
        }
        if (cancelled) return;

        if (remote) {
          const localRev = getLocalRev(userId);
          if (remote.revision > localRev) {
            const merged = mergedSnapshot(localBefore, remote.data);
            useLibrary.getState().applyRemoteSnapshot(merged);
            setLocalRev(userId, remote.revision);
            const where = remote.deviceLabel ? ` from ${remote.deviceLabel}` : "";
            // If the merge produced changes that aren't in remote yet, mark
            // dirty so we push them back; otherwise we're in sync.
            const afterMerge = snapshotFromState(useLibrary.getState());
            if (!snapshotsEqual(afterMerge, remote.data)) setDirty(userId, true);
            else setDirty(userId, false);
            toast.success(`Loaded your latest library${where}`);
          }
        } else {
          // Remote missing — this is the first device for this account.
          // Mark dirty so we publish current local state below.
          setDirty(userId, true);
        }

        if (cancelled) return;
        readyFor.current = userId;

        // Initial push if needed (covers: no remote yet, dirty from offline
        // edits in a previous session, or merge-derived local-only changes).
        if (isDirty(userId)) {
          await doPush();
        }

        // Subscribe to subsequent state changes.
        unsub = useLibrary.subscribe((state, prev) => {
          if (readyFor.current !== userId) return;
          if (state === prev) return;
          setDirty(userId, true);
          schedulePush();
        });
        onOnline = () => { if (isDirty(userId)) schedulePush(); };
        window.addEventListener("online", onOnline);

        // If we came online with pending edits, flush.
        if (isDirty(userId) && (typeof navigator === "undefined" || navigator.onLine !== false)) {
          schedulePush();
        }
      } catch {
        // best effort
      }
    };

    void initSync();

    return () => {
      cancelled = true;
      libraryPushNowRef.current = null;
      if (unsub) unsub();
      if (onOnline) window.removeEventListener("online", onOnline);
      if (pushTimer.current) window.clearTimeout(pushTimer.current);
      readyFor.current = null;
    };
  }, [loading, userId]);
}
