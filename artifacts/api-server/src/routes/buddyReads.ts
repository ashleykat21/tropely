import { Router } from "express";
import { db, buddyReadsTable, buddyMembersTable, buddyMessagesTable, profilesTable } from "@workspace/db";
import { eq, inArray, and } from "drizzle-orm";
import { requireAuth, errMsg, type AuthedRequest } from "../middlewares/authMiddleware";

const router = Router();

async function assertMember(roomId: string, userId: string): Promise<boolean> {
  const rows = await db
    .select({ id: buddyMembersTable.id })
    .from(buddyMembersTable)
    .where(and(eq(buddyMembersTable.buddyReadId, roomId), eq(buddyMembersTable.userId, userId)))
    .limit(1);
  return rows.length > 0;
}

function roomToApi(r: typeof buddyReadsTable.$inferSelect) {
  return {
    id: r.id,
    owner_id: r.ownerId,
    book_title: r.bookTitle,
    book_author: r.bookAuthor ?? null,
    book_cover: r.bookCover ?? null,
    total_pages: r.totalPages,
    spoiler_page: r.spoilerPage,
    chapters: r.chapters ?? null,
    created_at: r.createdAt,
  };
}

function memberToApi(m: typeof buddyMembersTable.$inferSelect) {
  return {
    id: m.id,
    buddy_read_id: m.buddyReadId,
    user_id: m.userId,
    current_page: m.currentPage,
    joined_at: m.joinedAt,
  };
}

function messageToApi(m: typeof buddyMessagesTable.$inferSelect) {
  return {
    id: m.id,
    buddy_read_id: m.buddyReadId,
    user_id: m.userId,
    content: m.content,
    page_at: m.pageAt,
    chapter: m.chapter ?? null,
    created_at: m.createdAt,
  };
}

router.get("/buddy-reads", requireAuth, async (req, res) => {
  const { userId } = req as AuthedRequest;
  try {
    const myMemberships = await db.select().from(buddyMembersTable).where(eq(buddyMembersTable.userId, userId));
    const ownedRooms = await db.select().from(buddyReadsTable).where(eq(buddyReadsTable.ownerId, userId));
    const memberRoomIds = myMemberships.map((m) => m.buddyReadId);
    const ownedRoomIds = ownedRooms.map((r) => r.id);
    const allIds = [...new Set([...memberRoomIds, ...ownedRoomIds])];
    if (!allIds.length) { res.json({ rooms: [], members: [], profiles: {} }); return; }

    const rooms = await db.select().from(buddyReadsTable).where(inArray(buddyReadsTable.id, allIds));
    const allMembers = await db.select().from(buddyMembersTable).where(inArray(buddyMembersTable.buddyReadId, allIds));
    const userIds = [...new Set(allMembers.map((m) => m.userId))];
    let profiles: Record<string, string> = {};
    if (userIds.length) {
      const ps = await db.select().from(profilesTable).where(inArray(profilesTable.userId, userIds));
      profiles = Object.fromEntries(ps.map((p) => [p.userId, p.displayName ?? "Reader"]));
    }
    res.json({ rooms: rooms.map(roomToApi), members: allMembers.map(memberToApi), profiles });
  } catch (e: unknown) {
    res.status(500).json({ error: errMsg(e) });
  }
});

router.post("/buddy-reads", requireAuth, async (req, res) => {
  const { userId } = req as AuthedRequest;
  try {
    const { book_title, book_author, book_cover, total_pages, spoiler_page, chapters } = req.body as {
      book_title: string;
      book_author?: string;
      book_cover?: string;
      total_pages?: number;
      spoiler_page?: number;
      chapters?: { label: string; page: number }[];
    };
    const [room] = await db
      .insert(buddyReadsTable)
      .values({
        ownerId: userId,
        bookTitle: book_title,
        bookAuthor: book_author ?? null,
        bookCover: book_cover ?? null,
        totalPages: total_pages ?? 300,
        spoilerPage: spoiler_page ?? 0,
        chapters: chapters ?? null,
      })
      .returning();
    await db
      .insert(buddyMembersTable)
      .values({ buddyReadId: room.id, userId, currentPage: 0 })
      .onConflictDoNothing();
    res.json(roomToApi(room));
  } catch (e: unknown) {
    res.status(500).json({ error: errMsg(e) });
  }
});

