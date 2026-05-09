import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import type { StreakInfo } from "@/lib/streak";

interface Props {
  streak: StreakInfo;
}

export function StreakBadge({ streak }: Props) {
  const colors = useColors();

  if (streak.current === 0) return null;

  const isHot = streak.current >= 7;
  const color = isHot ? "#D4A832" : colors.primary;

  const s = StyleSheet.create({
    badge: {
      flexDirection: "row", alignItems: "center", gap: 5,
      paddingHorizontal: 12, paddingVertical: 6,
      borderRadius: 20,
      backgroundColor: color + "18",
      borderWidth: 1, borderColor: color + "40",
    },
    flame: { fontSize: 15 },
    text: {
      fontSize: 13, fontFamily: "Inter_700Bold", color,
    },
  });

  return (
    <View style={s.badge}>
      <Text style={s.flame}>{isHot ? "🔥" : "⚡"}</Text>
      <Text style={s.text}>{streak.current}</Text>
    </View>
  );
}
