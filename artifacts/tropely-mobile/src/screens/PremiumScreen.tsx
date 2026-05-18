import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/navigation";
import { GradientView } from "@/components/GradientView";
import { useStore } from "@/store";
import { COLORS, SHADOW } from "@/constants/theme";

type Nav = NativeStackNavigationProp<RootStackParamList>;

const FEATURES = [
  { emoji: "💬", label: "Larger Buddy Read rooms (up to 10)" },
  { emoji: "🏠", label: "Unlimited active Buddy Read rooms" },
  { emoji: "🤖", label: "More AI Companion messages" },
  { emoji: "🎭", label: "Character AI chat" },
  { emoji: "📊", label: "Advanced insights" },
  { emoji: "🎨", label: "Custom themes & room themes" },
  { emoji: "📅", label: "Seasonal challenges & Yearly Wrapped" },
  { emoji: "💌", label: "Shareable reading cards" },
  { emoji: "🗳️", label: "Polls & chapter checkpoints" },
  { emoji: "📈", label: "Advanced recommendation filters" },
];

export default function PremiumScreen() {
  const nav = useNavigation<Nav>();
  const premiumTestingModeEnabled = useStore((s) => s.premiumTestingModeEnabled);

  return (
    <GradientView
      colors={["#fdf0f5", "#f9e4ee", "#f0d4e8"]}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Back button */}
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => nav.goBack()}
            activeOpacity={0.7}
          >
            <Text style={styles.backBtnText}>← Back</Text>
          </TouchableOpacity>

          {/* Hero */}
          <View style={styles.hero}>
            <Text style={styles.heroEmoji}>✨</Text>
            <Text style={styles.heroTitle}>Tropely Premium</Text>
            <Text style={styles.heroSub}>
              The full reading experience, unlocked
            </Text>
          </View>

          {/* Testing mode banner */}
          {premiumTestingModeEnabled && (
            <View style={styles.testingBanner}>
              <Text style={styles.testingBannerText}>
                ✨ Premium is unlocked during testing
              </Text>
            </View>
          )}

          {/* Pricing */}
          {!premiumTestingModeEnabled && (
            <View style={styles.pricingRow}>
              <View style={styles.pricingCard}>
                <Text style={styles.pricingLabel}>Monthly</Text>
                <Text style={styles.pricingAmount}>$4.99</Text>
                <Text style={styles.pricingPer}>/month</Text>
              </View>
              <View style={[styles.pricingCard, styles.pricingCardHighlight]}>
                <View style={styles.saveBadge}>
                  <Text style={styles.saveBadgeText}>Save 33%</Text>
                </View>
                <Text style={[styles.pricingLabel, styles.pricingLabelHighlight]}>
                  Yearly
                </Text>
                <Text style={[styles.pricingAmount, styles.pricingAmountHighlight]}>
                  $39.99
                </Text>
                <Text style={[styles.pricingPer, styles.pricingPerHighlight]}>
                  /year
                </Text>
              </View>
            </View>
          )}

          {/* Feature list */}
          <View style={styles.featureCard}>
            <Text style={styles.featureCardTitle}>Everything in Premium</Text>
            {FEATURES.map((f) => (
              <View key={f.label} style={styles.featureRow}>
                <Text style={styles.featureEmoji}>{f.emoji}</Text>
                <Text style={styles.featureLabel}>{f.label}</Text>
              </View>
            ))}
          </View>

          {/* CTA */}
          <TouchableOpacity
            style={[
              styles.ctaBtn,
              premiumTestingModeEnabled && styles.ctaBtnUnlocked,
            ]}
            onPress={() => {
              if (!premiumTestingModeEnabled) {
                // Placeholder: no real purchase yet
              }
            }}
            activeOpacity={premiumTestingModeEnabled ? 1 : 0.85}
          >
            <Text style={styles.ctaBtnText}>
              {premiumTestingModeEnabled
                ? "Premium unlocked for testers"
                : "Subscribe to Premium"}
            </Text>
          </TouchableOpacity>

          {!premiumTestingModeEnabled && (
            <Text style={styles.legalNote}>
              Subscriptions auto-renew. Cancel anytime in App Store settings.
            </Text>
          )}
        </ScrollView>
      </SafeAreaView>
    </GradientView>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safe: { flex: 1 },
  content: { padding: 20, gap: 16, paddingBottom: 48 },

  backBtn: { alignSelf: "flex-start", paddingVertical: 4 },
  backBtnText: { fontSize: 15, color: "#f472b6", fontWeight: "600" },

  hero: { alignItems: "center", paddingVertical: 8 },
  heroEmoji: { fontSize: 48, marginBottom: 8 },
  heroTitle: { fontSize: 28, fontWeight: "800", color: "#1a1a1a", textAlign: "center" },
  heroSub: { fontSize: 15, color: "#4a4a5a", textAlign: "center", marginTop: 6, lineHeight: 22 },

  testingBanner: {
    backgroundColor: "rgba(244,114,182,0.15)",
    borderWidth: 1,
    borderColor: "rgba(244,114,182,0.35)",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  testingBannerText: { fontSize: 14, fontWeight: "600", color: "#c026d3" },

  pricingRow: { flexDirection: "row", gap: 12 },
  pricingCard: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.75)",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.6)",
    padding: 16,
    alignItems: "center",
    gap: 2,
    ...SHADOW,
  },
  pricingCardHighlight: {
    backgroundColor: "#f472b6",
    borderColor: "#f472b6",
  },
  saveBadge: {
    backgroundColor: "rgba(255,255,255,0.25)",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 4,
  },
  saveBadgeText: { fontSize: 11, fontWeight: "700", color: "#fff" },
  pricingLabel: { fontSize: 12, fontWeight: "600", color: "#9ca3af" },
  pricingLabelHighlight: { color: "rgba(255,255,255,0.85)" },
  pricingAmount: { fontSize: 28, fontWeight: "800", color: "#1a1a1a" },
  pricingAmountHighlight: { color: "#fff" },
  pricingPer: { fontSize: 12, color: "#9ca3af" },
  pricingPerHighlight: { color: "rgba(255,255,255,0.75)" },

  featureCard: {
    backgroundColor: "rgba(255,255,255,0.75)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.6)",
    padding: 18,
    gap: 10,
    ...SHADOW,
  },
  featureCardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  featureEmoji: { fontSize: 18, width: 26 },
  featureLabel: { fontSize: 14, color: "#4a4a5a", flex: 1 },

  ctaBtn: {
    backgroundColor: "#f472b6",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: "#f472b6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  ctaBtnUnlocked: {
    backgroundColor: "rgba(244,114,182,0.4)",
    shadowOpacity: 0,
    elevation: 0,
  },
  ctaBtnText: { fontSize: 16, fontWeight: "700", color: "#fff" },

  legalNote: {
    textAlign: "center",
    fontSize: 11,
    color: "#9ca3af",
    lineHeight: 16,
  },
});
