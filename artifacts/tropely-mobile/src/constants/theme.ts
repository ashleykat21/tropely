export const COLORS = {
  bg: "#fafaf9",
  gradPrimary: ["#f9e8f4", "#ede4f7", "#e4ecf9"] as const,
  gradRomantic: ["#fce4ec", "#f8bbd0", "#e1bee7"] as const,
  gradCalm: ["#e3f2fd", "#e8eaf6", "#f3e5f5"] as const,
  gradMystery: ["#ede7f6", "#e8eaf6", "#fce4ec"] as const,
  gradDark: ["#2d1b3d", "#1a1035", "#0d0820"] as const,
  gradFantasy: ["#e8f5e9", "#e3f2fd", "#f3e5f5"] as const,
  card: "rgba(255,255,255,0.75)",
  cardBorder: "rgba(255,255,255,0.6)",
  ink: "#1a1a1a",
  inkMid: "#4a4a5a",
  inkSoft: "#9ca3af",
  pink: "#f472b6",
  lavender: "#a78bfa",
  peach: "#fb923c",
  gold: "#fbbf24",
  mint: "#34d399",
  rose: "#f43f5e",
};

export type MoodKey = "cozy" | "calm" | "intense" | "melancholy" | "dreamy" | "joyful" | "mysterious";

export const MOOD_GRADIENTS: Record<MoodKey, readonly [string, string, string]> = {
  cozy:       ["#fdf6ec", "#f9e4cc", "#f5d9b8"],
  calm:       ["#e8f4fd", "#dbeafe", "#e0e7ff"],
  intense:    ["#fdf2f8", "#fce7f3", "#fee2e2"],
  melancholy: ["#eff0f7", "#e0e7ff", "#ddd6fe"],
  dreamy:     ["#f5f0ff", "#ede9fe", "#fce4ec"],
  joyful:     ["#fffbeb", "#fef9c3", "#fef3c7"],
  mysterious: ["#1e1b2e", "#2d1b3d", "#3d2352"],
};

export const MOOD_INFO: Record<MoodKey, { label: string; emoji: string; headline: string }> = {
  cozy:       { label: "Cozy",       emoji: "🧸", headline: "Feeling cozy and snug" },
  calm:       { label: "Calm",       emoji: "🌊", headline: "In a calm, reflective space" },
  intense:    { label: "Intense",    emoji: "🔥", headline: "Craving something intense" },
  melancholy: { label: "Melancholy", emoji: "🌧️", headline: "In a beautifully melancholy mood" },
  dreamy:     { label: "Dreamy",     emoji: "✨", headline: "Feeling dreamy and escapist" },
  joyful:     { label: "Joyful",     emoji: "☀️", headline: "Bright, joyful and ready to read" },
  mysterious: { label: "Mysterious", emoji: "🌙", headline: "Craving something dark and intense" },
};

export const LEGACY_MOOD_BG: Record<string, string> = {
  hopeful: "#d1fae5", tense: "#fee2e2", melancholy: "#e0e7ff",
  joyful: "#fef9c3", romantic: "#fce7f3", eerie: "#f3e8ff",
  reflective: "#f0fdf4", adventurous: "#fff7ed", cozy: "#fef3c7", intense: "#fee2e2",
};

export const EMOJI_REACTIONS = [
  { emoji: "💕", label: "Romantic" },
  { emoji: "😭", label: "Emotional" },
  { emoji: "😱", label: "Shocked" },
  { emoji: "😂", label: "Funny" },
  { emoji: "🔥", label: "Intense" },
  { emoji: "🌸", label: "Cozy" },
  { emoji: "👀", label: "Suspicious" },
  { emoji: "🤯", label: "Plot twist" },
  { emoji: "🥹", label: "Soft" },
  { emoji: "💔", label: "Hurt" },
  { emoji: "😤", label: "Betrayed" },
  { emoji: "🌙", label: "Dark" },
];

