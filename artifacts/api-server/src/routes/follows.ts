import { Router } from "express";
import { db, followsTable, blockedUsersTable } from "@workspace/db";
import { eq, and, count } from "drizzle-orm";
import { requireAuth, errMsg, type AuthedRequest } from "../middlewares/authMiddleware";

const router = Router();

router.get("/follows", requireAuth, async (req, res) => {
  const { userId } = req as AuthedRequest;
  try {
    const following = await db.select().from(followsTable).where(eq(followsTable.followerId, userId));
    const [{ count: followersCount }] = await db
      .select({ count: count() })
      .from(followsTable)
      .where(eq(followsTable.followingId, userId));
    const blocked = await db.select().from(blockedUsersTable).where(eq(blockedUsersTable.blockerId, userId));
    res.json({
      following: following.map((f) => f.followingId),
      followersCount: Number(followersCount),
      blocked: blocked.map((b) => b.blockedId),
    });
  } catch (e: unknown) {
    res.status(500).json({ error: errMsg(e) });
  }
});

router.post("/follows/:targetId", requireAuth, async (req, res) => {
  const { userId } = req as AuthedRequest;
  try {
    const targetId = req.params.targetId as string;
    const existing = await db
      .select()
      .from(followsTable)
      .where(and(eq(followsTable.followerId, userId), eq(followsTable.followingId, targetId)));
    if (existing.length > 0) {
      await db
        .delete(followsTable)
        .where(and(eq(followsTable.followerId, userId), eq(followsTable.followingId, targetId)));
      res.json({ following: false });
    } else {
      await db.insert(followsTable).values({ followerId: userId, followingId: targetId });
      res.json({ following: true });
    }
  } catch (e: unknown) {
    res.status(500).json({ error: errMsg(e) });
  }
});

router.post("/block/:targetId", requireAuth, async (req, res) => {
  const { userId } = req as AuthedRequest;
  try {
    const targetId = req.params.targetId as string;
    await db
      .insert(blockedUsersTable)
      .values({ blockerId: userId, blockedId: targetId })
      .onConflictDoNothing();
    res.json({ blocked: true });
  } catch (e: unknown) {
    res.status(500).json({ error: errMsg(e) });
  }
});

export default router;
