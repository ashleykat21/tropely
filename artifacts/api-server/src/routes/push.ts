import { Router } from "express";
import { db, pushSubscriptionsTable } from "@workspace/db";
import { and, eq } from "drizzle-orm";
import { requireAuth, errMsg, type AuthedRequest } from "../middlewares/authMiddleware";
import { isWebPushConfigured, sendWebPush, vapidPublicKey } from "../lib/webpush";

const router = Router();

router.get("/push/vapid", (_req, res) => {
  res.json({ publicKey: vapidPublicKey, configured: isWebPushConfigured() });
});

router.post("/push/subscribe", requireAuth, async (req, res) => {
  const { userId } = req as AuthedRequest;
  try {
    const { subscription, reminderHour, reminderLabel, timezoneOffset } = req.body as {
      subscription: { endpoint: string; keys: { p256dh: string; auth: string } };
      reminderHour?: number | null;
      reminderLabel?: string | null;
      timezoneOffset?: number | null;
    };
    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      res.status(400).json({ error: "invalid subscription" });
      return;
    }
    const existing = await db
      .select()
      .from(pushSubscriptionsTable)
      .where(eq(pushSubscriptionsTable.endpoint, subscription.endpoint))
      .limit(1);
    const now = new Date();
    if (existing[0]) {
      const [updated] = await db
        .update(pushSubscriptionsTable)
        .set({
          userId,
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
          enabled: true,
          reminderHour: reminderHour ?? existing[0].reminderHour,
          reminderLabel: reminderLabel ?? existing[0].reminderLabel,
          timezoneOffset: timezoneOffset ?? existing[0].timezoneOffset,
          updatedAt: now,
        })
        .where(eq(pushSubscriptionsTable.endpoint, subscription.endpoint))
        .returning();
      res.json(updated);
      return;
    }
    const [row] = await db
      .insert(pushSubscriptionsTable)
      .values({
        userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        enabled: true,
        reminderHour: reminderHour ?? null,
        reminderLabel: reminderLabel ?? null,
        timezoneOffset: timezoneOffset ?? null,
      })
      .returning();
    res.json(row);
  } catch (e: unknown) {
    res.status(500).json({ error: errMsg(e) });
  }
});

router.post("/push/preferences", requireAuth, async (req, res) => {
  const { userId } = req as AuthedRequest;
  try {
    const { endpoint, reminderHour, reminderLabel, timezoneOffset } = req.body as {
      endpoint: string;
      reminderHour: number | null;
      reminderLabel?: string | null;
      timezoneOffset?: number | null;
    };
    if (!endpoint) {
      res.status(400).json({ error: "endpoint required" });
      return;
    }
    const [updated] = await db
      .update(pushSubscriptionsTable)
      .set({
        reminderHour,
        reminderLabel: reminderLabel ?? null,
        timezoneOffset: timezoneOffset ?? null,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(pushSubscriptionsTable.endpoint, endpoint),
          eq(pushSubscriptionsTable.userId, userId),
        ),
      )
      .returning();
    if (!updated) {
      res.status(404).json({ error: "subscription not found" });
      return;
    }
    res.json(updated);
  } catch (e: unknown) {
    res.status(500).json({ error: errMsg(e) });
  }
});

router.post("/push/unsubscribe", requireAuth, async (req, res) => {
  const { userId } = req as AuthedRequest;
  try {
    const { endpoint } = req.body as { endpoint: string };
    if (!endpoint) {
      res.status(400).json({ error: "endpoint required" });
      return;
    }
    await db
      .delete(pushSubscriptionsTable)
      .where(
        and(
          eq(pushSubscriptionsTable.endpoint, endpoint),
          eq(pushSubscriptionsTable.userId, userId),
        ),
      );
    res.json({ ok: true });
  } catch (e: unknown) {
    res.status(500).json({ error: errMsg(e) });
  }
});

router.get("/push/status", requireAuth, async (req, res) => {
  const { userId } = req as AuthedRequest;
  try {
    const subs = await db
      .select()
      .from(pushSubscriptionsTable)
      .where(eq(pushSubscriptionsTable.userId, userId));
    const active = subs.filter((s) => s.enabled).length;
    const lastSentAt = subs.reduce<number | null>((acc, s) => {
      const t = s.lastSentAt ? new Date(s.lastSentAt).getTime() : null;
      if (t === null) return acc;
      if (acc === null || t > acc) return t;
      return acc;
    }, null);
    const nextReminderHour = subs.find((s) => s.reminderHour !== null)?.reminderHour ?? null;
    res.json({
      configured: isWebPushConfigured(),
      devices: subs.length,
      active,
      lastSentAt,
      nextReminderHour,
    });
  } catch (e: unknown) {
    res.status(500).json({ error: errMsg(e) });
  }
});

router.post("/push/test", requireAuth, async (req, res) => {
  const { userId } = req as AuthedRequest;
  try {
    const subs = await db
      .select()
      .from(pushSubscriptionsTable)
      .where(
        and(eq(pushSubscriptionsTable.userId, userId), eq(pushSubscriptionsTable.enabled, true)),
      );
    if (subs.length === 0) {
      res.status(404).json({ error: "No active push subscriptions for this user" });
      return;
    }
    const results = await Promise.all(
      subs.map(async (s) => {
        const r = await sendWebPush(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          {
            title: "Tropely — test notification ✓",
            body: "Server-sent push is working. Reading reminders will arrive even when the app is closed.",
            tag: "test",
            url: "/",
          },
        );
        if (!r.ok && (r.statusCode === 404 || r.statusCode === 410)) {
          await db
            .delete(pushSubscriptionsTable)
            .where(eq(pushSubscriptionsTable.endpoint, s.endpoint));
        }
        return r;
      }),
    );
    const sent = results.filter((r) => r.ok).length;
    res.json({ sent, total: results.length });
  } catch (e: unknown) {
    res.status(500).json({ error: errMsg(e) });
  }
});

export default router;
