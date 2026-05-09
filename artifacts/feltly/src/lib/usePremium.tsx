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

/**
 * Local premium flag.
 *
 * In production this is unlocked by a successful App Store / Play Store
 * in-app purchase (StoreKit / Google Play Billing). For now it's a simple
 * persisted local flag with a dev toggle in the Profile page so the locked
 * UI can be tested.
 */
export const usePremium = create<PremiumState>()(
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
