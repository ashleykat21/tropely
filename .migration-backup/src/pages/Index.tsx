import { AppShell } from "@/components/layout/AppShell";
import { CurrentBookCard } from "@/components/reader/CurrentBookCard";
import { StatsStrip } from "@/components/reader/StatsStrip";
import { Shelves } from "@/components/reader/Shelves";
import { StreakStrip } from "@/components/reader/StreakStrip";
import { useLibrary } from "@/lib/store";
import { EmptyHome } from "@/components/reader/EmptyHome";
import { Link } from "react-router-dom";
import { NotebookPen } from "lucide-react";

const Index = () => {
  const books = useLibrary((s) => s.books);
  const hasAnyReal = books.length > 0;
  return (
    <AppShell>
      <div className="space-y-12">
        <section className="space-y-2 max-w-2xl animate-fade-up">
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
            Today
          </p>
          <h1 className="font-display text-4xl sm:text-5xl leading-[1.05]">
            What is your book making you{" "}
            <span className="italic" style={{ color: "var(--mood-strong)" }}>
              feel
            </span>
            ?
          </h1>
          <p className="text-muted-foreground max-w-md">
            Track reading through emotion, not stars. Your shelf shifts with the
            mood of every page.
          </p>
        </section>

        {hasAnyReal ? (
          <>
            <div className="mx-auto w-full max-w-3xl">
              <CurrentBookCard />
            </div>
            <div className="mx-auto grid w-full max-w-3xl gap-3">
              <Link
                to="/journal"
                className="group rounded-2xl border border-border/50 bg-card/70 backdrop-blur p-4 flex items-center gap-3 transition hover:bg-card"
              >
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-foreground/5">
                  <NotebookPen className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="font-display text-base">Journal</div>
                  <div className="text-xs text-muted-foreground truncate">
                    Notes, quotes & reflections
                  </div>
                </div>
              </Link>
            </div>
            <StreakStrip />
            <StatsStrip />
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
