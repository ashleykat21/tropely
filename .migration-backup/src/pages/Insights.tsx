import { AppShell } from "@/components/layout/AppShell";
import { useLibrary } from "@/lib/store";
import { MOODS, type MoodKey } from "@/lib/moods";
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Sparkles, BookOpen, Headphones } from "lucide-react";
import { AddBookDialog } from "@/components/reader/AddBookDialog";
import { TagBreakdown } from "@/components/insights/TagBreakdown";
import { PremiumDeepInsights } from "@/components/insights/PremiumDeepInsights";
import { ReadingCalendar } from "@/components/insights/ReadingCalendar";
import { MonthlyMoodReport } from "@/components/insights/MonthlyMoodReport";
import { YearlyChallenge } from "@/components/insights/YearlyChallenge";
import { WeeklyMoodSplit } from "@/components/insights/WeeklyMoodSplit";
import { HighlightsGallery } from "@/components/insights/HighlightsGallery";
import { Achievements } from "@/components/insights/Achievements";
import { BestTimeInsight } from "@/components/insights/BestTimeInsight";
import { LockedFeature } from "@/components/premium/LockedFeature";
import { YearlyGoalCard } from "@/components/reader/YearlyGoalCard";
import { MicroGoals } from "@/components/reader/MicroGoals";

const Insights = () => {
  const { books, reactionLog, journal, sessions } = useLibrary();
  const isCold = books.length === 0 && reactionLog.length === 0 && journal.length === 0;

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
            <Link
              to="/wrap"
              className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/70 backdrop-blur px-3 py-1.5 text-sm hover:bg-card transition"
            >
              <Sparkles className="h-3.5 w-3.5" style={{ color: "var(--mood-strong)" }} />
              See your {new Date().getFullYear()} Feltly Wrap
            </Link>
          </div>
        </header>

        {isCold && (
          <div className="rounded-2xl border border-dashed border-border/60 p-10 text-center space-y-3">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-foreground/5">
              <Sparkles className="h-5 w-5" style={{ color: "var(--mood-strong)" }} />
            </div>
            <div className="font-display text-xl">Your landscape is still forming.</div>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Add a book and log a few reactions or sessions — your mood pulse, signature,
              and Wrap will appear here.
            </p>
            <div className="flex justify-center pt-1">
              <AddBookDialog />
            </div>
          </div>
        )}

        <div className="grid sm:grid-cols-4 gap-3">
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
        <Achievements />
        <BestTimeInsight />

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
                const totalPages = d.readPages + d.listenedPages;
                const usePages = totalPages > 0;
                const heightPct = usePages
                  ? (totalPages / maxPages) * 100
                  : (d.count / maxDay) * 100;
                const readShare = usePages ? d.readPages / totalPages : 1;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full rounded-t-md overflow-hidden flex flex-col-reverse transition"
                      style={{
                        height: `${heightPct}%`,
                        minHeight: totalPages > 0 || d.count > 0 ? 6 : 2,
                        opacity: totalPages > 0 || d.count > 0 ? 1 : 0.2,
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
                  <div className="w-28 text-sm flex items-center gap-1.5">
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
                  <div className="w-24 text-right text-[11px] text-muted-foreground tabular-nums flex items-center justify-end gap-1.5">
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

        <WeeklyMoodSplit />

        <LockedFeature description="See your full taste fingerprint — every genre and theme weighted across your library.">
          <TagBreakdown />
        </LockedFeature>

        <ReadingCalendar />

        <LockedFeature description="Monthly mood reports — see how your reading shifted month by month.">
          <MonthlyMoodReport />
        </LockedFeature>

        <LockedFeature description="Slumps, time-of-day patterns and mood-vs-genre deep dives.">
          <PremiumDeepInsights />
        </LockedFeature>
      </div>
    </AppShell>
  );
};

export default Insights;
