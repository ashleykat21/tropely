import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Share,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUser } from "@/context/AuthContext";
import { useStore } from "@/store";
import { trackEvent } from "@/lib/analytics";

const REFERRALS_PER_MONTH = 3;

export default function ReferralScreen() {
  const user = useUser();
  const { referralCode, referralCount, freeMonthsEarned, setReferralCode } = useStore();

  useEffect(() => {
    if (!referralCode && user?.email) {
      const base = user.email.split("@")[0].replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
      const suffix = Math.floor(1000 + Math.random() * 9000);
      setReferralCode(`TROPELY-${base}${suffix}`);
    }
  }, [referralCode, user?.email]);

  const prevCount = useRef(referralCount);
  const bannerOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (referralCount > prevCount.current) {
      prevCount.current = referralCount;
      Animated.sequence([
        Animated.timing(bannerOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.delay(2500),
        Animated.timing(bannerOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start();
    }
  }, [referralCount]);

  const progressInCycle = referralCount % REFERRALS_PER_MONTH;
  const progressPct = progressInCycle / REFERRALS_PER_MONTH;
  const remaining = REFERRALS_PER_MONTH - progressInCycle;

  const handleShare = async () => {
    if (!referralCode) return;
    try {
      await Share.share({
        message: `Join me on Tropely — your cozy mood-based reading companion. Use my code ${referralCode} to sign up! 📚`,
      });
      trackEvent("Referral Shared", { code: referralCode });
    } catch {}
  };

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <Animated.View style={[styles.banner, { opacity: bannerOpacity }]} pointerEvents="none">
        <Text style={styles.bannerText}>🎉 New referral! You're one step closer to a free month.</Text>
      </Animated.View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Invite friends</Text>
        <Text style={styles.sub}>Share Tropely and earn free Premium months.</Text>

        {/* Referral code card */}
        <View style={styles.codeCard}>
          <Text style={styles.codeLabel}>YOUR CODE</Text>
          <Text style={styles.code}>{referralCode ?? "Generating..."}</Text>
          <TouchableOpacity style={styles.shareBtn} onPress={handleShare} activeOpacity={0.8}>
            <Text style={styles.shareBtnText}>Share with friends →</Text>
          </TouchableOpacity>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{referralCount}</Text>
            <Text style={styles.statLbl}>Friends referred</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{freeMonthsEarned}</Text>
            <Text style={styles.statLbl}>Free months earned</Text>
          </View>
        </View>

        {/* Progress to next free month */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Progress to next free month</Text>
            <Text style={styles.progressCount}>{progressInCycle} / {REFERRALS_PER_MONTH}</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progressPct * 100}%` }]} />
          </View>
          <Text style={styles.progressHint}>
            {remaining} more referral{remaining !== 1 ? "s" : ""} to unlock a free month
          </Text>
        </View>

        {/* How it works */}
        <View style={styles.howCard}>
          <Text style={styles.howTitle}>How it works</Text>
          {[
            { n: "1", text: "Share your unique code with a friend" },
            { n: "2", text: "They sign up on Tropely and enter your code" },
            { n: "3", text: "You both get rewarded — 3 referrals = 1 free Premium month" },
          ].map((step) => (
            <View key={step.n} style={styles.howRow}>
              <View style={styles.howNum}>
                <Text style={styles.howNumText}>{step.n}</Text>
              </View>
              <Text style={styles.howText}>{step.text}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fafaf9" },
  banner: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: "#d1fae5",
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  bannerText: { fontSize: 13, fontWeight: "600", color: "#065f46" },
  content: { padding: 20, gap: 16, paddingBottom: 48 },
  heading: { fontSize: 26, fontWeight: "700", color: "#1a1a1a" },
  sub: { fontSize: 14, color: "#9ca3af", marginTop: -8 },
  codeCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "#f0f0f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  codeLabel: { fontSize: 10, fontWeight: "700", color: "#9ca3af", letterSpacing: 2 },
  code: { fontSize: 28, fontWeight: "800", color: "#1a1a1a", letterSpacing: 2 },
  shareBtn: {
    backgroundColor: "#1a1a1a",
    borderRadius: 14,
    paddingHorizontal: 28,
    paddingVertical: 13,
    marginTop: 4,
  },
  shareBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  statsRow: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#f0f0f0",
    overflow: "hidden",
  },
  statBox: { flex: 1, alignItems: "center", paddingVertical: 18 },
  statNum: { fontSize: 28, fontWeight: "700", color: "#1a1a1a" },
  statLbl: { fontSize: 11, color: "#9ca3af", marginTop: 2 },
  statDivider: { width: 1, backgroundColor: "#f0f0f0" },
  progressCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  progressHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  progressLabel: { fontSize: 13, fontWeight: "600", color: "#1a1a1a" },
  progressCount: { fontSize: 13, fontWeight: "700", color: "#6b7280" },
  progressTrack: { height: 8, backgroundColor: "#f3f4f6", borderRadius: 4, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: "#1a1a1a", borderRadius: 4 },
  progressHint: { fontSize: 12, color: "#9ca3af" },
  howCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  howTitle: { fontSize: 14, fontWeight: "700", color: "#1a1a1a" },
  howRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  howNum: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  howNumText: { fontSize: 13, fontWeight: "700", color: "#1a1a1a" },
  howText: { flex: 1, fontSize: 13, color: "#6b7280", lineHeight: 20, paddingTop: 3 },
});
