import { Router } from "express";
import { db, feedbackTable } from "@workspace/db";
import { requireAuth, errMsg, type AuthedRequest } from "../middlewares/authMiddleware";

const router = Router();

router.post("/feedback", requireAuth, async (req, res) => {
  const { userId } = req as AuthedRequest;
  try {
    const { message, email } = req.body as { message?: string; email?: string };

    if (!message || message.trim().length === 0) {
      res.status(400).json({ error: "message is required" });
      return;
    }
    if (message.trim().length > 5000) {
      res.status(400).json({ error: "message must be 5000 characters or fewer" });
      return;
    }

    const [row] = await db
      .insert(feedbackTable)
      .values({
        userId,
        message: message.trim(),
        email: email?.trim() || null,
      })
      .returning();

    // ---------------------------------------------------------------
    // EMAIL INTEGRATION HOOK
    // Add your email provider here (e.g. Resend, SendGrid, Postmark).
    //
    // Example with Resend:
    //   import { Resend } from "resend";
    //   const resend = new Resend(process.env.RESEND_API_KEY);
    //   await resend.emails.send({
    //     from: "Tropely Feedback <noreply@yourdomain.com>",
    //     to: process.env.SUPPORT_EMAIL,
    //     replyTo: email || undefined,
    //     subject: "New Tropely Feedback",
    //     text: `User: ${userId}\nEmail: ${email || "not provided"}\n\n${message}`,
    //   });
    // ---------------------------------------------------------------

    console.log(`[feedback] id=${row.id} userId=${userId} email=${email || "—"}`);

    res.json({ ok: true, id: row.id });
  } catch (e: unknown) {
    res.status(500).json({ error: errMsg(e) });
  }
});

export default router;
