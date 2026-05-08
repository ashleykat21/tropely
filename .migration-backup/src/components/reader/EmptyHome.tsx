import { Link } from "react-router-dom";
import { AddBookDialog } from "./AddBookDialog";
import { Button } from "@/components/ui/button";
import { BookHeart, Compass, Sparkles } from "lucide-react";
import { useLibrary } from "@/lib/store";
import { MOODS } from "@/lib/moods";

export function EmptyHome() {
  const moodPreferences = useLibrary((s) => s.moodPreferences);
  const fav = moodPreferences?.favorites?.[0];

  return (
    <section className="space-y-8 animate-fade-up">
      <div className="rounded-3xl mood-surface border border-border/40 p-8 sm:p-12 grain relative overflow-hidden">
        <div className="max-w-xl space-y-5">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-white/60 backdrop-blur px-3 py-1 text-[11px] uppercase tracking-widest text-muted-foreground">
            <BookHeart className="h-3 w-3" /> Your shelf is empty
          </div>
          <h2 className="font-display text-3xl sm:text-4xl leading-tight">
            Add your first book and{" "}
            <span className="italic" style={{ color: "var(--mood-strong)" }}>
              start feeling
            </span>
            .
          </h2>
          <p className="text-muted-foreground">
            Feltly is built around the emotion of reading. Pick something you're already
            into — or browse Discover for what's{" "}
            {fav ? (
              <>
                <span style={{ color: "var(--mood-strong)" }}>
                  {MOODS[fav].emoji} {MOODS[fav].label.toLowerCase()}
                </span>{" "}
                today.
              </>
            ) : (
              "trending."
            )}
          </p>
          <div className="flex flex-wrap gap-2 pt-2">
            <AddBookDialog />
            <Button asChild variant="outline" className="rounded-full">
              <Link to="/discover">
                <Compass className="h-4 w-4 mr-1.5" /> Browse Discover
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        {[
          {
            n: "1",
            title: "Add a book",
            body: "Search by title or author. Pick the mood it's giving you.",
          },
          {
            n: "2",
            title: "Log how it feels",
            body: "Quick reactions, notes, and short sessions — no rating required.",
          },
          {
            n: "3",
            title: "See your signature",
            body: "Streaks, mood pulse, and a yearly Wrap will start appearing.",
          },
        ].map((s) => (
          <div
            key={s.n}
            className="rounded-2xl border border-border/50 bg-card/70 backdrop-blur p-5"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-foreground text-background text-xs font-medium">
                {s.n}
              </span>
              <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <div className="font-display text-lg leading-tight">{s.title}</div>
            <p className="text-sm text-muted-foreground mt-1">{s.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}