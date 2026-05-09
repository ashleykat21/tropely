import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";

import { MOODS, MoodKey } from "@/types";

interface Props {
  mood: MoodKey;
  selected?: boolean;
  onPress?: () => void;
  size?: "sm" | "md";
}

export function MoodChip({ mood, selected, onPress, size = "md" }: Props) {
  const def = MOODS.find((m) => m.key === mood);
  if (!def) return null;
  const isSmall = size === "sm";
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? def.color : def.bg,
          paddingHorizontal: isSmall ? 8 : 12,
          paddingVertical: isSmall ? 3 : 6,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: selected ? def.color : "transparent",
        },
      ]}
    >
      <Text
        style={[
          styles.label,
          {
            color: selected ? "#fff" : def.color,
            fontSize: isSmall ? 11 : 13,
            fontFamily: "Inter_500Medium",
          },
        ]}
      >
        {def.label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignSelf: "flex-start",
  },
  label: {},
});
