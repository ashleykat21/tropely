export type MoodKey =
  | "calm"
  | "cozy"
  | "melancholy"
  | "intense"
  | "dreamy"
  | "joyful"
  | "mysterious";

export const MOODS: Record<MoodKey, { label: string; h: number; s: number; l: number; emoji: string }> = {
  calm:        { label: "Calm",        h: 190, s: 35, l: 60, emoji: "🌊" },
  cozy:        { label: "Cozy",        h: 28,  s: 55, l: 60, emoji: "🕯️" },
  melancholy:  { label: "Melancholy",  h: 220, s: 25, l: 55, emoji: "🌧️" },
  intense:     { label: "Intense",     h: 350, s: 50, l: 50, emoji: "🔥" },
  dreamy:      { label: "Dreamy",      h: 270, s: 40, l: 65, emoji: "✨" },
  joyful:      { label: "Joyful",      h: 45,  s: 70, l: 60, emoji: "🌻" },
  mysterious:  { label: "Mysterious",  h: 240, s: 30, l: 30, emoji: "🌙" },
};

export const REACTION_EMOJIS = ["😭","😌","😡","🤯","😴","🥰","😂","😱","🥲","🤔"] as const;
export type ReactionEmoji = typeof REACTION_EMOJIS[number];

export function applyMood(mood: MoodKey) {
  const m = MOODS[mood];
  const r = document.documentElement;
  r.style.setProperty("--mood-h", String(m.h));
  r.style.setProperty("--mood-s", `${m.s}%`);
  r.style.setProperty("--mood-l", `${m.l}%`);
}
