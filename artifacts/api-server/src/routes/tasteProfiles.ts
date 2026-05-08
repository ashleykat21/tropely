import { Router } from "express";
import { db, tasteProfilesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, errMsg, type AuthedRequest } from "../middlewares/authMiddleware";

const router = Router();

router.get("/taste-profiles", requireAuth, async (req, res) => {
  const { userId } = req as AuthedRequest;
  try {
    const rows = await db.select().from(tasteProfilesTable).where(eq(tasteProfilesTable.userId, userId));
    res.json(rows);
  } catch (e: unknown) {
    res.status(500).json({ error: errMsg(e) });
  }
});

router.get("/taste-profiles/me", requireAuth, async (req, res) => {
  const { userId } = req as AuthedRequest;
  try {
    let [profile] = await db.select().from(tasteProfilesTable).where(eq(tasteProfilesTable.userId, userId));
    if (!profile) {
      [profile] = await db.insert(tasteProfilesTable).values({ userId }).returning();
    }
    res.json(profile);
  } catch (e: unknown) {
    res.status(500).json({ error: errMsg(e) });
  }
});

router.put("/taste-profiles/me", requireAuth, async (req, res) => {
  const { userId } = req as AuthedRequest;
  try {
    const {
      favoriteMoods,
      avoidMoods,
      topGenres,
      topEmojis,
      finishedTitles,
      favoriteBooks,
      ageBand,
      pace,
    } = req.body as {
      favoriteMoods?: string[];
      avoidMoods?: string[];
      topGenres?: string[];
      topEmojis?: string[];
      finishedTitles?: string[];
      favoriteBooks?: string[];
      ageBand?: string;
      pace?: string;
    };
    const existing = await db.select().from(tasteProfilesTable).where(eq(tasteProfilesTable.userId, userId));
    let profile;
    if (existing.length > 0) {
      [profile] = await db
        .update(tasteProfilesTable)
        .set({
          favoriteMoods: favoriteMoods ?? existing[0].favoriteMoods,
          avoidMoods: avoidMoods ?? existing[0].avoidMoods,
          topGenres: topGenres ?? existing[0].topGenres,
          topEmojis: topEmojis ?? existing[0].topEmojis,
          finishedTitles: finishedTitles ?? existing[0].finishedTitles,
          favoriteBooks: favoriteBooks ?? existing[0].favoriteBooks,
          ageBand: ageBand ?? existing[0].ageBand,
          pace: pace ?? existing[0].pace,
          updatedAt: new Date(),
        })
        .where(eq(tasteProfilesTable.userId, userId))
        .returning();
    } else {
      [profile] = await db
        .insert(tasteProfilesTable)
        .values({ userId, favoriteMoods, avoidMoods, topGenres, topEmojis, finishedTitles, favoriteBooks, ageBand, pace })
        .returning();
    }
    res.json(profile);
  } catch (e: unknown) {
    res.status(500).json({ error: errMsg(e) });
  }
});

export default router;
