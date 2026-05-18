import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { useTheme } from "@/theme/ThemeContext";
import { useProfile } from "@/hooks/useProfile";

type Props = {
  initialValue?: string;
  onSaved?: (name: string) => void;
};

export default function DisplayNameInput({ initialValue = "", onSaved }: Props) {
  const { theme } = useTheme();
  const { saveDisplayName } = useProfile();
  const [value, setValue] = useState(initialValue);
  const [saved, setSaved] = useState(false);

  const isDark = theme.isDark;
  const textColor = isDark ? "#ffffff" : "#1a1a1a";
  const subColor = isDark ? "rgba(255,255,255,0.55)" : "#6b7280";
  const inputBg = isDark ? "rgba(255,255,255,0.08)" : "#ffffff";
  const inputBorder = isDark ? "rgba(255,255,255,0.18)" : "#e5e0d8";

  const handleSave = async () => {
    if (!value.trim()) return;
    await saveDisplayName(value.trim());
    setSaved(true);
    onSaved?.(value.trim());
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <View style={s.root}>
      <Text style={[s.label, { color: subColor }]}>What should Tropely call you?</Text>
      <TextInput
        style={[s.input, { backgroundColor: inputBg, borderColor: inputBorder, color: textColor }]}
        value={value}
        onChangeText={(t) => { setValue(t); setSaved(false); }}
        placeholder="Your name"
        placeholderTextColor={isDark ? "rgba(255,255,255,0.3)" : "#b0a8a0"}
        maxLength={30}
        returnKeyType="done"
        onSubmitEditing={handleSave}
      />
      <TouchableOpacity
        style={[s.saveBtn, { backgroundColor: theme.colors.button }]}
        onPress={handleSave}
        activeOpacity={0.85}
      >
        <Text style={[s.saveBtnText, { color: theme.colors.buttonText }]}>
          {saved ? "Saved ✓" : "Save Name"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  root: { gap: 10 },
  label: { fontSize: 13, fontWeight: "500" },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: "500",
  },
  saveBtn: {
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
  },
  saveBtnText: { fontSize: 15, fontWeight: "700" },
});
