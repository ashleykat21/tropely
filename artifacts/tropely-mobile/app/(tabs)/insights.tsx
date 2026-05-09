import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useMemo } from "react";
import {
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { MOODS } from "@/lib/moods";
import { computeStreak } from "@/lib/streak";
import { useStore } from "@/lib/store";
import type { MoodKey } from "@/constants/colors";

const TAB_BAR_HEIGHT = 84;

function SectionLabel({ children }: { children: string }) {
  const C = useColors();
  return (
    <Text style={{
      fontSize: 11, fontFamily: "DMSans_600SemiBold",
      color: C.mutedForeground, textTransform: "uppercase",
      letterSpacing: 4, marginBottom: 12,
    }}>
      {children}
    </Text>
  );
}

export default function InsightsScreen() {
  const C = useColors();
  const insets = useSafeAreaInsets();
  const sessions = useStore((s) => s.sessions);
  const books = useStore((s) => s.books);
  const freeze = useStore((s) => s.freeze);
  const journal = useStore((s) => s.journal);
  const reactionLog = useStore((s) => s.reactionLog);

  const streak = computeStreak(sessions, freeze);

  const totalPages = useMemo(
    () => sessions.reduce((sum, s) => sum + s.pagesRead, 0),
    [sessions]
  );
  const finished = books.filter((b) => b.shelf === "finished").length;

  const topEmotion = useMemo(() => {
    const c: Record<string, number> = {};
    reactionLog.forEach((r) => {
      c[r.emoji] = (c[r.emoji] || 0) + 1;
    });
    const top = Object.entries(c).sort((a, b) => b[1] - a[1])[0];
    return top ? top[0] : "—";
  }, [reactionLog]);

  const isCold = sessions.length === 0 && reactionLog.length === 0 && journal.length === 0;

  const last14 = useMemo(() => {
    const arr: { date: Date; readPages: number; listenedPages: number; count: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      arr.push({ date: d, readPages: 0, listenedPages: 0, count: 0 });
    }
    sessions.forEach((s) => {
      const d = new Date(s.at);
      d.setHours(0, 0, 0, 0);
      const slot = arr.find((a) => a.date.getTime() === d.getTime());
      if (!slot) return;
      slot.readPages += s.pagesRead;
      slot.count++;
    });
    return arr;
  }, [sessions]);

  const maxPages = Math.max(1, ...last14.map((d) => d.readPages + d.listenedPages));

  const recentSessions = useMemo(
    () => [...sessions].sort((a, b) => b.at - a.at).slice(0, 12),
    [sessions]
  );

  const moodDist = useMemo(() => {
    const counts: Partial<Record<MoodKey, number>> = {};
    books.forEach((b) => {
      if (b.mood) counts[b.mood] = (counts[b.mood] ?? 0) + 1;
    });
    const totals = Object.entries(counts).map(([k, v]) => ({ mood: k as MoodKey, v: v ?? 0 }));
    const max = Math.max(1, ...totals.map((t) => t.v));
    return totals.map((t) => ({ ...t, pct: t.v / max })).sort((a, b) => b.v - a.v);
  }, [books]);

  return (
    <View style={{ flex: 1, backgroundColor: C.background }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: Platform.OS === "web" ? 67 : insets.top + 16,
          paddingHorizontal: 20,
          paddingBottom: (Platform.OS === "web" ? 34 : insets.bottom) + TAB_BAR_HEIGHT,
          gap: 32,
        }}
      >
        {/* ── Page header ── */}
        <View style={{ gap: 4 }}>
          <Text style={{ fontSize: 11, fontFamily: "DMSans_600SemiBold", color: C.mutedForeground, textTransform: "uppercase", letterSpacing: 4 }}>
            Insights
          </Text>
          <Text style={{ fontFamily: "Fraunces_400Regular", fontSize: 36, color: C.foreground, lineHeight: 38, letterSpacing: -0.5 }}>
            {"Your reading "}
            <Text style={{ fontStyle: "italic", color: C.moodStrong }}>landscape</Text>
            {"."}
          </Text>
        </View>

        {/* ── Cold state ── */}
        {isCold && (
          <View style={{
            borderRadius: 16, borderWidth: 1,
            borderColor: C.border + "99",
            borderStyle: "dashed",
            padding: 40, alignItems: "center", gap: 12,
          }}>
            <View style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: C.foreground + "0D", alignItems: "center", justifyContent: "center" }}>
              <Feather name="bar-chart-2" size={20} color={C.moodStrong} />
            </View>
            <View style={{ alignItems: "center", gap: 4 }}>
              <Text style={{ fontFamily: "Fraunces_400Regular", fontSize: 20, color: C.foreground, textAlign: "center" }}>
                Your landscape is still forming.
              </Text>
              <Text style={{ fontSize: 14, fontFamily: "DMSans_400Regular", color: C.mutedForeground, textAlign: "center", lineHeight: 20, maxWidth: 280 }}>
                Log a session to start seeing your Mood Pulse — your trope fingerprint, signature, and Wrap will fill in from there.
              </Text>
            </View>
          </View>
        )}

        {/* ── 4-stat grid (Pages / Finished / Reactions / Top emotion) ── */}
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
          {[
            { label: "Pages", value: String(totalPages) },
            { label: "Finished", value: String(finished) },
            { label: "Reactions", value: String(reactionLog.length) },
            { label: "Top emotion", value: topEmotion },
          ].map((s) => (
            <View
              key={s.label}
              style={{
                flex: 1,
                minWidth: "45%",
                borderRadius: 16,
                backgroundColor: C.moodTint + "80",
                borderWidth: 1,
                borderColor: C.border + "66",
                padding: 20,
                gap: 6,
              }}
            >
              <Text style={{ fontSize: 10, fontFamily: "DMSans_600SemiBold", color: C.mutedForeground, textTransform: "uppercase", letterSpacing: 3.2 }}>
                {s.label}
              </Text>
              <Text style={{ fontFamily: "Fraunces_400Regular", fontSize: 32, color: C.foreground, lineHeight: 38 }}>
                {s.value}
              </Text>
            </View>
          ))}
        </View>

        {/* ── Streak ── */}
        <View>
          <SectionLabel>Streak</SectionLabel>
          <LinearGradient
            colors={[C.moodTint, C.card]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 16, padding: 20, borderWidth: 1, borderColor: C.border }}
          >
            <View style={{ flexDirection: "row" }}>
              {[
                { label: "Current", value: streak.current, color: C.moodStrong },
                { label: "Longest", value: streak.longest, color: "#D4A832" },
                { label: "Freezes", value: streak.freezesAvailable, color: "#5CB8C8" },
              ].map((item, i) => (
                <View
                  key={item.label}
                  style={{
                    flex: 1, alignItems: "center",
                    borderLeftWidth: i > 0 ? 1 : 0,
                    borderLeftColor: C.border,
                  }}
                >
                  <Text style={{ fontSize: 32, fontFamily: "Fraunces_700Bold", color: item.color, lineHeight: 40 }}>
                    {item.value}
                  </Text>
                  <Text style={{ fontSize: 11, fontFamily: "DMSans_400Regular", color: C.mutedForeground, textTransform: "uppercase", letterSpacing: 0.5, marginTop: 2 }}>
                    {item.label}
                  </Text>
                </View>
              ))}
            </View>
          </LinearGradient>
        </View>

        {/* ── 14-day mood pulse ── */}
        <View style={{
          borderRadius: 16, padding: 24,
          backgroundColor: C.moodTint + "80",
          borderWidth: 1, borderColor: C.border + "66",
          gap: 16,
        }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text style={{ fontFamily: "Fraunces_400Regular", fontSize: 24, color: C.foreground }}>
              14-day mood pulse
            </Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "flex-end", height: 100, gap: 3 }}>
            {last14.map((d, i) => {
              const totalPagesDay = d.readPages + d.listenedPages;
              const heightPct = totalPagesDay > 0
                ? (totalPagesDay / maxPages) * 100
                : d.count > 0 ? 20 : 4;
              const hasActivity = totalPagesDay > 0 || d.count > 0;
              return (
                <View key={i} style={{ flex: 1, alignItems: "center", gap: 4 }}>
                  <View style={{
                    flex: 1, width: "100%", justifyContent: "flex-end",
                  }}>
                    <View style={{
                      width: "100%",
                      height: `${heightPct}%` as any,
                      minHeight: hasActivity ? 6 : 2,
                      borderRadius: 3,
                      backgroundColor: hasActivity ? C.moodStrong : C.muted,
                      opacity: hasActivity ? 1 : 0.35,
                    }} />
                  </View>
                  <Text style={{ fontSize: 9, fontFamily: "DMSans_400Regular", color: C.mutedForeground }}>
                    {d.date.getDate()}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* ── Recent sessions ── */}
        {recentSessions.length > 0 && (
          <View style={{
            borderRadius: 16, padding: 24,
            backgroundColor: C.card + "B3",
            borderWidth: 1, borderColor: C.border + "66",
            gap: 12,
          }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Feather name="clock" size={16} color={C.mutedForeground} />
              <Text style={{ fontFamily: "Fraunces_400Regular", fontSize: 24, color: C.foreground }}>
                Recent sessions
              </Text>
            </View>
            <View style={{ gap: 0 }}>
              {recentSessions.map((s, i) => {
                const b = books.find((bk) => bk.id === s.bookId);
                const moodInfo = s.mood ? MOODS[s.mood] : null;
                const isLast = i === recentSessions.length - 1;
                return (
                  <View
                    key={s.id}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingVertical: 8,
                      borderBottomWidth: isLast ? 0 : 1,
                      borderBottomColor: C.border + "4D",
                      gap: 8,
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
                      {moodInfo && <Text style={{ fontSize: 16 }}>{moodInfo.emoji}</Text>}
                      <Text style={{ fontSize: 13, fontFamily: "DMSans_400Regular", color: C.foreground }}>
                        +{s.pagesRead}p
                      </Text>
                      {b && (
                        <Text style={{ fontSize: 13, fontFamily: "DMSans_400Regular", color: C.mutedForeground }} numberOfLines={1}>
                          · {b.title}
                        </Text>
                      )}
                    </View>
                    <Text style={{ fontSize: 11, fontFamily: "DMSans_400Regular", color: C.mutedForeground, flexShrink: 0 }}>
                      {new Date(s.at).toLocaleString([], { month: "short", day: "numeric" })}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* ── Mood signature ── */}
        {moodDist.length > 0 && (
          <View style={{
            borderRadius: 16, padding: 24,
            backgroundColor: C.card + "B3",
            borderWidth: 1, borderColor: C.border + "66",
            gap: 16,
          }}>
            <Text style={{ fontFamily: "Fraunces_400Regular", fontSize: 24, color: C.foreground }}>
              Mood signature
            </Text>
            <View style={{ gap: 10 }}>
              {moodDist.map((m) => {
                const moodColor = MOODS[m.mood].accent;
                return (
                  <View key={m.mood} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                    <View style={{ width: 80, flexDirection: "row", alignItems: "center", gap: 5 }}>
                      <Text style={{ fontSize: 14 }}>{MOODS[m.mood].emoji}</Text>
                      <Text style={{ fontSize: 12, fontFamily: "DMSans_400Regular", color: C.foreground }}>{MOODS[m.mood].label}</Text>
                    </View>
                    <View style={{ flex: 1, height: 8, borderRadius: 99, backgroundColor: C.muted, overflow: "hidden" }}>
                      <View style={{ height: "100%", borderRadius: 99, backgroundColor: moodColor, width: `${m.pct * 100}%` as any }} />
                    </View>
                    <Text style={{ fontSize: 11, fontFamily: "DMSans_400Regular", color: C.mutedForeground, width: 24, textAlign: "right" }}>
                      {m.v}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {moodDist.length === 0 && !isCold && (
          <Text style={{ fontSize: 14, fontFamily: "DMSans_400Regular", color: C.mutedForeground, textAlign: "center" }}>
            Add a few books to see your signature emerge.
          </Text>
        )}
      </ScrollView>
    </View>
  );
}
