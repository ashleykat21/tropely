import { createClient } from "npm:@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MOOD_KEYS = ["calm", "cozy", "melancholy", "intense", "dreamy", "joyful", "mysterious"] as const;

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

async function fetchDescription(workKey: string): Promise<string> {
  // workKey looks like "/works/OL12345W"
  try {
    const r = await fetch(`https://openlibrary.org${workKey}.json`);
    if (!r.ok) return "";
    const j = await r.json();
    const d = j.description;
    if (!d) return "";
    if (typeof d === "string") return d.slice(0, 1200);
    if (typeof d === "object" && typeof d.value === "string") return d.value.slice(0, 1200);
    return "";
  } catch {
    return "";
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
  try {
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) return jsonError("Sign in to get mood-matched picks.", 401);
    const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
    if (authErr || !user) return jsonError("Sign in to get mood-matched picks.", 401);

    const { books, targetMood } = await req.json();
    if (!Array.isArray(books) || books.length === 0) return jsonError("No books to tag.", 400);
    if (!MOOD_KEYS.includes(targetMood)) return jsonError("Invalid target mood.", 400);

    // Cap to 20 to control cost
    const slice = books.slice(0, 20);

    // Fetch descriptions in parallel
    const enriched = await Promise.all(
      slice.map(async (b: any) => ({
        key: b.key,
        title: b.title,
        author: b.author,
        description: b.key?.startsWith("/works/") ? await fetchDescription(b.key) : "",
      })),
    );

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("Missing LOVABLE_API_KEY");

    const userPayload = enriched
      .map((b, i) => `${i + 1}. "${b.title}" by ${b.author}${b.description ? ` — ${b.description.slice(0, 600)}` : ""}`)
      .join("\n\n");

    const sys = `You are a literary mood librarian. Tag each book with ONE mood from this exact set: ${MOOD_KEYS.join(", ")}. Base your tag on the book's emotional tone, atmosphere, and what reading it would feel like — not its genre. If a description is missing, infer cautiously from the title and author. Also rate how strongly the book matches the reader's target mood "${targetMood}" on a 0-100 scale.`;

    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: sys },
          { role: "user", content: userPayload },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "tag_books",
              description: "Return mood tag and target-mood match score for each book in order.",
              parameters: {
                type: "object",
                properties: {
                  books: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        index: { type: "integer", description: "1-based index from the input list" },
                        mood: { type: "string", enum: [...MOOD_KEYS] },
                        match: { type: "integer", minimum: 0, maximum: 100, description: `0-100 match to target mood "${targetMood}"` },
                        reason: { type: "string", description: "One short phrase (max 12 words)" },
                      },
                      required: ["index", "mood", "match", "reason"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["books"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "tag_books" } },
      }),
    });

    if (r.status === 429) return jsonError("Rate limit reached. Try again in a moment.", 429);
    if (r.status === 402) return jsonError("AI credits exhausted. Add credits in Settings → Workspace.", 402);
    if (!r.ok) {
      const t = await r.text();
      console.error("AI gateway error", r.status, t);
      return jsonError("AI gateway error.", 500);
    }

    const j = await r.json();
    const call = j.choices?.[0]?.message?.tool_calls?.[0];
    const args = call?.function?.arguments;
    let parsed: any = {};
    try { parsed = typeof args === "string" ? JSON.parse(args) : args; } catch { parsed = {}; }
    const tagged: any[] = parsed.books ?? [];

    // Merge tags back onto input by index
    const out = enriched.map((b, i) => {
      const t = tagged.find((x) => x.index === i + 1);
      return {
        key: b.key,
        mood: t?.mood ?? null,
        match: typeof t?.match === "number" ? t.match : 0,
        reason: t?.reason ?? "",
      };
    });

    return new Response(JSON.stringify({ tags: out }), {
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});