import { BlurView } from "expo-blur";
import { Tabs } from "expo-router";
import { SymbolView } from "expo-symbols";
import { Feather } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet, View, useColorScheme } from "react-native";
import { useColors } from "@/hooks/useColors";

export default function TabLayout() {
  const colors = useColors();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const isIOS = Platform.OS === "ios";

  return (
    <Tabs
      initialRouteName="index"
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        headerShown: false,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : colors.background,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          elevation: 0,
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView
              intensity={90}
              tint={isDark ? "dark" : "light"}
              style={StyleSheet.absoluteFill}
            />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]} />
          ),
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 10,
          fontFamily: "Inter_500Medium",
          marginTop: -2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Shelf",
          tabBarIcon: ({ color }) =>
            isIOS
              ? <SymbolView name="books.vertical" tintColor={color} size={22} />
              : <Feather name="book" size={21} color={color} />,
        }}
      />
      <Tabs.Screen
        name="buddy-reads"
        options={{
          title: "Buddy",
          tabBarIcon: ({ color }) =>
            isIOS
              ? <SymbolView name="person.2" tintColor={color} size={22} />
              : <Feather name="users" size={21} color={color} />,
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          title: "Discover",
          tabBarIcon: ({ color }) =>
            isIOS
              ? <SymbolView name="safari" tintColor={color} size={22} />
              : <Feather name="compass" size={21} color={color} />,
        }}
      />
      <Tabs.Screen
        name="journal"
        options={{
          title: "Journal",
          tabBarIcon: ({ color }) =>
            isIOS
              ? <SymbolView name="book" tintColor={color} size={22} />
              : <Feather name="book-open" size={21} color={color} />,
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: "Insights",
          tabBarIcon: ({ color }) =>
            isIOS
              ? <SymbolView name="chart.bar" tintColor={color} size={22} />
              : <Feather name="bar-chart-2" size={21} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) =>
            isIOS
              ? <SymbolView name="person" tintColor={color} size={22} />
              : <Feather name="user" size={21} color={color} />,
        }}
      />

      {/* Hidden — not in tab bar */}
      <Tabs.Screen name="library" options={{ href: null }} />
      <Tabs.Screen name="more"    options={{ href: null }} />
    </Tabs>
  );
}
