import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { usePremium, type PremiumPlan } from "@/lib/usePremium";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Sparkles, Check, Lock, Brain, Snowflake, Bell, Users, Music2,
  User, Timer, Palette, FolderPlus, Share2, FileText, Tablet,
  Heart, BarChart3, Zap, Calendar, ArrowLeft, BookOpen, Copy, Gift,
} from "lucide-react";
import { UpgradePrompt } from "@/components/premium/UpgradePrompt";

const PLANS: { key: PremiumPlan; label: string; price: string; sub: string; badge?: string; monthlyEquiv?: string }[] = [
  { key: "monthly",  label: "Monthly",  price: "$6",  sub: "per month" },
  { key: "annual",   label: "Annual",   price: "$35", sub: "per year", badge: "Most popular", monthlyEquiv: "$2.92 / mo" },
  { key: "lifetime", label: "Lifetime", price: "$80", sub: "one-time",  badge: "Best value" },
];

type FeatureCategory = {
  icon: React.ElementType;
  title: string;
  color: string;
  features: { label: string; free?: string; premium: string }[];
};

const CATEGORIES: FeatureCategory[] = [
  {
    icon: Brain,
    title: "AI Companion",
    color: "text-violet-600",
    features: [
      { label: "Reflect mode", free: "5 msgs / day", premium: "Unlimited" },
      { label: "Character chat mode", free: "—", premium: "Unlimited" },
      { label: "Conversation history", free: "—", premium: "Saved per book" },
    ],
  },
  {
    icon: Snowflake,
    title: "Streak & Habits",
    color: "text-sky-600",
    features: [
      { label: "Reading streak", free: "Tracked", premium: "Tracked" },
      { label: "Streak freeze credits", free: "—", premium: "1 per week, auto-cover" },
      { label: "Smart reading reminders", free: "—", premium: "At your best hour" },
    ],
  },
  {
    icon: Users,
    title: "Social & Buddy Reads",
    color: "text-emerald-600",
    features: [
      { label: "Activity feed", free: "Full access", premium: "Full access" },
      { label: "Buddy read rooms", free: "1 room, 3 members", premium: "Unlimited" },
      { label: "Reading Twins matching", free: "View only", premium: "Full match + messages" },
    ],
  },
  {
    icon: Music2,
    title: "Mood Playlists",
    color: "text-pink-600",
    features: [
      { label: "Mood-curated playlists", free: "—", premium: "Spotify + Apple Music links" },
      { label: "Now playing on profile", free: "—", premium: "Show your reading soundtrack" },
    ],
  },
  {
    icon: BarChart3,
    title: "Insights & Analytics",
    color: "text-amber-600",
    features: [
      { label: "Weekly mood split", free: "—", premium: "Full breakdown" },
      { label: "Monthly mood reports", free: "—", premium: "PDF-ready" },
      { label: "Reading DNA", free: "—", premium: "Archetype + radar chart" },
      { label: "Reading Personality", free: "—", premium: "Archetype derived from data" },
      { label: "Best reading time insight", free: "View only", premium: "With smart reminder" },
      { label: "Estimated finish date", free: "—", premium: "Based on your reading pace" },
      { label: "Annual Tropely Wrap", free: "—", premium: "Year-in-review" },
    ],
  },
  {
    icon: FolderPlus,
    title: "Library & Organisation",
    color: "text-teal-600",
    features: [
      { label: "Books in library", free: "Unlimited", premium: "Unlimited" },
      { label: "Collections & series", free: "—", premium: "Unlimited" },
      { label: "Custom shelf names", free: "—", premium: "Rename any shelf" },
      { label: "Bookshelf themes", free: "—", premium: "8 textures + accent colors" },
      { label: "TBR mood intent", free: "—", premium: "Tag each book with expected feel" },
    ],
  },
  {
    icon: Heart,
    title: "Family Profiles",
    color: "text-rose-600",
    features: [
      { label: "Profiles", free: "1 profile", premium: "Up to 6 family profiles" },
      { label: "Age-rated book filtering", free: "—", premium: "Per profile" },
      { label: "Parental PIN", free: "—", premium: "Lock social features" },
    ],
  },
  {
    icon: Share2,
    title: "Sharing & Export",
    color: "text-blue-600",
    features: [
      { label: "Share book cards", free: "—", premium: "Beautiful mood-matched cards" },
      { label: "Full JSON export", free: "Included", premium: "Included" },
      { label: "Cross-device sync", free: "—", premium: "Position sync across devices" },
    ],
  },
  {
    icon: Tablet,
    title: "Reading Experience",
    color: "text-indigo-600",
    features: [
      { label: "Focus Mode", free: "—", premium: "Distraction-free timer" },
      { label: "OCR highlight scan", free: "—", premium: "Photograph a passage to log it" },
      { label: "Audio session tracking", free: "—", premium: "Minute-precise audiobook logs" },
    ],
  },
];

