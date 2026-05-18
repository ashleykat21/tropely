import React, { createContext, useContext } from "react";
import { useAtmosphereKey } from "@/hooks/useAtmosphere";
import { getMoodTheme, type MoodTheme } from "./moodThemes";
import { useStore } from "@/store";
import type { BackgroundMode, MoodAtmosphere } from "@/constants/theme";

interface ThemeContextValue {
  themeId: MoodAtmosphere;
  theme: MoodTheme;
  backgroundMode: BackgroundMode;
  selectedStaticBackground: MoodAtmosphere;
  matchCurrentBookMood: boolean;
  setBackgroundMode: (mode: BackgroundMode) => void;
  setSelectedStaticBackground: (bg: MoodAtmosphere) => void;
  setMatchCurrentBookMood: (v: boolean) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const themeId = useAtmosphereKey();
  const theme = getMoodTheme(themeId);

  const backgroundMode = useStore((s) => s.backgroundMode);
  const selectedStaticBackground = useStore((s) => s.selectedStaticBackground) as MoodAtmosphere;
  const matchCurrentBookMood = useStore((s) => s.matchCurrentBookMood);
  const setBackgroundMode = useStore((s) => s.setBackgroundMode);
  const setSelectedStaticBackground = useStore((s) => s.setSelectedStaticBackground);
  const setMatchCurrentBookMood = useStore((s) => s.setMatchCurrentBookMood);

  return (
    <ThemeContext.Provider
      value={{
        themeId,
        theme,
        backgroundMode,
        selectedStaticBackground: selectedStaticBackground ?? "cozy_romantic",
        matchCurrentBookMood: matchCurrentBookMood ?? true,
        setBackgroundMode,
        setSelectedStaticBackground: setSelectedStaticBackground as (bg: MoodAtmosphere) => void,
        setMatchCurrentBookMood,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
