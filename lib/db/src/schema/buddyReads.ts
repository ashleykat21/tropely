import { pgTable, text, timestamp, uuid, integer, jsonb } from "drizzle-orm/pg-core";

export const buddyReadsTable = pgTable("buddy_reads", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerId: text("owner_id").notNull(),
  bookTitle: text("book_title").notNull(),
  bookAuthor: text("book_author"),
  bookCover: text("book_cover"),
  totalPages: integer("total_pages").notNull().default(0),
  spoilerPage: integer("spoiler_page").notNull().default(0),
  chapters: jsonb("chapters").notNull().default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type BuddyRead = typeof buddyReadsTable.$inferSelect;
