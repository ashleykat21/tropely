import React, { useMemo } from "react";
import { View, StyleSheet, StyleProp, ViewStyle, Image } from "react-native";
import { getMoodTheme } from "./moodThemes";
import type { MoodAtmosphere } from "@/constants/theme";

const MOOD_DESIGN_IMAGES: Record<MoodAtmosphere, any> = {
  cozy_romantic: require("../assets/mood-designs/cozy.png"),
  mysterious_dark: require("../assets/mood-designs/mysterious.png"),
  fantasy_magical: require("../assets/mood-designs/fantasy.png"),
  emotional_heartfelt: require("../assets/mood-designs/emotional.png"),
  dark_intense: require("../assets/mood-designs/intense.png"),
  light_fun: require("../assets/mood-designs/fun.png"),
  minimal_neutral: require("../assets/mood-designs/minimal.png"),
  dark_moody_neutral: require("../assets/mood-designs/moody neutral.png"),
  cottagecore_botanical: require("../assets/mood-designs/cottagecore.png"),
  classic_literary: require("../assets/mood-designs/classic literary.png"),
};

// No expo-linear-gradient. Pure React Native stacked View gradient + blob decorations.

type Props = {
  themeId: string;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
};

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  if (clean.length === 3) {
    return [
      parseInt(clean[0] + clean[0], 16),
      parseInt(clean[1] + clean[1], 16),
      parseInt(clean[2] + clean[2], 16),
    ];
  }
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
  ];
}

function interpolateColor(c1: string, c2: string, t: number): string {
  if (c1.startsWith("rgb") || c2.startsWith("rgb")) return c1;
  try {
    const [r1, g1, b1] = hexToRgb(c1);
    const [r2, g2, b2] = hexToRgb(c2);
    return `rgb(${Math.round(r1 + (r2 - r1) * t)},${Math.round(g1 + (g2 - g1) * t)},${Math.round(b1 + (b2 - b1) * t)})`;
  } catch {
    return c1;
  }
}

const STEPS = 14;

function GradientLayers({ gradient }: { gradient: readonly [string, string, string] }) {
  const layers = useMemo(() => {
    return Array.from({ length: STEPS }, (_, i) => {
      const t = i / (STEPS - 1);
      const scaled = t * (gradient.length - 1);
      const idx = Math.min(Math.floor(scaled), gradient.length - 2);
      return interpolateColor(gradient[idx], gradient[idx + 1], scaled - idx);
    });
  }, [gradient]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {layers.map((color, i) => (
        <View key={i} style={{ flex: 1, backgroundColor: color }} />
      ))}
    </View>
  );
}

