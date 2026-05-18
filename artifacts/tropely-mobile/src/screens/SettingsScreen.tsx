import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { COLORS, CARD_STYLE, SHADOW } from "@/constants/theme";

export default function SettingsScreen() {
  const { signOut } = useAuth();

  const sections = [
    {
      title: "Account",
      items: [
        { label: "Edit Profile", emoji: "👤", onPress: () => {} },
        { label: "Change Email", emoji: "✉️", onPress: () => {} },
        { label: "Change Password", emoji: "🔑", onPress: () => {} },
      ],
    },
    {
      title: "Safety & Privacy",
      items: [
        { label: "Blocked Users", emoji: "🚫", onPress: () => Alert.alert("Coming soon") },
        { label: "Report a Problem", emoji: "🚨", onPress: () => Alert.alert("Coming soon") },
        { label: "Community Guidelines", emoji: "📋", onPress: () => Alert.alert("Coming soon") },
        { label: "Privacy Policy", emoji: "🔒", onPress: () => Alert.alert("Coming soon") },
        { label: "Terms of Service", emoji: "📄", onPress: () => Alert.alert("Coming soon") },
      ],
    },
    {
      title: "Support",
      items: [
        { label: "Help Center", emoji: "❓", onPress: () => Alert.alert("Coming soon") },
        { label: "Send Feedback", emoji: "💌", onPress: () => Alert.alert("Coming soon") },
        { label: "What's New", emoji: "✨", onPress: () => Alert.alert("Coming soon") },
      ],
    },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Settings</Text>

        {sections.map((section) => (
          <View key={section.title}>
            <Text style={styles.sectionLabel}>{section.title}</Text>
            <View style={styles.sectionCard}>
              {section.items.map((item, idx) => (
                <TouchableOpacity
                  key={item.label}
                  style={[styles.settingRow, idx > 0 && styles.settingRowDivider]}
                  onPress={item.onPress}
                  activeOpacity={0.7}
                >
                  <Text style={styles.settingEmoji}>{item.emoji}</Text>
                  <Text style={styles.settingLabel}>{item.label}</Text>
                  <Text style={styles.settingArrow}>→</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Sign out at the bottom */}
        <TouchableOpacity
          style={styles.signOutBtn}
          onPress={() =>
            Alert.alert("Sign out?", "You'll need to sign back in.", [
              { text: "Cancel", style: "cancel" },
              { text: "Sign out", style: "destructive", onPress: () => signOut() },
            ])
          }
          activeOpacity={0.8}
        >
          <Text style={styles.signOutText}>Sign out</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>Tropely v1.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 20, gap: 12, paddingBottom: 48 },
  heading: { fontSize: 26, fontWeight: "800", color: COLORS.ink },
  sectionLabel: {
    fontSize: 11, fontWeight: "700", color: COLORS.inkSoft,
    letterSpacing: 0.8, textTransform: "uppercase", marginTop: 8, marginBottom: 6,
  },
  sectionCard: { ...CARD_STYLE, ...SHADOW, gap: 0, padding: 0, overflow: "hidden" },
  settingRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  settingRowDivider: { borderTopWidth: 1, borderTopColor: "rgba(0,0,0,0.05)" },
  settingEmoji: { fontSize: 18, width: 28 },
  settingLabel: { flex: 1, fontSize: 14, fontWeight: "500", color: COLORS.ink },
  settingArrow: { fontSize: 14, color: COLORS.inkSoft },
  signOutBtn: {
    marginTop: 8,
    borderWidth: 1, borderColor: "#fee2e2",
    borderRadius: 14, paddingVertical: 15,
    alignItems: "center", backgroundColor: "#fff",
  },
  signOutText: { fontSize: 15, fontWeight: "700", color: "#ef4444" },
  versionText: { textAlign: "center", fontSize: 11, color: COLORS.inkSoft, marginTop: 8 },
});
