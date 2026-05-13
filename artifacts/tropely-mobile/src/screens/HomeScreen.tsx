import React, { useMemo, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/navigation";
import { useStore, computeStreak } from "@/store";
import { fetchActivity } from "@/lib/api";
import { useAuth } from "@clerk/clerk-expo";

type Nav = NativeStackNavigationProp<RootStackParamList>;

const MOODS: Record<string, { label: string; emoji: string; color: string }> = {
  hopeful: { label: "Hopeful", emoji: "🌱", color: "#d1fae5" },
  tense: { label: "Tense", emoji: "⚡", color: "#fee2e2" },
  melancholy: { label: "Melancholy", emoji: "🌧", color: "#e0e7ff" },
  joyful: { label: "Joyful", emoji: "☀️", color: "#fef9c3" },
  romantic: { label: "Romantic", emoji: "🌹", color: "#fce7f3" },
  eerie: { label: "Eerie", emoji: "🌑", color: "#f3e8ff" },
  reflective: { label: "Reflective", emoji: "🪞", color: "#f0fdf4" },
  adventurous: { label: "Adventurous", emoji: "🧭", color: "#fff7ed" },
  cozy: { label: "Cozy", emoji: "🕯️", color: "#fef3c7" },
  intense: { label: "Intense", emoji: "🔥", color: "#fee2e2" },
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

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

const CURRENT_YEAR = new Date().getFullYear();
const FRIENDS_POLL_MS = 30_000;

export default function HomeScreen() {
  const nav = useNavigation<Nav>();
  const { getToken } = useAuth();
  const {
    books, sessions, currentId, dailyGoalPages, dailyGoalMinutes,
    annualGoal, setAnnualGoal,
  } = useStore();

  const readingBooks = books.filter((b) => b.shelf === "reading");
  const currentBook = books.find((b) => b.id === currentId) ?? readingBooks[0];
  const finishedCount = books.filter((b) => b.shelf === "finished").length;

  // Today's reading stats
  const today = todayKey();
  const todaySessions = sessions.filter((s) => s.date.startsWith(today));
  const todayPages = todaySessions.reduce((sum, s) => sum + (s.toPage - s.fromPage), 0);
  const todayMinutes = todaySessions.reduce((sum, s) => sum + (s.minutes ?? 0), 0);

  // Streak
  const streak = useMemo(() => computeStreak(sessions), [sessions]);

  // Mood TBR picker
  const wantBooks = books.filter((b) => b.shelf === "want" && b.mood);
  const moodGroups = useMemo(() => {
    const groups: Record<string, typeof books> = {};
    for (const b of wantBooks) {
      if (b.mood) groups[b.mood] = [...(groups[b.mood] ?? []), b];
    }
    return groups;
  }, [wantBooks]);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const moodBooks = selectedMood ? (moodGroups[selectedMood] ?? []) : [];

  // Annual goal editing
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState(annualGoal.toString());

  const saveGoal = () => {
    const n = parseInt(goalInput, 10);
    if (!isNaN(n) && n > 0) { setAnnualGoal(n); setEditingGoal(false); }
    else Alert.alert("Enter a valid number.");
  };

  // Friends activity feed
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadActivity = async () => {
    try {
      const data = await fetchActivity(getToken);
      const items = Array.isArray(data) ? data : (data.activity ?? data.items ?? []);
      setActivity(items.slice(0, 8));
    } catch {
      // silent — network optional
    }
  };

  useEffect(() => {
    loadActivity();
    pollRef.current = setInterval(loadActivity, FRIENDS_POLL_MS);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  const challengePct = annualGoal > 0 ? Math.min(1, finishedCount / annualGoal) : 0;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
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
            {currentBook && (
              <TouchableOpacity
                onPress={() => nav.navigate("Companion", { bookId: currentBook.id })}
                style={styles.companionBtn}
              >
                <Text style={styles.companionBtnText}>✨ AI</Text>
              </TouchableOpacity>
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
                <View
                  style={[
                    styles.progressBar,
                    { width: `${Math.min(100, (todayPages / dailyGoalPages) * 100)}%` },
                  ]}
                />
              </View>
              <Text style={styles.statValue}>{todayPages}/{dailyGoalPages}</Text>
            </View>
            {todayMinutes > 0 && (
              <View style={styles.progressRow}>
                <Text style={styles.statLabel}>Minutes</Text>
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressBar,
                      { width: `${Math.min(100, (todayMinutes / dailyGoalMinutes) * 100)}%` },
                    ]}
                  />
                </View>
                <Text style={styles.statValue}>{todayMinutes}/{dailyGoalMinutes}</Text>
              </View>
            )}
          </View>
        )}

        {/* Trope Match CTA */}
        <TouchableOpacity
          style={styles.tropeMatchBtn}
          onPress={() => nav.navigate("TropeMatch")}
        >
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
                    style={[
                      styles.moodChip,
                      { backgroundColor: m.color },
                      selectedMood === mood && styles.moodChipSelected,
                    ]}
                  >
                    <Text style={styles.moodChipText}>{m.emoji} {m.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            {moodBooks.length > 0 && (
              <View style={styles.moodBooks}>
                {moodBooks.map((b) => (
                  <TouchableOpacity
                    key={b.id}
                    style={styles.moodBookRow}
                    onPress={() => nav.navigate("BookDetail", { bookId: b.id })}
                  >
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
        {readingBooks.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>📖</Text>
            <Text style={styles.emptyText}>No books on your reading shelf yet.</Text>
            <Text style={styles.emptyHint}>Go to Discover to find your first read.</Text>
            <TouchableOpacity
              style={styles.emptyBtn}
              onPress={() => (nav as any).navigate("Discover")}
            >
              <Text style={styles.emptyBtnText}>Browse books</Text>
            </TouchableOpacity>
          </View>
        ) : (
          readingBooks.map((b) => (
            <TouchableOpacity
              key={b.id}
              style={styles.bookCard}
              onPress={() => nav.navigate("BookDetail", { bookId: b.id })}
            >
              {b.cover ? (
                <Image source={{ uri: b.cover }} style={styles.bookCover} />
              ) : (
                <View style={[styles.bookCover, styles.coverPlaceholder]} />
              )}
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={styles.bookTitle} numberOfLines={2}>{b.title}</Text>
                <Text style={styles.bookAuthor}>{b.author}</Text>
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressBar,
                      { width: `${b.pages > 0 ? Math.min(100, (b.progress / b.pages) * 100) : 0}%` },
                    ]}
                  />
                </View>
                <Text style={styles.pageProgress}>p. {b.progress} / {b.pages}</Text>
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
          ))
        )}

        {/* Friends activity feed */}
        {activity.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Friends' reading</Text>
            <View style={styles.card}>
              {activity.map((item, idx) => {
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
                        <Text style={styles.activityUser}>{item.username ?? item.userId?.slice(0, 8) ?? "Someone"} </Text>
                        <Text>{item.action ?? "read"} </Text>
                        {item.bookTitle && <Text style={styles.activityBook}>{item.bookTitle}</Text>}
                      </Text>
                      {(item.tropes ?? []).length > 0 && (
                        <Text style={styles.activityTropes} numberOfLines={1}>
                          {item.tropes!.slice(0, 2).join(" · ")}
                        </Text>
                      )}
                      {moodM && (
                        <Text style={styles.activityMood}>{moodM.emoji} {moodM.label}</Text>
                      )}
                    </View>
                    {item.createdAt && (
                      <Text style={styles.activityTime}>
                        {new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </Text>
                    )}
                  </View>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fafaf9" },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 12, paddingBottom: 32 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  logo: { fontSize: 26, fontWeight: "700", color: "#1a1a1a", letterSpacing: -0.5 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  streakBadge: { flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: "#fff7ed", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: "#fed7aa" },
  streakFlame: { fontSize: 15 },
  streakCount: { fontSize: 15, fontWeight: "800", color: "#ea580c" },
  companionBtn: { backgroundColor: "#1a1a1a", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7 },
  companionBtnText: { color: "#fff", fontSize: 13, fontWeight: "600" },
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
  statLabel: { fontSize: 12, color: "#6b7280", width: 52 },
  progressTrack: { flex: 1, height: 6, backgroundColor: "#f3f4f6", borderRadius: 3, overflow: "hidden" },
  progressBar: { height: "100%", backgroundColor: "#1a1a1a", borderRadius: 3 },
  statValue: { fontSize: 11, color: "#9ca3af", width: 48, textAlign: "right" },
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
  bookCard: { backgroundColor: "#fff", borderRadius: 16, padding: 14, flexDirection: "row", gap: 12, borderWidth: 1, borderColor: "#f0f0f0", alignItems: "flex-start" },
  bookCover: { width: 52, height: 76, borderRadius: 6 },
  coverPlaceholder: { backgroundColor: "#e5e7eb" },
  bookTitle: { fontSize: 15, fontWeight: "600", color: "#1a1a1a" },
  bookAuthor: { fontSize: 12, color: "#9ca3af" },
  pageProgress: { fontSize: 11, color: "#9ca3af", marginTop: 2 },
  tropePill: { backgroundColor: "#f3f4f6", borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, marginRight: 6 },
  tropePillText: { fontSize: 10, color: "#6b7280" },
  aiBtn: { padding: 6 },
  aiBtnText: { fontSize: 18 },
  // Friends feed
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
});
