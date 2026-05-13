import React, { useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useStore } from "@/store";

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

export default function InsightsScreen() {
  const { books, sessions, journal, reflections } = useStore();

  const totalBooks = books.length;
  const finishedBooks = books.filter((b) => b.shelf === "finished").length;
  const totalPages = sessions.reduce((s, sess) => s + (sess.toPage - sess.fromPage), 0);
  const totalMinutes = sessions.reduce((s, sess) => s + (sess.minutes ?? 0), 0);
  const avgRating = useMemo(() => {
    const rated = reflections.filter((r) => r.rating);
    if (!rated.length) return null;
    return (rated.reduce((s, r) => s + (r.rating ?? 0), 0) / rated.length).toFixed(1);
  }, [reflections]);

  // Reading sessions by month (last 6)
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

        {/* Reading streak */}
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
  chart: { flexDirection: "row", alignItems: "flex-end", height: 120, gap: 8 },
  chartCol: { flex: 1, alignItems: "center", height: "100%", justifyContent: "flex-end", gap: 4 },
  chartValue: { fontSize: 9, color: "#9ca3af" },
  chartBarTrack: { width: "100%", flex: 1, justifyContent: "flex-end" },
  chartBar: { width: "100%", backgroundColor: "#1a1a1a", borderTopLeftRadius: 3, borderTopRightRadius: 3, minHeight: 2 },
  chartLabel: { fontSize: 10, color: "#9ca3af" },
  moodList: { gap: 8 },
  moodRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  moodLabel: { fontSize: 12, color: "#6b7280", width: 80, textTransform: "capitalize" },
  miniBarTrack: { flex: 1, height: 8, backgroundColor: "#f3f4f6", borderRadius: 4, overflow: "hidden" },
  miniBarFill: { height: "100%", borderRadius: 4 },
  moodCount: { fontSize: 12, color: "#9ca3af", width: 24, textAlign: "right" },
  sessionTotal: { fontSize: 14, color: "#6b7280" },
});
