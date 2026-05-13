import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/lib/auth";
import { useLibrary } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Heart, UserPlus, UserCheck, Users, Sparkles, Lock, BookHeart, Globe, MapPin } from "lucide-react";
import { toast } from "sonner";
import { MOODS, type MoodKey } from "@/lib/moods";
import { usePremium } from "@/lib/usePremium";
import { useTasteSync } from "@/lib/useTasteSync";
import { Link } from "react-router-dom";

type Proximity = "city" | "country" | "worldwide";

type TwinResult = {
  userId: string;
  displayName: string | null;
  city: string | null;
  country: string | null;
  score: number;
  sharedMoods: string[];
  sharedGenres: string[];
  proximity: Proximity;
};

type TasteProfile = {
  user_id: string;
  top_emojis: string[];
  favorite_books: { title: string; author: string; mood?: string; cover?: string | null }[];
  mood_signature?: string | null;
  bio?: string | null;
};

type ProfileRow = {
  userId: string;
  displayName: string | null;
  bio: string | null;
  moodSignature: string | null;
};

const FREE_MATCH_CAP = 1;

function ProximityBadge({ proximity, city, country }: { proximity: Proximity; city: string | null; country: string | null }) {
  if (proximity === "city") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] rounded-full border border-border/40 px-2 py-0.5" style={{ color: "var(--mood-strong)" }}>
        <MapPin className="h-2.5 w-2.5" />
        {city ? `${city}` : "Your city"}
      </span>
    );
  }
  if (proximity === "country") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground rounded-full border border-border/40 px-2 py-0.5">
        <MapPin className="h-2.5 w-2.5" />
        {country ? `${country}` : "Same country"}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground rounded-full border border-border/40 px-2 py-0.5">
      <Globe className="h-2.5 w-2.5" />
      Global
    </span>
  );
}

