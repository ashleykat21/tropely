import { useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { CurrentBookCard } from "@/components/reader/CurrentBookCard";
import { Shelves } from "@/components/reader/Shelves";
import { StreakStrip } from "@/components/reader/StreakStrip";
import { useLibrary } from "@/lib/store";
import { useVisibleBooks } from "@/lib/useVisibleBooks";
import { EmptyHome } from "@/components/reader/EmptyHome";
import { FamilyProgressCard } from "@/components/family/FamilyProgressCard";
import { HomeSmartCards } from "@/components/home/HomeSmartCards";
import { DailyReadout } from "@/components/reader/DailyReadout";
import { MoodTbrPicker } from "@/components/reader/MoodTbrPicker";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { NotebookPen, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const Index = () => {
  const allBooks = useLibrary((s) => s.books);
  const books = useVisibleBooks();
  const currentId = useLibrary((s) => s.currentId);
  const setCurrent = useLibrary((s) => s.setCurrent);
  const autoTagReadingBooks = useLibrary((s) => s.autoTagReadingBooks);

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    autoTagReadingBooks();
  }, []);

  // Honor cross-screen intent to open the session logger (e.g. from
  // Insights cold state). Dispatched after mount so CurrentBookCard's
  // listener is guaranteed to be attached.
  useEffect(() => {
    const state = location.state as { openSessionLog?: boolean } | null;
    if (!state?.openSessionLog) return;
    const id = window.requestAnimationFrame(() =>
      window.dispatchEvent(new CustomEvent("feltly:open-session-log"))
    );
    navigate(location.pathname, { replace: true, state: null });
    return () => window.cancelAnimationFrame(id);
  }, [location.state, location.pathname, navigate]);
  const hasAnyReal = allBooks.length > 0;
  const currentBook =
    allBooks.find((b) => b.id === currentId) ??
    allBooks.find((b) => b.shelf === "reading");
  const needsCurrent = hasAnyReal && !currentBook;
  const candidates = allBooks.filter((b) => b.shelf !== "finished").slice(0, 6);
  return (
    <AppShell>
      <div className="space-y-4 sm:space-y-6 flex flex-col items-center">
        <section className="w-full max-w-3xl animate-fade-up rounded-3xl overflow-hidden">
          <div
            className="px-6 pt-8 pb-6 space-y-2"
            style={{
              background:
                "linear-gradient(135deg, hsl(210 30% 94%) 0%, hsl(220 25% 91%) 40%, hsl(200 28% 93%) 100%)",
            }}
          >
            <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
              Today
            </p>
            <h1 className="font-display text-2xl sm:text-3xl leading-[1.1]">
              What is your book making you{" "}
              <span className="italic" style={{ color: "var(--mood-strong)" }}>
                feel?
              </span>
            </h1>
            <p className="text-sm text-muted-foreground max-w-md leading-snug">
              Tag every reading session by mood — your emotional fingerprint, built one page at a time.
            </p>
          </div>
        </section>

        {hasAnyReal ? (
          <>
            {needsCurrent && (
              <div className="mx-auto w-full max-w-3xl">
                <div className="rounded-2xl border border-dashed border-border/60 p-8 text-center space-y-4 mood-surface">
                  <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-foreground/5">
                    <BookOpen className="h-5 w-5" style={{ color: "var(--mood-strong)" }} />
                  </div>
                  <div className="space-y-1">
                    <div className="font-display text-xl">Pick a book to start tracking.</div>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto">
                      Choose what you&apos;re reading right now — your sessions, mood, and notes will collect here.
                    </p>
                  </div>
                  <div className="flex justify-center pt-1">
                    <Button asChild className="rounded-full gap-1.5">
                      <Link to="/discover"><BookOpen className="h-3.5 w-3.5" /> Pick a book in Discover</Link>
                    </Button>
                  </div>
                  {candidates.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
                        Or pick one to set as current
                      </p>
                      <div className="flex flex-wrap justify-center gap-1.5">
                        {candidates.map((b) => (
                          <button
                            key={b.id}
                            onClick={() => setCurrent(b.id)}
                            className="rounded-full border border-border/60 bg-background/70 px-3 py-1.5 text-xs hover:bg-background transition"
                          >
                            {b.title}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            {/* Always mount CurrentBookCard — it returns null if there's no
                current book, but keeping it mounted ensures its
                `feltly:open-session-log` listener is attached so cross-screen
                intents (e.g. from Insights) still work once a book is chosen. */}
            <div className={cn("mx-auto w-full max-w-3xl", needsCurrent && "hidden")}>
              <CurrentBookCard />
            </div>
            <HomeSmartCards />
            <DailyReadout />
            <div className="mx-auto grid w-full max-w-3xl gap-3">
              <Link
                to="/journal"
                className="group rounded-xl border border-border/50 bg-card/70 backdrop-blur p-3 flex items-center gap-3 transition hover:bg-card"
              >
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-foreground/5">
                  <NotebookPen className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="font-display text-sm">Journal</div>
                  <div className="text-xs text-muted-foreground truncate">
                    Notes, quotes & reflections
                  </div>
                </div>
              </Link>
            </div>
            <FamilyProgressCard />
            <StreakStrip />
            <MoodTbrPicker />
            <Shelves />
          </>
        ) : (
          <EmptyHome />
        )}
      </div>
    </AppShell>
  );
};

export default Index;
