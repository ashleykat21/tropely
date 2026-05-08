function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const buf = new ArrayBuffer(raw.length);
  const out = new Uint8Array(buf);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

let cachedVapidKey: string | null = (import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined) ?? null;

async function getVapidKey(): Promise<string | null> {
  if (cachedVapidKey) return cachedVapidKey;
  try {
    const res = await fetch("/api/push/vapid", { credentials: "include" });
    if (!res.ok) return null;
    const data = (await res.json()) as { publicKey?: string; configured?: boolean };
    if (data.publicKey && data.configured) {
      cachedVapidKey = data.publicKey;
      return cachedVapidKey;
    }
  } catch {
    // ignore
  }
  return null;
}

function subscriptionToJSON(sub: PushSubscription) {
  const json = sub.toJSON();
  return {
    endpoint: json.endpoint!,
    keys: {
      p256dh: json.keys?.p256dh ?? "",
      auth: json.keys?.auth ?? "",
    },
  };
}

export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export async function getPushPermission(): Promise<NotificationPermission> {
  if (!isPushSupported()) return "denied";
  return Notification.permission;
}

export async function subscribeToPush(opts?: {
  reminderHour?: number;
  reminderLabel?: string;
}): Promise<{ ok: boolean; error?: string; endpoint?: string }> {
  try {
    if (!isPushSupported()) return { ok: false, error: "Push not supported on this device" };
    const reg = await navigator.serviceWorker.ready;
    const perm = await Notification.requestPermission();
    if (perm !== "granted") return { ok: false, error: "Permission denied" };

    const vapidKey = await getVapidKey();
    if (!vapidKey) return { ok: false, error: "Push server not configured" };

    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });
    }
    const json = subscriptionToJSON(sub);
    const tzOffset = new Date().getTimezoneOffset();
    const res = await fetch("/api/push/subscribe", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subscription: json,
        reminderHour: opts?.reminderHour ?? null,
        reminderLabel: opts?.reminderLabel ?? null,
        timezoneOffset: tzOffset,
      }),
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      return { ok: false, error: data.error || "Server registration failed" };
    }
    return { ok: true, endpoint: json.endpoint };
  } catch (e: unknown) {
    return { ok: false, error: (e instanceof Error ? e.message : null) || "Failed to enable push" };
  }
}

export async function setReminderPreferences(
  reminderHour: number | null,
  reminderLabel: string | null,
): Promise<{ ok: boolean; error?: string }> {
  try {
    if (!isPushSupported()) return { ok: false, error: "Push not supported" };
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (!sub) return { ok: false, error: "Not subscribed to push" };
    const tzOffset = new Date().getTimezoneOffset();
    const res = await fetch("/api/push/preferences", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        endpoint: sub.endpoint,
        reminderHour,
        reminderLabel,
        timezoneOffset: tzOffset,
      }),
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      return { ok: false, error: data.error || "Failed to save preferences" };
    }
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: (e instanceof Error ? e.message : null) || "Failed" };
  }
}

export async function unsubscribeFromPush(): Promise<void> {
  try {
    if (!isPushSupported()) return;
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      try {
        await fetch("/api/push/unsubscribe", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
      } catch {}
      await sub.unsubscribe();
    }
  } catch {}
}

export async function isPushEnabled(): Promise<boolean> {
  if (!isPushSupported()) return false;
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    return !!sub && Notification.permission === "granted";
  } catch {
    return false;
  }
}

export type PushStatus = {
  configured: boolean;
  devices: number;
  active: number;
  lastSentAt: number | null;
  nextReminderHour: number | null;
};

export async function getPushStatus(): Promise<PushStatus | null> {
  try {
    const res = await fetch("/api/push/status", { credentials: "include" });
    if (!res.ok) return null;
    return (await res.json()) as PushStatus;
  } catch {
    return null;
  }
}

export async function sendTestPush(): Promise<{ ok: boolean; error?: string }> {
  if (!isPushSupported()) return { ok: false, error: "Push not supported on this device." };
  if (Notification.permission !== "granted") {
    return { ok: false, error: "Permission not granted — enable push first." };
  }
  try {
    const res = await fetch("/api/push/test", {
      method: "POST",
      credentials: "include",
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      return { ok: false, error: data.error || "Failed to send test." };
    }
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: (e instanceof Error ? e.message : null) || "Failed to send." };
  }
}
