import React, { useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  FlatList,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/navigation";
import { useStore } from "@/store";
import { searchBooks, olCoverUrl, type OLBook } from "@/lib/api";

type Nav = NativeStackNavigationProp<RootStackParamList>;

const COMMON_TROPES = [
  "enemies-to-lovers", "found family", "slow burn", "fake dating",
  "chosen one", "redemption arc", "heist", "second chance",
  "forbidden love", "magical realism", "unreliable narrator", "coming of age",
  "portal fantasy", "love triangle", "rivals to lovers", "time loop",
  "dark academia", "anti-hero", "quest", "mentor figure",
];

const MOOD_BG = ["#fce7f3", "#d1fae5", "#e0e7ff", "#fef9c3", "#fff7ed"];

export default function OnboardingScreen() {
  const nav = useNavigation<Nav>();
  const { addBook, setHasOnboarded, setPreferredTropes, setDailyGoalMinutes, dailyGoalMinutes } = useStore();

  const [step, setStep] = useState(0);
  const [selectedTropes, setSelectedTropes] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<OLBook[]>([]);
  const [loading, setLoading] = useState(false);
  const [addedBook, setAddedBook] = useState<string | null>(null);
  const [goalMinutes, setGoalMinutes] = useState(dailyGoalMinutes);

  const bgColor = MOOD_BG[step % MOOD_BG.length];

  const toggleTrope = (t: string) => {
    setSelectedTropes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : prev.length < 3 ? [...prev, t] : prev,
    );
  };

  const doSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const data = await searchBooks(query);
      setResults(data);
    } catch {
      Alert.alert("Search failed", "Check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddBook = (book: OLBook) => {
    const cover = book.cover_i ? olCoverUrl(book.cover_i, "M") : undefined;
    addBook({
      title: book.title,
      author: book.author_name?.[0] ?? "Unknown",
      pages: book.number_of_pages_median ?? 300,
      progress: 0,
      shelf: "reading",
      cover,
      openLibraryKey: book.key,
    });
    setAddedBook(book.title);
    setResults([]);
  };

  const finish = () => {
    setPreferredTropes(selectedTropes);
    setDailyGoalMinutes(goalMinutes);
    setHasOnboarded(true);
    nav.reset({ index: 0, routes: [{ name: "Tabs" }] });
  };

  const GOAL_PRESETS = [15, 20, 30, 45, 60];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bgColor }]} edges={["top", "bottom"]}>
      {/* Step dots */}
      <View style={styles.dots}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
        ))}
      </View>

      {step === 0 && (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.heading}>Pick up to 3 tropes{"\n"}you love</Text>
          <Text style={styles.sub}>We'll use these to shape your whole experience.</Text>
          <View style={styles.tropeGrid}>
            {COMMON_TROPES.map((t) => {
              const selected = selectedTropes.includes(t);
              return (
                <TouchableOpacity
                  key={t}
                  style={[styles.tropeChip, selected && styles.tropeChipSelected]}
                  onPress={() => toggleTrope(t)}
                >
                  <Text style={[styles.tropeChipText, selected && styles.tropeChipTextSelected]}>
                    {t}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <TouchableOpacity
            style={[styles.nextBtn, selectedTropes.length === 0 && styles.nextBtnDisabled]}
            onPress={() => setStep(1)}
            disabled={selectedTropes.length === 0}
          >
            <Text style={styles.nextBtnText}>Continue →</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {step === 1 && (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.heading}>Add your first{"\n"}current read</Text>
          <Text style={styles.sub}>Search for a book you're reading right now.</Text>

          {addedBook ? (
            <View style={styles.addedCard}>
              <Text style={styles.addedText}>✓ Added "{addedBook}" to your shelf</Text>
            </View>
          ) : (
            <>
              <View style={styles.searchRow}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search by title or author…"
                  value={query}
                  onChangeText={setQuery}
                  returnKeyType="search"
                  onSubmitEditing={doSearch}
                />
                <TouchableOpacity style={styles.searchBtn} onPress={doSearch}>
                  <Text style={styles.searchBtnText}>Go</Text>
                </TouchableOpacity>
              </View>
              {loading ? (
                <ActivityIndicator style={{ marginTop: 24 }} />
              ) : (
                results.slice(0, 5).map((book) => {
                  const cover = book.cover_i ? olCoverUrl(book.cover_i, "S") : null;
                  return (
                    <TouchableOpacity
                      key={book.key}
                      style={styles.resultRow}
                      onPress={() => handleAddBook(book)}
                    >
                      {cover ? (
                        <Image source={{ uri: cover }} style={styles.resultCover} />
                      ) : (
                        <View style={[styles.resultCover, styles.coverPlaceholder]} />
                      )}
                      <View style={{ flex: 1 }}>
                        <Text style={styles.resultTitle} numberOfLines={1}>{book.title}</Text>
                        <Text style={styles.resultAuthor} numberOfLines={1}>
                          {book.author_name?.[0] ?? "Unknown"}
                        </Text>
                      </View>
                      <Text style={styles.addIcon}>+</Text>
                    </TouchableOpacity>
                  );
                })
              )}
            </>
          )}

          <View style={styles.stepBtns}>
            <TouchableOpacity style={styles.skipBtn} onPress={() => setStep(2)}>
              <Text style={styles.skipBtnText}>{addedBook ? "Continue →" : "Skip for now"}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {step === 2 && (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.heading}>How long do you want{"\n"}to read each day?</Text>
          <Text style={styles.sub}>We'll track your progress toward this goal.</Text>
          <View style={styles.goalRow}>
            {GOAL_PRESETS.map((n) => (
              <TouchableOpacity
                key={n}
                style={[styles.goalBtn, goalMinutes === n && styles.goalBtnActive]}
                onPress={() => setGoalMinutes(n)}
              >
                <Text style={[styles.goalBtnText, goalMinutes === n && styles.goalBtnTextActive]}>
                  {n}m
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={styles.nextBtn} onPress={finish}>
            <Text style={styles.nextBtnText}>Start reading →</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  dots: { flexDirection: "row", justifyContent: "center", gap: 8, paddingTop: 16, paddingBottom: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "rgba(26,26,26,0.2)" },
  dotActive: { backgroundColor: "#1a1a1a", width: 20 },
  content: { padding: 24, paddingBottom: 48, gap: 20 },
  heading: { fontSize: 30, fontWeight: "800", color: "#1a1a1a", lineHeight: 38 },
  sub: { fontSize: 15, color: "#6b7280", marginTop: -8 },
  tropeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  tropeChip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.7)", borderWidth: 1, borderColor: "rgba(26,26,26,0.1)" },
  tropeChipSelected: { backgroundColor: "#1a1a1a", borderColor: "#1a1a1a" },
  tropeChipText: { fontSize: 13, fontWeight: "500", color: "#374151" },
  tropeChipTextSelected: { color: "#fff" },
  nextBtn: { backgroundColor: "#1a1a1a", borderRadius: 14, paddingVertical: 16, alignItems: "center", marginTop: 8 },
  nextBtnDisabled: { opacity: 0.4 },
  nextBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  searchRow: { flexDirection: "row", gap: 8 },
  searchInput: { flex: 1, borderWidth: 1, borderColor: "rgba(26,26,26,0.15)", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, backgroundColor: "rgba(255,255,255,0.8)" },
  searchBtn: { backgroundColor: "#1a1a1a", borderRadius: 12, paddingHorizontal: 18, justifyContent: "center" },
  searchBtnText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  resultRow: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "rgba(255,255,255,0.8)", borderRadius: 12, padding: 12 },
  resultCover: { width: 40, height: 58, borderRadius: 5 },
  coverPlaceholder: { backgroundColor: "#e5e7eb" },
  resultTitle: { fontSize: 14, fontWeight: "600", color: "#1a1a1a" },
  resultAuthor: { fontSize: 12, color: "#6b7280", marginTop: 2 },
  addIcon: { fontSize: 22, color: "#1a1a1a", fontWeight: "700" },
  addedCard: { backgroundColor: "rgba(255,255,255,0.9)", borderRadius: 12, padding: 16, alignItems: "center" },
  addedText: { fontSize: 14, fontWeight: "600", color: "#059669" },
  stepBtns: { flexDirection: "row", justifyContent: "flex-end", marginTop: 8 },
  skipBtn: { paddingVertical: 12, paddingHorizontal: 20 },
  skipBtnText: { fontSize: 15, color: "#6b7280", fontWeight: "600" },
  goalRow: { flexDirection: "row", flexWrap: "wrap", gap: 12, justifyContent: "center" },
  goalBtn: { width: 80, paddingVertical: 18, borderRadius: 14, borderWidth: 1, borderColor: "rgba(26,26,26,0.15)", backgroundColor: "rgba(255,255,255,0.7)", alignItems: "center" },
  goalBtnActive: { backgroundColor: "#1a1a1a", borderColor: "#1a1a1a" },
  goalBtnText: { fontSize: 18, fontWeight: "700", color: "#6b7280" },
  goalBtnTextActive: { color: "#fff" },
});
