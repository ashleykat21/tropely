import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Platform,
  TextInput,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUser, useAuth } from "@/context/AuthContext";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/navigation";
import { useStore, useCurrentBook, computeStreak } from "@/store";
import { COLORS, CARD_STYLE, SHADOW, getAvatarById } from "@/constants/theme";
import { LinearGradient } from "expo-linear-gradient";
import * as Notifications from "expo-notifications";

type Nav = NativeStackNavigationProp<RootStackParamList>;

const REMINDER_MESSAGES = [
  "Your slow burn isn't going to read itself. 🔥",
  "Those enemies won't become lovers without you. ⚡",
  "The found family needs you back. 🏡",
];

async function scheduleReminder(time: string, bookTitle?: string, topTrope?: string) {
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission denied", "Enable notifications in your device settings.");
      return false;
    }
    await Notifications.cancelAllScheduledNotificationsAsync();
    const [hourStr, minuteStr] = time.split(":");
    const hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);
    if (isNaN(hour) || isNaN(minute)) return false;
    const body = bookTitle
      ? topTrope
        ? `Time to read "${bookTitle}" — that ${topTrope} story won't finish itself. 📖`
        : `Your book "${bookTitle}" is waiting for you. 📚`
      : REMINDER_MESSAGES[new Date().getDay() % REMINDER_MESSAGES.length];
    await Notifications.scheduleNotificationAsync({
      content: { title: "Time to read 📚", body },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute },
    });
    return true;
  } catch { return false; }
}

async function cancelReminder() {
  try { await Notifications.cancelAllScheduledNotificationsAsync(); } catch {}
}

type Badge = {
  id: string; emoji: string; label: string; desc: string;
  check: (s: ReturnType<typeof useStore.getState>) => boolean;
  progress?: (s: ReturnType<typeof useStore.getState>) => { current: number; total: number };
};

const LIFETIME_BADGES: Badge[] = [
  { id: "first_book", emoji: "📖", label: "First Chapter", desc: "Add your first book", check: (s) => s.books.length >= 1, progress: (s) => ({ current: Math.min(s.books.length, 1), total: 1 }) },
  { id: "consistent_reader", emoji: "🔥", label: "Consistent Reader", desc: "Log 10 sessions", check: (s) => s.sessions.length >= 10, progress: (s) => ({ current: Math.min(s.sessions.length, 10), total: 10 }) },
  { id: "bookmarker", emoji: "🔖", label: "Bookmarker", desc: "Save 5 highlights", check: (s) => s.highlights.length >= 5, progress: (s) => ({ current: Math.min(s.highlights.length, 5), total: 5 }) },
  { id: "finisher", emoji: "🏁", label: "Finisher", desc: "Finish a book", check: (s) => s.books.some((b) => b.shelf === "finished") },
  { id: "mood_reader", emoji: "🎭", label: "Mood Reader", desc: "Read in 3 moods", check: (s) => new Set(s.books.map((b) => b.mood).filter(Boolean)).size >= 3, progress: (s) => ({ current: Math.min(new Set(s.books.map((b) => b.mood).filter(Boolean)).size, 3), total: 3 }) },
  { id: "night_owl", emoji: "🌙", label: "Night Owl", desc: "Log a session after 10pm", check: (s) => s.sessions.some((sess) => new Date(sess.date).getHours() >= 22) },
  { id: "bibliophile", emoji: "📚", label: "Bibliophile", desc: "Add 25 books", check: (s) => s.books.length >= 25, progress: (s) => ({ current: Math.min(s.books.length, 25), total: 25 }) },
  { id: "annotator", emoji: "💬", label: "Annotator", desc: "Save 25 highlights", check: (s) => s.highlights.length >= 25, progress: (s) => ({ current: Math.min(s.highlights.length, 25), total: 25 }) },
  { id: "trope_hunter", emoji: "🎯", label: "Trope Hunter", desc: "Tag 10 unique tropes", check: (s) => new Set(s.books.flatMap((b) => b.tropes ?? [])).size >= 10, progress: (s) => ({ current: Math.min(new Set(s.books.flatMap((b) => b.tropes ?? [])).size, 10), total: 10 }) },
  { id: "streak_master", emoji: "🏆", label: "Streak Master", desc: "7-day streak", check: (s) => computeStreak(s.sessions) >= 7 },
  { id: "journaller", emoji: "✍️", label: "Journaller", desc: "Write 10 entries", check: (s) => s.journal.length >= 10, progress: (s) => ({ current: Math.min(s.journal.length, 10), total: 10 }) },
  { id: "critic", emoji: "🌟", label: "Critic", desc: "Give a book 5 stars", check: (s) => s.reflections.some((r) => r.rating === 5) },
  { id: "epic_reader", emoji: "🕯️", label: "Epic Reader", desc: "Finish a 600+ page book", check: (s) => s.books.some((b) => b.shelf === "finished" && b.pages >= 600) },
  { id: "dnf_queen", emoji: "💔", label: "DNF Queen", desc: "Move 5 books to DNF", check: (s) => s.books.filter((b) => b.shelf === "dnf").length >= 5, progress: (s) => ({ current: Math.min(s.books.filter((b) => b.shelf === "dnf").length, 5), total: 5 }) },
];

