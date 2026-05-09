import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { StarRating } from "@/components/StarRating";
import { useColors } from "@/hooks/useColors";
import { useStore, streak, todaySessions } from "@/lib/store";

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const profile = useStore((s) => s.profile);
  const books = useStore((s) => s.books);
  const updateProfile = useStore((s) => s.updateProfile);

  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(profile.name);

  const totalBooksRead = books.filter((b) => b.shelf === "finished").length;
  const totalPages = books.reduce((a, b) => a + b.currentPage, 0);
  const currentStreak = streak(books);
  const todaySess = todaySessions(books);
  const todayPages = todaySess.reduce((a, s) => a + s.pages, 0);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        { paddingTop: topPad + 8, paddingBottom: botPad + 100 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.nameRow}>
        {editingName ? (
          <View style={styles.nameEdit}>
            <TextInput
              style={[
                styles.nameInput,
                {
                  color: colors.foreground,
                  borderColor: colors.border,
                  borderRadius: 12,
                  fontFamily: "Inter_700Bold",
                },
              ]}
              value={nameInput}
              onChangeText={setNameInput}
              autoFocus
              onBlur={() => {
                updateProfile({ name: nameInput || "Reader" });
                setEditingName(false);
              }}
              returnKeyType="done"
            />
          </View>
        ) : (
          <Pressable onPress={() => setEditingName(true)} style={styles.nameDisplay}>
            <Text style={[styles.name, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
              {profile.name}
            </Text>
            <Feather name="edit-2" size={14} color={colors.mutedForeground} style={{ marginTop: 4 }} />
          </Pressable>
        )}
      </View>

      <View style={styles.statsGrid}>
        {[
          { label: "Books Read", value: totalBooksRead },
          { label: "Pages Read", value: totalPages.toLocaleString() },
          { label: "Day Streak", value: currentStreak },
          { label: "Today", value: `${todayPages}p` },
        ].map((s) => (
          <View
            key={s.label}
            style={[
              styles.statCard,
              { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius },
            ]}
          >
            <Text style={[styles.statValue, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
              {s.value}
            </Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              {s.label}
            </Text>
          </View>
        ))}
      </View>

      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
        <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
          Daily goals
        </Text>
        <View style={styles.goalRow}>
          <Text style={[styles.goalLabel, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}>
            Pages per day
          </Text>
          <View style={styles.goalBtns}>
            {[10, 20, 30, 50].map((n) => (
              <Pressable
                key={n}
                style={[
                  styles.goalBtn,
                  {
                    backgroundColor: profile.dailyGoalPages === n ? colors.foreground : colors.muted,
                    borderRadius: 10,
                  },
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  updateProfile({ dailyGoalPages: n });
                }}
              >
                <Text
                  style={[
                    styles.goalBtnText,
                    {
                      color: profile.dailyGoalPages === n ? colors.primaryForeground : colors.foreground,
                      fontFamily: "Inter_500Medium",
                    },
                  ]}
                >
                  {n}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <View style={styles.goalRow}>
          <Text style={[styles.goalLabel, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}>
            Minutes per day
          </Text>
          <View style={styles.goalBtns}>
            {[15, 30, 45, 60].map((n) => (
              <Pressable
                key={n}
                style={[
                  styles.goalBtn,
                  {
                    backgroundColor: profile.dailyGoalMinutes === n ? colors.foreground : colors.muted,
                    borderRadius: 10,
                  },
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  updateProfile({ dailyGoalMinutes: n });
                }}
              >
                <Text
                  style={[
                    styles.goalBtnText,
                    {
                      color: profile.dailyGoalMinutes === n ? colors.primaryForeground : colors.foreground,
                      fontFamily: "Inter_500Medium",
                    },
                  ]}
                >
                  {n}m
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>

      {books.filter((b) => b.shelf === "finished").length > 0 && (
        <View
          style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}
        >
          <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
            Finished books
          </Text>
          {books
            .filter((b) => b.shelf === "finished")
            .slice(0, 5)
            .map((b) => (
              <View key={b.id} style={styles.finishedRow}>
                <Text
                  style={[styles.finishedTitle, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}
                  numberOfLines={1}
                >
                  {b.title}
                </Text>
                <StarRating value={b.rating ?? 0} size={14} />
              </View>
            ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 20 },
  nameRow: { paddingTop: 4 },
  nameDisplay: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  nameEdit: {},
  name: { fontSize: 32, lineHeight: 38 },
  nameInput: {
    fontSize: 28,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 200,
  },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statCard: {
    flex: 1,
    minWidth: "45%",
    padding: 16,
    borderWidth: 1,
    gap: 4,
  },
  statValue: { fontSize: 28 },
  statLabel: { fontSize: 12 },
  section: { borderWidth: 1, padding: 16, gap: 14 },
  sectionTitle: { fontSize: 17 },
  goalRow: { gap: 10 },
  goalLabel: { fontSize: 15 },
  goalBtns: { flexDirection: "row", gap: 8 },
  goalBtn: { paddingHorizontal: 14, paddingVertical: 8 },
  goalBtnText: { fontSize: 14 },
  divider: { height: StyleSheet.hairlineWidth },
  finishedRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  finishedTitle: { flex: 1, fontSize: 14, marginRight: 12 },
});
