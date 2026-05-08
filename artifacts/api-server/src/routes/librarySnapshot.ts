import { Router } from "express";
import { db, librarySnapshotsTable, syncedDevicesTable, librarySnapshotHistoryTable } from "@workspace/db";
import { eq, and, desc, inArray } from "drizzle-orm";
import { requireAuth, errMsg, type AuthedRequest } from "../middlewares/authMiddleware";

const HISTORY_LIMIT = 5;

const router = Router();

async function saveToHistory(userId: string, existing: typeof librarySnapshotsTable.$inferSelect) {
  await db.insert(librarySnapshotHistoryTable).values({
    userId,
    data: existing.data,
    deviceLabel: existing.deviceLabel,
    revision: existing.revision,
  });
  // Prune: keep only the most recent HISTORY_LIMIT rows per user
  const all = await db
    .select({ id: librarySnapshotHistoryTable.id })
    .from(librarySnapshotHistoryTable)
    .where(eq(librarySnapshotHistoryTable.userId, userId))
    .orderBy(desc(librarySnapshotHistoryTable.createdAt));
  if (all.length > HISTORY_LIMIT) {
    const toDelete = all.slice(HISTORY_LIMIT).map((r) => r.id);
    await db
      .delete(librarySnapshotHistoryTable)
      .where(inArray(librarySnapshotHistoryTable.id, toDelete));
  }
}

router.get("/library-snapshot", requireAuth, async (req, res) => {
  const { userId } = req as AuthedRequest;
  try {
    const [row] = await db
      .select()
      .from(librarySnapshotsTable)
      .where(eq(librarySnapshotsTable.userId, userId));
    res.json(row ?? null);
  } catch (e: unknown) {
    res.status(500).json({ error: errMsg(e) });
  }
});

router.put("/library-snapshot", requireAuth, async (req, res) => {
  const { userId } = req as AuthedRequest;
  try {
    const body = req.body as {
      data?: unknown;
      baseRevision?: number;
      deviceLabel?: string;
      deviceId?: string;
    };
    if (body.data == null || typeof body.data !== "object") {
      res.status(400).json({ error: "data required" });
      return;
    }
    const baseRevision = Number.isFinite(body.baseRevision) ? Number(body.baseRevision) : 0;
    const deviceLabel = typeof body.deviceLabel === "string" ? body.deviceLabel : null;
    const deviceId = typeof body.deviceId === "string" && body.deviceId ? body.deviceId : null;
    const userAgent = (req.headers["user-agent"] ?? null) as string | null;

    // Upsert into synced_devices if a deviceId was provided
    if (deviceId) {
      await db
        .insert(syncedDevicesTable)
        .values({
          userId,
          deviceId,
          label: deviceLabel,
          userAgent,
          lastSeenAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [syncedDevicesTable.userId, syncedDevicesTable.deviceId],
          set: {
            label: deviceLabel,
            userAgent,
            lastSeenAt: new Date(),
          },
        });
    }

    const [existing] = await db
      .select()
      .from(librarySnapshotsTable)
      .where(eq(librarySnapshotsTable.userId, userId));

    if (!existing) {
      const [row] = await db
        .insert(librarySnapshotsTable)
        .values({
          userId,
          data: body.data as object,
          revision: 1,
          deviceLabel,
        })
        .returning();
      res.json({ status: "ok", row });
      return;
    }

    if (existing.revision > baseRevision) {
      res.status(409).json({ status: "conflict", row: existing });
      return;
    }

    // Save current snapshot to history before overwriting
    await saveToHistory(userId, existing);

    const [row] = await db
      .update(librarySnapshotsTable)
      .set({
        data: body.data as object,
        revision: existing.revision + 1,
        deviceLabel,
        updatedAt: new Date(),
      })
      .where(eq(librarySnapshotsTable.userId, userId))
      .returning();
    res.json({ status: "ok", row });
  } catch (e: unknown) {
    res.status(500).json({ error: errMsg(e) });
  }
});