const MONTHLY_CHALLENGES = [
  { id: "month_starter", emoji: "📅", label: "Month Starter", desc: "Log a session in the first 3 days of the month" },
  { id: "deep_dive", emoji: "🌊", label: "Deep Dive", desc: "Finish a book this month" },
  { id: "trope_explorer", emoji: "💡", label: "Trope Explorer", desc: "Read 2 different tropes this month" },
];

export default function ProfileScreen() {
  const nav = useNavigation<Nav>();
  const user = useUser();
  const { signOut } = useAuth();
  const store = useStore();
  const currentBook = useCurrentBook();
  const {
    books, sessions, journal, highlights,
    dailyGoalPages, dailyGoalMinutes,
    reminderEnabled, reminderTime,
    spoilerLock, equippedBadgeId,
    setDailyGoalPages, setDailyGoalMinutes,
    setReminderEnabled, setReminderTime,
    setSpoilerLock, setEquippedBadge,
    selectedAvatar, readingVibe,
    inbox,
    isPremium, premiumTestingModeEnabled,
  } = store;

  const avatar = getAvatarById(selectedAvatar);
  const [activeAchievementTab, setActiveAchievementTab] = useState<"lifetime" | "monthly">("lifetime");
  const [editingReminderTime, setEditingReminderTime] = useState(false);
  const [reminderTimeInput, setReminderTimeInput] = useState(reminderTime);

  const topTrope = currentBook?.tropes?.[0];
  const unreadCount = inbox.filter((i) => !i.read).length;

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

  const displayName = user?.displayName?.split(" ")[0] ?? user?.email?.split("@")[0] ?? "Reader";
  const streak = useMemo(() => computeStreak(sessions), [sessions]);
  const finishedCount = books.filter((b) => b.shelf === "finished").length;

  const nowDate = new Date();
  const currentMonth = `${nowDate.getFullYear()}-${String(nowDate.getMonth() + 1).padStart(2, "0")}`;

  return (
    <LinearGradient colors={["#fff", "#f5f0ff"]} style={{ flex: 1 }} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}>
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>

          {/* Top row with inbox */}
          <View style={styles.topRow}>
            <Text style={styles.screenTitle}>Me</Text>
            <TouchableOpacity style={styles.inboxBtn} onPress={() => nav.navigate("Inbox")} activeOpacity={0.8}>
              <Text style={styles.inboxEmoji}>💬</Text>
              {unreadCount > 0 && (
                <View style={styles.inboxBadge}>
                  <Text style={styles.inboxBadgeText}>{unreadCount > 9 ? "9+" : unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Profile header */}
          <View style={[styles.card, styles.profileCard]}>
            <TouchableOpacity
              style={[styles.avatarBubble, { backgroundColor: avatar.bg }]}
              onPress={() => nav.navigate("AvatarPicker")}
              activeOpacity={0.85}
            >
              <Text style={styles.avatarEmoji}>{avatar.emoji}</Text>
              <View style={styles.editAvatarBadge}>
                <Text style={styles.editAvatarBadgeText}>✎</Text>
              </View>
            </TouchableOpacity>
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={styles.displayName}>{displayName}</Text>
              <Text style={styles.email}>{user?.email}</Text>
              {readingVibe ? <Text style={styles.vibe}>{readingVibe}</Text> : null}
              {(isPremium || premiumTestingModeEnabled) && (
                <View style={styles.premiumBadge}>
                  <Text style={styles.premiumBadgeText}>
                    ✨ Premium{premiumTestingModeEnabled ? " (Testing Mode)" : ""}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Stats row */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNum}>{finishedCount}</Text>
              <Text style={styles.statLbl}>Finished</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNum}>{sessions.length}</Text>
              <Text style={styles.statLbl}>Sessions</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNum}>{streak}</Text>
              <Text style={styles.statLbl}>Streak</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNum}>{journal.length}</Text>
              <Text style={styles.statLbl}>Entries</Text>
            </View>
          </View>

          {/* Achievements */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Achievements</Text>
            <View style={styles.achieveTabs}>
              {(["lifetime", "monthly"] as const).map((tab) => (
                <TouchableOpacity
                  key={tab}
                  style={[styles.achieveTab, activeAchievementTab === tab && styles.achieveTabActive]}
                  onPress={() => setActiveAchievementTab(tab)}
                >
                  <Text style={[styles.achieveTabText, activeAchievementTab === tab && styles.achieveTabTextActive]}>
                    {tab === "lifetime" ? "Lifetime" : "Monthly"}
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
                            {isEquipped ? "Equipped ✓" : "Equip"}
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
          </View>

          {/* Spoiler lock */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Spoiler guardrails</Text>
            <Text style={styles.cardSub}>Hides content ahead of your current page in buddy reads.</Text>
            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Lock spoilers</Text>
              <Switch value={spoilerLock} onValueChange={setSpoilerLock} trackColor={{ false: "#e5e7eb", true: COLORS.lavender }} thumbColor="#fff" />
            </View>
          </View>

          {/* Daily reminder */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Daily reading reminder</Text>
            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Enable reminder</Text>
              <Switch value={reminderEnabled} onValueChange={toggleReminder} trackColor={{ false: "#e5e7eb", true: COLORS.lavender }} thumbColor="#fff" />
            </View>
            {reminderEnabled && (
              <View style={styles.reminderTimeRow}>
                <Text style={styles.reminderTimeLabel}>Reminder time</Text>
                {editingReminderTime ? (
                  <View style={styles.inlineRow}>
                    <TextInput
                      style={styles.timeInput}
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
                    style={styles.timeDisplay}
                    onPress={() => { setReminderTimeInput(reminderTime); setEditingReminderTime(true); }}
                  >
                    <Text style={styles.timeDisplayText}>{reminderTime}  ✎</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>

          {/* Daily goals */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Daily reading goal</Text>
            <Text style={styles.goalLabel}>Pages / day</Text>
            <View style={styles.presetRow}>
              {[10, 20, 30, 50].map((n) => (
                <TouchableOpacity
                  key={n}
                  style={[styles.presetBtn, dailyGoalPages === n && styles.presetBtnActive]}
                  onPress={() => setDailyGoalPages(n)}
                >
                  <Text style={[styles.presetBtnText, dailyGoalPages === n && styles.presetBtnTextActive]}>{n}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[styles.goalLabel, { marginTop: 8 }]}>Minutes / day</Text>
            <View style={styles.presetRow}>
              {[15, 30, 60].map((n) => (
                <TouchableOpacity
                  key={n}
                  style={[styles.presetBtn, dailyGoalMinutes === n && styles.presetBtnActive]}
                  onPress={() => setDailyGoalMinutes(n)}
                >
                  <Text style={[styles.presetBtnText, dailyGoalMinutes === n && styles.presetBtnTextActive]}>{n}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Quick links */}
          <TouchableOpacity style={styles.card} onPress={() => nav.navigate("Premium")} activeOpacity={0.85}>
            <View style={styles.linkRow}>
              <Text style={styles.linkEmoji}>✨</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.linkTitle}>
                  Premium{premiumTestingModeEnabled ? " (Testing Mode)" : ""}
                </Text>
                <Text style={styles.linkSub}>View your Premium benefits</Text>
              </View>
              <Text style={styles.linkArrow}>→</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.card} onPress={() => nav.navigate("Referral")} activeOpacity={0.85}>
            <View style={styles.linkRow}>
              <Text style={styles.linkEmoji}>🎁</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.linkTitle}>Invite friends</Text>
                <Text style={styles.linkSub}>Earn free Premium months</Text>
              </View>
              <Text style={styles.linkArrow}>→</Text>
            </View>
          </TouchableOpacity>

        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 14, paddingBottom: 40 },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  screenTitle: { fontSize: 26, fontWeight: "800", color: COLORS.ink },
  inboxBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.5)", justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.6)" },
  inboxEmoji: { fontSize: 16 },
  inboxBadge: { position: "absolute", top: -2, right: -2, width: 16, height: 16, borderRadius: 8, backgroundColor: COLORS.rose, justifyContent: "center", alignItems: "center" },
  inboxBadgeText: { fontSize: 9, color: "#fff", fontWeight: "700" },
  card: { ...CARD_STYLE, ...SHADOW, gap: 10 },
  profileCard: { flexDirection: "row", alignItems: "center", gap: 14 },
  avatarBubble: { width: 80, height: 80, borderRadius: 40, justifyContent: "center", alignItems: "center", borderWidth: 3, borderColor: COLORS.lavender },
  editAvatarBadge: { position: "absolute", bottom: 0, right: 0, width: 22, height: 22, borderRadius: 11, backgroundColor: COLORS.lavender, justifyContent: "center", alignItems: "center", borderWidth: 2, borderColor: "#fff" },
  editAvatarBadgeText: { fontSize: 10, color: "#fff" },
  avatarEmoji: { fontSize: 40 },
  displayName: { fontSize: 18, fontWeight: "700", color: COLORS.ink },
  email: { fontSize: 12, color: COLORS.inkSoft },
  vibe: { fontSize: 12, color: COLORS.lavender, fontWeight: "600" },
  premiumBadge: { alignSelf: "flex-start", backgroundColor: "rgba(244,114,182,0.15)", borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, marginTop: 2 },
  premiumBadgeText: { fontSize: 11, color: "#c026d3", fontWeight: "700" },
  statsRow: { flexDirection: "row", backgroundColor: "rgba(255,255,255,0.75)", borderRadius: 20, borderWidth: 1, borderColor: "rgba(255,255,255,0.6)", overflow: "hidden", ...SHADOW },
  statBox: { flex: 1, alignItems: "center", paddingVertical: 14, borderRightWidth: 1, borderRightColor: "rgba(0,0,0,0.05)" },
  statNum: { fontSize: 20, fontWeight: "700", color: COLORS.ink },
  statLbl: { fontSize: 10, color: COLORS.inkSoft, marginTop: 2 },
  cardTitle: { fontSize: 15, fontWeight: "700", color: COLORS.ink },
  cardSub: { fontSize: 12, color: COLORS.inkSoft, lineHeight: 18 },
  achieveTabs: { flexDirection: "row", backgroundColor: "#f3f4f6", borderRadius: 10, padding: 3, gap: 3 },
  achieveTab: { flex: 1, paddingVertical: 7, borderRadius: 8, alignItems: "center" },
  achieveTabActive: { backgroundColor: "#fff" },
  achieveTabText: { fontSize: 12, fontWeight: "500", color: COLORS.inkSoft },
  achieveTabTextActive: { color: COLORS.ink, fontWeight: "700" },
  badgeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  badge: { width: "30%", alignItems: "center", gap: 4, paddingVertical: 10, backgroundColor: "#f9fafb", borderRadius: 12, flex: 1, minWidth: "28%" },
  badgeLocked: { opacity: 0.45 },
  badgeEmoji: { fontSize: 24 },
  badgeEmojiLocked: { opacity: 0.5 },
  badgeLabel: { fontSize: 9, fontWeight: "600", color: COLORS.ink, textAlign: "center" },
  badgeLabelLocked: { color: COLORS.inkSoft },
  badgeProgress: { fontSize: 9, color: COLORS.inkSoft, textAlign: "center" },
  equipBtn: { marginTop: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, borderWidth: 1, borderColor: "#e5e7eb" },
  equipBtnActive: { backgroundColor: COLORS.lavender, borderColor: COLORS.lavender },
  equipBtnText: { fontSize: 9, color: COLORS.inkSoft },
  equipBtnTextActive: { color: "#fff" },
  challengeList: { gap: 10 },
  challengeMonthLabel: { fontSize: 11, fontWeight: "600", color: COLORS.inkSoft, marginBottom: 4 },
  challengeRow: { flexDirection: "row", alignItems: "center", gap: 10, padding: 10, borderRadius: 12, backgroundColor: "#f9fafb" },
  challengeRowDone: { backgroundColor: "#d1fae5" },
  challengeEmoji: { fontSize: 20 },
  challengeLabel: { fontSize: 13, fontWeight: "600", color: COLORS.ink },
  challengeLabelDone: { color: "#065f46" },
  challengeDesc: { fontSize: 11, color: COLORS.inkSoft, marginTop: 1 },
  challengeDoneCheck: { fontSize: 16, color: "#059669", fontWeight: "700" },
  toggleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  toggleLabel: { fontSize: 14, color: COLORS.inkMid },
  reminderTimeRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  reminderTimeLabel: { fontSize: 13, color: COLORS.inkSoft },
  inlineRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  timeInput: { borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, fontSize: 15, color: COLORS.ink, width: 80, textAlign: "center" },
  saveBtn: { backgroundColor: COLORS.ink, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 7 },
  saveBtnText: { color: "#fff", fontWeight: "600", fontSize: 13 },
  timeDisplay: { borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  timeDisplayText: { fontSize: 14, color: COLORS.ink, fontWeight: "600" },
  goalLabel: { fontSize: 12, color: COLORS.inkSoft, fontWeight: "600" },
  presetRow: { flexDirection: "row", gap: 8 },
  presetBtn: { paddingHorizontal: 18, paddingVertical: 9, borderRadius: 20, borderWidth: 1, borderColor: "#e5e7eb" },
  presetBtnActive: { backgroundColor: COLORS.lavender, borderColor: COLORS.lavender },
  presetBtnText: { fontSize: 14, fontWeight: "600", color: COLORS.inkSoft },
  presetBtnTextActive: { color: "#fff" },
  linkRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  linkEmoji: { fontSize: 24 },
  linkTitle: { fontSize: 14, fontWeight: "700", color: COLORS.ink },
  linkSub: { fontSize: 11, color: COLORS.inkSoft, marginTop: 2 },
  linkArrow: { fontSize: 16, color: COLORS.inkSoft },
});
