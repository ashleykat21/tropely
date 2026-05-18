import React, { useMemo, useState } from "react";
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
import { useStore, computeStreak } from "@/store";
import { LinearGradient } from "expo-linear-gradient";
import {
  COLORS, MOOD_GRADIENTS, MOOD_INFO, MOOD_KEYS,
  EMOJI_REACTIONS, CARD_STYLE, SHADOW, type MoodKey,
} from "@/constants/theme";
import { useUser } from "@/context/AuthContext";

type Nav = NativeStackNavigationProp<RootStackParamList>;

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export default function HomeScreen() {
  const nav = useNavigation<Nav>();
  const user = useUser();
  const {
    books, sessions, currentId, setCurrent,
    dailyGoalPages, dailyGoalMinutes,
    annualGoal, equippedBadgeId,
    activeSession, startSession, pauseSession, resumeSession,
    inbox,
  } = useStore();

  const [activeMood, setActiveMood] = useState<MoodKey | null>(null);
  const [selectedReactions, setSelectedReactions] = useState<string[]>([]);

  const readingBooks = useMemo(() => books.filter((b) => b.shelf === "reading"), [books]);
  const activeBookId = currentId ?? readingBooks[0]?.id ?? null;
  const currentBook = useMemo(
    () => books.find((b) => b.id === activeBookId) ?? null,
    [books, activeBookId],
  );
  const finishedCount = useMemo(() => books.filter((b) => b.shelf === "finished").length, [books]);

  const today = todayKey();
  const todaySessions = sessions.filter((s) => s.date.startsWith(today));
  const todayPages = todaySessions.reduce((sum, s) => sum + (s.toPage - s.fromPage), 0);
  const todayMinutes = todaySessions.reduce((sum, s) => sum + (s.minutes ?? 0), 0);

  const streak = useMemo(() => computeStreak(sessions), [sessions]);

  const gradColors = activeMood
    ? MOOD_GRADIENTS[activeMood]
    : COLORS.gradPrimary;

  const moodHeadline = activeMood
    ? MOOD_INFO[activeMood].headline
    : "How are you feeling today?";

  const isAudio = currentBook?.consumption === "listen" || activeSession?.format === "audiobook";

  const toggleReaction = (emoji: string) => {
    setSelectedReactions((prev) =>
      prev.includes(emoji)
        ? prev.filter((e) => e !== emoji)
        : prev.length < 3
        ? [...prev, emoji]
        : prev,
    );
  };

  const unreadCount = inbox.filter((i) => !i.read).length;

  const displayName = user?.displayName?.split(" ")[0] ?? user?.email?.split("@")[0] ?? "Reader";

  // Session CTA label
  const sessionLabel = (): string => {
    if (!activeSession) {
      return isAudio ? "Start Listening" : "Start Reading";
    }
    if (activeSession.state === "paused") {
      return isAudio ? "Resume Listening" : "Resume Reading";
    }
    return isAudio ? "Pause Listening" : "Pause Reading";
  };

  const handleSessionCTA = () => {
    if (!currentBook) return;
    if (!activeSession) {
      startSession(currentBook.id, isAudio ? "audiobook" : "physical");
    } else if (activeSession.state === "active") {
      pauseSession();
    } else {
      resumeSession();
    }
  };

  const dailyGoalPagePct = dailyGoalPages > 0
    ? Math.min(1, todayPages / dailyGoalPages)
    : 0;

  const challengePct = annualGoal > 0 ? Math.min(1, finishedCount / annualGoal) : 0;
  const nearMilestone = (finishedCount + 2 >= annualGoal) && finishedCount < annualGoal;

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <LinearGradient colors={gradColors} style={styles.gradient} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

          {/* Top row */}
          <View style={styles.topRow}>
            <View>
              <Text style={styles.greeting}>Good {getTimeGreeting()}, {displayName}</Text>
              <Text style={styles.moodHeadline}>{moodHeadline}</Text>
            </View>
            <TouchableOpacity
              style={styles.inboxBtn}
              onPress={() => nav.navigate("Inbox")}
              activeOpacity={0.8}
            >
              <Text style={styles.inboxEmoji}>💬</Text>
              {unreadCount > 0 && (
                <View style={styles.inboxBadge}>
                  <Text style={styles.inboxBadgeText}>{unreadCount > 9 ? "9+" : unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Mood chip selector */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.moodRow}
            contentContainerStyle={styles.moodRowContent}
          >
            {MOOD_KEYS.map((key) => {
              const info = MOOD_INFO[key];
              const selected = activeMood === key;
              return (
                <TouchableOpacity
                  key={key}
                  onPress={() => setActiveMood(selected ? null : key)}
                  style={[
                    styles.moodChip,
                    selected && styles.moodChipSelected,
                  ]}
                  activeOpacity={0.8}
                >
                  <Text style={styles.moodChipEmoji}>{info.emoji}</Text>
                  <Text style={[styles.moodChipLabel, selected && styles.moodChipLabelSelected]}>
                    {info.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Currently Reading card */}
          {currentBook ? (
            <View style={[styles.card, styles.readingCard]}>
              <Text style={styles.cardSectionLabel}>
                {isAudio ? "Currently Listening" : "Currently Reading"}
              </Text>
              <View style={styles.readingCardInner}>
                {currentBook.cover ? (
                  <Image source={{ uri: currentBook.cover }} style={styles.bookCover} />
                ) : (
                  <View style={[styles.bookCover, styles.coverPlaceholder]}>
                    <Text style={styles.coverInitial}>{currentBook.title[0]}</Text>
                  </View>
                )}
                <View style={styles.readingCardInfo}>
                  <Text style={styles.bookTitle} numberOfLines={2}>{currentBook.title}</Text>
                  <Text style={styles.bookAuthor} numberOfLines={1}>{currentBook.author}</Text>

                  {/* Progress */}
                  {isAudio ? (
                    <>
                      <View style={styles.progressTrack}>
                        <View style={[styles.progressBar, { width: `${Math.min(100, ((currentBook.audioMinutes ?? 0) / (currentBook.totalDurationMinutes ?? 300)) * 100)}%` }]} />
                      </View>
                      <Text style={styles.progressText}>{currentBook.audioMinutes ?? 0} / {currentBook.totalDurationMinutes ?? "?"} min</Text>
                    </>
                  ) : (
                    <>
                      <View style={styles.progressTrack}>
                        <View style={[styles.progressBar, { width: `${currentBook.pages > 0 ? Math.min(100, (currentBook.progress / currentBook.pages) * 100) : 0}%` }]} />
                      </View>
                      <Text style={styles.progressText}>p. {currentBook.progress} / {currentBook.pages}</Text>
                    </>
                  )}
                </View>
              </View>

              {/* Session CTA */}
              <TouchableOpacity style={styles.sessionCTA} onPress={handleSessionCTA} activeOpacity={0.85}>
                <Text style={styles.sessionCTAText}>{sessionLabel()}</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => nav.navigate("BookDetail", { bookId: currentBook.id })}>
                <Text style={styles.logManuallyLink}>Log Manually</Text>
              </TouchableOpacity>

              {/* Focus Mode */}
              <TouchableOpacity
                style={styles.focusBtn}
                onPress={() => nav.navigate("FocusMode", { bookId: currentBook.id })}
                activeOpacity={0.8}
              >
                <Text style={styles.focusBtnText}>Focus Mode</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={[styles.card, styles.emptyCard]}>
              <Text style={styles.emptyEmoji}>📖</Text>
              <Text style={styles.emptyTitle}>No books yet</Text>
              <Text style={styles.emptyHint}>Find your next read in Discover</Text>
              <TouchableOpacity
                style={styles.sessionCTA}
                onPress={() => (nav as any).navigate("Discover")}
              >
                <Text style={styles.sessionCTAText}>Browse Books</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Emoji reactions */}
          <View style={styles.card}>
            <Text style={styles.cardSectionLabel}>How did this chapter make you feel?</Text>
            <View style={styles.reactionsGrid}>
              {EMOJI_REACTIONS.map((r) => {
                const selected = selectedReactions.includes(r.emoji);
                return (
                  <TouchableOpacity
                    key={r.emoji}
                    onPress={() => toggleReaction(r.emoji)}
                    style={[styles.reactionChip, selected && styles.reactionChipSelected]}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.reactionEmoji}>{r.emoji}</Text>
                    <Text style={[styles.reactionLabel, selected && styles.reactionLabelSelected]}>
                      {r.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Stats pills */}
          <View style={styles.statsRow}>
            <View style={styles.statPill}>
              <Text style={styles.statPillEmoji}>🔥</Text>
              <Text style={styles.statPillValue}>{streak}</Text>
              <Text style={styles.statPillLabel}>day streak</Text>
            </View>
            <View style={styles.statPill}>
              <Text style={styles.statPillEmoji}>📖</Text>
              <Text style={styles.statPillValue}>{todayPages}</Text>
              <Text style={styles.statPillLabel}>/ {dailyGoalPages} pages</Text>
            </View>
            <View style={styles.statPill}>
              <Text style={styles.statPillEmoji}>⏱</Text>
              <Text style={styles.statPillValue}>{todayMinutes}</Text>
              <Text style={styles.statPillLabel}>/ {dailyGoalMinutes} min</Text>
            </View>
          </View>

          {/* Achievement callout */}
          {nearMilestone && (
            <View style={[styles.card, styles.achievementCard]}>
              <Text style={styles.achievementEmoji}>🏆</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.achievementTitle}>Almost there!</Text>
                <Text style={styles.achievementDesc}>
                  {annualGoal - finishedCount} more book{annualGoal - finishedCount !== 1 ? "s" : ""} to reach your {annualGoal}-book goal
                </Text>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressBar, { width: `${challengePct * 100}%` }]} />
                </View>
              </View>
            </View>
          )}

        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

function getTimeGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  gradient: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 14, paddingBottom: 96 },

  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  greeting: { fontSize: 13, color: COLORS.inkMid, fontWeight: "500" },
  moodHeadline: { fontSize: 20, fontWeight: "700", color: COLORS.ink, marginTop: 2, lineHeight: 26 },

  inboxBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.5)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.6)",
  },
  inboxEmoji: { fontSize: 16 },
  inboxBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.rose,
    justifyContent: "center",
    alignItems: "center",
  },
  inboxBadgeText: { fontSize: 9, color: "#fff", fontWeight: "700" },

  moodRow: { flexGrow: 0, marginBottom: 2 },
  moodRowContent: { gap: 8, paddingRight: 4 },
  moodChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.5)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.6)",
  },
  moodChipSelected: {
    backgroundColor: "rgba(167,139,250,0.25)",
    borderColor: COLORS.lavender,
    shadowColor: COLORS.lavender,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  moodChipEmoji: { fontSize: 14 },
  moodChipLabel: { fontSize: 12, fontWeight: "500", color: COLORS.inkMid },
  moodChipLabelSelected: { color: COLORS.lavender, fontWeight: "700" },

  card: {
    ...CARD_STYLE,
    ...SHADOW,
    gap: 10,
  },
  readingCard: { paddingVertical: 18 },
  cardSectionLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.inkSoft,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },

  readingCardInner: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  bookCover: { width: 56, height: 80, borderRadius: 8 },
  coverPlaceholder: { backgroundColor: "#e5e7eb", justifyContent: "center", alignItems: "center" },
  coverInitial: { fontSize: 20, fontWeight: "700", color: "#9ca3af" },
  readingCardInfo: { flex: 1, gap: 4 },
  bookTitle: { fontSize: 15, fontWeight: "700", color: COLORS.ink, lineHeight: 20 },
  bookAuthor: { fontSize: 12, color: COLORS.inkSoft },
  progressTrack: { height: 4, backgroundColor: "rgba(0,0,0,0.08)", borderRadius: 2, overflow: "hidden", marginTop: 6 },
  progressBar: { height: "100%", backgroundColor: COLORS.lavender, borderRadius: 2 },
  progressText: { fontSize: 11, color: COLORS.inkSoft, marginTop: 2 },

  sessionCTA: {
    backgroundColor: COLORS.ink,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: "center",
    marginTop: 4,
  },
  sessionCTAText: { color: "#fff", fontSize: 15, fontWeight: "700" },

  logManuallyLink: {
    textAlign: "center",
    fontSize: 13,
    color: COLORS.lavender,
    fontWeight: "600",
    marginTop: 2,
  },

  focusBtn: {
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.4)",
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: "rgba(167,139,250,0.08)",
  },
  focusBtnText: { fontSize: 13, fontWeight: "600", color: COLORS.lavender },

  emptyCard: { alignItems: "center", paddingVertical: 28 },
  emptyEmoji: { fontSize: 36 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: COLORS.ink },
  emptyHint: { fontSize: 13, color: COLORS.inkSoft, textAlign: "center" },

  reactionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  reactionChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.5)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.6)",
  },
  reactionChipSelected: {
    backgroundColor: "rgba(167,139,250,0.2)",
    borderColor: COLORS.lavender,
  },
  reactionEmoji: { fontSize: 15 },
  reactionLabel: { fontSize: 11, color: COLORS.inkMid, fontWeight: "500" },
  reactionLabelSelected: { color: COLORS.lavender, fontWeight: "700" },

  statsRow: { flexDirection: "row", gap: 8 },
  statPill: {
    flex: 1,
    ...CARD_STYLE,
    ...SHADOW,
    alignItems: "center",
    paddingVertical: 12,
    gap: 2,
  },
  statPillEmoji: { fontSize: 18 },
  statPillValue: { fontSize: 18, fontWeight: "700", color: COLORS.ink },
  statPillLabel: { fontSize: 10, color: COLORS.inkSoft, textAlign: "center" },

  achievementCard: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "rgba(251,191,36,0.15)", borderColor: "rgba(251,191,36,0.4)" },
  achievementEmoji: { fontSize: 28 },
  achievementTitle: { fontSize: 14, fontWeight: "700", color: "#92400e" },
  achievementDesc: { fontSize: 12, color: "#b45309", marginBottom: 6 },
});
