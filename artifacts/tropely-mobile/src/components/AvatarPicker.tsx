import React, { useState } from "react";
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
} from "react-native";
import {
  FEMALE_AVATARS, MALE_AVATARS, NON_AVATAR_ICONS, getAvatarById,
  type AvatarEntry, type AvatarCategoryNew,
} from "@/data/avatars";
import { useTheme } from "@/theme/ThemeContext";

type Props = {
  currentAvatarId: string | null;
  onSelect: (avatarId: string, category: AvatarCategoryNew) => void;
  onSave: () => void;
  saveLabel?: string;
};

const CATEGORY_TABS: { key: AvatarCategoryNew; label: string }[] = [
  { key: "female",     label: "Female Avatars" },
  { key: "male",       label: "Male Avatars" },
  { key: "non_avatar", label: "Non-Avatar Icons" },
];

function AvatarCell({
  avatar,
  selected,
  accentColor,
  onPress,
  small,
}: {
  avatar: AvatarEntry;
  selected: boolean;
  accentColor: string;
  onPress: () => void;
  small?: boolean;
}) {
  const size = small ? 64 : 76;
  const emojiSize = small ? 26 : 32;
  const borderRadius = small ? 14 : 18;

  return (
    <TouchableOpacity style={[s.avatarCell, small && s.avatarCellSmall]} onPress={onPress} activeOpacity={0.8}>
      <View
        style={[
          s.avatarShape,
          {
            width: size,
            height: size,
            borderRadius,
            backgroundColor: avatar.backgroundColor,
            borderWidth: selected ? 2.5 : 0,
            borderColor: selected ? accentColor : "transparent",
            shadowColor: selected ? accentColor : "#000",
            shadowOpacity: selected ? 0.35 : 0.06,
            shadowRadius: selected ? 10 : 4,
            shadowOffset: { width: 0, height: selected ? 3 : 1 },
            elevation: selected ? 5 : 1,
          },
        ]}
      >
        <Text style={{ fontSize: emojiSize }}>{avatar.emoji}</Text>
        {selected && (
          <View style={[s.checkBadge, { backgroundColor: accentColor }]}>
            <Text style={s.checkText}>✓</Text>
          </View>
        )}
      </View>
      <Text style={s.avatarName} numberOfLines={2}>{avatar.name}</Text>
    </TouchableOpacity>
  );
}

export default function AvatarPicker({ currentAvatarId, onSelect, onSave, saveLabel = "Save" }: Props) {
  const { theme } = useTheme();
  const accentColor = theme.colors.accent;
  const isDark = theme.isDark;
  const textColor = isDark ? "#ffffff" : "#1a1a1a";
  const subColor = isDark ? "rgba(255,255,255,0.6)" : "#6b7280";

  const [activeTab, setActiveTab] = useState<AvatarCategoryNew>("female");
  const [localId, setLocalId] = useState(currentAvatarId ?? "cozy_romance_reader");

  const currentAvatar = getAvatarById(localId);
  const isNonAvatar = activeTab === "non_avatar";
  const avatarsForTab = activeTab === "female" ? FEMALE_AVATARS : activeTab === "male" ? MALE_AVATARS : NON_AVATAR_ICONS;

  const handleSelect = (avatar: AvatarEntry) => {
    setLocalId(avatar.id);
    onSelect(avatar.id, avatar.category);
  };

  return (
    <View style={s.root}>
      {/* Header */}
      <View style={s.headerBlock}>
        <Text style={[s.title, { color: textColor }]}>Choose your profile icon</Text>
        <Text style={[s.subtitle, { color: subColor }]}>Pick the face (or friend) that feels most you. ✦</Text>
      </View>

      {/* Selected preview */}
      <View style={s.previewRow}>
        <View style={[s.previewBubble, { backgroundColor: currentAvatar.backgroundColor }]}>
          <Text style={s.previewEmoji}>{currentAvatar.emoji}</Text>
        </View>
        <Text style={[s.previewName, { color: textColor }]}>{currentAvatar.name}</Text>
      </View>

      {/* Category tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tabRow}>
        {CATEGORY_TABS.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[
                s.tab,
                {
                  backgroundColor: active ? accentColor : (isDark ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.7)"),
                  borderColor: active ? accentColor : (isDark ? "rgba(255,255,255,0.2)" : "#e5e0d8"),
                },
              ]}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.8}
            >
              <Text style={[s.tabText, { color: active ? "#fff" : subColor }]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Avatar grid */}
      <ScrollView
        contentContainerStyle={[s.grid, isNonAvatar && s.gridIcons]}
        showsVerticalScrollIndicator={false}
      >
        {avatarsForTab.map((avatar) => (
          <AvatarCell
            key={avatar.id}
            avatar={avatar}
            selected={localId === avatar.id}
            accentColor={accentColor}
            onPress={() => handleSelect(avatar)}
            small={isNonAvatar}
          />
        ))}
      </ScrollView>

      {/* Save button */}
      <View style={s.footer}>
        <TouchableOpacity style={[s.saveBtn, { backgroundColor: accentColor }]} onPress={onSave} activeOpacity={0.85}>
          <Text style={s.saveBtnText}>{saveLabel}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },

  headerBlock: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
    gap: 4,
  },
  title: { fontSize: 20, fontWeight: "800", letterSpacing: -0.3 },
  subtitle: { fontSize: 13, fontWeight: "400" },

  previewRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  previewBubble: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  previewEmoji: { fontSize: 26 },
  previewName: { fontSize: 14, fontWeight: "600" },

  tabRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  tabText: { fontSize: 12, fontWeight: "600" },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 12,
    paddingBottom: 100,
    gap: 4,
  },
  gridIcons: { gap: 4 },

  avatarCell: {
    width: "25%",
    alignItems: "center",
    paddingVertical: 8,
    gap: 6,
  },
  avatarCellSmall: { width: "20%" },
  avatarShape: {
    justifyContent: "center",
    alignItems: "center",
  },
  checkBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
  },
  checkText: { color: "#fff", fontSize: 9, fontWeight: "800" },
  avatarName: {
    fontSize: 9,
    textAlign: "center",
    color: "#9ca3af",
    fontWeight: "500",
    lineHeight: 13,
  },

  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 28,
    backgroundColor: "transparent",
  },
  saveBtn: { borderRadius: 16, paddingVertical: 15, alignItems: "center" },
  saveBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
