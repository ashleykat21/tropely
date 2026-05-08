import { pgTable, text, timestamp, uuid, integer } from "drizzle-orm/pg-core";

export const buddyMembersTable = pgTable("buddy_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  buddyReadId: uuid("buddy_read_id").notNull(),
  userId: text("user_id").notNull(),
  currentPage: integer("current_page").notNull().default(0),
  joinedAt: timestamp("joined_at").notNull().defaultNow(),
});

export type BuddyMember = typeof buddyMembersTable.$inferSelect;