router.get("/library-snapshot/devices", requireAuth, async (req, res) => {
  const { userId } = req as AuthedRequest;
  try {
    const devices = await db
      .select()
      .from(syncedDevicesTable)
      .where(eq(syncedDevicesTable.userId, userId))
      .orderBy(syncedDevicesTable.lastSeenAt);
    res.json(devices);
  } catch (e: unknown) {
    res.status(500).json({ error: errMsg(e) });
  }
});

router.delete("/library-snapshot/devices/:deviceId", requireAuth, async (req, res) => {
  const { userId } = req as AuthedRequest;
  const deviceId = req.params.deviceId as string;
  try {
    await db
      .delete(syncedDevicesTable)
      .where(
        and(
          eq(syncedDevicesTable.userId, userId),
          eq(syncedDevicesTable.deviceId, deviceId)
        )
      );
    res.json({ status: "ok" });
  } catch (e: unknown) {
    res.status(500).json({ error: errMsg(e) });
  }
});

router.get("/library-snapshot/history", requireAuth, async (req, res) => {
  const { userId } = req as AuthedRequest;
  try {
    const rows = await db
      .select()
      .from(librarySnapshotHistoryTable)
      .where(eq(librarySnapshotHistoryTable.userId, userId))
      .orderBy(desc(librarySnapshotHistoryTable.createdAt))
      .limit(HISTORY_LIMIT);
    res.json(rows);
  } catch (e: unknown) {
    res.status(500).json({ error: errMsg(e) });
  }
});

router.post("/library-snapshot/history/:id/restore", requireAuth, async (req, res) => {
  const { userId } = req as AuthedRequest;
  const id = req.params.id as string;
  try {
    // Fetch the history entry being restored (must belong to this user)
    const result = await db.transaction(async (tx) => {
      // Fetch the history entry (must belong to this user) — inside tx for consistency
      const [histEntry] = await tx
        .select()
        .from(librarySnapshotHistoryTable)
        .where(
          and(
            eq(librarySnapshotHistoryTable.id, id),
            eq(librarySnapshotHistoryTable.userId, userId)
          )
        );
      if (!histEntry) return null;

      const [existing] = await tx
        .select()
        .from(librarySnapshotsTable)
        .where(eq(librarySnapshotsTable.userId, userId));

      if (existing) {
        // Save current live snapshot to history first so restore is undoable
        await tx.insert(librarySnapshotHistoryTable).values({
          userId,
          data: existing.data,
          deviceLabel: existing.deviceLabel,
          revision: existing.revision,
        });
        // Prune history inside transaction
        const all = await tx
          .select({ id: librarySnapshotHistoryTable.id })
          .from(librarySnapshotHistoryTable)
          .where(eq(librarySnapshotHistoryTable.userId, userId))
          .orderBy(desc(librarySnapshotHistoryTable.createdAt));
        if (all.length > HISTORY_LIMIT) {
          const toDelete = all.slice(HISTORY_LIMIT).map((r) => r.id);
          await tx
            .delete(librarySnapshotHistoryTable)
            .where(inArray(librarySnapshotHistoryTable.id, toDelete));
        }

        const [row] = await tx
          .update(librarySnapshotsTable)
          .set({
            data: histEntry.data as object,
            revision: existing.revision + 1,
            deviceLabel: histEntry.deviceLabel,
            updatedAt: new Date(),
          })
          .where(eq(librarySnapshotsTable.userId, userId))
          .returning();
        return { row, histEntry };
      } else {
        const [row] = await tx
          .insert(librarySnapshotsTable)
          .values({
            userId,
            data: histEntry.data as object,
            revision: 1,
            deviceLabel: histEntry.deviceLabel,
          })
          .returning();
        return { row, histEntry };
      }
    });

    if (!result) {
      res.status(404).json({ error: "History entry not found" });
      return;
    }
    const { row, histEntry } = result;
    res.json({ status: "ok", row, histEntry });
  } catch (e: unknown) {
    res.status(500).json({ error: errMsg(e) });
  }
});

export default router;
