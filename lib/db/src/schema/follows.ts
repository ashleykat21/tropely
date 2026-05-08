import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const followsTable = pgTable("follows", {
  id: uuid("id").primaryKey().defaultRandom(),
  followerId: text("follower_id").notNull(),
  followingId: text("following_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Follow = typeof followsTable.$inferSelect;
