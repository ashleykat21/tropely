import { AppShell } from "@/components/layout/AppShell";
import { useLibrary } from "@/lib/store";
import { MOODS, type MoodKey } from "@/lib/moods";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { Sparkles, BookOpen, Headphones, Lock, Fingerprint, Smile, Trophy, PlayCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { TopTropesInsight } from "@/components/insights/TopTropesInsight";
import { TropeMoodCorrelation } from "@/components/tropes/TropeMoodCorrelation";
import { TropeChallenge } from "@/components/tropes/TropeChallenge";
import { Share2 } from "lucide-react";
import { renderTropeCard, shareOrDownload } from "@/lib/shareImage";
import { toast } from "sonner";
import { ReadingPersonality } from "@/components/insights/ReadingPersonality";
import { MicroGoals } from "@/components/reader/MicroGoals";
import { AddBookDialog } from "@/components/reader/AddBookDialog";
import { PremiumDeepInsights } from "@/components/insights/PremiumDeepInsights";
import { ReadingCalendar } from "@/components/insights/ReadingCalendar";
import { ReadingHeatMap } from "@/components/insights/ReadingHeatMap";
import { MonthlyMoodReport } from "@/components/insights/MonthlyMoodReport";
import { YearlyChallenge } from "@/components/insights/YearlyChallenge";
import { ReadingDNA } from "@/components/insights/ReadingDNA";
import { HighlightsGallery } from "@/components/insights/HighlightsGallery";
import { ReadingChapters } from "@/components/insights/ReadingChapters";
import { MoodDriftInsight } from "@/components/insights/MoodDriftInsight";
import { BestTimeInsight } from "@/components/insights/BestTimeInsight";
import { LockedFeature } from "@/components/premium/LockedFeature";
import { YearlyGoalCard } from "@/components/reader/YearlyGoalCard";
import { usePremium } from "@/lib/usePremium";

function WrapEntryButton() {
  const isPremium = usePremium((s) => s.isPremium);
  const nav = useNavigate();
  const year = new Date().getFullYear();
  if (isPremium) {
    return (
      <Link
        to="/wrap"
        className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/70 backdrop-blur px-3 py-1.5 text-sm hover:bg-card transition"
      >
        <Sparkles className="h-3.5 w-3.5" style={{ color: "var(--mood-strong)" }} />
        See your {year} Tropely Wrap
      </Link>
    );
  }
  return (
    <button
      onClick={() =>
        toast("Tropely Wrap is a premium feature", {
          description: "Upgrade to unlock your annual year-in-review.",
          icon: <Lock className="h-4 w-4" />,
        })
      }
      className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/40 backdrop-blur px-3 py-1.5 text-sm text-muted-foreground cursor-not-allowed opacity-70"
    >
      <Lock className="h-3.5 w-3.5" />
      {year} Tropely Wrap · Premium
    </button>
  );
}

const TROPE_VIEWS = [
  { value: "fingerprint", label: "Fingerprint", icon: Fingerprint, hint: "Your most-read tropes" },
  { value: "mood", label: "Mood match", icon: Smile, hint: "Tropes × moods correlation" },
  { value: "challenge", label: "Challenge", icon: Trophy, hint: "Tropes still to explore" },
] as const;
type TropeView = typeof TROPE_VIEWS[number]["value"];

const Insights = () => {
  const { books, reactionLog, journal, sessions } = useLibrary();
  const [tropeView, setTropeView] = useState<TropeView>("fingerprint");
  const nav = useNavigate();
  const location = useLocation();
  const focusSessionId =
    (location.state as { focusSessionId?: string } | null)?.focusSessionId ?? null;
  const sessionRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [highlightedSessionId, setHighlightedSessionId] = useState<string | null>(null);

  const recentSessions = useMemo(
    () => [...sessions].sort((a, b) => b.at - a.at).slice(0, 12),
    [sessions]
  );
  const sessionsForDisplay = useMemo(() => {
    if (!focusSessionId) return recentSessions;
    if (recentSessions.some((s) => s.id === focusSessionId)) return recentSessions;
    const cited = sessions.find((s) => s.id === focusSessionId);
    return cited ? [cited, ...recentSessions] : recentSessions;
  }, [recentSessions, sessions, focusSessionId]);
  const bookById = useMemo(() => {
    const m = new Map<string, typeof books[number]>();
    books.forEach((b) => m.set(b.id, b));
    return m;
  }, [books]);

  // When arriving with a focusSessionId from a Companion citation, scroll the
  // matching session into view and briefly highlight it. Clear the navigation
  // state so a back/refresh doesn't re-trigger the highlight.
  useEffect(() => {
    if (!focusSessionId) return;
    const target = sessionRefs.current.get(focusSessionId);
    if (!target) {
      // Either the session list hasn't hydrated yet or the cited session
      // isn't in our data. Clear navigation state if the session truly
      // isn't resolvable so a refresh doesn't loop on it.
      if (sessionsForDisplay.length > 0 && !sessionsForDisplay.some((s) => s.id === focusSessionId)) {
        nav(location.pathname, { replace: true, state: null });
      }
      return;
    }
    target.scrollIntoView({ behavior: "smooth", block: "center" });
    setHighlightedSessionId(focusSessionId);
    nav(location.pathname, { replace: true, state: null });
    const t = window.setTimeout(() => setHighlightedSessionId(null), 2400);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusSessionId, sessionsForDisplay.length]);

  const topTropes = useMemo(() => {
    const counts: Record<string, number> = {};
    books.forEach((b) =>
      (b.tropes ?? []).forEach((t) => {
        counts[t] = (counts[t] || 0) + 1;
      })
    );
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10) as [string, number][];
  }, [books]);

  const shareFingerprint = async () => {
    const t = toast.loading("Creating your trope fingerprint card…");
    try {
      const blob = await renderTropeCard({ tropes: topTropes });
      const r = await shareOrDownload(blob, "tropely-tropes.png");
      toast.dismiss(t);
      toast.success(r === "shared" ? "Shared!" : "Saved to your device");
    } catch {
      toast.dismiss(t);
      toast.error("Couldn't generate the image");
    }
  };
  const isCold = sessions.length === 0 && reactionLog.length === 0 && journal.length === 0;

  const totalPages = books.reduce((a, b) => a + b.progress, 0);
  const finished = books.filter((b) => b.shelf === "finished").length;

  const moodDist = useMemo(() => {
    const counts: Record<string, { read: number; listened: number; unset: number }> = {};
    books.forEach((b) => {
      const slot =
        counts[b.mood] ?? (counts[b.mood] = { read: 0, listened: 0, unset: 0 });
      if (b.consumption === "read") slot.read++;
      else if (b.consumption === "listened") slot.listened++;
      else slot.unset++;
    });
    const totals = Object.entries(counts).map(([k, c]) => ({
      mood: k as MoodKey,
      read: c.read,
      listened: c.listened,
      unset: c.unset,
      v: c.read + c.listened + c.unset,
    }));
    const max = Math.max(1, ...totals.map((t) => t.v));
    return totals
      .map((t) => ({ ...t, pct: t.v / max }))
      .sort((a, b) => b.v - a.v);
  }, [books]);

  const bookConsumption = useMemo(() => {
    const m = new Map<string, "read" | "listened" | undefined>();
    books.forEach((b) => m.set(b.id, b.consumption));
    return m;
  }, [books]);

  const days = useMemo(() => {
    const arr: {
      date: Date;
      count: number;
      readPages: number;
      listenedPages: number;
    }[] = [];
    const now = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      arr.push({ date: d, count: 0, readPages: 0, listenedPages: 0 });
    }
    reactionLog.forEach((r) => {
      const d = new Date(r.at);
      d.setHours(0, 0, 0, 0);
      const slot = arr.find((a) => a.date.getTime() === d.getTime());
      if (slot) slot.count++;
    });
    sessions.forEach((s) => {
      const d = new Date(s.at);
      d.setHours(0, 0, 0, 0);
      const slot = arr.find((a) => a.date.getTime() === d.getTime());
      if (!slot) return;
      const consumption = bookConsumption.get(s.bookId);
      if (consumption === "listened") slot.listenedPages += s.pagesRead;
      else slot.readPages += s.pagesRead;
    });
    return arr;
  }, [reactionLog, sessions, bookConsumption]);

  const topEmotion = useMemo(() => {
    const c: Record<string, number> = {};
    reactionLog.forEach((r) => (c[r.emoji] = (c[r.emoji] || 0) + 1));
    return Object.entries(c).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
  }, [reactionLog]);

  const maxDay = Math.max(1, ...days.map((d) => d.count));
  const maxPages = Math.max(1, ...days.map((d) => d.readPages + d.listenedPages));

  return (
    <AppShell>
      <div className="space-y-10 max-w-4xl">
        <header className="space-y-2 animate-fade-up">
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Insights</p>
          <h1 className="font-display text-4xl sm:text-5xl leading-[1.05]">
            Your reading{" "}
            <span className="italic" style={{ color: "var(--mood-strong)" }}>
              landscape
            </span>
            .
          </h1>
          <div className="pt-2">
            <WrapEntryButton />
          </div>
        </header>

        {isCold && (
          <div className="rounded-2xl border border-dashed border-border/60 p-10 text-center space-y-3">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-foreground/5">
              <Sparkles className="h-5 w-5" style={{ color: "var(--mood-strong)" }} />
            </div>
            <div className="font-display text-xl">Your landscape is still forming.</div>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Log a session to start seeing your Mood Pulse — your trope fingerprint,
              signature, and Wrap will fill in from there.
            </p>
            <div className="flex justify-center gap-2 pt-1 flex-wrap">
              {books.length === 0 ? (
                <AddBookDialog />
              ) : (
                <Button
                  className="rounded-full gap-1.5"
                  onClick={() => window.dispatchEvent(new CustomEvent("feltly:open-quick-log"))}
                >
                  <PlayCircle className="h-4 w-4" /> Log a session
                </Button>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Pages", value: totalPages },
            { label: "Finished", value: finished },
            { label: "Reactions", value: reactionLog.length },
            { label: "Top emotion", value: topEmotion },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl mood-surface p-5 border border-border/40">
              <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{s.label}</div>
              <div className="font-display text-3xl mt-2">{s.value}</div>
            </div>
          ))}
        </div>

        <YearlyChallenge />
        <YearlyGoalCard />
        <MicroGoals />
        <ReadingChapters />
        <BestTimeInsight />
        <MoodDriftInsight />

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="space-y-0.5">
              <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Tropes</p>
              <h2 className="font-display text-2xl">Your trope universe</h2>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Pill-tab switcher */}
              <div className="flex gap-1 rounded-full border border-border/60 bg-card/80 backdrop-blur p-1">
                {TROPE_VIEWS.map((v) => {
                  const Icon = v.icon;
                  const active = tropeView === v.value;
                  return (
                    <button
                      key={v.value}
                      onClick={() => setTropeView(v.value)}
                      title={v.hint}
                      className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition whitespace-nowrap ${
                        active
                          ? "bg-foreground text-background"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5 shrink-0" />
                      <span className="hidden sm:inline">{v.label}</span>
                    </button>
                  );
                })}
              </div>
              {topTropes.length > 0 && tropeView === "fingerprint" && (
                <button
                  onClick={shareFingerprint}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/70 px-3 py-1.5 text-sm hover:bg-card transition"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  Share
                </button>
              )}
            </div>
          </div>
          {tropeView === "fingerprint" && <TopTropesInsight />}
          {tropeView === "mood" && <TropeMoodCorrelation />}
          {tropeView === "challenge" && <TropeChallenge />}
        </div>

        <section className="rounded-2xl mood-surface p-6 border border-border/40 space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <h2 className="font-display text-2xl">14-day mood pulse</h2>
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <span
                    className="h-2.5 w-2.5 rounded-sm"
                    style={{ background: "var(--mood-strong)" }}
                  />
                  <BookOpen className="h-3 w-3" /> Read
                </span>
                <span className="inline-flex items-center gap-1">
                  <span
                    className="h-2.5 w-2.5 rounded-sm"
                    style={{ background: "hsl(var(--foreground) / 0.45)" }}
                  />
                  <Headphones className="h-3 w-3" /> Listened
                </span>
              </div>
            </div>
            <div className="relative flex items-end gap-1.5 h-32">
              {days.map((d, i) => {
                const totalPagesDay = d.readPages + d.listenedPages;
                const usePages = totalPagesDay > 0;
                const heightPct = usePages
                  ? (totalPagesDay / maxPages) * 100
                  : (d.count / maxDay) * 100;
                const readShare = usePages ? d.readPages / totalPagesDay : 1;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full rounded-t-md overflow-hidden flex flex-col-reverse transition"
                      style={{
                        height: `${heightPct}%`,
                        minHeight: totalPagesDay > 0 || d.count > 0 ? 6 : 2,
                        opacity: totalPagesDay > 0 || d.count > 0 ? 1 : 0.2,
                        background: usePages ? undefined : "var(--mood-strong)",
                      }}
                    >
                      {usePages && (
                        <>
                          <div
                            style={{
                              height: `${readShare * 100}%`,
                              background: "var(--mood-strong)",
                            }}
                          />
                          <div
                            style={{
                              height: `${(1 - readShare) * 100}%`,
                              background: "hsl(var(--foreground) / 0.45)",
                            }}
                          />
                        </>
                      )}
                    </div>
                    <div className="text-[9px] text-muted-foreground">{d.date.getDate()}</div>
                  </div>
                );
              })}
            </div>
        </section>

        {sessionsForDisplay.length > 0 && (
          <section className="rounded-2xl bg-card/70 p-6 border border-border/40 space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <h2 className="font-display text-2xl">Recent sessions</h2>
            </div>
            <div className="space-y-1">
              {sessionsForDisplay.map((s) => {
                const b = bookById.get(s.bookId);
                const moodInfo = MOODS[s.mood];
                const moodVars = moodInfo
                  ? ({
                      ["--mood-strong" as string]: `hsl(${moodInfo.h} ${moodInfo.s}% ${moodInfo.l}%)`,
                      ["--mood-soft" as string]: `hsl(${moodInfo.h} ${moodInfo.s}% ${Math.min(96, moodInfo.l + 35)}% / 0.35)`,
                    } as React.CSSProperties)
                  : undefined;
                return (
                  <div
                    key={s.id}
                    ref={(el) => {
                      if (el) sessionRefs.current.set(s.id, el);
                      else sessionRefs.current.delete(s.id);
                    }}
                    data-session-id={s.id}
                    style={moodVars}
                    className={cn(
                      "flex items-center justify-between gap-3 text-sm border-b border-border/30 last:border-0 py-1.5 -mx-2 px-2 rounded-md transition-colors duration-500",
                      highlightedSessionId === s.id &&
                        "bg-[var(--mood-soft)] ring-2 ring-[var(--mood-strong)]/40"
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="shrink-0">{moodInfo?.emoji}</span>
                      <span className="shrink-0 tabular-nums">
                        p.{s.fromPage} → p.{s.toPage}{" "}
                        <span className="text-muted-foreground">(+{s.pagesRead})</span>
                      </span>
                      {b && (
                        <Link
                          to={`/book/${b.id}`}
                          className="text-muted-foreground hover:text-foreground transition truncate min-w-0"
                        >
                          · {b.title}
                        </Link>
                      )}
                    </div>
                    <span className="text-[11px] text-muted-foreground shrink-0">
                      {new Date(s.at).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <section className="rounded-2xl bg-card/70 p-6 border border-border/40 space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <h2 className="font-display text-2xl">Mood signature</h2>
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <BookOpen className="h-3 w-3" /> Read
                </span>
                <span className="inline-flex items-center gap-1">
                  <Headphones className="h-3 w-3" /> Listened
                </span>
              </div>
            </div>
            <div className="space-y-2">
              {moodDist.map((m) => (
                <div key={m.mood} className="flex items-center gap-3">
                  <div className="w-20 sm:w-28 text-xs sm:text-sm flex items-center gap-1 shrink-0">
                    <span>{MOODS[m.mood].emoji}</span>
                    {MOODS[m.mood].label}
                  </div>
                  <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden flex">
                    {(() => {
                      const moodColor = `hsl(${MOODS[m.mood].h} ${MOODS[m.mood].s}% ${MOODS[m.mood].l}%)`;
                      const totalWidth = m.pct * 100;
                      const readW = m.v ? (m.read / m.v) * totalWidth : 0;
                      const listenedW = m.v ? (m.listened / m.v) * totalWidth : 0;
                      const unsetW = m.v ? (m.unset / m.v) * totalWidth : 0;
                      return (
                        <>
                          <div className="h-full" style={{ width: `${readW}%`, background: moodColor }} />
                          <div
                            className="h-full"
                            style={{
                              width: `${listenedW}%`,
                              background: moodColor,
                              opacity: 0.45,
                              backgroundImage:
                                "repeating-linear-gradient(45deg, transparent 0 3px, hsl(var(--background) / 0.5) 3px 4px)",
                            }}
                          />
                          <div
                            className="h-full"
                            style={{ width: `${unsetW}%`, background: moodColor, opacity: 0.2 }}
                          />
                        </>
                      );
                    })()}
                  </div>
                  <div className="w-16 sm:w-24 text-right text-[10px] sm:text-[11px] text-muted-foreground tabular-nums flex items-center justify-end gap-1 shrink-0">
                    <span className="inline-flex items-center gap-0.5">
                      <BookOpen className="h-2.5 w-2.5" />{m.read}
                    </span>
                    <span className="inline-flex items-center gap-0.5">
                      <Headphones className="h-2.5 w-2.5" />{m.listened}
                    </span>
                  </div>
                </div>
              ))}
              {moodDist.length === 0 && (
                <p className="text-muted-foreground text-sm">Add a few books to see your signature emerge.</p>
              )}
            </div>
        </section>

        <HighlightsGallery />
        <ReadingCalendar />
        <ReadingPersonality />

        {/* Premium analytics teaser — all advanced widgets in one place */}
        <LockedFeature description="Unlock deeper analytics: Reading DNA, weekly mood splits, taste fingerprint, annual heat map, monthly mood reports, and advanced pattern deep-dives.">
          <div className="rounded-2xl border border-border/40 bg-card/60 p-6 space-y-4">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Premium</p>
              <h2 className="font-display text-2xl">Deeper analytics</h2>
              <p className="text-sm text-muted-foreground">Six more insight layers, unlocked together.</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { label: "Reading DNA", desc: "Mood profile · session patterns · format split" },
                { label: "Weekly mood split", desc: "8-week mood shift by read vs. listened" },
                { label: "Taste fingerprint", desc: "Every genre and theme weighted across your library" },
                { label: "Annual heat map", desc: "Every reading day, coloured by mood and intensity" },
                { label: "Monthly reports", desc: "How your reading shifted month by month" },
                { label: "Deep-dive analytics", desc: "Slumps, peak hours and mood-vs-genre patterns" },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-border/40 bg-background/40 p-3 space-y-1">
                  <div className="text-xs font-medium">{item.label}</div>
                  <div className="text-[11px] text-muted-foreground leading-snug">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </LockedFeature>
      </div>
    </AppShell>
  );
};

export default Insights;
