import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MOODS, type MoodKey } from "@/lib/moods";
import { TROPE_CATEGORIES } from "@/lib/tropes";
import { useLibrary, type SpoilerStrictness, type MoodPreferences } from "@/lib/store";
import { cn } from "@/lib/utils";
import {
  Sparkles, ArrowRight, ArrowLeft, Check,
  BookHeart, PlayCircle, NotebookPen, BarChart3,
} from "lucide-react";
import { toast } from "sonner";

const MOOD_KEYS = Object.keys(MOODS) as MoodKey[];
const MAX_TROPES = 6;
const QUIZ_STEPS = 7;  // indices 0-6
const TOUR_STEPS = 4;  // indices 7-10
const TOTAL_STEPS = QUIZ_STEPS + TOUR_STEPS;

const TOUR_SLIDES: {
  icon: typeof BookHeart;
  title: React.ReactNode;
  body: string;
}[] = [
  {
    icon: BookHeart,
    title: (
      <>
        Pick a current{" "}
        <span className="italic" style={{ color: "var(--mood-strong)" }}>
          book
        </span>
        .
      </>
    ),
    body: "Add the book you're reading right now. Tropely uses it to colour your home, your Companion, and the mood under everything else.",
  },
  {
    icon: PlayCircle,
    title: (
      <>
        Log a session with a{" "}
        <span className="italic" style={{ color: "var(--mood-strong)" }}>
          mood
        </span>
        .
      </>
    ),
    body: "When you stop reading, log a quick session — pages, minutes, and how it left you feeling. Your streak and mood pulse start there.",
  },
  {
    icon: NotebookPen,
    title: (
      <>
        Capture notes &{" "}
        <span className="italic" style={{ color: "var(--mood-strong)" }}>
          quotes
        </span>
        .
      </>
    ),
    body: "The Journal is for the lines you can't shake and the moments that hit hardest. Tap the strip at the top of any page to write.",
  },
  {
    icon: BarChart3,
    title: (
      <>
        Watch your{" "}
        <span className="italic" style={{ color: "var(--mood-strong)" }}>
          landscape
        </span>{" "}
        form.
      </>
    ),
    body: "Insights stays quiet until you have data — then your trope fingerprint, mood pulse, and reading personality appear, only ever from your own pages.",
  },
];

type Props = {
  open: boolean;
  startAt?: number;
  onComplete: () => void;
};

