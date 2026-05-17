import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";

// Screens
import HomeScreen from "@/screens/HomeScreen";
import DiscoverScreen from "@/screens/DiscoverScreen";
import JournalScreen from "@/screens/JournalScreen";
import ProfileScreen from "@/screens/ProfileScreen";
import LibraryScreen from "@/screens/LibraryScreen";
import InsightsScreen from "@/screens/InsightsScreen";
import BookDetailScreen from "@/screens/BookDetailScreen";
import CompanionScreen from "@/screens/CompanionScreen";
import BuddyReadsScreen from "@/screens/BuddyReadsScreen";
import OnboardingScreen from "@/screens/OnboardingScreen";
import TropeMatchScreen from "@/screens/TropeMatchScreen";
import { useStore } from "@/store";

// ── Param lists ──────────────────────────────────────────────────────────────

export type RootStackParamList = {
  Onboarding: undefined;
  Tabs: undefined;
  BookDetail: { bookId: string };
  Companion: { bookId?: string };
  BuddyReads: undefined;
  TropeMatch: undefined;
  Library: undefined;
  Insights: undefined;
};

export type TabParamList = {
  Home: undefined;
  Discover: undefined;
  Journal: undefined;
  Me: undefined;
  More: undefined;
};

// ── More screen ──────────────────────────────────────────────────────────────

function MoreScreen() {
  const nav = useNavigation<any>();

  const items = [
    { label: "My Shelf", emoji: "📚", screen: "Library", desc: "All your books in one place" },
    { label: "Insights", emoji: "📊", screen: "Insights", desc: "Your reading stats & trends" },
    { label: "AI Companion", emoji: "✨", screen: "Companion", desc: "Chat about your current read" },
    { label: "Buddy Reads", emoji: "👥", screen: "BuddyReads", desc: "Read together with friends" },
    { label: "Trope Match", emoji: "🎭", screen: "TropeMatch", desc: "Find your next read by trope" },
  ];

  return (
    <SafeAreaView style={moreStyles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={moreStyles.content}>
        <Text style={moreStyles.title}>More</Text>
        {items.map((item) => (
          <TouchableOpacity
            key={item.screen}
            style={moreStyles.row}
            onPress={() => nav.navigate(item.screen)}
            activeOpacity={0.7}
          >
            <View style={moreStyles.iconBox}>
              <Text style={moreStyles.emoji}>{item.emoji}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={moreStyles.label}>{item.label}</Text>
              <Text style={moreStyles.desc}>{item.desc}</Text>
            </View>
            <Text style={moreStyles.arrow}>→</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const moreStyles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fafaf9" },
  content: { padding: 20, gap: 12, paddingBottom: 40 },
  title: { fontSize: 32, fontWeight: "800", color: "#1a1a1a", marginBottom: 8 },
  row: { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: "#fff", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#f0f0f0" },
  iconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: "#fafaf9", justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "#f0f0f0" },
  emoji: { fontSize: 22 },
  label: { fontSize: 15, fontWeight: "700", color: "#1a1a1a" },
  desc: { fontSize: 12, color: "#9ca3af", marginTop: 2 },
  arrow: { fontSize: 16, color: "#9ca3af" },
});

// ── Tab icon ─────────────────────────────────────────────────────────────────

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Home: "🏠",
    Discover: "🔍",
    Journal: "📝",
    Me: "👤",
    More: "⋯",
  };
  return (
    <Text style={{ fontSize: focused ? 22 : 20, opacity: focused ? 1 : 0.5 }}>
      {icons[label] ?? "●"}
    </Text>
  );
}

// ── Navigators ───────────────────────────────────────────────────────────────

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused }) => (
          <TabIcon label={route.name} focused={focused} />
        ),
        tabBarLabel: route.name,
        tabBarActiveTintColor: "#1a1a1a",
        tabBarInactiveTintColor: "#9ca3af",
        tabBarStyle: {
          backgroundColor: "#ffffff",
          borderTopColor: "#e5e7eb",
          paddingBottom: 4,
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Discover" component={DiscoverScreen} />
      <Tab.Screen name="Journal" component={JournalScreen} />
      <Tab.Screen name="Me" component={ProfileScreen} />
      <Tab.Screen name="More" component={MoreScreen} />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  const hasOnboarded = useStore((s) => s.hasOnboarded);
  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName={hasOnboarded ? "Tabs" : "Onboarding"}
    >
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="Tabs" component={TabNavigator} />
      <Stack.Screen
        name="BookDetail"
        component={BookDetailScreen}
        options={{ presentation: "modal", headerShown: true, title: "" }}
      />
      <Stack.Screen
        name="Companion"
        component={CompanionScreen}
        options={{ presentation: "modal", headerShown: true, title: "AI Companion" }}
      />
      <Stack.Screen
        name="BuddyReads"
        component={BuddyReadsScreen}
        options={{ headerShown: true, title: "Buddy Reads" }}
      />
      <Stack.Screen
        name="TropeMatch"
        component={TropeMatchScreen}
        options={{ presentation: "modal", headerShown: false }}
      />
      <Stack.Screen
        name="Library"
        component={LibraryScreen}
        options={{ headerShown: true, title: "My Shelf" }}
      />
      <Stack.Screen
        name="Insights"
        component={InsightsScreen}
        options={{ headerShown: true, title: "Insights" }}
      />
    </Stack.Navigator>
  );
}
