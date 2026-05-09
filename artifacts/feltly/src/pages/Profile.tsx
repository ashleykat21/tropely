import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLibrary, type SpoilerStrictness } from "@/lib/store";
import { MOODS } from "@/lib/moods";
import { toast } from "sonner";
import { LogOut, ShieldCheck, Target, Bell, BellOff, Download, Sparkles, Lock, EyeOff, Quote, Flame, User, KeyRound, Users, Upload, Compass, Type, Monitor, Trash2, RotateCcw, ChevronDown, ChevronUp } from "lucide-react";
import { isPushSupported, isPushEnabled, subscribeToPush, unsubscribeFromPush, sendTestPush } from "@/lib/push";
import { ManageFamilySheet } from "@/components/family/ManageFamilySheet";
import { useFamilyStore } from "@/lib/familyStore";
import { cn } from "@/lib/utils";
import { MoodSignatureCard } from "@/components/social/MoodSignatureCard";
import {
  downloadExport,
  downloadHighlightsCsv,
  importDataFromFile,
  buildExportPayload,
  computeImportDiff,
  type ImportPayload,
} from "@/lib/exportData";
import { libraryPushNowRef, REV_KEY_PREFIX, suppressNextPushRef } from "@/lib/useLibrarySync";
import { getDeviceId } from "@/lib/positionSync";
import { ImportPreviewModal, type ImportDiff } from "@/components/data/ImportPreviewModal";
import { usePremium } from "@/lib/usePremium";
import { LockedFeature } from "@/components/premium/LockedFeature";
import { ShelfCustomizer } from "@/components/reader/ShelfCustomizer";
import { Palette } from "lucide-react";
import { LOCALES, useLocale, type Locale } from "@/lib/i18n";
import { computeChapters, topUnlockedChapter } from "@/lib/chapters";
import { computeStreak } from "@/lib/streak";

type RestoreProps = {
  existingBooks: import("@/lib/store").Book[];
  existingFinishes: import("@/lib/store").FinishRecord[];
  applyImportedData: (data: {
    newBooks: import("@/lib/store").Book[];
    shelfUpdates: Array<{ existingId: string; importedId: string; toShelf: import("@/lib/store").Shelf; toProgress: number }>;
    newFinishes: import("@/lib/store").FinishRecord[];
    journal?: import("@/lib/store").JournalEntry[];
    sessions?: import("@/lib/store").SessionLog[];
    reactionLog?: import("@/lib/store").ReactionLog[];
    reflections?: import("@/lib/store").Reflection[];
  }) => { addedBooks: number; updatedBooks: number; addedFinishes: number; addedJournal: number };
};

