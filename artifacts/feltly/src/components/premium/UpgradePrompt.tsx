import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, Lock, Check } from "lucide-react";
import { usePremium, type PremiumPlan } from "@/lib/usePremium";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

const PLANS: { key: PremiumPlan; label: string; price: string; sub: string; badge?: string }[] = [
  { key: "monthly",  label: "Monthly",  price: "$6",  sub: "per month" },
  { key: "annual",   label: "Annual",   price: "$35", sub: "per year", badge: "Popular · save 51%" },
  { key: "lifetime", label: "Lifetime", price: "$75", sub: "one-time", badge: "Best value" },
];

const FEATURES = [
  "AI Companion — spoiler-safe reflective chat",
  "Scan physical books via cover or ISBN",
  "Weekly mood split & Reading DNA",
  "Monthly mood reports & deep insights",
  "Bookshelf themes & custom accent colors",
  "Bulk import from Goodreads / StoryGraph",
  "Unlimited Buddy Reads + Focus Mode",
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export function UpgradePrompt({ open, onClose }: Props) {
  const setPlan = usePremium((s) => s.setPlan);
  const isPremium = usePremium((s) => s.isPremium);
  const markSeen = usePremium((s) => s.markUpgradePromptSeen);
  const nav = useNavigate();

  const handleClose = () => {
    markSeen();
    onClose();
  };

  const handleSelect = (plan: PremiumPlan) => {
    setPlan(plan);
    markSeen();
    toast.success(`${plan === "monthly" ? "Monthly" : plan === "annual" ? "Annual" : "Lifetime"} plan activated (dev)`);
    onClose();
  };

  if (isPremium) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-3xl flex items-center gap-2">
            <Sparkles className="h-5 w-5" style={{ color: "var(--mood-strong)" }} />
            Unlock Tropely Premium
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            You&apos;re building a great reading habit. Premium gives you the tools to go deeper.
          </DialogDescription>
        </DialogHeader>

        {/* Features list */}
        <ul className="space-y-1.5 py-1">
          {FEATURES.map((f) => (
            <li key={f} className="flex items-start gap-2 text-sm">
              <Check className="h-3.5 w-3.5 mt-0.5 shrink-0 text-green-600" />
              {f}
            </li>
          ))}
        </ul>

        {/* Plan cards */}
        <div className="grid gap-2 sm:grid-cols-3 pt-1">
          {PLANS.map(({ key, label, price, sub, badge }) => (
            <div
              key={key}
              className={cn(
                "relative rounded-xl border p-3 space-y-2",
                key === "annual" ? "border-foreground" : "border-border/60 bg-background/40"
              )}
            >
              {badge && (
                <span className="absolute -top-2 right-3 rounded-full border border-border/60 bg-background px-2 py-0.5 text-[9px] uppercase tracking-widest whitespace-nowrap">
                  {badge}
                </span>
              )}
              <div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
                <div className="font-display text-xl">{price}</div>
                <div className="text-[11px] text-muted-foreground">{sub}</div>
              </div>
              <Button
                size="sm"
                variant={key === "annual" ? "default" : "outline"}
                className="w-full rounded-full text-xs"
                onClick={() => handleSelect(key)}
              >
                {key === "lifetime" ? "Buy once" : `Start ${label}`}
              </Button>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
          <p className="text-[10px] text-muted-foreground">
            <Lock className="inline h-2.5 w-2.5 mr-1" />
            Purchases handled by the App Store / Play Store.
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => { handleClose(); nav("/premium"); }}
              className="text-xs underline underline-offset-2 text-muted-foreground hover:text-foreground transition"
            >
              View all features
            </button>
            <button
              onClick={handleClose}
              className="text-xs text-muted-foreground hover:text-foreground transition"
            >
              Maybe later
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
