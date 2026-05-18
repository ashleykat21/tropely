import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/theme/ThemeContext";
import { useStore } from "@/store";
import {
  MOOD_ATMOSPHERES, ALL_ATMOSPHERE_KEYS,
} from "@/constants/theme";
import type { MoodAtmosphere, BackgroundMode } from "@/constants/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const THUMBNAIL_WIDTH = (SCREEN_WIDTH - 48) / 2;

type ModeOption = { key: BackgroundMode; label: string; sub: string; previewColor: string };

const MODE_OPTIONS: ModeOption[] = [
  {
    key: "mood_adaptive",
    label: "Mood-Adaptive (Default)",
    sub: "Background changes with your current book mood.",
    previewColor: "mood_adaptive",
  },
  {
    key: "static",
    label: "Static Background",
    sub: "Choose one background and keep it everywhere.",
    previewColor: "#fce4d0",
  },
  {
    key: "minimal_neutral",
    label: "Minimal / Neutral",
    sub: "Simpler, less feminine backgrounds.",
    previewColor: "#fdfaf6",
  },
];

function ModePreview({ modeKey }: { modeKey: string }) {
  if (modeKey === "mood_adaptive") {
    // Mini gradient circle with 3 colors
    return (
      <View style={styles.modePreviewCircle}>
        <View style={[styles.modePreviewSlice, { backgroundColor: "#fce4d0" }]} />
        <View style={[styles.modePreviewSlice, { backgroundColor: "#2d1660" }]} />
        <View style={[styles.modePreviewSlice, { backgroundColor: "#fef3c7" }]} />
      </View>
    );
  }
  if (modeKey === "static") {
    return (
      <View style={[styles.modePreviewCircle, { backgroundColor: "#fce4d0", overflow: "hidden" }]} />
    );
  }
  // minimal_neutral
  return (
    <View style={[styles.modePreviewCircle, { backgroundColor: "#fdfaf6", overflow: "hidden", borderColor: "#e5e0d8" }]} />
  );
}

export default function BackgroundThemeScreen() {
  const { setBackgroundMode, setSelectedStaticBackground, setMatchCurrentBookMood,
          backgroundMode, selectedStaticBackground, matchCurrentBookMood } = useTheme();
  const setMoodAtmosphereOverride = useStore((s) => s.setMoodAtmosphereOverride);
  const setThemeOverrideEnabled = useStore((s) => s.setThemeOverrideEnabled);

  const handleMatchBook = (v: boolean) => {
    if (v) {
      setBackgroundMode("mood_adaptive");
      setThemeOverrideEnabled(false);
      setMoodAtmosphereOverride(null);
    } else {
      setBackgroundMode("static");
    }
    setMatchCurrentBookMood(v);
  };

  const isMatchBookEnabled = matchCurrentBookMood && backgroundMode === "mood_adaptive";

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Background Mode</Text>
        <Text style={styles.subtitle}>Choose how your background works.</Text>

        {/* Mode options card */}
        <View style={styles.modeCard}>
          {MODE_OPTIONS.map((opt, idx) => {
            const selected = backgroundMode === opt.key;
            return (
              <TouchableOpacity
                key={opt.key}
                style={[styles.modeRow, idx > 0 && styles.modeRowDivider]}
                onPress={() => setBackgroundMode(opt.key)}
                activeOpacity={0.75}
              >
                <ModePreview modeKey={opt.key} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.modeLabel}>{opt.label}</Text>
                  <Text style={styles.modeSub}>{opt.sub}</Text>
                </View>
                <View style={[styles.radio, selected && styles.radioSelected]}>
                  {selected && <View style={styles.radioDot} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Background grid (only when static selected) */}
        {backgroundMode === "static" && (
          <>
            <Text style={styles.gridTitle}>Choose a Background (Static Mode)</Text>
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
                    <View
                      style={[
                        styles.bgCard,
                        { width: THUMBNAIL_WIDTH, backgroundColor: atm.gradient[0] },
                        isSelected && {
                          borderWidth: 2,
                          borderColor: atm.accentColor,
                          shadowColor: atm.accentColor,
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.4,
                          shadowRadius: 8,
                          elevation: 6,
                        },
                      ]}
                    >
                      {/* Overlay second gradient color at bottom */}
                      <View style={[StyleSheet.absoluteFill, { backgroundColor: atm.gradient[1], opacity: 0.45, borderRadius: 14 }]} />
                      <Text style={styles.bgCardEmoji}>{atm.emoji}</Text>
                    </View>
                    <Text style={styles.bgCardLabel} numberOfLines={2}>
                      {atm.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

        {/* Match Current Book Mood row */}
        <View style={styles.matchRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.matchLabel}>Match Current Book Mood</Text>
            <Text style={styles.matchSub}>Automatically set background to your active book's mood.</Text>
          </View>
          <Switch
            value={isMatchBookEnabled}
            onValueChange={handleMatchBook}
            trackColor={{ false: "#e5e7eb", true: "#e8608a" }}
            thumbColor="#fff"
          />
        </View>

        {/* Note */}
        <Text style={styles.noteText}>♥ You can change this anytime in Settings.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fdfaf6" },
  content: { padding: 16, gap: 14, paddingBottom: 48 },

  title: { fontSize: 20, fontWeight: "700", color: "#1a1a1a" },
  subtitle: { fontSize: 14, color: "#6b7280", marginTop: -8 },

  modeCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#f0ede8",
    overflow: "hidden",
    shadowColor: "#c0a0b0",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  modeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  modeRowDivider: {
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  modePreviewCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e5e0d8",
    flexDirection: "row",
  },
  modePreviewSlice: { flex: 1 },
  modeLabel: { fontSize: 14, fontWeight: "600", color: "#1a1a1a" },
  modeSub: { fontSize: 12, color: "#6b7280", marginTop: 1 },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#d1d5db",
    justifyContent: "center",
    alignItems: "center",
  },
  radioSelected: { borderColor: "#a78bfa" },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#a78bfa",
  },

  // Grid
  gridTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1a1a1a",
    marginTop: 4,
  },
  bgGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  bgCardWrapper: {
    alignItems: "center",
    gap: 6,
  },
  bgCard: {
    height: 90,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  bgCardEmoji: { fontSize: 28 },
  bgCardLabel: {
    width: THUMBNAIL_WIDTH,
    fontSize: 11,
    fontWeight: "500",
    textAlign: "center",
    color: "#6b7280",
    lineHeight: 15,
  },

  // Match book mood row
  matchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#f0ede8",
  },
  matchLabel: { fontSize: 14, fontWeight: "600", color: "#1a1a1a" },
  matchSub: { fontSize: 12, color: "#6b7280", marginTop: 2 },

  noteText: { fontSize: 12, color: "#9ca3af", textAlign: "center" },
});
