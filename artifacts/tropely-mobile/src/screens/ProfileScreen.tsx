import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  Image,
  Switch,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUser, useAuth } from "@/context/AuthContext";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/navigation";
import { useStore, useCurrentBook, computeStreak } from "@/store";
import * as Notifications from "expo-notifications";

type Nav = NativeStackNavigationProp<RootStackParamList>;

const GOAL_PAGE_PRESETS = [10, 20, 30, 50];
const GOAL_MIN_PRESETS = [15, 30, 60];

const REMINDER_MESSAGES = [
  "Your slow burn isn't going to read itself. 🔥",
  "Those enemies won't become lovers without you. ⚡",
  "The found family needs you back in chapter 12. 🏡",
  "A good heist needs a mastermind. That's you. 📖",
  "That redemption arc isn't going to wrap itself. 🌱",
  "Second chance romance, first chance to read today. 🌹",
  "Your dark academia aesthetic needs feeding. 📚",
];

async function scheduleReminder(time: string, bookTitle?: string, topTrope?: string) {
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission denied", "Enable notifications in your device settings to use reading reminders.");
      return false;
    }
    await Notifications.cancelAllScheduledNotificationsAsync();
    const [hourStr, minuteStr] = time.split(":");
    const hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);
    if (isNaN(hour) || isNaN(minute)) return false;

    let body: string;
    if (bookTitle) {
      body = topTrope
        ? `Time to read "${bookTitle}" — that ${topTrope} story won't finish itself. 📖`
        : `Your book "${bookTitle}" is waiting for you. 📚`;
    } else {
      body = REMINDER_MESSAGES[new Date().getDay() % REMINDER_MESSAGES.length];
    }

    await Notifications.scheduleNotificationAsync({
      content: { title: "Time to read 📚", body },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });
    return true;
  } catch {
    return false;
  }
}

async function cancelReminder() {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {}
}

// ── Achievement definitions ───────────────────────────────────────────────────

type Badge = {
  id: string;
  emoji: string;
  label: string;
  desc: string;
  check: (s: ReturnType<typeof useStore.getState>) => boolean;
  progress?: (s: ReturnType<typeof useStore.getState>) => { current: number; total: number };
};

