import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MOODS, type MoodKey } from "@/lib/moods";
import { useLibrary, type SpoilerStrictness, type MoodPreferences } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Sparkles, ArrowRight, ArrowLeft, Check } from "lucide-react";
import { toast } from "sonner";

const MOOD_KEYS = Object.keys(MOODS) as MoodKey[];

type Step = number;

export function MoodQuiz({ open, onComplete }: { open: boolean; onComplete: () => void }) {
  const { completeOnboarding } = useLibrary();
  const [step, setStep] = useState<Step>(0);
  const [favorites, setFavorites] = useState<MoodKey[]>([]);
  const [avoid, setAvoid] = useState<MoodKey[]>([]);
  const [pace, setPace] = useState<MoodPreferences["pace"]>("medium");
  const [strictness, setStrictness] = useState<SpoilerStrictness>("balanced");
  const [age, setAge] = useState<string>("");

  const toggleFav = (m: MoodKey) => {
    setFavorites((prev) =>
      prev.includes(m) ? prev.filter((x) => x !== m) : prev.length >= 3 ? prev : [...prev, m]
    );
  };
  const toggleAvoid = (m: MoodKey) => {
    setAvoid((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]));
  };

  const next = () => setStep((s) => Math.min(5, (s + 1) as Step));
  const back = () => setStep((s) => Math.max(0, (s - 1) as Step));

  const finish = () => {
    const parsedAge = parseInt(age, 10);
    completeOnboarding({
      favorites,
      avoid,
      pace,
      spoilerStrictness: strictness,
      age: isFinite(parsedAge) && parsedAge > 0 ? parsedAge : undefined,
    });
    toast.success("Your mood profile is set.");
    onComplete();
  };

  const canNext =
    (step === 0) ||
    (step === 1 && favorites.length > 0) ||
    (step === 2) ||
    (step === 3) ||
    (step === 4) ||
    step === 5;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-lg p-0 overflow-hidden border-border/60 [&>button]:hidden">
        <div className="p-6 sm:p-8 space-y-6 mood-surface">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" style={{ color: "var(--mood-strong)" }} />
              <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                Step {step + 1} of 6
              </span>
            </div>
            <div className="flex gap-1">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <span
                  key={i}
                  className={cn(
                    "h-1 w-6 rounded-full transition",
                    i <= step ? "bg-foreground" : "bg-muted"
                  )}
                />
              ))}
            </div>
          </div>

          {step === 0 && (
            <div className="space-y-3 animate-fade-up">
              <h2 className="font-display text-3xl leading-tight">
                Welcome to{" "}
                <span className="italic" style={{ color: "var(--mood-strong)" }}>
                  Feltly
                </span>
                .
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                We track reading by emotion, not stars. A 60-second quiz helps your shelf,
                Companion, and recommendations feel like yours from day one.
              </p>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-3 animate-fade-up">
              <h2 className="font-display text-2xl leading-tight">
                Which moods do you{" "}
                <span className="italic" style={{ color: "var(--mood-strong)" }}>
                  reach for
                </span>
                ?
              </h2>
              <p className="text-xs text-muted-foreground">Pick up to 3.</p>
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

          {step === 2 && (
            <div className="space-y-3 animate-fade-up">
              <h2 className="font-display text-2xl leading-tight">
                Anything you'd rather{" "}
                <span className="italic" style={{ color: "var(--mood-strong)" }}>
                  skip
                </span>
                ?
              </h2>
              <p className="text-xs text-muted-foreground">Optional — we'll downrank these.</p>
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

          {step === 3 && (
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

          {step === 4 && (
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

          {step === 5 && (
            <div className="space-y-3 animate-fade-up">
              <h2 className="font-display text-2xl leading-tight">
                One last thing — how{" "}
                <span className="italic" style={{ color: "var(--mood-strong)" }}>
                  old
                </span>{" "}
                are you?
              </h2>
              <p className="text-xs text-muted-foreground">
                We use age only to keep recommendations age-appropriate (skip explicit adult
                content for under-18, surface YA when relevant). Optional — leave blank to skip.
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

          <div className="flex items-center justify-between pt-2">
            <Button
              variant="ghost"
              onClick={back}
              disabled={step === 0}
              className="rounded-full"
            >
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            {step < 5 ? (
              <Button onClick={next} disabled={!canNext} className="rounded-full">
                {step === 0 ? "Start" : "Next"} <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={finish} className="rounded-full">
                Finish <Check className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>

          {step === 0 && (
            <button
              onClick={() => {
                completeOnboarding({
                  favorites: [],
                  avoid: [],
                  pace: "medium",
                  spoilerStrictness: "balanced",
                });
                onComplete();
              }}
              className="block mx-auto text-xs text-muted-foreground hover:text-foreground transition"
            >
              Skip for now
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}