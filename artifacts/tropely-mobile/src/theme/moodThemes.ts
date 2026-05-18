import type { MoodAtmosphere } from "@/constants/theme";

export interface MoodTheme {
  id: MoodAtmosphere;
  name: string;
  colors: {
    background: string;
    surface: string;
    card: string;
    text: string;
    subtext: string;
    button: string;
    buttonText: string;
    accent: string;
  };
  gradient: readonly [string, string, string];
  headlines: [string, string];
  isDark: boolean;
  decorative: boolean;
}

export const MOOD_THEMES: Record<MoodAtmosphere, MoodTheme> = {
  cozy_romantic: {
    id: "cozy_romantic",
    name: "Cozy & Romantic",
    colors: {
      background: "#fce4d0",
      surface: "rgba(255,245,250,0.85)",
      card: "rgba(255,240,248,0.80)",
      text: "#1a1a1a",
      subtext: "#9ca3af",
      button: "#e8608a",
      buttonText: "#ffffff",
      accent: "#e8608a",
    },
    gradient: ["#fce4d0", "#f9ccd8", "#f5b8cf"],
    headlines: [
      "Lost in soft pages\nand sweet moments",
      "Warm hearts, slow nights,\nsweet stories",
    ],
    isDark: false,
    decorative: true,
  },
  mysterious_dark: {
    id: "mysterious_dark",
    name: "Mysterious & Dark",
    colors: {
      background: "#0d0b1a",
      surface: "rgba(22,18,52,0.82)",
      card: "rgba(22,18,52,0.78)",
      text: "#ffffff",
      subtext: "rgba(255,255,255,0.55)",
      button: "#9b7fe8",
      buttonText: "#ffffff",
      accent: "#9b7fe8",
    },
    gradient: ["#0d0b1a", "#12102e", "#1c1545"],
    headlines: [
      "Some secrets are better\nread after dark",
      "The shadows hold\nthe best stories",
    ],
    isDark: true,
    decorative: true,
  },
  fantasy_magical: {
    id: "fantasy_magical",
    name: "Fantasy & Magical",
    colors: {
      background: "#2d1660",
      surface: "rgba(55,28,100,0.78)",
      card: "rgba(55,28,100,0.75)",
      text: "#ffffff",
      subtext: "rgba(255,255,255,0.55)",
      button: "#c084fc",
      buttonText: "#ffffff",
      accent: "#c084fc",
    },
    gradient: ["#2d1660", "#4a28a0", "#6b42c8"],
    headlines: [
      "Ready to escape\nsomewhere magical",
      "Between pages,\nmagic lives",
    ],
    isDark: true,
    decorative: true,
  },
  emotional_heartfelt: {
    id: "emotional_heartfelt",
    name: "Emotional & Heartfelt",
    colors: {
      background: "#c8e6f8",
      surface: "rgba(240,248,255,0.88)",
      card: "rgba(240,248,255,0.85)",
      text: "#1a1a1a",
      subtext: "#6b7280",
      button: "#5b9bd5",
      buttonText: "#ffffff",
      accent: "#5b9bd5",
    },
    gradient: ["#c8e6f8", "#d8eefa", "#edd4f0"],
    headlines: [
      "Stories that stay with you\nlong after",
      "Reading with\nyour whole heart",
    ],
    isDark: false,
    decorative: true,
  },
  dark_intense: {
    id: "dark_intense",
    name: "Dark & Intense",
    colors: {
      background: "#0f0000",
      surface: "rgba(30,6,6,0.85)",
      card: "rgba(30,6,6,0.82)",
      text: "#ffffff",
      subtext: "rgba(255,255,255,0.50)",
      button: "#dc2626",
      buttonText: "#ffffff",
      accent: "#dc2626",
    },
    gradient: ["#0f0000", "#200606", "#350a0a"],
    headlines: [
      "Fueled by intensity\nand high stakes",
      "Nothing ordinary\nsurvives tonight",
    ],
    isDark: true,
    decorative: true,
  },
  light_fun: {
    id: "light_fun",
    name: "Light & Fun",
    colors: {
      background: "#fef3c7",
      surface: "rgba(255,252,235,0.90)",
      card: "rgba(255,252,235,0.88)",
      text: "#1a1a1a",
      subtext: "#78716c",
      button: "#ea7c2b",
      buttonText: "#ffffff",
      accent: "#ea7c2b",
    },
    gradient: ["#fef3c7", "#fde68a", "#fdba74"],
    headlines: [
      "Looking for something\nbright and easy",
      "Good vibes\nand happy endings",
    ],
    isDark: false,
    decorative: true,
  },
  minimal_neutral: {
    id: "minimal_neutral",
    name: "Minimal / Neutral",
    colors: {
      background: "#fdfaf6",
      surface: "rgba(255,252,248,0.94)",
      card: "rgba(255,252,248,0.92)",
      text: "#1a1a1a",
      subtext: "#9ca3af",
      button: "#7a6855",
      buttonText: "#ffffff",
      accent: "#7a6855",
    },
    gradient: ["#fdfaf6", "#f4ede3", "#ece3d8"],
    headlines: [
      "Focus. Read.\nReflect.",
      "Your next chapter\nstarts here.",
    ],
    isDark: false,
    decorative: false,
  },
  dark_moody_neutral: {
    id: "dark_moody_neutral",
    name: "Dark / Moody Neutral",
    colors: {
      background: "#131815",
      surface: "rgba(22,32,22,0.85)",
      card: "rgba(22,32,22,0.82)",
      text: "#ffffff",
      subtext: "rgba(255,255,255,0.50)",
      button: "#6b9e6b",
      buttonText: "#ffffff",
      accent: "#6b9e6b",
    },
    gradient: ["#131815", "#1a2218", "#1f2b20"],
    headlines: [
      "In the mood for\nsomething deep",
      "Quiet pages,\ndarker thoughts.",
    ],
    isDark: true,
    decorative: false,
  },
  cottagecore_botanical: {
    id: "cottagecore_botanical",
    name: "Cottagecore / Botanical",
    colors: {
      background: "#fdf7ea",
      surface: "rgba(253,247,234,0.90)",
      card: "rgba(253,247,234,0.88)",
      text: "#1a1a1a",
      subtext: "#78716c",
      button: "#7a9e5a",
      buttonText: "#ffffff",
      accent: "#7a9e5a",
    },
    gradient: ["#fdf7ea", "#f2e8c8", "#e8d9a0"],
    headlines: [
      "A soft story for\na slow afternoon",
      "Petals between\nthe pages.",
    ],
    isDark: false,
    decorative: true,
  },
  classic_literary: {
    id: "classic_literary",
    name: "Classic Literary",
    colors: {
      background: "#fef4e2",
      surface: "rgba(254,248,234,0.92)",
      card: "rgba(254,248,234,0.90)",
      text: "#1a1a1a",
      subtext: "#78716c",
      button: "#8b5e2a",
      buttonText: "#ffffff",
      accent: "#8b5e2a",
    },
    gradient: ["#fef4e2", "#f8e5c0", "#f0d49a"],
    headlines: [
      "For the love of\na well-worn page",
      "Words worth\nkeeping.",
    ],
    isDark: false,
    decorative: true,
  },
};

export function getMoodTheme(id: string): MoodTheme {
  return MOOD_THEMES[id as MoodAtmosphere] ?? MOOD_THEMES.cozy_romantic;
}
