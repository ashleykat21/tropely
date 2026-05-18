import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Linking,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/navigation";
import { useAuth } from "@/context/AuthContext";
import { useStore } from "@/store";
import { COLORS, CARD_STYLE, SHADOW } from "@/constants/theme";
import Constants from "expo-constants";

type Nav = NativeStackNavigationProp<RootStackParamList>;

async function handleSendFeedback() {
  const version = Constants.expoConfig?.version ?? "unknown";
  const platform = Platform.OS;
  const subject = encodeURIComponent("Tropely Feedback");
  const body = encodeURIComponent(`App Version: ${version}\nPlatform: ${platform}\n\n`);
  const url = `mailto:support@usenevora.com?subject=${subject}&body=${body}`;
  const canOpen = await Linking.canOpenURL(url);
  if (canOpen) {
    Linking.openURL(url);
  } else {
    Alert.alert("Contact Support", "Email us at support@usenevora.com");
  }
}

export default function SettingsScreen() {
  const nav = useNavigation<Nav>();
  const { signOut } = useAuth();
  const premiumTestingModeEnabled = useStore((s) => s.premiumTestingModeEnabled);

  const sections = [
    {
      title: "Account",
      items: [
        {
          label: "Premium",
          emoji: "✨",
          onPress: () => nav.navigate("Premium"),
          badge: premiumTestingModeEnabled ? "(Testing Mode)" : undefined,
        },
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
        { label: "What's New", emoji: "✨", onPress: () => Alert.alert("Coming soon") },
      ],
    },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Settings</Text>

        {/* Feedback & Support section */}
        <View>
          <Text style={styles.sectionLabel}>Feedback & Support</Text>
          <View style={styles.sectionCard}>
            <TouchableOpacity style={styles.settingRow} onPress={handleSendFeedback} activeOpacity={0.7}>
              <Text style={styles.settingEmoji}>💌</Text>
              <Text style={styles.settingLabel}>Send Feedback</Text>
              <Text style={styles.settingArrow}>→</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.settingRow, styles.settingRowDivider]}
              onPress={handleSendFeedback}
              activeOpacity={0.7}
            >
              <Text style={styles.settingEmoji}>🎧</Text>
              <Text style={styles.settingLabel}>Contact Support</Text>
              <Text style={styles.settingArrow}>→</Text>
            </TouchableOpacity>
          </View>
        </View>

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
                  {"badge" in item && item.badge ? (
                    <Text style={styles.settingBadge}>{item.badge}</Text>
                  ) : null}
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
  settingBadge: { fontSize: 11, color: COLORS.lavender, fontWeight: "600", marginRight: 4 },
  signOutBtn: {
    marginTop: 8,
    borderWidth: 1, borderColor: "#fee2e2",
    borderRadius: 14, paddingVertical: 15,
    alignItems: "center", backgroundColor: "#fff",
  },
  signOutText: { fontSize: 15, fontWeight: "700", color: "#ef4444" },
  versionText: { textAlign: "center", fontSize: 11, color: COLORS.inkSoft, marginTop: 8 },
});
