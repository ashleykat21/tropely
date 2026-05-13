import React, { useState } from "react";
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
import { useUser, useAuth } from "@clerk/clerk-expo";
import { useStore } from "@/store";

// expo-notifications — gracefully handle if not available in current native build
let Notifications: any = null;
try {
  Notifications = require("expo-notifications");
} catch {
  // not bundled yet — reminders will be disabled silently
}

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

const BADGES = [
  { id: "first_book", label: "First Book", emoji: "📖", desc: "Add your first book" },
  { id: "10_sessions", label: "Consistent Reader", emoji: "🔥", desc: "Log 10 reading sessions" },
  { id: "5_highlights", label: "Bookmarker", emoji: "🔖", desc: "Save 5 highlights" },
  { id: "finish_book", label: "Finisher", emoji: "🏁", desc: "Finish a book" },
  { id: "3_moods", label: "Mood Reader", emoji: "🎭", desc: "Read in 3 different moods" },
];

async function scheduleReminder(time: string) {
  if (!Notifications) return;
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
    const msg = REMINDER_MESSAGES[new Date().getDay() % REMINDER_MESSAGES.length];
    await Notifications.scheduleNotificationAsync({
      content: { title: "Time to read 📚", body: msg },
      trigger: { hour, minute, repeats: true },
    });
    return true;
  } catch {
    return false;
  }
}

async function cancelReminder() {
  if (!Notifications) return;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {
    // ignore
  }
}

export default function ProfileScreen() {
  const { user } = useUser();
  const { signOut } = useAuth();
  const {
    books, sessions, journal, highlights, age,
    dailyGoalPages, dailyGoalMinutes,
    reminderEnabled, reminderTime,
    setAge, setDailyGoalPages, setDailyGoalMinutes,
    setReminderEnabled, setReminderTime,
  } = useStore();

  const [ageInput, setAgeInput] = useState(age?.toString() ?? "");
  const [editingAge, setEditingAge] = useState(false);
  const [editingReminderTime, setEditingReminderTime] = useState(false);
  const [reminderTimeInput, setReminderTimeInput] = useState(reminderTime);

  const saveAge = () => {
    const n = parseInt(ageInput, 10);
    if (n > 0 && n < 120) { setAge(n); setEditingAge(false); }
    else Alert.alert("Enter a valid age.");
  };

  const toggleReminder = async (v: boolean) => {
    if (v) {
      const ok = await scheduleReminder(reminderTime);
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
    if (reminderEnabled) await scheduleReminder(reminderTimeInput);
  };

  // Badge unlock logic
  const earnedBadges = new Set<string>();
  if (books.length >= 1) earnedBadges.add("first_book");
  if (sessions.length >= 10) earnedBadges.add("10_sessions");
  if (highlights.length >= 5) earnedBadges.add("5_highlights");
  if (books.some((b) => b.shelf === "finished")) earnedBadges.add("finish_book");
  const moods = new Set(books.map((b) => b.mood).filter(Boolean));
  if (moods.size >= 3) earnedBadges.add("3_moods");

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* User info */}
        <View style={styles.profileCard}>
          {user?.imageUrl ? (
            <Image source={{ uri: user.imageUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarInitial}>
                {user?.firstName?.[0] ?? user?.primaryEmailAddress?.emailAddress?.[0]?.toUpperCase() ?? "?"}
              </Text>
            </View>
          )}
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={styles.displayName}>
              {user?.fullName ?? user?.username ?? "Reader"}
            </Text>
            <Text style={styles.email}>{user?.primaryEmailAddress?.emailAddress}</Text>
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

        {/* Badges */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Achievements</Text>
          <View style={styles.badgeGrid}>
            {BADGES.map((badge) => {
              const earned = earnedBadges.has(badge.id);
              return (
                <View key={badge.id} style={[styles.badge, !earned && styles.badgeLocked]}>
                  <Text style={[styles.badgeEmoji, !earned && styles.badgeEmojiLocked]}>
                    {badge.emoji}
                  </Text>
                  <Text style={[styles.badgeLabel, !earned && styles.badgeLabelLocked]}>
                    {badge.label}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Daily reading reminder */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Daily reading reminder</Text>
          <Text style={styles.cardSub}>
            A trope-fuelled nudge at your chosen time.
          </Text>
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

        {/* Age setting */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Your age</Text>
          <Text style={styles.cardSub}>Used to filter age-appropriate content.</Text>
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
  profileCard: { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: "#fff", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#f0f0f0" },
  avatar: { width: 60, height: 60, borderRadius: 30 },
  avatarPlaceholder: { backgroundColor: "#e5e7eb", justifyContent: "center", alignItems: "center" },
  avatarInitial: { fontSize: 24, fontWeight: "700", color: "#6b7280" },
  displayName: { fontSize: 17, fontWeight: "700", color: "#1a1a1a" },
  email: { fontSize: 13, color: "#9ca3af" },
  statsRow: { flexDirection: "row", backgroundColor: "#fff", borderRadius: 16, borderWidth: 1, borderColor: "#f0f0f0", overflow: "hidden" },
  statBox: { flex: 1, alignItems: "center", paddingVertical: 14, borderRightWidth: 1, borderRightColor: "#f0f0f0" },
  statNum: { fontSize: 20, fontWeight: "700", color: "#1a1a1a" },
  statLbl: { fontSize: 10, color: "#9ca3af", marginTop: 2 },
  card: { backgroundColor: "#fff", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#f0f0f0", gap: 10 },
  cardTitle: { fontSize: 15, fontWeight: "700", color: "#1a1a1a" },
  cardSub: { fontSize: 12, color: "#9ca3af", marginTop: -4 },
  badgeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  badge: { width: "30%", alignItems: "center", gap: 4, paddingVertical: 10, backgroundColor: "#f9fafb", borderRadius: 12 },
  badgeLocked: { opacity: 0.4 },
  badgeEmoji: { fontSize: 26 },
  badgeEmojiLocked: { opacity: 0.5 },
  badgeLabel: { fontSize: 10, fontWeight: "600", color: "#1a1a1a", textAlign: "center" },
  badgeLabelLocked: { color: "#9ca3af" },
  // Reminder
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
  signOutBtn: { borderWidth: 1, borderColor: "#fee2e2", borderRadius: 12, paddingVertical: 14, alignItems: "center", backgroundColor: "#fff" },
  signOutText: { fontSize: 15, fontWeight: "600", color: "#ef4444" },
});
