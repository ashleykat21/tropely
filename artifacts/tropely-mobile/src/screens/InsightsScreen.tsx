import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/navigation";
import { useStore } from "@/store";

type Nav = NativeStackNavigationProp<RootStackParamList>;

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {sub && <Text style={styles.statSub}>{sub}</Text>}
    </View>
  );
}

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min(1, value / max) : 0;
  return (
    <View style={styles.miniBarTrack}>
      <View style={[styles.miniBarFill, { width: `${pct * 100}%`, backgroundColor: color }]} />
    </View>
  );
}

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

type TropeMonthData = {
  key: string;
  label: string;
  tropeCount: number;
  topTrope: string;
  moodColor: string;
  accentColor: string;
  books: { id: string; title: string; cover?: string; tropes?: string[] }[];
};

export default function InsightsScreen() {
  const nav = useNavigation<Nav>();
  const { books, sessions, journal, reflections } = useStore();
  const [selectedTropeMonth, setSelectedTropeMonth] = useState<TropeMonthData | null>(null);

  const totalBooks = books.length;
  const finishedBooks = books.filter((b) => b.shelf === "finished").length;
  const totalPages = sessions.reduce((s, sess) => s + (sess.toPage - sess.fromPage), 0);
  const totalMinutes = sessions.reduce((s, sess) => s + (sess.minutes ?? 0), 0);
  const avgRating = useMemo(() => {
    const rated = reflections.filter((r) => r.rating);
    if (!rated.length) return null;
    return (rated.reduce((s, r) => s + (r.rating ?? 0), 0) / rated.length).toFixed(1);
  }, [reflections]);

  // Pages per month (last 6)
  const sessionsByMonth = useMemo(() => {
    const now = new Date();
    const months: { label: string; pages: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleString("default", { month: "short" });
      const pages = sessions
        .filter((s) => s.date.startsWith(key))
        .reduce((sum, s) => sum + (s.toPage - s.fromPage), 0);
      months.push({ label, pages });
    }
    return months;
  }, [sessions]);

  const maxMonthPages = Math.max(...sessionsByMonth.map((m) => m.pages), 1);

  // Mood breakdown
  const moodCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const b of books) {
      if (b.mood) counts[b.mood] = (counts[b.mood] ?? 0) + 1;
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [books]);

  const maxMoodCount = Math.max(...moodCounts.map(([, c]) => c), 1);

  // Trope-over-time data (last 6 months)
  const tropesByMonth = useMemo((): TropeMonthData[] => {
    const now = new Date();
    const months: TropeMonthData[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleString("default", { month: "short" });

      const bookIds = new Set(
        sessions.filter((s) => s.date.startsWith(key)).map((s) => s.bookId),
      );
      const monthBooks = books.filter((b) => bookIds.has(b.id));

      const tropeCounts: Record<string, number> = {};
      for (const b of monthBooks) {
        for (const t of b.tropes ?? []) {
          tropeCounts[t] = (tropeCounts[t] ?? 0) + 1;
        }
      }

      const moodCount: Record<string, number> = {};
      for (const b of monthBooks) {
        if (b.mood) moodCount[b.mood] = (moodCount[b.mood] ?? 0) + 1;
      }

      const topTrope = Object.entries(tropeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "";
      const dominantMood = Object.entries(moodCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "";
      const tropeCount = Object.values(tropeCounts).reduce((s, c) => s + c, 0);

      months.push({
        key,
        label,
        tropeCount,
        topTrope,
        moodColor: dominantMood ? (MOOD_COLORS[dominantMood] ?? "#e5e7eb") : "#e5e7eb",
        accentColor: dominantMood ? (MOOD_DARK[dominantMood] ?? "#6b7280") : "#6b7280",
        books: monthBooks.map((b) => ({ id: b.id, title: b.title, cover: b.cover, tropes: b.tropes })),
      });
    }
    return months;
  }, [sessions, books]);

  const maxTropeCount = Math.max(...tropesByMonth.map((m) => m.tropeCount), 1);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Insights</Text>

        {/* Stats grid */}
        <View style={styles.statsGrid}>
          <StatCard label="Books added" value={totalBooks} />
          <StatCard label="Finished" value={finishedBooks} />
          <StatCard label="Pages read" value={totalPages.toLocaleString()} />
          <StatCard label="Minutes read" value={totalMinutes.toLocaleString()} />
          <StatCard label="Journal entries" value={journal.length} />
          {avgRating && <StatCard label="Avg rating" value={`${avgRating} ★`} />}
        </View>

        {/* Pages per month */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Pages per month</Text>
          <View style={styles.chart}>
            {sessionsByMonth.map((m) => (
              <View key={m.label} style={styles.chartCol}>
                <Text style={styles.chartValue}>{m.pages > 0 ? m.pages : ""}</Text>
                <View style={styles.chartBarTrack}>
                  <View
                    style={[
                      styles.chartBar,
                      { height: `${(m.pages / maxMonthPages) * 100}%` },
                    ]}
                  />
                </View>
                <Text style={styles.chartLabel}>{m.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Trope over time chart */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Tropes over time</Text>
          <Text style={styles.cardSub}>Coloured by the dominant mood of each month. Tap a bar to see the books.</Text>
          {tropesByMonth.every((m) => m.tropeCount === 0) ? (
            <View style={styles.chartEmpty}>
              <Text style={styles.chartEmptyText}>Tag tropes on your books to see this chart fill up.</Text>
            </View>
          ) : (
            <View style={styles.chart}>
              {tropesByMonth.map((m) => (
                <TouchableOpacity
                  key={m.key}
                  style={styles.chartCol}
                  onPress={() => setSelectedTropeMonth(selectedTropeMonth?.key === m.key ? null : m)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.chartValue}>{m.tropeCount > 0 ? m.tropeCount : ""}</Text>
                  <View style={styles.chartBarTrack}>
                    <View
                      style={[
                        styles.chartBar,
                        {
                          height: `${(m.tropeCount / maxTropeCount) * 100}%`,
                          backgroundColor: m.accentColor,
                          borderTopLeftRadius: 4,
                          borderTopRightRadius: 4,
                          minHeight: m.tropeCount > 0 ? 4 : 0,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.chartLabel}>{m.label}</Text>
                  {m.topTrope !== "" && (
                    <Text style={styles.tropeTick} numberOfLines={1}>{m.topTrope.split("-").join("​-​")}</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Expanded book list for selected month */}
          {selectedTropeMonth && selectedTropeMonth.books.length > 0 && (
            <View style={[styles.tropeDetail, { backgroundColor: selectedTropeMonth.moodColor }]}>
              <Text style={[styles.tropeDetailTitle, { color: selectedTropeMonth.accentColor }]}>
                {selectedTropeMonth.label} — {selectedTropeMonth.topTrope || "mixed tropes"}
              </Text>
              {selectedTropeMonth.books.map((b) => (
                <TouchableOpacity
                  key={b.id}
                  style={styles.tropeDetailBook}
                  onPress={() => nav.navigate("BookDetail", { bookId: b.id })}
                >
                  {b.cover ? (
                    <Image source={{ uri: b.cover }} style={styles.tropeDetailCover} />
                  ) : (
                    <View style={[styles.tropeDetailCover, { backgroundColor: "rgba(0,0,0,0.1)" }]} />
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.tropeDetailBookTitle} numberOfLines={1}>{b.title}</Text>
                    {(b.tropes ?? []).length > 0 && (
                      <Text style={styles.tropeDetailTropes} numberOfLines={1}>
                        {(b.tropes ?? []).slice(0, 2).join(" · ")}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Mood breakdown */}
        {moodCounts.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Reading moods</Text>
            <View style={styles.moodList}>
              {moodCounts.map(([mood, count]) => (
                <View key={mood} style={styles.moodRow}>
                  <Text style={styles.moodLabel}>{mood}</Text>
                  <MiniBar value={count} max={maxMoodCount} color={MOOD_COLORS[mood] ?? "#e5e7eb"} />
                  <Text style={styles.moodCount}>{count}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Sessions */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sessions over time</Text>
          <Text style={styles.sessionTotal}>{sessions.length} total sessions logged</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fafaf9" },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 16, paddingBottom: 32 },
  title: { fontSize: 26, fontWeight: "700", color: "#1a1a1a" },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statCard: { backgroundColor: "#fff", borderRadius: 14, padding: 14, borderWidth: 1, borderColor: "#f0f0f0", minWidth: "45%", flex: 1, gap: 2 },
  statValue: { fontSize: 24, fontWeight: "700", color: "#1a1a1a" },
  statLabel: { fontSize: 12, color: "#6b7280" },
  statSub: { fontSize: 11, color: "#9ca3af" },
  card: { backgroundColor: "#fff", borderRadius: 14, padding: 16, borderWidth: 1, borderColor: "#f0f0f0", gap: 12 },
  cardTitle: { fontSize: 15, fontWeight: "700", color: "#1a1a1a" },
  cardSub: { fontSize: 12, color: "#9ca3af", marginTop: -6 },
  chart: { flexDirection: "row", alignItems: "flex-end", height: 120, gap: 8 },
  chartCol: { flex: 1, alignItems: "center", height: "100%", justifyContent: "flex-end", gap: 4 },
  chartValue: { fontSize: 9, color: "#9ca3af" },
  chartBarTrack: { width: "100%", flex: 1, justifyContent: "flex-end" },
  chartBar: { width: "100%", backgroundColor: "#1a1a1a", borderTopLeftRadius: 3, borderTopRightRadius: 3, minHeight: 2 },
  chartLabel: { fontSize: 10, color: "#9ca3af" },
  tropeTick: { fontSize: 8, color: "#9ca3af", textAlign: "center", maxWidth: 48 },
  chartEmpty: { paddingVertical: 24, alignItems: "center" },
  chartEmptyText: { fontSize: 13, color: "#9ca3af", textAlign: "center" },
  tropeDetail: { borderRadius: 12, padding: 12, gap: 8, marginTop: 4 },
  tropeDetailTitle: { fontSize: 13, fontWeight: "700" },
  tropeDetailBook: { flexDirection: "row", alignItems: "center", gap: 8 },
  tropeDetailCover: { width: 32, height: 46, borderRadius: 4 },
  tropeDetailBookTitle: { fontSize: 13, fontWeight: "600", color: "#1a1a1a" },
  tropeDetailTropes: { fontSize: 11, color: "#6b7280", marginTop: 1 },
  moodList: { gap: 8 },
  moodRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  moodLabel: { fontSize: 12, color: "#6b7280", width: 80, textTransform: "capitalize" },
  miniBarTrack: { flex: 1, height: 8, backgroundColor: "#f3f4f6", borderRadius: 4, overflow: "hidden" },
  miniBarFill: { height: "100%", borderRadius: 4 },
  moodCount: { fontSize: 12, color: "#9ca3af", width: 24, textAlign: "right" },
  sessionTotal: { fontSize: 14, color: "#6b7280" },
});
