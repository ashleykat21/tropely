import React from "react";
import { View, Text, StyleSheet } from "react-native";

type IconProps = { focused: boolean; color: string; size: number };

// Today: open book with sunrise rays
export function TodayIcon({ focused, color }: IconProps) {
  return (
    <View style={styles.wrapper}>
      {/* sun rays */}
      <View style={[styles.sunRay, styles.rayTop, { backgroundColor: focused ? "#f59e0b" : "#d1d5db" }]} />
      <View style={[styles.sunRay, styles.rayLeft, { backgroundColor: focused ? "#f59e0b" : "#d1d5db" }]} />
      <View style={[styles.sunRay, styles.rayRight, { backgroundColor: focused ? "#f59e0b" : "#d1d5db" }]} />
      {/* sun circle */}
      <View style={[styles.sun, { backgroundColor: focused ? "#fbbf24" : "#d1d5db" }]} />
      {/* book pages */}
      <View style={[styles.bookLeft, { backgroundColor: focused ? "#a78bfa" : "#9ca3af" }]} />
      <View style={[styles.bookRight, { backgroundColor: focused ? "#c4b5fd" : "#d1d5db" }]} />
      <View style={[styles.bookSpine, { backgroundColor: focused ? "#7c3aed" : "#6b7280" }]} />
    </View>
  );
}

// Library: crescent moon over book
export function LibraryIcon({ focused, color }: IconProps) {
  return (
    <View style={styles.wrapper}>
      {/* moon */}
      <View style={[styles.moonOuter, { backgroundColor: focused ? "#c4b5fd" : "#d1d5db" }]}>
        <View style={[styles.moonInner, { backgroundColor: focused ? "#f0f4ff" : "#f3f4f6" }]} />
      </View>
      {/* book */}
      <View style={[styles.bookLeft, { backgroundColor: focused ? "#a78bfa" : "#9ca3af" }]} />
      <View style={[styles.bookRight, { backgroundColor: focused ? "#c4b5fd" : "#d1d5db" }]} />
      <View style={[styles.bookSpine, { backgroundColor: focused ? "#7c3aed" : "#6b7280" }]} />
    </View>
  );
}

// Discover: compass star
export function DiscoverIcon({ focused, color }: IconProps) {
  return (
    <View style={styles.wrapper}>
      {/* compass circle */}
      <View style={[styles.compass, { borderColor: focused ? "#a78bfa" : "#d1d5db" }]}>
        {/* N arrow */}
        <View style={[styles.arrowUp, { backgroundColor: focused ? "#f472b6" : "#9ca3af" }]} />
        {/* S arrow */}
        <View style={[styles.arrowDown, { backgroundColor: focused ? "#a78bfa" : "#d1d5db" }]} />
      </View>
      {/* star dot center */}
      <View style={[styles.compassDot, { backgroundColor: focused ? "#fbbf24" : "#9ca3af" }]} />
    </View>
  );
}

// Buddy Reads: two chat bubbles with heart
export function BuddyReadsIcon({ focused, color }: IconProps) {
  return (
    <View style={styles.wrapper}>
      {/* main bubble */}
      <View style={[styles.bubble1, { backgroundColor: focused ? "#f472b6" : "#d1d5db" }]} />
      {/* secondary bubble */}
      <View style={[styles.bubble2, { backgroundColor: focused ? "#a78bfa" : "#e5e7eb" }]} />
      {/* heart */}
      <Text style={[styles.heart, { color: focused ? "#fff" : "#9ca3af" }]}>♥</Text>
    </View>
  );
}

// Me: crescent profile silhouette
export function MeIcon({ focused, color }: IconProps) {
  return (
    <View style={styles.wrapper}>
      {/* head circle */}
      <View style={[styles.head, { backgroundColor: focused ? "#a78bfa" : "#d1d5db" }]} />
      {/* shoulders arc */}
      <View style={[styles.shoulders, { backgroundColor: focused ? "#c4b5fd" : "#e5e7eb" }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { width: 28, height: 28, alignItems: "center", justifyContent: "center" },
  // Sun elements
  sun: { width: 8, height: 8, borderRadius: 4, position: "absolute", top: 0, alignSelf: "center" },
  sunRay: { position: "absolute", width: 2, height: 4, borderRadius: 1 },
  rayTop: { top: -2, left: 13 },
  rayLeft: { top: 3, left: 4, transform: [{ rotate: "45deg" }] },
  rayRight: { top: 3, right: 4, transform: [{ rotate: "-45deg" }] },
  // Book elements
  bookLeft: { position: "absolute", bottom: 1, left: 3, width: 9, height: 11, borderRadius: 1, transform: [{ skewX: "-4deg" }] },
  bookRight: { position: "absolute", bottom: 1, right: 3, width: 9, height: 11, borderRadius: 1, transform: [{ skewX: "4deg" }] },
  bookSpine: { position: "absolute", bottom: 1, width: 2, height: 11, borderRadius: 1 },
  // Moon elements
  moonOuter: { position: "absolute", top: 0, right: 4, width: 12, height: 12, borderRadius: 6 },
  moonInner: { position: "absolute", top: 1, right: -3, width: 10, height: 10, borderRadius: 5 },
  // Compass elements
  compass: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, position: "absolute" },
  arrowUp: { position: "absolute", top: 1, width: 2, height: 7, borderRadius: 1 },
  arrowDown: { position: "absolute", bottom: 1, width: 2, height: 7, borderRadius: 1 },
  compassDot: { width: 4, height: 4, borderRadius: 2 },
  // Buddy Read elements
  bubble1: { position: "absolute", top: 2, left: 2, width: 18, height: 14, borderRadius: 9 },
  bubble2: { position: "absolute", bottom: 2, right: 2, width: 14, height: 12, borderRadius: 7 },
  heart: { fontSize: 8, position: "absolute", top: 5, left: 7 },
  // Me elements
  head: { position: "absolute", top: 2, width: 12, height: 12, borderRadius: 6 },
  shoulders: { position: "absolute", bottom: 0, width: 22, height: 10, borderRadius: 11 },
});
