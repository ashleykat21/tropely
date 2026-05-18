import React, { useMemo } from "react";
import { View, StyleSheet, StyleProp, ViewStyle } from "react-native";

type Props = {
  colors: readonly string[];
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
};

// Hex color interpolation
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
  // Handle rgba() strings by falling back to solid color
  if (c1.startsWith("rgb") || c2.startsWith("rgb")) return c1;
  try {
    const [r1, g1, b1] = hexToRgb(c1);
    const [r2, g2, b2] = hexToRgb(c2);
    const r = Math.round(r1 + (r2 - r1) * t);
    const g = Math.round(g1 + (g2 - g1) * t);
    const b = Math.round(b1 + (b2 - b1) * t);
    return `rgb(${r},${g},${b})`;
  } catch {
    return c1;
  }
}

const STEPS = 14;

export function GradientView({ colors, style, children }: Props) {
  const gradient = useMemo(() => {
    if (!colors || colors.length < 2) {
      return Array(STEPS).fill(colors?.[0] ?? "#fdf0f5");
    }
    return Array.from({ length: STEPS }, (_, i) => {
      const t = i / (STEPS - 1);
      const scaled = t * (colors.length - 1);
      const idx = Math.min(Math.floor(scaled), colors.length - 2);
      const localT = scaled - idx;
      return interpolateColor(colors[idx], colors[idx + 1], localT);
    });
  }, [colors]);

  return (
    <View style={[styles.container, style]}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {gradient.map((color, i) => (
          <View
            key={i}
            style={{
              flex: 1,
              backgroundColor: color,
            }}
          />
        ))}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { overflow: "hidden" },
});
