import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";
import webpush from "https://esm.sh/web-push@3.6.7";

const VAPID_PUBLIC = "BHQOQjZvc8_vMhR032s2IkfgLjndS7fw8YzG8ZxK1yao9ULvZvY4l9RmeAeaRwMTJSb-o_VI_0v23ol39oRDB9Q";
const VAPID_PRIVATE = Deno.env.get("VAPID_PRIVATE_KEY") ?? "";
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") ?? "mailto:hello@feltly.app";

if (VAPID_PRIVATE) {
  try { webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE); } catch (_) {}
}

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;

interface Payload {
  title?: string;
  body?: string;
  url?: string;
  tag?: string;
  user_id?: string; // single target user
  user_ids?: string[]; // multi-target fan-out
  exclude_self?: boolean; // when fanning out from a caller, drop their own id
  test?: boolean;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (!VAPID_PRIVATE) {
      return new Response(JSON.stringify({ error: "VAPID_PRIVATE_KEY not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = (await req.json().catch(() => ({}))) as Payload;

    // Resolve target users
    let targetIds: string[] = [];
    const auth = req.headers.get("Authorization") ?? "";
    let callerId: string | null = null;
    if (auth) {
      const userClient = createClient(SUPABASE_URL, ANON, {
        global: { headers: { Authorization: auth } },
      });
      const { data: { user } } = await userClient.auth.getUser();
      callerId = user?.id ?? null;
    }
    if (payload.user_ids && payload.user_ids.length) {
      targetIds = payload.user_ids.filter(Boolean);
    } else if (payload.user_id) {
      targetIds = [payload.user_id];
    } else if (callerId) {
      targetIds = [callerId];
    }
    if (payload.exclude_self && callerId) {
      targetIds = targetIds.filter((id) => id !== callerId);
    }
    if (!targetIds.length) {
      return new Response(JSON.stringify({ error: "No recipients" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: subs, error } = await admin
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth")
      .in("user_id", targetIds);
    if (error) throw error;

    const notif = JSON.stringify({
      title: payload.title || "Feltly",
      body: payload.body || "",
      url: payload.url || "/",
      tag: payload.tag,
    });

    let sent = 0;
    const stale: string[] = [];
    await Promise.all((subs ?? []).map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          notif
        );
        sent++;
      } catch (e: any) {
        const code = e?.statusCode;
        if (code === 404 || code === 410) stale.push(s.endpoint);
      }
    }));

    if (stale.length) {
      await admin.from("push_subscriptions").delete().in("endpoint", stale);
    }

    return new Response(JSON.stringify({ ok: true, sent, removed: stale.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "Server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});