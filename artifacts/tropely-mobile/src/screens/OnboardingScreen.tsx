import React, { useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/navigation";
import { useStore } from "@/store";
import { LinearGradient } from "expo-linear-gradient";

type Nav = NativeStackNavigationProp<RootStackParamList>;

const ALL_TROPES = [
  "enemies-to-lovers", "slow burn", "found family", "redemption arc", "forced proximity",
  "second chance", "chosen one", "dark romance", "academic rivals", "small town",
  "forbidden love", "grumpy/sunshine", "fake dating", "morally grey", "prophecy",
];

const STEPS = ["Welcome", "Age", "Tropes", "Goals"] as const;
type Step = typeof STEPS[number];

export default function OnboardingScreen() {
  const nav = useNavigation<Nav>();
  const { setAge, setHasOnboarded, setPreferredTropes, setDailyGoalPages, setDailyGoalMinutes } = useStore();

  const [step, setStep] = useState<Step>("Welcome");
  const [ageInput, setAgeInput] = useState("");
  const [selectedTropes, setSelectedTropes] = useState<string[]>([]);
  const [goalPages, setGoalPages] = useState(20);
  const [goalMinutes, setGoalMinutes] = useState(30);

  const stepIndex = STEPS.indexOf(step);

  const toggleTrope = (t: string) => {
    setSelectedTropes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t],
    );
  };

  const handleAgeNext = () => {
    const n = parseInt(ageInput, 10);
    if (!n || n < 5 || n > 120) {
      Alert.alert("Please enter a valid age.");
      return;
    }
    setAge(n);
    if (n < 13) {
      // Under-13 safe mode: skip to finish
      finishOnboarding(n);
    } else {
      setStep("Tropes");
    }
  };

  const finishOnboarding = (age?: number) => {
    setPreferredTropes(selectedTropes);
    setDailyGoalPages(goalPages);
    setDailyGoalMinutes(goalMinutes);
    setHasOnboarded(true);
    nav.reset({ index: 0, routes: [{ name: "Tabs" }] });
  };

  return (
    <LinearGradient colors={["#fdf6ec", "#f5e6cc"]} style={styles.flex}>
      <SafeAreaView style={styles.flex} edges={["top", "bottom"]}>

        {/* Progress dots */}
        {step !== "Welcome" && (
          <View style={styles.dots}>
            {STEPS.filter((s) => s !== "Welcome").map((s) => (
              <View key={s} style={[styles.dot, s === step && styles.dotActive]} />
            ))}
          </View>
        )}

        {step === "Welcome" && (
          <View style={styles.page}>
            <Text style={styles.bigEmoji}>🌿</Text>
            <Text style={styles.welcomeTitle}>Welcome to Tropely</Text>
            <Text style={styles.welcomeSub}>
              The reading tracker that speaks in tropes, moods, and moments.
            </Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => setStep("Age")}>
              <Text style={styles.primaryBtnText}>Get started →</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === "Age" && (
          <ScrollView contentContainerStyle={styles.page}>
            <Text style={styles.stepEmoji}>🎂</Text>
            <Text style={styles.stepTitle}>How old are you?</Text>
            <Text style={styles.stepSub}>Used to show age-appropriate content. Under-13 readers get a safe mode.</Text>
            <TextInput
              style={styles.ageInput}
              value={ageInput}
              onChangeText={setAgeInput}
              keyboardType="number-pad"
              placeholder="Your age"
              placeholderTextColor="#9ca3af"
              maxLength={3}
              autoFocus
            />
            <TouchableOpacity style={styles.primaryBtn} onPress={handleAgeNext}>
              <Text style={styles.primaryBtnText}>Continue →</Text>
            </TouchableOpacity>
          </ScrollView>
        )}

        {step === "Tropes" && (
          <ScrollView contentContainerStyle={styles.page}>
            <Text style={styles.stepEmoji}>🎭</Text>
            <Text style={styles.stepTitle}>Pick your tropes</Text>
            <Text style={styles.stepSub}>We'll use these to personalise recommendations. Pick as many as you like.</Text>
            <View style={styles.tropeGrid}>
              {ALL_TROPES.map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.tropeChip, selectedTropes.includes(t) && styles.tropeChipActive]}
                  onPress={() => toggleTrope(t)}
                >
                  <Text style={[styles.tropeChipText, selectedTropes.includes(t) && styles.tropeChipTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => setStep("Goals")}>
              <Text style={styles.primaryBtnText}>Continue →</Text>
            </TouchableOpacity>
          </ScrollView>
        )}

        {step === "Goals" && (
          <ScrollView contentContainerStyle={styles.page}>
            <Text style={styles.stepEmoji}>🎯</Text>
            <Text style={styles.stepTitle}>Set your daily goal</Text>
            <Text style={styles.stepSub}>You can always change this later in your profile.</Text>

            <Text style={styles.goalLabel}>Pages per day</Text>
            <View style={styles.presetRow}>
              {[10, 20, 30, 50].map((n) => (
                <TouchableOpacity
                  key={n}
                  style={[styles.presetBtn, goalPages === n && styles.presetBtnActive]}
                  onPress={() => setGoalPages(n)}
                >
                  <Text style={[styles.presetBtnText, goalPages === n && styles.presetBtnTextActive]}>{n}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.goalLabel, { marginTop: 16 }]}>Minutes per day</Text>
            <View style={styles.presetRow}>
              {[15, 30, 60].map((n) => (
                <TouchableOpacity
                  key={n}
                  style={[styles.presetBtn, goalMinutes === n && styles.presetBtnActive]}
                  onPress={() => setGoalMinutes(n)}
                >
                  <Text style={[styles.presetBtnText, goalMinutes === n && styles.presetBtnTextActive]}>{n}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.primaryBtn} onPress={() => finishOnboarding()}>
              <Text style={styles.primaryBtnText}>Start reading 🌿</Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  dots: { flexDirection: "row", justifyContent: "center", gap: 6, paddingTop: 12 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#d4c9a8" },
  dotActive: { backgroundColor: "#1a1a1a", width: 20 },
  page: { flexGrow: 1, justifyContent: "center", alignItems: "center", padding: 32, gap: 16 },
  bigEmoji: { fontSize: 64, marginBottom: 8 },
  welcomeTitle: { fontSize: 32, fontWeight: "800", color: "#1a1a1a", textAlign: "center" },
  welcomeSub: { fontSize: 16, color: "#6b7280", textAlign: "center", lineHeight: 24 },
  stepEmoji: { fontSize: 48 },
  stepTitle: { fontSize: 26, fontWeight: "700", color: "#1a1a1a", textAlign: "center" },
  stepSub: { fontSize: 14, color: "#6b7280", textAlign: "center", lineHeight: 21 },
  primaryBtn: { backgroundColor: "#1a1a1a", borderRadius: 20, paddingVertical: 16, paddingHorizontal: 40, marginTop: 8 },
  primaryBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  ageInput: { width: 120, textAlign: "center", fontSize: 32, fontWeight: "700", color: "#1a1a1a", borderBottomWidth: 2, borderBottomColor: "#1a1a1a", paddingVertical: 8 },
  tropeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center" },
  tropeChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: "#d4c9a8", backgroundColor: "rgba(255,255,255,0.7)" },
  tropeChipActive: { backgroundColor: "#1a1a1a", borderColor: "#1a1a1a" },
  tropeChipText: { fontSize: 13, color: "#1a1a1a" },
  tropeChipTextActive: { color: "#fff" },
  goalLabel: { fontSize: 13, fontWeight: "700", color: "#6b7280", alignSelf: "flex-start", width: "100%" },
  presetRow: { flexDirection: "row", gap: 10, alignSelf: "flex-start" },
  presetBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: "#d4c9a8", backgroundColor: "rgba(255,255,255,0.7)" },
  presetBtnActive: { backgroundColor: "#1a1a1a", borderColor: "#1a1a1a" },
  presetBtnText: { fontSize: 15, fontWeight: "600", color: "#1a1a1a" },
  presetBtnTextActive: { color: "#fff" },
});
