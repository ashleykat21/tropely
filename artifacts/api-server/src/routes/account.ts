import { Router } from "express";
import { clerkClient } from "@clerk/express";
import { db } from "@workspace/db";
import {
  profilesTable,
  activityTable,
  followsTable,
  blockedUsersTable,
  reportsTable,
  companionMessagesTable,
  companionSummariesTable,
  buddyMembersTable,
  buddyMessagesTable,
  readingPositionsTable,
  notificationsTable,
  tasteProfilesTable,
  feedbackTable,
  pushSubscriptionsTable,
  syncedDevicesTable,
  librarySnapshotsTable,
  librarySnapshotHistoryTable,
} from "@workspace/db";
import { eq, or } from "drizzle-orm";
import { requireAuth, errMsg, type AuthedRequest } from "../middlewares/authMiddleware";

const router = Router();

router.delete("/account/me", requireAuth, async (req, res) => {
  const { userId } = req as AuthedRequest;
  try {
    await db.delete(companionMessagesTable).where(eq(companionMessagesTable.userId, userId));
    await db.delete(companionSummariesTable).where(eq(companionSummariesTable.userId, userId));
    await db.delete(buddyMessagesTable).where(eq(buddyMessagesTable.userId, userId));
    await db.delete(buddyMembersTable).where(eq(buddyMembersTable.userId, userId));
    await db.delete(readingPositionsTable).where(eq(readingPositionsTable.userId, userId));
    await db.delete(notificationsTable).where(eq(notificationsTable.userId, userId));
    await db.delete(pushSubscriptionsTable).where(eq(pushSubscriptionsTable.userId, userId));
    await db.delete(syncedDevicesTable).where(eq(syncedDevicesTable.userId, userId));
    await db.delete(librarySnapshotHistoryTable).where(eq(librarySnapshotHistoryTable.userId, userId));
    await db.delete(librarySnapshotsTable).where(eq(librarySnapshotsTable.userId, userId));
    await db.delete(tasteProfilesTable).where(eq(tasteProfilesTable.userId, userId));
    await db.delete(activityTable).where(eq(activityTable.userId, userId));
    await db.delete(reportsTable).where(eq(reportsTable.reporterId, userId));
    await db.delete(blockedUsersTable).where(
      or(eq(blockedUsersTable.blockerId, userId), eq(blockedUsersTable.blockedId, userId))
    );
    await db.delete(followsTable).where(
      or(eq(followsTable.followerId, userId), eq(followsTable.followingId, userId))
    );
    await db.delete(feedbackTable).where(eq(feedbackTable.userId, userId));
    await db.delete(profilesTable).where(eq(profilesTable.userId, userId));

    await clerkClient.users.deleteUser(userId);

    res.json({ deleted: true });
  } catch (e: unknown) {
    res.status(500).json({ error: errMsg(e) });
  }
});

export default router;
