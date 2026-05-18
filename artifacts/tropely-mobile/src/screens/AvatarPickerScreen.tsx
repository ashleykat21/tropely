import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useStore } from "@/store";
import { getAvatarsByCategory, type AvatarCategory } from "@/constants/theme";
import { GradientView } from "@/components/GradientView";
import { useAtmosphere } from "@/hooks/useAtmosphere";

const CATEGORIES: { key: AvatarCategory; label: string }[] = [
  { key: "female", label: "Female Avatars" },
  { key: "male", label: "Male Avatars" },
  { key: "icons", label: "Non-avatar Icons" },
];

export default function AvatarPickerScreen() {
  const nav = useNavigation<any>();
  const atmosphere = useAtmosphere();
  const selectedAvatar = useStore((s) => s.selectedAvatar);
  const setSelectedAvatar = useStore((s) => s.setSelectedAvatar);
  const setSelectedAvatarCategory = useStore((s) => s.setSelectedAvatarCategory);
  const savedCategory = useStore((s) => s.selectedAvatarCategory);

  const [activeCategory, setActiveCategory] = useState<AvatarCategory>(savedCategory ?? "female");
  const [localSelected, setLocalSelected] = useState(selectedAvatar);

  const avatars = getAvatarsByCategory(activeCategory);
  const textColor = atmosphere.isDark ? "#fff" : "#1a1a1a";
  const subColor = atmosphere.isDark ? "rgba(255,255,255,0.65)" : "#6b7280";

  const handleSave = () => {
    setSelectedAvatar(localSelected);
    setSelectedAvatarCategory(activeCategory);
    nav.goBack();
  };

  return (
    <GradientView colors={atmosphere.gradient} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => nav.goBack()} style={styles.backBtn}>
            <Text style={{ fontSize: 16, color: textColor }}>←</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: textColor }]}>Choose Your Avatar</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Category tabs */}
        <View style={styles.tabRow}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.key}
              style={[
                styles.tab,
                activeCategory === cat.key && { backgroundColor: atmosphere.accentColor },
                activeCategory !== cat.key && {
                  backgroundColor: "rgba(255,255,255,0.3)",
                  borderColor: "rgba(255,255,255,0.5)",
                  borderWidth: 1,
                },
              ]}
              onPress={() => setActiveCategory(cat.key)}
            >
              <Text style={[styles.tabText, { color: activeCategory === cat.key ? "#fff" : textColor }]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Avatar grid */}
        <ScrollView contentContainerStyle={styles.grid}>
          {avatars.map((avatar) => {
            const isSelected = localSelected === avatar.id;
            return (
              <TouchableOpacity
                key={avatar.id}
                style={styles.avatarWrapper}
                onPress={() => setLocalSelected(avatar.id)}
              >
                <View
                  style={[
                    styles.avatarCircle,
                    { backgroundColor: avatar.bg },
                    isSelected && {
                      borderWidth: 3,
                      borderColor: atmosphere.accentColor,
                      shadowColor: atmosphere.accentColor,
                      shadowOpacity: 0.4,
                      shadowRadius: 8,
                      shadowOffset: { width: 0, height: 2 },
                      elevation: 5,
                    },
                  ]}
                >
                  <Text style={styles.avatarEmoji}>{avatar.emoji}</Text>
                  {isSelected && (
                    <View style={[styles.checkBadge, { backgroundColor: atmosphere.accentColor }]}>
                      <Text style={styles.checkText}>✓</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.avatarLabel, { color: subColor }]} numberOfLines={2}>
                  {avatar.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Save button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: atmosphere.accentColor }]}
            onPress={handleSave}
          >
            <Text style={styles.saveBtnText}>Save Avatar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </GradientView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: { width: 40, height: 40, justifyContent: "center" },
  title: { fontSize: 18, fontWeight: "700" },
  tabRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexWrap: "wrap",
  },
  tab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  tabText: { fontSize: 13, fontWeight: "600" },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 12,
    paddingBottom: 100,
    gap: 8,
    justifyContent: "flex-start",
  },
  avatarWrapper: { width: "30%", alignItems: "center", marginBottom: 8 },
  avatarCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarEmoji: { fontSize: 32 },
  checkBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  checkText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  avatarLabel: {
    fontSize: 11,
    textAlign: "center",
    marginTop: 4,
    fontWeight: "500",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 32,
  },
  saveBtn: { borderRadius: 16, paddingVertical: 16, alignItems: "center" },
  saveBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
