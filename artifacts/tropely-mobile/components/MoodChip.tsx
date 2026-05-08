import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { useColors } from "@/hooks/useColors";
import { MOODS } from "@/lib/moods";
import type { MoodKey } from "@/constants/colors";

interface Props {
  moodKey: MoodKey;
  selected?: boolean;
  onPress?: () => void;
  compact?: boolean;
}

export function MoodChip({ moodKey, selected, onPress, compact }: Props) {
  const colors = useColors();
  const mood = MOODS[moodKey];

  const s = StyleSheet.create({
    chip: {
      flexDirection: "row", alignItems: "center",
      gap: compact ? 4 : 6,
      paddingHorizontal: compact ? 10 : 14,
      paddingVertical: compact ? 6 : 9,
      borderRadius: 40, borderWidth: 1.5,
      borderColor: selected ? mood.accent : colors.border,
      backgroundColor: selected ? mood.accent + "20" : colors.card,
    },
    emoji: { fontSize: compact ? 13 : 15 },
    label: {
      fontSize: compact ? 12 : 13,
      fontFamily: "Inter_500Medium",
      color: selected ? mood.accent : colors.foreground,
    },
  });

  return (
    <Pressable style={s.chip} onPress={onPress}>
      <Text style={s.emoji}>{mood.emoji}</Text>
      <Text style={s.label}>{mood.label}</Text>
    </Pressable>
  );
}
