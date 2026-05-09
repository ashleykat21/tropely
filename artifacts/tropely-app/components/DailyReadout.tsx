import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import { useStore, todaySessions } from "@/lib/store";

export function DailyReadout() {
  const books = useStore((s) => s.books);
  const profile = useStore((s) => s.profile);
  const sessions = todaySessions(books);

  if (sessions.length === 0) return null;

  const pagesRead = sessions.reduce((acc, s) => acc + s.pages, 0);
  const minsRead = sessions.reduce((acc, s) => acc + s.minutes, 0);
  const pagesPct = Math.min(pagesRead / Math.max(profile.dailyGoalPages, 1), 1);
  const minsPct = Math.min(minsRead / Math.max(profile.dailyGoalMinutes, 1), 1);

  const colors = useColors();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderRadius: colors.radius,
          borderColor: colors.border,
        },
      ]}
    >
      <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
        TODAY
      </Text>
      <View style={styles.row}>
        <GoalBar
          label={`${pagesRead} / ${profile.dailyGoalPages} pages`}
          pct={pagesPct}
          color={colors.accent}
          trackColor={colors.muted}
          textColor={colors.foreground}
          mutedColor={colors.mutedForeground}
        />
        <GoalBar
          label={`${minsRead} / ${profile.dailyGoalMinutes} min`}
          pct={minsPct}
          color="#7BB37D"
          trackColor={colors.muted}
          textColor={colors.foreground}
          mutedColor={colors.mutedForeground}
        />
      </View>
    </View>
  );
}

function GoalBar({
  label,
  pct,
  color,
  trackColor,
  textColor,
  mutedColor,
}: {
  label: string;
  pct: number;
  color: string;
  trackColor: string;
  textColor: string;
  mutedColor: string;
}) {
  return (
    <View style={styles.goalBar}>
      <View style={[styles.track, { backgroundColor: trackColor }]}>
        <View
          style={[
            styles.fill,
            { backgroundColor: color, width: `${Math.round(pct * 100)}%` },
          ]}
        />
      </View>
      <Text style={[styles.goalLabel, { color: mutedColor, fontFamily: "Inter_400Regular" }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderWidth: 1,
    gap: 10,
  },
  label: {
    fontSize: 10,
    letterSpacing: 1.5,
  },
  row: {
    gap: 10,
  },
  goalBar: {
    gap: 6,
  },
  track: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 3,
  },
  goalLabel: {
    fontSize: 12,
  },
});
