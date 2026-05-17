import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Text } from "react-native";

// Screens
import HomeScreen from "@/screens/HomeScreen";
import DiscoverScreen from "@/screens/DiscoverScreen";
import LibraryScreen from "@/screens/LibraryScreen";
import ProfileScreen from "@/screens/ProfileScreen";
import MoreScreen from "@/screens/MoreScreen";
import BookDetailScreen from "@/screens/BookDetailScreen";
import CompanionScreen from "@/screens/CompanionScreen";
import BuddyReadsScreen from "@/screens/BuddyReadsScreen";
import OnboardingScreen from "@/screens/OnboardingScreen";
import TropeMatchScreen from "@/screens/TropeMatchScreen";
import InsightsScreen from "@/screens/InsightsScreen";
import JournalScreen from "@/screens/JournalScreen";
import SocialScreen from "@/screens/SocialScreen";
import WhatsNewScreen from "@/screens/WhatsNewScreen";
import SettingsScreen from "@/screens/SettingsScreen";
import FocusModeScreen from "@/screens/FocusModeScreen";
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
  Insights: undefined;
  Journal: undefined;
  Social: undefined;
  WhatsNew: undefined;
  Settings: undefined;
  FocusMode: { bookId?: string };
  Referral: undefined;
  Auth: undefined;
};

export type TabParamList = {
  Home: undefined;
  Discover: undefined;
  Library: undefined;
  Me: undefined;
  More: undefined;
};

// ── Tab icon ─────────────────────────────────────────────────────────────────

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Home:     "🏡",
    Discover: "🧭",
    Library:  "📚",
    Me:       "🪴",
    More:     "☁️",
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
          borderTopColor: "#f0ede8",
          paddingBottom: 4,
        },
      })}
    >
      <Tab.Screen name="Home"     component={HomeScreen} />
      <Tab.Screen name="Discover" component={DiscoverScreen} />
      <Tab.Screen name="Library"  component={LibraryScreen} />
      <Tab.Screen name="Me"       component={ProfileScreen} />
      <Tab.Screen name="More"     component={MoreScreen} />
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
      <Stack.Screen name="Tabs"       component={TabNavigator} />
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
        name="Insights"
        component={InsightsScreen}
        options={{ headerShown: true, title: "Insights" }}
      />
      <Stack.Screen
        name="Journal"
        component={JournalScreen}
        options={{ presentation: "modal", headerShown: false }}
      />
      <Stack.Screen
        name="Social"
        component={SocialScreen}
        options={{ headerShown: true, title: "Community" }}
      />
      <Stack.Screen
        name="WhatsNew"
        component={WhatsNewScreen}
        options={{ presentation: "modal", headerShown: false }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ headerShown: true, title: "Settings" }}
      />
      <Stack.Screen
        name="FocusMode"
        component={FocusModeScreen}
        options={{ presentation: "fullScreenModal", headerShown: false }}
      />
      <Stack.Screen
        name="Referral"
        component={ReferralScreen}
        options={{ headerShown: true, title: "Invite Friends" }}
      />
    </Stack.Navigator>
  );
}
