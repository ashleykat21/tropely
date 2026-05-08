import { Router } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";
import { requireAuth, errMsg, type AuthedRequest } from "../middlewares/authMiddleware";

const router = Router();

const VALID_MOODS = ["calm", "melancholy", "hopeful", "tense", "joyful", "dark", "whimsical", "romantic"] as const;
type Mood = typeof VALID_MOODS[number];

function deterministicMoodTag(key: string, title: string, targetMood: Mood): { mood: Mood; match: number; reason: string } {
  let h = 0;
  const seed = key + title;
  for (let i = 0; i < seed.length; i++) h = ((h * 31) + seed.charCodeAt(i)) >>> 0;
  const mood = VALID_MOODS[h % VALID_MOODS.length];
  return { mood, match: mood === targetMood ? 75 : 30, reason: "" };
}

router.post("/book-lookup", requireAuth, async (req, res) => {
  const body = req.body as { isbn?: string; image?: string };
  try {
    // Image-based lookup: use GPT vision to read the book cover, then look up via Open Library
    if (body.image) {
      let extractedTitle = "";
      let extractedAuthor = "";
      try {
        const visionRes = await openai.chat.completions.create({
          model: "gpt-5-mini",
          max_completion_tokens: 128,
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: 'Read the book cover in this image. Respond ONLY with a JSON object: {"title":"<title>","author":"<author>"}. If unreadable respond {"title":"","author":""}.' },
                { type: "image_url", image_url: { url: body.image } },
              ],
            },
          ],
        });
        const raw = (visionRes.choices[0]?.message?.content ?? "").trim().replace(/^```json?\s*/i, "").replace(/\s*```$/i, "");
        const parsed = JSON.parse(raw) as { title?: string; author?: string };
        extractedTitle = parsed.title?.trim() ?? "";
        extractedAuthor = parsed.author?.trim() ?? "";
      } catch { /* vision failed — fall through to error */ }

      if (!extractedTitle) {
        res.status(422).json({ error: "Couldn't read book title from cover. Please enter it manually." });
        return;
      }

      // Try Open Library search to enrich with pages / cover art
      try {
        const q = encodeURIComponent(`${extractedTitle} ${extractedAuthor}`.trim());
        const searchRes = await fetch(`https://openlibrary.org/search.json?q=${q}&limit=1&fields=title,author_name,number_of_pages_median,cover_i,isbn`);
        if (searchRes.ok) {
          const searchData = await searchRes.json() as { docs?: { title?: string; author_name?: string[]; number_of_pages_median?: number; cover_i?: number; isbn?: string[] }[] };
          const doc = searchData.docs?.[0];
          if (doc) {
            res.json({
              book: {
                title: doc.title ?? extractedTitle,
                author: doc.author_name?.[0] ?? extractedAuthor,
                pages: doc.number_of_pages_median ?? null,
                isbn: doc.isbn?.[0] ?? null,
                cover: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg` : null,
              },
            });
            return;
          }
        }
      } catch { /* search enrichment failed */ }

      // Return GPT extraction without Open Library enrichment
      res.json({ book: { title: extractedTitle, author: extractedAuthor || "Unknown", pages: null, isbn: null, cover: null } });
      return;
    }

    // ISBN-based lookup
    if (!body.isbn) { res.status(400).json({ error: "ISBN or image required" }); return; }
    const r = await fetch(`https://openlibrary.org/isbn/${body.isbn}.json`);
    if (!r.ok) { res.status(404).json({ error: "Book not found" }); return; }
    const data = await r.json() as { title?: string; number_of_pages?: number; covers?: number[]; authors?: { key: string }[] };
    let author = "Unknown";
    if (data.authors?.length) {
      const aKey = data.authors[0]?.key;
      if (aKey) {
        const ar = await fetch(`https://openlibrary.org${aKey}.json`);
        if (ar.ok) { const ad = await ar.json() as { name?: string }; author = ad.name ?? "Unknown"; }
      }
    }
    res.json({
      book: {
        title: data.title ?? "Unknown",
        author,
        pages: data.number_of_pages ?? null,
        isbn: body.isbn,
        cover: data.covers?.[0] ? `https://covers.openlibrary.org/b/id/${data.covers[0]}-L.jpg` : null,
      },
    });
  } catch (e: unknown) {
    res.status(500).json({ error: errMsg(e) });
  }
});

router.post("/mood-tag-books", requireAuth, async (req, res) => {
  const { books, targetMood } = req.body as {
    books: { key: string; title: string; author?: string }[];
    targetMood: Mood;
  };
  if (!Array.isArray(books) || books.length === 0) {
    res.status(400).json({ error: "books array required" });
    return;
  }

  try {
    const slice = books.slice(0, 20);
    const bookList = slice
      .map((b, i) => `${i + 1}. "${b.title}" by ${b.author ?? "Unknown"} (key: ${b.key})`)
      .join("\n");

    const prompt = `You are a literary mood analyst for Feltly, a mood-based book tracker.

The reader is in a "${targetMood}" mood. Analyze each book and assign:
- mood: one from: ${VALID_MOODS.join(", ")}
- match: integer 0–100 — how well the book fits "${targetMood}" (100 = perfect)
- reason: one sentence max 12 words explaining the mood match

Books:
${bookList}

Respond ONLY with a JSON array, no markdown:
[{"key":"<key>","mood":"<mood>","match":<0-100>,"reason":"<reason>"},...]`;

    const response = await openai.chat.completions.create({
      model: "gpt-5-mini",
      max_completion_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = (response.choices[0]?.message?.content ?? "[]").trim();
    const cleaned = raw.replace(/^```json?\s*/i, "").replace(/\s*```$/i, "");

    let tags: { key: string; mood: string; match: number; reason: string }[] = [];
    try {
      tags = JSON.parse(cleaned);
    } catch {
      tags = slice.map((b) => ({ ...deterministicMoodTag(b.key, b.title, targetMood), key: b.key }));
    }

    const sanitized = tags.map((t) => ({
      key: t.key ?? "",
      mood: (VALID_MOODS as readonly string[]).includes(t.mood) ? (t.mood as Mood) : VALID_MOODS[0],
      match: Math.max(0, Math.min(100, Number(t.match) || 0)),
      reason: typeof t.reason === "string" ? t.reason.slice(0, 120) : "",
    }));

    res.json({ tags: sanitized });
  } catch (e: unknown) {
    const slice = books.slice(0, 20);
    const tags = slice.map((b) => ({ ...deterministicMoodTag(b.key, b.title, targetMood), key: b.key }));
    res.json({ tags });
  }
});

router.post("/ocr-highlight", requireAuth, async (req, res) => {
  const { imageDataUrl } = req.body as { imageDataUrl?: string };
  if (!imageDataUrl) { res.status(400).json({ error: "imageDataUrl required" }); return; }
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5-mini",
      max_completion_tokens: 512,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Extract and return ONLY the text visible in this image of a book page or highlight. Return the raw text with no commentary or formatting." },
            { type: "image_url", image_url: { url: imageDataUrl } },
          ],
        },
      ],
    });
    const text = response.choices[0]?.message?.content?.trim() ?? "";
    if (!text) { res.json({ text: "" }); return; }
    res.json({ text });
  } catch (e: unknown) {
    res.status(500).json({ error: errMsg(e) || "Couldn't read the image. Try again." });
  }
});

export default router;
