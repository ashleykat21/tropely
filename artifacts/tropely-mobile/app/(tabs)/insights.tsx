import { Feather } from "@expo/vector-icons";
import React, { useMemo } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StreakBadge } from "@/components/StreakBadge";
import { useColors } from "@/hooks/useColors";
import { MOODS } from "@/lib/moods";
import { computeStreak } from "@/lib/streak";
import { useStore } from "@/lib/store";
import type { MoodKey } from "@/constants/colors";

const TAB_BAR_HEIGHT = 84;

function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  const colors = useColors();
  return (
    <View style={{
      flex: 1, backgroundColor: colors.card, borderRadius: colors.radius + 4,
      padding: 16, borderWidth: 1, borderColor: colors.border,
    }}>
      <Text style={{ fontSize: 26, fontFamily: "Inter_700Bold", color: color ?? colors.foreground }}>
        {value}
      </Text>
      <Text style={{ fontSize: 12, fontFamily: "Inter_500Medium", color: colors.mutedForeground, marginTop: 3 }}>
        {label}
      </Text>
      {sub && (
        <Text style={{ fontSize: 11, fontFamily: "Inter_400Regular", color: colors.mutedForeground, marginTop: 2 }}>
          {sub}
        </Text>
      )}
    </View>
  );
}

export default function InsightsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const sessions = useStore((s) => s.sessions);
  const books = useStore((s) => s.books);
  const freeze = useStore((s) => s.freeze);
  const dailyGoal = useStore((s) => s.dailyGoal);
  const yearlyGoal = useStore((s) => s.yearlyGoal);
  const journal = useStore((s) => s.journal);

  const streak = computeStreak(sessions, freeze);

  const now = Date.now();
  const weekAgo = now - 7 * 86400000;
  const monthAgo = now - 30 * 86400000;

  const weekPages = useMemo(() =>
    sessions.filter((s) => s.at >= weekAgo).reduce((sum, s) => sum + s.pagesRead, 0),
    [sessions]
  );
  const monthPages = useMemo(() =>
    sessions.filter((s) => s.at >= monthAgo).reduce((sum, s) => sum + s.pagesRead, 0),
    [sessions]
  );
  const finishedCount = books.filter((b) => b.shelf === "finished").length;
  const readingCount = books.filter((b) => b.shelf === "reading").length;

  const weekMinutes = useMemo(() =>
    sessions.filter((s) => s.at >= weekAgo).reduce((sum, s) => sum + (s.minutes ?? 0), 0),
    [sessions]
  );

  const avgPagesPerSession = sessions.length > 0
    ? Math.round(sessions.reduce((sum, s) => sum + s.pagesRead, 0) / sessions.length)
    : 0;

  const moodCounts = useMemo(() => {
    const counts: Partial<Record<MoodKey, number>> = {};
    for (const entry of journal) {
      if (entry.mood) counts[entry.mood] = (counts[entry.mood] ?? 0) + 1;
    }
    for (const b of books) {
      if (b.mood && b.shelf === "finished") {
        counts[b.mood] = (counts[b.mood] ?? 0) + 1;
      }
    }
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5) as [MoodKey, number][];
  }, [journal, books]);

  const totalMoodCount = moodCounts.reduce((sum, [, c]) => sum + c, 0);

  const recentSessions = sessions
    .slice(-7)
    .map((s) => ({ ...s, label: new Date(s.at).toLocaleDateString("en", { weekday: "short" }) }));

  const maxPages = Math.max(...recentSessions.map((s) => s.pagesRead), 1);

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      paddingTop: Platform.OS === "web" ? 67 : insets.top + 12,
      paddingHorizontal: 20, paddingBottom: 16,
      flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    },
    title: { fontSize: 28, fontFamily: "Inter_700Bold", color: colors.foreground },
    section: { paddingHorizontal: 20, marginBottom: 24 },
    sectionTitle: {
      fontSize: 16, fontFamily: "Inter_600SemiBold",
      color: colors.foreground, marginBottom: 12,
    },
    row: { flexDirection: "row", gap: 10 },
    card: {
      backgroundColor: colors.card, borderRadius: colors.radius + 4,
      padding: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 10,
    },
    moodRow: {
      flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8,
    },
    moodLabel: { flex: 1, fontSize: 14, fontFamily: "Inter_500Medium", color: colors.foreground },
    moodBar: { flex: 2, height: 7, backgroundColor: colors.muted, borderRadius: 99, overflow: "hidden" },
    moodFill: { height: "100%", borderRadius: 99 },
    moodCount: { fontSize: 12, fontFamily: "Inter_500Medium", color: colors.mutedForeground, width: 24, textAlign: "right" },
    chartRow: { flexDirection: "row", alignItems: "flex-end", gap: 6, height: 80 },
    bar: { flex: 1, borderRadius: 4, minHeight: 4 },
    barLabel: { fontSize: 10, fontFamily: "Inter_400Regular", color: colors.mutedForeground, textAlign: "center", marginTop: 4 },
  });

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Insights</Text>
        <StreakBadge streak={streak} />
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingBottom: (Platform.OS === "web" ? 34 : insets.bottom) + TAB_BAR_HEIGHT,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Streak */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Streak</Text>
          <View style={s.card}>
            <View style={{ flexDirection: "row", gap: 20 }}>
              {[
                { label: "Current", value: streak.current, color: colors.primary },
                { label: "Longest", value: streak.longest, color: "#D4A832" },
                { label: "Freezes left", value: streak.freezesAvailable, color: "#5CB8C8" },
              ].map((item) => (
                <View key={item.label} style={{ alignItems: "center", flex: 1 }}>
                  <Text style={{ fontSize: 28, fontFamily: "Inter_700Bold", color: item.color }}>
                    {item.value}
                  </Text>
                  <Text style={{ fontSize: 11, fontFamily: "Inter_400Regular", color: colors.mutedForeground, marginTop: 2 }}>
                    {item.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Stats grid */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>This week</Text>
          <View style={s.row}>
            <StatCard label="Pages read" value={String(weekPages)} color={colors.primary} />
            <StatCard label="Minutes" value={String(weekMinutes)} color="#D4A832" />
          </View>
          <View style={[s.row, { marginTop: 10 }]}>
            <StatCard label="Books finished" value={String(finishedCount)} sub={`Goal: ${yearlyGoal}/yr`} />
            <StatCard label="Avg per session" value={`${avgPagesPerSession}p`} sub={`Goal: ${dailyGoal}/day`} />
          </View>
        </View>

        {/* Recent sessions bar chart */}
        {recentSessions.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Recent sessions</Text>
            <View style={s.card}>
              <View style={s.chartRow}>
                {recentSessions.map((sess, i) => (
                  <View key={i} style={{ flex: 1, alignItems: "center" }}>
                    <View
                      style={[s.bar, {
                        height: Math.max(4, (sess.pagesRead / maxPages) * 70),
                        backgroundColor: colors.primary + "CC",
                      }]}
                    />
                    <Text style={s.barLabel}>{sess.label}</Text>
                  </View>
                ))}
              </View>
              <View style={{ marginTop: 8 }}>
                <Text style={{ fontSize: 11, fontFamily: "Inter_400Regular", color: colors.mutedForeground }}>
                  {monthPages} pages in the last 30 days
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Top moods */}
        {moodCounts.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Reading moods</Text>
            <View style={s.card}>
              {moodCounts.map(([k, count]) => (
                <View key={k} style={s.moodRow}>
                  <Text style={{ fontSize: 16 }}>{MOODS[k].emoji}</Text>
                  <Text style={s.moodLabel}>{MOODS[k].label}</Text>
                  <View style={s.moodBar}>
                    <View style={[s.moodFill, {
                      width: `${(count / totalMoodCount) * 100}%`,
                      backgroundColor: MOODS[k].accent,
                    }]} />
                  </View>
                  <Text style={s.moodCount}>{count}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {sessions.length === 0 && (
          <View style={{ alignItems: "center", paddingVertical: 40, paddingHorizontal: 32 }}>
            <Feather name="bar-chart-2" size={42} color={colors.mutedForeground} />
            <Text style={{ fontSize: 15, fontFamily: "Inter_400Regular", color: colors.mutedForeground, textAlign: "center", marginTop: 12 }}>
              Log your first reading session to see insights here.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
