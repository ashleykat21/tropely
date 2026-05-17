// Design system constants for Tropely v1

export const COLORS = {
  bg: "#fafaf9",
  bgWarm: "#f5f0ea",
  card: "#ffffff",
  border: "#f0ede8",
  borderMid: "#e8e0d4",
  text: "#1a1a1a",
  textMid: "#6b7280",
  textSoft: "#9ca3af",
  ink: "#1a1a1a",
  accent: "#1a1a1a",
};

export type MoodKey =
  | "cozy"
  | "calm"
  | "intense"
  | "melancholy"
  | "dreamy"
  | "joyful"
  | "mysterious";

export const MOOD_COLORS: Record<MoodKey, { bg: string; grad: [string, string]; chip: string; label: string; emoji: string }> = {
  cozy:       { bg: "#fdf6ec", grad: ["#fdf6ec", "#f5e6cc"], chip: "#f5e6cc", label: "Cozy",       emoji: "🧸" },
  calm:       { bg: "#eef4fb", grad: ["#eef4fb", "#d6e8f5"], chip: "#d6e8f5", label: "Calm",       emoji: "🌊" },
  intense:    { bg: "#f9eaea", grad: ["#f9eaea", "#f0cccc"], chip: "#f0cccc", label: "Intense",    emoji: "🔥" },
  melancholy: { bg: "#eff0f7", grad: ["#eff0f7", "#d8daf0"], chip: "#d8daf0", label: "Melancholy", emoji: "🌧️" },
  dreamy:     { bg: "#f5eef8", grad: ["#f5eef8", "#e4ccf0"], chip: "#e4ccf0", label: "Dreamy",     emoji: "✨" },
  joyful:     { bg: "#fefce8", grad: ["#fefce8", "#fde68a"], chip: "#fde68a", label: "Joyful",     emoji: "☀️" },
  mysterious: { bg: "#f0ece8", grad: ["#f0ece8", "#d4c9a8"], chip: "#d4c9a8", label: "Mysterious", emoji: "🌙" },
};

export const MOOD_KEYS = Object.keys(MOOD_COLORS) as MoodKey[];

// Mood for existing 10-mood store type → display
export const LEGACY_MOOD_DISPLAY: Record<string, { emoji: string; color: string }> = {
  hopeful:     { emoji: "🌱", color: "#d1fae5" },
  tense:       { emoji: "⚡", color: "#fef3c7" },
  melancholy:  { emoji: "🌧️", color: "#e0e7ff" },
  joyful:      { emoji: "☀️", color: "#fef9c3" },
  romantic:    { emoji: "🌹", color: "#fce7f3" },
  eerie:       { emoji: "🌙", color: "#ede9fe" },
  reflective:  { emoji: "🪞", color: "#f0f9ff" },
  adventurous: { emoji: "⛵", color: "#dbeafe" },
  cozy:        { emoji: "🧸", color: "#fef3c7" },
  intense:     { emoji: "🔥", color: "#fee2e2" },
};

export const SHELF_LABELS: Record<string, { label: string; emoji: string }> = {
  reading:  { label: "Reading",    emoji: "📖" },
  want:     { label: "Want to Read", emoji: "💌" },
  finished: { label: "Finished",   emoji: "✅" },
  paused:   { label: "Paused",     emoji: "⏸️" },
  dnf:      { label: "DNF",        emoji: "🚫" },
};

export const SHADOW = {
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.05,
  shadowRadius: 4,
  elevation: 2,
};
