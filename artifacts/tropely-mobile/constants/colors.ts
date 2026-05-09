// Exact values derived from Feltly's CSS custom properties (index.css)
// background:       hsl(34 38% 91%)  → #F1E9DF
// foreground:       hsl(25 30% 12%)  → #2A1F14
// card:             hsl(36 44% 95%)  → #F8F3ED
// muted:            hsl(33 22% 88%)  → #E7E1DA
// mutedForeground:  hsl(25 14% 36%)  → #695A4F
// border:           hsl(28 20% 80%)  → #D6CBC2
// moodStrong (def): hsl(180 40% 38%) → #3A8888  (calm teal)
// moodTint (def):   hsl(180 30% 92%) → #E5F1F1  (calm tint)

const colors = {
  light: {
    text:             "#2A1F14",
    tint:             "#3A8888",
    background:       "#F1E9DF",
    foreground:       "#2A1F14",
    card:             "#F8F3ED",
    cardForeground:   "#2A1F14",
    primary:          "#2A1F14",
    primaryForeground:"#F1E9DF",
    secondary:        "#E7E1DA",
    secondaryForeground: "#2A1F14",
    muted:            "#E7E1DA",
    mutedForeground:  "#695A4F",
    accent:           "#3A8888",
    accentForeground: "#F1E9DF",
    destructive:      "#C0392B",
    destructiveForeground: "#FFFFFF",
    border:           "#D6CBC2",
    input:            "#D6CBC2",
    surface:          "#F8F3ED",
    overlay:          "rgba(42,31,20,0.4)",
    moodStrong:       "#3A8888",
    moodTint:         "#E5F1F1",
  },
  dark: {
    text:             "#F0EEF8",
    tint:             "#9E7CCC",
    background:       "#0E0D14",
    foreground:       "#F0EEF8",
    card:             "#1A1828",
    cardForeground:   "#F0EEF8",
    primary:          "#9E7CCC",
    primaryForeground:"#FFFFFF",
    secondary:        "#252336",
    secondaryForeground: "#C8C4DC",
    muted:            "#252336",
    mutedForeground:  "#8E8BA8",
    accent:           "#9E7CCC",
    accentForeground: "#FFFFFF",
    destructive:      "#EF4444",
    destructiveForeground: "#FFFFFF",
    border:           "#2A2840",
    input:            "#2A2840",
    surface:          "#1A1828",
    overlay:          "rgba(0,0,0,0.6)",
    moodStrong:       "#9E7CCC",
    moodTint:         "#1E1A30",
  },
  radius: 12,
  moods: {
    calm:       { accent: "#3A8888", bg: "#E5F1F1", label: "Calm",       emoji: "🌊" },
    cozy:       { accent: "#C4723A", bg: "#F7EBE0", label: "Cozy",       emoji: "🕯️" },
    melancholy: { accent: "#6B7FAE", bg: "#ECEEF6", label: "Melancholy", emoji: "🌧️" },
    intense:    { accent: "#B03050", bg: "#F8E8EC", label: "Intense",    emoji: "🔥" },
    dreamy:     { accent: "#8B68C4", bg: "#EDE8F5", label: "Dreamy",     emoji: "✨" },
    joyful:     { accent: "#C49A28", bg: "#F7F0DC", label: "Joyful",     emoji: "🌻" },
    mysterious: { accent: "#50508C", bg: "#EBEBF5", label: "Mysterious", emoji: "🌙" },
  } as const,
};

export type MoodKey = keyof typeof colors.moods;

export default colors;
