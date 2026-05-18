import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Text } from "react-native";

// Screens
import HomeScreen from "@/screens/HomeScreen";
import DiscoverScreen from "@/screens/DiscoverScreen";
import LibraryScreen from "@/screens/LibraryScreen";
import ProfileScreen from "@/screens/ProfileScreen";
import BuddyReadsScreen from "@/screens/BuddyReadsScreen";
import OnboardingScreen from "@/screens/OnboardingScreen";
import BookDetailScreen from "@/screens/BookDetailScreen";
import CompanionScreen from "@/screens/CompanionScreen";
import TropeMatchScreen from "@/screens/TropeMatchScreen";
import JournalScreen from "@/screens/JournalScreen";
import InsightsScreen from "@/screens/InsightsScreen";
import ReferralScreen from "@/screens/ReferralScreen";
import AvatarPickerScreen from "@/screens/AvatarPickerScreen";
import InboxScreen from "@/screens/InboxScreen";
import SettingsScreen from "@/screens/SettingsScreen";
import { useStore } from "@/store";
import { NAV_ICONS } from "@/constants/theme";

// ── Param lists ──────────────────────────────────────────────────────────────

export type TabParamList = {
  Today: undefined;
  Library: undefined;
  Discover: undefined;
  BuddyReads: undefined;
  Me: undefined;
};

export type RootStackParamList = {
  Onboarding: undefined;
  Tabs: undefined;
  BookDetail: { bookId: string };
  Companion: { bookId?: string };
  BuddyReadsRoom: { roomId: string };
  TropeMatch: undefined;
  Journal: undefined;
  WhatsNew: undefined;
  Settings: undefined;
  FocusMode: { bookId?: string };
  Referral: undefined;
  AvatarPicker: undefined;
  Inbox: undefined;
  Insights: undefined;
};

// ── Tab icon ─────────────────────────────────────────────────────────────────

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const info = NAV_ICONS[label];
  const icon = info ? (focused ? info.active : info.inactive) : "●";
  return (
    <Text style={{ fontSize: focused ? 22 : 20, opacity: focused ? 1 : 0.5 }}>
      {icon}
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
        tabBarLabel: route.name === "Today" ? "Today"
          : route.name === "BuddyReads" ? "Buddy"
          : route.name,
        tabBarActiveTintColor: "#1a1a1a",
        tabBarInactiveTintColor: "#9ca3af",
        tabBarStyle: {
          backgroundColor: "rgba(255,255,255,0.95)",
          borderTopColor: "rgba(167,139,250,0.15)",
          paddingBottom: 4,
        },
      })}
    >
      <Tab.Screen name="Today" component={HomeScreen} />
      <Tab.Screen name="Library" component={LibraryScreen} />
      <Tab.Screen name="Discover" component={DiscoverScreen} />
      <Tab.Screen name="BuddyReads" component={BuddyReadsScreen} />
      <Tab.Screen name="Me" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  const hasOnboarded = useStore((s) => s.hasOnboarded);
  const adultConfirmed = useStore((s) => s.adultConfirmed);
  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName={hasOnboarded && adultConfirmed ? "Tabs" : "Onboarding"}
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
        name="BuddyReadsRoom"
        component={BuddyReadsScreen}
        options={{ headerShown: true, title: "Buddy Reads" }}
      />
      <Stack.Screen
        name="TropeMatch"
        component={TropeMatchScreen}
        options={{ presentation: "modal", headerShown: false }}
      />
      <Stack.Screen
        name="Journal"
        component={JournalScreen}
        options={{ headerShown: true, title: "Journal" }}
      />
      <Stack.Screen
        name="Insights"
        component={InsightsScreen}
        options={{ headerShown: true, title: "Insights" }}
      />
      <Stack.Screen
        name="FocusMode"
        component={HomeScreen}
        options={{ headerShown: true, title: "Focus Mode" }}
      />
      <Stack.Screen
        name="Referral"
        component={ReferralScreen}
        options={{ headerShown: true, title: "Invite Friends" }}
      />
      <Stack.Screen
        name="AvatarPicker"
        component={AvatarPickerScreen}
        options={{ presentation: "modal", headerShown: true, title: "Choose Avatar" }}
      />
      <Stack.Screen
        name="Inbox"
        component={InboxScreen}
        options={{ presentation: "modal", headerShown: true, title: "Inbox" }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ headerShown: true, title: "Settings" }}
      />
      <Stack.Screen
        name="WhatsNew"
        component={SettingsScreen}
        options={{ headerShown: true, title: "What's New" }}
      />
    </Stack.Navigator>
  );
}
