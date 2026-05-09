import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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

function SectionLabel({ children }: { children: string }) {
  const colors = useColors();
  return (
    <Text style={{
      fontSize: 11, fontFamily: "DMSans_600SemiBold",
      color: colors.mutedForeground, textTransform: "uppercase",
      letterSpacing: 1.5, marginBottom: 12,
    }}>{children}</Text>
  );
}

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <View style={{ flexDirection: "row", gap: 6 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <TouchableOpacity key={n} onPress={() => { onChange(n); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}>
          <Feather
            name="star"
            size={28}
            color={n <= value ? "#D4A832" : "#D6CBC2"}
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
        <Text style={{ color: colors.mutedForeground, fontFamily: "DMSans_400Regular" }}>Book not found</Text>
      </View>
    );
  }

  const accentColor = book.mood ? MOODS[book.mood].accent : colors.moodStrong;
  const moodBg = book.mood ? MOODS[book.mood].bg : colors.moodTint;

  const saveReview = () => {
    saveReflection({ bookId: book.id, rating, review });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const openCompanion = () => {
    const key = book.openLibraryKey ?? book.id;
    router.push(`/companion/${encodeURIComponent(key)}`);
  };

  const progress = book.pages && book.pages > 0
    ? Math.min(book.progress / book.pages, 1)
    : 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Nav bar */}
      <View style={{
        paddingTop: Platform.OS === "web" ? 67 : insets.top,
        paddingHorizontal: 20, paddingBottom: 12,
        flexDirection: "row", alignItems: "center", justifyContent: "space-between",
        backgroundColor: colors.background,
      }}>
        <TouchableOpacity
          style={{
            width: 40, height: 40, borderRadius: 20,
            backgroundColor: colors.card, alignItems: "center", justifyContent: "center",
            borderWidth: 1, borderColor: colors.border,
          }}
          onPress={() => router.back()}
        >
          <Feather name="x" size={18} color={colors.foreground} />
        </TouchableOpacity>
        <TouchableOpacity
          style={{
            width: 40, height: 40, borderRadius: 20,
            backgroundColor: colors.destructive + "12",
            alignItems: "center", justifyContent: "center",
            borderWidth: 1, borderColor: colors.destructive + "30",
          }}
          onPress={() => { removeBook(book.id); router.back(); }}
        >
          <Feather name="trash-2" size={16} color={colors.destructive} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: (Platform.OS === "web" ? 34 : insets.bottom) + 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <LinearGradient
          colors={[moodBg + "80", colors.background]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={{ alignItems: "center", paddingHorizontal: 24, paddingBottom: 28, paddingTop: 8 }}
        >
          {book.cover ? (
            <Image
              source={{ uri: book.cover }}
              style={{
                width: 120, height: 174, borderRadius: 10, marginBottom: 18,
                shadowColor: "#000", shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.25, shadowRadius: 12,
              }}
            />
          ) : (
            <View style={{
              width: 120, height: 174, borderRadius: 10, marginBottom: 18,
              backgroundColor: moodBg, alignItems: "center", justifyContent: "center",
              borderWidth: 1, borderColor: accentColor + "30",
            }}>
              <Feather name="book" size={40} color={accentColor} />
            </View>
          )}

          <Text style={{
            fontSize: 24, fontFamily: "Fraunces_700Bold",
            color: colors.foreground, textAlign: "center", marginBottom: 6, lineHeight: 30,
          }}>{book.title}</Text>
          <Text style={{
            fontSize: 15, fontFamily: "DMSans_400Regular",
            color: colors.mutedForeground, textAlign: "center",
          }}>{book.author}</Text>

          {book.mood && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 10 }}>
              <Text style={{ fontSize: 16 }}>{MOODS[book.mood].emoji}</Text>
              <Text style={{ fontSize: 13, fontFamily: "DMSans_500Medium", color: accentColor }}>
                {MOODS[book.mood].label}
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={{
              marginTop: 14, flexDirection: "row", alignItems: "center", gap: 7,
              paddingHorizontal: 20, paddingVertical: 10,
              backgroundColor: accentColor + "18", borderRadius: 99,
              borderWidth: 1.5, borderColor: accentColor + "40",
            }}
            onPress={openCompanion}
          >
            <Feather name="message-circle" size={15} color={accentColor} />
            <Text style={{ fontSize: 13, fontFamily: "DMSans_600SemiBold", color: accentColor }}>Open companion</Text>
          </TouchableOpacity>
        </LinearGradient>

        <View style={{ paddingHorizontal: 20, gap: 24 }}>
          {/* Shelf */}
          <View>
            <SectionLabel>Shelf</SectionLabel>
            <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
              {SHELVES.map((sh) => {
                const active = book.shelf === sh.key;
                return (
                  <Pressable
                    key={sh.key}
                    style={{
                      paddingHorizontal: 14, paddingVertical: 9,
                      borderRadius: 99, borderWidth: 1.5,
                      borderColor: active ? accentColor : colors.border,
                      backgroundColor: active ? accentColor + "15" : colors.card,
                      flexDirection: "row", alignItems: "center", gap: 5,
                    }}
                    onPress={() => { moveShelf(book.id, sh.key); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                  >
                    <Feather
                      name={sh.icon as "bookmark"}
                      size={13}
                      color={active ? accentColor : colors.mutedForeground}
                    />
                    <Text style={{
                      fontSize: 13, fontFamily: "DMSans_500Medium",
                      color: active ? accentColor : colors.mutedForeground,
                    }}>{sh.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Reading mood */}
          <View>
            <SectionLabel>Reading mood</SectionLabel>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {MOOD_KEYS.map((k) => {
                const active = book.mood === k;
                return (
                  <Pressable
                    key={k}
                    style={{
                      flexDirection: "row", alignItems: "center", gap: 5,
                      paddingHorizontal: 12, paddingVertical: 8, borderRadius: 99,
                      borderWidth: 1.5,
                      borderColor: active ? MOODS[k].accent : colors.border,
                      backgroundColor: active ? MOODS[k].accent + "15" : colors.card,
                    }}
                    onPress={() => updateBook(book.id, { mood: book.mood === k ? undefined : k })}
                  >
                    <Text style={{ fontSize: 14 }}>{MOODS[k].emoji}</Text>
                    <Text style={{
                      fontSize: 12, fontFamily: "DMSans_500Medium",
                      color: active ? MOODS[k].accent : colors.mutedForeground,
                    }}>{MOODS[k].label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Progress */}
          {book.pages && book.pages > 0 && (
            <View>
              <SectionLabel>Progress</SectionLabel>
              <View style={{
                flexDirection: "row", alignItems: "center", gap: 12,
                backgroundColor: colors.card, borderRadius: 14, padding: 16,
                borderWidth: 1, borderColor: colors.border,
              }}>
                <TextInput
                  style={{
                    flex: 1, fontSize: 28, fontFamily: "Fraunces_700Bold",
                    color: colors.foreground, textAlign: "center",
                  }}
                  value={String(book.progress)}
                  keyboardType="number-pad"
                  onChangeText={(v) => {
                    const n = parseInt(v, 10);
                    if (!isNaN(n)) updateBook(book.id, { progress: n });
                  }}
                />
                <Text style={{ fontSize: 14, fontFamily: "DMSans_400Regular", color: colors.mutedForeground }}>
                  / {book.pages} pages
                </Text>
              </View>
              <View style={{ height: 6, backgroundColor: colors.muted, borderRadius: 99, marginTop: 10, overflow: "hidden" }}>
                <View style={{ height: "100%", borderRadius: 99, backgroundColor: accentColor, width: `${progress * 100}%` }} />
              </View>
              <Text style={{
                fontSize: 12, fontFamily: "DMSans_400Regular",
                color: colors.mutedForeground, textAlign: "right", marginTop: 5,
              }}>{Math.round(progress * 100)}% complete</Text>
            </View>
          )}

          {/* Tropes */}
          <View>
            <SectionLabel>Tropes</SectionLabel>
            {(book.tropes ?? []).length > 0 && (
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                {(book.tropes ?? []).map((t) => (
                  <Pressable
                    key={t}
                    style={{
                      paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99,
                      backgroundColor: accentColor + "15",
                      borderWidth: 1.5, borderColor: accentColor + "40",
                      flexDirection: "row", alignItems: "center", gap: 4,
                    }}
                    onPress={() => {
                      const next = (book.tropes ?? []).filter((x) => x !== t);
                      updateBook(book.id, { tropes: next });
                    }}
                  >
                    <Text style={{ fontSize: 12, fontFamily: "DMSans_500Medium", color: accentColor }}>{t}</Text>
                    <Feather name="x" size={10} color={accentColor} />
                  </Pressable>
                ))}
              </View>
            )}
            <TouchableOpacity
              style={{ flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start" }}
              onPress={() => setShowTropes(!showTropes)}
            >
              <Feather name={showTropes ? "chevron-up" : "chevron-down"} size={14} color={colors.mutedForeground} />
              <Text style={{ fontSize: 13, color: colors.mutedForeground, fontFamily: "DMSans_500Medium" }}>
                {showTropes ? "Hide tropes" : "Add tropes"}
              </Text>
            </TouchableOpacity>
            {showTropes && (
              <View style={{ marginTop: 14, gap: 16 }}>
                {TROPE_CATEGORIES.map((cat) => (
                  <View key={cat.name}>
                    <Text style={{ fontSize: 11, color: colors.mutedForeground, fontFamily: "DMSans_600SemiBold", marginBottom: 8, letterSpacing: 0.8, textTransform: "uppercase" }}>
                      {cat.emoji} {cat.name}
                    </Text>
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                      {cat.tropes.slice(0, 10).map((t) => {
                        const active = (book.tropes ?? []).includes(t);
                        return (
                          <Pressable
                            key={t}
                            style={{
                              paddingHorizontal: 10, paddingVertical: 6, borderRadius: 99,
                              backgroundColor: active ? accentColor + "18" : colors.card,
                              borderWidth: 1.5, borderColor: active ? accentColor : colors.border,
                            }}
                            onPress={() => {
                              const current = book.tropes ?? [];
                              const next = active ? current.filter((x) => x !== t) : [...current, t];
                              updateBook(book.id, { tropes: next });
                            }}
                          >
                            <Text style={{ fontSize: 11, fontFamily: "DMSans_400Regular", color: active ? accentColor : colors.mutedForeground }}>
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
            <View>
              <SectionLabel>Reflection</SectionLabel>
              <StarRating value={rating} onChange={setRating} />
              <TextInput
                style={{
                  backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
                  borderRadius: 12, padding: 14, minHeight: 90,
                  fontSize: 14, fontFamily: "DMSans_400Regular",
                  color: colors.foreground, textAlignVertical: "top", marginTop: 14,
                }}
                placeholder="Your thoughts on the book…"
                placeholderTextColor={colors.mutedForeground}
                value={review}
                onChangeText={setReview}
                multiline
              />
              <TouchableOpacity
                style={{
                  backgroundColor: accentColor, borderRadius: 12,
                  paddingVertical: 12, alignItems: "center", marginTop: 10,
                }}
                onPress={saveReview}
              >
                <Text style={{ fontSize: 14, fontFamily: "DMSans_600SemiBold", color: "#fff" }}>Save reflection</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Log session CTA */}
        {book.shelf === "reading" && (
          <TouchableOpacity
            style={{
              marginHorizontal: 20, marginTop: 24,
              backgroundColor: accentColor, borderRadius: 16,
              paddingVertical: 16, alignItems: "center",
              flexDirection: "row", justifyContent: "center", gap: 10,
            }}
            onPress={() => setShowLog(true)}
          >
            <Feather name="plus" size={18} color="#fff" />
            <Text style={{ fontSize: 15, fontFamily: "DMSans_600SemiBold", color: "#fff" }}>Log reading session</Text>
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
