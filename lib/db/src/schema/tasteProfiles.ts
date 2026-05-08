import { pgTable, text, timestamp, uuid, jsonb } from "drizzle-orm/pg-core";

export const tasteProfilesTable = pgTable("taste_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull().unique(),
  favoriteMoods: text("favorite_moods").array().notNull().default([]),
  avoidMoods: text("avoid_moods").array().notNull().default([]),
  topGenres: text("top_genres").array().notNull().default([]),
  topEmojis: text("top_emojis").array().notNull().default([]),
  finishedTitles: text("finished_titles").array().notNull().default([]),
  favoriteBooks: jsonb("favorite_books").notNull().default([]),
  ageBand: text("age_band"),
  pace: text("pace"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type TasteProfile = typeof tasteProfilesTable.$inferSelect;
