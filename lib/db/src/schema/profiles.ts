import { boolean, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const profilesTable = pgTable("profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull().unique(),
  displayName: text("display_name"),
  bio: text("bio"),
  avatarUrl: text("avatar_url"),
  moodSignature: text("mood_signature"),
  auth: text("auth"),
  familyAccount: boolean("family_account").notNull().default(false),
  isUnder16: boolean("is_under_16").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Profile = typeof profilesTable.$inferSelect;