export const AVATARS = {
  readers: [
    { id: "cozy_romance", emoji: "📚", label: "Cozy Romance Reader", bg: "#fce4ec" },
    { id: "fantasy_reader", emoji: "🔮", label: "Fantasy Reader", bg: "#ede7f6" },
    { id: "dark_academia", emoji: "🕯️", label: "Dark Academia", bg: "#efebe9" },
    { id: "audiobook_listener", emoji: "🎧", label: "Audiobook Listener", bg: "#e3f2fd" },
    { id: "soft_librarian", emoji: "🌸", label: "Soft Librarian", bg: "#fce4ec" },
    { id: "chaotic_bestie", emoji: "⚡", label: "Chaotic Book Bestie", bg: "#fff9c4" },
    { id: "mystery_reader", emoji: "🔍", label: "Mystery Reader", bg: "#e8f5e9" },
    { id: "cottagecore", emoji: "🌿", label: "Cottagecore Reader", bg: "#f1f8e9" },
    { id: "night_reader", emoji: "🌙", label: "Night Reader", bg: "#e8eaf6" },
    { id: "coffee_reader", emoji: "☕", label: "Coffee Shop Reader", bg: "#fff3e0" },
  ],
  icons: [
    { id: "open_book", emoji: "📖", label: "Open Book", bg: "#e3f2fd" },
    { id: "teacup", emoji: "🍵", label: "Teacup", bg: "#f1f8e9" },
    { id: "moon_book", emoji: "🌙", label: "Moon Book", bg: "#ede7f6" },
    { id: "pink_bookmark", emoji: "🔖", label: "Pink Bookmark", bg: "#fce4ec" },
    { id: "glowing_star", emoji: "⭐", label: "Glowing Star", bg: "#fffde7" },
    { id: "flower", emoji: "🌸", label: "Flower", bg: "#fce4ec" },
    { id: "candle", emoji: "🕯️", label: "Candle", bg: "#fff8e1" },
    { id: "headphones", emoji: "🎧", label: "Headphones", bg: "#e3f2fd" },
    { id: "book_stack", emoji: "📚", label: "Book Stack", bg: "#e8f5e9" },
    { id: "dragon", emoji: "🐉", label: "Tiny Dragon", bg: "#f3e5f5" },
  ],
} as const;

export type AvatarId = string;

export type AvatarEntry = { id: string; emoji: string; label: string; bg: string };

export function getAllAvatars(): AvatarEntry[] {
  return [...AVATARS.readers, ...AVATARS.icons];
}

export function getAvatarById(id: string): AvatarEntry {
  return getAllAvatars().find((a) => a.id === id) ?? AVATARS.readers[0];
}

export const GENRES = [
  "Romance", "Fantasy", "Mystery", "Thriller", "Horror",
  "Contemporary", "Historical", "Sci-fi", "Young Adult", "Manga/Graphic Novel", "Nonfiction",
];

export const TROPES_BY_GENRE: Record<string, string[]> = {
  "Romance": ["Enemies to Lovers", "Friends to Lovers", "Grumpy x Sunshine", "Fake Dating", "Slow Burn", "Forced Proximity", "Second Chance", "Forbidden Romance", "Marriage of Convenience", "One Bed", "Secret Identity", "Love Triangle", "Workplace Romance", "Small Town Romance", "Sports Romance", "Royal Romance"],
  "Fantasy": ["Chosen One", "Found Family", "Morally Gray Hero", "Magical Academy", "Hidden Powers", "Quest", "Enemies to Allies", "Dragons", "Fae", "Cursed Kingdom", "Portal Fantasy", "Lost Heir", "Ancient Prophecy", "Forbidden Magic", "Reluctant Hero"],
  "Mystery": ["Unreliable Narrator", "Missing Person", "Locked Room", "Cold Case", "Secret Past", "Small Town Secrets", "Amateur Detective", "Dark Academia", "Psychological Twist", "Detective Duo", "Hidden Identity", "Conspiracy", "Revenge Plot", "Final Girl"],
  "Thriller": ["Unreliable Narrator", "Conspiracy", "Revenge Plot", "Hidden Identity", "Psychological Twist", "Dark Academia"],
  "Horror": ["Final Girl", "Psychological Twist", "Hidden Identity", "Revenge Plot"],
  "Contemporary": ["Found Family", "Second Chance", "Slow Burn", "Small Town Romance"],
  "Historical": ["Forbidden Romance", "Second Chance", "Royal Romance", "Marriage of Convenience"],
  "Sci-fi": ["Chosen One", "Hidden Powers", "Quest", "Morally Gray Hero"],
  "Young Adult": ["Chosen One", "Found Family", "Enemies to Lovers", "Forbidden Romance", "Hidden Powers"],
  "Manga/Graphic Novel": ["Enemies to Lovers", "Slow Burn", "Found Family", "Forbidden Romance"],
  "Nonfiction": [],
};

export const READING_VIBE_RESULTS: Record<string, string> = {
  "Romance_Enemies to Lovers": "Chaotic Romantic Extremist",
  "Romance_Slow Burn": "Cozy Romantic Escapist",
  "Fantasy_Chosen One": "Epic Fantasy Adventurer",
  "Mystery_Dark Academia": "Dark Academic Detective",
  "default": "Mood-First Reader",
};

