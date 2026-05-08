import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  BookHeart,
  PlayCircle,
  NotebookPen,
  BarChart3,
  Sparkles,
} from "lucide-react";

type Step = {
  icon: typeof BookHeart;
  eyebrow: string;
  title: React.ReactNode;
  body: string;
};

const STEPS: Step[] = [
  {
    icon: BookHeart,
    eyebrow: "Step 1",
    title: (
      <>
        Pick a current{" "}
        <span className="italic" style={{ color: "var(--mood-strong)" }}>
          book
        </span>
        .
      </>
    ),
    body:
      "Add the book you're reading right now. Tropely uses it to colour your home, your Companion, and the mood under everything else.",
  },
  {
    icon: PlayCircle,
    eyebrow: "Step 2",
    title: (
      <>
        Log a session with a{" "}
        <span className="italic" style={{ color: "var(--mood-strong)" }}>
          mood
        </span>
        .
      </>
    ),
    body:
      "When you stop reading, log a quick session — pages, minutes, and how it left you feeling. Your streak and mood pulse start there.",
  },
  {
    icon: NotebookPen,
    eyebrow: "Step 3",
    title: (
      <>
        Capture notes &{" "}
        <span className="italic" style={{ color: "var(--mood-strong)" }}>
          quotes
        </span>
        .
      </>
    ),
    body:
      "The Journal is for the lines you can't shake and the moments that hit hardest. Tap the strip at the top of any page to write.",
  },
  {
    icon: BarChart3,
    eyebrow: "Step 4",
    title: (
      <>
        Watch your{" "}
        <span className="italic" style={{ color: "var(--mood-strong)" }}>
          landscape
        </span>{" "}
        form.
      </>
    ),
    body:
      "Insights stays quiet until you have data — then your trope fingerprint, mood pulse, and reading personality appear, only ever from your own pages.",
  },
];

export function Walkthrough({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [step, setStep] = useState(0);
  const total = STEPS.length;
  const cur = STEPS[step];
  const Icon = cur.icon;

  const next = () => {
    if (step < total - 1) setStep(step + 1);
    else finish();
  };
  const back = () => setStep((s) => Math.max(0, s - 1));
  const finish = () => {
    setStep(0);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) finish(); }}>
      <DialogContent
        className="max-w-md p-0 overflow-hidden border-border/60 [&>button]:hidden"
        aria-describedby={undefined}
      >
        <DialogTitle className="sr-only">How Tropely works</DialogTitle>
        <div className="p-6 sm:p-8 space-y-6 mood-surface">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles
                className="h-4 w-4"
                style={{ color: "var(--mood-strong)" }}
              />
              <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                {cur.eyebrow} of {total}
              </span>
            </div>
            <div className="flex gap-1">
              {Array.from({ length: total }).map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    "h-1 w-5 rounded-full transition",
                    i <= step ? "bg-foreground" : "bg-muted"
                  )}
                />
              ))}
            </div>
          </div>

          <div className="space-y-4 animate-fade-up" key={step}>
            <div
              className="grid h-12 w-12 place-items-center rounded-2xl bg-foreground/5"
              aria-hidden="true"
            >
              <Icon
                className="h-5 w-5"
                style={{ color: "var(--mood-strong)" }}
              />
            </div>
            <h2 className="font-display text-2xl sm:text-3xl leading-tight">
              {cur.title}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {cur.body}
            </p>
          </div>

          <div className="flex items-center justify-between pt-2">
            <Button
              variant="ghost"
              onClick={back}
              disabled={step === 0}
              className="rounded-full"
            >
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            <Button onClick={next} className="rounded-full">
              {step === total - 1 ? (
                <>
                  Got it <Check className="h-4 w-4 ml-1" />
                </>
              ) : (
                <>
                  Next <ArrowRight className="h-4 w-4 ml-1" />
                </>
              )}
            </Button>
          </div>

          <button
            onClick={finish}
            className="block mx-auto text-xs text-muted-foreground hover:text-foreground transition"
          >
            {step === total - 1 ? "Close" : "Skip the tour"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
