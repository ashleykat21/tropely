// OCR a book page photo using Lovable AI Gateway (Gemini vision).
// Returns the extracted quote text only — no commentary.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  try {
    const { imageDataUrl } = await req.json();
    if (!imageDataUrl || typeof imageDataUrl !== "string") {
      return json({ error: "imageDataUrl is required" }, 400);
    }
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) return json({ error: "LOVABLE_API_KEY missing" }, 500);

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
              "You read book pages from photos. Extract ONLY the visible body text the user likely highlighted, verbatim. No commentary, no quotes, no markdown — just the plain text. If text is unreadable, return an empty string.",
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Transcribe the visible passage from this book page." },
              { type: "image_url", image_url: { url: imageDataUrl } },
            ],
          },
        ],
      }),
    });

    if (res.status === 429) return json({ error: "Rate limited. Try again shortly." }, 429);
    if (res.status === 402) return json({ error: "AI credits exhausted." }, 402);
    if (!res.ok) {
      const t = await res.text();
      return json({ error: `Gateway error: ${t.slice(0, 200)}` }, 500);
    }
    const data = await res.json();
    const text = (data?.choices?.[0]?.message?.content ?? "").trim();
    return json({ text });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}