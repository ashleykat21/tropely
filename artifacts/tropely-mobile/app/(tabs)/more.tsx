import { Feather } from "@expo/vector-icons";
import { SymbolView } from "expo-symbols";
import { useRouter } from "expo-router";
import React from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

const TAB_BAR_HEIGHT = 84;

type NavItem = {
  label: string;
  description: string;
  emoji: string;
  featherIcon: string;
  sfSymbol: string;
  route: string;
  accent: string;
};

const NAV_ITEMS: NavItem[] = [
  {
    label: "Buddy Reads",
    description: "Read together, react together",
    emoji: "👥",
    featherIcon: "users",
    sfSymbol: "person.2",
    route: "/(tabs)/buddy-reads",
    accent: "#9B72CF",
  },
  {
    label: "Insights",
    description: "Stats, streaks & reading trends",
    emoji: "📊",
    featherIcon: "bar-chart-2",
    sfSymbol: "chart.bar",
    route: "/(tabs)/insights",
    accent: "#5CB8C8",
  },
];

export default function MoreScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const isIOS = Platform.OS === "ios";

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, {
        paddingTop: Platform.OS === "web" ? 67 : insets.top + 12,
        backgroundColor: colors.background,
        borderBottomColor: colors.border,
      }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>More</Text>
        <Text style={[styles.sub, { color: colors.mutedForeground }]}>
          Features & settings
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 20,
          paddingBottom: (Platform.OS === "web" ? 34 : insets.bottom) + TAB_BAR_HEIGHT + 16,
          gap: 12,
        }}
        showsVerticalScrollIndicator={false}
      >
        {NAV_ITEMS.map((item) => (
          <Pressable
            key={item.route}
            style={({ pressed }) => [
              styles.card,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                opacity: pressed ? 0.88 : 1,
              },
            ]}
            onPress={() => router.push(item.route as any)}
          >
            <View style={[styles.iconWrap, { backgroundColor: item.accent + "20" }]}>
              {isIOS
                ? <SymbolView name={item.sfSymbol as any} tintColor={item.accent} size={24} />
                : <Feather name={item.featherIcon as any} size={22} color={item.accent} />}
            </View>
            <View style={styles.cardText}>
              <Text style={[styles.cardLabel, { color: colors.foreground }]}>{item.label}</Text>
              <Text style={[styles.cardDesc, { color: colors.mutedForeground }]}>{item.description}</Text>
            </View>
            <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  title: { fontSize: 26, fontFamily: "Inter_700Bold" },
  sub: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },

  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  cardText: { flex: 1 },
  cardLabel: { fontSize: 16, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
  cardDesc: { fontSize: 13, fontFamily: "Inter_400Regular" },
});
