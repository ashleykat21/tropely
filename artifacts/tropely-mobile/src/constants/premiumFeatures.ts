export const PREMIUM_FEATURES = {
  CHARACTER_CHAT: "character_chat",
  MULTI_BOOK_COMPANION: "multi_book_companion",
  UNLIMITED_BUDDY_ROOMS: "unlimited_buddy_rooms",
  CHAPTER_LOCKED_CHAT: "chapter_locked_chat",
  ADVANCED_INSIGHTS: "advanced_insights",
  UNLIMITED_HIGHLIGHTS: "unlimited_highlights",
  EXPORT_JOURNAL: "export_journal",
  MOOD_GRADIENT: "mood_gradient",
  CUSTOM_TROPES: "custom_tropes",
} as const;

export const FREE_LIMITS = {
  BUDDY_ROOMS: 2,
  HIGHLIGHTS: 10,
  COMPANION_BOOKS: 1,
} as const;
