import { pgTable, text, timestamp, uuid, uniqueIndex } from "drizzle-orm/pg-core";
import { isNotNull } from "drizzle-orm";

export const notificationsTable = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull(),
    kind: text("kind").notNull(),
    body: text("body"),
    actorId: text("actor_id"),
    refId: text("ref_id"),
    readAt: timestamp("read_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    userKindRefUniq: uniqueIndex("notifications_user_kind_ref_uniq")
      .on(t.userId, t.kind, t.refId)
      .where(isNotNull(t.refId)),
  }),
);

export type Notification = typeof notificationsTable.$inferSelect;