const LIFETIME_BADGES: Badge[] = [
  { id: "first_book", emoji: "📖", label: "First Chapter", desc: "Add your first book", check: (s) => s.books.length >= 1, progress: (s) => ({ current: Math.min(s.books.length, 1), total: 1 }) },
  { id: "consistent_reader", emoji: "🔥", label: "Consistent Reader", desc: "Log 10 reading sessions", check: (s) => s.sessions.length >= 10, progress: (s) => ({ current: Math.min(s.sessions.length, 10), total: 10 }) },
  { id: "bookmarker", emoji: "🔖", label: "Bookmarker", desc: "Save 5 highlights", check: (s) => s.highlights.length >= 5, progress: (s) => ({ current: Math.min(s.highlights.length, 5), total: 5 }) },
  { id: "finisher", emoji: "🏁", label: "Finisher", desc: "Finish a book", check: (s) => s.books.some((b) => b.shelf === "finished") },
  { id: "mood_reader", emoji: "🎭", label: "Mood Reader", desc: "Read in 3 different moods", check: (s) => new Set(s.books.map((b) => b.mood).filter(Boolean)).size >= 3, progress: (s) => ({ current: Math.min(new Set(s.books.map((b) => b.mood).filter(Boolean)).size, 3), total: 3 }) },
  { id: "night_owl", emoji: "🌙", label: "Night Owl", desc: "Log a session after 10pm", check: (s) => s.sessions.some((sess) => new Date(sess.date).getHours() >= 22) },
  { id: "bibliophile", emoji: "📚", label: "Bibliophile", desc: "Add 25 books", check: (s) => s.books.length >= 25, progress: (s) => ({ current: Math.min(s.books.length, 25), total: 25 }) },
  { id: "speed_reader", emoji: "🏃", label: "Speed Reader", desc: "Finish a book within 3 days of starting", check: (s) => s.books.some((b) => b.shelf === "finished" && (Date.now() - new Date(b.addedAt).getTime()) <= 3 * 86_400_000) },
  { id: "annotator", emoji: "💬", label: "Annotator", desc: "Save 25 highlights", check: (s) => s.highlights.length >= 25, progress: (s) => ({ current: Math.min(s.highlights.length, 25), total: 25 }) },
  {
    id: "trope_hunter", emoji: "🎯", label: "Trope Hunter", desc: "Tag 10 different unique tropes",
    check: (s) => new Set(s.books.flatMap((b) => b.tropes ?? [])).size >= 10,
    progress: (s) => ({ current: Math.min(new Set(s.books.flatMap((b) => b.tropes ?? [])).size, 10), total: 10 }),
  },
  { id: "social_reader", emoji: "👯", label: "Social Reader", desc: "Join 3 buddy read rooms", check: () => false },
  { id: "dnf_queen", emoji: "💔", label: "DNF Queen", desc: "Move 5 books to DNF shelf", check: (s) => s.books.filter((b) => b.shelf === "dnf").length >= 5, progress: (s) => ({ current: Math.min(s.books.filter((b) => b.shelf === "dnf").length, 5), total: 5 }) },
  { id: "re_reader", emoji: "🔁", label: "Re-reader", desc: "Log a session on a finished book", check: (s) => { const finishedIds = new Set(s.books.filter((b) => b.shelf === "finished").map((b) => b.id)); return s.sessions.some((sess) => finishedIds.has(sess.bookId)); } },
  { id: "mood_traveller", emoji: "🌈", label: "Mood Traveller", desc: "Read books in all 10 moods", check: (s) => new Set(s.books.map((b) => b.mood).filter(Boolean)).size >= 10, progress: (s) => ({ current: Math.min(new Set(s.books.map((b) => b.mood).filter(Boolean)).size, 10), total: 10 }) },
  { id: "epic_reader", emoji: "🕯️", label: "Epic Reader", desc: "Finish a book with 600+ pages", check: (s) => s.books.some((b) => b.shelf === "finished" && b.pages >= 600) },
  { id: "streak_master", emoji: "🏆", label: "Streak Master", desc: "Hit daily reading goal 7 days in a row", check: (s) => computeStreak(s.sessions) >= 7 },
  { id: "journaller", emoji: "✍️", label: "Journaller", desc: "Write 10 journal entries", check: (s) => s.journal.length >= 10, progress: (s) => ({ current: Math.min(s.journal.length, 10), total: 10 }) },
  { id: "critic", emoji: "🌟", label: "Critic", desc: "Give a book 5 stars", check: (s) => s.reflections.some((r) => r.rating === 5) },
  {
    id: "trope_obsessed", emoji: "👑", label: "Trope Obsessed", desc: "Read 5 books with the same trope",
    check: (s) => {
      const counts: Record<string, number> = {};
      for (const b of s.books) for (const t of b.tropes ?? []) counts[t] = (counts[t] ?? 0) + 1;
      return Object.values(counts).some((c) => c >= 5);
    },
  },
];

const MONTHLY_CHALLENGES = [
  { id: "month_starter", emoji: "📅", label: "Month Starter", desc: "Log a session in the first 3 days of the month" },
  { id: "deep_dive", emoji: "🌊", label: "Deep Dive", desc: "Finish a book this month" },
  { id: "trope_explorer", emoji: "💡", label: "Trope Explorer", desc: "Read 2 different tropes this month" },
  { id: "daily_devotion", emoji: "🗓️", label: "Daily Devotion", desc: "Log sessions on 10 different days this month" },
  { id: "mood_chaser", emoji: "✨", label: "Mood Chaser", desc: "Read in 2 different moods this month" },
];

// TODO v2: Yearly Wrapped
const YEARLY_BADGES = [
  { id: "year_in_books", emoji: "📊", label: "Year in Books", desc: "At least 12 books finished this year" },
  { id: "trope_queen", emoji: "🌟", label: "Trope Queen/King", desc: "Most-read trope this year" },
  { id: "marathon_reader", emoji: "🏃", label: "Marathon Reader", desc: "Most pages in a single month" },
  { id: "consistent_soul", emoji: "🌙", label: "Consistent Soul", desc: "Reading streak of 30+ days" },
  { id: "genre_bender", emoji: "🎭", label: "Genre Bender", desc: "Read books in 4+ different moods" },
];

