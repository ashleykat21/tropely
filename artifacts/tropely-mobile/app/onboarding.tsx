import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { MOOD_KEYS, MOODS } from "@/lib/moods";
import { useStore } from "@/lib/store";
import type { MoodKey } from "@/constants/colors";

export default function OnboardingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const completeOnboarding = useStore((s) => s.completeOnboarding);

  const [selected, setSelected] = useState<MoodKey[]>([]);
  const [step, setStep] = useState(0);

  const toggle = (k: MoodKey) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelected((prev) =>
      prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]
    );
  };

  const finish = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    completeOnboarding({
      favoriteMoods: selected.length > 0 ? selected : ["dreamy"],
      favoriteGenres: [],
    });
    router.replace("/(tabs)");
  };

  const s = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      paddingTop: Platform.OS === "web" ? 67 : insets.top + 20,
      paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 16,
    },
    header: { paddingHorizontal: 28, marginBottom: 32 },
    stepLabel: {
      fontSize: 13, fontFamily: "Inter_500Medium",
      color: colors.primary, letterSpacing: 1.5,
      textTransform: "uppercase", marginBottom: 12,
    },
    title: {
      fontSize: 30, fontFamily: "Inter_700Bold",
      color: colors.foreground, marginBottom: 8, lineHeight: 36,
    },
    subtitle: {
      fontSize: 15, fontFamily: "Inter_400Regular",
      color: colors.mutedForeground, lineHeight: 22,
    },
    grid: {
      flexDirection: "row", flexWrap: "wrap",
      paddingHorizontal: 20, gap: 10,
    },
    chip: {
      flexDirection: "row", alignItems: "center", gap: 6,
      paddingHorizontal: 16, paddingVertical: 12,
      borderRadius: 40, borderWidth: 1.5,
      borderColor: colors.border, backgroundColor: colors.card,
    },
    emoji: { fontSize: 18 },
    chipLabel: { fontSize: 15, fontFamily: "Inter_500Medium", color: colors.foreground },
    chipDesc: { fontSize: 12, fontFamily: "Inter_400Regular", color: colors.mutedForeground, marginTop: 1 },
    footer: { paddingHorizontal: 28, marginTop: "auto", paddingTop: 24 },
    btn: {
      backgroundColor: colors.primary, borderRadius: 14,
      paddingVertical: 15, alignItems: "center",
    },
    btnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },
    skip: { alignItems: "center", marginTop: 14 },
    skipText: { fontSize: 14, fontFamily: "Inter_400Regular", color: colors.mutedForeground },
  });

  // ── Step 0: Welcome ──────────────────────────────────────────────────────────
  if (step === 0) {
    return (
      <View style={[s.container, { justifyContent: "center", paddingHorizontal: 32 }]}>
        <Text style={{ fontSize: 64, textAlign: "center", marginBottom: 24 }}>📚</Text>
        <Text style={[s.title, { textAlign: "center" }]}>
          Reading is emotional.{"\n"}We get it.
        </Text>
        <Text style={[s.subtitle, { textAlign: "center", marginBottom: 48 }]}>
          Tropely helps you track what you read — and how it made you feel.
        </Text>
        <TouchableOpacity style={s.btn} onPress={() => setStep(1)}>
          <Text style={s.btnText}>Get started</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Step 1: Moods ────────────────────────────────────────────────────────────
  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.stepLabel}>Welcome to Tropely</Text>
        <Text style={s.title}>What moods do you{"\n"}read in?</Text>
        <Text style={s.subtitle}>
          Select all that resonate — this shapes your TBR suggestions.
        </Text>
      </View>

      <ScrollView contentContainerStyle={s.grid} showsVerticalScrollIndicator={false}>
        {MOOD_KEYS.map((k) => {
          const m = MOODS[k];
          const isSelected = selected.includes(k);
          return (
            <Pressable
              key={k}
              style={[s.chip, isSelected && { borderColor: m.accent, backgroundColor: m.accent + "20" }]}
              onPress={() => toggle(k)}
            >
              <Text style={s.emoji}>{m.emoji}</Text>
              <View>
                <Text style={[s.chipLabel, isSelected && { color: m.accent }]}>{m.label}</Text>
                <Text style={s.chipDesc}>{m.description}</Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={s.footer}>
        <TouchableOpacity style={s.btn} onPress={finish}>
          <Text style={s.btnText}>
            {selected.length === 0 ? "Skip for now" : `Get reading with ${selected.length} mood${selected.length > 1 ? "s" : ""} →`}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.skip} onPress={finish}>
          <Text style={s.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
