import { create } from "zustand";
import { persist } from "zustand/middleware";

export type PremiumPlan = "monthly" | "annual" | "lifetime" | null;

type PremiumState = {
  isPremium: boolean;
  plan: PremiumPlan;
  hasSeenUpgradePrompt: boolean;
  setPremium: (v: boolean) => void;
  setPlan: (plan: PremiumPlan) => void;
  togglePremium: () => void;
  markUpgradePromptSeen: () => void;
};

// ---------------------------------------------------------------------------
// TODO(payments): Set TESTING_PREMIUM_BYPASS = false and remove this block
// before enabling real App Store / Play Store payments in production.
// When true, every isPremium check returns true so testers can access all
// premium features without going through the payment flow.
// ---------------------------------------------------------------------------
const TESTING_PREMIUM_BYPASS = true;

const _premiumStore = create<PremiumState>()(
  persist(
    (set, get) => ({
      isPremium: false,
      plan: null,
      hasSeenUpgradePrompt: false,
      setPremium: (v) => set({ isPremium: v }),
      setPlan: (plan) => set({ plan, isPremium: plan !== null }),
      togglePremium: () => {
        const next = !get().isPremium;
        set({ isPremium: next, plan: next ? (get().plan ?? "monthly") : null });
      },
      markUpgradePromptSeen: () => set({ hasSeenUpgradePrompt: true }),
    }),
    { name: "felt-premium" }
  )
);

/**
 * Premium state hook — drop-in replacement for the Zustand store selector API.
 *
 * When TESTING_PREMIUM_BYPASS is true every selector sees isPremium=true and
 * plan="monthly" (if no plan is stored), so all premium-gated UI renders as
 * unlocked.  Paywall overlays, LockedFeature wrappers, and PremiumButton
 * components are all bypassed without any component-level changes.
 *
 * To re-enable the paywall: set TESTING_PREMIUM_BYPASS = false above.
 */
export function usePremium<T>(
  selector: (state: PremiumState) => T,
  equals?: (a: T, b: T) => boolean,
): T {
  if (TESTING_PREMIUM_BYPASS) {
    return _premiumStore(
      (s) => selector({ ...s, isPremium: true, plan: s.plan ?? "monthly" }),
      equals,
    );
  }
  return _premiumStore(selector, equals);
}
