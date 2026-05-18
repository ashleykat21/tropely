import { useMemo } from "react";
import { useStore } from "@/store";
import { MOOD_ATMOSPHERES, DEFAULT_ATMOSPHERE, moodToAtmosphere } from "@/constants/theme";
import type { MoodAtmosphere } from "@/constants/theme";

export function useAtmosphere() {
  const books = useStore((s) => s.books);
  const activeFocusBookId = useStore((s) => s.activeFocusBookId);
  const activeMood = useStore((s) => s.activeMood);
  const backgroundMode = useStore((s) => s.backgroundMode);
  const selectedStaticBackground = useStore((s) => s.selectedStaticBackground);
  const moodAtmosphereOverride = useStore((s) => s.moodAtmosphereOverride);

  return useMemo(() => {
    let key: MoodAtmosphere;
    if (backgroundMode === "minimal_neutral") {
      key = "minimal_neutral";
    } else if (backgroundMode === "static") {
      key = (selectedStaticBackground as MoodAtmosphere) ?? DEFAULT_ATMOSPHERE;
    } else {
      // mood_adaptive
      if (moodAtmosphereOverride) {
        key = moodAtmosphereOverride as MoodAtmosphere;
      } else {
        const currentBooks = books.filter((b) => b.shelf === "reading");
        const focusBook = currentBooks.find((b) => b.id === activeFocusBookId) ?? currentBooks[0];
        if (focusBook?.mood) {
          key = moodToAtmosphere(focusBook.mood);
        } else if (activeMood) {
          key = moodToAtmosphere(activeMood);
        } else {
          key = DEFAULT_ATMOSPHERE;
        }
      }
    }
    return MOOD_ATMOSPHERES[key] ?? MOOD_ATMOSPHERES[DEFAULT_ATMOSPHERE];
  }, [books, activeFocusBookId, activeMood, backgroundMode, selectedStaticBackground, moodAtmosphereOverride]);
}
