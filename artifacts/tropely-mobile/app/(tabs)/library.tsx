import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  Image,
  Platform,
  Pressable,
  ScrollView,
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

function SortBar({ value, onChange, includeRating }: {
  value: SortKey;
  onChange: (k: SortKey) => void;
  includeRating?: boolean;
}) {
  const colors = useColors();
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
        <Pressable
          key={o.key}
          onPress={() => onChange(o.key)}
          style={{
            paddingHorizontal: 14, paddingVertical: 8, borderRadius: 99,
            borderWidth: 1.5,
            borderColor: value === o.key ? colors.moodStrong : colors.border,
            backgroundColor: value === o.key ? colors.moodStrong + "15" : colors.card,
          }}
        >
          <Text style={{
            fontSize: 12, fontFamily: "DMSans_500Medium",
            color: value === o.key ? colors.moodStrong : colors.mutedForeground,
          }}>
            {o.label}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

function BookCard({ book, reflection, onPress }: {
  book: Book;
  reflection: Reflection | undefined;
  onPress: () => void;
}) {
  const colors = useColors();
  const accent = book.mood ? MOODS[book.mood].accent : colors.moodStrong;
  const progress = book.pages && book.pages > 0 ? Math.min(book.progress / book.pages, 1) : 0;
  const rating = reflection?.rating ?? book.rating;

  return (
    <TouchableOpacity
      style={{
        flexDirection: "row", gap: 12, alignItems: "flex-start",
        marginHorizontal: 16, marginTop: 8, padding: 14,
        borderRadius: 16, borderWidth: 1,
        backgroundColor: colors.card, borderColor: colors.border,
      }}
      onPress={onPress}
      activeOpacity={0.75}
    >
      {/* Cover */}
      <View style={{
        width: 58, height: 82, borderRadius: 8, borderWidth: 1,
        backgroundColor: accent + "18", borderColor: accent + "30",
        alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        {book.cover
          ? <Image source={{ uri: book.cover }} style={{ width: 58, height: 82, borderRadius: 8 }} />
          : <Feather name="book" size={22} color={accent} />}
      </View>

      {/* Info */}
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={{
          fontSize: 15, fontFamily: "Fraunces_600SemiBold",
          color: colors.foreground, lineHeight: 20,
        }} numberOfLines={2}>{book.title}</Text>
        <Text style={{
          fontSize: 12, fontFamily: "DMSans_400Regular",
          color: colors.mutedForeground,
        }} numberOfLines={1}>{book.author}</Text>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap", marginTop: 5 }}>
          {book.mood && (
            <View style={{
              flexDirection: "row", alignItems: "center", gap: 4,
              paddingHorizontal: 7, paddingVertical: 3, borderRadius: 10, borderWidth: 1,
              backgroundColor: accent + "15", borderColor: accent + "40",
            }}>
              <Text style={{ fontSize: 10 }}>{MOODS[book.mood].emoji}</Text>
              <Text style={{ fontSize: 10, fontFamily: "DMSans_500Medium", color: accent }}>
                {MOODS[book.mood].label}
              </Text>
            </View>
          )}
          {book.shelf === "finished" && rating ? (
            <View style={{ flexDirection: "row", gap: 2 }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <Text key={n} style={{ fontSize: 12, color: n <= rating ? "#D4A832" : colors.border }}>★</Text>
              ))}
            </View>
          ) : null}
        </View>

        {book.shelf === "reading" && book.pages && book.pages > 0 && (
          <View style={{ marginTop: 8 }}>
            <View style={{ height: 4, borderRadius: 2, overflow: "hidden", backgroundColor: colors.muted, marginBottom: 3 }}>
              <View style={{ height: "100%", borderRadius: 2, backgroundColor: accent, width: `${progress * 100}%` as any }} />
            </View>
            <Text style={{ fontSize: 10, fontFamily: "DMSans_400Regular", color: colors.mutedForeground }}>
              {book.progress} / {book.pages} pages · {Math.round(progress * 100)}%
            </Text>
          </View>
        )}
      </View>

      <Feather name="chevron-right" size={15} color={colors.mutedForeground} style={{ alignSelf: "center" }} />
    </TouchableOpacity>
  );
}

function SectionHeader({ label, count }: { label: string; count: number }) {
  const colors = useColors();
  return (
    <View style={{
      flexDirection: "row", alignItems: "center", gap: 8,
      paddingHorizontal: 20, paddingVertical: 14,
      borderBottomWidth: 1, borderBottomColor: colors.border,
    }}>
      <Text style={{
        fontSize: 17, fontFamily: "Fraunces_600SemiBold",
        color: colors.foreground, flex: 1,
      }}>{label}</Text>
      <View style={{
        backgroundColor: colors.moodStrong + "18", borderWidth: 1, borderColor: colors.moodStrong + "50",
        paddingHorizontal: 9, paddingVertical: 3, borderRadius: 99,
      }}>
        <Text style={{ fontSize: 12, fontFamily: "DMSans_600SemiBold", color: colors.moodStrong }}>
          {count}
        </Text>
      </View>
    </View>
  );
}

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
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={{
        paddingTop: Platform.OS === "web" ? 67 : insets.top + 16,
        paddingHorizontal: 20, paddingBottom: 4,
        flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between",
      }}>
        <View style={{ flex: 1, paddingRight: 12 }}>
          <Text style={{
            fontSize: 11, fontFamily: "DMSans_500Medium",
            color: colors.mutedForeground, textTransform: "uppercase",
            letterSpacing: 2.5, marginBottom: 6,
          }}>Library</Text>
          <Text style={{
            fontSize: 32, fontFamily: "Fraunces_700Bold",
            color: colors.foreground, lineHeight: 38,
          }}>
            Your{" "}
            <Text style={{ fontStyle: "italic", color: colors.moodStrong }}>shelves</Text>
            .
          </Text>
          <Text style={{
            fontSize: 13, fontFamily: "DMSans_400Regular",
            color: colors.mutedForeground, marginTop: 4,
          }}>
            {books.length} {books.length === 1 ? "book" : "books"} across your shelves
          </Text>
        </View>
        <TouchableOpacity
          style={{
            width: 42, height: 42, borderRadius: 14,
            backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
            alignItems: "center", justifyContent: "center",
          }}
          onPress={() => router.push("/buddy-reads")}
        >
          <Feather name="users" size={17} color={colors.foreground} />
        </TouchableOpacity>
      </View>

      <SortBar value={sortBy} onChange={setSortBy} includeRating={finished.length > 0} />

      {books.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 40, gap: 10 }}>
          <View style={{
            width: 72, height: 72, borderRadius: 22,
            backgroundColor: colors.moodTint,
            alignItems: "center", justifyContent: "center", marginBottom: 6,
          }}>
            <Feather name="book" size={32} color={colors.moodStrong} />
          </View>
          <Text style={{
            fontSize: 20, fontFamily: "Fraunces_700Bold",
            color: colors.foreground, textAlign: "center",
          }}>Your shelves are empty</Text>
          <Text style={{
            fontSize: 14, fontFamily: "DMSans_400Regular",
            color: colors.mutedForeground, textAlign: "center", lineHeight: 21, marginBottom: 8,
          }}>
            Head to Discover to find your next read.
          </Text>
          <TouchableOpacity
            style={{
              backgroundColor: colors.moodStrong, borderRadius: 99,
              paddingHorizontal: 28, paddingVertical: 13,
            }}
            onPress={() => router.push("/discover")}
          >
            <Text style={{ fontSize: 14, fontFamily: "DMSans_600SemiBold", color: "#fff" }}>
              Browse Books
            </Text>
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
              <SectionHeader label={sec.label} count={sec.books.length} />
              {sec.books.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  reflection={reflections.find((r) => r.bookId === book.id)}
                  onPress={() => goToBook(book)}
                />
              ))}
            </View>
          )}
        />
      )}
    </View>
  );
}
