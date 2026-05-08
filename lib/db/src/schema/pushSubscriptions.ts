import { pgTable, text, integer, timestamp, uuid, boolean, uniqueIndex } from "drizzle-orm/pg-core";

export const pushSubscriptionsTable = pgTable(
  "push_subscriptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull(),
    endpoint: text("endpoint").notNull(),
    p256dh: text("p256dh").notNull(),
    auth: text("auth").notNull(),
    enabled: boolean("enabled").notNull().default(true),
    reminderHour: integer("reminder_hour"),
    reminderLabel: text("reminder_label"),
    timezoneOffset: integer("timezone_offset"),
    lastSentAt: timestamp("last_sent_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    endpointIdx: uniqueIndex("push_subscriptions_endpoint_idx").on(t.endpoint),
  }),
);

export type PushSubscriptionRow = typeof pushSubscriptionsTable.$inferSelect;
