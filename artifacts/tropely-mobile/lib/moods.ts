import type { MoodKey } from "@/constants/colors";
import colors from "@/constants/colors";

export type { MoodKey };

export type Mood = {
  key: MoodKey;
  label: string;
  emoji: string;
  accent: string;
  bg: string;
  description: string;
};

const DESCRIPTIONS: Record<MoodKey, string> = {
  calm:       "Peaceful and serene reads",
  cozy:       "Warm and comforting stories",
  melancholy: "Bittersweet and reflective",
  intense:    "Gripping and thrilling",
  dreamy:     "Whimsical and fantastical",
  joyful:     "Uplifting and fun",
  mysterious: "Dark and enigmatic",
};

export const MOOD_KEYS: MoodKey[] = [
  "calm", "cozy", "melancholy", "intense", "dreamy", "joyful", "mysterious",
];

export const MOODS: Record<MoodKey, Mood> = Object.fromEntries(
  MOOD_KEYS.map((k) => [
    k,
    {
      key: k,
      label: colors.moods[k].label,
      emoji: colors.moods[k].emoji,
      accent: colors.moods[k].accent,
      bg: colors.moods[k].bg,
      description: DESCRIPTIONS[k],
    },
  ])
) as Record<MoodKey, Mood>;

export function getMoodColor(key: MoodKey | undefined): string {
  if (!key) return colors.dark.primary;
  return colors.moods[key]?.accent ?? colors.dark.primary;
}

export function getMoodBg(key: MoodKey | undefined): string {
  if (!key) return colors.dark.card;
  return colors.moods[key]?.bg ?? colors.dark.card;
}
