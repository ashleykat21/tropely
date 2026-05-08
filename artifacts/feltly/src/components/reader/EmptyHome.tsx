import { Link } from "react-router-dom";
import { AddBookDialog } from "./AddBookDialog";
import { Button } from "@/components/ui/button";
import { BookHeart, Compass, Sparkles, PartyPopper } from "lucide-react";
import { useLibrary } from "@/lib/store";
import { MOODS } from "@/lib/moods";
import { useFamilyStore } from "@/lib/familyStore";

export function EmptyHome() {
  const moodPreferences = useLibrary((s) => s.moodPreferences);
  const hasOnboarded = useLibrary((s) => s.hasOnboarded);
  const fav = moodPreferences?.favorites?.[0];
  const { profiles, activeProfileId } = useFamilyStore();
  const activeProfile = profiles.find((p) => p.id === activeProfileId);
  const isChild = activeProfile?.role === "child";
  const profileName = activeProfile?.name ?? "you";

  return (
    <section className="space-y-8 animate-fade-up">
      {!hasOnboarded && !isChild && (
        <div className="rounded-2xl border border-border/50 bg-card/70 backdrop-blur px-5 py-4 flex items-start gap-3">
          <PartyPopper className="h-5 w-5 shrink-0 mt-0.5" style={{ color: "var(--mood-strong)" }} />
          <div>
            <p className="text-sm font-medium">Welcome to Tropely!</p>
            <p className="text-sm text-muted-foreground">
              Add a book below to get started. After your first few books, we'll ask about your reading moods to personalise everything.
            </p>
          </div>
        </div>
      )}
      <div className="rounded-3xl mood-surface border border-border/40 p-8 sm:p-12 grain relative overflow-hidden">
        <div className="max-w-xl space-y-5">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-white/60 backdrop-blur px-3 py-1 text-[11px] uppercase tracking-widest text-muted-foreground">
            <BookHeart className="h-3 w-3" />
            {isChild ? `${profileName}'s shelf is empty` : "Your shelf is empty"}
          </div>
          <h2 className="font-display text-3xl sm:text-4xl leading-tight">
            {isChild ? (
              <>
                Hey {profileName}! Add your first book and{" "}
                <span className="italic" style={{ color: "var(--mood-strong)" }}>
                  start reading
                </span>
                .
              </>
            ) : (
              <>
                Add your first book and{" "}
                <span className="italic" style={{ color: "var(--mood-strong)" }}>
                  find your tropes
                </span>
                .
              </>
            )}
          </h2>
          <p className="text-muted-foreground">
            {isChild
              ? "Pick a book you love or want to try — your own shelf, your own adventure."
              : "Every story has a shape. Add books, tag your tropes, and the mood underneath will surface — building a fingerprint only you could have."}
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