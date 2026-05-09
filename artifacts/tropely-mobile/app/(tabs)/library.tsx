import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  Image,
  Platform,
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

// ─── Sort bar ─────────────────────────────────────────────────────────────────
function SortBar({ value, onChange, includeRating, colors }: {
  value: SortKey;
  onChange: (k: SortKey) => void;
  includeRating?: boolean;
  colors: ReturnType<typeof useColors>;
}) {
  const opts: { key: SortKey; label: string }[] = [
    { key: "recent", label: "Recent" },
    { key: "az",     label: "A → Z" },
    { key: "pages",  label: "Pages" },
    ...(includeRating ? [{ key: "rating" as SortKey, label: "⭐ Rating" }] : []),
  ];
  return (
    <ScrollView
      horizontal showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 8, paddingHorizontal: 20, paddingVertical: 10 }}
    >
      {opts.map((o) => (
        <TouchableOpacity
          key={o.key}
          onPress={() => onChange(o.key)}
          style={{
            paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
            backgroundColor: value === o.key ? colors.primary : colors.muted,
            borderWidth: 1,
            borderColor: value === o.key ? colors.primary : colors.border,
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

// ─── Book card ────────────────────────────────────────────────────────────────
function BookCard({ book, reflection, onPress, colors }: {
  book: Book;
  reflection: Reflection | undefined;
  onPress: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  const accent = book.mood ? MOODS[book.mood].accent : colors.primary;
  const progress = book.pages && book.pages > 0 ? Math.min(book.progress / book.pages, 1) : 0;
  const rating = reflection?.rating ?? book.rating;

  return (
    <TouchableOpacity
      style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      {/* Cover */}
      <View style={[s.cover, { backgroundColor: accent + "18", borderColor: accent + "30" }]}>
        {book.cover
          ? <Image source={{ uri: book.cover }} style={s.coverImg} />
          : <Feather name="book" size={22} color={accent} />}
      </View>

      {/* Info */}
      <View style={s.info}>
        <Text style={[s.title, { color: colors.foreground }]} numberOfLines={2}>{book.title}</Text>
        <Text style={[s.author, { color: colors.mutedForeground }]} numberOfLines={1}>{book.author}</Text>

        <View style={s.metaRow}>
          {book.mood && (
            <View style={[s.moodPill, { backgroundColor: accent + "18", borderColor: accent + "40" }]}>
              <Text style={{ fontSize: 10 }}>{MOODS[book.mood].emoji}</Text>
              <Text style={[s.moodText, { color: accent }]}>{MOODS[book.mood].label}</Text>
            </View>
          )}
          {book.shelf === "finished" && rating ? (
            <View style={{ flexDirection: "row", gap: 2 }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <Text key={n} style={{ fontSize: 12, color: n <= rating ? "#F4A628" : colors.border }}>★</Text>
              ))}
            </View>
          ) : null}
        </View>

        {/* Progress bar for reading books */}
        {book.shelf === "reading" && book.pages && book.pages > 0 && (
          <View style={{ marginTop: 8 }}>
            <View style={[s.progressTrack, { backgroundColor: colors.muted }]}>
              <View style={[s.progressFill, { backgroundColor: accent, width: `${progress * 100}%` as any }]} />
            </View>
            <Text style={[s.progressLabel, { color: colors.mutedForeground }]}>
              {book.progress} / {book.pages} pages · {Math.round(progress * 100)}%
            </Text>
          </View>
        )}
      </View>

      <Feather name="chevron-right" size={16} color={colors.mutedForeground} style={{ alignSelf: "center" }} />
    </TouchableOpacity>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────
function SectionHeader({ label, count, colors }: { label: string; count: number; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={[s.sectionHeader, { borderBottomColor: colors.border }]}>
      <Text style={[s.sectionLabel, { color: colors.foreground }]}>{label}</Text>
      <View style={[s.countBadge, { backgroundColor: colors.muted }]}>
        <Text style={[s.countText, { color: colors.mutedForeground }]}>{count}</Text>
      </View>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function LibraryScreen() {
  const colors      = useColors();
  const insets      = useSafeAreaInsets();
  const router      = useRouter();

  const books       = useStore((s) => s.books);
  const reflections = useStore((s) => s.reflections);

  const [sortBy, setSortBy] = useState<SortKey>("recent");

  const want     = sortBooks(books.filter((b) => b.shelf === "want"),     sortBy, reflections);
  const reading  = sortBooks(books.filter((b) => b.shelf === "reading"),  sortBy, reflections);
  const finished = sortBooks(books.filter((b) => b.shelf === "finished"), sortBy, reflections);
  const paused   = sortBooks(books.filter((b) => b.shelf === "paused"),   sortBy, reflections);

  const sections = [
    { key: "reading",  label: "Currently Reading", books: reading  },
    { key: "want",     label: "Want to Read",       books: want     },
    { key: "finished", label: "Finished",           books: finished },
    { key: "paused",   label: "Paused",             books: paused   },
  ].filter((sec) => sec.books.length > 0);

  const goToBook = (book: Book) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/book/${book.id}`);
  };

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[s.header, { paddingTop: Platform.OS === "web" ? 67 : insets.top + 12 }]}>
        <View>
          <Text style={[s.heading, { color: colors.foreground }]}>My Library</Text>
          <Text style={[s.subheading, { color: colors.mutedForeground }]}>
            {books.length} {books.length === 1 ? "book" : "books"} across your shelves
          </Text>
        </View>
        <TouchableOpacity
          style={[s.buddyBtn, { backgroundColor: colors.muted, borderColor: colors.border }]}
          onPress={() => router.push("/buddy-reads")}
        >
          <Feather name="users" size={16} color={colors.foreground} />
        </TouchableOpacity>
      </View>

      {/* Sort bar */}
      <SortBar value={sortBy} onChange={setSortBy} includeRating={finished.length > 0} colors={colors} />

      {/* Book list */}
      {books.length === 0 ? (
        <View style={s.empty}>
          <Feather name="book" size={48} color={colors.mutedForeground} style={{ marginBottom: 16 }} />
          <Text style={[s.emptyTitle, { color: colors.foreground }]}>Your shelves are empty</Text>
          <Text style={[s.emptySub, { color: colors.mutedForeground }]}>
            Head to Discover to find your next read.
          </Text>
          <TouchableOpacity
            style={[s.emptyBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push("/discover")}
          >
            <Text style={s.emptyBtnText}>Browse Books</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={sections}
          keyExtractor={(sec) => sec.key}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: (Platform.OS === "web" ? 34 : insets.bottom) + TAB_BAR_HEIGHT + 20,
          }}
          renderItem={({ item: sec }) => (
            <View style={{ marginBottom: 8 }}>
              <SectionHeader label={sec.label} count={sec.books.length} colors={colors} />
              {sec.books.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  reflection={reflections.find((r) => r.bookId === book.id)}
                  onPress={() => goToBook(book)}
                  colors={colors}
                />
              ))}
            </View>
          )}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20, paddingBottom: 4,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
  },
  heading:    { fontSize: 28, fontFamily: "Inter_700Bold" },
  subheading: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  buddyBtn: {
    width: 40, height: 40, borderRadius: 20, borderWidth: 1,
    alignItems: "center", justifyContent: "center",
  },

  sectionHeader: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 20, paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sectionLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold", flex: 1 },
  countBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  countText:  { fontSize: 11, fontFamily: "Inter_500Medium" },

  card: {
    flexDirection: "row", gap: 12, alignItems: "flex-start",
    marginHorizontal: 16, marginTop: 8, padding: 14,
    borderRadius: 14, borderWidth: 1,
  },
  cover: {
    width: 56, height: 80, borderRadius: 8, borderWidth: 1,
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  coverImg: { width: 56, height: 80, borderRadius: 8 },
  info:   { flex: 1, gap: 3 },
  title:  { fontSize: 14, fontFamily: "Inter_600SemiBold", lineHeight: 19 },
  author: { fontSize: 12, fontFamily: "Inter_400Regular" },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap", marginTop: 4 },
  moodPill: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 7, paddingVertical: 3, borderRadius: 10, borderWidth: 1,
  },
  moodText: { fontSize: 10, fontFamily: "Inter_500Medium" },
  progressTrack: { height: 4, borderRadius: 2, overflow: "hidden", marginBottom: 3 },
  progressFill:  { height: "100%", borderRadius: 2 },
  progressLabel: { fontSize: 10, fontFamily: "Inter_400Regular" },

  empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 40 },
  emptyTitle: { fontSize: 20, fontFamily: "Inter_700Bold", marginBottom: 8, textAlign: "center" },
  emptySub:   { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", marginBottom: 24 },
  emptyBtn:   { paddingHorizontal: 28, paddingVertical: 13, borderRadius: 14 },
  emptyBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#fff" },
});
