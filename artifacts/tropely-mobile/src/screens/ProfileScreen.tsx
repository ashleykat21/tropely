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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUser, useAuth } from "@clerk/clerk-expo";
import { useStore } from "@/store";

const GOAL_PAGE_PRESETS = [10, 20, 30, 50];
const GOAL_MIN_PRESETS = [15, 30, 60];

const BADGES = [
  { id: "first_book", label: "First Book", emoji: "📖", desc: "Add your first book" },
  { id: "10_sessions", label: "Consistent Reader", emoji: "🔥", desc: "Log 10 reading sessions" },
  { id: "5_highlights", label: "Bookmarker", emoji: "🔖", desc: "Save 5 highlights" },
  { id: "finish_book", label: "Finisher", emoji: "🏁", desc: "Finish a book" },
  { id: "3_moods", label: "Mood Reader", emoji: "🎭", desc: "Read in 3 different moods" },
];

export default function ProfileScreen() {
  const { user } = useUser();
  const { signOut } = useAuth();
  const {
    books, sessions, journal, age,
    dailyGoalPages, dailyGoalMinutes,
    setAge, setDailyGoalPages, setDailyGoalMinutes,
  } = useStore();

  const [ageInput, setAgeInput] = useState(age?.toString() ?? "");
  const [editingAge, setEditingAge] = useState(false);

  const saveAge = () => {
    const n = parseInt(ageInput, 10);
    if (n > 0 && n < 120) { setAge(n); setEditingAge(false); }
    else Alert.alert("Enter a valid age.");
  };

  // Badge unlock logic
  const earnedBadges = new Set<string>();
  if (books.length >= 1) earnedBadges.add("first_book");
  if (sessions.length >= 10) earnedBadges.add("10_sessions");
  if (journal.filter((j) => j.kind === "quote").length >= 5) earnedBadges.add("5_highlights");
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

        {/* Daily goal — pages */}
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