function DecorBlobs({ themeId }: { themeId: string }) {
  switch (themeId as MoodAtmosphere) {
    case "cozy_romantic":
      return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <View style={[s.blob, { top: -50, left: -70, width: 220, height: 180, backgroundColor: "rgba(255,220,230,0.38)", borderRadius: 110 }]} />
          <View style={[s.blob, { top: -20, right: -50, width: 180, height: 140, backgroundColor: "rgba(255,200,215,0.32)", borderRadius: 90 }]} />
          <View style={[s.blob, { top: 200, left: -40, width: 140, height: 100, backgroundColor: "rgba(255,225,235,0.28)", borderRadius: 70 }]} />
          <View style={[s.blob, { bottom: 100, right: -40, width: 200, height: 160, backgroundColor: "rgba(248,180,200,0.22)", borderRadius: 100 }]} />
        </View>
      );
    case "mysterious_dark":
      return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <View style={[s.blob, { bottom: 60, left: -10, width: 120, height: 180, backgroundColor: "rgba(8,6,20,0.8)", borderRadius: 8, transform: [{ skewX: "5deg" }] }]} />
          <View style={[s.blob, { bottom: 60, left: 80, width: 100, height: 220, backgroundColor: "rgba(8,6,20,0.7)", borderRadius: 8, transform: [{ skewX: "-3deg" }] }]} />
          <View style={[s.blob, { bottom: 60, right: 30, width: 110, height: 190, backgroundColor: "rgba(8,6,20,0.75)", borderRadius: 8 }]} />
          <View style={[s.blob, { top: 40, right: 50, width: 80, height: 80, backgroundColor: "rgba(155,127,232,0.22)", borderRadius: 40 }]} />
          {([[50, 80], [120, 50], [200, 90], [80, 160], [240, 70], [170, 130]] as [number, number][]).map(([top, left], i) => (
            <View key={i} style={[s.star, { top, left }]} />
          ))}
        </View>
      );
    case "fantasy_magical":
      return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {([[30, 60], [80, 180], [50, 280], [140, 40], [200, 200], [160, 130], [100, 320]] as [number, number][]).map(([top, left], i) => (
            <View key={i} style={[s.star, { top, left, width: i % 2 === 0 ? 3 : 2, height: i % 2 === 0 ? 3 : 2, borderRadius: 2, backgroundColor: "rgba(255,220,255,0.7)" }]} />
          ))}
          <View style={[s.blob, { top: -60, left: "20%", width: 220, height: 220, backgroundColor: "rgba(192,132,252,0.14)", borderRadius: 110 }]} />
          <View style={[s.blob, { bottom: 120, right: -50, width: 200, height: 200, backgroundColor: "rgba(140,80,255,0.12)", borderRadius: 100 }]} />
        </View>
      );
    case "emotional_heartfelt":
      return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <View style={[s.blob, { top: 20, left: -40, width: 180, height: 80, backgroundColor: "rgba(255,255,255,0.38)", borderRadius: 40 }]} />
          <View style={[s.blob, { top: 70, right: -30, width: 150, height: 65, backgroundColor: "rgba(255,255,255,0.30)", borderRadius: 33 }]} />
          <View style={[s.blob, { top: 220, left: 20, width: 110, height: 55, backgroundColor: "rgba(255,255,255,0.22)", borderRadius: 28 }]} />
        </View>
      );
    case "dark_intense":
      return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <View style={[s.blob, { bottom: 120, left: "15%", width: 240, height: 240, backgroundColor: "rgba(180,0,0,0.16)", borderRadius: 120 }]} />
          <View style={[s.blob, { top: -50, left: -50, width: 200, height: 200, backgroundColor: "rgba(0,0,0,0.32)", borderRadius: 100 }]} />
          <View style={[s.blob, { top: -50, right: -50, width: 200, height: 200, backgroundColor: "rgba(0,0,0,0.32)", borderRadius: 100 }]} />
        </View>
      );
    case "light_fun":
      return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {([[40, 30], [90, 250], [60, 180], [200, 50], [180, 300]] as [number, number][]).map(([top, left], i) => (
            <View key={i} style={[s.star, { top, left, width: 5, height: 5, borderRadius: 3, backgroundColor: i % 2 === 0 ? "rgba(255,255,255,0.5)" : "rgba(255,180,100,0.4)" }]} />
          ))}
          <View style={[s.blob, { top: -90, left: "25%", width: 250, height: 250, backgroundColor: "rgba(255,255,200,0.22)", borderRadius: 125 }]} />
        </View>
      );
    case "cottagecore_botanical":
      return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {([[50, 20], [80, 300], [200, 10], [220, 310]] as [number, number][]).map(([top, left], i) => (
            <View key={i} style={[s.blob, { top, left, width: 32, height: 32, backgroundColor: "rgba(160,180,100,0.22)", borderRadius: 16 }]} />
          ))}
          <View style={[s.blob, { bottom: 90, right: -40, width: 170, height: 130, backgroundColor: "rgba(200,160,60,0.13)", borderRadius: 85 }]} />
          <View style={[s.blob, { top: 90, left: -25, width: 90, height: 130, backgroundColor: "rgba(140,170,80,0.16)", borderRadius: 45 }]} />
        </View>
      );
    case "classic_literary":
      return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <View style={[s.blob, { top: 40, right: 20, width: 110, height: 90, backgroundColor: "rgba(200,140,50,0.11)", borderRadius: 55 }]} />
          <View style={[s.blob, { bottom: 120, left: -25, width: 130, height: 110, backgroundColor: "rgba(160,100,30,0.09)", borderRadius: 65 }]} />
        </View>
      );
    default:
      return null;
  }
}

export default function MoodBackground({ themeId, style, children }: Props) {
  const theme = getMoodTheme(themeId);
  const designImage = MOOD_DESIGN_IMAGES[themeId as MoodAtmosphere];

  return (
    <View style={[s.container, style]}>
      <GradientLayers gradient={theme.gradient} />
      {designImage && (
        <Image
          source={designImage}
          style={s.designImage}
          resizeMode="cover"
        />
      )}
      {theme.decorative && <DecorBlobs themeId={themeId} />}
      {children}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, overflow: "hidden" },
  blob: { position: "absolute" },
  star: { position: "absolute", width: 2, height: 2, borderRadius: 1, backgroundColor: "rgba(255,255,255,0.6)" },
  designImage: { ...StyleSheet.absoluteFillObject, opacity: 0.85 },
});
