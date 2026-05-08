import { pgTable, text, timestamp, uuid, integer } from "drizzle-orm/pg-core";

export const readingPositionsTable = pgTable("reading_positions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  bookKey: text("book_key").notNull(),
  bookTitle: text("book_title").notNull(),
  page: integer("page").notNull().default(0),
  totalPages: integer("total_pages"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type ReadingPosition = typeof readingPositionsTable.$inferSelect;
