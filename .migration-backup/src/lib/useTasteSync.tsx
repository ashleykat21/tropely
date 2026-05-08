import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useLibrary } from "@/lib/store";

/**
 * Pushes the local "taste fingerprint" to the taste_profiles table whenever
 * the relevant local state changes. Throttled with a debounce so a quick
 * burst of edits results in a single update.
 */
export function useTasteSync() {
  const { user } = useAuth();
  const books = useLibrary((s) => s.books);
  const reactionLog = useLibrary((s) => s.reactionLog);
  const moodPreferences = useLibrary((s) => s.moodPreferences);
  const age = useLibrary((s) => s.age);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (!user) return;
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(async () => {
      // Top emojis
      const emojiCounts = new Map<string, number>();
      reactionLog.forEach((r) => emojiCounts.set(r.emoji, (emojiCounts.get(r.emoji) ?? 0) + 1));
      const topEmojis = [...emojiCounts.entries()]
        .sort((a, z) => z[1] - a[1])
        .slice(0, 6)
        .map(([e]) => e);

      // Top genres / themes
      const genreCounts = new Map<string, number>();
      books.forEach((b) =>
        (b.tags ?? []).forEach((t) => genreCounts.set(t, (genreCounts.get(t) ?? 0) + 1))
      );
      const topGenres = [...genreCounts.entries()]
        .sort((a, z) => z[1] - a[1])
        .slice(0, 8)
        .map(([g]) => g);

      // Favorite books — finished or paused with reactions
      const favoriteBooks = books
        .filter((b) => b.shelf === "finished")
        .slice(0, 8)
        .map((b) => ({ title: b.title, author: b.author, mood: b.mood, cover: b.cover ?? null }));

      const finishedTitles = books
        .filter((b) => b.shelf === "finished")
        .map((b) => b.title.toLowerCase().trim());

      const ageBand =
        age == null
          ? null
          : age < 13
          ? "kid"
          : age < 18
          ? "teen"
          : age < 25
          ? "young"
          : age < 40
          ? "adult"
          : age < 60
          ? "midlife"
          : "senior";

      const payload = {
        user_id: user.id,
        favorite_moods: moodPreferences?.favorites ?? [],
        avoid_moods: moodPreferences?.avoid ?? [],
        top_emojis: topEmojis,
        top_genres: topGenres,
        favorite_books: favoriteBooks,
        finished_titles: finishedTitles,
        pace: moodPreferences?.pace ?? null,
        age_band: ageBand,
      };

      await supabase.from("taste_profiles").upsert(payload, { onConflict: "user_id" });
    }, 1500);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [user, books, reactionLog, moodPreferences, age]);
}