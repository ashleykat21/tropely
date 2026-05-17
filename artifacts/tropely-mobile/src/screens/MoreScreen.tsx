import React from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/navigation";
import { useAuth } from "@/context/AuthContext";

type Nav = NativeStackNavigationProp<RootStackParamList>;

const ITEMS = [
  { label: "Journal",       emoji: "📓", screen: "Journal",    desc: "Quotes, notes & reflections" },
  { label: "Insights",      emoji: "📊", screen: "Insights",   desc: "Your reading DNA & stats" },
  { label: "AI Companion",  emoji: "✨", screen: "Companion",  desc: "Chat about your current read" },
  { label: "Buddy Reads",   emoji: "👥", screen: "BuddyReads", desc: "Read together with friends" },
  { label: "Trope Match",   emoji: "🎭", screen: "TropeMatch", desc: "Find your next read by trope" },
  { label: "Community",     emoji: "🌿", screen: "Social",     desc: "See what friends are reading" },
  { label: "What's New",    emoji: "🆕", screen: "WhatsNew",   desc: "New features & coming soon" },
  { label: "Settings",      emoji: "⚙️", screen: "Settings",   desc: "Notifications, privacy & more" },
] as const;

export default function MoreScreen() {
  const nav = useNavigation<Nav>();
  const { user, signOut } = useAuth();

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>More</Text>
        {user && (
          <View style={styles.profileBadge}>
            <Text style={styles.profileName}>{user.displayName ?? user.email}</Text>
            <Text style={styles.profileEmail}>{user.email}</Text>
          </View>
        )}
        <View style={styles.grid}>
          {ITEMS.map((item) => (
            <TouchableOpacity
              key={item.screen}
              style={styles.tile}
              onPress={() => nav.navigate(item.screen as any)}
              activeOpacity={0.7}
            >
              <Text style={styles.tileEmoji}>{item.emoji}</Text>
              <Text style={styles.tileLabel}>{item.label}</Text>
              <Text style={styles.tileDesc}>{item.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={styles.signOutBtn} onPress={signOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fafaf9" },
  content: { padding: 20, gap: 16, paddingBottom: 40 },
  title: { fontSize: 32, fontWeight: "800", color: "#1a1a1a" },
  profileBadge: { backgroundColor: "#fff", borderRadius: 14, padding: 14, borderWidth: 1, borderColor: "#f0ede8" },
  profileName: { fontSize: 15, fontWeight: "700", color: "#1a1a1a" },
  profileEmail: { fontSize: 12, color: "#9ca3af", marginTop: 2 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  tile: { width: "47%", backgroundColor: "#fff", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#f0ede8", gap: 6 },
  tileEmoji: { fontSize: 26 },
  tileLabel: { fontSize: 14, fontWeight: "700", color: "#1a1a1a" },
  tileDesc: { fontSize: 11, color: "#9ca3af", lineHeight: 15 },
  signOutBtn: { alignSelf: "center", paddingVertical: 10, paddingHorizontal: 24, borderRadius: 20, borderWidth: 1, borderColor: "#f0ede8" },
  signOutText: { fontSize: 13, color: "#9ca3af" },
});
