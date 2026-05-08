import { Router } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";
import { requireAuth, errMsg, type AuthedRequest } from "../middlewares/authMiddleware";

const router = Router();

type BookSummary = {
  title: string;
  author: string;
  mood: string;
  rating?: number;
  tags?: string[];
};

type CurrentBook = {
  title: string;
  author: string;
  mood: string;
  progress: number;
  pages: number;
};

router.post("/mood-recs", requireAuth, async (req, res) => {
  const { userId } = req as AuthedRequest;
  void userId;

  const {
    finishedBooks = [],
    readingBooks = [],
    currentBook,
    moodPreferences,
  } = req.body as {
    finishedBooks?: BookSummary[];
    readingBooks?: BookSummary[];
    currentBook?: CurrentBook;
    moodPreferences?: { favorites?: string[]; avoid?: string[]; pace?: string };
  };

  if (finishedBooks.length === 0 && !currentBook) {
    res.status(400).json({ error: "Provide at least one book or a current read." });
    return;
  }

  const historyLines = finishedBooks
    .slice(0, 20)
    .map(
      (b, i) =>
        `${i + 1}. "${b.title}" by ${b.author} — mood: ${b.mood}${b.rating ? `, rated ${b.rating}/5` : ""}${b.tags?.length ? `, themes: ${b.tags.join(", ")}` : ""}`
    )
    .join("\n");

  const currentLine = currentBook
    ? `Currently reading: "${currentBook.title}" by ${currentBook.author} (${Math.round((currentBook.progress / Math.max(currentBook.pages, 1)) * 100)}% done, mood: ${currentBook.mood})`
    : "";

  const prefLine = moodPreferences
    ? [
        moodPreferences.favorites?.length
          ? `Favourite moods: ${moodPreferences.favorites.join(", ")}`
          : "",
        moodPreferences.avoid?.length
          ? `Moods to avoid: ${moodPreferences.avoid.join(", ")}`
          : "",
        moodPreferences.pace ? `Preferred pace: ${moodPreferences.pace}` : "",
      ]
        .filter(Boolean)
        .join(". ")
    : "";

  const activeSummary = readingBooks
    .slice(0, 5)
    .map((b) => `"${b.title}" (${b.mood})`)
    .join(", ");

  const prompt = `You are a deeply empathetic book recommender who understands the emotional register of literature.

A reader's history:
${historyLines || "(none yet)"}
${currentLine}
${activeSummary ? `Also on their shelf: ${activeSummary}` : ""}
${prefLine ? `Preferences: ${prefLine}` : ""}

Recommend exactly 6 books that will resonate emotionally with this reader. For each book:
- Choose a real, published book (accurate title and author)
- Assign one mood from: calm, cozy, melancholy, intense, dreamy, joyful, mysterious
- Write a 1-sentence personal "why" — as if you know this reader's reading soul (no generic blurbs)
- Do NOT repeat books already in their history

Respond ONLY with valid JSON, no markdown, no explanation:
{
  "recommendations": [
    { "title": "...", "author": "...", "mood": "...", "why": "..." }
  ]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5-mini",
      max_completion_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
      stream: false,
    });

    const raw = response.choices[0]?.message?.content ?? "{}";
    // Strip markdown code fences if model wraps response
    const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
    let parsed: { recommendations?: unknown[] };
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      res.status(500).json({ error: "Could not parse AI response." });
      return;
    }

    res.json({ recommendations: parsed.recommendations ?? [] });
  } catch (e: unknown) {
    res.status(500).json({ error: errMsg(e) });
  }
});

export default router;