function RestoreSection({ existingBooks, existingFinishes, applyImportedData }: RestoreProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [parsing, setParsing] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [pendingPayload, setPendingPayload] = useState<ImportPayload | null>(null);
  const [pendingDiff, setPendingDiff] = useState<ImportDiff | null>(null);

  const openFilePicker = () => {
    setImportError(null);
    fileRef.current?.click();
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setImportError(null);
    setParsing(true);
    try {
      const payload = await importDataFromFile(file);
      const diff = computeImportDiff(payload, existingBooks, existingFinishes);
      setPendingPayload(payload);
      setPendingDiff(diff);
    } catch (err: unknown) {
      setImportError(
        (err instanceof Error ? err.message : null) ??
          "Import failed. Please check the file and try again."
      );
    } finally {
      setParsing(false);
    }
  };

  const handleApply = (args: Parameters<typeof applyImportedData>[0]) => {
    const { addedBooks, updatedBooks, addedFinishes, addedJournal } = applyImportedData(args);
    setPendingPayload(null);
    setPendingDiff(null);
    // Bypass the debounce — push the merged library to the cloud immediately.
    void libraryPushNowRef.current?.();
    const total = addedBooks + updatedBooks + addedFinishes + addedJournal;
    if (total === 0) {
      toast.success("Library is already up to date — nothing to import.");
    } else {
      const parts: string[] = [];
      if (addedBooks > 0) parts.push(`${addedBooks} book${addedBooks === 1 ? "" : "s"} added`);
      if (updatedBooks > 0) parts.push(`${updatedBooks} updated`);
      if (addedFinishes > 0) parts.push(`${addedFinishes} finish date${addedFinishes === 1 ? "" : "s"}`);
      if (addedJournal > 0) parts.push(`${addedJournal} journal ${addedJournal === 1 ? "entry" : "entries"}`);
      toast.success(`Imported: ${parts.join(", ")}.`);
    }
  };

  const handleCancel = () => {
    setPendingPayload(null);
    setPendingDiff(null);
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Import from a Feltly backup (.json), Goodreads export (.csv), or StoryGraph export (.csv).
        New books are added additively — your existing library is never overwritten.
      </p>

      {importError && (
        <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
          <span className="shrink-0 mt-0.5">⚠</span>
          <div className="flex-1 min-w-0">
            <p className="leading-snug">{importError}</p>
            <button
              onClick={openFilePicker}
              className="mt-1.5 text-xs font-medium underline underline-offset-2 hover:no-underline"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept=".json,.csv,application/json,text/csv"
        className="hidden"
        onChange={handleFile}
      />
      <Button
        variant="outline"
        className="rounded-full"
        disabled={parsing}
        onClick={openFilePicker}
      >
        <Upload className="h-3.5 w-3.5 mr-1.5" />
        {parsing ? "Reading file…" : "Choose file (.json or .csv)"}
      </Button>

      <ImportPreviewModal
        open={pendingPayload !== null}
        payload={pendingPayload}
        diff={pendingDiff}
        onApply={handleApply}
        onCancel={handleCancel}
      />
    </div>
  );
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} ${m === 1 ? "minute" : "minutes"} ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ${h === 1 ? "hour" : "hours"} ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} ${d === 1 ? "day" : "days"} ago`;
  const mo = Math.floor(d / 30);
  return `${mo} ${mo === 1 ? "month" : "months"} ago`;
}

type SyncedDevice = {
  id: string;
  deviceId: string;
  label: string | null;
  lastSeenAt: string;
  createdAt: string;
};

type HistoryEntry = {
  id: string;
  deviceLabel: string | null;
  createdAt: string;
  revision: number | null;
  data: { books?: Array<unknown> } & Record<string, unknown>;
};

function SyncedDevicesSection({ signOut }: { signOut: () => void }) {
  const { user } = useAuth();
  const currentBooks = useLibrary((s) => s.books);

  const [devices, setDevices] = useState<SyncedDevice[]>([]);
  const [removing, setRemoving] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [showBackups, setShowBackups] = useState(false);
  const [pendingRestore, setPendingRestore] = useState<HistoryEntry | null>(null);
  const [restoring, setRestoring] = useState(false);

  const thisDeviceId = getDeviceId();

  const load = () => {
    fetch("/api/library-snapshot/devices", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: SyncedDevice[] | null) => { if (data) setDevices(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const loadHistory = () => {
    setHistoryLoading(true);
    fetch("/api/library-snapshot/history", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: HistoryEntry[] | null) => { if (data) setHistory(data); })
      .catch(() => {})
      .finally(() => setHistoryLoading(false));
  };

  useEffect(() => {
    load();
    loadHistory();
    window.addEventListener("focus", load);
    window.addEventListener("feltly:library-pushed", load);
    window.addEventListener("feltly:library-pushed", loadHistory);
    return () => {
      window.removeEventListener("focus", load);
      window.removeEventListener("feltly:library-pushed", load);
      window.removeEventListener("feltly:library-pushed", loadHistory);
    };
  }, []);

  const handleRemove = async (device: SyncedDevice) => {
    if (device.deviceId === thisDeviceId) {
      signOut();
      return;
    }
    setRemoving(device.deviceId);
    try {
      const res = await fetch(`/api/library-snapshot/devices/${encodeURIComponent(device.deviceId)}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        toast.error("Couldn't remove device.");
        return;
      }
      setDevices((prev) => prev.filter((d) => d.deviceId !== device.deviceId));
      toast.success(`${device.label ?? "Device"} removed.`);
    } catch {
      toast.error("Couldn't remove device.");
    } finally {
      setRemoving(null);
    }
  };

  const handleRestoreConfirm = async () => {
    if (!pendingRestore || !user?.id) return;
    setRestoring(true);
    try {
      const res = await fetch(`/api/library-snapshot/history/${pendingRestore.id}/restore`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        toast.error("Restore failed. Please try again.");
        return;
      }
      const body = (await res.json()) as { row: { data: unknown; revision: number } };
      // Align local revision with server before applying (so any subsequent push won't 409)
      localStorage.setItem(`${REV_KEY_PREFIX}${user.id}`, String(body.row.revision));
      // Suppress the push the Zustand subscription would schedule — the server already
      // holds the restored data, so an immediate write-back is redundant and would
      // consume a history slot with identical content.
      suppressNextPushRef.current = true;
      // Apply the restored snapshot to the local Zustand store
      useLibrary.getState().applyRemoteSnapshot(
        body.row.data as Parameters<ReturnType<typeof useLibrary.getState>["applyRemoteSnapshot"]>[0]
      );
      const when = relativeTime(pendingRestore.createdAt);
      const from = pendingRestore.deviceLabel ? ` from ${pendingRestore.deviceLabel}` : "";
      toast.success(`Library restored to the backup${from}, ${when}.`);
      setPendingRestore(null);
      loadHistory();
      window.dispatchEvent(new CustomEvent("feltly:library-pushed"));
    } catch {
      toast.error("Restore failed. Please try again.");
    } finally {
      setRestoring(false);
    }
  };

  const pendingBookCount = pendingRestore?.data.books?.length ?? null;

  return (
    <>
      {/* Confirmation dialog */}
      {pendingRestore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-card border border-border/60 shadow-xl p-6 space-y-4">
            <h3 className="font-display text-xl">Restore this backup?</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              This will replace your current{" "}
              <span className="font-medium text-foreground">{currentBooks.length} book{currentBooks.length === 1 ? "" : "s"}</span>{" "}
              with{" "}
              {pendingBookCount !== null ? (
                <span className="font-medium text-foreground">{pendingBookCount} book{pendingBookCount === 1 ? "" : "s"}</span>
              ) : (
                "a snapshot"
              )}{" "}
              from{" "}
              {pendingRestore.deviceLabel && (
                <span className="font-medium text-foreground">{pendingRestore.deviceLabel}, </span>
              )}
              <span className="font-medium text-foreground">{relativeTime(pendingRestore.createdAt)}</span>.
              Your current library will be saved as a backup first, so this restore is itself undoable.
            </p>
            <div className="flex gap-2 pt-1">
              <Button
                size="sm"
                className="rounded-full flex-1"
                disabled={restoring}
                onClick={handleRestoreConfirm}
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                {restoring ? "Restoring…" : "Restore"}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="rounded-full flex-1"
                disabled={restoring}
                onClick={() => setPendingRestore(null)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      <section className="rounded-2xl bg-card/70 p-6 border border-border/40 space-y-4">
        <div className="flex items-center gap-2">
          <Monitor className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-display text-2xl">Synced devices</h2>
        </div>
        <p className="text-sm text-muted-foreground -mt-1">
          Browsers and devices that have synced your library.
        </p>

        {/* Devices list */}
        {loading ? (
          <p className="text-sm text-muted-foreground animate-pulse">Loading devices…</p>
        ) : devices.length <= 1 ? (
          <p className="text-sm text-muted-foreground rounded-xl border border-dashed border-border/60 px-4 py-5 text-center">
            Sign in on another device to see it here.
          </p>
        ) : (
          <ul className="space-y-2">
            {[...devices].sort((a, b) => new Date(b.lastSeenAt).getTime() - new Date(a.lastSeenAt).getTime()).map((d) => {
              const isThis = d.deviceId === thisDeviceId;
              return (
                <li
                  key={d.deviceId}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border/40 bg-background/40 px-3 py-2.5"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Monitor className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium truncate">{d.label ?? "Unknown device"}</span>
                        {isThis && (
                          <span className="rounded-full bg-foreground text-background text-[10px] px-2 py-0.5 uppercase tracking-widest shrink-0">
                            This device
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">Last sync {relativeTime(d.lastSeenAt)}</div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="rounded-full text-muted-foreground hover:text-destructive shrink-0 gap-1.5"
                    disabled={removing === d.deviceId}
                    onClick={() => handleRemove(d)}
                    aria-label={isThis ? "Sign out this device" : `Remove ${d.label ?? "device"}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span className="text-xs">Remove</span>
                  </Button>
                </li>
              );
            })}
          </ul>
        )}

        {/* Recent backups — expandable */}
        <div className="border-t border-border/40 pt-3">
          <button
            type="button"
            onClick={() => setShowBackups((v) => !v)}
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition w-full text-left"
          >
            <RotateCcw className="h-3.5 w-3.5 shrink-0" />
            Recent backups
            {showBackups ? (
              <ChevronUp className="h-3.5 w-3.5 ml-auto" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 ml-auto" />
            )}
          </button>

          {showBackups && (
            <div className="mt-3 space-y-2">
              {historyLoading ? (
                <p className="text-sm text-muted-foreground animate-pulse">Loading backups…</p>
              ) : history.length === 0 ? (
                <p className="text-sm text-muted-foreground rounded-xl border border-dashed border-border/60 px-4 py-4 text-center">
                  No backups yet. Backups are created automatically each time your library syncs.
                </p>
              ) : (
                <ul className="space-y-2">
                  {history.map((h) => (
                    <li
                      key={h.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-border/40 bg-background/40 px-3 py-2.5"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">
                          {h.deviceLabel ?? "Unknown device"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {relativeTime(h.createdAt)}
                          {h.data.books != null && (
                            <> · {(h.data.books as Array<unknown>).length} book{(h.data.books as Array<unknown>).length === 1 ? "" : "s"}</>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-full shrink-0 gap-1.5 text-xs"
                        onClick={() => setPendingRestore(h)}
                      >
                        <RotateCcw className="h-3 w-3" />
                        Restore
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </section>
    </>
  );
}

export default function Profile() {
  const { user, loading, signOut } = useAuth();
  const nav = useNavigate();
  const { locale, setLocale } = useLocale();
  const { books, reactionLog, spoilerStrictness, setSpoilerStrictness, journal, sessions, reflections, finishes, applyImportedData } = useLibrary();
  const dailyGoalPages = useLibrary((s) => s.dailyGoalPages);
  const setDailyGoal = useLibrary((s) => s.setDailyGoal);
  const dailyGoalMinutes = useLibrary((s) => s.dailyGoalMinutes);
  const setDailyGoalMinutes = useLibrary((s) => s.setDailyGoalMinutes);
  const readingFontScale = useLibrary((s) => s.readingFontScale);
  const setReadingFontScale = useLibrary((s) => s.setReadingFontScale);
  const readingDensity = useLibrary((s) => s.readingDensity);
  const setReadingDensity = useLibrary((s) => s.setReadingDensity);
  const privateLibrary = useLibrary((s) => s.privateLibrary);
  const setPrivateLibrary = useLibrary((s) => s.setPrivateLibrary);
  const defaultShareVisibility = useLibrary((s) => s.defaultShareVisibility);
  const setDefaultShareVisibility = useLibrary((s) => s.setDefaultShareVisibility);
  const age = useLibrary((s) => s.age);
  const setAge = useLibrary((s) => s.setAge);
  const parentalPin = useLibrary((s) => s.parentalPin);
  const setParentalPin = useLibrary((s) => s.setParentalPin);
  const [pinDraft, setPinDraft] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [pinStep, setPinStep] = useState<"view" | "set">("view");
  const [manageFamilyOpen, setManageFamilyOpen] = useState(false);
  const { profiles, activeProfileId } = useFamilyStore();
  const isPremium = usePremium((s) => s.isPremium);
  const plan = usePremium((s) => s.plan);
  const setPlan = usePremium((s) => s.setPlan);
  const togglePremium = usePremium((s) => s.togglePremium);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [signature, setSignature] = useState("");
  const [busy, setBusy] = useState(false);
  const [pushSupported, setPushSupported] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);

  useEffect(() => {
    if (!loading && !user) nav("/auth");
  }, [user, loading, nav]);

  useEffect(() => {
    setPushSupported(isPushSupported());
    isPushEnabled().then(setPushEnabled);
  }, []);

  useEffect(() => {
    if (!user) return;
    fetch("/api/profiles/me", { credentials: "include" })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data) {
          setDisplayName(data.displayName ?? "");
          setBio(data.bio ?? "");
          setSignature(data.moodSignature ?? "");
        }
      })
      .catch(() => {});
  }, [user?.id]);

  const save = async () => {
    if (!user) return;
    setBusy(true);
    try {
      const res = await fetch("/api/profiles/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ displayName, bio, moodSignature: signature }),
      });
      if (res.ok) toast.success("Profile saved.");
      else toast.error("Failed to save profile.");
    } catch { toast.error("Network error."); } finally { setBusy(false); }
  };

  const handlePushEnable = async () => {
    setPushBusy(true);
    const r = await subscribeToPush();
    setPushBusy(false);
    if (r.ok) { setPushEnabled(true); toast.success("Push notifications enabled"); }
    else toast.error(r.error || "Couldn't enable push");
  };
  const handlePushDisable = async () => {
    setPushBusy(true);
    await unsubscribeFromPush();
    setPushBusy(false);
    setPushEnabled(false);
    toast.message("Push notifications disabled");
  };
  const handlePushTest = async () => {
    const t = toast.loading("Sending test push…");
    const r = await sendTestPush();
    toast.dismiss(t);
    if (r.ok) toast.success("Sent — check your notifications");
    else toast.error(r.error || "Failed to send");
  };

  const topMood = Object.entries(
    books.reduce<Record<string, number>>((a, b) => ({ ...a, [b.mood]: (a[b.mood] || 0) + 1 }), {})
  ).sort((a, b) => b[1] - a[1])[0]?.[0];

  const _chapters = computeChapters({ books, sessions, reactionLog, reflections, journal });
  const topChapter = topUnlockedChapter(_chapters);
  const showBadgeFlair = useLibrary((s) => s.showBadgeFlair);
  const setShowBadgeFlair = useLibrary((s) => s.setShowBadgeFlair);
  const freeze = useLibrary((s) => s.freeze);
  const streak = useMemo(() => computeStreak(sessions, freeze), [sessions, freeze]);

  return (
    <AppShell>
      <div className="space-y-8 max-w-2xl">
        <header className="space-y-2 animate-fade-up">
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">You</p>
          <h1 className="font-display text-4xl sm:text-5xl leading-[1.05]">
            Your reading{" "}
            <span className="italic" style={{ color: "var(--mood-strong)" }}>
              self
            </span>
            .
          </h1>
          {showBadgeFlair && topChapter && (
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/70 backdrop-blur px-3 py-1.5 text-sm">
              <span className="text-base leading-none">{topChapter.emoji}</span>
              <span className="font-display">{topChapter.title}</span>
              <span className="text-xs text-muted-foreground">· latest chapter</span>
            </div>
          )}
        </header>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-2xl mood-surface p-4 border border-border/40">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Books</div>
            <div className="font-display text-2xl mt-1">{books.length}</div>
          </div>
          <div className="rounded-2xl mood-surface p-4 border border-border/40">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Reactions</div>
            <div className="font-display text-2xl mt-1">{reactionLog.length}</div>
          </div>
          <div className="rounded-2xl mood-surface p-4 border border-border/40">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Vibe</div>
            <div className="font-display text-2xl mt-1">
              {topMood ? `${MOODS[topMood as keyof typeof MOODS].emoji} ${MOODS[topMood as keyof typeof MOODS].label}` : "—"}
            </div>
          </div>
          <div
            className={cn(
              "rounded-2xl p-4 border border-border/40 flex flex-col justify-between",
              streak.current > 0 ? "bg-foreground text-background" : "mood-surface"
            )}
          >
            <div className="flex items-center justify-between">
              <div className="text-[10px] uppercase tracking-widest opacity-70">Streak</div>
              <Flame className={cn("h-3.5 w-3.5", streak.current > 0 ? "opacity-80" : "text-muted-foreground")} />
            </div>
            <div className="font-display text-2xl mt-1">
              {streak.current}
              <span className="text-sm font-normal opacity-60 ml-1">
                day{streak.current === 1 ? "" : "s"}
              </span>
            </div>
            {streak.longest > streak.current && streak.longest > 0 && (
              <div className="text-[10px] opacity-50 mt-0.5">Best: {streak.longest}</div>
            )}
          </div>
        </div>

        <section className="rounded-2xl bg-card/70 p-6 border border-border/40 space-y-4">
          <h2 className="font-display text-2xl">Profile</h2>
          <div className="space-y-1.5">
            <Label>Display name</Label>
            <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Mood signature</Label>
            <Input
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
              placeholder="e.g. melancholy with a streak of joy"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Bio</Label>
            <Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="A line about the kind of reader you are." />
          </div>
          {/* Language — inline */}
          <div className="space-y-1.5">
            <Label className="text-xs">Language</Label>
            <div className="flex flex-wrap gap-1.5">
              {LOCALES.map((l) => (
                <button
                  key={l.code}
                  onClick={() => setLocale(l.code as Locale)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-sm transition",
                    locale === l.code
                      ? "bg-foreground text-background border-foreground"
                      : "bg-white/60 border-border hover:bg-white"
                  )}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>
          {/* Walkthrough — replay first-run tour */}
          <div className="flex items-center justify-between gap-3 rounded-xl border border-border/40 bg-background/40 px-3 py-2.5">
            <div>
              <div className="text-sm font-medium">Show the walkthrough again</div>
              <div className="text-xs text-muted-foreground">
                Replay the short tour of Home, Sessions, Journal, and Insights.
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="rounded-full gap-1.5"
              onClick={() => window.dispatchEvent(new CustomEvent("feltly:open-walkthrough"))}
            >
              <Compass className="h-3.5 w-3.5" /> Show walkthrough
            </Button>
          </div>
          {/* Chapter flair — inline premium toggle */}
          <LockedFeature title="Chapter Flair">
            <div className="flex items-center justify-between gap-3 rounded-xl border border-border/40 bg-background/40 px-3 py-2.5">
              <div>
                <div className="text-sm font-medium">Show chapter flair</div>
                <div className="text-xs text-muted-foreground">Display your latest unlocked chapter on your profile header.</div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={showBadgeFlair}
                onClick={() => setShowBadgeFlair(!showBadgeFlair)}
                className={cn("relative h-6 w-11 rounded-full transition", showBadgeFlair ? "bg-foreground" : "bg-muted")}
              >
                <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-background transition", showBadgeFlair ? "left-[22px]" : "left-0.5")} />
              </button>
            </div>
          </LockedFeature>
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
            <Button variant="ghost" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-1" /> Sign out
            </Button>
            <div className="flex flex-wrap gap-2">
              <MoodSignatureCard />
              <Button onClick={save} disabled={busy} className="rounded-full">
                Save
              </Button>
            </div>
          </div>
        </section>

        <section className="rounded-2xl bg-card/70 p-6 border border-border/40 space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-display text-2xl">Spoiler guardrails</h2>
          </div>
          <p className="text-sm text-muted-foreground -mt-2">
            How carefully should the Companion avoid anything past your current page?
          </p>
          <div className="grid sm:grid-cols-3 gap-2">
            {([
              {
                key: "relaxed",
                title: "Relaxed",
                desc: "Vague tonal hints about later sections are OK if you ask.",
              },
              {
                key: "balanced",
                title: "Balanced",
                desc: "No spoilers, but the Companion will tell you it's holding back.",
              },
              {
                key: "strict",
                title: "Strict",
                desc: "Total lockdown. No mention of later chapters at all — even tone.",
              },
            ] as { key: SpoilerStrictness; title: string; desc: string }[]).map((opt) => (
              <button
                key={opt.key}
                onClick={() => {
                  setSpoilerStrictness(opt.key);
                  toast.success(`Spoiler guardrails: ${opt.title}`);
                }}
                className={cn(
                  "text-left rounded-xl border p-3 transition",
                  spoilerStrictness === opt.key
                    ? "border-foreground bg-foreground/5"
                    : "border-border bg-white/40 hover:bg-white/70"
                )}
              >
                <div className="font-display text-base">{opt.title}</div>
                <div className="text-xs text-muted-foreground mt-1 leading-snug">{opt.desc}</div>
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-2xl bg-card/70 p-6 border border-border/40 space-y-3">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-display text-2xl">Reader age</h2>
          </div>
          <p className="text-sm text-muted-foreground -mt-1">
            Tropely shows only books rated for your age and below on your shelves and in Discover.
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            <Input
              type="number"
              min={1}
              max={120}
              value={age ?? ""}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                setAge(isNaN(v) ? null : v);
              }}
              className="w-24"
              placeholder="Your age"
            />
            <div className="flex flex-wrap gap-1.5">
              {[8, 10, 13, 16, 18, 25].map((n) => (
                <button
                  key={n}
                  onClick={() => setAge(n)}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-xs transition",
                    age === n
                      ? "bg-foreground text-background border-foreground"
                      : "bg-white/60 border-border hover:bg-white"
                  )}
                >
                  {n}
                </button>
              ))}
              {age !== null && (
                <button
                  onClick={() => setAge(null)}
                  className="rounded-full border px-2.5 py-1 text-xs transition bg-white/60 border-border hover:bg-white text-muted-foreground"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </section>

        {age !== null && age <= 10 && (
          <section className="rounded-2xl bg-card/70 p-6 border border-border/40 space-y-3">
            <div className="flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-muted-foreground" />
              <h2 className="font-display text-2xl">Parental PIN</h2>
            </div>
            <p className="text-sm text-muted-foreground -mt-1">
              Lock social features behind a 4-digit PIN so a parent must approve access for readers aged 10 and under.
            </p>
            {pinStep === "view" ? (
              <div className="flex items-center gap-3 flex-wrap">
                {parentalPin ? (
                  <>
                    <span className="flex items-center gap-1.5 text-sm rounded-full border border-border/60 bg-background/60 px-3 py-1">
                      <Lock className="h-3.5 w-3.5" /> PIN set ••••
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full"
                      onClick={() => { setPinDraft(""); setPinConfirm(""); setPinStep("set"); }}
                    >
                      Change PIN
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="rounded-full text-muted-foreground"
                      onClick={() => { setParentalPin(undefined); toast.success("Parental PIN removed."); }}
                    >
                      Remove PIN
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    className="rounded-full gap-1.5"
                    onClick={() => { setPinDraft(""); setPinConfirm(""); setPinStep("set"); }}
                  >
                    <KeyRound className="h-3.5 w-3.5" /> Set PIN
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-2 max-w-xs">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">New 4-digit PIN</label>
                  <Input
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    value={pinDraft}
                    onChange={(e) => setPinDraft(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    placeholder="••••"
                    className="text-center tracking-[0.4em] font-display w-32"
                    autoFocus
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Confirm PIN</label>
                  <Input
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    value={pinConfirm}
                    onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    placeholder="••••"
                    className="text-center tracking-[0.4em] font-display w-32"
                  />
                </div>
                {pinDraft.length === 4 && pinConfirm.length === 4 && pinDraft !== pinConfirm && (
                  <p className="text-xs text-red-500">PINs don't match.</p>
                )}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="rounded-full"
                    disabled={pinDraft.length < 4 || pinDraft !== pinConfirm}
                    onClick={() => {
                      setParentalPin(pinDraft);
                      setPinStep("view");
                      toast.success("Parental PIN saved.");
                    }}
                  >
                    <ShieldCheck className="h-3.5 w-3.5 mr-1" /> Save
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="rounded-full"
                    onClick={() => setPinStep("view")}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </section>
        )}

        <section className="reader-card rounded-2xl bg-card/70 border border-border/40 reader-stack">
          <div className="flex items-center gap-2">
            <Type className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-display text-2xl">Reading preferences</h2>
          </div>
          <p className="text-sm text-muted-foreground -mt-1">
            Tune how text feels on long-form screens — book summaries, journal entries, and highlights.
          </p>

          <div className="space-y-1.5">
            <Label className="text-xs">Font size</Label>
            <div className="flex flex-wrap gap-1.5">
              {([
                { key: "S", value: 0.92 },
                { key: "M", value: 1 },
                { key: "L", value: 1.12 },
                { key: "XL", value: 1.22 },
              ] as const).map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setReadingFontScale(opt.value)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 transition",
                    Math.abs((readingFontScale ?? 1) - opt.value) < 0.01
                      ? "bg-foreground text-background border-foreground"
                      : "bg-white/60 border-border hover:bg-white"
                  )}
                  style={{ fontSize: `${opt.value}rem` }}
                  aria-label={`Font size ${opt.key}`}
                >
                  Aa
                </button>
              ))}
              <span className="self-center text-xs text-muted-foreground">
                Currently {Math.round((readingFontScale ?? 1) * 100)}%
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Density</Label>
            <div className="grid grid-cols-3 gap-2">
              {([
                { key: "compact", title: "Compact", desc: "Tighter rhythm." },
                { key: "default", title: "Default", desc: "Balanced." },
                { key: "comfortable", title: "Comfortable", desc: "More breathing room." },
              ] as const).map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setReadingDensity(opt.key)}
                  className={cn(
                    "text-left rounded-xl border p-3 transition",
                    (readingDensity ?? "default") === opt.key
                      ? "border-foreground bg-foreground/5"
                      : "border-border bg-white/40 hover:bg-white/70"
                  )}
                >
                  <div className="font-display text-base">{opt.title}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border/40 bg-background/40 p-4">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Preview</div>
            <div className="prose-reader text-foreground/90">
              The lighthouse keeper folded the letter twice and pressed it into
              the small lacquered box, the way she always did at the end of a
              chapter — a quiet ritual against forgetting.
            </div>
          </div>
        </section>

        <section className="rounded-2xl bg-card/70 p-6 border border-border/40 space-y-3">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-display text-2xl">Daily reading goal</h2>
          </div>
          <p className="text-sm text-muted-foreground -mt-1">
            Hit this many pages in a day to keep your streak alive.
          </p>
          <div className="flex items-center gap-3">
            <Input
              type="number"
              min={1}
              max={500}
              value={dailyGoalPages}
              onChange={(e) => setDailyGoal(parseInt(e.target.value || "0", 10))}
              className="w-28"
            />
            <span className="text-sm text-muted-foreground">pages / day</span>
            <div className="ml-auto flex gap-1.5">
              {[10, 20, 40].map((n) => (
                <button
                  key={n}
                  onClick={() => setDailyGoal(n)}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-xs transition",
                    dailyGoalPages === n
                      ? "bg-foreground text-background border-foreground"
                      : "bg-white/60 border-border hover:bg-white"
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3 pt-1">
            <Input
              type="number"
              min={0}
              max={480}
              value={dailyGoalMinutes}
              onChange={(e) => setDailyGoalMinutes(parseInt(e.target.value || "0", 10))}
              className="w-28"
            />
            <span className="text-sm text-muted-foreground">min / day</span>
            <div className="ml-auto flex gap-1.5">
              {[15, 30, 60].map((n) => (
                <button
                  key={n}
                  onClick={() => setDailyGoalMinutes(n)}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-xs transition",
                    dailyGoalMinutes === n
                      ? "bg-foreground text-background border-foreground"
                      : "bg-white/60 border-border hover:bg-white"
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-2xl bg-card/70 p-6 border border-border/40 space-y-4">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-display text-2xl">Notifications</h2>
          </div>
          <p className="text-sm text-muted-foreground -mt-1">
            A quiet daily digest of what your circle felt, plus push nudges for buddy reads,
            Reading Twins, and your best reading hour.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              className="rounded-full"
              onClick={async () => {
                if (!user) return;
                const t = toast.loading("Building your digest…");
                toast.dismiss(t);
                toast.message("Daily digest will be available when push notifications are configured.");
              }}
            >
              <Bell className="h-3.5 w-3.5 mr-1.5" /> Test daily digest
            </Button>
            {!pushSupported ? (
              <p className="text-xs text-muted-foreground self-center">Push not supported on this browser.</p>
            ) : pushEnabled ? (
              <>
                <Button variant="outline" className="rounded-full" onClick={handlePushTest}>
                  <Bell className="h-3.5 w-3.5 mr-1.5" /> Test push
                </Button>
                <Button variant="ghost" className="rounded-full" onClick={handlePushDisable} disabled={pushBusy}>
                  <BellOff className="h-3.5 w-3.5 mr-1.5" /> Turn off push
                </Button>
              </>
            ) : (
              <Button className="rounded-full" onClick={handlePushEnable} disabled={pushBusy}>
                <Bell className="h-3.5 w-3.5 mr-1.5" /> Enable push
              </Button>
            )}
          </div>
        </section>

        <SyncedDevicesSection signOut={signOut} />

        {/* Family profiles */}
        <section className="rounded-2xl bg-card/70 p-6 border border-border/40 space-y-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" style={{ color: "var(--mood-strong)" }} />
            <h2 className="font-display text-2xl">Family profiles</h2>
          </div>
          <p className="text-sm text-muted-foreground -mt-1">
            Give each family member their own reading library, shelves, and streak.
          </p>
          <div className="flex flex-wrap gap-2 items-center">
            {profiles.map((p) => (
              <div
                key={p.id}
                className={cn(
                  "flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm",
                  p.id === activeProfileId
                    ? "bg-foreground text-background border-foreground"
                    : "border-border/60 text-muted-foreground"
                )}
              >
                <span className="text-base leading-none">{p.emoji}</span>
                {p.name}
              </div>
            ))}
          </div>
          <Button
            variant="outline"
            className="rounded-full gap-2"
            onClick={() => setManageFamilyOpen(true)}
          >
            <Users className="h-4 w-4" /> Manage family
          </Button>
          <ManageFamilySheet open={manageFamilyOpen} onClose={() => setManageFamilyOpen(false)} />
        </section>

        <section className="rounded-2xl bg-card/70 p-6 border border-border/40 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" style={{ color: "var(--mood-strong)" }} />
              <h2 className="font-display text-2xl">Premium</h2>
            </div>
            {isPremium && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/80 px-2.5 py-1 text-[10px] uppercase tracking-widest">
                <Sparkles className="h-2.5 w-2.5" style={{ color: "var(--mood-strong)" }} />
                {plan === "lifetime" ? "Lifetime" : plan === "annual" ? "Annual" : "Monthly"}
              </span>
            )}
          </div>

          <ul className="text-xs text-muted-foreground space-y-1 ml-1">
            <li>· AI Companion — unlimited daily messages (free: 5/day)</li>
            <li>· Scan physical books — autofill from a cover photo or ISBN</li>
            <li>· Deep insights — slumps, mood vs genre, monthly reports, Reading DNA</li>
            <li>· Mood Playlist — curated Spotify &amp; Apple Music playlists per book mood</li>
            <li>· Reading Personality — your archetype derived from your full library</li>
            <li>· Estimated Finish Date — ETA based on your real reading pace</li>
            <li>· Custom shelf names — rename Reading / Finished / Want to Read tabs</li>
            <li>· Collections — group books into themes, series, or moods</li>
            <li>· Streak freezes — earn weekly shields against missed reading days</li>
            <li>· Smart reminders — daily notifications at your best reading hour</li>
            <li>· Cross-device sync — position synced across all your devices</li>
            <li>· TBR Mood Intent — tag how you hope to feel before starting a book</li>
            <li>· Buddy reads — unlimited rooms + members + chapter discussions</li>
            <li>· Focus mode — fullscreen distraction-free reading with session timer</li>
            <li>· Bookshelf customization — themed shelf styles and accents</li>
            <li>· Bulk library import from Goodreads / StoryGraph CSV</li>
          </ul>

          {/* Plan tiers */}
          <div className="grid gap-2 sm:grid-cols-3">
            {([
              { key: "monthly", label: "Monthly", price: "$6", sub: "per month", badge: null },
              { key: "annual",  label: "Annual",  price: "$35", sub: "per year · save 51%", badge: "Popular" },
              { key: "lifetime", label: "Lifetime", price: "$75", sub: "one-time payment", badge: "Best value" },
            ] as const).map(({ key, label, price, sub, badge }) => {
              const active = isPremium && plan === key;
              return (
                <div
                  key={key}
                  className={cn(
                    "relative rounded-xl border p-4 space-y-2 transition",
                    active
                      ? "border-foreground bg-foreground/[0.04]"
                      : "border-border/50 bg-background/40"
                  )}
                >
                  {badge && (
                    <span className="absolute -top-2 right-3 rounded-full border border-border/60 bg-background px-2 py-0.5 text-[9px] uppercase tracking-widest">
                      {badge}
                    </span>
                  )}
                  <div>
                    <div className="text-xs font-medium uppercase tracking-widest text-muted-foreground">{label}</div>
                    <div className="font-display text-2xl mt-0.5">{price}</div>
                    <div className="text-[11px] text-muted-foreground">{sub}</div>
                  </div>
                  {key === "lifetime" && (
                    <ul className="text-[10px] text-muted-foreground space-y-0.5">
                      <li>· All premium features, forever</li>
                      <li>· No recurring charges</li>
                      <li>· Future features included</li>
                    </ul>
                  )}
                  <Button
                    size="sm"
                    variant={active ? "default" : "outline"}
                    className="w-full rounded-full text-xs"
                    onClick={() => {
                      if (active) {
                        setPlan(null);
                        toast.success("Premium disabled (dev)");
                      } else {
                        setPlan(key);
                        toast.success(`${label} plan activated (dev)`);
                      }
                    }}
                  >
                    {active ? "Active — disable (dev)" : `Select ${label} (dev)`}
                  </Button>
                </div>
              );
            })}
          </div>
          <p className="text-[10px] text-muted-foreground">
            Purchases are handled by the App Store / Play Store. Dev buttons simulate a successful payment.
          </p>
        </section>

        <section className="rounded-2xl bg-card/70 p-6 border border-border/40 space-y-4">
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-display text-2xl">Library tools</h2>
          </div>
          <LockedFeature description="Customize your bookshelf with themed backgrounds and accents.">
            <ShelfCustomizer />
          </LockedFeature>
        </section>

        <section className="rounded-2xl bg-card/70 p-6 border border-border/40 space-y-4">
          <div className="flex items-center gap-2">
            <EyeOff className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-display text-2xl">Data &amp; privacy</h2>
          </div>
          <p className="text-sm text-muted-foreground -mt-1">
            Export or restore your library, and choose how visible your reading life is.
          </p>

          {/* Export */}
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Export</p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                className="rounded-full"
                onClick={() => {
                  downloadExport(buildExportPayload(useLibrary.getState()), "json");
                  toast.success("Export downloaded.");
                }}
              >
                <Download className="h-3.5 w-3.5 mr-1.5" /> Full export (JSON)
              </Button>
              <Button
                variant="outline"
                className="rounded-full"
                onClick={() => {
                  downloadExport(buildExportPayload(useLibrary.getState()), "csv");
                  toast.success("Library CSV downloaded.");
                }}
              >
                <Download className="h-3.5 w-3.5 mr-1.5" /> Library (CSV)
              </Button>
              <Button
                variant="outline"
                className="rounded-full"
                onClick={() => {
                  downloadHighlightsCsv(buildExportPayload(useLibrary.getState()));
                  toast.success("Highlights CSV downloaded.");
                }}
              >
                <Quote className="h-3.5 w-3.5 mr-1.5" /> Highlights (CSV)
              </Button>
            </div>
          </div>

          {/* Restore */}
          <div className="space-y-1.5 border-t border-border/40 pt-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Restore from backup</p>
            <RestoreSection
              existingBooks={books}
              existingFinishes={finishes}
              applyImportedData={applyImportedData}
            />
          </div>

          {/* Privacy */}
          <div className="space-y-3 border-t border-border/40 pt-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Visibility</p>
            <label className="flex items-start gap-3 rounded-xl border border-border/50 p-3 cursor-pointer hover:bg-foreground/[0.02] transition">
              <input
                type="checkbox"
                checked={privateLibrary}
                onChange={(e) => setPrivateLibrary(e.target.checked)}
                className="mt-1"
              />
              <div>
                <div className="text-sm font-medium">Private library</div>
                <div className="text-xs text-muted-foreground">
                  Hide your shelves and stop new activity from being shared. Existing posts stay until deleted.
                </div>
              </div>
            </label>
            <div className="space-y-1.5">
              <Label className="text-xs">Default share visibility</Label>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { key: "public", title: "Everyone" },
                  { key: "followers", title: "Followers" },
                  { key: "private", title: "Only me" },
                ] as const).map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => { setDefaultShareVisibility(opt.key); toast.success(`Default visibility: ${opt.title}`); }}
                    className={cn("rounded-xl border px-3 py-2 text-sm transition", defaultShareVisibility === opt.key ? "border-foreground bg-foreground/5" : "border-border bg-background/40 hover:bg-background")}
                  >
                    {opt.title}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
