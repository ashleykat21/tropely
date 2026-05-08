import { pgTable, text, timestamp, integer, uuid, uniqueIndex } from "drizzle-orm/pg-core";

export const companionSummariesTable = pgTable(
  "companion_summaries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull(),
    bookKey: text("book_key").notNull(),
    summary: text("summary").notNull().default(""),
    manualSummary: text("manual_summary"),
    pinnedFacts: text("pinned_facts").array(),
    uptoPage: integer("upto_page"),
    messageCount: integer("message_count").notNull().default(0),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    userBookUnique: uniqueIndex("companion_summaries_user_book_unique").on(t.userId, t.bookKey),
  })
);

export type CompanionSummary = typeof companionSummariesTable.$inferSelect;
