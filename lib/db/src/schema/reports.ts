import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const reportsTable = pgTable("reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  reporterId: text("reporter_id").notNull(),
  reportedUserId: text("reported_user_id"),
  contentType: text("content_type").notNull(),
  contentId: text("content_id"),
  reason: text("reason").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Report = typeof reportsTable.$inferSelect;
