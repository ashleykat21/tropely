import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useStore } from "@/store";
import { AVATARS, COLORS, SHADOW } from "@/constants/theme";

export default function AvatarPickerScreen() {
  const nav = useNavigation<any>();
  const { selectedAvatar, setSelectedAvatar } = useStore();

  const handleSelect = (id: string) => {
    setSelectedAvatar(id);
    nav.goBack();
  };

  const renderSection = (title: string, items: readonly { id: string; emoji: string; label: string; bg: string }[]) => (
    <>
      <Text style={styles.sectionLabel}>{title}</Text>
      <View style={styles.grid}>
        {items.map((a) => {
          const selected = selectedAvatar === a.id;
          return (
            <TouchableOpacity
              key={a.id}
              style={[
                styles.avatarBubble,
                { backgroundColor: a.bg },
                selected && styles.avatarBubbleSelected,
              ]}
              onPress={() => handleSelect(a.id)}
              activeOpacity={0.8}
            >
              <Text style={styles.avatarEmoji}>{a.emoji}</Text>
              <Text style={styles.avatarLabel} numberOfLines={2}>{a.label}</Text>
              {selected && <View style={styles.selectedTick}><Text style={styles.selectedTickText}>✓</Text></View>}
            </TouchableOpacity>
          );
        })}
      </View>
    </>
  );

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Choose your avatar</Text>
        <Text style={styles.sub}>Tap any avatar to select it.</Text>
        {renderSection("Reader types", AVATARS.readers)}
        {renderSection("Icons", AVATARS.icons)}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 20, gap: 12, paddingBottom: 40 },
  heading: { fontSize: 22, fontWeight: "800", color: COLORS.ink },
  sub: { fontSize: 14, color: COLORS.inkSoft, marginTop: -6 },
  sectionLabel: {
    fontSize: 11, fontWeight: "700", color: COLORS.inkSoft,
    letterSpacing: 0.8, textTransform: "uppercase", marginTop: 8,
  },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  avatarBubble: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
    gap: 2,
    ...SHADOW,
  },
  avatarBubbleSelected: {
    borderWidth: 3,
    borderColor: COLORS.lavender,
    shadowColor: COLORS.lavender,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  avatarEmoji: { fontSize: 32 },
  avatarLabel: { fontSize: 8, fontWeight: "600", color: COLORS.inkMid, textAlign: "center", paddingHorizontal: 4, lineHeight: 10 },
  selectedTick: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.lavender,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  selectedTickText: { fontSize: 9, color: "#fff", fontWeight: "700" },
});
