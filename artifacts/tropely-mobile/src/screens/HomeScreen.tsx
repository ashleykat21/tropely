import React, { useMemo, useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  TextInput,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/navigation";
import { useStore, computeStreak } from "@/store";
import { useActivity } from "@/hooks/useActivity";
import { usePremium } from "@/hooks/usePremium";
import { LinearGradient } from "expo-linear-gradient";

type Nav = NativeStackNavigationProp<RootStackParamList>;

const MOODS: Record<string, { label: string; emoji: string; color: string; gradientHex: string }> = {
  hopeful: { label: "Hopeful", emoji: "🌱", color: "#d1fae5", gradientHex: "#d1fae5" },
  tense: { label: "Tense", emoji: "⚡", color: "#fee2e2", gradientHex: "#fee2e2" },
  melancholy: { label: "Melancholy", emoji: "🌧", color: "#e0e7ff", gradientHex: "#e0e7ff" },
  joyful: { label: "Joyful", emoji: "☀️", color: "#fef9c3", gradientHex: "#fef9c3" },
  romantic: { label: "Romantic", emoji: "🌹", color: "#fce7f3", gradientHex: "#fce7f3" },
  eerie: { label: "Eerie", emoji: "🌑", color: "#f3e8ff", gradientHex: "#f3e8ff" },
  reflective: { label: "Reflective", emoji: "🪞", color: "#f0fdf4", gradientHex: "#f0fdf4" },
  adventurous: { label: "Adventurous", emoji: "🧭", color: "#fff7ed", gradientHex: "#fff7ed" },
  cozy: { label: "Cozy", emoji: "🕯️", color: "#fef3c7", gradientHex: "#fef3c7" },
  intense: { label: "Intense", emoji: "🔥", color: "#fee2e2", gradientHex: "#fee2e2" },
};

type ActivityItem = {
  id: string;
  userId?: string;
  username?: string;
  avatarUrl?: string;
  action?: string;
  bookTitle?: string;
  tropes?: string[];
  mood?: string;
  createdAt?: string;
};

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

const CURRENT_YEAR = new Date().getFullYear();

// Skeleton placeholder for loading state
function SkeletonBookCard({ opacity }: { opacity: Animated.Value }) {
  return (
    <Animated.View style={[styles.skeletonCard, { opacity }]}>
      <View style={styles.skeletonCover} />
      <View style={{ flex: 1, gap: 8 }}>
        <View style={styles.skeletonLineWide} />
        <View style={styles.skeletonLineShort} />
        <View style={styles.skeletonTrack} />
      </View>
    </Animated.View>
  );
}

export default function HomeScreen() {
  const nav = useNavigation<Nav>();
  const { isPremium } = usePremium();
  const {
    books, sessions, currentId, setCurrent,
    dailyGoalPages, dailyGoalMinutes,
    annualGoal, setAnnualGoal, equippedBadgeId,
  } = useStore();

  const [mounted, setMounted] = useState(false);
  const skeletonOpacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(skeletonOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(skeletonOpacity, { toValue: 0.4, duration: 600, useNativeDriver: true }),
      ])
    );
    pulse.start();
    const timer = setTimeout(() => { setMounted(true); pulse.stop(); }, 350);
    return () => { clearTimeout(timer); pulse.stop(); };
  }, []);

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

  const wantBooks = useMemo(() => books.filter((b) => b.shelf === "want" && b.mood), [books]);
  const moodGroups = useMemo(() => {
    const groups: Record<string, typeof books> = {};
    for (const b of wantBooks) {
      if (b.mood) groups[b.mood] = [...(groups[b.mood] ?? []), b];
    }
    return groups;
  }, [wantBooks]);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const moodBooks = selectedMood ? (moodGroups[selectedMood] ?? []) : [];

  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState(annualGoal.toString());

  const saveGoal = () => {
    const n = parseInt(goalInput, 10);
    if (!isNaN(n) && n > 0) { setAnnualGoal(n); setEditingGoal(false); }
    else Alert.alert("Enter a valid number.");
  };

  const { data: activityData, isError: activityError } = useActivity();
  const activity: ActivityItem[] = useMemo(() => {
    if (!activityData) return [];
    const items = Array.isArray(activityData) ? activityData : (activityData.activity ?? activityData.items ?? []);
    return items.slice(0, 8);
  }, [activityData]);

  const challengePct = annualGoal > 0 ? Math.min(1, finishedCount / annualGoal) : 0;

  const BADGE_EMOJIS: Record<string, string> = {
    first_book: "📖", consistent_reader: "🔥", bookmarker: "🔖", finisher: "🏁",
    mood_reader: "🎭", night_owl: "🌙", bibliophile: "📚", speed_reader: "🏃",
    annotator: "💬", trope_hunter: "🎯", social_reader: "👯", dnf_queen: "💔",
    re_reader: "🔁", mood_traveller: "🌈", epic_reader: "🕯️", streak_master: "🏆",
    journaller: "✍️", critic: "🌟", trope_obsessed: "👑",
  };
  const equippedEmoji = equippedBadgeId ? (BADGE_EMOJIS[equippedBadgeId] ?? "") : "";

  const moodData = currentBook?.mood ? MOODS[currentBook.mood] : null;
  const gradientColors: readonly [string, string] = isPremium && moodData
    ? [moodData.gradientHex, "#fafaf9"]
    : ["#fafaf9", "#fafaf9"];

  const screenContent = (
    <View style={{ flex: 1 }}>
      {activityError && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineBannerText}>You're offline</Text>
        </View>
      )}
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>Tropely</Text>
          <View style={styles.headerRight}>
            {streak > 0 && (
              <View style={styles.streakBadge}>
                <Text style={styles.streakFlame}>🔥</Text>
                <Text style={styles.streakCount}>{streak}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Annual reading challenge */}
        <TouchableOpacity
          style={styles.card}
          onPress={() => { setGoalInput(annualGoal.toString()); setEditingGoal(true); }}
          activeOpacity={0.85}
        >
          <Text style={styles.cardLabel}>{CURRENT_YEAR} READING CHALLENGE</Text>
          {editingGoal ? (
            <View style={styles.goalEditRow}>
              <TextInput
                style={styles.goalInput}
                value={goalInput}
                onChangeText={setGoalInput}
                keyboardType="number-pad"
                autoFocus
                selectTextOnFocus
              />
              <Text style={styles.goalInputLabel}>books</Text>
              <TouchableOpacity style={styles.goalSaveBtn} onPress={saveGoal}>
                <Text style={styles.goalSaveBtnText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setEditingGoal(false)}>
                <Text style={styles.goalCancel}>Cancel</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.challengeRow}>
                <Text style={styles.challengeNum}>{finishedCount}</Text>
                <Text style={styles.challengeSep}>/</Text>
                <Text style={styles.challengeGoal}>{annualGoal} books</Text>
                <Text style={styles.challengeEdit}>  (tap to change)</Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressBar, { width: `${challengePct * 100}%` }]} />
              </View>
              <Text style={styles.challengeSub}>
                {annualGoal - finishedCount > 0
                  ? `${annualGoal - finishedCount} more to reach your goal`
                  : "Goal reached! 🎉"}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Daily readout */}
        {todaySessions.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>TODAY'S READING</Text>
            <View style={styles.progressRow}>
              <Text style={styles.statLabel}>Pages</Text>
              <View style={styles.progressTrack}>
                <View style={[styles.progressBar, { width: `${Math.min(100, (todayPages / dailyGoalPages) * 100)}%` }]} />
              </View>
              <Text style={styles.statValue}>{todayPages}/{dailyGoalPages}</Text>
            </View>
            {todayMinutes > 0 && (
              <View style={styles.progressRow}>
                <Text style={styles.statLabel}>Minutes</Text>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressBar, { width: `${Math.min(100, (todayMinutes / dailyGoalMinutes) * 100)}%` }]} />
                </View>
                <Text style={styles.statValue}>{todayMinutes}/{dailyGoalMinutes}</Text>
              </View>
            )}
          </View>
        )}

        {/* Trope Match CTA */}
        <TouchableOpacity style={styles.tropeMatchBtn} onPress={() => nav.navigate("TropeMatch")}>
          <Text style={styles.tropeMatchIcon}>🎭</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.tropeMatchTitle}>Find my next read by trope</Text>
            <Text style={styles.tropeMatchSub}>Match books to the tropes you're craving right now</Text>
          </View>
          <Text style={styles.tropeMatchArrow}>→</Text>
        </TouchableOpacity>

        {/* Mood TBR picker */}
        {Object.keys(moodGroups).length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>MOOD TBR PICKER</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
              {Object.keys(moodGroups).map((mood) => {
                const m = MOODS[mood];
                if (!m) return null;
                return (
                  <TouchableOpacity
                    key={mood}
                    onPress={() => setSelectedMood(selectedMood === mood ? null : mood)}
                    style={[styles.moodChip, { backgroundColor: m.color }, selectedMood === mood && styles.moodChipSelected]}
                  >
                    <Text style={styles.moodChipText}>{m.emoji} {m.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            {moodBooks.length > 0 && (
              <View style={styles.moodBooks}>
                {moodBooks.map((b) => (
                  <TouchableOpacity key={b.id} style={styles.moodBookRow} onPress={() => nav.navigate("BookDetail", { bookId: b.id })}>
                    {b.cover ? (
                      <Image source={{ uri: b.cover }} style={styles.moodBookCover} />
                    ) : (
                      <View style={[styles.moodBookCover, styles.coverPlaceholder]} />
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={styles.moodBookTitle} numberOfLines={1}>{b.title}</Text>
                      <Text style={styles.moodBookAuthor} numberOfLines={1}>{b.author}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Currently reading */}
        <Text style={styles.sectionTitle}>Currently reading</Text>
        {!mounted ? (
          <>
            <SkeletonBookCard opacity={skeletonOpacity} />
            <SkeletonBookCard opacity={skeletonOpacity} />
          </>
        ) : readingBooks.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>📖</Text>
            <Text style={styles.emptyText}>No books on your reading shelf yet.</Text>
            <Text style={styles.emptyHint}>Go to Discover to find your first read.</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => (nav as any).navigate("Discover")}>
              <Text style={styles.emptyBtnText}>Browse books</Text>
            </TouchableOpacity>
          </View>
        ) : (
          readingBooks.map((b) => {
            const isActive = b.id === activeBookId;
            const isAudio = b.consumption === "listen";
            const pct = b.pages > 0 ? Math.round((b.progress / b.pages) * 100) : 0;
            const audioPct = isAudio && b.audioMinutes
              ? Math.min(100, Math.round((b.audioMinutes / (b.pages * 0.5)) * 100))
              : 0;
            return (
              <TouchableOpacity
                key={b.id}
                style={[styles.bookCard, isActive && styles.bookCardActive]}
                onPress={() => {
                  if (!isActive) setCurrent(b.id);
                  nav.navigate("BookDetail", { bookId: b.id });
                }}
              >
                <View style={{ position: "relative" }}>
                  {b.cover ? (
                    <Image source={{ uri: b.cover }} style={styles.bookCover} />
                  ) : (
                    <View style={[styles.bookCover, styles.coverPlaceholder]} />
                  )}
                  {isActive && (
                    <View style={styles.nowReadingPill}>
                      <Text style={styles.nowReadingText}>NOW READING</Text>
                    </View>
                  )}
                </View>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={styles.bookTitle} numberOfLines={2}>{b.title}</Text>
                  <Text style={styles.bookAuthor}>{b.author}</Text>
                  {isAudio ? (
                    <>
                      <Text style={styles.audioLabel}>Currently listening 🎧</Text>
                      <View style={styles.progressRowInline}>
                        <View style={styles.progressTrack}>
                          <View style={[styles.progressBar, { width: `${audioPct}%` }]} />
                        </View>
                        <Text style={styles.progressPct}>{audioPct}%</Text>
                      </View>
                      <Text style={styles.pageProgress}>{b.audioMinutes ?? 0} mins listened</Text>
                    </>
                  ) : (
                    <>
                      <View style={styles.progressRowInline}>
                        <View style={styles.progressTrack}>
                          <View style={[styles.progressBar, { width: `${Math.min(100, pct)}%` }]} />
                        </View>
                        <Text style={styles.progressPct}>{pct}%</Text>
                      </View>
                      <Text style={styles.pageProgress}>p. {b.progress} / {b.pages}</Text>
                    </>
                  )}
                  {(b.tropes ?? []).length > 0 && (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 2 }}>
                      {b.tropes!.slice(0, 3).map((t) => (
                        <View key={t} style={styles.tropePill}>
                          <Text style={styles.tropePillText}>{t}</Text>
                        </View>
                      ))}
                    </ScrollView>
                  )}
                </View>
                <TouchableOpacity
                  style={styles.aiBtn}
                  onPress={() => nav.navigate("Companion", { bookId: b.id })}
                >
                  <Text style={styles.aiBtnText}>✨</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })
        )}

        {/* Friends activity feed */}
        <Text style={styles.sectionTitle}>Friends' reading</Text>
        <View style={styles.card}>
          {activity.length === 0 ? (
            <View style={styles.noActivity}>
              <Text style={styles.noActivityText}>No activity yet</Text>
              <Text style={styles.noActivitySub}>Follow friends to see their reading here.</Text>
            </View>
          ) : (
            activity.map((item, idx) => {
              const moodM = item.mood ? MOODS[item.mood] : null;
              return (
                <View key={item.id ?? idx} style={[styles.activityRow, idx > 0 && styles.activityDivider]}>
                  <View style={styles.activityAvatar}>
                    {item.avatarUrl ? (
                      <Image source={{ uri: item.avatarUrl }} style={styles.activityAvatarImg} />
                    ) : (
                      <Text style={styles.activityAvatarInitial}>
                        {(item.username ?? item.userId ?? "?")[0].toUpperCase()}
                      </Text>
                    )}
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={styles.activityText} numberOfLines={2}>
                      <Text style={styles.activityUser}>
                        {item.username ?? item.userId?.slice(0, 8) ?? "Someone"}
                        {equippedEmoji ? ` ${equippedEmoji}` : ""}{" "}
                      </Text>
                      <Text>{item.action ?? "read"} </Text>
                      {item.bookTitle && <Text style={styles.activityBook}>{item.bookTitle}</Text>}
                    </Text>
                    {(item.tropes ?? []).length > 0 && (
                      <Text style={styles.activityTropes} numberOfLines={1}>
                        {item.tropes!.slice(0, 2).join(" · ")}
                      </Text>
                    )}
                    {moodM && <Text style={styles.activityMood}>{moodM.emoji} {moodM.label}</Text>}
                  </View>
                  {item.createdAt && (
                    <Text style={styles.activityTime}>{relativeTime(item.createdAt)}</Text>
                  )}
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Floating ✨ companion button */}
      {currentBook && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => nav.navigate("Companion", { bookId: currentBook.id })}
          activeOpacity={0.85}
        >
          <Text style={styles.fabText}>✨</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (isPremium && moodData) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <LinearGradient
          colors={gradientColors}
          style={{ flex: 1 }}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 0.35 }}
        >
          {screenContent}
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {screenContent}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fafaf9" },
  offlineBanner: { backgroundColor: "#ef4444", paddingVertical: 6, alignItems: "center" },
  offlineBannerText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 12, paddingBottom: 96 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  logo: { fontSize: 26, fontWeight: "700", color: "#1a1a1a", letterSpacing: -0.5 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  streakBadge: { flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: "#fff7ed", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: "#fed7aa" },
  streakFlame: { fontSize: 15 },
  streakCount: { fontSize: 15, fontWeight: "800", color: "#ea580c" },
  card: { backgroundColor: "#fff", borderRadius: 16, padding: 16, gap: 10, borderWidth: 1, borderColor: "#f0f0f0" },
  cardLabel: { fontSize: 10, fontWeight: "700", color: "#9ca3af", letterSpacing: 1 },
  challengeRow: { flexDirection: "row", alignItems: "baseline", gap: 2 },
  challengeNum: { fontSize: 28, fontWeight: "800", color: "#1a1a1a" },
  challengeSep: { fontSize: 20, color: "#9ca3af", marginHorizontal: 4 },
  challengeGoal: { fontSize: 16, fontWeight: "600", color: "#6b7280" },
  challengeEdit: { fontSize: 11, color: "#d1d5db" },
  challengeSub: { fontSize: 12, color: "#9ca3af" },
  goalEditRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  goalInput: { width: 64, borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, fontSize: 18, fontWeight: "700", color: "#1a1a1a", textAlign: "center" },
  goalInputLabel: { fontSize: 14, color: "#6b7280" },
  goalSaveBtn: { backgroundColor: "#1a1a1a", borderRadius: 8, paddingHorizontal: 14, paddingVertical: 7 },
  goalSaveBtnText: { color: "#fff", fontWeight: "600", fontSize: 13 },
  goalCancel: { fontSize: 13, color: "#9ca3af" },
  progressRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  progressRowInline: { flexDirection: "row", alignItems: "center", gap: 6 },
  statLabel: { fontSize: 12, color: "#6b7280", width: 52 },
  progressTrack: { flex: 1, height: 6, backgroundColor: "#f3f4f6", borderRadius: 3, overflow: "hidden" },
  progressBar: { height: "100%", backgroundColor: "#1a1a1a", borderRadius: 3 },
  statValue: { fontSize: 11, color: "#9ca3af", width: 48, textAlign: "right" },
  progressPct: { fontSize: 10, color: "#9ca3af", width: 30, textAlign: "right" },
  tropeMatchBtn: { backgroundColor: "#fff", borderRadius: 16, padding: 16, flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderColor: "#e5e7eb" },
  tropeMatchIcon: { fontSize: 28 },
  tropeMatchTitle: { fontSize: 15, fontWeight: "700", color: "#1a1a1a" },
  tropeMatchSub: { fontSize: 12, color: "#9ca3af", marginTop: 2 },
  tropeMatchArrow: { fontSize: 20, color: "#d1d5db" },
  chipRow: { marginTop: 4 },
  moodChip: { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, marginRight: 8 },
  moodChipSelected: { borderWidth: 1.5, borderColor: "#1a1a1a" },
  moodChipText: { fontSize: 13, fontWeight: "500" },
  moodBooks: { gap: 10, marginTop: 4 },
  moodBookRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  moodBookCover: { width: 36, height: 52, borderRadius: 4 },
  moodBookTitle: { fontSize: 13, fontWeight: "600", color: "#1a1a1a" },
  moodBookAuthor: { fontSize: 11, color: "#9ca3af" },
  sectionTitle: { fontSize: 17, fontWeight: "700", color: "#1a1a1a", marginTop: 8 },
  emptyCard: { backgroundColor: "#fff", borderRadius: 16, padding: 24, alignItems: "center", gap: 8, borderWidth: 1, borderColor: "#f0f0f0" },
  emptyEmoji: { fontSize: 32 },
  emptyText: { fontSize: 14, color: "#6b7280", textAlign: "center" },
  emptyHint: { fontSize: 12, color: "#9ca3af", textAlign: "center" },
  emptyBtn: { backgroundColor: "#1a1a1a", borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10, marginTop: 4 },
  emptyBtnText: { color: "#fff", fontWeight: "600", fontSize: 13 },
  // Book cards
  bookCard: { backgroundColor: "#fff", borderRadius: 16, padding: 14, flexDirection: "row", gap: 12, borderWidth: 1, borderColor: "#f0f0f0", alignItems: "flex-start" },
  bookCardActive: { borderColor: "#1a1a1a", borderWidth: 1.5 },
  bookCover: { width: 52, height: 76, borderRadius: 6 },
  coverPlaceholder: { backgroundColor: "#e5e7eb" },
  nowReadingPill: { position: "absolute", top: 4, left: 4, backgroundColor: "#1a1a1a", borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  nowReadingText: { fontSize: 8, fontWeight: "700", color: "#fff", letterSpacing: 1 },
  bookTitle: { fontSize: 15, fontWeight: "600", color: "#1a1a1a" },
  bookAuthor: { fontSize: 12, color: "#9ca3af" },
  audioLabel: { fontSize: 11, color: "#6b7280", fontWeight: "500" },
  pageProgress: { fontSize: 11, color: "#9ca3af", marginTop: 2 },
  tropePill: { backgroundColor: "#f3f4f6", borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, marginRight: 6 },
  tropePillText: { fontSize: 10, color: "#6b7280" },
  aiBtn: { padding: 6 },
  aiBtnText: { fontSize: 18 },
  // Skeleton
  skeletonCard: { backgroundColor: "#fff", borderRadius: 16, padding: 14, flexDirection: "row", gap: 12, borderWidth: 1, borderColor: "#f0f0f0" },
  skeletonCover: { width: 52, height: 76, borderRadius: 6, backgroundColor: "#e5e7eb" },
  skeletonLineWide: { height: 14, backgroundColor: "#e5e7eb", borderRadius: 7, width: "85%" },
  skeletonLineShort: { height: 12, backgroundColor: "#e5e7eb", borderRadius: 6, width: "50%" },
  skeletonTrack: { height: 6, backgroundColor: "#e5e7eb", borderRadius: 3, width: "100%" },
  // Activity feed
  noActivity: { alignItems: "center", paddingVertical: 16, gap: 4 },
  noActivityText: { fontSize: 14, fontWeight: "600", color: "#6b7280" },
  noActivitySub: { fontSize: 12, color: "#9ca3af" },
  activityRow: { flexDirection: "row", gap: 10, paddingVertical: 8, alignItems: "flex-start" },
  activityDivider: { borderTopWidth: 1, borderTopColor: "#f3f4f6" },
  activityAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#f3f4f6", justifyContent: "center", alignItems: "center" },
  activityAvatarImg: { width: 36, height: 36, borderRadius: 18 },
  activityAvatarInitial: { fontSize: 14, fontWeight: "700", color: "#6b7280" },
  activityText: { fontSize: 13, color: "#374151", lineHeight: 18 },
  activityUser: { fontWeight: "700", color: "#1a1a1a" },
  activityBook: { fontStyle: "italic", color: "#1a1a1a" },
  activityTropes: { fontSize: 11, color: "#9ca3af" },
  activityMood: { fontSize: 11, color: "#6b7280" },
  activityTime: { fontSize: 10, color: "#d1d5db", paddingTop: 2 },
  // FAB
  fab: {
    position: "absolute",
    bottom: 80,
    right: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#1a1a1a",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  fabText: { fontSize: 22 },
});
