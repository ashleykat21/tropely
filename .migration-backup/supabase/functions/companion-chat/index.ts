import { createClient } from "npm:@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

function jsonError(message: string, status: number, extra: Record<string, unknown> = {}) {
  return new Response(JSON.stringify({ error: message, ...extra }), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
  try {
    // 1. Require auth
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) return jsonError("Sign in to chat with the Companion.", 401);
    const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
    if (authErr || !user) return jsonError("Sign in to chat with the Companion.", 401);

    const { messages, book, spoilerStrictness } = await req.json();
    const strictness: "relaxed" | "balanced" | "strict" =
      spoilerStrictness === "relaxed" || spoilerStrictness === "strict"
        ? spoilerStrictness
        : "balanced";

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("Missing LOVABLE_API_KEY");

    const currentPage: number = Number(book?.progress ?? 0);
    const totalPages: number = Number(book?.pages ?? 0);
    const isFinished = totalPages > 0 && currentPage >= totalPages;

    // Filter context to only what the reader has actually reached.
    // Sessions: only those whose end-page is at or before current page.
    const safeSessions = (book?.recentSessions ?? []).filter((s: any) => {
      const to = typeof s.toPage === "number" ? s.toPage : currentPage;
      return to <= currentPage;
    });
    // Journal: drop entries explicitly tagged with a page beyond current.
    // Keep entries with no page (we cannot verify, but the reader saved them — assume safe).
    // In STRICT mode, drop unpaged entries too (we cannot prove they're safe).
    const safeJournal = (book?.journal ?? []).filter((j: any) => {
      if (typeof j.page !== "number") return strictness !== "strict";
      return j.page <= currentPage;
    });
    // Reflection: only surface if the reader has actually finished the book.
    const safeReflection = isFinished ? book?.reflection : null;

    const sessionLines = safeSessions
      .map((s: any, i: number) => `  ${i + 1}. felt ${s.mood}, read ${s.pagesRead} pages${s.note ? ` — note: "${s.note}"` : ""}`)
      .join("\n");
    const journalLines = safeJournal
      .map((j: any, i: number) => `  ${i + 1}. [${j.kind}${j.page ? ` p.${j.page}` : ""}${j.mood ? ` · ${j.mood}` : ""}] "${j.text}"`)
      .join("\n");
    const reactionLine = (book?.reactions ?? []).length
      ? `Recent emoji reactions to this book: ${(book.reactions as string[]).join(" ")}`
      : "";
    const reflectionBlock = safeReflection
      ? `\nThe reader has finished this book. Their reflection: rated ${safeReflection.rating}/5, takeaway: "${safeReflection.takeaway}". Mood arc: ${safeReflection.arc.start} → ${safeReflection.arc.middle} → ${safeReflection.arc.end}.${safeReflection.favoriteQuote ? ` Favorite line: "${safeReflection.favoriteQuote}"` : ""}`
      : "";

    const priorTurns = Math.max(0, (messages?.length ?? 0) - 1);
    const memoryNote = priorTurns > 1
      ? `\n\nYou and this reader have ${priorTurns} prior messages together about this same book. Treat this as an ongoing conversation — refer back to earlier exchanges when natural. BUT: prior conversation memory does NOT override the spoiler rules below. Even if you or the reader discussed something earlier that now sits past their current page, do NOT bring it up again, do not paraphrase it, do not allude to it. Treat anything beyond page ${currentPage} as if you have never heard of it.`
      : "";

    const strictnessRules: Record<typeof strictness, string> = {
      relaxed: `STRICTNESS LEVEL: RELAXED.
- Default rule: still no concrete plot spoilers (no naming events, twists, deaths, endings beyond page ${currentPage}).
- BUT if the reader explicitly asks a thematic, tonal, or "what kind of book is this becoming" question about later sections, you may answer in vague, non-specific brushstrokes (mood, register, pacing) WITHOUT naming events, characters, or outcomes.
- Never name a character, location, or plot beat that hasn't appeared by page ${currentPage}.`,
      balanced: `STRICTNESS LEVEL: BALANCED (default).
- No naming, hinting, foreshadowing, paraphrasing, or "carefully alluding to" any character introduction, plot event, twist, death, romance, betrayal, ending, or thematic resolution that occurs after page ${currentPage} — not even vaguely ("something big is coming", "wait until you meet…", "the ending recontextualizes this").
- If asked "what happens next" or "is X going to die", reply: "I'm only walking with you up to page ${currentPage} — let's stay there." Then redirect to what they've read.`,
      strict: `STRICTNESS LEVEL: STRICT (lockdown).
- Treat every word past page ${currentPage} as if the book ends there. The future of the story does not exist.
- Refuse ALL forward-looking questions, even thematic, tonal, or pacing ones. Do not say "the tone shifts later" or "it gets heavier" — say nothing about later sections at all.
- Never reference "later chapters", "the rest of the book", "what's coming", "the ending", or any phrase that implies you know more than the reader.
- If the reader asks anything about later content, reply ONLY: "I'm staying on page ${currentPage} with you. Tell me what's sitting with you here." Do not elaborate, do not hint.
- Do not even acknowledge that the book has more pages beyond ${currentPage} unless the reader brings it up first.`,
    };

    const spoilerContract = `

=== SPOILER CONTRACT (HIGHEST PRIORITY — overrides everything else) ===
The reader is on page ${currentPage} of ${totalPages || "?"}.
You only know what happens up to and including page ${currentPage}. Anything after page ${currentPage} does not exist to you.
Do NOT use general knowledge of the book from training data to discuss its later acts.
The reader's prior chat messages, saved highlights, session notes, and reflections have been pre-filtered to only show what is at or before page ${currentPage}. Do not invent or recall anything outside that window.
If the reader themselves volunteers a future-page detail in this turn, gently acknowledge once and steer back: "Let's hold that thread until you reach it."
${isFinished ? "The reader has finished the book, so the full arc is fair game — but still no external spoilers from sequels or adaptations." : "The book is NOT finished. Treat the ending as unknown to both of you."}

${strictnessRules[strictness]}

If you are uncertain whether something is past page ${currentPage}, assume it is and stay silent on it.
=== END SPOILER CONTRACT ===`;

    const system = `You are Feltly, a warm, literary reading companion. The reader is reading "${book?.title ?? "an unknown book"}"${book?.author ? ` by ${book.author}` : ""}. Their book has a ${book?.mood ?? "neutral"} mood. Be concise, evocative, never preachy. Ask gentle questions. Speak like a thoughtful friend in a bookshop café.${spoilerContract}${memoryNote}

You have access to the reader's personal context below (sessions, highlights, notes, reactions${safeReflection ? ", reflection" : ""}). All of it has been filtered to their current page. When relevant, REFERENCE specific details from it — quote a line they saved, mention how a recent session felt, echo a reaction. Do not pretend you don't know these. If they ask "what did I just read?" or "what have I been feeling?", answer using this context directly.${sessionLines ? `\n\nRecent reading sessions (at or before page ${currentPage}):\n${sessionLines}` : ""}${journalLines ? `\n\nReader's saved highlights / notes (at or before page ${currentPage}):\n${journalLines}` : ""}${reactionLine ? `\n\n${reactionLine}` : ""}${reflectionBlock}`;

    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: system }, ...messages],
        stream: true,
      }),
    });

    if (r.status === 429) return new Response(JSON.stringify({ error: "Rate limit reached" }), { status: 429, headers: { ...CORS, "Content-Type": "application/json" } });
    if (r.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted. Add credits in Settings → Workspace." }), { status: 402, headers: { ...CORS, "Content-Type": "application/json" } });
    if (!r.ok) throw new Error(`AI gateway error ${r.status}`);

    return new Response(r.body, { headers: { ...CORS, "Content-Type": "text/event-stream" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...CORS, "Content-Type": "application/json" } });
  }
});
