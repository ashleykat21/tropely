import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const blockedUsersTable = pgTable("blocked_users", {
  id: uuid("id").primaryKey().defaultRandom(),
  blockerId: text("blocker_id").notNull(),
  blockedId: text("blocked_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type BlockedUser = typeof blockedUsersTable.$inferSelect;
