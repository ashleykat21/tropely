import React, { useMemo, useState, useEffect } from "react";
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
import { usePremium } from "@/hooks/usePremium";
import { trackEvent } from "@/lib/analytics";

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

const PERSONALITY_LINES: Record<string, Record<string, string>> = {
  melancholy: { "enemies-to-lovers": "You're drawn to melancholy slow-burns ✨", "found family": "You cry over found families in the rain ✨" },
  romantic: { "slow burn": "You're a patient romantic — slow burns only ✨", "second chance": "You believe in second chances, deeply ✨" },
  cozy: { "small town": "You're a cozy small-town romantic at heart ✨" },
  intense: { "dark romance": "You thrive in the dark, intense and unapologetic ✨" },
};

function personalityLine(mood: string, trope: string): string {
  return PERSONALITY_LINES[mood]?.[trope] ?? `You're drawn to ${mood} ${trope}s ✨`;
}

type TropeMonthData = {
  key: string;
  label: string;
  tropeCount: number;
  topTrope: string;
  moodColor: string;
  accentColor: string;
  books: { id: string; title: string; cover?: string; tropes?: string[] }[];
};

function weekKey(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d.toISOString().slice(0, 10);
}

export default function InsightsScreen() {
  const nav = useNavigation<Nav>();
  const { books, sessions, journal, reflections } = useStore();
  const { isPremium } = usePremium();
  const [selectedTropeMonth, setSelectedTropeMonth] = useState<TropeMonthData | null>(null);
  const [selectedPageMonth, setSelectedPageMonth] = useState<string | null>(null);

  useEffect(() => {
    trackEvent("Insights Viewed");
  }, []);

  const finishedBooks = useMemo(() => books.filter((b) => b.shelf === "finished"), [books]);
  const totalPages = useMemo(() => sessions.reduce((s, sess) => s + (sess.toPage - sess.fromPage), 0), [sessions]);
  const totalMinutes = useMemo(() => sessions.reduce((s, sess) => s + (sess.minutes ?? 0), 0), [sessions]);
  const avgRating = useMemo(() => {
    const rated = reflections.filter((r) => r.rating);
    if (!rated.length) return null;
    return (rated.reduce((s, r) => s + (r.rating ?? 0), 0) / rated.length).toFixed(1);
  }, [reflections]);

  // Pages per month (last 6)
  const sessionsByMonth = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleString("default", { month: "short" });
      const pages = sessions.filter((s) => s.date.startsWith(key)).reduce((sum, s) => sum + (s.toPage - s.fromPage), 0);
      const monthBooks = Array.from(
        new Set(sessions.filter((s) => s.date.startsWith(key)).map((s) => s.bookId)),
      ).map((id) => books.find((b) => b.id === id)).filter(Boolean) as typeof books;
      return { key, label, pages, books: monthBooks };
    });
  }, [sessions, books]);

  const maxMonthPages = Math.max(...sessionsByMonth.map((m) => m.pages), 1);

  // Sessions per week (last 8 weeks)
  const sessionsByWeek = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 8 }, (_, i) => {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (7 - i) * 7 - now.getDay());
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);
      const key = weekKey(weekStart);
      const count = sessions.filter((s) => {
        const d = new Date(s.date);
        return d >= weekStart && d < weekEnd;
      }).length;
      const label = `${weekStart.getMonth() + 1}/${weekStart.getDate()}`;
      return { key, label, count };
    });
  }, [sessions]);

  const maxWeekSessions = Math.max(...sessionsByWeek.map((w) => w.count), 1);

  // Mood breakdown (filter 0)
  const moodCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const b of books) {
      if (b.mood) counts[b.mood] = (counts[b.mood] ?? 0) + 1;
    }
    return Object.entries(counts).filter(([, c]) => c > 0).sort((a, b) => b[1] - a[1]);
  }, [books]);

  const maxMoodCount = Math.max(...moodCounts.map(([, c]) => c), 1);

  // Trope over time
  const tropesByMonth = useMemo((): TropeMonthData[] => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleString("default", { month: "short" });
      const bookIds = new Set(sessions.filter((s) => s.date.startsWith(key)).map((s) => s.bookId));
      const monthBooks = books.filter((b) => bookIds.has(b.id));
      const tropeCounts: Record<string, number> = {};
      for (const b of monthBooks) for (const t of b.tropes ?? []) tropeCounts[t] = (tropeCounts[t] ?? 0) + 1;
      const moodCount: Record<string, number> = {};
      for (const b of monthBooks) if (b.mood) moodCount[b.mood] = (moodCount[b.mood] ?? 0) + 1;
      const topTrope = Object.entries(tropeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "";
      const dominantMood = Object.entries(moodCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "";
      const tropeCount = Object.values(tropeCounts).reduce((s, c) => s + c, 0);
      return {
        key, label, tropeCount, topTrope,
        moodColor: dominantMood ? (MOOD_COLORS[dominantMood] ?? "#e5e7eb") : "#e5e7eb",
        accentColor: dominantMood ? (MOOD_DARK[dominantMood] ?? "#6b7280") : "#6b7280",
        books: monthBooks.map((b) => ({ id: b.id, title: b.title, cover: b.cover, tropes: b.tropes })),
      };
    });
  }, [sessions, books]);

  const maxTropeCount = Math.max(...tropesByMonth.map((m) => m.tropeCount), 1);

  // Trope DNA — frequency across finished books
  const tropeDNA = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const b of finishedBooks) for (const t of b.tropes ?? []) counts[t] = (counts[t] ?? 0) + 1;
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 20);
  }, [finishedBooks]);

  const maxTropeDNA = Math.max(...tropeDNA.map(([, c]) => c), 1);

  // Reading Personality
  const personalityCard = useMemo(() => {
    const moodCounts2: Record<string, number> = {};
    for (const b of finishedBooks) if (b.mood) moodCounts2[b.mood] = (moodCounts2[b.mood] ?? 0) + 1;
    const topMood = Object.entries(moodCounts2).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "";
    const tropeCounts2: Record<string, number> = {};
    for (const b of finishedBooks) for (const t of b.tropes ?? []) tropeCounts2[t] = (tropeCounts2[t] ?? 0) + 1;
    const topTrope = Object.entries(tropeCounts2).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "";
    const line = topMood && topTrope
      ? personalityLine(topMood, topTrope)
      : topMood
      ? `You're a ${topMood} reader at heart ✨`
      : null;
    return { topMood, topTrope, line };
  }, [finishedBooks]);

  // Books read in a selected page month
  const selectedMonthBooks = selectedPageMonth
    ? (sessionsByMonth.find((m) => m.key === selectedPageMonth)?.books ?? [])
    : [];

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Insights</Text>

        {/* Reading Personality card */}
        {personalityCard.line && (
          <View style={styles.personalityCard}>
            <Text style={styles.personalityLabel}>READING PERSONALITY</Text>
            {isPremium ? (
              <>
                <Text style={styles.personalityLine}>{personalityCard.line}</Text>
                {personalityCard.topMood && (
                  <Text style={styles.personalityMeta}>
                    Top mood: {personalityCard.topMood}
                    {personalityCard.topTrope ? `  ·  Top trope: ${personalityCard.topTrope}` : ""}
                  </Text>
                )}
              </>
            ) : (
              <View style={styles.premiumOverlay}>
                <Text style={[styles.personalityLine, { opacity: 0.15 }]} numberOfLines={1}>
                  {personalityCard.line}
                </Text>
                <View style={styles.premiumBadge}>
                  <Text style={styles.premiumBadgeText}>✨ Premium feature</Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Stats grid */}
        <View style={styles.statsGrid}>
          <StatCard label="Books added" value={books.length} />
          <StatCard label="Finished" value={finishedBooks.length} />
          <StatCard label="Pages read" value={totalPages.toLocaleString()} />
          <StatCard label="Minutes read" value={totalMinutes.toLocaleString()} />
          <StatCard label="Journal entries" value={journal.length} />
          {avgRating && <StatCard label="Avg rating" value={`${avgRating} ★`} />}
        </View>

        {/* Sessions per week chart */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sessions per week</Text>
          <View style={styles.chart}>
            {sessionsByWeek.map((w) => (
              <View key={w.key} style={styles.chartCol}>
                <Text style={styles.chartValue}>{w.count > 0 ? w.count : ""}</Text>
                <View style={styles.chartBarTrack}>
                  <View style={[styles.chartBar, { height: `${(w.count / maxWeekSessions) * 100}%` }]} />
                </View>
                <Text style={styles.chartLabel}>{w.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Pages per month */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Pages per month</Text>
          <View style={styles.chart}>
            {sessionsByMonth.map((m) => (
              <TouchableOpacity
                key={m.key}
                style={styles.chartCol}
                onPress={() => setSelectedPageMonth(selectedPageMonth === m.key ? null : m.key)}
                activeOpacity={0.7}
              >
                <Text style={styles.chartValue}>{m.pages > 0 ? m.pages : ""}</Text>
                <View style={styles.chartBarTrack}>
                  <View style={[styles.chartBar, { height: `${(m.pages / maxMonthPages) * 100}%` }]} />
                </View>
                <Text style={styles.chartLabel}>{m.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {selectedPageMonth && selectedMonthBooks.length > 0 && (
            <View style={styles.monthDetail}>
              <Text style={styles.monthDetailTitle}>
                {sessionsByMonth.find((m) => m.key === selectedPageMonth)?.label} reads
              </Text>
              {selectedMonthBooks.map((b) => (
                <TouchableOpacity
                  key={b.id}
                  style={styles.monthDetailBook}
                  onPress={() => nav.navigate("BookDetail", { bookId: b.id })}
                >
                  <Text style={styles.monthDetailBookTitle} numberOfLines={1}>{b.title}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Trope over time chart */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Tropes over time</Text>
          <Text style={styles.cardSub}>Coloured by dominant mood. Tap a bar to see books.</Text>
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
            <View style={styles.moodChipGrid}>
              {moodCounts.map(([mood, count]) => (
                <View key={mood} style={[styles.moodChip, { backgroundColor: MOOD_COLORS[mood] ?? "#f5f0ea" }]}>
                  <Text style={styles.moodChipLabel}>{mood}</Text>
                  <View style={styles.moodChipCountBubble}>
                    <Text style={styles.moodChipCount}>{count}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Trope DNA bar chart */}
        {(tropeDNA.length > 0 || !isPremium) && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Your Trope DNA</Text>
            <Text style={styles.cardSub}>From your finished books — bar width = frequency.</Text>
            {isPremium ? (
              <View style={styles.tropeDNABars}>
                {tropeDNA.slice(0, 10).map(([trope, count]) => (
                  <View key={trope} style={styles.tropeDNABarRow}>
                    <Text style={styles.tropeDNABarLabel} numberOfLines={1}>{trope}</Text>
                    <View style={styles.tropeDNABarTrack}>
                      <View style={[styles.tropeDNABarFill, { width: `${(count / maxTropeDNA) * 100}%` }]} />
                    </View>
                    <Text style={styles.tropeDNABarCount}>{count}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.tropeDNALockedContainer}>
                <View style={[styles.tropeDNABars, { opacity: 0.12 }]} pointerEvents="none">
                  {["slow burn", "enemies-to-lovers", "found family", "redemption arc", "chosen one"].map((t) => (
                    <View key={t} style={styles.tropeDNABarRow}>
                      <Text style={styles.tropeDNABarLabel}>{t}</Text>
                      <View style={styles.tropeDNABarTrack}>
                        <View style={[styles.tropeDNABarFill, { width: "60%" }]} />
                      </View>
                      <Text style={styles.tropeDNABarCount}>2</Text>
                    </View>
                  ))}
                </View>
                <View style={styles.premiumOverlayAbsolute}>
                  <View style={styles.premiumBadge}>
                    <Text style={styles.premiumBadgeText}>✨ Premium feature</Text>
                  </View>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Sessions total */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sessions</Text>
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
  personalityCard: { backgroundColor: "#1a1a1a", borderRadius: 16, padding: 18, gap: 6 },
  personalityLabel: { fontSize: 10, fontWeight: "700", color: "#6b7280", letterSpacing: 1 },
  personalityLine: { fontSize: 16, fontWeight: "700", color: "#fff", lineHeight: 22 },
  personalityMeta: { fontSize: 11, color: "#9ca3af", marginTop: 2 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statCard: { backgroundColor: "#fff", borderRadius: 14, padding: 14, borderWidth: 1, borderColor: "#f0ede8", minWidth: "45%", flex: 1, gap: 2 },
  statValue: { fontSize: 24, fontWeight: "700", color: "#1a1a1a" },
  statLabel: { fontSize: 12, color: "#6b7280" },
  statSub: { fontSize: 11, color: "#9ca3af" },
  card: { backgroundColor: "#fff", borderRadius: 14, padding: 16, borderWidth: 1, borderColor: "#f0ede8", gap: 12 },
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
  monthDetail: { backgroundColor: "#f9fafb", borderRadius: 10, padding: 12, gap: 6 },
  monthDetailTitle: { fontSize: 12, fontWeight: "600", color: "#6b7280" },
  monthDetailBook: { paddingVertical: 4 },
  monthDetailBookTitle: { fontSize: 13, color: "#1a1a1a" },
  moodChipGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  moodChip: { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8, flexDirection: "row", alignItems: "center", gap: 6 },
  moodChipLabel: { fontSize: 12, fontWeight: "500", color: "#3b2e1a", textTransform: "capitalize" },
  moodChipCountBubble: { backgroundColor: "rgba(0,0,0,0.10)", borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1 },
  moodChipCount: { fontSize: 10, fontWeight: "700", color: "#3b2e1a" },
  tropeDNABars: { gap: 8 },
  tropeDNABarRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  tropeDNABarLabel: { fontSize: 11, color: "#7a6655", width: 110 },
  tropeDNABarTrack: { flex: 1, height: 8, backgroundColor: "#f5f0ea", borderRadius: 4, overflow: "hidden" },
  tropeDNABarFill: { height: "100%", backgroundColor: "#3b2e1a", borderRadius: 4 },
  tropeDNABarCount: { fontSize: 11, color: "#a89880", width: 16, textAlign: "right" },
  tropeDNALockedContainer: { position: "relative" },
  sessionTotal: { fontSize: 14, color: "#6b7280" },
  premiumOverlay: { gap: 8 },
  premiumOverlayAbsolute: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, justifyContent: "center", alignItems: "center" },
  premiumBadge: { backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7, borderWidth: 1, borderColor: "rgba(255,255,255,0.25)" },
  premiumBadgeText: { fontSize: 13, fontWeight: "600", color: "#fff" },
});
