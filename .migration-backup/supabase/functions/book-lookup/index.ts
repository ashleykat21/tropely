// Premium feature: identify a physical book from a cover photo or ISBN.
// Uses Lovable AI vision for cover OCR/identification, OpenLibrary for ISBN.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

import { createClient } from "npm:@supabase/supabase-js@2";

type LookupResult = {
  title: string;
  author: string;
  pages?: number;
  cover?: string;
  isbn?: string;
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function lookupISBN(isbn: string): Promise<LookupResult | null> {
  const clean = isbn.replace(/[^0-9Xx]/g, "");
  if (clean.length < 10) return null;
  const r = await fetch(
    `https://openlibrary.org/api/books?bibkeys=ISBN:${clean}&format=json&jscmd=data`,
  );
  if (!r.ok) return null;
  const j = await r.json();
  const key = `ISBN:${clean}`;
  const b = j[key];
  if (!b) return null;
  return {
    title: b.title,
    author: (b.authors?.[0]?.name as string) ?? "Unknown",
    pages: b.number_of_pages,
    cover: b.cover?.large ?? b.cover?.medium ?? b.cover?.small,
    isbn: clean,
  };
}

async function lookupFromImage(imageDataUrl: string): Promise<LookupResult | null> {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) throw new Error("AI not configured");

  const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content:
            "You identify books from cover photos. Reply ONLY with strict JSON: {\"title\":\"...\",\"author\":\"...\"}. If unsure, use your best guess. No prose, no markdown.",
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Identify this book from its cover." },
            { type: "image_url", image_url: { url: imageDataUrl } },
          ],
        },
      ],
    }),
  });

  if (!aiRes.ok) {
    const t = await aiRes.text();
    console.error("AI vision failed", aiRes.status, t);
    return null;
  }
  const j = await aiRes.json();
  const content = j?.choices?.[0]?.message?.content ?? "";
  const cleaned = content.replace(/```json|```/g, "").trim();
  let parsed: { title?: string; author?: string } = {};
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    const m = cleaned.match(/\{[\s\S]*\}/);
    if (m) parsed = JSON.parse(m[0]);
  }
  if (!parsed.title) return null;

  // Enrich via OpenLibrary search
  try {
    const q = `${parsed.title} ${parsed.author ?? ""}`.trim();
    const r = await fetch(
      `https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=1`,
    );
    if (r.ok) {
      const sj = await r.json();
      const doc = sj.docs?.[0];
      if (doc) {
        return {
          title: doc.title ?? parsed.title,
          author: doc.author_name?.[0] ?? parsed.author ?? "Unknown",
          pages: doc.number_of_pages_median,
          cover: doc.cover_i
            ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`
            : undefined,
          isbn: doc.isbn?.[0],
        };
      }
    }
  } catch (e) {
    console.error("Enrichment failed", e);
  }

  return { title: parsed.title, author: parsed.author ?? "Unknown" };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "POST only" }, 405);

  // Validate user auth
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const token = req.headers.get("Authorization")?.replace("Bearer ", "");
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) return jsonResponse({ error: "Unauthorized" }, 401);

  // Premium gate
  const { data: hasSub } = await supabase.rpc("has_active_subscription", {
    user_uuid: user.id,
    check_env: "sandbox",
  });
  const { data: hasSubLive } = await supabase.rpc("has_active_subscription", {
    user_uuid: user.id,
    check_env: "live",
  });
  if (!hasSub && !hasSubLive) {
    return jsonResponse({ error: "Premium required", premium: true }, 402);
  }

  let body: { isbn?: string; image?: string } = {};
  try { body = await req.json(); } catch {}

  try {
    let result: LookupResult | null = null;
    if (body.isbn) result = await lookupISBN(body.isbn);
    else if (body.image) result = await lookupFromImage(body.image);
    else return jsonResponse({ error: "Provide isbn or image" }, 400);

    if (!result) return jsonResponse({ error: "Could not identify book" }, 404);
    return jsonResponse({ book: result });
  } catch (e) {
    console.error("book-lookup error", e);
    return jsonResponse({ error: (e as Error).message }, 500);
  }
});