import { Router } from "express";
import { db, notificationsTable, pushSubscriptionsTable } from "@workspace/db";
import { eq, and, inArray } from "drizzle-orm";
import { requireAuth, errMsg, type AuthedRequest } from "../middlewares/authMiddleware";
import { sendWebPush, isWebPushConfigured } from "../lib/webpush";

const KNOWN_CHANGELOG_IDS = new Set([
  "family-profiles",
  "tropely-wrap",
  "reading-twins",
  "buddy-reads",
  "quick-log",
  "discover-filters",
  "cross-device-sync",
  "audiobook-autofinish",
  "citations-hover",
  "companion-memory",
]);

const router = Router();

router.get("/notifications", requireAuth, async (req, res) => {
  const { userId } = req as AuthedRequest;
  try {
    const rows = await db.select().from(notificationsTable).where(eq(notificationsTable.userId, userId));
    res.json(rows);
  } catch (e: unknown) {
    res.status(500).json({ error: errMsg(e) });
  }
});

router.patch("/notifications/read", requireAuth, async (req, res) => {
  const { userId } = req as AuthedRequest;
  try {
    const { ids } = req.body as { ids?: string[] };
    if (!ids?.length) { res.json({ updated: 0 }); return; }
    await db
      .update(notificationsTable)
      .set({ readAt: new Date() })
      .where(and(inArray(notificationsTable.id, ids), eq(notificationsTable.userId, userId)));
    res.json({ updated: ids.length });
  } catch (e: unknown) {
    res.status(500).json({ error: errMsg(e) });
  }
});

router.delete("/notifications/:id", requireAuth, async (req, res) => {
  const { userId } = req as AuthedRequest;
  try {
    const id = req.params.id as string;
    await db
      .delete(notificationsTable)
      .where(and(eq(notificationsTable.id, id), eq(notificationsTable.userId, userId)));
    res.json({ deleted: true });
  } catch (e: unknown) {
    res.status(500).json({ error: errMsg(e) });
  }
});

router.delete("/notifications", requireAuth, async (req, res) => {
  const { userId } = req as AuthedRequest;
  try {
    await db.delete(notificationsTable).where(eq(notificationsTable.userId, userId));
    res.json({ deleted: true });
  } catch (e: unknown) {
    res.status(500).json({ error: errMsg(e) });
  }
});

router.post("/changelog/notify", requireAuth, async (req, res) => {
  const { userId } = req as AuthedRequest;
  try {
    const { latestEntryId, latestEntryTitle } = req.body as {
      latestEntryId?: string;
      latestEntryTitle?: string;
    };
    if (!latestEntryId || !latestEntryTitle) {
      res.status(400).json({ error: "latestEntryId and latestEntryTitle are required" });
      return;
    }

    if (!KNOWN_CHANGELOG_IDS.has(latestEntryId)) {
      res.status(400).json({ error: "Unknown changelog entry id" });
      return;
    }

    const inserted = await db
      .insert(notificationsTable)
      .values({
        userId,
        kind: "changelog",
        body: `New in Tropely: ${latestEntryTitle}`,
        refId: latestEntryId,
      })
      .onConflictDoNothing()
      .returning({ id: notificationsTable.id });

    if (inserted.length === 0) {
      res.json({ notified: false, reason: "already_notified" });
      return;
    }

    let pushSent = 0;
    if (isWebPushConfigured()) {
      const subs = await db
        .select()
        .from(pushSubscriptionsTable)
        .where(and(eq(pushSubscriptionsTable.userId, userId), eq(pushSubscriptionsTable.enabled, true)));

      await Promise.all(
        subs.map(async (s) => {
          const r = await sendWebPush(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            {
              title: "New in Tropely ✨",
              body: latestEntryTitle,
              tag: `changelog-${latestEntryId}`,
              url: "/?changelog=1",
            },
          );
          if (r.ok) pushSent++;
        }),
      );
    }

    res.json({ notified: true, pushSent });
  } catch (e: unknown) {
    res.status(500).json({ error: errMsg(e) });
  }
});

export default router;
