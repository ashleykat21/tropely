import { Router } from "express";
import { db, readingPositionsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, errMsg, type AuthedRequest } from "../middlewares/authMiddleware";

const router = Router();

router.get("/reading-positions", requireAuth, async (req, res) => {
  const { userId } = req as AuthedRequest;
  try {
    const rows = await db
      .select()
      .from(readingPositionsTable)
      .where(eq(readingPositionsTable.userId, userId));
    res.json(rows);
  } catch (e: unknown) {
    res.status(500).json({ error: errMsg(e) });
  }
});

router.put("/reading-positions", requireAuth, async (req, res) => {
  const { userId } = req as AuthedRequest;
  try {
    const body = req.body as Record<string, unknown>;
    const bookKey = (body.bookKey ?? body.book_key) as string | undefined;
    const bookTitle = (body.bookTitle ?? body.book_title) as string | undefined;
    const page = (body.page as number) ?? 0;
    const totalPages = (body.totalPages ?? body.total_pages) as number | undefined;
    if (!bookKey) { res.status(400).json({ error: "bookKey required" }); return; }
    const existing = await db
      .select()
      .from(readingPositionsTable)
      .where(and(eq(readingPositionsTable.userId, userId), eq(readingPositionsTable.bookKey, bookKey)));
    let row;
    if (existing.length > 0) {
      [row] = await db
        .update(readingPositionsTable)
        .set({ page, totalPages, bookTitle: bookTitle ?? existing[0].bookTitle, updatedAt: new Date() })
        .where(and(eq(readingPositionsTable.userId, userId), eq(readingPositionsTable.bookKey, bookKey)))
        .returning();
    } else {
      [row] = await db
        .insert(readingPositionsTable)
        .values({ userId, bookKey, bookTitle: bookTitle ?? bookKey, page, totalPages })
        .returning();
    }
    res.json(row);
  } catch (e: unknown) {
    res.status(500).json({ error: errMsg(e) });
  }
});

export default router;
