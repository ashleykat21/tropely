import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/navigation";
import { useStore } from "@/store";
import { GradientView } from "@/components/GradientView";
import {
  COLORS, GENRES, TROPES_BY_GENRE, READING_VIBE_RESULTS,
  AVATARS, getAvatarById, getAllAvatars,
} from "@/constants/theme";

type Nav = NativeStackNavigationProp<RootStackParamList>;

function getAge(birthDate: Date): number {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
  return age;
}

const TOTAL_STEPS = 8;

const TOUR_SLIDES = [
  { emoji: "🎭", title: "Read by mood", desc: "Pick how you're feeling and we'll show you what to read next." },
  { emoji: "📊", title: "Track your progress", desc: "Log reading sessions by page or by minute — physical book, ebook, or audiobook." },
  { emoji: "✍️", title: "Journal as you go", desc: "Save quotes, highlights, and reactions to chapters as you read." },
  { emoji: "👥", title: "Buddy Reads", desc: "Read together with friends and discuss chapter by chapter, spoiler-free." },
];

export default function OnboardingScreen() {
  const nav = useNavigation<Nav>();
  const {
    setHasOnboarded, setAdultConfirmed,
    setSelectedAvatar, setSelectedGenres,
    setSelectedTropesQuiz, setReadingVibe,
    selectedAvatar,
  } = useStore();

  const [step, setStep] = useState(0);

  // Step 2: Age gate
  const [dobDay, setDobDay] = useState("");
  const [dobMonth, setDobMonth] = useState("");
  const [dobYear, setDobYear] = useState("");
  const [ageBlocked, setAgeBlocked] = useState(false);

  // Step 3: Avatar
  // uses selectedAvatar from store

  // Step 4-5: Tour
  const [tourSlide, setTourSlide] = useState(0);

  // Step 6: Genres
  const [genres, setGenres] = useState<string[]>([]);

  // Step 7: Tropes
  const [tropes, setTropes] = useState<string[]>([]);

  const next = () => setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  const finish = () => {
    setHasOnboarded(true);
    setSelectedGenres(genres);
    setSelectedTropesQuiz(tropes);
    // Compute reading vibe
    const vibeKey = genres[0] && tropes[0] ? `${genres[0]}_${tropes[0]}` : "default";
    const vibe = READING_VIBE_RESULTS[vibeKey] ?? READING_VIBE_RESULTS["default"];
    setReadingVibe(vibe);
    nav.reset({ index: 0, routes: [{ name: "Tabs" }] });
  };

  const handleAgeSubmit = () => {
    const d = parseInt(dobDay, 10);
    const m = parseInt(dobMonth, 10);
    const y = parseInt(dobYear, 10);
    if (isNaN(d) || isNaN(m) || isNaN(y) || y < 1900 || y > new Date().getFullYear()) {
      Alert.alert("Please enter a valid date of birth.");
      return;
    }
    const dob = new Date(y, m - 1, d);
    const age = getAge(dob);
    if (age < 18) {
      setAgeBlocked(true);
    } else {
      setAdultConfirmed(true);
      next();
    }
  };

  const toggleGenre = (g: string) =>
    setGenres((prev) => prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]);

  const toggleTrope = (t: string) =>
    setTropes((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]);

  const availableTropes = genres.flatMap((g) => TROPES_BY_GENRE[g] ?? []);
  const uniqueTropes = [...new Set(availableTropes)].slice(0, 20);

  const currentAvatar = getAvatarById(selectedAvatar);

  // Compute vibe for step 8
  const vibeKey = genres[0] && tropes[0] ? `${genres[0]}_${tropes[0]}` : "default";
  const vibe = READING_VIBE_RESULTS[vibeKey] ?? READING_VIBE_RESULTS["default"];

  const gradColors = COLORS.gradPrimary;

  return (
    <GradientView colors={gradColors} style={{ flex: 1 }}>
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        {/* Step dots */}
        {!ageBlocked && (
          <View style={styles.dots}>
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
            ))}
          </View>
        )}

        {/* Step 0: Welcome */}
        {step === 0 && (
          <ScrollView contentContainerStyle={styles.content}>
            <Text style={styles.bigEmoji}>📚</Text>
            <Text style={styles.heading}>Welcome to Tropely</Text>
            <Text style={styles.sub}>Read by mood. Track what moves you.</Text>
            <View style={styles.featureList}>
              {["Mood-based recommendations", "Reading & listening tracker", "Journal your reactions", "Buddy Reads with friends"].map((f) => (
                <View key={f} style={styles.featureRow}>
                  <Text style={styles.featureCheck}>✓</Text>
                  <Text style={styles.featureText}>{f}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity style={styles.nextBtn} onPress={next}>
              <Text style={styles.nextBtnText}>Get started →</Text>
            </TouchableOpacity>
          </ScrollView>
        )}

        {/* Step 1: Age gate */}
        {step === 1 && !ageBlocked && (
          <ScrollView contentContainerStyle={styles.content}>
            <Text style={styles.bigEmoji}>🔒</Text>
            <Text style={styles.heading}>How old are you?</Text>
            <Text style={styles.sub}>We need to confirm you're 18+ to access all of Tropely's features.</Text>
            <View style={styles.dobRow}>
              <TextInput
                style={[styles.dobInput, { flex: 1 }]}
                placeholder="DD"
                keyboardType="number-pad"
                maxLength={2}
                value={dobDay}
                onChangeText={setDobDay}
              />
              <TextInput
                style={[styles.dobInput, { flex: 1 }]}
                placeholder="MM"
                keyboardType="number-pad"
                maxLength={2}
                value={dobMonth}
                onChangeText={setDobMonth}
              />
              <TextInput
                style={[styles.dobInput, { flex: 2 }]}
                placeholder="YYYY"
                keyboardType="number-pad"
                maxLength={4}
                value={dobYear}
                onChangeText={setDobYear}
              />
            </View>
            <TouchableOpacity style={styles.nextBtn} onPress={handleAgeSubmit}>
              <Text style={styles.nextBtnText}>Continue →</Text>
            </TouchableOpacity>
            <Text style={styles.privacyNote}>Your date of birth is used only for age verification and is not stored.</Text>
          </ScrollView>
        )}

        {/* Age blocked screen */}
        {ageBlocked && (
          <View style={styles.blockedContainer}>
            <Text style={styles.blockedEmoji}>🔒</Text>
            <Text style={styles.blockedTitle}>Age Restriction</Text>
            <Text style={styles.blockedDesc}>
              Tropely is currently available for adults 18+.
            </Text>
          </View>
        )}

        {/* Step 2: Avatar picker */}
        {step === 2 && (
          <ScrollView contentContainerStyle={styles.content}>
            <Text style={styles.heading}>Choose your avatar</Text>
            <Text style={styles.sub}>This is how you'll appear to friends.</Text>
            <Text style={styles.sectionLabel}>Female Avatars</Text>
            <View style={styles.avatarGrid}>
              {AVATARS.female.map((a) => {
                const selected = selectedAvatar === a.id;
                return (
                  <TouchableOpacity
                    key={a.id}
                    style={[
                      styles.avatarBubble,
                      { backgroundColor: a.bg },
                      selected && styles.avatarBubbleSelected,
                    ]}
                    onPress={() => setSelectedAvatar(a.id)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.avatarEmoji}>{a.emoji}</Text>
                    <Text style={styles.avatarLabel} numberOfLines={2}>{a.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text style={[styles.sectionLabel, { marginTop: 16 }]}>Male Avatars</Text>
            <View style={styles.avatarGrid}>
              {AVATARS.male.map((a) => {
                const selected = selectedAvatar === a.id;
                return (
                  <TouchableOpacity
                    key={a.id}
                    style={[
                      styles.avatarBubble,
                      { backgroundColor: a.bg },
                      selected && styles.avatarBubbleSelected,
                    ]}
                    onPress={() => setSelectedAvatar(a.id)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.avatarEmoji}>{a.emoji}</Text>
                    <Text style={styles.avatarLabel} numberOfLines={2}>{a.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text style={[styles.sectionLabel, { marginTop: 16 }]}>Icons</Text>
            <View style={styles.avatarGrid}>
              {AVATARS.icons.map((a) => {
                const selected = selectedAvatar === a.id;
                return (
                  <TouchableOpacity
                    key={a.id}
                    style={[
                      styles.avatarBubble,
                      { backgroundColor: a.bg },
                      selected && styles.avatarBubbleSelected,
                    ]}
                    onPress={() => setSelectedAvatar(a.id)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.avatarEmoji}>{a.emoji}</Text>
                    <Text style={styles.avatarLabel} numberOfLines={2}>{a.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <TouchableOpacity style={[styles.nextBtn, { marginTop: 20 }]} onPress={next}>
              <Text style={styles.nextBtnText}>Continue →</Text>
            </TouchableOpacity>
          </ScrollView>
        )}

        {/* Steps 3-4: Tour slides */}
        {(step === 3 || step === 4) && (
          <View style={styles.tourContainer}>
            <View style={styles.tourSlide}>
              <Text style={styles.tourEmoji}>{TOUR_SLIDES[step - 3].emoji}</Text>
              <Text style={styles.tourTitle}>{TOUR_SLIDES[step - 3].title}</Text>
              <Text style={styles.tourDesc}>{TOUR_SLIDES[step - 3].desc}</Text>
            </View>
            <View style={styles.tourDots}>
              {[3, 4].map((s) => (
                <View key={s} style={[styles.tourDot, s === step && styles.tourDotActive]} />
              ))}
            </View>
            <TouchableOpacity style={styles.nextBtn} onPress={next}>
              <Text style={styles.nextBtnText}>{step === 4 ? "Got it →" : "Next →"}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={next}>
              <Text style={styles.skipLink}>Skip tour</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Step 5: Genre quiz */}
        {step === 5 && (
          <ScrollView contentContainerStyle={styles.content}>
            <Text style={styles.heading}>What do you love to read?</Text>
            <Text style={styles.sub}>Pick your favorite genres.</Text>
            <View style={styles.chipGrid}>
              {GENRES.map((g) => {
                const selected = genres.includes(g);
                return (
                  <TouchableOpacity
                    key={g}
                    style={[styles.chip, selected && styles.chipSelected]}
                    onPress={() => toggleGenre(g)}
                  >
                    <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{g}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <TouchableOpacity style={styles.nextBtn} onPress={next}>
              <Text style={styles.nextBtnText}>{genres.length > 0 ? "Continue →" : "Skip →"}</Text>
            </TouchableOpacity>
          </ScrollView>
        )}

        {/* Step 6: Trope quiz */}
        {step === 6 && (
          <ScrollView contentContainerStyle={styles.content}>
            <Text style={styles.heading}>Pick your favorite tropes</Text>
            <Text style={styles.sub}>
              {genres.length > 0 ? `Based on: ${genres.slice(0, 2).join(", ")}` : "Tell us what you love in a story."}
            </Text>
            {uniqueTropes.length > 0 ? (
              <View style={styles.chipGrid}>
                {uniqueTropes.map((t) => {
                  const selected = tropes.includes(t);
                  return (
                    <TouchableOpacity
                      key={t}
                      style={[styles.chip, selected && styles.chipSelected]}
                      onPress={() => toggleTrope(t)}
                    >
                      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{t}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <Text style={styles.sub}>No genres selected — feel free to skip!</Text>
            )}
            <TouchableOpacity style={styles.nextBtn} onPress={next}>
              <Text style={styles.nextBtnText}>{tropes.length > 0 ? "Continue →" : "Skip →"}</Text>
            </TouchableOpacity>
          </ScrollView>
        )}

        {/* Step 7: Result */}
        {step === 7 && (
          <ScrollView contentContainerStyle={[styles.content, { alignItems: "center" }]}>
            <View style={[styles.resultAvatar, { backgroundColor: currentAvatar.bg }]}>
              <Text style={styles.resultAvatarEmoji}>{currentAvatar.emoji}</Text>
            </View>
            <Text style={styles.resultVibeLabel}>Your Reading Vibe</Text>
            <Text style={styles.resultVibe}>{vibe}</Text>
            {genres.length > 0 && (
              <View style={styles.resultTags}>
                {genres.slice(0, 3).map((g) => (
                  <View key={g} style={styles.resultTag}>
                    <Text style={styles.resultTagText}>{g}</Text>
                  </View>
                ))}
                {tropes.slice(0, 3).map((t) => (
                  <View key={t} style={[styles.resultTag, { backgroundColor: "rgba(167,139,250,0.15)" }]}>
                    <Text style={[styles.resultTagText, { color: COLORS.lavender }]}>{t}</Text>
                  </View>
                ))}
              </View>
            )}
            <TouchableOpacity style={[styles.nextBtn, { marginTop: 24, width: "100%" }]} onPress={finish}>
              <Text style={styles.nextBtnText}>Start reading ✨</Text>
            </TouchableOpacity>
          </ScrollView>
        )}

        {/* Back button (except step 0) */}
        {step > 0 && !ageBlocked && (
          <TouchableOpacity style={styles.backBtn} onPress={prev}>
            <Text style={styles.backBtnText}>← Back</Text>
          </TouchableOpacity>
        )}
      </SafeAreaView>
    </GradientView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  dots: { flexDirection: "row", gap: 6, justifyContent: "center", paddingTop: 16 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "rgba(26,26,26,0.2)" },
  dotActive: { backgroundColor: COLORS.lavender, width: 20 },
  content: { padding: 24, paddingBottom: 60, gap: 18 },
  bigEmoji: { fontSize: 56, textAlign: "center", marginBottom: 8 },
  heading: { fontSize: 28, fontWeight: "800", color: COLORS.ink, lineHeight: 36, textAlign: "center" },
  sub: { fontSize: 15, color: COLORS.inkMid, textAlign: "center", lineHeight: 22 },
  featureList: { gap: 10, backgroundColor: "rgba(255,255,255,0.5)", borderRadius: 16, padding: 16 },
  featureRow: { flexDirection: "row", gap: 10, alignItems: "center" },
  featureCheck: { fontSize: 16, color: COLORS.lavender, fontWeight: "700" },
  featureText: { fontSize: 14, color: COLORS.ink, fontWeight: "500" },
  nextBtn: { backgroundColor: COLORS.ink, borderRadius: 14, paddingVertical: 16, alignItems: "center" },
  nextBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  dobRow: { flexDirection: "row", gap: 10 },
  dobInput: {
    borderWidth: 1, borderColor: "rgba(26,26,26,0.15)",
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 18, fontWeight: "600", color: COLORS.ink,
    backgroundColor: "rgba(255,255,255,0.7)", textAlign: "center",
  },
  privacyNote: { fontSize: 11, color: COLORS.inkSoft, textAlign: "center", lineHeight: 16 },
  blockedContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: 40, gap: 16 },
  blockedEmoji: { fontSize: 64 },
  blockedTitle: { fontSize: 24, fontWeight: "800", color: COLORS.ink },
  blockedDesc: { fontSize: 15, color: COLORS.inkMid, textAlign: "center", lineHeight: 22 },
  sectionLabel: { fontSize: 12, fontWeight: "700", color: COLORS.inkSoft, letterSpacing: 0.8, textTransform: "uppercase" },
  avatarGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  avatarBubble: {
    width: 80,
    borderRadius: 16,
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 6,
    gap: 4,
  },
  avatarBubbleSelected: {
    borderWidth: 3,
    borderColor: COLORS.lavender,
    shadowColor: COLORS.lavender,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  avatarEmoji: { fontSize: 32 },
  avatarLabel: { fontSize: 9, fontWeight: "600", color: COLORS.inkMid, textAlign: "center" },
  tourContainer: { flex: 1, justifyContent: "center", padding: 32, gap: 20 },
  tourSlide: { alignItems: "center", gap: 12 },
  tourEmoji: { fontSize: 64 },
  tourTitle: { fontSize: 24, fontWeight: "800", color: COLORS.ink, textAlign: "center" },
  tourDesc: { fontSize: 15, color: COLORS.inkMid, textAlign: "center", lineHeight: 22 },
  tourDots: { flexDirection: "row", gap: 6, justifyContent: "center" },
  tourDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "rgba(26,26,26,0.2)" },
  tourDotActive: { backgroundColor: COLORS.lavender, width: 20 },
  skipLink: { fontSize: 14, color: COLORS.inkSoft, textAlign: "center", fontWeight: "500" },
  chipGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.6)", borderWidth: 1,
    borderColor: "rgba(26,26,26,0.1)",
  },
  chipSelected: { backgroundColor: COLORS.lavender, borderColor: COLORS.lavender },
  chipText: { fontSize: 13, fontWeight: "500", color: COLORS.inkMid },
  chipTextSelected: { color: "#fff" },
  resultAvatar: {
    width: 100, height: 100, borderRadius: 50,
    justifyContent: "center", alignItems: "center",
    borderWidth: 3, borderColor: COLORS.lavender,
    shadowColor: COLORS.lavender, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
  },
  resultAvatarEmoji: { fontSize: 48 },
  resultVibeLabel: { fontSize: 12, fontWeight: "700", color: COLORS.inkSoft, letterSpacing: 1, textTransform: "uppercase" },
  resultVibe: { fontSize: 26, fontWeight: "800", color: COLORS.ink, textAlign: "center" },
  resultTags: { flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center" },
  resultTag: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: "rgba(26,26,26,0.07)" },
  resultTagText: { fontSize: 12, fontWeight: "600", color: COLORS.inkMid },
  backBtn: { position: "absolute", top: 56, left: 20, paddingVertical: 8, paddingHorizontal: 12 },
  backBtnText: { fontSize: 14, color: COLORS.inkSoft, fontWeight: "600" },
});
