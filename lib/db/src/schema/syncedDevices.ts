import { pgTable, text, timestamp, uuid, uniqueIndex } from "drizzle-orm/pg-core";

export const syncedDevicesTable = pgTable(
  "synced_devices",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull(),
    deviceId: text("device_id").notNull(),
    label: text("label"),
    userAgent: text("user_agent"),
    lastSeenAt: timestamp("last_seen_at").notNull().defaultNow(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("synced_devices_user_device_idx").on(t.userId, t.deviceId)]
);

export type SyncedDevice = typeof syncedDevicesTable.$inferSelect;
