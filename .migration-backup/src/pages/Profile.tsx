import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLibrary, type SpoilerStrictness } from "@/lib/store";
import { MOODS } from "@/lib/moods";
import { toast } from "sonner";
import { LogOut, ShieldCheck, Target, Bell, Download, Sparkles, Lock, EyeOff, Quote } from "lucide-react";
import { cn } from "@/lib/utils";
import { MoodSignatureCard } from "@/components/social/MoodSignatureCard";
import { downloadExport, downloadHighlightsCsv } from "@/lib/exportData";
import { usePremium } from "@/lib/usePremium";
import { LockedFeature } from "@/components/premium/LockedFeature";
import { ShelfCustomizer } from "@/components/reader/ShelfCustomizer";
import { Palette } from "lucide-react";
import { PushToggleCard } from "@/components/notifications/PushToggleCard";
import { LOCALES, useLocale, type Locale } from "@/lib/i18n";
import { Languages } from "lucide-react";
import { computeBadges, topEarnedBadge } from "@/lib/badges";

export default function Profile() {
  const { user, loading, signOut } = useAuth();
  const nav = useNavigate();
  const { books, reactionLog, spoilerStrictness, setSpoilerStrictness, journal, sessions, reflections } = useLibrary();
  const dailyGoalPages = useLibrary((s) => s.dailyGoalPages);
  const setDailyGoal = useLibrary((s) => s.setDailyGoal);
  const privateLibrary = useLibrary((s) => s.privateLibrary);
  const setPrivateLibrary = useLibrary((s) => s.setPrivateLibrary);
  const defaultShareVisibility = useLibrary((s) => s.defaultShareVisibility);
  const setDefaultShareVisibility = useLibrary((s) => s.setDefaultShareVisibility);
  const isPremium = usePremium((s) => s.isPremium);
  const togglePremium = usePremium((s) => s.togglePremium);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [signature, setSignature] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && !user) nav("/auth");
  }, [user, loading, nav]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("display_name,bio,mood_signature")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setDisplayName(data.display_name ?? "");
          setBio(data.bio ?? "");
          setSignature(data.mood_signature ?? "");
        }
      });
  }, [user]);

  const save = async () => {
    if (!user) return;
    setBusy(true);
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName, bio, mood_signature: signature, is_private: privateLibrary })
      .eq("user_id", user.id);
    setBusy(false);
    if (error) toast.error(error.message);
    else toast.success("Profile saved.");
  };

  const topMood = Object.entries(
    books.reduce<Record<string, number>>((a, b) => ({ ...a, [b.mood]: (a[b.mood] || 0) + 1 }), {})
  ).sort((a, b) => b[1] - a[1])[0]?.[0];

  const topBadge = topEarnedBadge(
    computeBadges({ books, sessions, reactionLog, reflections, journal })
  );
  const showBadgeFlair = useLibrary((s) => s.showBadgeFlair);
  const setShowBadgeFlair = useLibrary((s) => s.setShowBadgeFlair);

  return (
    <AppShell>
      <div className="space-y-8 max-w-2xl">
        <header className="space-y-2 animate-fade-up">
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">You</p>
          <h1 className="font-display text-4xl sm:text-5xl leading-[1.05]">
            Your reading{" "}
            <span className="italic" style={{ color: "var(--mood-strong)" }}>
              self
            </span>
            .
          </h1>
          {topBadge && showBadgeFlair && (
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/70 backdrop-blur px-3 py-1.5 text-sm">
              <span className="text-base leading-none">{topBadge.emoji}</span>
              <span className="font-display">{topBadge.label}</span>
              <span className="text-xs text-muted-foreground">· top achievement</span>
            </div>
          )}
        </header>

        <section className="rounded-2xl bg-card/70 p-4 border border-border/40 flex items-center justify-between gap-3">
          <div>
            <div className="font-display text-base">Show achievement flair</div>
            <div className="text-xs text-muted-foreground">
              Display your top earned badge on your profile icon and header.
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={showBadgeFlair}
            onClick={() => setShowBadgeFlair(!showBadgeFlair)}
            className={cn(
              "relative h-6 w-11 rounded-full transition",
              showBadgeFlair ? "bg-foreground" : "bg-muted"
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 h-5 w-5 rounded-full bg-background transition",
                showBadgeFlair ? "left-[22px]" : "left-0.5"
              )}
            />
          </button>
        </section>

        <div className="grid sm:grid-cols-3 gap-3">
          <div className="rounded-2xl mood-surface p-4 border border-border/40">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Books</div>
            <div className="font-display text-2xl mt-1">{books.length}</div>
          </div>
          <div className="rounded-2xl mood-surface p-4 border border-border/40">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Reactions</div>
            <div className="font-display text-2xl mt-1">{reactionLog.length}</div>
          </div>
          <div className="rounded-2xl mood-surface p-4 border border-border/40">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Vibe</div>
            <div className="font-display text-2xl mt-1">
              {topMood ? `${MOODS[topMood as keyof typeof MOODS].emoji} ${MOODS[topMood as keyof typeof MOODS].label}` : "—"}
            </div>
          </div>
        </div>

        <section className="rounded-2xl bg-card/70 p-6 border border-border/40 space-y-4">
          <h2 className="font-display text-2xl">Profile</h2>
          <div className="space-y-1.5">
            <Label>Display name</Label>
            <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Mood signature</Label>
            <Input
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
              placeholder="e.g. melancholy with a streak of joy"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Bio</Label>
            <Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="A line about the kind of reader you are." />
          </div>
          <div className="flex items-center justify-between gap-2 pt-2">
            <Button variant="ghost" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-1" /> Sign out
            </Button>
            <div className="flex gap-2">
              <MoodSignatureCard />
              <Button onClick={save} disabled={busy} className="rounded-full">
                Save
              </Button>
            </div>
          </div>
        </section>

        <section className="rounded-2xl bg-card/70 p-6 border border-border/40 space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-display text-2xl">Spoiler guardrails</h2>
          </div>
          <p className="text-sm text-muted-foreground -mt-2">
            How carefully should the Companion avoid anything past your current page?
          </p>
          <div className="grid sm:grid-cols-3 gap-2">
            {([
              {
                key: "relaxed",
                title: "Relaxed",
                desc: "Vague tonal hints about later sections are OK if you ask.",
              },
              {
                key: "balanced",
                title: "Balanced",
                desc: "No spoilers, but the Companion will tell you it's holding back.",
              },
              {
                key: "strict",
                title: "Strict",
                desc: "Total lockdown. No mention of later chapters at all — even tone.",
              },
            ] as { key: SpoilerStrictness; title: string; desc: string }[]).map((opt) => (
              <button
                key={opt.key}
                onClick={() => {
                  setSpoilerStrictness(opt.key);
                  toast.success(`Spoiler guardrails: ${opt.title}`);
                }}
                className={cn(
                  "text-left rounded-xl border p-3 transition",
                  spoilerStrictness === opt.key
                    ? "border-foreground bg-foreground/5"
                    : "border-border bg-white/40 hover:bg-white/70"
                )}
              >
                <div className="font-display text-base">{opt.title}</div>
                <div className="text-xs text-muted-foreground mt-1 leading-snug">{opt.desc}</div>
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-2xl bg-card/70 p-6 border border-border/40 space-y-3">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-display text-2xl">Daily reading goal</h2>
          </div>
          <p className="text-sm text-muted-foreground -mt-1">
            Hit this many pages in a day to keep your streak alive.
          </p>
          <div className="flex items-center gap-3">
            <Input
              type="number"
              min={1}
              max={500}
              value={dailyGoalPages}
              onChange={(e) => setDailyGoal(parseInt(e.target.value || "0", 10))}
              className="w-28"
            />
            <span className="text-sm text-muted-foreground">pages / day</span>
            <div className="ml-auto flex gap-1.5">
              {[10, 20, 40].map((n) => (
                <button
                  key={n}
                  onClick={() => setDailyGoal(n)}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-xs transition",
                    dailyGoalPages === n
                      ? "bg-foreground text-background border-foreground"
                      : "bg-white/60 border-border hover:bg-white"
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-2xl bg-card/70 p-6 border border-border/40 space-y-3">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-display text-2xl">Daily digest</h2>
          </div>
          <p className="text-sm text-muted-foreground -mt-1">
            Feltly sends you a quiet, spoiler-safe summary once a day with what your circle felt
            and any new buddy-read messages. It appears in the bell at the top.
          </p>
          <Button
            variant="outline"
            className="rounded-full"
            onClick={async () => {
              if (!user) return;
              const t = toast.loading("Building your digest…");
              const { data, error } = await supabase.functions.invoke("daily-digest", {
                body: { force: true, user: user.id },
              });
              toast.dismiss(t);
              if (error) toast.error(error.message);
              else if ((data as any)?.created > 0)
                toast.success("Digest delivered — check the bell.");
              else toast.message("Nothing new to summarize right now.");
            }}
          >
            <Bell className="h-3.5 w-3.5 mr-1.5" /> Send me a test digest
          </Button>
        </section>

        <PushToggleCard />

        <LanguageCard />

        <section className="rounded-2xl bg-card/70 p-6 border border-border/40 space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" style={{ color: "var(--mood-strong)" }} />
            <h2 className="font-display text-2xl">Premium</h2>
          </div>
          <p className="text-sm text-muted-foreground -mt-1">
            Premium unlocks the AI Companion, physical book scanning, Deep Insights, unlimited
            Buddy Reads, Focus Mode + ambient sounds, bookshelf customization, and bulk library
            imports. Subscriptions are handled by the App Store / Play Store.
          </p>
          <ul className="text-xs text-muted-foreground space-y-1 ml-1">
            <li>· AI Companion — spoiler-safe reflective chat about your current read</li>
            <li>· Scan physical books — autofill from a cover photo or ISBN</li>
            <li>· Deep insights — slumps, mood vs genre, monthly reports, genre fingerprint</li>
            <li>· Buddy reads — unlimited members + chapter-based discussions</li>
            <li>· Focus mode — fullscreen reading with ambient sound generators</li>
            <li>· Bookshelf customization — themed shelf styles and accents</li>
            <li>· Bulk library import from Goodreads / StoryGraph CSV</li>
          </ul>
          <div className="flex items-center justify-between gap-3 pt-2 rounded-xl border border-dashed border-border/60 p-3">
            <div className="text-xs">
              <div className="font-medium flex items-center gap-1.5">
                {isPremium ? (
                  <>
                    <Sparkles className="h-3.5 w-3.5" style={{ color: "var(--mood-strong)" }} />
                    Premium active
                  </>
                ) : (
                  <>
                    <Lock className="h-3.5 w-3.5" />
                    Premium locked
                  </>
                )}
              </div>
              <div className="text-muted-foreground mt-0.5">
                Dev toggle — simulate a successful in-app purchase.
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="rounded-full"
              onClick={() => {
                togglePremium();
                toast.success(isPremium ? "Premium disabled (dev)" : "Premium unlocked (dev)");
              }}
            >
              {isPremium ? "Disable" : "Unlock"} (dev)
            </Button>
          </div>
        </section>

        <section className="rounded-2xl bg-card/70 p-6 border border-border/40 space-y-3">
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-display text-2xl">Bookshelf</h2>
          </div>
          <p className="text-sm text-muted-foreground -mt-1">
            Pick a look for your library. Premium feature.
          </p>
          <LockedFeature description="Customize your bookshelf with themed backgrounds and accents.">
            <ShelfCustomizer />
          </LockedFeature>
        </section>

        <section className="rounded-2xl bg-card/70 p-6 border border-border/40 space-y-3">
          <div className="flex items-center gap-2">
            <Download className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-display text-2xl">Export your data</h2>
          </div>
          <p className="text-sm text-muted-foreground -mt-1">
            Take everything with you — your library, journal, sessions, reflections and reactions.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              className="rounded-full"
              onClick={() => {
                downloadExport(
                  {
                    exportedAt: new Date().toISOString(),
                    version: 1,
                    books, journal, sessions, reactionLog, reflections,
                  },
                  "json",
                );
                toast.success("Export downloaded.");
              }}
            >
              <Download className="h-3.5 w-3.5 mr-1.5" /> Full export (JSON)
            </Button>
            <Button
              variant="outline"
              className="rounded-full"
              onClick={() => {
                downloadExport(
                  {
                    exportedAt: new Date().toISOString(),
                    version: 1,
                    books, journal, sessions, reactionLog, reflections,
                  },
                  "csv",
                );
                toast.success("Library CSV downloaded.");
              }}
            >
              <Download className="h-3.5 w-3.5 mr-1.5" /> Library (CSV)
            </Button>
            <Button
              variant="outline"
              className="rounded-full"
              onClick={() => {
                downloadHighlightsCsv({
                  exportedAt: new Date().toISOString(),
                  version: 1,
                  books, journal, sessions, reactionLog, reflections,
                });
                toast.success("Highlights CSV downloaded.");
              }}
            >
              <Quote className="h-3.5 w-3.5 mr-1.5" /> Highlights (CSV)
            </Button>
          </div>
        </section>

        <section className="rounded-2xl bg-card/70 p-6 border border-border/40 space-y-4">
          <div className="flex items-center gap-2">
            <EyeOff className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-display text-2xl">Privacy</h2>
          </div>
          <p className="text-sm text-muted-foreground -mt-1">
            Choose how visible your reading life is to other Feltly readers.
          </p>

          <label className="flex items-start gap-3 rounded-xl border border-border/50 p-3 cursor-pointer hover:bg-foreground/[0.02] transition">
            <input
              type="checkbox"
              checked={privateLibrary}
              onChange={(e) => setPrivateLibrary(e.target.checked)}
              className="mt-1"
            />
            <div>
              <div className="text-sm font-medium">Private library</div>
              <div className="text-xs text-muted-foreground">
                Hide your shelves from your profile and stop new activity from being shared.
                Existing posts stay until you delete them.
              </div>
            </div>
          </label>

          <div className="space-y-2">
            <Label className="text-xs">Default share visibility</Label>
            <div className="grid grid-cols-3 gap-2">
              {([
                { key: "public", title: "Everyone" },
                { key: "followers", title: "Followers" },
                { key: "private", title: "Only me" },
              ] as const).map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => {
                    setDefaultShareVisibility(opt.key);
                    toast.success(`Default visibility: ${opt.title}`);
                  }}
                  className={cn(
                    "rounded-xl border px-3 py-2 text-sm transition",
                    defaultShareVisibility === opt.key
                      ? "border-foreground bg-foreground/5"
                      : "border-border bg-background/40 hover:bg-background"
                  )}
                >
                  {opt.title}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Used as the default when you share a feeling. You can change it on each post.
            </p>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function LanguageCard() {
  const { locale, setLocale, t } = useLocale();
  return (
    <section className="rounded-2xl bg-card/70 p-6 border border-border/40 space-y-3">
      <div className="flex items-center gap-2">
        <Languages className="h-4 w-4" style={{ color: "var(--mood-strong)" }} />
        <h2 className="font-display text-2xl">{t("settings.language")}</h2>
      </div>
      <p className="text-sm text-muted-foreground -mt-1">{t("settings.language_help")}</p>
      <div className="flex flex-wrap gap-2 pt-1">
        {LOCALES.map((l) => (
          <button
            key={l.code}
            onClick={() => setLocale(l.code as Locale)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm transition",
              locale === l.code
                ? "bg-foreground text-background border-foreground"
                : "bg-white/60 border-border hover:bg-white"
            )}
          >
            {l.label}
          </button>
        ))}
      </div>
    </section>
  );
}
