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
import { LinearGradient } from "expo-linear-gradient";
import { useStore } from "@/store";
import {
  MOOD_ATMOSPHERES, ALL_ATMOSPHERE_KEYS, DEFAULT_ATMOSPHERE,
} from "@/constants/theme";
import type { MoodAtmosphere, BackgroundMode } from "@/constants/theme";
import { useAtmosphere } from "@/hooks/useAtmosphere";

export default function BackgroundThemeScreen() {
  const nav = useNavigation();
  const backgroundMode = useStore((s) => s.backgroundMode);
  const selectedStaticBackground = useStore((s) => s.selectedStaticBackground);
  const setBackgroundMode = useStore((s) => s.setBackgroundMode);
  const setSelectedStaticBackground = useStore((s) => s.setSelectedStaticBackground);
  const setMoodAtmosphereOverride = useStore((s) => s.setMoodAtmosphereOverride);
  const setThemeOverrideEnabled = useStore((s) => s.setThemeOverrideEnabled);

  const atmosphere = useAtmosphere();
  const isDark = atmosphere.isDark;
  const textColor = isDark ? "#ffffff" : "#1a1a1a";
  const textColorSoft = isDark ? "rgba(255,255,255,0.6)" : "#6b7280";
  const cardBg = atmosphere.cardTint;

  const MODE_OPTIONS: { key: BackgroundMode; label: string; sub: string }[] = [
    { key: "mood_adaptive", label: "Mood-Adaptive", sub: "Changes with your current book" },
    { key: "static", label: "Static", sub: "One background, always" },
    { key: "minimal_neutral", label: "Minimal / Neutral", sub: "Cleaner, less decorative" },
  ];

  const handleMatchBook = () => {
    setBackgroundMode("mood_adaptive");
    setThemeOverrideEnabled(false);
    setMoodAtmosphereOverride(null);
  };

  return (
    <LinearGradient colors={atmosphere.gradient} style={{ flex: 1 }}>
      <SafeAreaView style={styles.safe} edges={["bottom"]}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

          {/* Section: Background Mode */}
          <Text style={[styles.sectionLabel, { color: textColorSoft }]}>Background Mode</Text>
          <View style={[styles.card, { backgroundColor: cardBg }]}>
            {MODE_OPTIONS.map((opt, idx) => {
              const selected = backgroundMode === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  style={[styles.modeRow, idx > 0 && styles.modeRowDivider]}
                  onPress={() => setBackgroundMode(opt.key)}
                  activeOpacity={0.75}
                >
                  <View style={[styles.radio, selected && { borderColor: "#a78bfa" }]}>
                    {selected && <View style={styles.radioDot} />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.modeLabel, { color: textColor }]}>{opt.label}</Text>
                    <Text style={[styles.modeSub, { color: textColorSoft }]}>{opt.sub}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Section: Choose Background (only when Static is selected) */}
          {backgroundMode === "static" && (
            <>
              <Text style={[styles.sectionLabel, { color: textColorSoft }]}>Choose Background</Text>
              <View style={styles.bgGrid}>
                {ALL_ATMOSPHERE_KEYS.map((key) => {
                  const atm = MOOD_ATMOSPHERES[key];
                  const isSelected = selectedStaticBackground === key;
                  return (
                    <TouchableOpacity
                      key={key}
                      onPress={() => setSelectedStaticBackground(key as MoodAtmosphere)}
                      activeOpacity={0.8}
                      style={styles.bgCardWrapper}
                    >
                      <LinearGradient
                        colors={[atm.gradient[0], atm.gradient[1]]}
                        style={[
                          styles.bgCard,
                          isSelected && styles.bgCardSelected,
                        ]}
                        start={{ x: 0.5, y: 0 }}
                        end={{ x: 0.5, y: 1 }}
                      >
                        <Text style={styles.bgCardEmoji}>{atm.emoji}</Text>
                      </LinearGradient>
                      <Text style={[styles.bgCardLabel, { color: textColorSoft }]} numberOfLines={2}>
                        {atm.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}

          {/* Match Current Book Mood button */}
          <TouchableOpacity
            style={[styles.matchBtn, { backgroundColor: atmosphere.accentColor }]}
            onPress={handleMatchBook}
            activeOpacity={0.85}
          >
            <Text style={styles.matchBtnText}>Match Current Book Mood</Text>
          </TouchableOpacity>

        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 16, gap: 12, paddingBottom: 48 },
  sectionLabel: {
    fontSize: 11, fontWeight: "700",
    letterSpacing: 0.8, textTransform: "uppercase", marginTop: 4,
  },
  card: {
    borderRadius: 16, borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)",
    overflow: "hidden",
  },
  modeRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  modeRowDivider: {
    borderTopWidth: 1, borderTopColor: "rgba(0,0,0,0.06)",
  },
  radio: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: "#d1d5db",
    justifyContent: "center", alignItems: "center",
  },
  radioDot: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: "#a78bfa",
  },
  modeLabel: { fontSize: 14, fontWeight: "600" },
  modeSub: { fontSize: 12, marginTop: 1 },
  // BG grid
  bgGrid: {
    flexDirection: "row", flexWrap: "wrap", gap: 12,
  },
  bgCardWrapper: {
    width: "47%", alignItems: "center", gap: 6,
  },
  bgCard: {
    width: "100%", height: 90, borderRadius: 16,
    justifyContent: "center", alignItems: "center",
    borderWidth: 2, borderColor: "transparent",
  },
  bgCardSelected: {
    borderColor: "#a78bfa",
    shadowColor: "#a78bfa",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  bgCardEmoji: { fontSize: 28 },
  bgCardLabel: {
    fontSize: 11, fontWeight: "500", textAlign: "center", lineHeight: 15,
  },
  // Match button
  matchBtn: {
    borderRadius: 14, paddingVertical: 15,
    alignItems: "center", marginTop: 8,
  },
  matchBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
