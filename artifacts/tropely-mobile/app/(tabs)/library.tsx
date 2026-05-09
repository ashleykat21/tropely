import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { MOODS } from "@/lib/moods";
import { useStore, type Book, type Reflection } from "@/lib/store";

const TAB_BAR_HEIGHT = 84;
type SortKey = "recent" | "az" | "pages" | "rating";

// ─── Star row ────────────────────────────────────────────────────────────────
function StarRow({ rating }: { rating?: number }) {
  if (!rating) return null;
  return (
    <View style={{ flexDirection: "row", gap: 2, marginTop: 5 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Text key={n} style={{ fontSize: 12, color: n <= rating ? "#F4A628" : "#cccccc44" }}>★</Text>
      ))}
    </View>
  );
}

// ─── Book card ───────────────────────────────────────────────────────────────
function BookCard({ book, reflection, onPress }: {
  book: Book;
  reflection?: Reflection;
  onPress: () => void;
}) {
  const colors = useColors();
  const accent = book.mood ? MOODS[book.mood].accent : colors.primary;
  const pct = book.pages && book.pages > 0 ? Math.min(book.progress / book.pages, 1) : 0;

  return (
    <Pressable
      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress(); }}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.85 : 1 },
      ]}
    >
      <View style={[styles.cover, { backgroundColor: accent + "18" }]}>
        {book.cover
          ? <Image source={{ uri: book.cover }} style={styles.coverImg} resizeMode="cover" />
          : <Text style={{ fontSize: 22 }}>📚</Text>}
      </View>

      <View style={styles.info}>
        <Text style={[styles.cardTitle, { color: colors.foreground }]} numberOfLines={2}>{book.title}</Text>
        <Text style={[styles.cardAuthor, { color: colors.mutedForeground }]} numberOfLines={1}>{book.author}</Text>

        <View style={{ flexDirection: "row", gap: 6, marginTop: 5, alignItems: "center", flexWrap: "wrap" }}>
          {book.mood && (
            <View style={[styles.chip, { backgroundColor: accent + "18", borderColor: accent + "40" }]}>
              <Text style={{ fontSize: 10 }}>{MOODS[book.mood].emoji}</Text>
              <Text style={[styles.chipTxt, { color: accent }]}>{MOODS[book.mood].label}</Text>
            </View>
          )}
          {book.pages ? (
            <Text style={[styles.pageTxt, { color: colors.mutedForeground }]}>
              {book.shelf === "finished"
                ? `${book.pages} pp`
                : book.progress > 0
                ? `p. ${book.progress} / ${book.pages}`
                : `${book.pages} pp`}
            </Text>
          ) : null}
        </View>

        {book.shelf === "reading" && book.pages && book.pages > 0 && (
          <View style={[styles.track, { backgroundColor: colors.muted, marginTop: 7 }]}>
            <View style={[styles.fill, { width: `${pct * 100}%` as any, backgroundColor: accent }]} />
          </View>
        )}

        {book.shelf === "finished" && (
          <StarRow rating={reflection?.rating ?? book.rating} />
        )}
      </View>

      <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
    </Pressable>
  );
}

