import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";

const NEW_FEATURES = [
  { emoji: "🪴", title: "Mood-Tinted Reading", desc: "Set your current reading mood and watch the app shift its palette to match." },
  { emoji: "🧭", title: "New Releases Tab", desc: "Browse what's new and upcoming — subscribe to get notified when your next read drops." },
  { emoji: "📓", title: "Journal Everywhere", desc: "Journal is now accessible from any screen via the 📓 icon. Quotes, notes, triggers, reflections." },
  { emoji: "👥", title: "Community Feed", desc: "See what your reading friends are finishing, rating, and quoting — with spoiler guardrails." },
  { emoji: "🎯", title: "Challenges", desc: "Set custom reading challenges beyond your annual goal — pages, books, minutes." },
  { emoji: "⚡", title: "Focus Mode", desc: "Full-screen timer for deep reading sessions. Log your mood and note when done." },
];

const COMING_SOON = [
  { emoji: "🎙️", title: "Audiobook Timer",    desc: "Track listening time separately from pages." },
  { emoji: "📸", title: "Highlight OCR",       desc: "Photo-to-quote: snap a passage and it transcribes automatically." },
  { emoji: "🤝", title: "Reading Groups",       desc: "Create public reading groups around a book or trope." },
  { emoji: "🏆", title: "Trope Leaderboards",   desc: "See who in your circle has read the most slow-burn romances this month." },
];

export default function WhatsNewScreen() {
  const nav = useNavigation();
  const [tab, setTab] = useState<"new" | "soon">("new");

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.goBack()} style={styles.closeBtn}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.title}>What's New</Text>
        <View style={{ width: 32 }} />
      </View>

      <View style={styles.tabs}>
        {(["new", "soon"] as const).map((t) => (
          <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === "new" ? "New Features" : "Coming Soon"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {(tab === "new" ? NEW_FEATURES : COMING_SOON).map((item) => (
          <View key={item.title} style={styles.card}>
            <Text style={styles.emoji}>{item.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardDesc}>{item.desc}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fafaf9" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16 },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#f5f0ea", justifyContent: "center", alignItems: "center" },
  closeText: { fontSize: 14, color: "#6b7280" },
  title: { fontSize: 18, fontWeight: "700", color: "#1a1a1a" },
  tabs: { flexDirection: "row", marginHorizontal: 16, marginBottom: 8, backgroundColor: "#f5f0ea", borderRadius: 12, padding: 3 },
  tab: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: "center" },
  tabActive: { backgroundColor: "#fff" },
  tabText: { fontSize: 13, color: "#9ca3af", fontWeight: "600" },
  tabTextActive: { color: "#1a1a1a" },
  content: { padding: 16, gap: 10 },
  card: { flexDirection: "row", gap: 14, backgroundColor: "#fff", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#f0ede8", alignItems: "flex-start" },
  emoji: { fontSize: 28, marginTop: 2 },
  cardTitle: { fontSize: 15, fontWeight: "700", color: "#1a1a1a", marginBottom: 4 },
  cardDesc: { fontSize: 13, color: "#6b7280", lineHeight: 19 },
});
