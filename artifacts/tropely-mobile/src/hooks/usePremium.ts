import { TESTER_MODE } from "@/constants/testerMode";
import { useStore } from "@/store";

export function usePremium() {
  const isPremium = useStore((s) => s.isPremium);
  return {
    isPremium: TESTER_MODE ? true : isPremium,
    isActuallyPremium: isPremium,
    isTesterMode: TESTER_MODE,
  };
}
