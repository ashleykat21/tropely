import { ReactNode } from "react";
import { Lock, Sparkles } from "lucide-react";
import { usePremium } from "@/lib/usePremium";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

type Props = {
  children: ReactNode;
  title?: string;
  description?: string;
  className?: string;
  /** Force the lock UI even outside the wrapper (for buttons) */
  asInline?: boolean;
};

/**
 * Wraps a premium-only feature. Free users see the UI dimmed/disabled with a
 * floating lock badge; clicks are intercepted and an upgrade toast is shown.
 * Once `isPremium` is true (via in-app purchase or dev toggle), the children
 * render normally with no overlay.
 */
export function LockedFeature({ children, title = "Premium", description, className }: Props) {
  const isPremium = usePremium((s) => s.isPremium);
  const nav = useNavigate();

  if (isPremium) return <>{children}</>;

  const promptUpgrade = (e: React.SyntheticEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toast("This is a premium feature", {
      description: description ?? "Upgrade to unlock.",
      icon: <Sparkles className="h-4 w-4" />,
      action: { label: "See plans", onClick: () => nav("/premium") },
    });
  };

  return (
    <div className={cn("relative group", className)}>
      {/* Locked overlay — captures pointer events */}
      <div
        onClickCapture={promptUpgrade}
        onPointerDownCapture={promptUpgrade}
        className="absolute inset-0 z-20 cursor-not-allowed rounded-[inherit]"
        aria-label={`${title} — premium feature, locked`}
      />
      {/* Lock badge */}
      <div className="absolute top-3 right-3 z-30 inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/90 backdrop-blur px-2.5 py-1 text-[10px] uppercase tracking-widest shadow-soft pointer-events-none">
        <Lock className="h-3 w-3" />
        Premium
      </div>
      {/* Dimmed + non-interactive content */}
      <div className="opacity-60 saturate-50 pointer-events-none select-none [&_*]:!pointer-events-none">
        {children}
      </div>
    </div>
  );
}

/**
 * A standalone premium-locked Button. Renders the original button when premium,
 * otherwise a disabled-looking button with a lock that prompts an upgrade.
 */
export function PremiumButton({
  children,
  className,
  onClick,
  ...rest
}: React.ComponentProps<typeof Button>) {
  const isPremium = usePremium((s) => s.isPremium);
  const nav = useNavigate();

  if (isPremium) {
    return (
      <Button className={className} onClick={onClick} {...rest}>
        {children}
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      className={cn("rounded-full gap-1.5 opacity-80", className)}
      onClick={(e) => {
        e.preventDefault();
        nav("/premium");
      }}
      {...rest}
    >
      <Lock className="h-3.5 w-3.5" />
      {children}
    </Button>
  );
}