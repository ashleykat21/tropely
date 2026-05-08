import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const feedbackTable = pgTable("feedback", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id"),
  message: text("message").notNull(),
  email: text("email"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Feedback = typeof feedbackTable.$inferSelect;
