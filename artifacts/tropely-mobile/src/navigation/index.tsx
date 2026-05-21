import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
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
import PremiumScreen from "@/screens/PremiumScreen";
import BackgroundThemeScreen from "@/screens/BackgroundThemeScreen";
import { useStore } from "@/store";
import { TodayIcon, LibraryIcon, DiscoverIcon, BuddyReadsIcon, MeIcon } from "@/components/TabIcons";

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
  Premium: undefined;
  BackgroundTheme: undefined;
};

// ── Navigators ───────────────────────────────────────────────────────────────

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#e8608a",
        tabBarActiveTintColor: "#d8b4fe", // Consistent fantasy accent for active icons
        tabBarInactiveTintColor: "#9ca3af",
        tabBarLabelStyle: { fontSize: 10, fontWeight: "600", marginBottom: 2 },
        tabBarStyle: {
          backgroundColor: "rgba(255,255,255,0.95)",
          borderTopColor: "rgba(200,180,220,0.2)",
          borderTopWidth: 1,
          paddingBottom: 4,
          height: 60,
        },
      }}
    >
      <Tab.Screen
        name="Today"
        component={HomeScreen}
        options={{
          tabBarLabel: "Today",
          tabBarIcon: ({ focused, color, size }) => <TodayIcon focused={focused} color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Library"
        component={LibraryScreen}
        options={{
          tabBarLabel: "Library",
          tabBarIcon: ({ focused, color, size }) => <LibraryIcon focused={focused} color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Discover"
        component={DiscoverScreen}
        options={{
          tabBarLabel: "Discover",
          tabBarIcon: ({ focused, color, size }) => <DiscoverIcon focused={focused} color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="BuddyReads"
        component={BuddyReadsScreen}
        options={{
          tabBarLabel: "Buddy",
          tabBarIcon: ({ focused, color, size }) => <BuddyReadsIcon focused={focused} color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Me"
        component={ProfileScreen}
        options={{
          tabBarLabel: "Me",
          tabBarIcon: ({ focused, color, size }) => <MeIcon focused={focused} color={color} size={size} />,
        }}
      />
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
      <Stack.Screen
        name="Premium"
        component={PremiumScreen}
        options={{ headerShown: false, presentation: "modal" }}
      />
      <Stack.Screen
        name="BackgroundTheme"
        component={BackgroundThemeScreen}
        options={{ headerShown: true, title: "Background & Theme" }}
      />
    </Stack.Navigator>
  );
}
