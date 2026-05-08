import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const companionMessagesTable = pgTable("companion_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  bookKey: text("book_key").notNull(),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type CompanionMessage = typeof companionMessagesTable.$inferSelect;
