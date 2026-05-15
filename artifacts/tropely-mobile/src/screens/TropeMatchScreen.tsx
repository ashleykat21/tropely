import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/navigation";
import { useStore } from "@/store";
import { TROPES_BY_GENRE, GENRE_ORDER, type TropeGenre } from "@/constants/tropes";
import { trackEvent } from "@/lib/analytics";

type Nav = NativeStackNavigationProp<RootStackParamList>;

const MOOD_COLORS: Record<string, string> = {
  hopeful: "#d1fae5", tense: "#fee2e2", melancholy: "#e0e7ff",
  joyful: "#fef9c3", romantic: "#fce7f3", eerie: "#f3e8ff",
  reflective: "#f0fdf4", adventurous: "#fff7ed", cozy: "#fef3c7", intense: "#fee2e2",
};

const MOOD_DARK: Record<string, string> = {
  hopeful: "#059669", tense: "#dc2626", melancholy: "#6366f1",
  joyful: "#ca8a04", romantic: "#ec4899", eerie: "#9333ea",
  reflective: "#16a34a", adventurous: "#ea580c", cozy: "#d97706", intense: "#dc2626",
};

export default function TropeMatchScreen() {
  const nav = useNavigation<Nav>();
  const { books } = useStore();
  const [selected, setSelected] = useState<string[]>([]);
  const [tropeGenre, setTropeGenre] = useState<TropeGenre>(GENRE_ORDER[0]);

  // Track when tropes are selected
  useEffect(() => {
    if (selected.length > 0) {
      trackEvent("Trope Match Used", { tropes: selected });
    }
  }, [selected.length]);

  // Dominant mood from selected tropes → book data
  const dominantMood = useMemo(() => {
    if (selected.length === 0) return null;
    const moodCount: Record<string, number> = {};
    for (const trope of selected) {
      for (const b of books) {
        if ((b.tropes ?? []).includes(trope) && b.mood) {
          moodCount[b.mood] = (moodCount[b.mood] ?? 0) + 1;
        }
      }
    }
    return Object.entries(moodCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  }, [selected, books]);

  // Matching books from user's library
  const matchingBooks = useMemo(() => {
    if (selected.length === 0) return { want: [], revisit: [] };
    const want = books.filter(
      (b) => b.shelf === "want" && selected.some((t) => (b.tropes ?? []).includes(t)),
    );
    const revisit = books.filter(
      (b) => b.shelf === "finished" && selected.some((t) => (b.tropes ?? []).includes(t)),
    );
    return { want, revisit };
  }, [selected, books]);

  const toggle = (t: string) => {
    setSelected((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : prev.length < 3 ? [...prev, t] : prev,
    );
  };

  const bg = dominantMood ? (MOOD_COLORS[dominantMood] ?? "#fafaf9") : "#fafaf9";
  const accent = dominantMood ? (MOOD_DARK[dominantMood] ?? "#1a1a1a") : "#1a1a1a";

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bg }]} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.goBack()} style={styles.closeBtn}>
          <Text style={styles.closeBtnText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.title}>I'm in the mood for…</Text>
        <View style={styles.selectedBadge}>
          <Text style={styles.selectedBadgeText}>{selected.length}/3</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Genre tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.genreTabsScroll}>
          {GENRE_ORDER.map((g) => (
            <TouchableOpacity
              key={g}
              style={[styles.genreTab, tropeGenre === g && { backgroundColor: accent, borderColor: accent }]}
              onPress={() => setTropeGenre(g)}
            >
              <Text style={[styles.genreTabText, tropeGenre === g && styles.genreTabTextActive]}>
                {g}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.sectionLabel}>
          PICK UP TO 3 TROPES · {GENRE_ORDER.indexOf(tropeGenre) >= 0 ? tropeGenre.toUpperCase() : ""}
        </Text>

        <View style={styles.tropeGrid}>
          {TROPES_BY_GENRE[tropeGenre].map((t) => {
            const on = selected.includes(t);
            const locked = !on && selected.length >= 3;
            return (
              <TouchableOpacity
                key={t}
                style={[
                  styles.tropeChip,
                  on && { backgroundColor: accent, borderColor: accent },
                  locked && styles.tropeChipLocked,
                ]}
                onPress={() => !locked && toggle(t)}
                activeOpacity={locked ? 1 : 0.7}
              >
                <Text style={[styles.tropeChipText, on && { color: "#fff" }]}>{t}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Selected trope pills */}
        {selected.length > 0 && (
          <View style={styles.selectedPills}>
            {selected.map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.selectedPill, { backgroundColor: accent }]}
                onPress={() => toggle(t)}
              >
                <Text style={styles.selectedPillText}>{t}  ✕</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Matching books */}
        {selected.length > 0 && (
          <>
            {matchingBooks.want.length > 0 && (
              <>
                <Text style={[styles.sectionLabel, { marginTop: 20 }]}>FROM YOUR WANT-TO-READ SHELF</Text>
                {matchingBooks.want.map((b) => (
                  <TouchableOpacity
                    key={b.id}
                    style={styles.bookCard}
                    onPress={() => nav.navigate("BookDetail", { bookId: b.id })}
                  >
                    {b.cover ? (
                      <Image source={{ uri: b.cover }} style={styles.bookCover} />
                    ) : (
                      <View style={[styles.bookCover, styles.coverPlaceholder]}>
                        <Text style={styles.coverInitial}>{b.title[0]}</Text>
                      </View>
                    )}
                    <View style={{ flex: 1, gap: 4 }}>
                      <Text style={styles.bookTitle} numberOfLines={2}>{b.title}</Text>
                      <Text style={styles.bookAuthor}>{b.author}</Text>
                      <View style={styles.tropeRow}>
                        {(b.tropes ?? []).filter((t) => selected.includes(t)).map((t) => (
                          <View key={t} style={[styles.matchChip, { backgroundColor: bg }]}>
                            <Text style={[styles.matchChipText, { color: accent }]}>{t}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </>
            )}

            {matchingBooks.revisit.length > 0 && (
              <>
                <Text style={[styles.sectionLabel, { marginTop: 20 }]}>WORTH REVISITING</Text>
                {matchingBooks.revisit.map((b) => (
                  <TouchableOpacity
                    key={b.id}
                    style={[styles.bookCard, styles.revisitCard]}
                    onPress={() => nav.navigate("BookDetail", { bookId: b.id })}
                  >
                    {b.cover ? (
                      <Image source={{ uri: b.cover }} style={styles.bookCover} />
                    ) : (
                      <View style={[styles.bookCover, styles.coverPlaceholder]}>
                        <Text style={styles.coverInitial}>{b.title[0]}</Text>
                      </View>
                    )}
                    <View style={{ flex: 1, gap: 4 }}>
                      <Text style={styles.bookTitle} numberOfLines={2}>{b.title}</Text>
                      <Text style={styles.bookAuthor}>{b.author}</Text>
                      <View style={styles.tropeRow}>
                        {(b.tropes ?? []).filter((t) => selected.includes(t)).map((t) => (
                          <View key={t} style={[styles.matchChip, { backgroundColor: bg }]}>
                            <Text style={[styles.matchChipText, { color: accent }]}>{t}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </>
            )}

            {matchingBooks.want.length === 0 && matchingBooks.revisit.length === 0 && (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>No matches in your library yet</Text>
                <Text style={styles.emptyText}>
                  Tag tropes on your books via Book Detail — they'll show up here when they match.
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, paddingBottom: 8 },
  closeBtn: { width: 32, height: 32, justifyContent: "center", alignItems: "center" },
  closeBtnText: { fontSize: 16, color: "#6b7280" },
  title: { fontSize: 18, fontWeight: "700", color: "#1a1a1a" },
  selectedBadge: { backgroundColor: "rgba(0,0,0,0.1)", borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  selectedBadgeText: { fontSize: 13, fontWeight: "700", color: "#1a1a1a" },
  content: { padding: 16, paddingBottom: 48, gap: 12 },
  genreTabsScroll: { flexGrow: 0, marginBottom: 4 },
  genreTab: { marginRight: 8, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: "rgba(26,26,26,0.15)", backgroundColor: "rgba(255,255,255,0.8)" },
  genreTabText: { fontSize: 12, fontWeight: "500", color: "#374151" },
  genreTabTextActive: { color: "#fff", fontWeight: "700" },
  sectionLabel: { fontSize: 10, fontWeight: "700", color: "#9ca3af", letterSpacing: 1.2 },
  tropeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  tropeChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.8)", borderWidth: 1, borderColor: "rgba(26,26,26,0.12)" },
  tropeChipLocked: { opacity: 0.4 },
  tropeChipText: { fontSize: 13, fontWeight: "500", color: "#374151" },
  selectedPills: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  selectedPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  selectedPillText: { fontSize: 12, fontWeight: "600", color: "#fff" },
  bookCard: { backgroundColor: "rgba(255,255,255,0.9)", borderRadius: 14, padding: 12, flexDirection: "row", gap: 12, borderWidth: 1, borderColor: "rgba(255,255,255,0.6)" },
  revisitCard: { opacity: 0.85 },
  bookCover: { width: 48, height: 70, borderRadius: 6 },
  coverPlaceholder: { backgroundColor: "#e5e7eb", justifyContent: "center", alignItems: "center" },
  coverInitial: { fontSize: 18, fontWeight: "700", color: "#9ca3af" },
  bookTitle: { fontSize: 14, fontWeight: "600", color: "#1a1a1a" },
  bookAuthor: { fontSize: 12, color: "#6b7280" },
  tropeRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 2 },
  matchChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  matchChipText: { fontSize: 11, fontWeight: "600" },
  emptyCard: { backgroundColor: "rgba(255,255,255,0.8)", borderRadius: 16, padding: 24, alignItems: "center", gap: 8, marginTop: 12 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: "#1a1a1a" },
  emptyText: { fontSize: 13, color: "#6b7280", textAlign: "center", lineHeight: 20 },
});
