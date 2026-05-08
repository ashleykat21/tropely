import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/lib/auth";
import { useLibrary } from "@/lib/store";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Heart, UserPlus, UserCheck, Users, Sparkles, Lock, BookHeart } from "lucide-react";
import { toast } from "sonner";
import { MOODS, type MoodKey } from "@/lib/moods";
import { scoreTwins, type TasteProfile, type TwinMatch } from "@/lib/twinScore";
import { usePremium } from "@/lib/usePremium";
import { useTasteSync } from "@/lib/useTasteSync";
import { Link } from "react-router-dom";

type ProfileRow = { user_id: string; display_name: string | null; bio: string | null; mood_signature: string | null };

const FREE_MATCH_CAP = 1;

export function TwinsPanel() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const isPremium = usePremium((s) => s.isPremium);
  const setCurrent = useLibrary((s) => s.setCurrent);
  const books = useLibrary((s) => s.books);
  useTasteSync();

  const [profiles, setProfiles] = useState<TasteProfile[]>([]);
  const [users, setUsers] = useState<Record<string, ProfileRow>>({});
  const [follows, setFollows] = useState<Set<string>>(new Set());
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && !user) nav("/auth");
  }, [user, loading, nav]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoadingData(true);
      const [{ data: tps }, { data: ps }, { data: fs }] = await Promise.all([
        supabase.from("taste_profiles").select("*"),
        supabase.from("profiles").select("user_id, display_name, bio, mood_signature"),
        supabase.from("follows").select("following_id").eq("follower_id", user.id),
      ]);
      if (cancelled) return;
      setProfiles((tps as unknown as TasteProfile[]) ?? []);
      setUsers(Object.fromEntries((ps ?? []).map((p) => [p.user_id, p as ProfileRow])));
      setFollows(new Set((fs ?? []).map((r: any) => r.following_id)));
      setLoadingData(false);
    })();
    return () => { cancelled = true; };
  }, [user]);

  const me = useMemo(() => profiles.find((p) => p.user_id === user?.id), [profiles, user]);

  const matches = useMemo<TwinMatch[]>(() => {
    if (!me) return [];
    return profiles
      .filter((p) => p.user_id !== me.user_id)
      .map((p) => scoreTwins(me, p))
      .sort((a, b) => b.score - a.score);
  }, [me, profiles]);

  const visibleMatches = isPremium ? matches : matches.slice(0, FREE_MATCH_CAP);

  const toggleFollow = async (otherId: string) => {
    if (!user || otherId === user.id) return;
    if (follows.has(otherId)) {
      const { error } = await supabase
        .from("follows")
        .delete()
        .eq("follower_id", user.id)
        .eq("following_id", otherId);
      if (error) return toast.error(error.message);
      setFollows((s) => {
        const n = new Set(s);
        n.delete(otherId);
        return n;
      });
    } else {
      const { error } = await supabase
        .from("follows")
        .insert({ follower_id: user.id, following_id: otherId });
      if (error) return toast.error(error.message);
      setFollows((s) => new Set(s).add(otherId));
      toast.success("Now following.");
    }
  };

  const startBuddyRead = async (m: TwinMatch) => {
    const current = books.find((b) => b.shelf === "reading");
    if (!current) {
      toast.error("Set a current book in your library to start a buddy read.");
      return;
    }
    if (!user) return;
    const { data, error } = await supabase
      .from("buddy_reads")
      .insert({
        owner_id: user.id,
        book_title: current.title,
        book_author: current.author,
        book_cover: current.cover,
        total_pages: current.pages,
        spoiler_page: current.progress,
      })
      .select()
      .maybeSingle();
    if (error || !data) return toast.error(error?.message ?? "Couldn't start the room.");
    toast.success("Buddy read created — share the room with them.");
    nav("/social");
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
            We match by mood, emoji reactions, genres and reading habits — never by stars.
          </p>
        </header>

        {!me && !loadingData && (
          <div className="rounded-2xl border border-dashed border-border/60 p-10 text-center space-y-3">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-foreground/5">
              <Sparkles className="h-5 w-5" style={{ color: "var(--mood-strong)" }} />
            </div>
            <div className="font-display text-xl">Your taste fingerprint is still forming.</div>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Add a few books, react to a few chapters and finish your mood quiz. We'll start
              matching you to readers who feel the same way.
            </p>
          </div>
        )}

        {loadingData && (
          <div className="rounded-2xl border border-border/40 p-10 text-center text-muted-foreground">
            Looking for your twins…
          </div>
        )}

        {me && !loadingData && matches.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border/60 p-10 text-center text-muted-foreground">
            No other readers yet. Check back soon as more readers join.
          </div>
        )}

        <div className="space-y-4">
          {visibleMatches.map((m, i) => {
            const profile = users[m.user_id];
            const taste = profiles.find((p) => p.user_id === m.user_id);
            const isTop = i === 0;
            const followed = follows.has(m.user_id);
            return (
              <article
                key={m.user_id}
                className="rounded-2xl bg-card/70 backdrop-blur border border-border/50 p-5 sm:p-6 space-y-4"
              >
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="font-display text-xl">
                        {profile?.display_name ?? "Reader"}
                      </div>
                      {isTop && (
                        <span
                          className="text-[10px] uppercase tracking-widest rounded-full border border-border/60 px-2 py-0.5"
                          style={{ background: "var(--mood-soft)" }}
                        >
                          Closest twin
                        </span>
                      )}
                    </div>
                    {profile?.mood_signature && (
                      <div className="text-xs text-muted-foreground italic">
                        “{profile.mood_signature}”
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

                {/* Shared signals */}
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
                    {m.sharedEmojis.map((e) => (
                      <span
                        key={e}
                        className="rounded-full border border-border/60 bg-background/60 px-2 py-0.5 text-base leading-none"
                      >
                        {e}
                      </span>
                    ))}
                  </Stat>
                </div>

                {/* Premium-only deep insights */}
                {isPremium ? (
                  <div className="grid sm:grid-cols-2 gap-3">
                    <Stat label="Shared genres" empty="No genre overlap yet">
                      {m.sharedGenres.slice(0, 8).map((g) => (
                        <span key={g} className="rounded-full border border-border/60 bg-background/60 px-2 py-0.5 text-xs">
                          {g}
                        </span>
                      ))}
                    </Stat>
                    <Stat label="Both finished" empty="No shared finished books yet">
                      {m.sharedBooks.slice(0, 5).map((b) => (
                        <span key={b} className="rounded-full border border-border/60 bg-background/60 px-2 py-0.5 text-xs capitalize">
                          {b}
                        </span>
                      ))}
                    </Stat>
                    {(m.paceMatch || m.ageMatch) && (
                      <div className="sm:col-span-2 text-xs text-muted-foreground flex items-center gap-3">
                        {m.paceMatch && <span>· Same reading pace</span>}
                        {m.ageMatch && <span>· Similar age band</span>}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-border/60 p-3 text-xs text-muted-foreground flex items-center gap-2">
                    <Lock className="h-3.5 w-3.5" />
                    Upgrade to see shared genres, both-finished books and pace/age compatibility.
                  </div>
                )}

                {/* Their favorite books */}
                {taste && taste.favorite_books.length > 0 && (
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5">
                      <BookHeart className="h-3 w-3" /> Their favorites
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {taste.favorite_books.slice(0, 6).map((b, idx) => (
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
                    onClick={() => toggleFollow(m.user_id)}
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
                compatibility insights.
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
  const arr = (Array.isArray(children) ? children : [children]).filter(Boolean) as any[];
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