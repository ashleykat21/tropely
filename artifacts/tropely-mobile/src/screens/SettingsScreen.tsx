import React, { useState } from "react";
import { View, Text, Switch, TouchableOpacity, ScrollView, StyleSheet, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useStore } from "@/store";
import { useAuth } from "@/context/AuthContext";

export default function SettingsScreen() {
  const nav = useNavigation();
  const { signOut } = useAuth();
  const reminderEnabled = useStore((s) => s.reminderEnabled);
  const reminderTime    = useStore((s) => s.reminderTime);
  const setReminderEnabled = useStore((s) => s.setReminderEnabled);
  const spoilerStrictness     = useStore((s) => s.spoilerStrictness);
  const setSpoilerStrictness  = useStore((s) => s.setSpoilerStrictness);
  const defaultShareVisibility    = useStore((s) => s.defaultShareVisibility);
  const setDefaultShareVisibility = useStore((s) => s.setDefaultShareVisibility);
  const isPremium = useStore((s) => s.isPremium);

  function confirmDeleteAccount() {
    Alert.alert(
      "Delete Account",
      "This will permanently delete your account and all your data. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => signOut() },
      ],
    );
  }

  const spoilerOptions: Array<{ value: typeof spoilerStrictness; label: string; desc: string }> = [
    { value: "relaxed",  label: "Relaxed",  desc: "Show all content, no blurring" },
    { value: "balanced", label: "Balanced", desc: "Blur past your current page" },
    { value: "strict",   label: "Strict",   desc: "Blur everything beyond chapter" },
  ];

  const visibilityOptions: Array<{ value: typeof defaultShareVisibility; label: string }> = [
    { value: "public",  label: "Everyone" },
    { value: "friends", label: "Friends only" },
    { value: "private", label: "Just me" },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.content}>

        <Text style={styles.section}>Reading Reminders</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Daily reminder</Text>
            <Switch value={reminderEnabled} onValueChange={setReminderEnabled} />
          </View>
          {reminderEnabled && (
            <View style={[styles.row, { borderTopWidth: 1, borderTopColor: "#f0ede8" }]}>
              <Text style={styles.rowLabel}>Time</Text>
              <Text style={styles.rowValue}>{reminderTime}</Text>
            </View>
          )}
        </View>

        <Text style={styles.section}>Spoiler Guardrails</Text>
        <View style={styles.card}>
          {spoilerOptions.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.row, styles.optionRow]}
              onPress={() => setSpoilerStrictness(opt.value)}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.rowLabel}>{opt.label}</Text>
                <Text style={styles.rowSub}>{opt.desc}</Text>
              </View>
              <View style={[styles.radio, spoilerStrictness === opt.value && styles.radioActive]} />
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.section}>Default Share Visibility</Text>
        <View style={styles.card}>
          {visibilityOptions.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.row, styles.optionRow]}
              onPress={() => setDefaultShareVisibility(opt.value)}
            >
              <Text style={styles.rowLabel}>{opt.label}</Text>
              <View style={[styles.radio, defaultShareVisibility === opt.value && styles.radioActive]} />
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.section}>Account</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.row} onPress={signOut}>
            <Text style={styles.rowLabel}>Sign out</Text>
            <Text style={styles.rowArrow}>→</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.row, { borderTopWidth: 1, borderTopColor: "#f0ede8" }]}
            onPress={confirmDeleteAccount}
          >
            <Text style={[styles.rowLabel, { color: "#ef4444" }]}>Delete account</Text>
          </TouchableOpacity>
        </View>

        {!isPremium && (
          <>
            <Text style={styles.section}>Premium</Text>
            <View style={[styles.card, styles.premiumCard]}>
              <Text style={styles.premiumTitle}>Upgrade to Tropely Premium</Text>
              <Text style={styles.premiumDesc}>Unlock Companion In Character, full Insights history, Buddy Reads rooms, and more.</Text>
              <TouchableOpacity style={styles.premiumBtn}>
                <Text style={styles.premiumBtnText}>See plans →</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fafaf9" },
  content: { padding: 16, gap: 8, paddingBottom: 40 },
  section: { fontSize: 11, fontWeight: "700", color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.8, marginTop: 8, marginLeft: 4 },
  card: { backgroundColor: "#fff", borderRadius: 16, borderWidth: 1, borderColor: "#f0ede8", overflow: "hidden" },
  row: { flexDirection: "row", alignItems: "center", padding: 14, justifyContent: "space-between" },
  optionRow: { gap: 10 },
  rowLabel: { fontSize: 15, color: "#1a1a1a", fontWeight: "500" },
  rowSub: { fontSize: 12, color: "#9ca3af", marginTop: 2 },
  rowValue: { fontSize: 14, color: "#6b7280" },
  rowArrow: { fontSize: 16, color: "#9ca3af" },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: "#e5e7eb" },
  radioActive: { borderColor: "#1a1a1a", backgroundColor: "#1a1a1a" },
  premiumCard: { padding: 16, gap: 8 },
  premiumTitle: { fontSize: 16, fontWeight: "700", color: "#1a1a1a" },
  premiumDesc: { fontSize: 13, color: "#6b7280", lineHeight: 19 },
  premiumBtn: { alignSelf: "flex-start", backgroundColor: "#1a1a1a", borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8, marginTop: 4 },
  premiumBtnText: { color: "#fff", fontSize: 13, fontWeight: "600" },
});
