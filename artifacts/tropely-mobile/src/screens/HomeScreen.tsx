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
import { GradientView } from "@/components/GradientView";
import { AtmosphereDecor } from "@/components/AtmosphereDecor";
import {
  MOOD_ATMOSPHERES, ALL_ATMOSPHERE_KEYS,
} from "@/constants/theme";
import { useAtmosphere, useAtmosphereKey } from "@/hooks/useAtmosphere";

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

  const atmosphere = useAtmosphere();
  const atmosphereKey = useAtmosphereKey();

  const headline = useMemo(
    () => atmosphere.headlines[Math.floor(Math.random() * atmosphere.headlines.length)],
    [atmosphere],
  );

  const isDark = atmosphere.isDark;
  const textColor = isDark ? "#ffffff" : "#1a1a1a";
  const textColorSoft = isDark ? "rgba(255,255,255,0.6)" : "#9ca3af";
  const textColorMid = isDark ? "rgba(255,255,255,0.8)" : "#4a4a5a";

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
    if (!hasActiveSession) {
      return audio ? "Start Listening →" : "Start Reading →";
    }
    return audio ? "Resume Listening →" : "Resume Reading →";
  };

  const handleSessionCTA = () => {
    if (!focusBook) return;
    if (!hasActiveSession) {
      startSession(focusBook.id, isAudio(focusBook) ? "audiobook" : "physical", focusBook.progress);
    }
  };

  const glassCard = [styles.glassCard, {
    backgroundColor: atmosphere.cardTint,
    shadowColor: isDark ? "#000" : "#c0a0b0",
  }];

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
      ? `${book.audioMinutes ?? 0} / ${book.totalDurationMinutes ?? "?"} min · ${Math.round(pct * 100)}%`
      : `pg ${book.progress} / ${book.pages} · ${Math.round(pct * 100)}%`;

    return (
      <TouchableOpacity
        style={[
          styles.bookCard,
          {
            backgroundColor: atmosphere.cardTint,
            borderColor: isFocus ? atmosphere.accentColor : "rgba(255,255,255,0.5)",
            shadowColor: isDark ? "#000" : "#c0a0b0",
          },
        ]}
        onPress={() => {
          if (!isFocus) setActiveFocusBook(book.id);
        }}
        activeOpacity={0.85}
      >
        <View style={styles.bookRow}>
          {/* Book cover placeholder */}
          <View style={[styles.bookCover, { backgroundColor: atmosphere.glowColor }]}>
            <Text style={styles.coverEmoji}>{book.mood ? "📖" : "📚"}</Text>
          </View>

          <View style={styles.bookInfo}>
            <Text style={[styles.bookTitle, { color: textColor }]} numberOfLines={2}>
              {book.title}
            </Text>
            <Text style={[styles.bookAuthor, { color: textColorSoft }]} numberOfLines={1}>
              {book.author}
            </Text>

            {/* Format tag pill */}
            <View style={[styles.formatPill, { backgroundColor: atmosphere.glowColor }]}>
              <Text style={[styles.formatPillText, { color: atmosphere.accentColor }]}>
                {audio ? "🎧 Listening" : "📖 Reading"}
              </Text>
            </View>

            {/* Progress text */}
            <Text style={[styles.progressText, { color: textColorSoft }]}>
              {progressText}
            </Text>

            {/* Progress bar */}
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressBar,
                  { width: `${Math.round(pct * 100)}%`, backgroundColor: atmosphere.progressColor },
                ]}
              />
            </View>
          </View>
        </View>

        {isFocus && (
          <>
            <TouchableOpacity
              style={[styles.sessionBtn, { backgroundColor: atmosphere.accentColor }]}
              onPress={handleSessionCTA}
              activeOpacity={0.85}
            >
              <Text style={styles.sessionBtnText}>{sessionLabel()}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => nav.navigate("BookDetail", { bookId: book.id })}>
              <Text style={[styles.logManuallyLink, { color: atmosphere.accentColor }]}>
                Log Manually
              </Text>
            </TouchableOpacity>
          </>
        )}

        {!isFocus && (
          <Text style={[styles.tapToFocus, { color: atmosphere.accentColor }]}>
            Tap to set as focus
          </Text>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <GradientView colors={atmosphere.gradient} style={styles.gradient}>
      <AtmosphereDecor atmosphere={atmosphereKey} />
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Top row: label + inbox icon */}
          <View style={styles.topRow}>
            <Text style={[styles.topLabel, { color: textColorSoft }]}>TODAY'S READING</Text>
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

          {/* Personalized greeting */}
          <Text style={[styles.headline, { color: textColor }]}>
            {getGreeting(displayName)}
          </Text>
          {/* Atmosphere headline */}
          <Text style={[styles.subHeadline, { color: textColorMid }]}>
            {headline}
          </Text>

          {/* Currently Reading section */}
          <View>
            <Text style={[styles.sectionLabel, { color: textColorSoft }]}>Currently Reading</Text>

            {currentBooks.length === 0 && (
              <TouchableOpacity
                style={[...glassCard, styles.emptyCard]}
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
                  <View key={book.id} style={{ width: 280 }}>
                    <BookProgressCard
                      book={book}
                      isFocus={book.id === (activeFocusBookId ?? currentBooks[0]?.id)}
                    />
                  </View>
                ))}
              </ScrollView>
            )}
          </View>

          {/* Today's Vibe section */}
          <View>
            <Text style={[styles.sectionLabel, { color: textColorSoft }]}>Today's Vibe</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingRight: 8 }}
            >
              {ALL_ATMOSPHERE_KEYS.map((key) => {
                const atm = MOOD_ATMOSPHERES[key];
                const selected = moodAtmosphereOverride === key || (!moodAtmosphereOverride && key === atmosphereKey);
                return (
                  <TouchableOpacity
                    key={key}
                    onPress={() => setMoodAtmosphereOverride(selected && moodAtmosphereOverride ? null : key)}
                    style={[
                      styles.vibeChip,
                      {
                        backgroundColor: selected ? atmosphere.accentColor : "rgba(255,255,255,0.25)",
                        borderColor: selected ? atmosphere.accentColor : "rgba(255,255,255,0.4)",
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
                  style={[styles.vibeChip, { backgroundColor: "rgba(255,255,255,0.25)", borderColor: "rgba(255,255,255,0.4)" }]}
                  activeOpacity={0.8}
                >
                  <Text style={styles.vibeChipEmoji}>🔄</Text>
                  <Text style={[styles.vibeChipLabel, { color: textColorMid }]}>Match my book</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>

          {/* Achievement card */}
          <View style={[...glassCard, styles.achievementCard]}>
            <Text style={[styles.sectionLabel, { color: textColorSoft }]}>Achievement</Text>
            <Text style={[styles.achievementText, { color: textColor }]}>
              {sessionsNeeded > 0
                ? `✨ Almost there · ${sessionsNeeded} more session${sessionsNeeded !== 1 ? "s" : ""} for Cozy Starter`
                : "✨ Great reading day! You've hit your session goal."}
            </Text>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressBar,
                  {
                    width: `${Math.min(100, (sessionsToday / 3) * 100)}%`,
                    backgroundColor: atmosphere.progressColor,
                  },
                ]}
              />
            </View>
          </View>

          {/* Stats row */}
          <View style={styles.statsRow}>
            <View style={[styles.statPill, { backgroundColor: "rgba(255,255,255,0.35)" }]}>
              <Text style={[styles.statText, { color: textColor }]}>🔥 {streak} day streak</Text>
            </View>
            <View style={[styles.statPill, { backgroundColor: "rgba(255,255,255,0.35)" }]}>
              <Text style={[styles.statText, { color: textColor }]}>📖 {dailyGoalPages}pg goal</Text>
            </View>
          </View>

        </ScrollView>
      </SafeAreaView>
    </GradientView>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safe: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 18, paddingBottom: 96 },

  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  topLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  inboxBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.35)",
    justifyContent: "center",
    alignItems: "center",
  },
  inboxEmoji: { fontSize: 16 },
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
    fontSize: 28,
    fontWeight: "700",
    lineHeight: 34,
  },

  subHeadline: {
    fontSize: 15,
    fontWeight: "500",
    lineHeight: 22,
    marginTop: -10,
  },

  sectionLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginBottom: 8,
  },

  // Glass card base
  glassCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.5)",
    padding: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },

  // Book card
  bookCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
    gap: 12,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  bookRow: {
    flexDirection: "row",
    gap: 12,
  },
  bookCover: {
    width: 70,
    height: 90,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  coverEmoji: { fontSize: 28 },
  bookInfo: { flex: 1, gap: 4, justifyContent: "center" },
  bookTitle: { fontSize: 15, fontWeight: "700", lineHeight: 20 },
  bookAuthor: { fontSize: 12 },
  formatPill: {
    alignSelf: "flex-start",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 2,
  },
  formatPillText: { fontSize: 11, fontWeight: "600" },
  progressText: { fontSize: 11, marginTop: 4 },
  progressTrack: {
    height: 4,
    backgroundColor: "rgba(0,0,0,0.1)",
    borderRadius: 2,
    overflow: "hidden",
    marginTop: 4,
  },
  progressBar: { height: "100%", borderRadius: 2 },

  sessionBtn: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  sessionBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  logManuallyLink: {
    textAlign: "center",
    fontSize: 13,
    fontWeight: "600",
    paddingVertical: 4,
  },
  tapToFocus: {
    fontSize: 10,
    fontWeight: "600",
    textAlign: "center",
    paddingTop: 4,
  },

  emptyCard: {
    alignItems: "center",
    gap: 8,
    paddingVertical: 28,
  },
  emptyEmoji: { fontSize: 36 },
  emptyTitle: { fontSize: 16, fontWeight: "700" },
  emptyHint: { fontSize: 13, textAlign: "center" },

  // Vibe chips
  vibeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  vibeChipEmoji: { fontSize: 14 },
  vibeChipLabel: { fontSize: 12, fontWeight: "500" },

  // Achievement card
  achievementCard: {
    gap: 8,
  },
  achievementText: { fontSize: 15, fontWeight: "600" },

  // Stats row
  statsRow: { flexDirection: "row", gap: 10 },
  statPill: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  statText: { fontSize: 13, fontWeight: "600" },
});
