import { Router } from "express";
import { eq, ne, inArray } from "drizzle-orm";
import { db, tasteProfilesTable, profilesTable } from "@workspace/db";
import { requireAuth, errMsg, type AuthedRequest } from "../middlewares/authMiddleware";

const router = Router();

function overlap(a: string[], b: string[]): string[] {
  const setB = new Set(b.map((x) => x.toLowerCase()));
  return a.filter((x) => setB.has(x.toLowerCase()));
}

function calcScore(
  mine: typeof tasteProfilesTable.$inferSelect,
  theirs: typeof tasteProfilesTable.$inferSelect,
): number {
  const moodScore = Math.min(overlap(mine.favoriteMoods, theirs.favoriteMoods).length / Math.max(mine.favoriteMoods.length, 1), 1) * 40;
  const genreScore = Math.min(overlap(mine.topGenres, theirs.topGenres).length / Math.max(mine.topGenres.length, 1), 1) * 30;
  const paceScore = mine.pace && theirs.pace && mine.pace === theirs.pace ? 15 : 0;
  const ageScore = mine.ageBand && theirs.ageBand && mine.ageBand === theirs.ageBand ? 15 : 0;
  return Math.round(moodScore + genreScore + paceScore + ageScore);
}

function calcProximity(
  mine: { city?: string | null; country?: string | null },
  theirs: { city?: string | null; country?: string | null },
): "city" | "country" | "worldwide" {
  const norm = (s?: string | null) => s?.toLowerCase().trim() ?? "";
  if (norm(mine.city) && norm(mine.city) === norm(theirs.city)) return "city";
  if (norm(mine.country) && norm(mine.country) === norm(theirs.country)) return "country";
  return "worldwide";
}

router.get("/reading-twins", requireAuth, async (req, res) => {
  const { userId } = req as AuthedRequest;
  try {
    const [myTaste] = await db.select().from(tasteProfilesTable).where(eq(tasteProfilesTable.userId, userId)).limit(1);
    const [myProfile] = await db
      .select({ city: profilesTable.city, country: profilesTable.country })
      .from(profilesTable)
      .where(eq(profilesTable.userId, userId))
      .limit(1);

    if (!myTaste || myTaste.favoriteMoods.length === 0) { res.json([]); return; }

    const allTastes = await db.select().from(tasteProfilesTable).where(ne(tasteProfilesTable.userId, userId));
    if (!allTastes.length) { res.json([]); return; }

    const profiles = await db
      .select({ userId: profilesTable.userId, displayName: profilesTable.displayName, city: profilesTable.city, country: profilesTable.country })
      .from(profilesTable)
      .where(inArray(profilesTable.userId, allTastes.map((t) => t.userId)));

    const profileMap = new Map(profiles.map((p) => [p.userId, p]));

    const results = allTastes
      .map((t) => {
        const prof = profileMap.get(t.userId);
        return {
          userId: t.userId,
          displayName: prof?.displayName ?? null,
          city: prof?.city ?? null,
          country: prof?.country ?? null,
          score: calcScore(myTaste, t),
          sharedMoods: overlap(myTaste.favoriteMoods, t.favoriteMoods),
          sharedGenres: overlap(myTaste.topGenres, t.topGenres),
          proximity: calcProximity(myProfile ?? {}, prof ?? {}),
        };
      })
      .filter((r) => r.score >= 25)
      .sort((a, b) => {
        const ord = { city: 0, country: 1, worldwide: 2 };
        if (ord[a.proximity] !== ord[b.proximity]) return ord[a.proximity] - ord[b.proximity];
        return b.score - a.score;
      })
      .slice(0, 20);

    res.json(results);
  } catch (e: unknown) {
    res.status(500).json({ error: errMsg(e) });
  }
});

export default router;