router.post("/buddy-reads/:id/join", requireAuth, async (req, res) => {
  const { userId } = req as AuthedRequest;
  try {
    const id = req.params.id as string;
    const roomExists = await db
      .select({ id: buddyReadsTable.id })
      .from(buddyReadsTable)
      .where(eq(buddyReadsTable.id, id))
      .limit(1);
    if (!roomExists.length) { res.status(404).json({ error: "Room not found" }); return; }
    await db
      .insert(buddyMembersTable)
      .values({ buddyReadId: id, userId, currentPage: 0 })
      .onConflictDoNothing();
    res.json({ ok: true });
  } catch (e: unknown) {
    res.status(500).json({ error: errMsg(e) });
  }
});

router.patch("/buddy-reads/:roomId/members/:memberId", requireAuth, async (req, res) => {
  const { userId } = req as AuthedRequest;
  try {
    const memberId = req.params.memberId as string;
    const { currentPage } = req.body as { currentPage?: number };
    const [updated] = await db
      .update(buddyMembersTable)
      .set({ currentPage: currentPage ?? 0 })
      .where(and(eq(buddyMembersTable.id, memberId), eq(buddyMembersTable.userId, userId)))
      .returning();
    if (!updated) { res.status(403).json({ error: "Forbidden" }); return; }
    res.json(memberToApi(updated));
  } catch (e: unknown) {
    res.status(500).json({ error: errMsg(e) });
  }
});

router.get("/buddy-reads/:id/messages", requireAuth, async (req, res) => {
  const { userId } = req as AuthedRequest;
  try {
    const id = req.params.id as string;
    if (!(await assertMember(id, userId))) { res.status(403).json({ error: "Forbidden" }); return; }
    const messages = await db.select().from(buddyMessagesTable).where(eq(buddyMessagesTable.buddyReadId, id));
    res.json(messages.map(messageToApi));
  } catch (e: unknown) {
    res.status(500).json({ error: errMsg(e) });
  }
});

router.delete("/buddy-reads/:id", requireAuth, async (req, res) => {
  const { userId } = req as AuthedRequest;
  try {
    const id = req.params.id as string;
    const [room] = await db.select().from(buddyReadsTable).where(eq(buddyReadsTable.id, id)).limit(1);
    if (!room) { res.status(404).json({ error: "Room not found" }); return; }
    if (room.ownerId !== userId) { res.status(403).json({ error: "Only the owner can delete a room" }); return; }
    await db.delete(buddyMessagesTable).where(eq(buddyMessagesTable.buddyReadId, id));
    await db.delete(buddyMembersTable).where(eq(buddyMembersTable.buddyReadId, id));
    await db.delete(buddyReadsTable).where(eq(buddyReadsTable.id, id));
    res.json({ ok: true });
  } catch (e: unknown) {
    res.status(500).json({ error: errMsg(e) });
  }
});

router.post("/buddy-reads/:id/messages", requireAuth, async (req, res) => {
  const { userId } = req as AuthedRequest;
  try {
    const id = req.params.id as string;
    if (!(await assertMember(id, userId))) { res.status(403).json({ error: "Forbidden" }); return; }
    const { content, pageAt, chapter } = req.body as { content: string; pageAt?: number; chapter?: number | null };
    const [msg] = await db
      .insert(buddyMessagesTable)
      .values({ buddyReadId: id, userId, content, pageAt: pageAt ?? 0, chapter: chapter ?? null })
      .returning();
    res.json(messageToApi(msg));
  } catch (e: unknown) {
    res.status(500).json({ error: errMsg(e) });
  }
});

export default router;