export const NAV_ICONS: Record<string, { active: string; inactive: string; label: string }> = {
  Today:      { active: "🌅", inactive: "📖", label: "Today" },
  Library:    { active: "🌙", inactive: "📚", label: "Library" },
  Discover:   { active: "⭐", inactive: "🧭", label: "Discover" },
  BuddyReads: { active: "💬", inactive: "👥", label: "Buddy Reads" },
  Me:         { active: "🌙", inactive: "🌙", label: "Me" },
};

export const CARD_STYLE = {
  backgroundColor: "rgba(255,255,255,0.75)",
  borderRadius: 20,
  borderWidth: 1,
  borderColor: "rgba(255,255,255,0.6)",
  padding: 16,
};

export const SHADOW = {
  shadowColor: "#a78bfa",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.12,
  shadowRadius: 12,
  elevation: 4,
};

export const SHELF_LABELS: Record<string, { label: string; emoji: string }> = {
  reading:  { label: "Reading",       emoji: "📖" },
  want:     { label: "Want to Read",  emoji: "💌" },
  finished: { label: "Finished",      emoji: "✅" },
  paused:   { label: "Paused",        emoji: "⏸️" },
  dnf:      { label: "DNF",           emoji: "🚫" },
};

export const MOOD_KEYS: MoodKey[] = ["cozy", "calm", "intense", "melancholy", "dreamy", "joyful", "mysterious"];

// Legacy compat
export const MOOD_COLORS: Record<string, string> = {
  hopeful: "#d1fae5", tense: "#fee2e2", melancholy: "#e0e7ff",
  joyful: "#fef9c3", romantic: "#fce7f3", eerie: "#f3e8ff",
  reflective: "#f0fdf4", adventurous: "#fff7ed", cozy: "#fef3c7", intense: "#fee2e2",
};

// ── Mood Atmospheres ──────────────────────────────────────────────────────────

export type MoodAtmosphere =
  | "cozy_romantic" | "mysterious_dark" | "fantasy_magical"
  | "emotional_heartfelt" | "dark_intense" | "light_fun"
  | "minimal_neutral" | "dark_moody_neutral" | "cottagecore_botanical" | "classic_literary";

export type BackgroundMode = "mood_adaptive" | "static" | "minimal_neutral";

