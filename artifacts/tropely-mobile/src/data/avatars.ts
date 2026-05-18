export type AvatarCategoryNew = "female" | "male" | "non_avatar";

export interface AvatarEntry {
  id: string;
  name: string;
  category: AvatarCategoryNew;
  emoji: string;
  backgroundColor: string;
}

export const FEMALE_AVATARS: AvatarEntry[] = [
  { id: "cozy_romance_reader",    name: "Cozy Romance Reader",    category: "female",     emoji: "🌸", backgroundColor: "#fde8e8" },
  { id: "fantasy_reader_f",       name: "Fantasy Reader",         category: "female",     emoji: "🌿", backgroundColor: "#e8f5e9" },
  { id: "audiobook_listener_f",   name: "Audiobook Listener",     category: "female",     emoji: "🎧", backgroundColor: "#f3e8fd" },
  { id: "soft_librarian",         name: "Soft Librarian",         category: "female",     emoji: "📚", backgroundColor: "#fef9e8" },
  { id: "chaotic_book_bestie",    name: "Chaotic Book Bestie",    category: "female",     emoji: "⭐", backgroundColor: "#fde8f5" },
  { id: "mystery_reader_f",       name: "Mystery Reader",         category: "female",     emoji: "🔍", backgroundColor: "#e8f0fd" },
  { id: "cottagecore_reader",     name: "Cottagecore Reader",     category: "female",     emoji: "🌼", backgroundColor: "#f5fde8" },
  { id: "night_reader_f",         name: "Night Reader",           category: "female",     emoji: "🌙", backgroundColor: "#e8eafd" },
];

export const MALE_AVATARS: AvatarEntry[] = [
  { id: "cozy_reader_m",          name: "Cozy Reader",            category: "male",       emoji: "☕", backgroundColor: "#fde8d8" },
  { id: "fantasy_reader_m",       name: "Fantasy Reader",         category: "male",       emoji: "⚔️", backgroundColor: "#e8f5e9" },
  { id: "dark_academia_reader",   name: "Dark Academia Reader",   category: "male",       emoji: "🕯️", backgroundColor: "#f0ede8" },
  { id: "audiobook_listener_m",   name: "Audiobook Listener",     category: "male",       emoji: "🎧", backgroundColor: "#e8eafd" },
  { id: "coffee_shop_reader",     name: "Coffee Shop Reader",     category: "male",       emoji: "☕", backgroundColor: "#fdf5e8" },
  { id: "mystery_reader_m",       name: "Mystery Reader",         category: "male",       emoji: "🔍", backgroundColor: "#e8f0fd" },
  { id: "night_reader_m",         name: "Night Reader",           category: "male",       emoji: "🌙", backgroundColor: "#e8eafd" },
  { id: "book_dragon",            name: "Book Dragon Companion",  category: "male",       emoji: "🐉", backgroundColor: "#fde8f5" },
];

export const NON_AVATAR_ICONS: AvatarEntry[] = [
  { id: "teacup",       name: "Teacup",           category: "non_avatar", emoji: "🍵", backgroundColor: "#fde8e8" },
  { id: "stack_of_books", name: "Stack of Books", category: "non_avatar", emoji: "📚", backgroundColor: "#e8f0fd" },
  { id: "open_book",    name: "Open Book",        category: "non_avatar", emoji: "📖", backgroundColor: "#fef9e8" },
  { id: "crescent_moon", name: "Crescent Moon",   category: "non_avatar", emoji: "🌙", backgroundColor: "#e8eafd" },
  { id: "candle",       name: "Candle",            category: "non_avatar", emoji: "🕯️", backgroundColor: "#fdf5e8" },
  { id: "crystal",      name: "Crystal",           category: "non_avatar", emoji: "💎", backgroundColor: "#f3e8fd" },
  { id: "camera",       name: "Camera",            category: "non_avatar", emoji: "📷", backgroundColor: "#fde8f5" },
  { id: "typewriter",   name: "Typewriter",        category: "non_avatar", emoji: "⌨️", backgroundColor: "#f0ede8" },
  { id: "plant",        name: "Plant",             category: "non_avatar", emoji: "🌱", backgroundColor: "#e8f5e9" },
  { id: "cloud",        name: "Cloud",             category: "non_avatar", emoji: "☁️", backgroundColor: "#e8f0fd" },
  { id: "lantern",      name: "Lantern",           category: "non_avatar", emoji: "🏮", backgroundColor: "#fde8d8" },
];

export const ALL_AVATARS: AvatarEntry[] = [...FEMALE_AVATARS, ...MALE_AVATARS, ...NON_AVATAR_ICONS];

// Mapping from old theme.ts IDs to new IDs (for backward compat)
const LEGACY_ID_MAP: Record<string, string> = {
  f_cozy_romance:   "cozy_romance_reader",
  f_fantasy:        "fantasy_reader_f",
  f_audiobook:      "audiobook_listener_f",
  f_librarian:      "soft_librarian",
  f_chaotic:        "chaotic_book_bestie",
  f_mystery:        "mystery_reader_f",
  f_cottagecore:    "cottagecore_reader",
  f_night:          "night_reader_f",
  m_cozy:           "cozy_reader_m",
  m_fantasy:        "fantasy_reader_m",
  m_dark_academia:  "dark_academia_reader",
  m_audiobook:      "audiobook_listener_m",
  m_coffee:         "coffee_shop_reader",
  m_mystery:        "mystery_reader_m",
  m_night:          "night_reader_m",
  m_dragon:         "book_dragon",
  i_teacup:         "teacup",
  i_books:          "stack_of_books",
  i_open_book:      "open_book",
  i_moon:           "crescent_moon",
  i_candle:         "candle",
  i_crystal:        "crystal",
  i_camera:         "camera",
  i_typewriter:     "typewriter",
  i_plant:          "plant",
  i_cloud:          "cloud",
  i_lantern:        "lantern",
};

export function getAvatarById(id: string): AvatarEntry {
  const resolvedId = LEGACY_ID_MAP[id] ?? id;
  return ALL_AVATARS.find((a) => a.id === resolvedId) ?? FEMALE_AVATARS[0];
}

export function getAvatarsByCategory(category: AvatarCategoryNew): AvatarEntry[] {
  if (category === "female") return FEMALE_AVATARS;
  if (category === "male") return MALE_AVATARS;
  return NON_AVATAR_ICONS;
}

// Map store's "icons" category to new "non_avatar" category and back
export function storeToNewCategory(storeCategory: string): AvatarCategoryNew {
  if (storeCategory === "icons") return "non_avatar";
  return storeCategory as AvatarCategoryNew;
}

export function newToStoreCategory(newCategory: AvatarCategoryNew): "female" | "male" | "icons" {
  if (newCategory === "non_avatar") return "icons";
  return newCategory;
}
