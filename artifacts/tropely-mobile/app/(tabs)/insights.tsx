import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useMemo } from "react";
import {
  Platform,
  ScrollView,
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

function SectionLabel({ children }: { children: string }) {
  const colors = useColors();
  return (
    <Text style={{
      fontSize: 11, fontFamily: "DMSans_600SemiBold",
      color: colors.mutedForeground, textTransform: "uppercase",
      letterSpacing: 2, marginBottom: 12,
    }}>{children}</Text>
  );
}

function StatCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: string }) {
  const colors = useColors();
  return (
    <View style={{
      flex: 1, backgroundColor: colors.card, borderRadius: 16,
      padding: 16, borderWidth: 1, borderColor: colors.border,
    }}>
      <Text style={{
        fontSize: 28, fontFamily: "Fraunces_700Bold",
        color: accent ?? colors.foreground, lineHeight: 34,
      }}>{value}</Text>
      <Text style={{
        fontSize: 11, fontFamily: "DMSans_500Medium",
        color: colors.mutedForeground, marginTop: 4,
        textTransform: "uppercase", letterSpacing: 0.5,
      }}>{label}</Text>
      {sub && (
        <Text style={{
          fontSize: 11, fontFamily: "DMSans_400Regular",
          color: colors.mutedForeground, marginTop: 2,
        }}>{sub}</Text>
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

  const last14 = useMemo(() => {
    const arr: { date: Date; pages: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      arr.push({ date: d, pages: 0 });
    }
    sessions.forEach((s) => {
      const d = new Date(s.at);
      d.setHours(0, 0, 0, 0);
      const slot = arr.find((a) => a.date.getTime() === d.getTime());
      if (slot) slot.pages += s.pagesRead;
    });
    return arr;
  }, [sessions]);

  const maxPages14 = Math.max(...last14.map((d) => d.pages), 1);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={{
        paddingTop: Platform.OS === "web" ? 67 : insets.top + 16,
        paddingHorizontal: 20, paddingBottom: 20,
        flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start",
      }}>
        <View style={{ flex: 1 }}>
          <Text style={{
            fontSize: 11, fontFamily: "DMSans_500Medium",
            color: colors.mutedForeground, textTransform: "uppercase",
            letterSpacing: 2.5, marginBottom: 6,
          }}>Insights</Text>
          <Text style={{
            fontSize: 34, fontFamily: "Fraunces_700Bold",
            color: colors.foreground, lineHeight: 40,
          }}>
            Your reading{" "}
            <Text style={{ fontStyle: "italic", color: colors.moodStrong }}>landscape</Text>
            .
          </Text>
        </View>
        <StreakBadge streak={streak} />
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: (Platform.OS === "web" ? 34 : insets.bottom) + TAB_BAR_HEIGHT,
          gap: 28,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Top stats */}
        <View style={{ flexDirection: "row", gap: 10 }}>
          <StatCard label="Pages this week" value={String(weekPages)} accent={colors.moodStrong} />
          <StatCard label="Minutes" value={String(weekMinutes)} accent="#D4A832" />
        </View>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <StatCard
            label="Books finished"
            value={String(finishedCount)}
            sub={`Goal: ${yearlyGoal}/yr`}
          />
          <StatCard
            label="Avg per session"
            value={`${avgPagesPerSession}p`}
            sub={`Goal: ${dailyGoal}/day`}
          />
        </View>

        {/* Streak card */}
        <View>
          <SectionLabel>Streak</SectionLabel>
          <LinearGradient
            colors={[colors.moodTint, colors.card]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: 16, padding: 20,
              borderWidth: 1, borderColor: colors.border,
            }}
          >
            <View style={{ flexDirection: "row", gap: 0 }}>
              {[
                { label: "Current", value: streak.current, color: colors.moodStrong },
                { label: "Longest", value: streak.longest, color: "#D4A832" },
                { label: "Freezes left", value: streak.freezesAvailable, color: "#5CB8C8" },
              ].map((item, i) => (
                <View
                  key={item.label}
                  style={{
                    flex: 1, alignItems: "center",
                    borderLeftWidth: i > 0 ? 1 : 0,
                    borderLeftColor: colors.border,
                  }}
                >
                  <Text style={{
                    fontSize: 32, fontFamily: "Fraunces_700Bold",
                    color: item.color, lineHeight: 40,
                  }}>{item.value}</Text>
                  <Text style={{
                    fontSize: 11, fontFamily: "DMSans_400Regular",
                    color: colors.mutedForeground, marginTop: 3,
                    textTransform: "uppercase", letterSpacing: 0.5,
                  }}>{item.label}</Text>
                </View>
              ))}
            </View>
          </LinearGradient>
        </View>

        {/* 14-day mood pulse */}
        {sessions.length > 0 && (
          <View>
            <SectionLabel>14-day mood pulse</SectionLabel>
            <LinearGradient
              colors={[colors.moodTint, colors.card]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                borderRadius: 16, padding: 18,
                borderWidth: 1, borderColor: colors.border,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "flex-end", height: 80, gap: 4 }}>
                {last14.map((d, i) => (
                  <View key={i} style={{ flex: 1, alignItems: "center" }}>
                    <View
                      style={{
                        flex: 1, width: "100%", justifyContent: "flex-end",
                      }}
                    >
                      <View style={{
                        width: "100%",
                        height: Math.max(d.pages > 0 ? 4 : 2, (d.pages / maxPages14) * 70),
                        borderRadius: 4,
                        backgroundColor: d.pages > 0 ? colors.moodStrong : colors.muted,
                        opacity: d.pages > 0 ? 1 : 0.4,
                      }} />
                    </View>
                    <Text style={{
                      fontSize: 9, fontFamily: "DMSans_400Regular",
                      color: colors.mutedForeground, marginTop: 4,
                    }}>{d.date.getDate()}</Text>
                  </View>
                ))}
              </View>
              <Text style={{
                fontSize: 11, fontFamily: "DMSans_400Regular",
                color: colors.mutedForeground, marginTop: 10,
              }}>{monthPages} pages in the last 30 days</Text>
            </LinearGradient>
          </View>
        )}

        {/* Reading moods */}
        {moodCounts.length > 0 && (
          <View>
            <SectionLabel>Reading moods</SectionLabel>
            <View style={{
              backgroundColor: colors.card, borderRadius: 16, padding: 18,
              borderWidth: 1, borderColor: colors.border, gap: 14,
            }}>
              {moodCounts.map(([k, count]) => (
                <View key={k} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <Text style={{ fontSize: 18, width: 24 }}>{MOODS[k].emoji}</Text>
                  <Text style={{
                    flex: 1, fontSize: 13, fontFamily: "DMSans_500Medium",
                    color: colors.foreground,
                  }}>{MOODS[k].label}</Text>
                  <View style={{
                    flex: 2, height: 6, backgroundColor: colors.muted,
                    borderRadius: 99, overflow: "hidden",
                  }}>
                    <View style={{
                      height: "100%", borderRadius: 99,
                      backgroundColor: MOODS[k].accent,
                      width: `${(count / totalMoodCount) * 100}%`,
                    }} />
                  </View>
                  <Text style={{
                    fontSize: 12, fontFamily: "DMSans_500Medium",
                    color: colors.mutedForeground, width: 22, textAlign: "right",
                  }}>{count}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {sessions.length === 0 && (
          <View style={{ alignItems: "center", paddingVertical: 40, paddingHorizontal: 20 }}>
            <View style={{
              width: 64, height: 64, borderRadius: 20,
              backgroundColor: colors.moodTint,
              alignItems: "center", justifyContent: "center", marginBottom: 16,
            }}>
              <Feather name="bar-chart-2" size={28} color={colors.moodStrong} />
            </View>
            <Text style={{
              fontSize: 18, fontFamily: "Fraunces_600SemiBold",
              color: colors.foreground, textAlign: "center", marginBottom: 8,
            }}>Your landscape is forming</Text>
            <Text style={{
              fontSize: 14, fontFamily: "DMSans_400Regular",
              color: colors.mutedForeground, textAlign: "center", lineHeight: 20,
            }}>
              Log your first reading session to see insights here.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
