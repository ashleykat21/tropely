import { Router } from "express";
import { db, activityTable } from "@workspace/db";
import { eq, desc, or } from "drizzle-orm";
import { requireAuth, errMsg, type AuthedRequest } from "../middlewares/authMiddleware";

const router = Router();

router.get("/activity", requireAuth, async (req, res) => {
  const { userId } = req as AuthedRequest;
  try {
    const { filter } = req.query as { filter?: string };
    const rows = filter === "public"
      ? await db
          .select()
          .from(activityTable)
          .where(eq(activityTable.visibility, "public"))
          .orderBy(desc(activityTable.createdAt))
          .limit(50)
      : await db
          .select()
          .from(activityTable)
          .where(or(eq(activityTable.visibility, "public"), eq(activityTable.userId, userId)))
          .orderBy(desc(activityTable.createdAt))
          .limit(50);
    res.json(rows);
  } catch (e: unknown) {
    res.status(500).json({ error: errMsg(e) });
  }
});

router.post("/activity", requireAuth, async (req, res) => {
  const { userId } = req as AuthedRequest;
  try {
    const { kind, bookTitle, bookAuthor, bookCover, mood, emoji, note, visibility } = req.body as {
      kind: string;
      bookTitle?: string;
      bookAuthor?: string;
      bookCover?: string;
      mood?: string;
      emoji?: string;
      note?: string;
      visibility?: string;
    };
    if (!kind || !bookTitle) {
      res.status(400).json({ error: "kind and bookTitle are required" });
      return;
    }
    const [row] = await db
      .insert(activityTable)
      .values({ userId, kind, bookTitle, bookAuthor: bookAuthor ?? null, bookCover: bookCover ?? null, mood: mood ?? null, emoji: emoji ?? null, note: note ?? null, visibility: visibility ?? "public" })
      .returning();
    res.json(row);
  } catch (e: unknown) {
    res.status(500).json({ error: errMsg(e) });
  }
});

export default router;