// ─── Sort bar ────────────────────────────────────────────────────────────────
function SortBar({ value, onChange, includeRating }: {
  value: SortKey;
  onChange: (k: SortKey) => void;
  includeRating?: boolean;
}) {
  const colors = useColors();
  const opts: { key: SortKey; label: string }[] = [
    { key: "recent", label: "Recent" },
    { key: "az", label: "A → Z" },
    { key: "pages", label: "Pages" },
    ...(includeRating ? [{ key: "rating" as SortKey, label: "⭐ Rating" }] : []),
  ];
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 7, paddingHorizontal: 16, paddingVertical: 10 }}
    >
      {opts.map((o) => (
        <TouchableOpacity
          key={o.key}
          onPress={() => onChange(o.key)}
          style={{
            paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
            backgroundColor: value === o.key ? colors.primary : colors.card,
            borderWidth: 1, borderColor: value === o.key ? colors.primary : colors.border,
          }}
        >
          <Text style={{
            fontSize: 12, fontFamily: "Inter_500Medium",
            color: value === o.key ? "#fff" : colors.mutedForeground,
          }}>
            {o.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

// ─── Section header ──────────────────────────────────────────────────────────
function SectionHeader({ label, count, foreground, muted }: {
  label: string; count: number; foreground: string; muted: string;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionLabel, { color: foreground }]}>{label}</Text>
      <Text style={[styles.sectionCount, { color: muted }]}>
        {count} {count === 1 ? "book" : "books"}
      </Text>
    </View>
  );
}

// ─── Sort helper ─────────────────────────────────────────────────────────────
function sortBooks(books: Book[], sort: SortKey, reflections: Reflection[]): Book[] {
  return [...books].sort((a, b) => {
    if (sort === "az") return a.title.localeCompare(b.title);
    if (sort === "pages") return (b.pages ?? 0) - (a.pages ?? 0);
    if (sort === "rating") {
      const ra = reflections.find((r) => r.bookId === a.id)?.rating ?? a.rating ?? 0;
      const rb = reflections.find((r) => r.bookId === b.id)?.rating ?? b.rating ?? 0;
      return rb - ra;
    }
    return b.addedAt - a.addedAt;
  });
}

// ─── Main screen ─────────────────────────────────────────────────────────────
export default function LibraryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const books       = useStore((s) => s.books);
  const reflections = useStore((s) => s.reflections);

  const want     = books.filter((b) => b.shelf === "want");
  const finished = books.filter((b) => b.shelf === "finished");
  const paused   = books.filter((b) => b.shelf === "paused");

  const [sortBy, setSortBy] = useState<SortKey>("recent");

  const sortedWant     = useMemo(() => sortBooks(want,     sortBy, reflections), [want,     sortBy, reflections]);
  const sortedFinished = useMemo(() => sortBooks(finished, sortBy, reflections), [finished, sortBy, reflections]);
  const sortedPaused   = useMemo(() => sortBooks(paused,   sortBy, reflections), [paused,   sortBy, reflections]);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* ── Header ── */}
      <View style={[styles.header, {
        paddingTop: Platform.OS === "web" ? 67 : insets.top + 12,
        backgroundColor: colors.background,
        borderBottomColor: colors.border,
      }]}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>My Library</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            {books.length} {books.length === 1 ? "book" : "books"} collected
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.headerBtn, { borderColor: colors.border, backgroundColor: colors.card }]}
          onPress={() => router.push("/buddy-reads")}
        >
          <Feather name="users" size={16} color={colors.foreground} />
        </TouchableOpacity>
      </View>

      {/* ── Sort bar ── */}
      <SortBar value={sortBy} onChange={setSortBy} includeRating={finished.length > 0} />

      {/* ── Book list ── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: (Platform.OS === "web" ? 34 : insets.bottom) + TAB_BAR_HEIGHT + 24,
        }}
      >
        {sortedWant.length > 0 && (
          <View>
            <SectionHeader label="📚 Want to Read" count={sortedWant.length} foreground={colors.foreground} muted={colors.mutedForeground} />
            {sortedWant.map((b) => (
              <BookCard key={b.id} book={b} onPress={() => router.push(`/book/${b.id}`)} />
            ))}
          </View>
        )}

        {sortedFinished.length > 0 && (
          <View>
            <SectionHeader label="✅ Finished" count={sortedFinished.length} foreground={colors.foreground} muted={colors.mutedForeground} />
            {sortedFinished.map((b) => (
              <BookCard
                key={b.id}
                book={b}
                reflection={reflections.find((r) => r.bookId === b.id)}
                onPress={() => router.push(`/book/${b.id}`)}
              />
            ))}
          </View>
        )}

        {sortedPaused.length > 0 && (
          <View>
            <SectionHeader label="⏸ Paused" count={sortedPaused.length} foreground={colors.foreground} muted={colors.mutedForeground} />
            {sortedPaused.map((b) => (
              <BookCard key={b.id} book={b} onPress={() => router.push(`/book/${b.id}`)} />
            ))}
          </View>
        )}

        {books.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={{ fontSize: 52, marginBottom: 16 }}>📚</Text>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Your shelves await</Text>
            <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
              Find your next read in Discover and it'll appear here.
            </Text>
            <TouchableOpacity
              style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
              onPress={() => router.push("/discover")}
            >
              <Text style={styles.emptyBtnTxt}>Discover Books</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  header: {
    paddingHorizontal: 16, paddingBottom: 4,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 26, fontFamily: "Inter_700Bold" },
  headerSub:   { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  headerBtn: {
    width: 40, height: 40, borderRadius: 20, borderWidth: 1,
    alignItems: "center", justifyContent: "center",
  },

  sectionHeader: {
    paddingHorizontal: 16, paddingTop: 18, paddingBottom: 6,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
  },
  sectionLabel: { fontSize: 15, fontFamily: "Inter_700Bold" },
  sectionCount: { fontSize: 12, fontFamily: "Inter_400Regular" },

  card: {
    flexDirection: "row", alignItems: "center", gap: 12,
    marginHorizontal: 16, marginBottom: 8, padding: 12,
    borderRadius: 14, borderWidth: 1,
  },
  cover: {
    width: 48, height: 68, borderRadius: 8,
    alignItems: "center", justifyContent: "center",
    overflow: "hidden", flexShrink: 0,
  },
  coverImg: { width: 48, height: 68 },
  info: { flex: 1 },
  cardTitle:  { fontSize: 14, fontFamily: "Inter_600SemiBold", lineHeight: 19 },
  cardAuthor: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  chip: {
    flexDirection: "row", alignItems: "center", gap: 3,
    paddingHorizontal: 7, paddingVertical: 3, borderRadius: 10, borderWidth: 1,
  },
  chipTxt: { fontSize: 10, fontFamily: "Inter_500Medium" },
  pageTxt: { fontSize: 11, fontFamily: "Inter_400Regular" },
  track: { height: 3, borderRadius: 2, overflow: "hidden" },
  fill:  { height: "100%", borderRadius: 2 },

  emptyState: { alignItems: "center", paddingVertical: 80, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 22, fontFamily: "Inter_700Bold", textAlign: "center", marginBottom: 8 },
  emptySub:   { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", marginBottom: 28, lineHeight: 20 },
  emptyBtn:   { borderRadius: 14, paddingHorizontal: 28, paddingVertical: 13 },
  emptyBtnTxt: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#fff" },
});
