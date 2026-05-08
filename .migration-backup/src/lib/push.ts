import { supabase } from "@/integrations/supabase/client";

export const VAPID_PUBLIC_KEY =
  "BHQOQjZvc8_vMhR032s2IkfgLjndS7fw8YzG8ZxK1yao9ULvZvY4l9RmeAeaRwMTJSb-o_VI_0v23ol39oRDB9Q";

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const buf = new ArrayBuffer(raw.length);
  const out = new Uint8Array(buf);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export function isPushSupported(): boolean {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

export async function getPushPermission(): Promise<NotificationPermission> {
  if (!isPushSupported()) return "denied";
  return Notification.permission;
}

export async function subscribeToPush(): Promise<{ ok: boolean; error?: string }> {
  try {
    if (!isPushSupported()) return { ok: false, error: "Push not supported on this device" };
    const reg = await navigator.serviceWorker.ready;
    const perm = await Notification.requestPermission();
    if (perm !== "granted") return { ok: false, error: "Permission denied" };

    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    }
    const json: any = sub.toJSON();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Not signed in" };
    const { error } = await supabase.from("push_subscriptions").upsert(
      {
        user_id: user.id,
        endpoint: json.endpoint,
        p256dh: json.keys?.p256dh ?? "",
        auth: json.keys?.auth ?? "",
        user_agent: navigator.userAgent.slice(0, 200),
      },
      { onConflict: "endpoint" }
    );
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Failed to enable push" };
  }
}

export async function unsubscribeFromPush(): Promise<void> {
  try {
    if (!isPushSupported()) return;
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      const endpoint = sub.endpoint;
      await sub.unsubscribe();
      await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
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

export async function sendTestPush(): Promise<{ ok: boolean; error?: string }> {
  const { data, error } = await supabase.functions.invoke("send-push", {
    body: { test: true, title: "Feltly", body: "Push notifications are working ✨" },
  });
  if (error) return { ok: false, error: error.message };
  return { ok: !!(data as any)?.ok };
}