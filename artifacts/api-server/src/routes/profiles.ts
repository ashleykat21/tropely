import { Router } from "express";
import { db, profilesTable } from "@workspace/db";
import { eq, inArray } from "drizzle-orm";
import { requireAuth, errMsg, type AuthedRequest } from "../middlewares/authMiddleware";

const router = Router();

router.get("/profiles/me", requireAuth, async (req, res) => {
  const { userId } = req as AuthedRequest;
  try {
    let [profile] = await db.select().from(profilesTable).where(eq(profilesTable.userId, userId));
    if (!profile) {
      [profile] = await db.insert(profilesTable).values({ userId }).returning();
    }
    res.json(profile);
  } catch (e: unknown) {
    res.status(500).json({ error: errMsg(e) });
  }
});

router.patch("/profiles/me", requireAuth, async (req, res) => {
  const { userId } = req as AuthedRequest;
  try {
    const { displayName, bio, avatarUrl, moodSignature, city, country } = req.body as {
      displayName?: string;
      bio?: string;
      avatarUrl?: string;
      moodSignature?: string;
      city?: string;
      country?: string;
    };
    const [profile] = await db
      .update(profilesTable)
      .set({ displayName, bio, avatarUrl, moodSignature, city, country, updatedAt: new Date() })
      .where(eq(profilesTable.userId, userId))
      .returning();
    res.json(profile);
  } catch (e: unknown) {
    res.status(500).json({ error: errMsg(e) });
  }
});

router.get("/profiles", requireAuth, async (_req, res) => {
  try {
    const ids = ((_req.query as Record<string, string>).ids ?? "").split(",").filter(Boolean);
    if (!ids.length) { res.json([]); return; }
    const rows = await db.select().from(profilesTable).where(inArray(profilesTable.userId, ids));
    res.json(rows);
  } catch (e: unknown) {
    res.status(500).json({ error: errMsg(e) });
  }
});

export default router;
