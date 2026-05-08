/**
 * Compute a compatibility score (0..100) between two taste profiles.
 * The score is a weighted blend of mood overlap, emoji overlap, genre overlap,
 * shared finished books, and pace/age proximity.
 */

export type TasteProfile = {
  user_id: string;
  favorite_moods: string[];
  avoid_moods: string[];
  top_emojis: string[];
  top_genres: string[];
  favorite_books: { title: string; author: string; mood?: string; cover?: string | null }[];
  finished_titles: string[];
  pace: string | null;
  age_band: string | null;
};

const jaccard = (a: string[], b: string[]) => {
  if (a.length === 0 || b.length === 0) return 0;
  const A = new Set(a.map((x) => x.toLowerCase()));
  const B = new Set(b.map((x) => x.toLowerCase()));
  let inter = 0;
  A.forEach((v) => B.has(v) && inter++);
  const union = A.size + B.size - inter;
  return union === 0 ? 0 : inter / union;
};

const overlapList = (a: string[], b: string[]) => {
  const A = new Set(a.map((x) => x.toLowerCase()));
  return b.filter((x) => A.has(x.toLowerCase()));
};

const AGE_ORDER = ["kid", "teen", "young", "adult", "midlife", "senior"];

export type TwinMatch = {
  user_id: string;
  score: number; // 0..100
  sharedMoods: string[];
  sharedEmojis: string[];
  sharedGenres: string[];
  sharedBooks: string[];
  paceMatch: boolean;
  ageMatch: boolean;
};

export function scoreTwins(me: TasteProfile, other: TasteProfile): TwinMatch {
  const sharedMoods = overlapList(me.favorite_moods, other.favorite_moods);
  const sharedEmojis = overlapList(me.top_emojis, other.top_emojis);
  const sharedGenres = overlapList(me.top_genres, other.top_genres);
  const sharedBooks = overlapList(me.finished_titles, other.finished_titles);

  const moodScore = jaccard(me.favorite_moods, other.favorite_moods);
  const emojiScore = jaccard(me.top_emojis, other.top_emojis);
  const genreScore = jaccard(me.top_genres, other.top_genres);
  const bookScore = me.finished_titles.length && other.finished_titles.length
    ? Math.min(1, sharedBooks.length / 3)
    : 0;

  // Penalize avoid-mood collisions: if I avoid moods they love, dock points.
  const collide = overlapList(me.avoid_moods, other.favorite_moods).length
    + overlapList(other.avoid_moods, me.favorite_moods).length;
  const collidePenalty = Math.min(0.2, collide * 0.05);

  const paceMatch = !!me.pace && !!other.pace && me.pace === other.pace;

  // Age match if both bands are within 1 step on the order.
  let ageMatch = false;
  if (me.age_band && other.age_band) {
    const i = AGE_ORDER.indexOf(me.age_band);
    const j = AGE_ORDER.indexOf(other.age_band);
    if (i >= 0 && j >= 0) ageMatch = Math.abs(i - j) <= 1;
  }

  // Weighted blend
  let raw =
    moodScore * 0.35 +
    emojiScore * 0.2 +
    genreScore * 0.25 +
    bookScore * 0.15 +
    (paceMatch ? 0.03 : 0) +
    (ageMatch ? 0.02 : 0);
  raw = Math.max(0, raw - collidePenalty);

  // Soft floor: if there's any overlap at all, score >= 30 to feel encouraging.
  const hasAnyOverlap =
    sharedMoods.length || sharedEmojis.length || sharedGenres.length || sharedBooks.length;
  let pct = Math.round(raw * 100);
  if (hasAnyOverlap && pct < 30) pct = 30 + Math.floor(Math.random() * 5);

  return {
    user_id: other.user_id,
    score: Math.min(99, Math.max(0, pct)),
    sharedMoods,
    sharedEmojis,
    sharedGenres,
    sharedBooks,
    paceMatch,
    ageMatch,
  };
}