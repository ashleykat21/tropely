// Daily digest generator — runs on a cron, builds one notification per active user.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type ActivityRow = {
  user_id: string;
  kind: string;
  book_title: string;
  mood: string | null;
  emoji: string | null;
  created_at: string;
};

const HOURS = (n: number) => n * 60 * 60 * 1000;

function pluralize(n: number, s: string, p?: string) {
  return `${n} ${n === 1 ? s : p ?? s + "s"}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const sb = createClient(url, key);

  // Optional force / user override for testing — accept via query OR JSON body
  const params = new URL(req.url).searchParams;
  let bodyJson: any = {};
  if (req.method === "POST") {
    try {
      bodyJson = await req.json();
    } catch {
      bodyJson = {};
    }
  }
  const force =
    params.get("force") === "1" || bodyJson.force === true || bodyJson.force === "1";
  const onlyUser = params.get("user") ?? bodyJson.user ?? null;

  const since24 = new Date(Date.now() - HOURS(24)).toISOString();
  const since7d = new Date(Date.now() - HOURS(24 * 7)).toISOString();
  const cutoff = new Date(Date.now() - HOURS(20)).toISOString(); // throttle window

  // Find users to consider: anyone with a profile.
  let q = sb.from("profiles").select("user_id, display_name, last_digest_at");
  if (onlyUser) q = q.eq("user_id", onlyUser);
  const { data: profs, error: pErr } = await q;
  if (pErr) {
    return new Response(JSON.stringify({ error: pErr.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let created = 0;
  let skipped = 0;

  for (const p of profs ?? []) {
    if (!force && p.last_digest_at && p.last_digest_at > cutoff) {
      skipped++;
      continue;
    }

    // Pull this user's recent activity + their friends' activity (followed users)
    const [{ data: mine }, { data: follows }] = await Promise.all([
      sb
        .from("activity")
        .select("user_id,kind,book_title,mood,emoji,created_at")
        .eq("user_id", p.user_id)
        .gte("created_at", since7d),
      sb.from("follows").select("following_id").eq("follower_id", p.user_id),
    ]);

    const followingIds = (follows ?? []).map((f: any) => f.following_id);
    let friendsActivity: ActivityRow[] = [];
    if (followingIds.length) {
      const { data: fa } = await sb
        .from("activity")
        .select("user_id,kind,book_title,mood,emoji,created_at")
        .in("user_id", followingIds)
        .gte("created_at", since24)
        .order("created_at", { ascending: false })
        .limit(20);
      friendsActivity = (fa as ActivityRow[]) ?? [];
    }

    // Buddy-read activity in past 24h for rooms the user belongs to
    const { data: myRooms } = await sb
      .from("buddy_members")
      .select("buddy_read_id")
      .eq("user_id", p.user_id);
    const roomIds = (myRooms ?? []).map((r: any) => r.buddy_read_id);
    let buddyMessages = 0;
    if (roomIds.length) {
      const { count } = await sb
        .from("buddy_messages")
        .select("*", { count: "exact", head: true })
        .in("buddy_read_id", roomIds)
        .neq("user_id", p.user_id)
        .gte("created_at", since24);
      buddyMessages = count ?? 0;
    }

    // Build digest fragments
    const myCount = (mine as ActivityRow[] | null)?.length ?? 0;
    const friendNames = new Set(friendsActivity.map((a) => a.user_id));
    const friendBooks = [...new Set(friendsActivity.map((a) => a.book_title))].slice(0, 3);

    const parts: string[] = [];
    if (friendsActivity.length) {
      parts.push(
        `${pluralize(friendNames.size, "reader")} you follow shared feelings about ${friendBooks
          .map((b) => `"${b}"`)
          .join(", ")}.`
      );
    }
    if (buddyMessages > 0) {
      parts.push(`${pluralize(buddyMessages, "new message")} in your buddy reads.`);
    }
    if (myCount === 0 && friendsActivity.length === 0 && buddyMessages === 0) {
      parts.push("A quiet day. Maybe a few pages tonight?");
    } else if (myCount === 0) {
      parts.push("Your shelves missed you today — open a book?");
    }

    const title =
      friendsActivity.length || buddyMessages
        ? "Your reading circle today"
        : "A gentle nudge from Feltly";

    const body = parts.join(" ");

    const { error: nErr } = await sb.from("notifications").insert({
      user_id: p.user_id,
      kind: "digest",
      title,
      body,
      link: friendsActivity.length ? "/social" : "/",
    });
    if (nErr) continue;

    await sb
      .from("profiles")
      .update({ last_digest_at: new Date().toISOString() })
      .eq("user_id", p.user_id);

    created++;
  }

  return new Response(
    JSON.stringify({ created, skipped, total: (profs ?? []).length }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});