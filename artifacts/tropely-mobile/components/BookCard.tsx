import { Feather } from "@expo/vector-icons";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import { MOODS } from "@/lib/moods";
import type { Book } from "@/lib/store";

interface Props {
  book: Book;
  onPress: () => void;
  onLog?: () => void;
}

export function BookCard({ book, onPress, onLog }: Props) {
  const colors = useColors();
  const accent = book.mood ? MOODS[book.mood].accent : colors.primary;
  const progress = book.pages && book.pages > 0
    ? Math.min(book.progress / book.pages, 1)
    : 0;

  const s = StyleSheet.create({
    card: {
      width: 130, marginRight: 12, backgroundColor: colors.card,
      borderRadius: colors.radius + 4,
      borderWidth: 1, borderColor: colors.border,
      overflow: "hidden",
    },
    cover: { width: 130, height: 188, backgroundColor: colors.muted },
    coverPlaceholder: {
      width: 130, height: 188,
      backgroundColor: accent + "15",
      alignItems: "center", justifyContent: "center",
    },
    info: { padding: 10 },
    title: {
      fontSize: 12, fontFamily: "Inter_600SemiBold",
      color: colors.foreground, lineHeight: 16, marginBottom: 2,
    },
    author: {
      fontSize: 11, fontFamily: "Inter_400Regular",
      color: colors.mutedForeground, marginBottom: 8,
    },
    progressTrack: {
      height: 3, backgroundColor: colors.muted, borderRadius: 99,
      overflow: "hidden", marginBottom: 8,
    },
    progressFill: { height: "100%", borderRadius: 99 },
    footer: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    pagesText: { fontSize: 10, fontFamily: "Inter_400Regular", color: colors.mutedForeground },
    logBtn: {
      width: 26, height: 26, borderRadius: 13,
      backgroundColor: accent + "20",
      alignItems: "center", justifyContent: "center",
    },
    moodDot: {
      position: "absolute", top: 8, right: 8,
      width: 22, height: 22, borderRadius: 11,
      backgroundColor: colors.background + "CC",
      alignItems: "center", justifyContent: "center",
    },
    moodEmoji: { fontSize: 11 },
  });

  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.85}>
      {book.cover ? (
        <Image source={{ uri: book.cover }} style={s.cover} />
      ) : (
        <View style={s.coverPlaceholder}>
          <Feather name="book" size={32} color={accent} />
        </View>
      )}
      {book.mood && (
        <View style={s.moodDot}>
          <Text style={s.moodEmoji}>{MOODS[book.mood].emoji}</Text>
        </View>
      )}
      <View style={s.info}>
        <Text style={s.title} numberOfLines={2}>{book.title}</Text>
        <Text style={s.author} numberOfLines={1}>{book.author}</Text>
        {book.pages && book.pages > 0 && (
          <>
            <View style={s.progressTrack}>
              <View style={[s.progressFill, { width: `${progress * 100}%`, backgroundColor: accent }]} />
            </View>
            <View style={s.footer}>
              <Text style={s.pagesText}>
                {book.progress} / {book.pages}
              </Text>
              {onLog && (
                <TouchableOpacity style={s.logBtn} onPress={onLog}>
                  <Feather name="plus" size={13} color={accent} />
                </TouchableOpacity>
              )}
            </View>
          </>
        )}
      </View>
    </TouchableOpacity>
  );
}