export default function ProfileScreen() {
  const nav = useNavigation<Nav>();
  const user = useUser();
  const { signOut } = useAuth();
  const store = useStore();
  const currentBook = useCurrentBook();
  const {
    books, sessions, journal, highlights, age,
    dailyGoalPages, dailyGoalMinutes,
    reminderEnabled, reminderTime,
    spoilerLock, equippedBadgeId,
    setAge, setDailyGoalPages, setDailyGoalMinutes,
    setReminderEnabled, setReminderTime,
    setSpoilerLock, setEquippedBadge,
  } = store;

  const [ageInput, setAgeInput] = useState(age?.toString() ?? "");
  const [editingAge, setEditingAge] = useState(false);
  const [editingReminderTime, setEditingReminderTime] = useState(false);
  const [reminderTimeInput, setReminderTimeInput] = useState(reminderTime);
  const [activeAchievementTab, setActiveAchievementTab] = useState<"lifetime" | "monthly" | "yearly">("lifetime");

  const topTrope = currentBook?.tropes?.[0];

  const saveAge = () => {
    const n = parseInt(ageInput, 10);
    if (n > 0 && n < 120) { setAge(n); setEditingAge(false); }
    else Alert.alert("Enter a valid age.");
  };

  const toggleReminder = async (v: boolean) => {
    if (v) {
      const ok = await scheduleReminder(reminderTime, currentBook?.title, topTrope);
      if (ok !== false) setReminderEnabled(true);
    } else {
      await cancelReminder();
      setReminderEnabled(false);
    }
  };

  const saveReminderTime = async () => {
    const parts = reminderTimeInput.split(":");
    if (parts.length !== 2 || isNaN(parseInt(parts[0])) || isNaN(parseInt(parts[1]))) {
      Alert.alert("Invalid time", "Enter time as HH:MM, e.g. 20:00");
      return;
    }
    setReminderTime(reminderTimeInput);
    setEditingReminderTime(false);
    if (reminderEnabled) await scheduleReminder(reminderTimeInput, currentBook?.title, topTrope);
  };

  const storeState = useStore.getState();
  const earnedBadges = useMemo(() => {
    const earned = new Set<string>();
    for (const b of LIFETIME_BADGES) {
      if (b.check(storeState)) earned.add(b.id);
    }
    return earned;
  }, [books, sessions, highlights, journal, storeState]);

  const equippedEmoji = equippedBadgeId
    ? (LIFETIME_BADGES.find((b) => b.id === equippedBadgeId)?.emoji ?? "")
    : "";

  const nowDate = new Date();
  const currentMonth = `${nowDate.getFullYear()}-${String(nowDate.getMonth() + 1).padStart(2, "0")}`;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* User info */}
        <View style={styles.profileCard}>
          <View style={{ alignItems: "center", gap: 4 }}>
            {/* TODO v2: Supabase Storage photo upload */}
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarInitial}>
                {(user?.email ?? "R")[0].toUpperCase()}
              </Text>
            </View>
            <TouchableOpacity onPress={() => Alert.alert("Coming soon", "Photo upload is coming in a future update.")}>
              <Text style={styles.addPhotoLabel}>Add photo</Text>
            </TouchableOpacity>
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={styles.displayName}>
              {user?.displayName?.split(" ")[0] ?? user?.email?.split("@")[0] ?? "Reader"}
              {equippedEmoji ? ` ${equippedEmoji}` : ""}
            </Text>
            <Text style={styles.email}>{user?.email}</Text>
          </View>
        </View>

        {/* Stats summary */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{books.length}</Text>
            <Text style={styles.statLbl}>Books</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{sessions.length}</Text>
            <Text style={styles.statLbl}>Sessions</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{journal.length}</Text>
            <Text style={styles.statLbl}>Entries</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{books.filter((b) => b.shelf === "finished").length}</Text>
            <Text style={styles.statLbl}>Finished</Text>
          </View>
        </View>

        {/* Achievements */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Achievements</Text>

          <View style={styles.achieveTabs}>
            {(["lifetime", "monthly", "yearly"] as const).map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[styles.achieveTab, activeAchievementTab === tab && styles.achieveTabActive]}
                onPress={() => setActiveAchievementTab(tab)}
              >
                <Text style={[styles.achieveTabText, activeAchievementTab === tab && styles.achieveTabTextActive]}>
                  {tab === "lifetime" ? "Lifetime" : tab === "monthly" ? "Monthly" : "Yearly"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {activeAchievementTab === "lifetime" && (
            <View style={styles.badgeGrid}>
              {LIFETIME_BADGES.map((badge) => {
                const earned = earnedBadges.has(badge.id);
                const prog = badge.progress ? badge.progress(storeState) : null;
                const isEquipped = equippedBadgeId === badge.id;
                return (
                  <View key={badge.id} style={[styles.badge, !earned && styles.badgeLocked]}>
                    <Text style={[styles.badgeEmoji, !earned && styles.badgeEmojiLocked]}>{badge.emoji}</Text>
                    <Text style={[styles.badgeLabel, !earned && styles.badgeLabelLocked]}>{badge.label}</Text>
                    {!earned && prog && (
                      <Text style={styles.badgeProgress}>{prog.current} / {prog.total}</Text>
                    )}
                    {earned && (
                      <TouchableOpacity
                        style={[styles.equipBtn, isEquipped && styles.equipBtnActive]}
                        onPress={() => setEquippedBadge(isEquipped ? null : badge.id)}
                      >
                        <Text style={[styles.equipBtnText, isEquipped && styles.equipBtnTextActive]}>
                          {isEquipped ? "Equipped ✓" : "Equip flair"}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
            </View>
          )}

          {activeAchievementTab === "monthly" && (
            <View style={styles.challengeList}>
              <Text style={styles.challengeMonthLabel}>
                {nowDate.toLocaleString("default", { month: "long", year: "numeric" })} challenges
              </Text>
              {MONTHLY_CHALLENGES.map((ch) => {
                const progress = store.monthlyProgress[ch.id];
                const isThisMonth = progress?.month === currentMonth;
                const completed = isThisMonth && progress?.completed;
                return (
                  <View key={ch.id} style={[styles.challengeRow, completed && styles.challengeRowDone]}>
                    <Text style={styles.challengeEmoji}>{ch.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.challengeLabel, completed && styles.challengeLabelDone]}>{ch.label}</Text>
                      <Text style={styles.challengeDesc}>{ch.desc}</Text>
                    </View>
                    {completed && <Text style={styles.challengeDoneCheck}>✓</Text>}
                  </View>
                );
              })}
            </View>
          )}

          {/* TODO v2: Yearly Wrapped — replace placeholder with real stats */}
          {activeAchievementTab === "yearly" && (
            <View style={styles.challengeList}>
              <View style={styles.comingSoonPlaceholder}>
                <Text style={styles.comingSoonEmoji}>🎁</Text>
                <Text style={styles.comingSoonTitle}>Yearly Wrapped</Text>
                <Text style={styles.comingSoonDesc}>
                  Your year-in-review badges — your most-read trope, longest streak, and top genre — are coming at the end of the year.
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Daily reading reminder */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Daily reading reminder</Text>
          <Text style={styles.cardSub}>A personalised nudge at your chosen time.</Text>
          <View style={styles.reminderRow}>
            <Text style={styles.reminderLabel}>Enable reminder</Text>
            <Switch
              value={reminderEnabled}
              onValueChange={toggleReminder}
              trackColor={{ false: "#e5e7eb", true: "#1a1a1a" }}
              thumbColor="#fff"
            />
          </View>
          {reminderEnabled && (
            <View style={styles.reminderTimeRow}>
              <Text style={styles.reminderTimeLabel}>Reminder time</Text>
              {editingReminderTime ? (
                <View style={styles.row}>
                  <TextInput
                    style={[styles.ageInput, { width: 80 }]}
                    value={reminderTimeInput}
                    onChangeText={setReminderTimeInput}
                    placeholder="20:00"
                    keyboardType={Platform.OS === "ios" ? "numbers-and-punctuation" : "default"}
                    autoFocus
                    maxLength={5}
                  />
                  <TouchableOpacity style={styles.saveBtn} onPress={saveReminderTime}>
                    <Text style={styles.saveBtnText}>Set</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.reminderTimeDisplay}
                  onPress={() => { setReminderTimeInput(reminderTime); setEditingReminderTime(true); }}
                >
                  <Text style={styles.reminderTimeText}>{reminderTime}  ✎</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Spoiler lock */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Spoiler lock</Text>
          <Text style={styles.cardSub}>Hides content ahead of your current page in buddy reads and your library.</Text>
          <View style={styles.reminderRow}>
            <Text style={styles.reminderLabel}>Lock spoilers</Text>
            <Switch
              value={spoilerLock}
              onValueChange={setSpoilerLock}
              trackColor={{ false: "#e5e7eb", true: "#1a1a1a" }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Age setting */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Your age</Text>
          <Text style={styles.cardSub}>Used to filter age-appropriate content. Users under 13 have messaging and character chat disabled.</Text>
          {editingAge ? (
            <View style={styles.row}>
              <TextInput
                style={styles.ageInput}
                value={ageInput}
                onChangeText={setAgeInput}
                keyboardType="number-pad"
                placeholder="Age"
                maxLength={3}
              />
              <TouchableOpacity style={styles.saveBtn} onPress={saveAge}>
                <Text style={styles.saveBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.ageDisplay}
              onPress={() => { setAgeInput(age?.toString() ?? ""); setEditingAge(true); }}
            >
              <Text style={styles.ageDisplayText}>{age ? `${age} years old` : "Set your age →"}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Daily goal */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Daily reading goal</Text>
          <Text style={styles.goalSectionLabel}>Pages / day</Text>
          <View style={styles.presetRow}>
            {GOAL_PAGE_PRESETS.map((n) => (
              <TouchableOpacity
                key={n}
                style={[styles.presetBtn, dailyGoalPages === n && styles.presetBtnActive]}
                onPress={() => setDailyGoalPages(n)}
              >
                <Text style={[styles.presetBtnText, dailyGoalPages === n && styles.presetBtnTextActive]}>
                  {n}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={[styles.goalSectionLabel, { marginTop: 10 }]}>Minutes / day</Text>
          <View style={styles.presetRow}>
            {GOAL_MIN_PRESETS.map((n) => (
              <TouchableOpacity
                key={n}
                style={[styles.presetBtn, dailyGoalMinutes === n && styles.presetBtnActive]}
                onPress={() => setDailyGoalMinutes(n)}
              >
                <Text style={[styles.presetBtnText, dailyGoalMinutes === n && styles.presetBtnTextActive]}>
                  {n}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Referral */}
        <TouchableOpacity
          style={styles.referralBtn}
          onPress={() => nav.navigate("Referral")}
        >
          <Text style={styles.referralBtnEmoji}>🎁</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.referralBtnTitle}>Invite friends</Text>
            <Text style={styles.referralBtnSub}>Earn free Premium months</Text>
          </View>
          <Text style={styles.referralBtnArrow}>→</Text>
        </TouchableOpacity>

        {/* Coming soon */}
        <View style={styles.comingSoonCard}>
          <Text style={styles.comingSoonCardTitle}>Coming soon ✨</Text>
          <Text style={styles.comingSoonCardDesc}>
            Reading Twin matching, Yearly Wrapped stats, and more are on the way.
          </Text>
        </View>

        {/* Sign out */}
        <TouchableOpacity
          style={styles.signOutBtn}
          onPress={() =>
            Alert.alert("Sign out?", "You'll need to sign back in.", [
              { text: "Cancel", style: "cancel" },
              { text: "Sign out", style: "destructive", onPress: () => signOut() },
            ])
          }
        >
          <Text style={styles.signOutText}>Sign out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fafaf9" },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 14, paddingBottom: 40 },
  profileCard: { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: "#fff", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#f0ede8" },
  avatar: { width: 60, height: 60, borderRadius: 30 },
  avatarPlaceholder: { backgroundColor: "#e5e7eb", justifyContent: "center", alignItems: "center" },
  avatarInitial: { fontSize: 24, fontWeight: "700", color: "#6b7280" },
  addPhotoLabel: { fontSize: 10, color: "#9ca3af" },
  displayName: { fontSize: 17, fontWeight: "700", color: "#1a1a1a" },
  email: { fontSize: 13, color: "#9ca3af" },
  statsRow: { flexDirection: "row", backgroundColor: "#fff", borderRadius: 16, borderWidth: 1, borderColor: "#f0ede8", overflow: "hidden" },
  statBox: { flex: 1, alignItems: "center", paddingVertical: 14, borderRightWidth: 1, borderRightColor: "#f0ede8" },
  statNum: { fontSize: 20, fontWeight: "700", color: "#1a1a1a" },
  statLbl: { fontSize: 10, color: "#9ca3af", marginTop: 2 },
  card: { backgroundColor: "#fff", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#f0ede8", gap: 10 },
  cardTitle: { fontSize: 15, fontWeight: "700", color: "#1a1a1a" },
  cardSub: { fontSize: 12, color: "#9ca3af", marginTop: -4, lineHeight: 18 },
  achieveTabs: { flexDirection: "row", backgroundColor: "#f3f4f6", borderRadius: 10, padding: 3, gap: 3 },
  achieveTab: { flex: 1, paddingVertical: 7, borderRadius: 8, alignItems: "center" },
  achieveTabActive: { backgroundColor: "#fff" },
  achieveTabText: { fontSize: 12, fontWeight: "500", color: "#9ca3af" },
  achieveTabTextActive: { color: "#1a1a1a", fontWeight: "700" },
  badgeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  badge: { width: "30%", alignItems: "center", gap: 4, paddingVertical: 10, backgroundColor: "#f9fafb", borderRadius: 12, flex: 1, minWidth: "28%" },
  badgeLocked: { opacity: 0.45 },
  badgeEmoji: { fontSize: 24 },
  badgeEmojiLocked: { opacity: 0.5 },
  badgeLabel: { fontSize: 9, fontWeight: "600", color: "#1a1a1a", textAlign: "center" },
  badgeLabelLocked: { color: "#9ca3af" },
  badgeProgress: { fontSize: 9, color: "#9ca3af", textAlign: "center" },
  equipBtn: { marginTop: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, borderWidth: 1, borderColor: "#e5e7eb" },
  equipBtnActive: { backgroundColor: "#1a1a1a", borderColor: "#1a1a1a" },
  equipBtnText: { fontSize: 9, color: "#6b7280" },
  equipBtnTextActive: { color: "#fff" },
  challengeList: { gap: 10 },
  challengeMonthLabel: { fontSize: 12, fontWeight: "600", color: "#9ca3af", marginBottom: 4 },
  challengeRow: { flexDirection: "row", alignItems: "center", gap: 10, padding: 10, borderRadius: 12, backgroundColor: "#f9fafb" },
  challengeRowDone: { backgroundColor: "#d1fae5" },
  challengeEmoji: { fontSize: 20 },
  challengeLabel: { fontSize: 13, fontWeight: "600", color: "#1a1a1a" },
  challengeLabelDone: { color: "#065f46" },
  challengeDesc: { fontSize: 11, color: "#9ca3af", marginTop: 1 },
  challengeDoneCheck: { fontSize: 16, color: "#059669", fontWeight: "700" },
  comingSoonPlaceholder: { alignItems: "center", paddingVertical: 24, gap: 8 },
  comingSoonEmoji: { fontSize: 36 },
  comingSoonTitle: { fontSize: 15, fontWeight: "700", color: "#1a1a1a" },
  comingSoonDesc: { fontSize: 12, color: "#9ca3af", textAlign: "center", lineHeight: 18, paddingHorizontal: 8 },
  reminderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  reminderLabel: { fontSize: 14, color: "#374151" },
  reminderTimeRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  reminderTimeLabel: { fontSize: 13, color: "#6b7280" },
  reminderTimeDisplay: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: "#e5e7eb" },
  reminderTimeText: { fontSize: 14, color: "#1a1a1a", fontWeight: "600" },
  row: { flexDirection: "row", gap: 10 },
  ageInput: { flex: 1, borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, backgroundColor: "#fafafa" },
  saveBtn: { backgroundColor: "#1a1a1a", borderRadius: 10, paddingHorizontal: 18, justifyContent: "center" },
  saveBtnText: { color: "#fff", fontWeight: "600" },
  ageDisplay: { borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12 },
  ageDisplayText: { fontSize: 14, color: "#6b7280" },
  goalSectionLabel: { fontSize: 12, color: "#6b7280", fontWeight: "600" },
  presetRow: { flexDirection: "row", gap: 8 },
  presetBtn: { paddingHorizontal: 18, paddingVertical: 9, borderRadius: 20, borderWidth: 1, borderColor: "#e5e7eb" },
  presetBtnActive: { backgroundColor: "#1a1a1a", borderColor: "#1a1a1a" },
  presetBtnText: { fontSize: 14, fontWeight: "600", color: "#6b7280" },
  presetBtnTextActive: { color: "#fff" },
  referralBtn: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#fff", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#f0ede8" },
  referralBtnEmoji: { fontSize: 24 },
  referralBtnTitle: { fontSize: 14, fontWeight: "700", color: "#1a1a1a" },
  referralBtnSub: { fontSize: 11, color: "#9ca3af", marginTop: 2 },
  referralBtnArrow: { fontSize: 16, color: "#9ca3af" },
  comingSoonCard: { backgroundColor: "#fef3c7", borderRadius: 16, padding: 16, gap: 6, borderWidth: 1, borderColor: "#fde68a" },
  comingSoonCardTitle: { fontSize: 14, fontWeight: "700", color: "#92400e" },
  comingSoonCardDesc: { fontSize: 12, color: "#b45309", lineHeight: 18 },
  signOutBtn: { borderWidth: 1, borderColor: "#fee2e2", borderRadius: 12, paddingVertical: 14, alignItems: "center", backgroundColor: "#fff" },
  signOutText: { fontSize: 15, fontWeight: "600", color: "#ef4444" },
});