export function TwinsPanel() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const isPremium = usePremium((s) => s.isPremium);
  const books = useLibrary((s) => s.books);
  useTasteSync();

  const [matches, setMatches] = useState<TwinResult[]>([]);
  const [tasteMap, setTasteMap] = useState<Record<string, TasteProfile>>({});
  const [profileMap, setProfileMap] = useState<Record<string, ProfileRow>>({});
  const [follows, setFollows] = useState<Set<string>>(new Set());
  const [loadingData, setLoadingData] = useState(true);
  const [noProfile, setNoProfile] = useState(false);

  useEffect(() => {
    if (!loading && !user) nav("/auth");
  }, [user, loading, nav]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoadingData(true);
      try {
        const [twinsRes, followsRes] = await Promise.all([
          fetch("/api/reading-twins", { credentials: "include" }),
          fetch("/api/follows", { credentials: "include" }),
        ]);
        if (cancelled) return;

        if (twinsRes.status === 204 || twinsRes.status === 404) {
          setNoProfile(true);
          return;
        }

        const twins: TwinResult[] = twinsRes.ok ? await twinsRes.json() : [];
        const followData = followsRes.ok ? await followsRes.json() : { following: [] };

        if (twins.length === 0 && twinsRes.ok) {
          // API returned empty — could mean no taste profile yet
          const body = await twinsRes.clone().json().catch(() => []);
          if (!Array.isArray(body) || body.length === 0) setNoProfile(false);
        }

        setMatches(twins);
        setFollows(new Set(followData.following ?? []));

        // Fetch taste profiles for emoji + favorite books display
        const ids = twins.map((t) => t.userId).filter(Boolean);
        if (ids.length) {
          const [tpRes, pRes] = await Promise.all([
            fetch("/api/taste-profiles", { credentials: "include" }),
            fetch(`/api/profiles?ids=${ids.join(",")}`, { credentials: "include" }),
          ]);
          if (cancelled) return;

          if (tpRes.ok) {
            const tps: TasteProfile[] = await tpRes.json();
            setTasteMap(Object.fromEntries(tps.map((tp) => [tp.user_id, tp])));
          }
          if (pRes.ok) {
            const ps: ProfileRow[] = await pRes.json();
            setProfileMap(Object.fromEntries(ps.map((p) => [p.userId, p])));
          }
        }
      } catch {
        // network error — leave loading state as false, empty matches
      } finally {
        if (!cancelled) setLoadingData(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  const visibleMatches = isPremium ? matches : matches.slice(0, FREE_MATCH_CAP);

  const toggleFollow = async (otherId: string) => {
    if (!user || otherId === user.id) return;
    try {
      const res = await fetch(`/api/follows/${otherId}`, { method: "POST", credentials: "include" });
      if (!res.ok) { toast.error("Failed."); return; }
      const data = await res.json();
      setFollows((s) => {
        const n = new Set(s);
        if (data.following) { n.add(otherId); toast.success("Now following."); }
        else n.delete(otherId);
        return n;
      });
    } catch { toast.error("Network error."); }
  };

  const startBuddyRead = async (m: TwinResult) => {
    const current = books.find((b) => b.shelf === "reading");
    if (!current) {
      toast.error("Set a current book in your library to start a buddy read.");
      return;
    }
    if (!user) return;
    try {
      const res = await fetch("/api/buddy-reads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          bookTitle: current.title,
          bookAuthor: current.author,
          bookCover: current.cover,
          totalPages: current.pages,
          spoilerPage: current.progress,
        }),
      });
      if (!res.ok) { toast.error("Couldn't start the room."); return; }
      toast.success("Buddy read created — share the room with them.");
      nav("/social");
    } catch { toast.error("Network error."); }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <header className="space-y-2 animate-fade-up">
        <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground flex items-center gap-1.5">
          <Heart className="h-3 w-3" /> Reading Twins
        </p>
        <h1 className="font-display text-4xl sm:text-5xl leading-[1.05]">
          Find readers who feel{" "}
          <span className="italic" style={{ color: "var(--mood-strong)" }}>
            like you
          </span>
          .
        </h1>
        <p className="text-muted-foreground max-w-md">
          Matched by mood, reactions, genres and reading habits — sorted by how close they are to you.
        </p>
      </header>

      {noProfile && !loadingData && (
        <div className="rounded-2xl border border-dashed border-border/60 p-10 text-center space-y-3">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-foreground/5">
            <Sparkles className="h-5 w-5" style={{ color: "var(--mood-strong)" }} />
          </div>
          <div className="font-display text-xl">Your taste fingerprint is still forming.</div>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Add a few books, react to some chapters and finish your mood quiz. We'll start
            matching you to readers who feel the same way.
          </p>
        </div>
      )}

      {loadingData && (
        <div className="rounded-2xl border border-border/40 p-10 text-center text-muted-foreground">
          Looking for your twins…
        </div>
      )}

      {!noProfile && !loadingData && matches.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border/60 p-10 text-center text-muted-foreground">
          No matches yet. Check back as more readers join.
        </div>
      )}

      <div className="space-y-4">
        {visibleMatches.map((m, i) => {
          const taste = tasteMap[m.userId];
          const profile = profileMap[m.userId];
          const isTop = i === 0;
          const followed = follows.has(m.userId);
          const sharedEmojis = taste?.top_emojis ?? [];

          return (
            <article
              key={m.userId}
              className="rounded-2xl bg-card/70 backdrop-blur border border-border/50 p-5 sm:p-6 space-y-4"
            >
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="font-display text-xl">
                      {m.displayName ?? profile?.displayName ?? "Reader"}
                    </div>
                    {isTop && (
                      <span
                        className="text-[10px] uppercase tracking-widest rounded-full border border-border/60 px-2 py-0.5"
                        style={{ background: "var(--mood-soft)" }}
                      >
                        Closest twin
                      </span>
                    )}
                    <ProximityBadge
                      proximity={m.proximity}
                      city={m.city}
                      country={m.country}
                    />
                  </div>
                  {profile?.moodSignature && (
                    <div className="text-xs text-muted-foreground italic">
                      "{profile.moodSignature}"
                    </div>
                  )}
                  {profile?.bio && (
                    <div className="text-xs text-muted-foreground line-clamp-2">{profile.bio}</div>
                  )}
                </div>
                <div className="text-right">
                  <div
                    className="font-display text-3xl tabular-nums"
                    style={{ color: "var(--mood-strong)" }}
                  >
                    {m.score}%
                  </div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    match
                  </div>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <Stat label="Shared moods" empty="No mood overlap yet">
                  {m.sharedMoods.map((mk) => {
                    const md = MOODS[mk as MoodKey];
                    if (!md) return null;
                    return (
                      <span
                        key={mk}
                        className="rounded-full border border-border/60 px-2 py-0.5 text-xs"
                        style={{ background: `hsl(${md.h} ${md.s}% ${md.l}% / 0.18)` }}
                      >
                        {md.emoji} {md.label}
                      </span>
                    );
                  })}
                </Stat>
                <Stat label="Shared reactions" empty="No emoji overlap yet">
                  {sharedEmojis.slice(0, 6).map((e) => (
                    <span
                      key={e}
                      className="rounded-full border border-border/60 bg-background/60 px-2 py-0.5 text-base leading-none"
                    >
                      {e}
                    </span>
                  ))}
                </Stat>
              </div>

              {isPremium ? (
                <div className="grid sm:grid-cols-2 gap-3">
                  <Stat label="Shared genres" empty="No genre overlap yet">
                    {m.sharedGenres.slice(0, 8).map((g) => (
                      <span key={g} className="rounded-full border border-border/60 bg-background/60 px-2 py-0.5 text-xs">
                        {g}
                      </span>
                    ))}
                  </Stat>
                  {m.city && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3 shrink-0" style={{ color: "var(--mood-strong)" }} />
                      {m.proximity === "city"
                        ? `Both in ${m.city}`
                        : m.proximity === "country"
                        ? `Both in ${m.country}`
                        : "Different regions"}
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border/60 p-3 text-xs text-muted-foreground flex items-center gap-2">
                  <Lock className="h-3.5 w-3.5" />
                  Upgrade to see shared genres, deeper compatibility, and exact location match.
                </div>
              )}

              {taste && (taste.favorite_books ?? []).length > 0 && (
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5">
                    <BookHeart className="h-3 w-3" /> Their favorites
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {(taste.favorite_books ?? []).slice(0, 6).map((b, idx) => (
                      <div
                        key={idx}
                        className="shrink-0 w-20 space-y-1.5"
                        title={`${b.title} — ${b.author}`}
                      >
                        <div className="aspect-[2/3] rounded-md overflow-hidden bg-muted shadow-book">
                          {b.cover ? (
                            <img src={b.cover} alt={b.title} className="h-full w-full object-cover" loading="lazy" />
                          ) : (
                            <div className="grid h-full place-items-center text-[9px] p-1 text-center text-muted-foreground">
                              {b.title.slice(0, 24)}
                            </div>
                          )}
                        </div>
                        <div className="text-[10px] line-clamp-2 leading-tight">{b.title}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-2 pt-1">
                <Button
                  size="sm"
                  variant={followed ? "secondary" : "outline"}
                  className="rounded-full gap-1.5"
                  onClick={() => toggleFollow(m.userId)}
                >
                  {followed ? (
                    <><UserCheck className="h-3.5 w-3.5" /> Following</>
                  ) : (
                    <><UserPlus className="h-3.5 w-3.5" /> Follow</>
                  )}
                </Button>
                <Button
                  size="sm"
                  className="rounded-full gap-1.5"
                  onClick={() => startBuddyRead(m)}
                >
                  <Users className="h-3.5 w-3.5" /> Start buddy read
                </Button>
              </div>
            </article>
          );
        })}
      </div>

      {!isPremium && matches.length > FREE_MATCH_CAP && (
        <section className="rounded-2xl border border-dashed border-border/60 p-6 text-center space-y-3">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-foreground/5">
            <Lock className="h-5 w-5" style={{ color: "var(--mood-strong)" }} />
          </div>
          <div className="space-y-1">
            <div className="font-display text-xl">
              {matches.length - FREE_MATCH_CAP} more twin{matches.length - FREE_MATCH_CAP === 1 ? "" : "s"} waiting.
            </div>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Free readers see their closest twin. Premium unlocks every match plus deeper
              compatibility insights including location proximity.
            </p>
          </div>
          <Link
            to="/profile"
            className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/80 px-4 py-2 text-sm hover:bg-background transition"
          >
            <Sparkles className="h-3.5 w-3.5" style={{ color: "var(--mood-strong)" }} />
            Manage subscription
          </Link>
        </section>
      )}
    </div>
  );
}

export default function Twins() {
  return (
    <AppShell>
      <TwinsPanel />
    </AppShell>
  );
}

function Stat({
  label,
  empty,
  children,
}: {
  label: string;
  empty: string;
  children: React.ReactNode;
}) {
  const arr = (Array.isArray(children) ? children : [children]).filter(Boolean) as React.ReactNode[];
  return (
    <div className="space-y-1.5">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      {arr.length === 0 ? (
        <div className="text-xs text-muted-foreground italic">{empty}</div>
      ) : (
        <div className="flex flex-wrap gap-1.5">{children}</div>
      )}
    </div>
  );
}
