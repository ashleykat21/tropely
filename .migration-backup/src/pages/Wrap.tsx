import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useLibrary } from "@/lib/store";
import { MOODS, type MoodKey } from "@/lib/moods";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Sparkles, X, Share2, BookOpen, Headphones } from "lucide-react";
import { cn } from "@/lib/utils";
import { MoodSignatureCard } from "@/components/social/MoodSignatureCard";
import { renderWrapCard, shareOrDownload } from "@/lib/shareImage";
import { toast } from "sonner";

const YEAR_NOW = new Date().getFullYear();

type Slide = {
  id: string;
  eyebrow: string;
  title: React.ReactNode;
  body?: React.ReactNode;
  accent: MoodKey | null;
};

export default function Wrap() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const year = Number(params.get("year")) || YEAR_NOW;
  const { books, sessions, reactionLog, journal, reflections } = useLibrary();
  const [i, setI] = useState(0);

  useEffect(() => {
    if (!loading && !user) nav("/auth");
  }, [user, loading, nav]);

  const data = useMemo(() => {
    const startMs = new Date(year, 0, 1).getTime();
    const endMs = new Date(year + 1, 0, 1).getTime();
    const inYear = (t: number) => t >= startMs && t < endMs;

    const yearBooks = books.filter((b) => inYear(b.addedAt));
    const yearSessions = sessions.filter((s) => inYear(s.at));
    const yearReactions = reactionLog.filter((r) => inYear(r.at));
    const yearJournal = journal.filter((j) => inYear(j.createdAt));
    const yearReflections = reflections.filter((r) => inYear(r.createdAt));

    const finished = books.filter(
      (b) => b.shelf === "finished" && inYear(b.addedAt)
    );
    // Consumption breakdown across finished-this-year books.
    let read = 0, listened = 0, unset = 0;
    finished.forEach((b) => {
      if (b.consumption === "listened") listened++;
      else if (b.consumption === "read") read++;
      else unset++;
    });
    const consTotal = read + listened;
    const readPct = consTotal ? Math.round((read / consTotal) * 100) : 0;
    const consumption = {
      read, listened, unset, total: consTotal,
      readPct, listenedPct: consTotal ? 100 - readPct : 0,
    };
    const totalPages =
      yearSessions.reduce((a, s) => a + s.pagesRead, 0) ||
      yearBooks.reduce((a, b) => a + b.progress, 0);

    // Mood distribution across the year (books + sessions weighted)
    const counts: Record<string, number> = {};
    yearBooks.forEach((b) => (counts[b.mood] = (counts[b.mood] || 0) + 1));
    yearSessions.forEach((s) => (counts[s.mood] = (counts[s.mood] || 0) + 0.5));
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const topMood = (sorted[0]?.[0] as MoodKey) || null;
    const moodMix = sorted.slice(0, 4).map(([k, v]) => ({
      mood: k as MoodKey,
      v,
      pct: v / sorted.reduce((a, [, v]) => a + v, 0),
    }));

    // Top emoji
    const eCounts: Record<string, number> = {};
    yearReactions.forEach((r) => (eCounts[r.emoji] = (eCounts[r.emoji] || 0) + 1));
    const topEmoji = Object.entries(eCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";

    // Longest session
    const longest = [...yearSessions].sort((a, b) => b.pagesRead - a.pagesRead)[0];
    const longestBook = longest ? books.find((b) => b.id === longest.bookId) : null;

    // Best-rated reflection
    const topReflection = [...yearReflections].sort((a, b) => b.rating - a.rating)[0];
    const topReflectionBook = topReflection ? books.find((b) => b.id === topReflection.bookId) : null;

    // Reading by month
    const months = Array.from({ length: 12 }, () => 0);
    yearSessions.forEach((s) => {
      const m = new Date(s.at).getMonth();
      months[m] += s.pagesRead;
    });
    const peakMonth = months.indexOf(Math.max(...months));
    const monthName = new Date(year, peakMonth, 1).toLocaleString(undefined, { month: "long" });

    return {
      yearBooks,
      finished,
      consumption,
      totalPages,
      topMood,
      moodMix,
      topEmoji,
      longest,
      longestBook,
      topReflection,
      topReflectionBook,
      months,
      monthName,
      peakMonth,
      reactions: yearReactions.length,
      journalCount: yearJournal.length,
    };
  }, [books, sessions, reactionLog, journal, reflections, year]);

  const empty = data.yearBooks.length === 0 && data.finished.length === 0;

  const slides: Slide[] = useMemo(() => {
    if (empty) {
      return [
        {
          id: "empty",
          eyebrow: `${year}`,
          title: (
            <>
              No story{" "}
              <span className="italic" style={{ color: "var(--mood-strong)" }}>
                yet
              </span>
              .
            </>
          ),
          body: (
            <p className="text-muted-foreground">
              Start logging sessions and finishing books — your wrap will fill in as the
              year unfolds.
            </p>
          ),
          accent: null,
        },
      ];
    }
    const s: Slide[] = [
      {
        id: "intro",
        eyebrow: `${year} · Feltly Wrap`,
        title: (
          <>
            Your year in{" "}
            <span className="italic" style={{ color: "var(--mood-strong)" }}>
              feeling
            </span>
            .
          </>
        ),
        body: (
          <p className="text-muted-foreground">
            A spoiler-safe look back at how {year} read on the inside.
          </p>
        ),
        accent: data.topMood,
      },
      {
        id: "pages",
        eyebrow: "You read",
        title: (
          <span className="font-display">
            {data.totalPages.toLocaleString()}{" "}
            <span className="italic">pages</span>
          </span>
        ),
        body: (
          <p className="text-muted-foreground">
            Across {data.yearBooks.length} books added and{" "}
            {data.finished.length} finished.
          </p>
        ),
        accent: data.topMood,
      },
    ];

    if (data.topMood) {
      s.push({
        id: "mood",
        eyebrow: "Your dominant mood",
        title: (
          <span className="font-display">
            {MOODS[data.topMood].emoji} {MOODS[data.topMood].label}
          </span>
        ),
        body: (
          <div className="space-y-2 max-w-sm">
            {data.moodMix.map((m) => (
              <div key={m.mood} className="flex items-center gap-3 text-sm">
                <div className="w-24">{MOODS[m.mood].emoji} {MOODS[m.mood].label}</div>
                <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full"
                    style={{
                      width: `${m.pct * 100}%`,
                      background: `hsl(${MOODS[m.mood].h} ${MOODS[m.mood].s}% ${MOODS[m.mood].l}%)`,
                    }}
                  />
                </div>
                <div className="w-10 text-right text-muted-foreground">
                  {Math.round(m.pct * 100)}%
                </div>
              </div>
            ))}
          </div>
        ),
        accent: data.topMood,
      });
    }

    if (data.consumption.total > 0) {
      const c = data.consumption;
      s.push({
        id: "consumption",
        eyebrow: "Read vs listened",
        title: (
          <span className="font-display">
            {c.readPct >= c.listenedPct ? (
              <>{c.readPct}% <span className="italic">read</span></>
            ) : (
              <>{c.listenedPct}% <span className="italic">listened</span></>
            )}
          </span>
        ),
        body: (
          <div className="space-y-3 max-w-sm">
            <div className="h-3 rounded-full bg-muted overflow-hidden flex">
              <div className="h-full" style={{ width: `${c.readPct}%`, background: "var(--mood-strong)" }} />
              <div className="h-full" style={{ width: `${c.listenedPct}%`, background: "hsl(var(--foreground) / 0.45)" }} />
            </div>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5" /> {c.read} read
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Headphones className="h-3.5 w-3.5" /> {c.listened} listened
              </span>
            </div>
            {c.unset > 0 && (
              <p className="text-[11px] text-muted-foreground">
                {c.unset} finished {c.unset === 1 ? "book is" : "books are"} untagged.
              </p>
            )}
          </div>
        ),
        accent: data.topMood,
      });
    }

    if (data.topEmoji && data.reactions > 0) {
      s.push({
        id: "emoji",
        eyebrow: "Most-felt reaction",
        title: <span className="text-7xl">{data.topEmoji}</span>,
        body: (
          <p className="text-muted-foreground">
            You logged {data.reactions} reactions this year.
          </p>
        ),
        accent: data.topMood,
      });
    }

    if (data.longest && data.longestBook) {
      s.push({
        id: "longest",
        eyebrow: "Longest sit-down",
        title: (
          <span className="font-display">
            {data.longest.pagesRead}{" "}
            <span className="italic">pages in one go</span>
          </span>
        ),
        body: (
          <p className="text-muted-foreground">
            With <span className="font-medium text-foreground">{data.longestBook.title}</span>{" "}
            — {MOODS[data.longest.mood].emoji} {MOODS[data.longest.mood].label.toLowerCase()} mood.
          </p>
        ),
        accent: data.longest.mood,
      });
    }

    if (data.peakMonth >= 0 && data.months[data.peakMonth] > 0) {
      s.push({
        id: "peak",
        eyebrow: "Peak reading month",
        title: (
          <span className="font-display">
            <span className="italic">{data.monthName}</span>
          </span>
        ),
        body: (
          <div className="space-y-2 max-w-sm">
            <div className="flex items-end gap-1 h-24">
              {data.months.map((m, idx) => {
                const max = Math.max(...data.months, 1);
                return (
                  <div
                    key={idx}
                    className="flex-1 rounded-t-sm transition"
                    style={{
                      height: `${(m / max) * 100}%`,
                      minHeight: 3,
                      background:
                        idx === data.peakMonth
                          ? "var(--mood-strong)"
                          : "hsl(var(--muted-foreground) / 0.3)",
                    }}
                  />
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              {data.months[data.peakMonth].toLocaleString()} pages in {data.monthName}.
            </p>
          </div>
        ),
        accent: data.topMood,
      });
    }

    if (data.topReflection && data.topReflectionBook) {
      s.push({
        id: "reflection",
        eyebrow: "Book of the year",
        title: (
          <span className="font-display italic">{data.topReflectionBook.title}</span>
        ),
        body: (
          <div className="space-y-2 max-w-md">
            <div className="text-sm text-muted-foreground">
              {"★".repeat(data.topReflection.rating)}
              {"☆".repeat(5 - data.topReflection.rating)}
            </div>
            {data.topReflection.takeaway && (
              <p className="italic text-foreground/90">"{data.topReflection.takeaway}"</p>
            )}
          </div>
        ),
        accent: data.topReflectionBook.mood,
      });
    }

    s.push({
      id: "outro",
      eyebrow: "And that's a wrap",
      title: (
        <>
          See you in{" "}
          <span className="italic" style={{ color: "var(--mood-strong)" }}>
            {year + 1}
          </span>
          .
        </>
      ),
      body: (
        <div className="flex flex-wrap gap-2">
          <MoodSignatureCard />
          <Button variant="outline" className="rounded-full" onClick={() => nav("/")}>
            Back home
          </Button>
        </div>
      ),
      accent: data.topMood,
    });
    return s;
  }, [data, year, empty, nav]);

  // Apply slide accent to mood-strong CSS var
  useEffect(() => {
    const m = slides[i]?.accent;
    if (!m) return;
    const r = document.documentElement;
    r.style.setProperty("--mood-h", String(MOODS[m].h));
    r.style.setProperty("--mood-s", `${MOODS[m].s}%`);
    r.style.setProperty("--mood-l", `${MOODS[m].l}%`);
  }, [i, slides]);

  const next = () => setI((v) => Math.min(slides.length - 1, v + 1));
  const prev = () => setI((v) => Math.max(0, v - 1));

  // Keyboard nav
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "Escape") nav("/");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slides.length]);

  const slide = slides[i];

  return (
    <main
      className="min-h-screen flex flex-col"
      style={{
        background:
          "radial-gradient(circle at 80% 10%, hsl(var(--mood-h) var(--mood-s) var(--mood-l) / 0.35), transparent 60%), hsl(36 30% 96%)",
      }}
    >
      <header className="flex items-center justify-between px-5 py-4 sm:px-8 sm:py-5">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4" style={{ color: "var(--mood-strong)" }} />
          <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
            Feltly Wrap · {year}
          </span>
        </div>
        <button
          onClick={() => nav("/")}
          className="text-muted-foreground hover:text-foreground transition"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
      </header>

      <div className="flex-1 flex items-center justify-center px-6 pb-20">
        <div key={slide.id} className="max-w-2xl w-full text-center space-y-6 animate-fade-up">
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
            {slide.eyebrow}
          </p>
          <h1 className="font-display text-5xl sm:text-7xl leading-[1.05]">{slide.title}</h1>
          <div className="flex justify-center">{slide.body}</div>
        </div>
      </div>

      <footer className="fixed bottom-0 inset-x-0 px-6 pb-6 pt-4">
        <div className="max-w-2xl mx-auto space-y-3">
          <div className="flex gap-1">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setI(idx)}
                className={cn(
                  "h-1 flex-1 rounded-full transition",
                  idx <= i ? "bg-foreground" : "bg-muted"
                )}
                aria-label={`Slide ${idx + 1}`}
              />
            ))}
          </div>
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={prev}
              disabled={i === 0}
              className="rounded-full"
            >
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            <Button
              variant="outline"
              className="rounded-full"
              onClick={async () => {
                const t = toast.loading("Building share image…");
                try {
                  const blob = await renderWrapCard({
                    year,
                    bookCount: data.finished.length,
                    pageCount: data.totalPages,
                    topMoodEmoji: data.topMood ? MOODS[data.topMood].emoji : undefined,
                    topMoodLabel: data.topMood ? MOODS[data.topMood].label : undefined,
                    signature: undefined,
                  });
                  const r = await shareOrDownload(blob, `feltly-wrap-${year}.png`);
                  toast.dismiss(t);
                  toast.success(r === "shared" ? "Shared" : "Saved to your device");
                } catch (e: any) {
                  toast.dismiss(t);
                  toast.error(e?.message || "Couldn't create image");
                }
              }}
            >
              <Share2 className="h-4 w-4 mr-1" /> Share
            </Button>
            <Button
              onClick={next}
              disabled={i === slides.length - 1}
              className="rounded-full"
            >
              Next <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </footer>
    </main>
  );
}