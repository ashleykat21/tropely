import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Image,
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
import { QuickLogModal } from "@/components/QuickLogModal";
import { useColors } from "@/hooks/useColors";
import { MOOD_KEYS, MOODS } from "@/lib/moods";
import { TROPE_CATEGORIES } from "@/lib/tropes";
import { selectors, useStore, type Book } from "@/lib/store";
import type { MoodKey } from "@/constants/colors";

const SHELVES: { key: Book["shelf"]; label: string; icon: string }[] = [
  { key: "want", label: "Want", icon: "bookmark" },
  { key: "reading", label: "Reading", icon: "book-open" },
  { key: "finished", label: "Finished", icon: "check-circle" },
  { key: "paused", label: "Paused", icon: "pause-circle" },
  { key: "dropped", label: "Dropped", icon: "x-circle" },
];

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const colors = useColors();
  return (
    <View style={{ flexDirection: "row", gap: 6 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <TouchableOpacity key={n} onPress={() => { onChange(n); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}>
          <Feather
            name={n <= value ? "star" : "star"}
            size={26}
            color={n <= value ? "#D4A832" : colors.border}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function BookDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const book = useStore(selectors.bookById(id ?? ""));
  const reflection = useStore(selectors.reflectionFor(id ?? ""));
  const updateBook = useStore((s) => s.updateBook);
  const moveShelf = useStore((s) => s.moveShelf);
  const saveReflection = useStore((s) => s.saveReflection);
  const removeBook = useStore((s) => s.removeBook);

  const [rating, setRating] = useState(reflection?.rating ?? 0);
  const [review, setReview] = useState(reflection?.review ?? "");
  const [showTropes, setShowTropes] = useState(false);
  const [showLog, setShowLog] = useState(false);

  if (!book) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: colors.mutedForeground }}>Book not found</Text>
      </View>
    );
  }

  const accentColor = book.mood ? MOODS[book.mood].accent : colors.primary;

  const saveReview = () => {
    saveReflection({ bookId: book.id, rating, review });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const openCompanion = () => {
    const key = book.openLibraryKey ?? book.id;
    router.push(`/companion/${encodeURIComponent(key)}`);
  };

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      paddingTop: Platform.OS === "web" ? 67 : insets.top,
      paddingHorizontal: 20, paddingBottom: 16,
      flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    },
    backBtn: {
      width: 38, height: 38, borderRadius: 19,
      backgroundColor: colors.card, alignItems: "center", justifyContent: "center",
    },
    deleteBtn: {
      width: 38, height: 38, borderRadius: 19,
      backgroundColor: colors.destructive + "15", alignItems: "center", justifyContent: "center",
    },
    heroSection: {
      alignItems: "center", paddingHorizontal: 24, paddingBottom: 24,
    },
    cover: {
      width: 120, height: 174, borderRadius: 10, marginBottom: 16,
      backgroundColor: colors.card,
      shadowColor: "#000", shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3, shadowRadius: 8, elevation: 5,
    },
    title: {
      fontSize: 22, fontFamily: "Inter_700Bold", color: colors.foreground,
      textAlign: "center", marginBottom: 4,
    },
    author: {
      fontSize: 15, fontFamily: "Inter_400Regular", color: colors.mutedForeground,
      textAlign: "center",
    },
    companionBtn: {
      marginTop: 14, flexDirection: "row", alignItems: "center", gap: 6,
      paddingHorizontal: 18, paddingVertical: 9,
      backgroundColor: accentColor + "20", borderRadius: 20,
      borderWidth: 1, borderColor: accentColor + "40",
    },
    companionText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: accentColor },
    section: { paddingHorizontal: 20, marginBottom: 24 },
    sectionTitle: {
      fontSize: 13, fontFamily: "Inter_600SemiBold",
      color: colors.mutedForeground, textTransform: "uppercase",
      letterSpacing: 0.8, marginBottom: 12,
    },
    shelfRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
    shelfBtn: {
      paddingHorizontal: 14, paddingVertical: 8,
      borderRadius: 20, borderWidth: 1.5, borderColor: colors.border,
      flexDirection: "row", alignItems: "center", gap: 5,
    },
    shelfBtnActive: { borderColor: accentColor, backgroundColor: accentColor + "15" },
    shelfBtnText: { fontSize: 13, fontFamily: "Inter_500Medium", color: colors.mutedForeground },
    shelfBtnTextActive: { color: accentColor },
    moodRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    progressRow: {
      flexDirection: "row", alignItems: "center", gap: 12,
      backgroundColor: colors.card, borderRadius: 12, padding: 14,
      borderWidth: 1, borderColor: colors.border,
    },
    progressInput: {
      flex: 1, fontSize: 20, fontFamily: "Inter_700Bold",
      color: colors.foreground, textAlign: "center",
    },
    progressLabel: {
      fontSize: 13, fontFamily: "Inter_400Regular", color: colors.mutedForeground,
    },
    progressBar: { height: 6, backgroundColor: colors.muted, borderRadius: 99, marginTop: 8, overflow: "hidden" },
    progressFill: { height: "100%", borderRadius: 99, backgroundColor: accentColor },
    reviewInput: {
      backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
      borderRadius: 10, padding: 12, minHeight: 80,
      fontSize: 14, fontFamily: "Inter_400Regular", color: colors.foreground,
      textAlignVertical: "top", marginTop: 12,
    },
    saveBtn: {
      backgroundColor: accentColor, borderRadius: 10,
      paddingVertical: 11, alignItems: "center", marginTop: 12,
    },
    saveBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#fff" },
    logBtn: {
      marginHorizontal: 20, backgroundColor: accentColor, borderRadius: 14,
      paddingVertical: 14, alignItems: "center", marginBottom: 20,
      flexDirection: "row", justifyContent: "center", gap: 8,
    },
    logBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#fff" },
    tropeChip: {
      paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16,
      backgroundColor: accentColor + "15", borderWidth: 1, borderColor: accentColor + "40",
      marginRight: 6, marginBottom: 6,
    },
    tropeText: { fontSize: 12, fontFamily: "Inter_500Medium", color: accentColor },
  });

  const progress = book.pages && book.pages > 0
    ? Math.min(book.progress / book.pages, 1)
    : 0;

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Feather name="x" size={18} color={colors.foreground} />
        </TouchableOpacity>
        <TouchableOpacity
          style={s.deleteBtn}
          onPress={() => {
            removeBook(book.id);
            router.back();
          }}
        >
          <Feather name="trash-2" size={16} color={colors.destructive} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingBottom: (Platform.OS === "web" ? 34 : insets.bottom) + 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={s.heroSection}>
          {book.cover ? (
            <Image source={{ uri: book.cover }} style={s.cover} />
          ) : (
            <View style={[s.cover, { alignItems: "center", justifyContent: "center" }]}>
              <Feather name="book" size={40} color={colors.mutedForeground} />
            </View>
          )}
          <Text style={s.title}>{book.title}</Text>
          <Text style={s.author}>{book.author}</Text>
          <TouchableOpacity style={s.companionBtn} onPress={openCompanion}>
            <Feather name="message-circle" size={14} color={accentColor} />
            <Text style={s.companionText}>Open companion</Text>
          </TouchableOpacity>
        </View>

        {/* Shelf */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Shelf</Text>
          <View style={s.shelfRow}>
            {SHELVES.map((sh) => (
              <Pressable
                key={sh.key}
                style={[s.shelfBtn, book.shelf === sh.key && s.shelfBtnActive]}
                onPress={() => {
                  moveShelf(book.id, sh.key);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Feather
                  name={sh.icon as "bookmark"}
                  size={13}
                  color={book.shelf === sh.key ? accentColor : colors.mutedForeground}
                />
                <Text style={[s.shelfBtnText, book.shelf === sh.key && s.shelfBtnTextActive]}>
                  {sh.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Mood */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Reading mood</Text>
          <View style={s.moodRow}>
            {MOOD_KEYS.map((k) => (
              <MoodChip
                key={k}
                moodKey={k}
                selected={book.mood === k}
                onPress={() => updateBook(book.id, { mood: book.mood === k ? undefined : k })}
                compact
              />
            ))}
          </View>
        </View>

        {/* Progress */}
        {book.pages && book.pages > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Progress</Text>
            <View style={s.progressRow}>
              <TextInput
                style={s.progressInput}
                value={String(book.progress)}
                keyboardType="number-pad"
                onChangeText={(v) => {
                  const n = parseInt(v, 10);
                  if (!isNaN(n)) updateBook(book.id, { progress: n });
                }}
              />
              <Text style={s.progressLabel}>/ {book.pages} pages</Text>
            </View>
            <View style={s.progressBar}>
              <View style={[s.progressFill, { width: `${progress * 100}%` }]} />
            </View>
          </View>
        )}

        {/* Tropes */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Tropes</Text>
          {(book.tropes ?? []).length > 0 && (
            <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 10 }}>
              {(book.tropes ?? []).map((t) => (
                <Pressable
                  key={t}
                  style={s.tropeChip}
                  onPress={() => {
                    const next = (book.tropes ?? []).filter((x) => x !== t);
                    updateBook(book.id, { tropes: next });
                  }}
                >
                  <Text style={s.tropeText}>{t} ×</Text>
                </Pressable>
              ))}
            </View>
          )}
          <TouchableOpacity
            style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
            onPress={() => setShowTropes(!showTropes)}
          >
            <Feather name={showTropes ? "chevron-up" : "chevron-down"} size={14} color={colors.mutedForeground} />
            <Text style={{ fontSize: 13, color: colors.mutedForeground, fontFamily: "Inter_400Regular" }}>
              {showTropes ? "Hide tropes" : "Add tropes"}
            </Text>
          </TouchableOpacity>
          {showTropes && (
            <View style={{ marginTop: 10 }}>
              {TROPE_CATEGORIES.map((cat) => (
                <View key={cat.name} style={{ marginBottom: 14 }}>
                  <Text style={{ fontSize: 11, color: colors.mutedForeground, fontFamily: "Inter_600SemiBold", marginBottom: 8, letterSpacing: 0.4 }}>
                    {cat.emoji} {cat.name}
                  </Text>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                    {cat.tropes.slice(0, 10).map((t) => {
                      const active = (book.tropes ?? []).includes(t);
                      return (
                        <Pressable
                          key={t}
                          style={{
                            paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14,
                            backgroundColor: active ? accentColor + "20" : colors.muted,
                            borderWidth: 1, borderColor: active ? accentColor : colors.border,
                          }}
                          onPress={() => {
                            const current = book.tropes ?? [];
                            const next = active ? current.filter((x) => x !== t) : [...current, t];
                            updateBook(book.id, { tropes: next });
                          }}
                        >
                          <Text style={{ fontSize: 11, color: active ? accentColor : colors.mutedForeground, fontFamily: "Inter_400Regular" }}>
                            {t}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Reflection */}
        {book.shelf === "finished" && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Reflection</Text>
            <StarRating value={rating} onChange={setRating} />
            <TextInput
              style={s.reviewInput}
              placeholder="Your thoughts on the book…"
              placeholderTextColor={colors.mutedForeground}
              value={review}
              onChangeText={setReview}
              multiline
            />
            <TouchableOpacity style={s.saveBtn} onPress={saveReview}>
              <Text style={s.saveBtnText}>Save reflection</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Log session */}
        {book.shelf === "reading" && (
          <TouchableOpacity style={s.logBtn} onPress={() => setShowLog(true)}>
            <Feather name="plus" size={18} color="#fff" />
            <Text style={s.logBtnText}>Log reading session</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {showLog && (
        <QuickLogModal
          bookId={book.id}
          bookTitle={book.title}
          onClose={() => setShowLog(false)}
        />
      )}
    </View>
  );
}
