import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { MoodChip } from "@/components/MoodChip";
import { SessionModal } from "@/components/SessionModal";
import { StarRating } from "@/components/StarRating";
import { useColors } from "@/hooks/useColors";
import { useStore } from "@/lib/store";
import { MoodKey, Shelf, TROPES } from "@/types";

export default function BookDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const book = useStore((s) => s.books.find((b) => b.id === id));
  const updateBook = useStore((s) => s.updateBook);
  const removeBook = useStore((s) => s.removeBook);

  const [sessionOpen, setSessionOpen] = useState(false);
  const [editPage, setEditPage] = useState(false);
  const [pageInput, setPageInput] = useState(String(book?.currentPage ?? 0));

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  if (!book) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background, paddingTop: topPad }]}>
        <Text style={[styles.notFound, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
          Book not found
        </Text>
      </View>
    );
  }

  const progress =
    book.pageCount && book.pageCount > 0
      ? Math.min(book.currentPage / book.pageCount, 1)
      : 0;

  const handleDeleteBook = () => {
    Alert.alert("Remove book", "Remove this book from your library?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => {
          removeBook(book.id);
          router.back();
        },
      },
    ]);
  };

  const handleShelfChange = (shelf: Shelf) => {
    const updates: Partial<typeof book> = { shelf };
    if (shelf === "finished" && book.shelf !== "finished") {
      updates.finishedAt = Date.now();
    }
    updateBook(book.id, updates);
    Haptics.selectionAsync();
  };

  const handlePageSave = () => {
    const n = parseInt(pageInput, 10);
    if (!isNaN(n) && n >= 0) {
      updateBook(book.id, { currentPage: n });
    }
    setEditPage(false);
  };

  const toggleTrope = (t: string) => {
    const has = book.tropes.includes(t);
    updateBook(book.id, {
      tropes: has ? book.tropes.filter((x) => x !== t) : [...book.tropes, t],
    });
  };

  return (
    <>
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <View style={[styles.navBar, { paddingTop: topPad + 4, borderBottomColor: colors.border }]}>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </Pressable>
          <Pressable onPress={handleDeleteBook} hitSlop={10}>
            <Feather name="trash-2" size={18} color={colors.destructive} />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: botPad + 100 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.hero}>
            {book.cover ? (
              <Image
                source={{ uri: book.cover }}
                style={[styles.heroImage, { borderRadius: colors.radius }]}
                contentFit="cover"
              />
            ) : (
              <View
                style={[
                  styles.heroImage,
                  styles.heroPlaceholder,
                  { backgroundColor: colors.muted, borderRadius: colors.radius },
                ]}
              >
                <Feather name="book" size={48} color={colors.mutedForeground} />
              </View>
            )}
            <View style={styles.heroInfo}>
              <Text style={[styles.title, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
                {book.title}
              </Text>
              <Text style={[styles.author, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                {book.author}
              </Text>
              {book.pageCount ? (
                <Text style={[styles.pages, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                  {book.pageCount.toLocaleString()} pages
                </Text>
              ) : null}
            </View>
          </View>

          <View style={styles.shelfRow}>
            {(["want", "reading", "finished"] as Shelf[]).map((s) => (
              <Pressable
                key={s}
                style={[
                  styles.shelfBtn,
                  {
                    backgroundColor: book.shelf === s ? colors.foreground : colors.card,
                    borderColor: colors.border,
                    borderRadius: 20,
                  },
                ]}
                onPress={() => handleShelfChange(s)}
              >
                <Text
                  style={[
                    styles.shelfBtnText,
                    {
                      color: book.shelf === s ? colors.primaryForeground : colors.foreground,
                      fontFamily: book.shelf === s ? "Inter_600SemiBold" : "Inter_400Regular",
                    },
                  ]}
                >
                  {s === "want" ? "Want" : s === "reading" ? "Reading" : "Finished"}
                </Text>
              </Pressable>
            ))}
          </View>

          {book.shelf === "reading" && book.pageCount ? (
            <View
              style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}
            >
              <View style={styles.cardHeader}>
                <Text style={[styles.cardTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
                  Progress
                </Text>
                <Pressable onPress={() => { setPageInput(String(book.currentPage)); setEditPage(true); }}>
                  <Text style={[styles.editText, { color: colors.accent, fontFamily: "Inter_500Medium" }]}>
                    {editPage ? "" : "Edit"}
                  </Text>
                </Pressable>
              </View>
              <View style={[styles.progressTrack, { backgroundColor: colors.muted }]}>
                <View
                  style={[
                    styles.progressFill,
                    { backgroundColor: colors.accent, width: `${Math.round(progress * 100)}%` },
                  ]}
                />
              </View>
              {editPage ? (
                <View style={styles.pageEditRow}>
                  <TextInput
                    style={[
                      styles.pageInput,
                      { color: colors.foreground, borderColor: colors.border, fontFamily: "Inter_400Regular" },
                    ]}
                    value={pageInput}
                    onChangeText={setPageInput}
                    keyboardType="number-pad"
                    onBlur={handlePageSave}
                    returnKeyType="done"
                    onSubmitEditing={handlePageSave}
                    autoFocus
                  />
                  <Text style={[styles.pageOf, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                    of {book.pageCount}
                  </Text>
                </View>
              ) : (
                <Text style={[styles.pageCounter, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                  Page {book.currentPage} of {book.pageCount} ({Math.round(progress * 100)}%)
                </Text>
              )}
            </View>
          ) : null}

          {book.shelf === "finished" && (
            <View
              style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}
            >
              <Text style={[styles.cardTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
                Your rating
              </Text>
              <StarRating
                value={book.rating ?? 0}
                onChange={(v) => updateBook(book.id, { rating: v })}
                size={28}
              />
            </View>
          )}

          {book.moods.length > 0 && (
            <View
              style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}
            >
              <Text style={[styles.cardTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
                Mood tags
              </Text>
              <View style={styles.chipWrap}>
                {book.moods.map((m) => (
                  <MoodChip key={m} mood={m as MoodKey} />
                ))}
              </View>
            </View>
          )}

          <View
            style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}
          >
            <Text style={[styles.cardTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
              Tropes
            </Text>
            <View style={styles.chipWrap}>
              {TROPES.map((t) => {
                const sel = book.tropes.includes(t);
                return (
                  <Pressable
                    key={t}
                    style={[
                      styles.tropeChip,
                      {
                        backgroundColor: sel ? colors.foreground : colors.muted,
                        borderRadius: 16,
                      },
                    ]}
                    onPress={() => toggleTrope(t)}
                  >
                    <Text
                      style={[
                        styles.tropeText,
                        {
                          color: sel ? colors.primaryForeground : colors.mutedForeground,
                          fontFamily: "Inter_400Regular",
                        },
                      ]}
                    >
                      {t}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {book.sessions.length > 0 && (
            <View
              style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}
            >
              <Text style={[styles.cardTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
                Reading sessions
              </Text>
              {book.sessions
                .slice()
                .reverse()
                .slice(0, 8)
                .map((s) => {
                  const d = new Date(s.date);
                  const dateStr = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
                  return (
                    <View key={s.id} style={[styles.sessionRow, { borderTopColor: colors.border }]}>
                      <MoodChip mood={s.mood as MoodKey} size="sm" />
                      <Text style={[styles.sessionMeta, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                        {s.pages}p · {s.minutes}min · {dateStr}
                      </Text>
                    </View>
                  );
                })}
            </View>
          )}
        </ScrollView>

        {book.shelf === "reading" && (
          <TouchableOpacity
            style={[
              styles.logFab,
              { backgroundColor: colors.foreground, bottom: botPad + 100 },
            ]}
            onPress={() => setSessionOpen(true)}
          >
            <Feather name="plus" size={20} color={colors.primaryForeground} />
            <Text style={[styles.logFabText, { color: colors.primaryForeground, fontFamily: "Inter_600SemiBold" }]}>
              Log session
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <SessionModal
        book={book}
        visible={sessionOpen}
        onClose={() => setSessionOpen(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  content: { padding: 20, gap: 16 },
  hero: { flexDirection: "row", gap: 16 },
  heroImage: { width: 110, height: 165 },
  heroPlaceholder: { alignItems: "center", justifyContent: "center" },
  heroInfo: { flex: 1, gap: 6, paddingTop: 4 },
  title: { fontSize: 20, lineHeight: 26 },
  author: { fontSize: 14 },
  pages: { fontSize: 13 },
  notFound: { textAlign: "center", marginTop: 100, fontSize: 16 },
  shelfRow: { flexDirection: "row", gap: 8 },
  shelfBtn: { paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1 },
  shelfBtnText: { fontSize: 14 },
  card: { padding: 16, borderWidth: 1, gap: 12 },
  cardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cardTitle: { fontSize: 15 },
  editText: { fontSize: 14 },
  progressTrack: { height: 6, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 3 },
  pageCounter: { fontSize: 13 },
  pageEditRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  pageInput: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, fontSize: 16, minWidth: 80, textAlign: "center" },
  pageOf: { fontSize: 15 },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tropeChip: { paddingHorizontal: 12, paddingVertical: 6 },
  tropeText: { fontSize: 13 },
  sessionRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth },
  sessionMeta: { fontSize: 12 },
  logFab: {
    position: "absolute",
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 28,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  logFabText: { fontSize: 15 },
});
