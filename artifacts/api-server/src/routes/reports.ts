import { Router } from "express";
import { db, reportsTable } from "@workspace/db";
import { requireAuth, errMsg, type AuthedRequest } from "../middlewares/authMiddleware";

const router = Router();

router.post("/reports", requireAuth, async (req, res) => {
  const { userId } = req as AuthedRequest;
  try {
    const { reportedUserId, contentType, contentId, reason } = req.body as {
      reportedUserId?: string;
      contentType?: string;
      contentId?: string;
      reason: string;
    };

    if (!reason?.trim()) {
      res.status(400).json({ error: "reason is required" });
      return;
    }

    const [row] = await db
      .insert(reportsTable)
      .values({
        reporterId: userId,
        reportedUserId: reportedUserId ?? null,
        contentType: contentType ?? "user",
        contentId: contentId ?? null,
        reason: reason.trim(),
      })
      .returning();

    console.log(`[report] id=${row.id} reporter=${userId} reported=${reportedUserId ?? "—"} type=${contentType ?? "user"}`);

    res.json({ ok: true, id: row.id });
  } catch (e: unknown) {
    res.status(500).json({ error: errMsg(e) });
  }
});

export default router;