export const MOOD_ATMOSPHERES: Record<MoodAtmosphere, {
  label: string;
  gradient: readonly [string, string, string];
  accentColor: string;
  glowColor: string;
  cardTint: string;
  progressColor: string;
  headlines: string[];
  emoji: string;
  isDark: boolean;
}> = {
  cozy_romantic: {
    label: "Cozy & Romantic",
    gradient: ["#fce4d0", "#f9ccd8", "#f5b8cf"] as const,
    accentColor: "#e8608a",
    glowColor: "rgba(232,96,138,0.22)",
    cardTint: "rgba(255,245,250,0.82)",
    progressColor: "#e8608a",
    headlines: ["Lost in soft pages and sweet moments", "Feeling cozy and romantic", "Warm hearts, slow nights, sweet stories"],
    emoji: "🌸",
    isDark: false,
  },
  mysterious_dark: {
    label: "Mysterious & Dark",
    gradient: ["#0d0b1a", "#12102e", "#1c1545"] as const,
    accentColor: "#9b7fe8",
    glowColor: "rgba(155,127,232,0.28)",
    cardTint: "rgba(22,18,52,0.78)",
    progressColor: "#9b7fe8",
    headlines: ["Some secrets are better read after dark", "In the mood for mystery and late nights", "The shadows hold the best stories"],
    emoji: "🌙",
    isDark: true,
  },
  fantasy_magical: {
    label: "Fantasy & Magical",
    gradient: ["#2d1660", "#4a28a0", "#6b42c8"] as const,
    accentColor: "#c084fc",
    glowColor: "rgba(192,132,252,0.28)",
    cardTint: "rgba(55,28,100,0.75)",
    progressColor: "#c084fc",
    headlines: ["Ready to escape somewhere magical", "Step into worlds beyond your imagination", "Between pages, magic lives"],
    emoji: "✨",
    isDark: true,
  },
  emotional_heartfelt: {
    label: "Emotional & Heartfelt",
    gradient: ["#c8e6f8", "#d8eefa", "#edd4f0"] as const,
    accentColor: "#5b9bd5",
    glowColor: "rgba(91,155,213,0.2)",
    cardTint: "rgba(240,248,255,0.85)",
    progressColor: "#5b9bd5",
    headlines: ["Stories that stay with you long after", "Need a story that understands you", "Reading with your whole heart"],
    emoji: "💙",
    isDark: false,
  },
  dark_intense: {
    label: "Dark & Intense",
    gradient: ["#0f0000", "#200606", "#350a0a"] as const,
    accentColor: "#dc2626",
    glowColor: "rgba(220,38,38,0.3)",
    cardTint: "rgba(30,6,6,0.82)",
    progressColor: "#dc2626",
    headlines: ["Fueled by intensity and high stakes", "In the mood for chaos and consequences", "Nothing ordinary survives tonight"],
    emoji: "⚡",
    isDark: true,
  },
  light_fun: {
    label: "Light & Fun",
    gradient: ["#fef3c7", "#fde68a", "#fdba74"] as const,
    accentColor: "#ea7c2b",
    glowColor: "rgba(234,124,43,0.22)",
    cardTint: "rgba(255,252,235,0.88)",
    progressColor: "#ea7c2b",
    headlines: ["Looking for something bright and easy", "A little fun, a little chaos, a happy escape", "Good vibes and happy endings"],
    emoji: "☀️",
    isDark: false,
  },
  minimal_neutral: {
    label: "Minimal / Neutral",
    gradient: ["#fdfaf6", "#f4ede3", "#ece3d8"] as const,
    accentColor: "#7a6855",
    glowColor: "rgba(122,104,85,0.14)",
    cardTint: "rgba(255,252,248,0.92)",
    progressColor: "#7a6855",
    headlines: ["Focus. Read. Reflect.", "Your next chapter starts here.", "A quiet space for great stories."],
    emoji: "📖",
    isDark: false,
  },
  dark_moody_neutral: {
    label: "Dark / Moody Neutral",
    gradient: ["#131815", "#1a2218", "#1f2b20"] as const,
    accentColor: "#6b9e6b",
    glowColor: "rgba(107,158,107,0.2)",
    cardTint: "rgba(22,32,22,0.82)",
    progressColor: "#6b9e6b",
    headlines: ["In the mood for something deep", "Quiet pages, darker thoughts.", "Still and serious."],
    emoji: "🌲",
    isDark: true,
  },
  cottagecore_botanical: {
    label: "Cottagecore / Botanical",
    gradient: ["#fdf7ea", "#f2e8c8", "#e8d9a0"] as const,
    accentColor: "#7a9e5a",
    glowColor: "rgba(122,158,90,0.2)",
    cardTint: "rgba(253,247,234,0.88)",
    progressColor: "#7a9e5a",
    headlines: ["A soft story for a slow afternoon", "Let's get lost in something beautiful.", "Petals between the pages."],
    emoji: "🌿",
    isDark: false,
  },
  classic_literary: {
    label: "Classic Literary",
    gradient: ["#fef4e2", "#f8e5c0", "#f0d49a"] as const,
    accentColor: "#8b5e2a",
    glowColor: "rgba(139,94,42,0.18)",
    cardTint: "rgba(254,248,234,0.9)",
    progressColor: "#8b5e2a",
    headlines: ["For the love of a well-worn page", "A quiet shelf, a good story.", "Words worth keeping."],
    emoji: "📚",
    isDark: false,
  },
};

export const DEFAULT_ATMOSPHERE: MoodAtmosphere = "cozy_romantic";

export const MOOD_ATMOSPHERE_KEYS: MoodAtmosphere[] = [
  "cozy_romantic", "mysterious_dark", "fantasy_magical",
  "emotional_heartfelt", "dark_intense", "light_fun",
];

export const ALL_ATMOSPHERE_KEYS: MoodAtmosphere[] = [
  "cozy_romantic", "mysterious_dark", "fantasy_magical", "emotional_heartfelt",
  "dark_intense", "light_fun", "minimal_neutral", "dark_moody_neutral",
  "cottagecore_botanical", "classic_literary",
];

// Helper: map a book's Mood to a MoodAtmosphere
export function moodToAtmosphere(mood: string | undefined): MoodAtmosphere {
  const map: Record<string, MoodAtmosphere> = {
    cozy: "cozy_romantic", romantic: "cozy_romantic", hopeful: "cozy_romantic",
    melancholy: "emotional_heartfelt", reflective: "emotional_heartfelt",
    eerie: "mysterious_dark", tense: "dark_intense",
    adventurous: "fantasy_magical", joyful: "light_fun", intense: "dark_intense",
    dreamy: "fantasy_magical", mysterious: "mysterious_dark", calm: "emotional_heartfelt",
  };
  return map[mood ?? ""] ?? "cozy_romantic";
}