export function OnboardingFlow({ open, startAt = 0, onComplete }: Props) {
  const { completeOnboarding, setHasSeenWalkthrough } = useLibrary();

  const [step, setStep] = useState(startAt);
  const [favorites, setFavorites] = useState<MoodKey[]>([]);
  const [avoid, setAvoid] = useState<MoodKey[]>([]);
  const [favoriteTropes, setFavoriteTropes] = useState<string[]>([]);
  const [pace, setPace] = useState<MoodPreferences["pace"]>("medium");
  const [strictness, setStrictness] = useState<SpoilerStrictness>("balanced");
  const [age, setAge] = useState("");

  const prevOpen = useRef(false);
  useEffect(() => {
    if (open && !prevOpen.current) {
      setStep(startAt);
      if (startAt === 0) {
        setFavorites([]);
        setAvoid([]);
        setFavoriteTropes([]);
        setPace("medium");
        setStrictness("balanced");
        setAge("");
      }
    }
    prevOpen.current = open;
  }, [open, startAt]);

  const inTour = step >= QUIZ_STEPS;
  const tourIndex = step - QUIZ_STEPS;
  const tourSlide = inTour ? TOUR_SLIDES[tourIndex] : null;
  const TourIcon = tourSlide?.icon ?? null;

  const toggleFav = (m: MoodKey) =>
    setFavorites((prev) =>
      prev.includes(m) ? prev.filter((x) => x !== m) : prev.length >= 3 ? prev : [...prev, m]
    );
  const toggleAvoid = (m: MoodKey) =>
    setAvoid((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]));
  const toggleTrope = (t: string) =>
    setFavoriteTropes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : prev.length >= MAX_TROPES ? prev : [...prev, t]
    );

  const saveProfile = (overrides: Partial<MoodPreferences> = {}) => {
    const parsedAge = parseInt(age, 10);
    completeOnboarding({
      favorites,
      avoid,
      pace,
      spoilerStrictness: strictness,
      age: isFinite(parsedAge) && parsedAge > 0 ? parsedAge : undefined,
      favoriteTropes,
      ...overrides,
    });
  };

  const finish = () => {
    setHasSeenWalkthrough(true);
    onComplete();
  };

  const next = () => {
    if (step === QUIZ_STEPS - 1) {
      saveProfile();
      toast.success("Reading profile saved.");
      setStep(QUIZ_STEPS);
    } else if (step >= TOTAL_STEPS - 1) {
      finish();
    } else {
      setStep((s) => s + 1);
    }
  };

  const back = () => setStep((s) => Math.max(startAt, s - 1));

  const skipQuiz = () => {
    saveProfile({ favorites: [], avoid: [], pace: "medium", spoilerStrictness: "balanced", favoriteTropes: [] });
    setStep(QUIZ_STEPS);
  };

  const isLastStep = step >= TOTAL_STEPS - 1;
  const isFirstTourStep = step === QUIZ_STEPS;

  const eyebrow = inTour
    ? `Tour ${tourIndex + 1} of ${TOUR_STEPS}`
    : `Step ${step + 1} of ${TOTAL_STEPS}`;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="max-w-lg p-0 overflow-hidden border-border/60 [&>button]:hidden"
        aria-describedby={undefined}
      >
        <DialogTitle className="sr-only">
          {inTour ? "How Tropely works" : "Reading profile setup"}
        </DialogTitle>

        <div className="p-6 sm:p-8 space-y-6 mood-surface">
          {/* Header row: eyebrow + progress bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" style={{ color: "var(--mood-strong)" }} />
              <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                {eyebrow}
              </span>
            </div>
            <div className="flex gap-1">
              {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    "h-1 rounded-full transition",
                    i < QUIZ_STEPS ? "w-4" : "w-3",
                    i <= step ? "bg-foreground" : "bg-muted"
                  )}
                />
              ))}
            </div>
          </div>

          {/* ── QUIZ STEPS ────────────────────────────────────── */}

          {step === 0 && (
            <div className="space-y-3 animate-fade-up">
              <h2 className="font-display text-3xl leading-tight">
                Welcome to{" "}
                <span className="italic" style={{ color: "var(--mood-strong)" }}>
                  Tropely
                </span>
                .
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                We track the story shapes you love — and the mood running underneath each one. A quick setup builds your fingerprint from day one, then we'll show you around.
              </p>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4 animate-fade-up">
              <div className="space-y-1">
                <h2 className="font-display text-2xl leading-tight">
                  What story shapes pull you{" "}
                  <span className="italic" style={{ color: "var(--mood-strong)" }}>
                    in
                  </span>
                  ?
                </h2>
                <p className="text-xs text-muted-foreground">
                  Pick up to {MAX_TROPES} tropes.{" "}
                  {favoriteTropes.length > 0 ? (
                    <span className="font-medium text-foreground">
                      {favoriteTropes.length}/{MAX_TROPES} selected
                    </span>
                  ) : (
                    "Optional — skip if you're not sure yet."
                  )}
                </p>
              </div>
              <div className="max-h-[320px] overflow-y-auto space-y-4 pr-1 -mr-1">
                {TROPE_CATEGORIES.map((cat) => (
                  <div key={cat.name} className="space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground sticky top-0 bg-transparent">
                      <span>{cat.emoji}</span>
                      <span>{cat.name}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {cat.tropes.map((t) => {
                        const active = favoriteTropes.includes(t);
                        const disabled = !active && favoriteTropes.length >= MAX_TROPES;
                        return (
                          <button
                            key={t}
                            onClick={() => !disabled && toggleTrope(t)}
                            disabled={disabled}
                            className={cn(
                              "rounded-full border px-3 py-1 text-[12px] transition",
                              active
                                ? "border-foreground bg-foreground/10 font-medium"
                                : disabled
                                ? "border-border/40 bg-white/20 text-muted-foreground/50 cursor-not-allowed"
                                : "border-border bg-white/50 hover:bg-white/80"
                            )}
                          >
                            {active && <Check className="inline h-3 w-3 mr-1 -mt-0.5" />}
                            {t}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3 animate-fade-up">
              <h2 className="font-display text-2xl leading-tight">
                What's the{" "}
                <span className="italic" style={{ color: "var(--mood-strong)" }}>
                  undertone
                </span>{" "}
                those stories carry?
              </h2>
              <p className="text-xs text-muted-foreground">
                The feeling your favourite tropes run on. Pick up to 3.
              </p>
              <div className="grid grid-cols-2 gap-2 pt-2">
                {MOOD_KEYS.map((m) => {
                  const active = favorites.includes(m);
                  return (
                    <button
                      key={m}
                      onClick={() => toggleFav(m)}
                      className={cn(
                        "rounded-xl border p-3 text-left transition flex items-center gap-2",
                        active ? "border-foreground bg-foreground/5" : "border-border bg-white/40 hover:bg-white/70"
                      )}
                    >
                      <span className="text-lg">{MOODS[m].emoji}</span>
                      <span className="text-sm">{MOODS[m].label}</span>
                      {active && <Check className="h-3.5 w-3.5 ml-auto" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3 animate-fade-up">
              <h2 className="font-display text-2xl leading-tight">
                Any undertones you'd rather{" "}
                <span className="italic" style={{ color: "var(--mood-strong)" }}>
                  skip
                </span>
                ?
              </h2>
              <p className="text-xs text-muted-foreground">
                Optional — we'll downrank these in recommendations.
              </p>
              <div className="grid grid-cols-2 gap-2 pt-2">
                {MOOD_KEYS.map((m) => {
                  const active = avoid.includes(m);
                  return (
                    <button
                      key={m}
                      onClick={() => toggleAvoid(m)}
                      className={cn(
                        "rounded-xl border p-3 text-left transition flex items-center gap-2",
                        active ? "border-destructive/60 bg-destructive/5" : "border-border bg-white/40 hover:bg-white/70"
                      )}
                    >
                      <span className="text-lg opacity-70">{MOODS[m].emoji}</span>
                      <span className="text-sm">{MOODS[m].label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-3 animate-fade-up">
              <h2 className="font-display text-2xl leading-tight">
                What's your{" "}
                <span className="italic" style={{ color: "var(--mood-strong)" }}>
                  pace
                </span>
                ?
              </h2>
              <div className="grid gap-2 pt-2">
                {([
                  { key: "slow", title: "Slow + savoring", desc: "A few pages a night, no rush." },
                  { key: "medium", title: "Steady reader", desc: "Most days, a chapter or two." },
                  { key: "fast", title: "Devourer", desc: "Long sessions, finish books quickly." },
                ] as const).map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => setPace(opt.key)}
                    className={cn(
                      "rounded-xl border p-3 text-left transition",
                      pace === opt.key ? "border-foreground bg-foreground/5" : "border-border bg-white/40 hover:bg-white/70"
                    )}
                  >
                    <div className="font-display text-base">{opt.title}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-3 animate-fade-up">
              <h2 className="font-display text-2xl leading-tight">
                How careful with{" "}
                <span className="italic" style={{ color: "var(--mood-strong)" }}>
                  spoilers
                </span>
                ?
              </h2>
              <p className="text-xs text-muted-foreground">
                Sets the Companion's default. You can change it anytime in Profile.
              </p>
              <div className="grid gap-2 pt-2">
                {([
                  { key: "relaxed", title: "Relaxed", desc: "Vague tonal hints OK if I ask." },
                  { key: "balanced", title: "Balanced", desc: "No spoilers, but tell me you're holding back." },
                  { key: "strict", title: "Strict", desc: "Total lockdown. Don't even hint." },
                ] as { key: SpoilerStrictness; title: string; desc: string }[]).map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => setStrictness(opt.key)}
                    className={cn(
                      "rounded-xl border p-3 text-left transition",
                      strictness === opt.key ? "border-foreground bg-foreground/5" : "border-border bg-white/40 hover:bg-white/70"
                    )}
                  >
                    <div className="font-display text-base">{opt.title}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-3 animate-fade-up">
              <h2 className="font-display text-2xl leading-tight">
                One last thing — how{" "}
                <span className="italic" style={{ color: "var(--mood-strong)" }}>
                  old
                </span>{" "}
                are you?
              </h2>
              <p className="text-xs text-muted-foreground">
                Used only to keep recommendations age-appropriate. Optional — leave blank to skip.
              </p>
              <div className="space-y-1.5 pt-2 max-w-[160px]">
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  inputMode="numeric"
                  min={5}
                  max={120}
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="—"
                />
              </div>
            </div>
          )}

          {/* ── TOUR STEPS ────────────────────────────────────── */}

          {inTour && tourSlide && TourIcon && (
            <div className="space-y-4 animate-fade-up" key={step}>
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-foreground/5" aria-hidden="true">
                <TourIcon className="h-5 w-5" style={{ color: "var(--mood-strong)" }} />
              </div>
              <h2 className="font-display text-2xl sm:text-3xl leading-tight">
                {tourSlide.title}
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {tourSlide.body}
              </p>
            </div>
          )}

          {/* Nav buttons */}
          <div className="flex items-center justify-between pt-2">
            <Button
              variant="ghost"
              onClick={back}
              disabled={step <= startAt}
              className="rounded-full"
            >
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            <Button onClick={next} className="rounded-full">
              {isLastStep ? (
                <>Got it <Check className="h-4 w-4 ml-1" /></>
              ) : step === QUIZ_STEPS - 1 ? (
                <>Save &amp; continue <ArrowRight className="h-4 w-4 ml-1" /></>
              ) : step === 0 ? (
                <>Start <ArrowRight className="h-4 w-4 ml-1" /></>
              ) : (
                <>Next <ArrowRight className="h-4 w-4 ml-1" /></>
              )}
            </Button>
          </div>

          {/* Contextual secondary action */}
          {step === 0 && (
            <button
              onClick={skipQuiz}
              className="block mx-auto text-xs text-muted-foreground hover:text-foreground transition"
            >
              Skip setup, just show me around
            </button>
          )}
          {inTour && !isLastStep && (
            <button
              onClick={finish}
              className="block mx-auto text-xs text-muted-foreground hover:text-foreground transition"
            >
              Skip the tour
            </button>
          )}
          {isLastStep && (
            <button
              onClick={finish}
              className="block mx-auto text-xs text-muted-foreground hover:text-foreground transition"
            >
              Close
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
