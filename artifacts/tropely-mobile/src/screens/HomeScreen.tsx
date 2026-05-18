import React, { useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/navigation";
import { useStore, computeStreak } from "@/store";
import MoodBackground from "@/theme/MoodBackground";
import { useTheme } from "@/theme/ThemeContext";
import { MOOD_ATMOSPHERES, ALL_ATMOSPHERE_KEYS } from "@/constants/theme";

type Nav = NativeStackNavigationProp<RootStackParamList>;

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function getGreeting(displayName: string): string {
  const hour = new Date().getHours();
  const name = displayName ? displayName.split(" ")[0] : "reader";
  if (hour < 12) return `Good morning, ${name} ☕`;
  if (hour < 17) return `Good afternoon, ${name} ✨`;
  return `Good evening, ${name} 🌙`;
}

export default function HomeScreen() {
  const nav = useNavigation<Nav>();
  const { themeId, theme } = useTheme();

  const displayName = useStore((s) => s.displayName);
  const books = useStore((s) => s.books);
  const sessions = useStore((s) => s.sessions);
  const activeFocusBookId = useStore((s) => s.activeFocusBookId);
  const setActiveFocusBook = useStore((s) => s.setActiveFocusBook);
  const moodAtmosphereOverride = useStore((s) => s.moodAtmosphereOverride);
  const setMoodAtmosphereOverride = useStore((s) => s.setMoodAtmosphereOverride);
  const dailyGoalPages = useStore((s) => s.dailyGoalPages);
  const inbox = useStore((s) => s.inbox);
  const activeSession = useStore((s) => s.activeSession);
  const startSession = useStore((s) => s.startSession);

  const currentBooks = useMemo(() => books.filter((b) => b.shelf === "reading"), [books]);
  const focusBook = useMemo(
    () => currentBooks.find((b) => b.id === activeFocusBookId) ?? currentBooks[0] ?? null,
    [currentBooks, activeFocusBookId],
  );

  const headline = useMemo(() => {
    const options = theme.headlines;
    const hour = new Date().getHours();
    return options[hour < 14 ? 0 : 1];
  }, [theme]);

  const { isDark } = theme;
  const textColor = isDark ? "#ffffff" : "#1a1a1a";
  const textColorSoft = isDark ? "rgba(255,255,255,0.55)" : "#9ca3af";
  const textColorMid = isDark ? "rgba(255,255,255,0.80)" : "#5a5a6a";

  const today = todayKey();
  const todaySessions = sessions.filter((s) => s.date.startsWith(today));
  const streak = useMemo(() => computeStreak(sessions), [sessions]);
  const sessionsToday = todaySessions.length;
  const sessionsNeeded = Math.max(0, 3 - sessionsToday);
  const unreadCount = inbox.filter((i) => !i.read).length;

  const isAudio = (book: typeof focusBook) =>
    book?.consumption === "listen" || book?.readingFormat === "audiobook";

  const hasActiveSession =
    activeSession &&
    focusBook &&
    activeSession.bookId === focusBook.id &&
    (activeSession.state === "active" || activeSession.state === "paused");

  const sessionLabel = (): string => {
    const audio = isAudio(focusBook);
    if (!hasActiveSession) return audio ? "Start Listening →" : "Start Reading →";
    return audio ? "Resume Listening →" : "Resume Reading →";
  };

  const handleSessionCTA = () => {
    if (!focusBook) return;
    if (!hasActiveSession) {
      startSession(focusBook.id, isAudio(focusBook) ? "audiobook" : "physical", focusBook.progress);
    }
  };

  const cardBg = isDark
    ? theme.colors.card
    : "rgba(255,255,255,0.72)";

  const cardBorder = isDark
    ? "rgba(255,255,255,0.10)"
    : "rgba(255,255,255,0.75)";

  function BookProgressCard({ book, isFocus }: { book: NonNullable<typeof focusBook>; isFocus: boolean }) {
    const audio = isAudio(book);
    const pct = audio
      ? book.totalDurationMinutes
        ? Math.min(1, (book.audioMinutes ?? 0) / book.totalDurationMinutes)
        : 0
      : book.pages > 0
      ? Math.min(1, book.progress / book.pages)
      : 0;

    const progressText = audio
      ? `${book.audioMinutes ?? 0} / ${book.totalDurationMinutes ?? "?"} min  ${Math.round(pct * 100)}%`
      : `p. ${book.progress} / ${book.pages}  ${Math.round(pct * 100)}%`;

    const statusLabel = audio ? "Listening" : "Reading";

    return (
      <TouchableOpacity
        style={[styles.bookCard, { backgroundColor: cardBg, borderColor: cardBorder, shadowColor: isDark ? "#000" : "#c0a0b0" }]}
        onPress={() => { if (!isFocus) setActiveFocusBook(book.id); }}
        activeOpacity={0.88}
      >
        <View style={styles.bookRow}>
          {/* Cover */}
          <View style={[styles.bookCover, { backgroundColor: theme.colors.accent + "33" }]}>
            <Text style={styles.coverEmoji}>{audio ? "🎧" : "📕"}</Text>
          </View>

          <View style={styles.bookInfo}>
            <Text style={[styles.bookTitle, { color: textColor }]} numberOfLines={2}>
              {book.title}
            </Text>
            <Text style={[styles.bookAuthor, { color: textColorSoft }]} numberOfLines={1}>
              {book.author}
            </Text>
            {/* Status chip */}
            <View style={[styles.statusChip, { backgroundColor: theme.colors.accent + "22", borderColor: theme.colors.accent + "55" }]}>
              <Text style={[styles.statusChipText, { color: theme.colors.accent }]}>
                {statusLabel}
              </Text>
            </View>
            {/* Progress */}
            <Text style={[styles.progressText, { color: textColorSoft }]}>{progressText}</Text>
            <View style={[styles.progressTrack, { backgroundColor: isDark ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.10)" }]}>
              <View style={[styles.progressFill, { width: `${Math.round(pct * 100)}%`, backgroundColor: theme.colors.button }]} />
            </View>
          </View>
        </View>

        {isFocus && (
          <>
            <TouchableOpacity
              style={[styles.sessionBtn, { backgroundColor: theme.colors.button }]}
              onPress={handleSessionCTA}
              activeOpacity={0.85}
            >
              <Text style={[styles.sessionBtnText, { color: theme.colors.buttonText }]}>{sessionLabel()}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => nav.navigate("BookDetail", { bookId: book.id })}>
              <Text style={[styles.logLink, { color: theme.colors.accent }]}>Log Manually</Text>
            </TouchableOpacity>
          </>
        )}

        {!isFocus && (
          <Text style={[styles.tapFocus, { color: theme.colors.accent }]}>Tap to set as focus</Text>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <MoodBackground themeId={themeId} style={styles.root}>
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Top bar: greeting + inbox */}
          <View style={styles.topBar}>
            <Text style={[styles.greeting, { color: textColorMid }]}>
              {getGreeting(displayName)}
            </Text>
            <TouchableOpacity
              style={[styles.inboxBtn, { backgroundColor: isDark ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.55)" }]}
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

          {/* Big mood headline */}
          <Text style={[styles.headline, { color: textColor }]}>{headline}</Text>

          {/* Currently Reading */}
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: textColorSoft }]}>Currently Reading</Text>

            {currentBooks.length === 0 && (
              <TouchableOpacity
                style={[styles.emptyCard, { backgroundColor: cardBg, borderColor: cardBorder }]}
                onPress={() => (nav as any).navigate("Discover")}
                activeOpacity={0.85}
              >
                <Text style={styles.emptyEmoji}>📖</Text>
                <Text style={[styles.emptyTitle, { color: textColor }]}>Add your first book →</Text>
                <Text style={[styles.emptyHint, { color: textColorSoft }]}>Browse Discover to get started</Text>
              </TouchableOpacity>
            )}

            {currentBooks.length === 1 && (
              <BookProgressCard book={currentBooks[0]} isFocus={true} />
            )}

            {currentBooks.length > 1 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 12, paddingRight: 4 }}
              >
                {currentBooks.map((book) => (
                  <View key={book.id} style={{ width: 285 }}>
                    <BookProgressCard
                      book={book}
                      isFocus={book.id === (activeFocusBookId ?? currentBooks[0]?.id)}
                    />
                  </View>
                ))}
              </ScrollView>
            )}
          </View>

          {/* Today's Vibe */}
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: textColorSoft }]}>Today's Vibe</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingRight: 8 }}
            >
              {ALL_ATMOSPHERE_KEYS.map((key) => {
                const atm = MOOD_ATMOSPHERES[key];
                const selected = moodAtmosphereOverride === key || (!moodAtmosphereOverride && key === themeId);
                return (
                  <TouchableOpacity
                    key={key}
                    onPress={() => setMoodAtmosphereOverride(selected && moodAtmosphereOverride ? null : key)}
                    style={[
                      styles.vibeChip,
                      {
                        backgroundColor: selected ? theme.colors.button : (isDark ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.55)"),
                        borderColor: selected ? theme.colors.button : (isDark ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.75)"),
                      },
                    ]}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.vibeChipEmoji}>{atm.emoji}</Text>
                    <Text style={[styles.vibeChipLabel, { color: selected ? "#fff" : textColorMid }]}>
                      {atm.label.split(" & ")[0].split(" / ")[0]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
              {moodAtmosphereOverride && (
                <TouchableOpacity
                  onPress={() => setMoodAtmosphereOverride(null)}
                  style={[styles.vibeChip, { backgroundColor: isDark ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.55)", borderColor: isDark ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.75)" }]}
                  activeOpacity={0.8}
                >
                  <Text style={styles.vibeChipEmoji}>🔄</Text>
                  <Text style={[styles.vibeChipLabel, { color: textColorMid }]}>Match my book</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>

          {/* Achievement card */}
          <View style={[styles.achievementCard, { backgroundColor: cardBg, borderColor: cardBorder, shadowColor: isDark ? "#000" : "#c0a0b0" }]}>
            <View style={styles.achievementRow}>
              <Text style={styles.achievementIcon}>✨</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.achievementTitle, { color: textColor }]}>
                  {sessionsNeeded > 0 ? "Almost There" : "Goal Reached!"}
                </Text>
                <Text style={[styles.achievementBody, { color: textColorSoft }]}>
                  {sessionsNeeded > 0
                    ? `${sessionsNeeded} more session${sessionsNeeded !== 1 ? "s" : ""} for Cozy Starter`
                    : "You've hit your session goal today."}
                </Text>
              </View>
            </View>
            <View style={[styles.progressTrack, { backgroundColor: isDark ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.10)", marginTop: 10 }]}>
              <View style={[styles.progressFill, { width: `${Math.min(100, (sessionsToday / 3) * 100)}%`, backgroundColor: theme.colors.button }]} />
            </View>
          </View>

          {/* Stats pills */}
          <View style={styles.statsRow}>
            <View style={[styles.statPill, { backgroundColor: isDark ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.55)" }]}>
              <Text style={[styles.statText, { color: textColor }]}>🔥 {streak} day streak</Text>
            </View>
            <View style={[styles.statPill, { backgroundColor: isDark ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.55)" }]}>
              <Text style={[styles.statText, { color: textColor }]}>📖 {dailyGoalPages}pg goal</Text>
            </View>
          </View>

        </ScrollView>
      </SafeAreaView>
    </MoodBackground>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 100, gap: 20 },

  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: -4,
  },
  greeting: {
    fontSize: 14,
    fontWeight: "500",
    letterSpacing: 0.1,
  },
  inboxBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  inboxEmoji: { fontSize: 17 },
  inboxBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#ef4444",
    justifyContent: "center",
    alignItems: "center",
  },
  inboxBadgeText: { fontSize: 9, color: "#fff", fontWeight: "700" },

  headline: {
    fontSize: 31,
    fontWeight: "800",
    lineHeight: 38,
    letterSpacing: -0.5,
  },

  section: { gap: 10 },
  sectionLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.9,
    textTransform: "uppercase",
  },

  // Book card
  bookCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
    gap: 12,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 14,
    elevation: 5,
  },
  bookRow: { flexDirection: "row", gap: 13 },
  bookCover: {
    width: 72,
    height: 100,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  coverEmoji: { fontSize: 30 },
  bookInfo: { flex: 1, gap: 5, justifyContent: "center" },
  bookTitle: { fontSize: 16, fontWeight: "700", lineHeight: 21 },
  bookAuthor: { fontSize: 12, fontWeight: "400" },
  statusChip: {
    alignSelf: "flex-start",
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 2,
  },
  statusChipText: { fontSize: 11, fontWeight: "600" },
  progressText: { fontSize: 11, marginTop: 2 },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: { height: "100%", borderRadius: 2 },

  sessionBtn: {
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
  },
  sessionBtnText: { fontSize: 16, fontWeight: "700" },
  logLink: { textAlign: "center", fontSize: 13, fontWeight: "600", paddingVertical: 4 },
  tapFocus: { fontSize: 10, fontWeight: "600", textAlign: "center", paddingTop: 4 },

  emptyCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 28,
    alignItems: "center",
    gap: 8,
  },
  emptyEmoji: { fontSize: 38 },
  emptyTitle: { fontSize: 16, fontWeight: "700" },
  emptyHint: { fontSize: 13, textAlign: "center" },

  // Vibe chips
  vibeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  vibeChipEmoji: { fontSize: 13 },
  vibeChipLabel: { fontSize: 12, fontWeight: "500" },

  // Achievement card
  achievementCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.13,
    shadowRadius: 10,
    elevation: 3,
  },
  achievementRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  achievementIcon: { fontSize: 20, marginTop: 1 },
  achievementTitle: { fontSize: 14, fontWeight: "700", marginBottom: 2 },
  achievementBody: { fontSize: 12, lineHeight: 17 },

  // Stats row
  statsRow: { flexDirection: "row", gap: 10 },
  statPill: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 9 },
  statText: { fontSize: 13, fontWeight: "600" },
});
