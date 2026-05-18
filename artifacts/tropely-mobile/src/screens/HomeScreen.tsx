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
import {
  COLORS, SHADOW, CARD_STYLE,
  MOOD_ATMOSPHERES, ALL_ATMOSPHERE_KEYS,
} from "@/constants/theme";
import { useAtmosphere } from "@/hooks/useAtmosphere";
import { useUser } from "@/context/AuthContext";

type Nav = NativeStackNavigationProp<RootStackParamList>;

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function getTimeGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

export default function HomeScreen() {
  const nav = useNavigation<Nav>();
  const user = useUser();

  const books = useStore((s) => s.books);
  const sessions = useStore((s) => s.sessions);
  const activeFocusBookId = useStore((s) => s.activeFocusBookId);
  const setActiveFocusBook = useStore((s) => s.setActiveFocusBook);
  const activeMood = useStore((s) => s.activeMood);
  const moodAtmosphereOverride = useStore((s) => s.moodAtmosphereOverride);
  const setMoodAtmosphereOverride = useStore((s) => s.setMoodAtmosphereOverride);
  const dailyGoalPages = useStore((s) => s.dailyGoalPages);
  const dailyGoalMinutes = useStore((s) => s.dailyGoalMinutes);
  const annualGoal = useStore((s) => s.annualGoal);
  const inbox = useStore((s) => s.inbox);
  const activeSession = useStore((s) => s.activeSession);
  const startSession = useStore((s) => s.startSession);
  const pauseSession = useStore((s) => s.pauseSession);
  const resumeSession = useStore((s) => s.resumeSession);

  const currentBooks = useMemo(() => books.filter((b) => b.shelf === "reading"), [books]);
  const focusBook = useMemo(
    () => currentBooks.find((b) => b.id === activeFocusBookId) ?? currentBooks[0] ?? null,
    [currentBooks, activeFocusBookId],
  );
  const finishedCount = useMemo(() => books.filter((b) => b.shelf === "finished").length, [books]);

  const atmosphere = useAtmosphere();

  const headline = useMemo(
    () => atmosphere.headlines[Math.floor(Math.random() * atmosphere.headlines.length)],
    [atmosphere],
  );

  const isDark = atmosphere.isDark;
  const textColor = isDark ? "#ffffff" : COLORS.ink;
  const textColorSoft = isDark ? "rgba(255,255,255,0.6)" : COLORS.inkSoft;
  const textColorMid = isDark ? "rgba(255,255,255,0.8)" : COLORS.inkMid;

  const today = todayKey();
  const todaySessions = sessions.filter((s) => s.date.startsWith(today));
  const todayPages = todaySessions.reduce((sum, s) => sum + (s.toPage - s.fromPage), 0);
  const todayMinutes = todaySessions.reduce((sum, s) => sum + (s.minutes ?? 0), 0);
  const streak = useMemo(() => computeStreak(sessions), [sessions]);

  const unreadCount = inbox.filter((i) => !i.read).length;
  const displayName = user?.displayName?.split(" ")[0] ?? user?.email?.split("@")[0] ?? "Reader";

  const isAudio = (book: typeof focusBook) =>
    book?.consumption === "listen" || book?.readingFormat === "audiobook";

  const sessionLabel = (): string => {
    const audio = isAudio(focusBook);
    if (!activeSession || activeSession.bookId !== focusBook?.id) {
      return audio ? "Start Listening →" : "Start Reading →";
    }
    if (activeSession.state === "paused") {
      return audio ? "Resume Listening →" : "Resume Reading →";
    }
    return audio ? "Pause Listening" : "Pause Reading";
  };

  const handleSessionCTA = () => {
    if (!focusBook) return;
    if (!activeSession || activeSession.bookId !== focusBook.id) {
      startSession(focusBook.id, isAudio(focusBook) ? "audiobook" : "physical");
    } else if (activeSession.state === "active") {
      pauseSession();
    } else {
      resumeSession();
    }
  };

  const challengePct = annualGoal > 0 ? Math.min(1, finishedCount / annualGoal) : 0;
  const nearMilestone = finishedCount + 2 >= annualGoal && finishedCount < annualGoal;
  const sessionsToday = todaySessions.length;
  const sessionsNeeded = Math.max(0, 3 - sessionsToday);

  const cardBg = { backgroundColor: atmosphere.cardTint };

  function BookProgressCard({ book, isFocus }: { book: NonNullable<typeof focusBook>; isFocus: boolean }) {
    const audio = isAudio(book);
    const pct = audio
      ? book.totalDurationMinutes
        ? Math.min(1, (book.audioMinutes ?? 0) / book.totalDurationMinutes)
        : 0
      : book.pages > 0
      ? Math.min(1, book.progress / book.pages)
      : 0;

    return (
      <TouchableOpacity
        style={[styles.bookCard, cardBg, { borderColor: isFocus ? atmosphere.accentColor : "rgba(255,255,255,0.6)" }]}
        onPress={() => {
          if (!isFocus) setActiveFocusBook(book.id);
        }}
        activeOpacity={0.85}
      >
        {/* Cover placeholder */}
        <View style={[styles.bookCover, { backgroundColor: atmosphere.glowColor }]}>
          <Text style={styles.coverInitial}>{book.title[0]}</Text>
        </View>

        <View style={styles.bookCardInfo}>
          <Text style={[styles.bookTitle, { color: textColor }]} numberOfLines={2}>
            {book.title}
          </Text>
          <Text style={[styles.bookAuthor, { color: textColorSoft }]} numberOfLines={1}>
            {book.author}
          </Text>

          {/* Format label */}
          <View style={[styles.formatTag, { backgroundColor: atmosphere.glowColor }]}>
            <Text style={[styles.formatTagText, { color: atmosphere.accentColor }]}>
              {audio ? "Listening" : "Reading"}
            </Text>
          </View>

          {/* Progress bar */}
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressBar,
                { width: `${pct * 100}%`, backgroundColor: atmosphere.progressColor },
              ]}
            />
          </View>

          <Text style={[styles.progressText, { color: textColorSoft }]}>
            {audio
              ? `${book.audioMinutes ?? 0} / ${book.totalDurationMinutes ?? "?"} min`
              : `p. ${book.progress} / ${book.pages}`}
            {"  "}
            {Math.round(pct * 100)}%
          </Text>

          {/* Mood tag */}
          {book.mood && (
            <Text style={[styles.moodTag, { color: textColorSoft }]}>{book.mood}</Text>
          )}

          {/* Set as focus tap hint */}
          {!isFocus && (
            <Text style={[styles.setFocusHint, { color: atmosphere.accentColor }]}>
              Tap to set as focus
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <GradientView
        colors={atmosphere.gradient}
        style={styles.gradient}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Top row */}
          <View style={styles.topRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.greeting, { color: textColorMid }]}>
                Good {getTimeGreeting()}, {displayName} {getTimeGreeting() === "morning" ? "☕" : getTimeGreeting() === "afternoon" ? "📖" : "🌙"}
              </Text>
              <Text style={[styles.headline, { color: textColor }]} numberOfLines={2}>
                {headline}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.inboxBtn, { backgroundColor: atmosphere.glowColor }]}
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

          {/* Currently Reading section */}
          <View>
            <Text style={[styles.sectionLabel, { color: textColorSoft }]}>
              {currentBooks.length > 0
                ? currentBooks.length === 1
                  ? "Currently Reading"
                  : "Currently Reading"
                : "Start Your Journey"}
            </Text>

            {currentBooks.length === 0 && (
              <TouchableOpacity
                style={[styles.emptyCard, cardBg]}
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
                  <View key={book.id} style={{ width: 260 }}>
                    <BookProgressCard book={book} isFocus={book.id === (activeFocusBookId ?? currentBooks[0]?.id)} />
                  </View>
                ))}
              </ScrollView>
            )}
          </View>

          {/* Session CTA for focus book */}
          {focusBook && (
            <View style={styles.ctaBlock}>
              <TouchableOpacity
                style={[styles.sessionCTA, { backgroundColor: atmosphere.accentColor }]}
                onPress={handleSessionCTA}
                activeOpacity={0.85}
              >
                <Text style={styles.sessionCTAText}>{sessionLabel()}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => nav.navigate("BookDetail", { bookId: focusBook.id })}>
                <Text style={[styles.logManuallyLink, { color: atmosphere.accentColor }]}>
                  Log Manually
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Mood chip selector */}
          <View>
            <Text style={[styles.sectionLabel, { color: textColorSoft }]}>Today's Vibe</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingRight: 8 }}
            >
              {ALL_ATMOSPHERE_KEYS.map((key) => {
                const atm = MOOD_ATMOSPHERES[key];
                const selected = moodAtmosphereOverride === key;
                return (
                  <TouchableOpacity
                    key={key}
                    onPress={() => setMoodAtmosphereOverride(selected ? null : key)}
                    style={[
                      styles.moodChip,
                      {
                        backgroundColor: selected ? atm.glowColor : "rgba(255,255,255,0.4)",
                        borderColor: selected ? atm.accentColor : "rgba(255,255,255,0.5)",
                      },
                    ]}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.moodChipEmoji}>{atm.emoji}</Text>
                    <Text style={[styles.moodChipLabel, { color: selected ? atm.accentColor : textColorMid }]}>
                      {atm.label.split(" & ")[0]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
              {moodAtmosphereOverride && (
                <TouchableOpacity
                  onPress={() => setMoodAtmosphereOverride(null)}
                  style={[styles.moodChip, { backgroundColor: "rgba(255,255,255,0.4)", borderColor: "rgba(255,255,255,0.5)" }]}
                  activeOpacity={0.8}
                >
                  <Text style={styles.moodChipEmoji}>📚</Text>
                  <Text style={[styles.moodChipLabel, { color: textColorMid }]}>Match my book</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>

          {/* Achievement callout */}
          <View style={[styles.achievementCard, cardBg, { shadowColor: atmosphere.glowColor }]}>
            <Text style={styles.achievementEmoji}>✨</Text>
            <View style={{ flex: 1 }}>
              {nearMilestone ? (
                <>
                  <Text style={[styles.achievementTitle, { color: textColor }]}>Almost there!</Text>
                  <Text style={[styles.achievementDesc, { color: textColorSoft }]}>
                    {annualGoal - finishedCount} more book{annualGoal - finishedCount !== 1 ? "s" : ""} to reach your {annualGoal}-book goal
                  </Text>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressBar, { width: `${challengePct * 100}%`, backgroundColor: atmosphere.progressColor }]} />
                  </View>
                </>
              ) : sessionsNeeded > 0 ? (
                <>
                  <Text style={[styles.achievementTitle, { color: textColor }]}>Almost there</Text>
                  <Text style={[styles.achievementDesc, { color: textColorSoft }]}>
                    {sessionsNeeded} more session{sessionsNeeded !== 1 ? "s" : ""} for Cozy Starter
                  </Text>
                </>
              ) : (
                <>
                  <Text style={[styles.achievementTitle, { color: textColor }]}>Great reading day!</Text>
                  <Text style={[styles.achievementDesc, { color: textColorSoft }]}>
                    You've logged {sessionsToday} session{sessionsToday !== 1 ? "s" : ""} today
                  </Text>
                </>
              )}
            </View>
          </View>

          {/* Streak + goal pills */}
          <View style={styles.statsRow}>
            <View style={[styles.statPill, cardBg, { shadowColor: atmosphere.glowColor }]}>
              <Text style={styles.statPillEmoji}>🔥</Text>
              <Text style={[styles.statPillValue, { color: textColor }]}>{streak}</Text>
              <Text style={[styles.statPillLabel, { color: textColorSoft }]}>day streak</Text>
            </View>
            <View style={[styles.statPill, cardBg, { shadowColor: atmosphere.glowColor }]}>
              <Text style={styles.statPillEmoji}>📖</Text>
              <Text style={[styles.statPillValue, { color: textColor }]}>{todayPages}</Text>
              <Text style={[styles.statPillLabel, { color: textColorSoft }]}>/ {dailyGoalPages} pages</Text>
            </View>
            <View style={[styles.statPill, cardBg, { shadowColor: atmosphere.glowColor }]}>
              <Text style={styles.statPillEmoji}>⏱</Text>
              <Text style={[styles.statPillValue, { color: textColor }]}>{todayMinutes}</Text>
              <Text style={[styles.statPillLabel, { color: textColorSoft }]}>/ {dailyGoalMinutes} min</Text>
            </View>
          </View>

        </ScrollView>
      </GradientView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  gradient: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 16, paddingBottom: 96 },

  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  greeting: { fontSize: 13, fontWeight: "500", marginBottom: 2 },
  headline: { fontSize: 20, fontWeight: "700", lineHeight: 26 },

  inboxBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.5)",
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

  sectionLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 8,
  },

  bookCard: {
    flexDirection: "row",
    gap: 12,
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
    ...SHADOW,
  },
  bookCover: {
    width: 56,
    height: 80,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  coverInitial: { fontSize: 22, fontWeight: "700", color: "#fff" },
  bookCardInfo: { flex: 1, gap: 4 },
  bookTitle: { fontSize: 15, fontWeight: "700", lineHeight: 20 },
  bookAuthor: { fontSize: 12 },
  formatTag: {
    alignSelf: "flex-start",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 2,
  },
  formatTagText: { fontSize: 10, fontWeight: "700" },
  progressTrack: {
    height: 4,
    backgroundColor: "rgba(0,0,0,0.1)",
    borderRadius: 2,
    overflow: "hidden",
    marginTop: 6,
  },
  progressBar: { height: "100%", borderRadius: 2 },
  progressText: { fontSize: 11, marginTop: 2 },
  moodTag: { fontSize: 10, fontStyle: "italic", marginTop: 2 },
  setFocusHint: { fontSize: 10, fontWeight: "600", marginTop: 4 },

  emptyCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.6)",
    padding: 28,
    alignItems: "center",
    gap: 8,
    ...SHADOW,
  },
  emptyEmoji: { fontSize: 36 },
  emptyTitle: { fontSize: 16, fontWeight: "700" },
  emptyHint: { fontSize: 13, textAlign: "center" },

  ctaBlock: { gap: 8 },
  sessionCTA: {
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: "center",
  },
  sessionCTAText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  logManuallyLink: {
    textAlign: "center",
    fontSize: 13,
    fontWeight: "600",
  },

  moodChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  moodChipEmoji: { fontSize: 14 },
  moodChipLabel: { fontSize: 12, fontWeight: "500" },

  achievementCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.5)",
    padding: 16,
    ...SHADOW,
  },
  achievementEmoji: { fontSize: 26 },
  achievementTitle: { fontSize: 14, fontWeight: "700" },
  achievementDesc: { fontSize: 12, marginTop: 2 },

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
  statPillValue: { fontSize: 18, fontWeight: "700" },
  statPillLabel: { fontSize: 10, textAlign: "center" },
});
