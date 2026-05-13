import React, { useMemo } from "react";
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

type Nav = NativeStackNavigationProp<RootStackParamList>;

const MOODS: Record<string, { label: string; emoji: string; color: string }> = {
  hopeful: { label: "Hopeful", emoji: "🌱", color: "#d1fae5" },
  tense: { label: "Tense", emoji: "⚡", color: "#fee2e2" },
  melancholy: { label: "Melancholy", emoji: "🌧", color: "#e0e7ff" },
  joyful: { label: "Joyful", emoji: "☀️", color: "#fef9c3" },
  romantic: { label: "Romantic", emoji: "🌹", color: "#fce7f3" },
  eerie: { label: "Eerie", emoji: "🌑", color: "#f3e8ff" },
  reflective: { label: "Reflective", emoji: "🪞", color: "#f0fdf4" },
  adventurous: { label: "Adventurous", emoji: "🧭", color: "#fff7ed" },
  cozy: { label: "Cozy", emoji: "🕯️", color: "#fef3c7" },
  intense: { label: "Intense", emoji: "🔥", color: "#fee2e2" },
};

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export default function HomeScreen() {
  const nav = useNavigation<Nav>();
  const { books, sessions, currentId, dailyGoalPages, dailyGoalMinutes } = useStore();

  const readingBooks = books.filter((b) => b.shelf === "reading");
  const currentBook = books.find((b) => b.id === currentId) ?? readingBooks[0];

  // Today's reading stats
  const today = todayKey();
  const todaySessions = sessions.filter((s) => s.date.startsWith(today));
  const todayPages = todaySessions.reduce((sum, s) => sum + (s.toPage - s.fromPage), 0);
  const todayMinutes = todaySessions.reduce((sum, s) => sum + (s.minutes ?? 0), 0);

  // Mood TBR: books on want shelf with a mood set
  const wantBooks = books.filter((b) => b.shelf === "want" && b.mood);
  const moodGroups = useMemo(() => {
    const groups: Record<string, typeof books> = {};
    for (const b of wantBooks) {
      if (b.mood) {
        groups[b.mood] = [...(groups[b.mood] ?? []), b];
      }
    }
    return groups;
  }, [wantBooks]);

  const [selectedMood, setSelectedMood] = React.useState<string | null>(null);
  const moodBooks = selectedMood ? (moodGroups[selectedMood] ?? []) : [];

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>Tropely</Text>
          {currentBook && (
            <TouchableOpacity
              onPress={() => nav.navigate("Companion", { bookId: currentBook.id })}
              style={styles.companionBtn}
            >
              <Text style={styles.companionBtnText}>✨ AI</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Daily readout */}
        {todaySessions.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>TODAY'S READING</Text>
            <View style={styles.progressRow}>
              <Text style={styles.statLabel}>Pages</Text>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressBar,
                    { width: `${Math.min(100, (todayPages / dailyGoalPages) * 100)}%` },
                  ]}
                />
              </View>
              <Text style={styles.statValue}>{todayPages}/{dailyGoalPages}</Text>
            </View>
            {todayMinutes > 0 && (
              <View style={styles.progressRow}>
                <Text style={styles.statLabel}>Minutes</Text>
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressBar,
                      { width: `${Math.min(100, (todayMinutes / dailyGoalMinutes) * 100)}%` },
                    ]}
                  />
                </View>
                <Text style={styles.statValue}>{todayMinutes}/{dailyGoalMinutes}</Text>
              </View>
            )}
          </View>
        )}

        {/* Mood TBR picker */}
        {Object.keys(moodGroups).length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>MOOD TBR PICKER</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
              {Object.keys(moodGroups).map((mood) => {
                const m = MOODS[mood];
                if (!m) return null;
                return (
                  <TouchableOpacity
                    key={mood}
                    onPress={() => setSelectedMood(selectedMood === mood ? null : mood)}
                    style={[
                      styles.moodChip,
                      { backgroundColor: m.color },
                      selectedMood === mood && styles.moodChipSelected,
                    ]}
                  >
                    <Text style={styles.moodChipText}>
                      {m.emoji} {m.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            {moodBooks.length > 0 && (
              <View style={styles.moodBooks}>
                {moodBooks.map((b) => (
                  <TouchableOpacity
                    key={b.id}
                    style={styles.moodBookRow}
                    onPress={() => nav.navigate("BookDetail", { bookId: b.id })}
                  >
                    {b.cover ? (
                      <Image source={{ uri: b.cover }} style={styles.moodBookCover} />
                    ) : (
                      <View style={[styles.moodBookCover, styles.coverPlaceholder]} />
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={styles.moodBookTitle} numberOfLines={1}>{b.title}</Text>
                      <Text style={styles.moodBookAuthor} numberOfLines={1}>{b.author}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Currently reading */}
        <Text style={styles.sectionTitle}>Currently reading</Text>
        {readingBooks.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No books on your reading shelf yet.</Text>
            <Text style={styles.emptyHint}>Go to Discover to add one.</Text>
          </View>
        ) : (
          readingBooks.map((b) => (
            <TouchableOpacity
              key={b.id}
              style={styles.bookCard}
              onPress={() => nav.navigate("BookDetail", { bookId: b.id })}
            >
              {b.cover ? (
                <Image source={{ uri: b.cover }} style={styles.bookCover} />
              ) : (
                <View style={[styles.bookCover, styles.coverPlaceholder]} />
              )}
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={styles.bookTitle} numberOfLines={2}>{b.title}</Text>
                <Text style={styles.bookAuthor}>{b.author}</Text>
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressBar,
                      { width: `${b.pages > 0 ? Math.min(100, (b.progress / b.pages) * 100) : 0}%` },
                    ]}
                  />
                </View>
                <Text style={styles.pageProgress}>
                  p. {b.progress} / {b.pages}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.aiBtn}
                onPress={() => nav.navigate("Companion", { bookId: b.id })}
              >
                <Text style={styles.aiBtnText}>✨</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fafaf9" },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 12, paddingBottom: 32 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  logo: { fontSize: 26, fontWeight: "700", color: "#1a1a1a", letterSpacing: -0.5 },
  companionBtn: { backgroundColor: "#1a1a1a", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7 },
  companionBtnText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  card: { backgroundColor: "#fff", borderRadius: 16, padding: 16, gap: 10, borderWidth: 1, borderColor: "#f0f0f0" },
  cardLabel: { fontSize: 10, fontWeight: "700", color: "#9ca3af", letterSpacing: 1 },
  progressRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  statLabel: { fontSize: 12, color: "#6b7280", width: 52 },
  progressTrack: { flex: 1, height: 6, backgroundColor: "#f3f4f6", borderRadius: 3, overflow: "hidden" },
  progressBar: { height: "100%", backgroundColor: "#1a1a1a", borderRadius: 3 },
  statValue: { fontSize: 11, color: "#9ca3af", width: 48, textAlign: "right" },
  chipRow: { marginTop: 4 },
  moodChip: { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, marginRight: 8 },
  moodChipSelected: { borderWidth: 1.5, borderColor: "#1a1a1a" },
  moodChipText: { fontSize: 13, fontWeight: "500" },
  moodBooks: { gap: 10, marginTop: 4 },
  moodBookRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  moodBookCover: { width: 36, height: 52, borderRadius: 4 },
  moodBookTitle: { fontSize: 13, fontWeight: "600", color: "#1a1a1a" },
  moodBookAuthor: { fontSize: 11, color: "#9ca3af" },
  sectionTitle: { fontSize: 17, fontWeight: "700", color: "#1a1a1a", marginTop: 8 },
  emptyCard: { backgroundColor: "#fff", borderRadius: 16, padding: 24, alignItems: "center", gap: 6, borderWidth: 1, borderColor: "#f0f0f0" },
  emptyText: { fontSize: 14, color: "#6b7280" },
  emptyHint: { fontSize: 12, color: "#9ca3af" },
  bookCard: { backgroundColor: "#fff", borderRadius: 16, padding: 14, flexDirection: "row", gap: 12, borderWidth: 1, borderColor: "#f0f0f0", alignItems: "flex-start" },
  bookCover: { width: 52, height: 76, borderRadius: 6 },
  coverPlaceholder: { backgroundColor: "#e5e7eb" },
  bookTitle: { fontSize: 15, fontWeight: "600", color: "#1a1a1a" },
  bookAuthor: { fontSize: 12, color: "#9ca3af" },
  pageProgress: { fontSize: 11, color: "#9ca3af", marginTop: 2 },
  aiBtn: { padding: 6 },
  aiBtnText: { fontSize: 18 },
});
