import { useMemo } from "react";
import { useStore } from "@/store";
import { MOOD_ATMOSPHERES, DEFAULT_ATMOSPHERE, moodToAtmosphere } from "@/constants/theme";
import type { MoodAtmosphere } from "@/constants/theme";

function computeAtmosphereKey(
  backgroundMode: string,
  selectedStaticBackground: string | null | undefined,
  moodAtmosphereOverride: string | null | undefined,
  books: { id: string; shelf: string; mood?: string }[],
  activeFocusBookId: string | null | undefined,
  activeMood: string | null | undefined,
): MoodAtmosphere {
  if (backgroundMode === "minimal_neutral") {
    return "minimal_neutral";
  } else if (backgroundMode === "static") {
    return (selectedStaticBackground as MoodAtmosphere) ?? DEFAULT_ATMOSPHERE;
  } else {
    // mood_adaptive
    if (moodAtmosphereOverride) {
      return moodAtmosphereOverride as MoodAtmosphere;
    } else {
      const currentBooks = books.filter((b) => b.shelf === "reading");
      const focusBook = currentBooks.find((b) => b.id === activeFocusBookId) ?? currentBooks[0];
      if (focusBook?.mood) {
        return moodToAtmosphere(focusBook.mood);
      } else if (activeMood) {
        return moodToAtmosphere(activeMood);
      } else {
        return DEFAULT_ATMOSPHERE;
      }
    }
  }
}

export function useAtmosphere() {
  const books = useStore((s) => s.books);
  const activeFocusBookId = useStore((s) => s.activeFocusBookId);
  const activeMood = useStore((s) => s.activeMood);
  const backgroundMode = useStore((s) => s.backgroundMode);
  const selectedStaticBackground = useStore((s) => s.selectedStaticBackground);
  const moodAtmosphereOverride = useStore((s) => s.moodAtmosphereOverride);

  return useMemo(() => {
    const key = computeAtmosphereKey(backgroundMode, selectedStaticBackground, moodAtmosphereOverride, books, activeFocusBookId, activeMood);
    return MOOD_ATMOSPHERES[key] ?? MOOD_ATMOSPHERES[DEFAULT_ATMOSPHERE];
  }, [books, activeFocusBookId, activeMood, backgroundMode, selectedStaticBackground, moodAtmosphereOverride]);
}

export function useAtmosphereKey(): MoodAtmosphere {
  const books = useStore((s) => s.books);
  const activeFocusBookId = useStore((s) => s.activeFocusBookId);
  const activeMood = useStore((s) => s.activeMood);
  const backgroundMode = useStore((s) => s.backgroundMode);
  const selectedStaticBackground = useStore((s) => s.selectedStaticBackground);
  const moodAtmosphereOverride = useStore((s) => s.moodAtmosphereOverride);

  return useMemo(() => {
    return computeAtmosphereKey(backgroundMode, selectedStaticBackground, moodAtmosphereOverride, books, activeFocusBookId, activeMood);
  }, [books, activeFocusBookId, activeMood, backgroundMode, selectedStaticBackground, moodAtmosphereOverride]);
}
