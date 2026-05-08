import { useMemo } from "react";
import { useLibrary } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { Target, Trophy, BookOpen, Headphones } from "lucide-react";

export function YearlyChallenge() {
  const books = useLibrary((s) => s.books);
  const finishes = useLibrary((s) => s.finishes);
  const yearlyGoal = useLibrary((s) => s.yearlyGoal);
  const setYearlyGoal = useLibrary((s) => s.setYearlyGoal);

  const year = new Date().getFullYear();
  const yearStart = new Date(year, 0, 1).getTime();

  const finishedThisYear = useMemo(() => {
    // Count from explicit finish records, plus legacy: books on "finished" shelf
    // added during the year that have no finish record yet.
    const recordedIds = new Set(
      finishes.filter((f) => f.finishedAt >= yearStart).map((f) => f.bookId)
    );
    const recordedCount = recordedIds.size;
    const legacyCount = books.filter(
      (b) =>
        b.shelf === "finished" &&
        b.addedAt >= yearStart &&
        !recordedIds.has(b.id)
    ).length;
    return recordedCount + legacyCount;
  }, [books, finishes, yearStart]);

  // Per-book consumption breakdown for finished-this-year books.
  const consumption = useMemo(() => {
    const recordedIds = new Set(
      finishes.filter((f) => f.finishedAt >= yearStart).map((f) => f.bookId)
    );
    const finishedBooks = books.filter(
      (b) =>
        recordedIds.has(b.id) ||
        (b.shelf === "finished" && b.addedAt >= yearStart)
    );
    let read = 0, listened = 0, unset = 0;
    finishedBooks.forEach((b) => {
      if (b.consumption === "listened") listened++;
      else if (b.consumption === "read") read++;
      else unset++;
    });
    const total = read + listened;
    const readPct = total ? Math.round((read / total) * 100) : 0;
    return { read, listened, unset, readPct, listenedPct: total ? 100 - readPct : 0, total };
  }, [books, finishes, yearStart]);

  const pct = Math.min(100, Math.round((finishedThisYear / Math.max(1, yearlyGoal)) * 100));
  const dayOfYear = Math.floor((Date.now() - yearStart) / 86400000) + 1;
  const expected = Math.round((dayOfYear / 365) * yearlyGoal);
  const ahead = finishedThisYear - expected;

  return (
    <section className="rounded-2xl bg-card/70 p-6 border border-border/40 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-display text-2xl">{year} reading challenge</h2>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Target className="h-3.5 w-3.5" />
          <span>Goal</span>
          <Input
            type="number"
            min={1}
            max={500}
            value={yearlyGoal}
            onChange={(e) => setYearlyGoal(parseInt(e.target.value || "0", 10))}
            className="h-7 w-16"
          />
          <span>books</span>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-baseline justify-between">
          <div className="font-display text-4xl">
            {finishedThisYear}
            <span className="text-base text-muted-foreground"> / {yearlyGoal}</span>
          </div>
          <div className="text-xs text-muted-foreground">{pct}%</div>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${pct}%`, background: "var(--mood-strong)" }}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          {finishedThisYear >= yearlyGoal
            ? "🎉 You hit your goal — anything from here is a victory lap."
            : ahead >= 1
            ? `You're ${ahead} ${ahead === 1 ? "book" : "books"} ahead of pace.`
            : ahead <= -1
            ? `${Math.abs(ahead)} ${Math.abs(ahead) === 1 ? "book" : "books"} behind. ${
                yearlyGoal - finishedThisYear
              } to go.`
            : "Right on pace. Keep going."}
        </p>
      </div>

      <div className="pt-2 border-t border-border/40 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <BookOpen className="h-3.5 w-3.5" /> Read vs <Headphones className="h-3.5 w-3.5 ml-1" /> Listened
          </div>
          {consumption.unset > 0 && (
            <span className="text-[10px] text-muted-foreground">
              {consumption.unset} unset
            </span>
          )}
        </div>
        {consumption.total === 0 ? (
          <p className="text-xs text-muted-foreground">
            Tag finished books as Read or Listened (in book details) to see your split.
          </p>
        ) : (
          <>
            <div className="h-2 rounded-full bg-muted overflow-hidden flex">
              <div
                className="h-full"
                style={{ width: `${consumption.readPct}%`, background: "var(--mood-strong)" }}
              />
              <div
                className="h-full"
                style={{ width: `${consumption.listenedPct}%`, background: "hsl(var(--foreground) / 0.45)" }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <BookOpen className="h-3 w-3" /> {consumption.read} read · {consumption.readPct}%
              </span>
              <span className="inline-flex items-center gap-1">
                <Headphones className="h-3 w-3" /> {consumption.listened} listened · {consumption.listenedPct}%
              </span>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
