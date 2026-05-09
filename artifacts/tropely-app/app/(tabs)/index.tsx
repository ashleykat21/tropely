import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { DailyReadout } from "@/components/DailyReadout";
import { EmptyState } from "@/components/EmptyState";
import { MoodChip } from "@/components/MoodChip";
import { SessionModal } from "@/components/SessionModal";
import { useColors } from "@/hooks/useColors";
import { useStore, streak } from "@/lib/store";
import { Book, MOODS, MoodKey } from "@/types";

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const books = useStore((s) => s.books);
  const [sessionBook, setSessionBook] = useState<Book | null>(null);
  const [tbrMood, setTbrMood] = useState<MoodKey | null>(null);

  const readingBook = books.find((b) => b.shelf === "reading");
  const wantBooks = books.filter((b) => b.shelf === "want");
  const currentStreak = streak(books);

  const moodsWithTbr = MOODS.filter((m) =>
    wantBooks.some((b) => b.moods.includes(m.key))
  );
  const tbrMatches = tbrMood
    ? wantBooks.filter((b) => b.moods.includes(tbrMood))
    : [];

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <>
      <ScrollView
        style={[styles.root, { backgroundColor: colors.background }]}
        contentContainerStyle={[
          styles.content,
          { paddingTop: topPad + 8, paddingBottom: botPad + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <Text
              style={[styles.todayLabel, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}
            >
              TODAY
            </Text>
            {currentStreak > 0 && (
              <View style={[styles.streak, { backgroundColor: colors.muted, borderRadius: 12 }]}>
                <Feather name="zap" size={12} color={colors.accent} />
                <Text style={[styles.streakText, { color: colors.accent, fontFamily: "Inter_600SemiBold" }]}>
                  {currentStreak}
                </Text>
              </View>
            )}
          </View>
          <Text style={[styles.heroTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
            What is your book{"\n"}making you{" "}
            <Text style={[styles.heroEmphasis, { color: colors.accent }]}>feel?</Text>
          </Text>
          <Text style={[styles.heroSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            Tag every session by mood — your emotional fingerprint.
          </Text>
        </View>

        <DailyReadout />

        {books.length === 0 ? (
          <View style={{ height: 300 }}>
            <EmptyState
              icon="book-open"
              title="Your shelf is empty"
              subtitle="Search for a book on the Discover tab to get started."
            />
          </View>
        ) : (
          <>
            {readingBook ? (
              <CurrentBookSection
                book={readingBook}
                onLogSession={() => setSessionBook(readingBook)}
                colors={colors}
                router={router}
              />
            ) : (
              <Pressable
                style={[
                  styles.pickCta,
                  { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius },
                ]}
                onPress={() => router.push("/(tabs)/discover")}
              >
                <Feather name="book-open" size={18} color={colors.accent} />
                <Text style={[styles.pickCtaText, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>
                  Pick a book to start reading
                </Text>
                <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
              </Pressable>
            )}

            {moodsWithTbr.length > 0 && (
              <View style={styles.tbrSection}>
                <Text
                  style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}
                >
                  Mood TBR
                </Text>
                <Text
                  style={[styles.sectionSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}
                >
                  Pick a mood to find a match from your Want list
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.moodScroll}>
                  {moodsWithTbr.map((m) => (
                    <MoodChip
                      key={m.key}
                      mood={m.key}
                      selected={tbrMood === m.key}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setTbrMood((prev) => (prev === m.key ? null : m.key));
                      }}
                    />
                  ))}
                </ScrollView>

                {tbrMatches.length > 0 && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tbrBooks}>
                    {tbrMatches.map((b) => (
                      <Pressable
                        key={b.id}
                        style={[
                          styles.tbrBookCard,
                          { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius },
                        ]}
                        onPress={() => router.push(`/book/${b.id}`)}
                      >
                        {b.cover ? (
                          <Image
                            source={{ uri: b.cover }}
                            style={[styles.tbrCover, { borderRadius: colors.radius - 4 }]}
                            contentFit="cover"
                          />
                        ) : (
                          <View
                            style={[
                              styles.tbrCover,
                              styles.tbrCoverPlaceholder,
                              { backgroundColor: colors.muted, borderRadius: colors.radius - 4 },
                            ]}
                          >
                            <Feather name="book" size={20} color={colors.mutedForeground} />
                          </View>
                        )}
                        <Text
                          style={[styles.tbrTitle, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}
                          numberOfLines={2}
                        >
                          {b.title}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                )}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {sessionBook && (
        <SessionModal
          book={sessionBook}
          visible={true}
          onClose={() => setSessionBook(null)}
        />
      )}
    </>
  );
}

function CurrentBookSection({
  book,
  onLogSession,
  colors,
  router,
}: {
  book: Book;
  onLogSession: () => void;
  colors: ReturnType<typeof useColors>;
  router: ReturnType<typeof useRouter>;
}) {
  const progress =
    book.pageCount && book.pageCount > 0
      ? Math.min(book.currentPage / book.pageCount, 1)
      : 0;

  return (
    <Pressable
      style={[
        styles.currentCard,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderRadius: colors.radius,
        },
      ]}
      onPress={() => router.push(`/book/${book.id}`)}
    >
      <View style={styles.currentInner}>
        {book.cover ? (
          <Image
            source={{ uri: book.cover }}
            style={[styles.currentCover, { borderRadius: colors.radius - 4 }]}
            contentFit="cover"
          />
        ) : (
          <View
            style={[
              styles.currentCover,
              { backgroundColor: colors.muted, borderRadius: colors.radius - 4, alignItems: "center", justifyContent: "center" },
            ]}
          >
            <Feather name="book" size={28} color={colors.mutedForeground} />
          </View>
        )}
        <View style={styles.currentInfo}>
          <Text
            style={[styles.currentShelfLabel, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}
          >
            CURRENTLY READING
          </Text>
          <Text
            style={[styles.currentTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}
            numberOfLines={2}
          >
            {book.title}
          </Text>
          <Text
            style={[styles.currentAuthor, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}
            numberOfLines={1}
          >
            {book.author}
          </Text>

          {book.pageCount ? (
            <View style={styles.progressRow}>
              <View style={[styles.progressTrack, { backgroundColor: colors.muted }]}>
                <View
                  style={[
                    styles.progressFill,
                    { backgroundColor: colors.accent, width: `${Math.round(progress * 100)}%` },
                  ]}
                />
              </View>
              <Text style={[styles.progressPct, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                {Math.round(progress * 100)}%
              </Text>
            </View>
          ) : null}

          {book.moods.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.moodRow}>
              {book.moods.slice(0, 4).map((m) => (
                <MoodChip key={m} mood={m} size="sm" />
              ))}
            </ScrollView>
          )}

          <Pressable
            style={[styles.logBtn, { backgroundColor: colors.foreground, borderRadius: 20 }]}
            onPress={(e) => {
              e.stopPropagation();
              onLogSession();
            }}
          >
            <Feather name="plus" size={14} color={colors.primaryForeground} />
            <Text style={[styles.logBtnText, { color: colors.primaryForeground, fontFamily: "Inter_600SemiBold" }]}>
              Log session
            </Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 20 },
  hero: { gap: 8 },
  heroTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  todayLabel: { fontSize: 11, letterSpacing: 2 },
  streak: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 4 },
  streakText: { fontSize: 13 },
  heroTitle: { fontSize: 26, lineHeight: 32 },
  heroEmphasis: { fontStyle: "italic" },
  heroSub: { fontSize: 14, lineHeight: 20 },
  pickCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderWidth: 1,
  },
  pickCtaText: { flex: 1, fontSize: 15 },
  currentCard: { borderWidth: 1, overflow: "hidden" },
  currentInner: { flexDirection: "row", gap: 14, padding: 14 },
  currentCover: { width: 90, height: 136 },
  currentInfo: { flex: 1, gap: 5 },
  currentShelfLabel: { fontSize: 10, letterSpacing: 1.5 },
  currentTitle: { fontSize: 16, lineHeight: 22 },
  currentAuthor: { fontSize: 13 },
  progressRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
  progressTrack: { flex: 1, height: 4, borderRadius: 2, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 2 },
  progressPct: { fontSize: 11, minWidth: 28, textAlign: "right" },
  moodRow: { marginTop: 2 },
  logBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 8, alignSelf: "flex-start", marginTop: 6 },
  logBtnText: { fontSize: 13 },
  tbrSection: { gap: 10 },
  sectionTitle: { fontSize: 17 },
  sectionSub: { fontSize: 13 },
  moodScroll: { marginHorizontal: -20, paddingHorizontal: 20 },
  tbrBooks: { marginHorizontal: -20, paddingHorizontal: 20 },
  tbrBookCard: { width: 120, marginRight: 12, borderWidth: 1, overflow: "hidden" },
  tbrCover: { width: "100%", height: 160 },
  tbrCoverPlaceholder: { alignItems: "center", justifyContent: "center" },
  tbrTitle: { fontSize: 12, lineHeight: 16, padding: 8 },
});