export default function Premium() {
  const isPremium = usePremium((s) => s.isPremium);
  const plan = usePremium((s) => s.plan);
  const setPlan = usePremium((s) => s.setPlan);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PremiumPlan>("annual");
  const [copied, setCopied] = useState(false);
  const { user } = useAuth();

  const referralCode = user?.id
    ? `TROPE-${user.id.slice(-6).toUpperCase()}`
    : "TROPE-XXXXXX";
  const referralLink = `${window.location.origin}?ref=${referralCode}`;

  const copyReferral = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast.success("Referral link copied!");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("Couldn't copy — try manually selecting the link.");
    }
  }, [referralLink]);

  const handleSelect = (key: PremiumPlan) => {
    setPlan(key);
    toast.success(
      `${key === "monthly" ? "Monthly" : key === "annual" ? "Annual" : "Lifetime"} plan activated (dev mode)`
    );
  };

  return (
    <AppShell>
      <div className="space-y-10 max-w-3xl pb-10">
        <Link
          to="/profile"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </Link>

        {/* Hero */}
        <header className="rounded-3xl mood-surface border border-border/40 p-8 sm:p-12 grain relative overflow-hidden space-y-4">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-white/60 backdrop-blur px-3 py-1 text-[11px] uppercase tracking-widest text-muted-foreground">
            <Sparkles className="h-3 w-3" style={{ color: "var(--mood-strong)" }} /> Tropely Premium
          </div>
          {isPremium ? (
            <>
              <h1 className="font-display text-4xl sm:text-5xl leading-[1.05]">
                You're on the{" "}
                <span className="italic" style={{ color: "var(--mood-strong)" }}>
                  {plan ?? "premium"} plan.
                </span>
              </h1>
              <p className="text-muted-foreground max-w-md">
                Every feature below is unlocked. Enjoy the full Tropely experience.
              </p>
            </>
          ) : (
            <>
              <h1 className="font-display text-4xl sm:text-5xl leading-[1.05]">
                Read deeper.{" "}
                <span className="italic" style={{ color: "var(--mood-strong)" }}>
                  Feel more.
                </span>
              </h1>
              <p className="text-muted-foreground max-w-md">
                Premium gives you the tools to understand not just what you read — but how it
                moves you.
              </p>
            </>
          )}
        </header>

        {/* Pricing plans */}
        {!isPremium && (
          <section className="space-y-4">
            <h2 className="font-display text-2xl">Choose a plan</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              {PLANS.map(({ key, label, price, sub, badge, monthlyEquiv }) => {
                const isSelected = selectedPlan === key;
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedPlan(key)}
                    className={cn(
                      "relative rounded-2xl border p-4 text-left space-y-2 transition",
                      isSelected
                        ? "border-foreground bg-foreground/5 ring-1 ring-foreground/20"
                        : "border-border/60 hover:border-foreground/40"
                    )}
                  >
                    {badge && (
                      <span className="absolute -top-2.5 right-3 rounded-full border border-border/60 bg-background px-2.5 py-0.5 text-[9px] uppercase tracking-widest whitespace-nowrap">
                        {badge}
                      </span>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
                      {isSelected && <Check className="h-3.5 w-3.5 text-foreground" />}
                    </div>
                    <div className="font-display text-3xl">{price}</div>
                    <div className="text-[11px] text-muted-foreground">{sub}</div>
                    {monthlyEquiv && (
                      <div className="text-[10px] text-muted-foreground">{monthlyEquiv}</div>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                className="rounded-full px-8"
                onClick={() => handleSelect(selectedPlan)}
              >
                <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                Unlock{" "}
                {selectedPlan === "lifetime"
                  ? "Lifetime"
                  : selectedPlan === "annual"
                  ? "Annual"
                  : "Monthly"}{" "}
                Premium
              </Button>
              <p className="text-[11px] text-muted-foreground">
                <Lock className="inline h-2.5 w-2.5 mr-0.5" />
                Handled by App Store / Play Store
              </p>
            </div>
          </section>
        )}

        {/* Referral */}
        <section className="rounded-2xl border border-border/50 mood-surface p-6 space-y-3">
          <div className="flex items-center gap-2">
            <Gift className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-display text-2xl">Invite a friend, get a month free</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Share your referral link. When a friend signs up and subscribes, you both get one free month of Premium.
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded-xl border border-border/60 bg-background/60 px-3 py-2 text-sm font-mono truncate select-all">
              {referralLink}
            </code>
            <Button
              size="sm"
              variant="outline"
              className="rounded-full shrink-0 gap-1.5"
              onClick={copyReferral}
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied!" : "Copy"}
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Your free month is applied automatically once your friend's first payment processes.
          </p>
        </section>

        {/* Feature comparison */}
        <section className="space-y-6">
          <h2 className="font-display text-2xl">Everything that's included</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {CATEGORIES.map((cat) => (
              <div
                key={cat.title}
                className="rounded-2xl border border-border/50 mood-surface p-5 space-y-3"
              >
                <div className="flex items-center gap-2">
                  <cat.icon className={cn("h-4 w-4", cat.color)} />
                  <h3 className="font-display text-lg">{cat.title}</h3>
                </div>
                <ul className="space-y-2">
                  {cat.features.map((f) => (
                    <li key={f.label} className="grid grid-cols-[1fr_auto_auto] gap-x-3 items-center text-sm">
                      <span className="text-foreground">{f.label}</span>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                        {f.free ?? "—"}
                      </span>
                      <span
                        className="text-[10px] whitespace-nowrap font-medium"
                        style={{ color: "var(--mood-strong)" }}
                      >
                        {f.premium}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Bottom CTA */}
        {!isPremium && (
          <div className="rounded-2xl border border-border/40 mood-surface p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="font-display text-xl">Ready to go deeper?</p>
              <p className="text-sm text-muted-foreground">Cancel any time. No questions asked.</p>
            </div>
            <Button className="rounded-full px-8 shrink-0" onClick={() => setUpgradeOpen(true)}>
              <Sparkles className="h-3.5 w-3.5 mr-1.5" /> See plans
            </Button>
          </div>
        )}
      </div>
      <UpgradePrompt open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
    </AppShell>
  );
}
