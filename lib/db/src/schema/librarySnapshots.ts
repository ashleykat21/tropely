import { pgTable, text, timestamp, uuid, integer, jsonb, index } from "drizzle-orm/pg-core";

export const librarySnapshotsTable = pgTable("library_snapshots", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull().unique(),
  data: jsonb("data").notNull().default({}),
  revision: integer("revision").notNull().default(0),
  deviceLabel: text("device_label"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type LibrarySnapshot = typeof librarySnapshotsTable.$inferSelect;

export const librarySnapshotHistoryTable = pgTable(
  "library_snapshot_history",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull(),
    data: jsonb("data").notNull(),
    deviceLabel: text("device_label"),
    revision: integer("revision"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("library_snapshot_history_user_idx").on(t.userId)]
);

export type LibrarySnapshotHistory = typeof librarySnapshotHistoryTable.$inferSelect;
