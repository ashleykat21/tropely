import { create } from "zustand";
import { persist } from "zustand/middleware";

type PremiumState = {
  isPremium: boolean;
  setPremium: (v: boolean) => void;
  togglePremium: () => void;
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
      setPremium: (v) => set({ isPremium: v }),
      togglePremium: () => set({ isPremium: !get().isPremium }),
    }),
    { name: "felt-premium" }
  )
);