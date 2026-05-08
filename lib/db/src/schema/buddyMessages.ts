import { pgTable, text, timestamp, uuid, integer } from "drizzle-orm/pg-core";

export const buddyMessagesTable = pgTable("buddy_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  buddyReadId: uuid("buddy_read_id").notNull(),
  userId: text("user_id").notNull(),
  content: text("content").notNull(),
  pageAt: integer("page_at").notNull().default(0),
  chapter: integer("chapter"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type BuddyMessage = typeof buddyMessagesTable.$inferSelect;
