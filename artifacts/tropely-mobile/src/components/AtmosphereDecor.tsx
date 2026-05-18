import React from "react";
import { View, StyleSheet } from "react-native";
import type { MoodAtmosphere } from "@/constants/theme";

type Props = { atmosphere: MoodAtmosphere };

export function AtmosphereDecor({ atmosphere }: Props) {
  switch (atmosphere) {
    case "cozy_romantic":
      return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {/* Soft cloud/blob at top-left */}
          <View style={[s.blob, { top: -40, left: -60, width: 200, height: 160, backgroundColor: "rgba(255,220,230,0.35)", borderRadius: 100 }]} />
          {/* Blob at top-right */}
          <View style={[s.blob, { top: -20, right: -40, width: 160, height: 120, backgroundColor: "rgba(255,200,215,0.3)", borderRadius: 80 }]} />
          {/* Smaller blob mid-left */}
          <View style={[s.blob, { top: 180, left: -30, width: 120, height: 90, backgroundColor: "rgba(255,225,235,0.25)", borderRadius: 60 }]} />
          {/* Bottom soft glow */}
          <View style={[s.blob, { bottom: 80, right: -30, width: 180, height: 140, backgroundColor: "rgba(248,180,200,0.2)", borderRadius: 90 }]} />
        </View>
      );
    case "mysterious_dark":
      return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {/* Forest silhouette bottom */}
          <View style={[s.blob, { bottom: 60, left: -10, width: 120, height: 180, backgroundColor: "rgba(8,6,20,0.8)", borderRadius: 8, transform: [{ skewX: "5deg" }] }]} />
          <View style={[s.blob, { bottom: 60, left: 80, width: 100, height: 220, backgroundColor: "rgba(8,6,20,0.7)", borderRadius: 8, transform: [{ skewX: "-3deg" }] }]} />
          <View style={[s.blob, { bottom: 60, right: 30, width: 110, height: 190, backgroundColor: "rgba(8,6,20,0.75)", borderRadius: 8, transform: [{ skewX: "4deg" }] }]} />
          <View style={[s.blob, { bottom: 60, right: -20, width: 90, height: 160, backgroundColor: "rgba(8,6,20,0.7)", borderRadius: 8 }]} />
          {/* Moon glow */}
          <View style={[s.blob, { top: 30, right: 40, width: 60, height: 60, backgroundColor: "rgba(180,160,230,0.15)", borderRadius: 30 }]} />
          {/* Stars */}
          {([[50, 80], [120, 50], [200, 90], [80, 160], [240, 70], [170, 130]] as [number, number][]).map(([top, left], i) => (
            <View key={i} style={[s.star, { top, left }]} />
          ))}
        </View>
      );
    case "fantasy_magical":
      return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {/* Stars scattered */}
          {([[30, 60], [80, 180], [50, 280], [140, 40], [200, 200], [160, 130], [100, 330], [250, 80]] as [number, number][]).map(([top, left], i) => (
            <View key={i} style={[s.star, { top, left, width: i % 2 === 0 ? 3 : 2, height: i % 2 === 0 ? 3 : 2, borderRadius: 2, backgroundColor: "rgba(255,220,255,0.7)" }]} />
          ))}
          {/* Magical glow at top */}
          <View style={[s.blob, { top: -60, left: "20%", width: 200, height: 200, backgroundColor: "rgba(180,100,255,0.12)", borderRadius: 100 }]} />
          {/* Bottom glow */}
          <View style={[s.blob, { bottom: 100, right: -40, width: 180, height: 180, backgroundColor: "rgba(140,80,255,0.1)", borderRadius: 90 }]} />
        </View>
      );
    case "emotional_heartfelt":
      return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {/* Soft clouds */}
          <View style={[s.blob, { top: 20, left: -40, width: 180, height: 80, backgroundColor: "rgba(255,255,255,0.35)", borderRadius: 40 }]} />
          <View style={[s.blob, { top: 60, right: -20, width: 140, height: 60, backgroundColor: "rgba(255,255,255,0.28)", borderRadius: 30 }]} />
          <View style={[s.blob, { top: 200, left: 20, width: 100, height: 50, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 25 }]} />
        </View>
      );
    case "light_fun":
      return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {/* Cheerful dots */}
          {([[40, 30], [90, 250], [60, 180], [200, 50], [180, 300], [120, 120]] as [number, number][]).map(([top, left], i) => (
            <View key={i} style={[s.star, { top, left, width: 5, height: 5, borderRadius: 3, backgroundColor: i % 2 === 0 ? "rgba(255,255,255,0.5)" : "rgba(255,180,100,0.4)" }]} />
          ))}
          {/* Bright glow top */}
          <View style={[s.blob, { top: -80, left: "30%", width: 220, height: 220, backgroundColor: "rgba(255,255,200,0.2)", borderRadius: 110 }]} />
        </View>
      );
    case "dark_intense":
      return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {/* Crimson glow center-bottom */}
          <View style={[s.blob, { bottom: 100, left: "20%", width: 220, height: 220, backgroundColor: "rgba(180,0,0,0.15)", borderRadius: 110 }]} />
          {/* Dark edge vignette */}
          <View style={[s.blob, { top: -40, left: -40, width: 180, height: 180, backgroundColor: "rgba(0,0,0,0.3)", borderRadius: 90 }]} />
          <View style={[s.blob, { top: -40, right: -40, width: 180, height: 180, backgroundColor: "rgba(0,0,0,0.3)", borderRadius: 90 }]} />
        </View>
      );
    case "cottagecore_botanical":
      return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {/* Flower accents - small circles cluster */}
          {([[50, 20], [80, 300], [200, 10], [220, 310]] as [number, number][]).map(([top, left], i) => (
            <View key={i} style={[s.blob, { top, left, width: 30, height: 30, backgroundColor: "rgba(160,180,100,0.2)", borderRadius: 15 }]} />
          ))}
          {/* Warm honey glow */}
          <View style={[s.blob, { bottom: 80, right: -30, width: 160, height: 120, backgroundColor: "rgba(200,160,60,0.12)", borderRadius: 80 }]} />
          <View style={[s.blob, { top: 80, left: -20, width: 80, height: 120, backgroundColor: "rgba(140,170,80,0.15)", borderRadius: 40 }]} />
        </View>
      );
    case "classic_literary":
      return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {/* Subtle warm glow */}
          <View style={[s.blob, { top: 40, right: 20, width: 100, height: 80, backgroundColor: "rgba(200,140,50,0.1)", borderRadius: 50 }]} />
          <View style={[s.blob, { bottom: 100, left: -20, width: 120, height: 100, backgroundColor: "rgba(160,100,30,0.08)", borderRadius: 60 }]} />
          {/* Horizontal shelf lines */}
          {([280, 340, 400, 460] as number[]).map((top, i) => (
            <View key={i} style={[s.blob, { position: "absolute", top, left: 20, right: 20, height: 1, backgroundColor: "rgba(120,80,30,0.08)", borderRadius: 0 }]} />
          ))}
        </View>
      );
    default:
      return null;
  }
}

const s = StyleSheet.create({
  blob: { position: "absolute" },
  star: { position: "absolute", width: 2, height: 2, borderRadius: 1, backgroundColor: "rgba(255,255,255,0.6)" },
});
