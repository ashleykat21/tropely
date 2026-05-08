import { db, pushSubscriptionsTable } from "@workspace/db";
import { and, eq, isNotNull } from "drizzle-orm";
import { sendWebPush, isWebPushConfigured } from "./webpush";
import { logger } from "./logger";

const TICK_MS = 60_000;

function userLocalHour(timezoneOffsetMin: number | null): number {
  const now = new Date();
  const utcMs = now.getTime();
  const offsetMs = (timezoneOffsetMin ?? 0) * -60_000;
  const local = new Date(utcMs + offsetMs);
  return local.getUTCHours();
}

async function tick() {
  if (!isWebPushConfigured()) return;
  try {
    const due = await db
      .select()
      .from(pushSubscriptionsTable)
      .where(
        and(
          eq(pushSubscriptionsTable.enabled, true),
          isNotNull(pushSubscriptionsTable.reminderHour),
        ),
      );
    const now = new Date();
    const todayKey = `${now.getUTCFullYear()}-${now.getUTCMonth()}-${now.getUTCDate()}`;
    for (const sub of due) {
      if (sub.reminderHour == null) continue;
      const hourLocal = userLocalHour(sub.timezoneOffset);
      if (hourLocal !== sub.reminderHour) continue;
      // Already sent today?
      if (sub.lastSentAt) {
        const last = new Date(sub.lastSentAt);
        const lastKey = `${last.getUTCFullYear()}-${last.getUTCMonth()}-${last.getUTCDate()}`;
        if (lastKey === todayKey) continue;
      }
      const label = sub.reminderLabel ?? `${sub.reminderHour}:00`;
      const r = await sendWebPush(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        {
          title: "Tropely — your reading hour",
          body: `You read best around ${label}. A few quiet pages?`,
          tag: "reading-reminder",
          url: "/",
        },
      );
      if (r.ok) {
        await db
          .update(pushSubscriptionsTable)
          .set({ lastSentAt: now })
          .where(eq(pushSubscriptionsTable.endpoint, sub.endpoint));
      } else if (r.statusCode === 404 || r.statusCode === 410) {
        // Subscription is dead — clean up
        await db
          .delete(pushSubscriptionsTable)
          .where(eq(pushSubscriptionsTable.endpoint, sub.endpoint));
      }
    }
  } catch (e) {
    logger.error({ err: e }, "reminder tick failed");
  }
}

let started = false;
export function startReminderScheduler() {
  if (started) return;
  started = true;
  // Stagger first run slightly after boot
  setTimeout(() => {
    void tick();
    setInterval(() => void tick(), TICK_MS);
  }, 5_000);
  logger.info("reminder scheduler started");
}
