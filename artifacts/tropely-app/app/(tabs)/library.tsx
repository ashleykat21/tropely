import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BookCard } from "@/components/BookCard";
import { EmptyState } from "@/components/EmptyState";
import { useColors } from "@/hooks/useColors";
import { useStore } from "@/lib/store";
import { Book, Shelf, SortKey } from "@/types";

const SHELF_LABELS: Record<Shelf, string> = {
  reading: "Reading",
  want: "Want",
  finished: "Finished",
};

function sortBooks(books: Book[], key: SortKey): Book[] {
  return [...books].sort((a, b) => {
    if (key === "title") return a.title.localeCompare(b.title);
    if (key === "pages") return (b.pageCount ?? 0) - (a.pageCount ?? 0);
    if (key === "rating") return (b.rating ?? 0) - (a.rating ?? 0);
    return b.addedAt - a.addedAt;
  });
}

export default function LibraryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const books = useStore((s) => s.books);
  const [activeShelf, setActiveShelf] = useState<Shelf>("reading");
  const [sort, setSort] = useState<SortKey>("recent");

  const shelfBooks = books.filter((b) => b.shelf === activeShelf);
  const sorted = sortBooks(shelfBooks, sort);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const SORT_OPTIONS: { key: SortKey; label: string; onlyFor?: Shelf }[] = [
    { key: "recent", label: "Recent" },
    { key: "title", label: "A–Z" },
    { key: "pages", label: "Pages" },
    { key: "rating", label: "Rating", onlyFor: "finished" },
  ];

  const availableSorts = SORT_OPTIONS.filter(
    (o) => !o.onlyFor || o.onlyFor === activeShelf
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.topBar,
          {
            paddingTop: topPad + 8,
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Text style={[styles.screenTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
          Library
        </Text>
        <View style={styles.shelfTabs}>
          {(["reading", "want", "finished"] as Shelf[]).map((s) => {
            const count = books.filter((b) => b.shelf === s).length;
            const active = activeShelf === s;
            return (
              <Pressable
                key={s}
                style={[
                  styles.shelfTab,
                  {
                    backgroundColor: active ? colors.foreground : "transparent",
                    borderRadius: 20,
                  },
                ]}
                onPress={() => setActiveShelf(s)}
              >
                <Text
                  style={[
                    styles.shelfTabText,
                    {
                      color: active ? colors.primaryForeground : colors.mutedForeground,
                      fontFamily: active ? "Inter_600SemiBold" : "Inter_400Regular",
                    },
                  ]}
                >
                  {SHELF_LABELS[s]} {count > 0 ? `(${count})` : ""}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {activeShelf !== "want" && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.sortScroll}
            contentContainerStyle={styles.sortRow}
          >
            {availableSorts.map((o) => (
              <Pressable
                key={o.key}
                style={[
                  styles.sortBtn,
                  {
                    backgroundColor: sort === o.key ? colors.muted : "transparent",
                    borderRadius: 16,
                  },
                ]}
                onPress={() => setSort(o.key)}
              >
                <Text
                  style={[
                    styles.sortText,
                    {
                      color: sort === o.key ? colors.foreground : colors.mutedForeground,
                      fontFamily: sort === o.key ? "Inter_600SemiBold" : "Inter_400Regular",
                    },
                  ]}
                >
                  {o.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        )}
      </View>

      {sorted.length === 0 ? (
        <EmptyState
          icon="book-open"
          title={`Nothing on your ${SHELF_LABELS[activeShelf].toLowerCase()} shelf`}
          subtitle="Add books from Discover to get started."
        />
      ) : (
        <FlatList
          key={activeShelf}
          data={sorted}
          keyExtractor={(b) => b.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={[
            styles.grid,
            { paddingBottom: botPad + 100 },
          ]}
          scrollEnabled={!!sorted.length}
          renderItem={({ item }) => (
            <BookCard
              book={item}
              showProgress={activeShelf === "reading"}
              showRating={activeShelf === "finished"}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: {
    paddingHorizontal: 20,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  screenTitle: { fontSize: 28 },
  shelfTabs: { flexDirection: "row", gap: 4 },
  shelfTab: { paddingHorizontal: 14, paddingVertical: 7 },
  shelfTabText: { fontSize: 14 },
  sortScroll: { marginHorizontal: -20 },
  sortRow: { paddingHorizontal: 20, gap: 6, flexDirection: "row" },
  sortBtn: { paddingHorizontal: 12, paddingVertical: 5 },
  sortText: { fontSize: 13 },
  row: { gap: 12, paddingHorizontal: 20, marginBottom: 12 },
  grid: { paddingTop: 16 },
});
