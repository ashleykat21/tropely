import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useColors } from "@/hooks/useColors";
import { Book, MOODS } from "@/types";

interface Props {
  book: Book;
  showProgress?: boolean;
  showRating?: boolean;
}

export function BookCard({ book, showProgress = true, showRating = false }: Props) {
  const colors = useColors();
  const router = useRouter();
  const progress =
    book.pageCount && book.pageCount > 0
      ? Math.min(book.currentPage / book.pageCount, 1)
      : 0;

  const topMood = book.moods.length > 0 ? book.moods[0] : null;
  const moodDef = topMood ? MOODS.find((m) => m.key === topMood) : null;

  return (
    <Pressable
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderRadius: colors.radius,
          borderColor: colors.border,
        },
      ]}
      onPress={() => router.push(`/book/${book.id}`)}
    >
      {book.cover ? (
        <Image
          source={{ uri: book.cover }}
          style={[styles.cover, { borderRadius: colors.radius - 4 }]}
          contentFit="cover"
        />
      ) : (
        <View
          style={[
            styles.cover,
            styles.coverPlaceholder,
            { backgroundColor: colors.muted, borderRadius: colors.radius - 4 },
          ]}
        >
          <Feather name="book" size={24} color={colors.mutedForeground} />
        </View>
      )}

      <View style={styles.info}>
        <Text
          style={[styles.title, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}
          numberOfLines={2}
        >
          {book.title}
        </Text>
        <Text
          style={[styles.author, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}
          numberOfLines={1}
        >
          {book.author}
        </Text>

        {moodDef && (
          <View style={[styles.moodPill, { backgroundColor: moodDef.bg, borderRadius: 8 }]}>
            <Text style={[styles.moodLabel, { color: moodDef.color, fontFamily: "Inter_500Medium" }]}>
              {moodDef.label}
            </Text>
          </View>
        )}

        {showProgress && book.shelf === "reading" && book.pageCount ? (
          <View style={styles.progressWrap}>
            <View style={[styles.progressTrack, { backgroundColor: colors.muted }]}>
              <View
                style={[
                  styles.progressFill,
                  { backgroundColor: colors.accent, width: `${Math.round(progress * 100)}%` },
                ]}
              />
            </View>
            <Text style={[styles.progressLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              {Math.round(progress * 100)}%
            </Text>
          </View>
        ) : null}

        {showRating && book.shelf === "finished" && (book.rating ?? 0) > 0 ? (
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((n) => (
              <Text key={n} style={{ fontSize: 12, color: n <= (book.rating ?? 0) ? "#C49B3C" : colors.border }}>
                ★
              </Text>
            ))}
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 0,
  },
  cover: {
    width: "100%",
    aspectRatio: 0.67,
  },
  coverPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  info: {
    padding: 10,
    gap: 4,
  },
  title: {
    fontSize: 13,
    lineHeight: 18,
  },
  author: {
    fontSize: 11,
  },
  moodPill: {
    alignSelf: "flex-start",
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginTop: 2,
  },
  moodLabel: {
    fontSize: 10,
  },
  progressWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  progressTrack: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  progressLabel: {
    fontSize: 10,
    minWidth: 28,
    textAlign: "right",
  },
  starsRow: {
    flexDirection: "row",
    gap: 1,
    marginTop: 2,
  },
});
