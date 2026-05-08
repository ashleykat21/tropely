import webpush from "web-push";
import { logger } from "./logger";

const publicKey = process.env.VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const subject = process.env.VAPID_SUBJECT ?? "mailto:hello@tropely.app";

let configured = false;
if (publicKey && privateKey) {
  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
} else {
  logger.warn("VAPID keys not configured — web push disabled");
}

export const isWebPushConfigured = () => configured;
export const vapidPublicKey = publicKey ?? "";

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
};

export async function sendWebPush(
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  payload: PushPayload,
): Promise<{ ok: true } | { ok: false; statusCode?: number; error: string }> {
  if (!configured) return { ok: false, error: "Web push not configured" };
  try {
    await webpush.sendNotification(
      subscription as webpush.PushSubscription,
      JSON.stringify(payload),
      { TTL: 60 * 60 },
    );
    return { ok: true };
  } catch (e: unknown) {
    const err = e as { statusCode?: number; body?: string; message?: string };
    return {
      ok: false,
      statusCode: err.statusCode,
      error: err.body ?? err.message ?? "send failed",
    };
  }
}
