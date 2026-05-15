import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Text } from "react-native";

// Screens
import HomeScreen from "@/screens/HomeScreen";
import LibraryScreen from "@/screens/LibraryScreen";
import DiscoverScreen from "@/screens/DiscoverScreen";
import JournalScreen from "@/screens/JournalScreen";
import InsightsScreen from "@/screens/InsightsScreen";
import ProfileScreen from "@/screens/ProfileScreen";
import BookDetailScreen from "@/screens/BookDetailScreen";
import CompanionScreen from "@/screens/CompanionScreen";
import BuddyReadsScreen from "@/screens/BuddyReadsScreen";
import OnboardingScreen from "@/screens/OnboardingScreen";
import TropeMatchScreen from "@/screens/TropeMatchScreen";
import ReferralScreen from "@/screens/ReferralScreen";
import { useStore } from "@/store";

// ── Param lists ──────────────────────────────────────────────────────────────

export type RootStackParamList = {
  Onboarding: undefined;
  Tabs: undefined;
  BookDetail: { bookId: string };
  Companion: { bookId?: string };
  BuddyReads: undefined;
  TropeMatch: undefined;
  Referral: undefined;
};

export type TabParamList = {
  Reading: undefined;
  Shelf: undefined;
  Discover: undefined;
  Journal: undefined;
  Insights: undefined;
  Profile: undefined;
};

// ── Tab icon helper ──────────────────────────────────────────────────────────

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Reading: "📖",
    Shelf: "📚",
    Discover: "🔍",
    Journal: "📝",
    Insights: "📊",
    Profile: "👤",
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
      <Tab.Screen name="Reading" component={HomeScreen} />
      <Tab.Screen name="Shelf" component={LibraryScreen} />
      <Tab.Screen name="Discover" component={DiscoverScreen} />
      <Tab.Screen name="Journal" component={JournalScreen} />
      <Tab.Screen name="Insights" component={InsightsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
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
        name="Referral"
        component={ReferralScreen}
        options={{ presentation: "modal", headerShown: true, title: "Invite Friends" }}
      />
    </Stack.Navigator>
  );
}
