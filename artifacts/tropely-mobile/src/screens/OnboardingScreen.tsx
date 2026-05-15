import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  Share,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/navigation";
import { useStore } from "@/store";
import { searchBooks, olCoverUrl, type OLBook } from "@/lib/api";
import { TROPES_BY_GENRE, GENRE_ORDER, type TropeGenre } from "@/constants/tropes";
import { trackEvent } from "@/lib/analytics";

type Nav = NativeStackNavigationProp<RootStackParamList>;

// Starter books by genre for the "Suggested for you" step
const GENRE_STARTER_BOOKS: Record<string, { title: string; author: string; coverUrl: string; tropes: string[] }[]> = {
  "Romance": [
    { title: "Fourth Wing", author: "Rebecca Yarros", coverUrl: "https://covers.openlibrary.org/b/id/14526835-M.jpg", tropes: ["enemies-to-lovers", "slow burn"] },
    { title: "The Hating Game", author: "Sally Thorne", coverUrl: "https://covers.openlibrary.org/b/id/8228877-M.jpg", tropes: ["enemies-to-lovers", "office romance"] },
    { title: "Beach Read", author: "Emily Henry", coverUrl: "https://covers.openlibrary.org/b/id/10521797-M.jpg", tropes: ["rivals to lovers", "forced proximity"] },
  ],
  "Fantasy": [
    { title: "The Name of the Wind", author: "Patrick Rothfuss", coverUrl: "https://covers.openlibrary.org/b/id/8406786-M.jpg", tropes: ["chosen one", "mentor figure"] },
    { title: "Six of Crows", author: "Leigh Bardugo", coverUrl: "https://covers.openlibrary.org/b/id/8739161-M.jpg", tropes: ["heist", "found family"] },
    { title: "The Final Empire", author: "Brandon Sanderson", coverUrl: "https://covers.openlibrary.org/b/id/7892090-M.jpg", tropes: ["heist", "anti-hero"] },
  ],
  "Thriller & Mystery": [
    { title: "Gone Girl", author: "Gillian Flynn", coverUrl: "https://covers.openlibrary.org/b/id/7898938-M.jpg", tropes: ["unreliable narrator", "psychological thriller"] },
    { title: "The Girl with the Dragon Tattoo", author: "Stieg Larsson", coverUrl: "https://covers.openlibrary.org/b/id/6898609-M.jpg", tropes: ["mystery", "conspiracy"] },
  ],
  "Science Fiction": [
    { title: "The Martian", author: "Andy Weir", coverUrl: "https://covers.openlibrary.org/b/id/7891799-M.jpg", tropes: ["survival horror", "near future"] },
    { title: "Dune", author: "Frank Herbert", coverUrl: "https://covers.openlibrary.org/b/id/8225261-M.jpg", tropes: ["chosen one", "political intrigue"] },
  ],
  "Young Adult": [
    { title: "The Hunger Games", author: "Suzanne Collins", coverUrl: "https://covers.openlibrary.org/b/id/8228878-M.jpg", tropes: ["chosen one", "dystopia"] },
    { title: "Six of Crows", author: "Leigh Bardugo", coverUrl: "https://covers.openlibrary.org/b/id/8739161-M.jpg", tropes: ["heist", "found family"] },
  ],
  "Horror": [
    { title: "The Shining", author: "Stephen King", coverUrl: "https://covers.openlibrary.org/b/id/7984916-M.jpg", tropes: ["haunted house", "psychological horror"] },
  ],
  "Historical": [
    { title: "The Name of the Rose", author: "Umberto Eco", coverUrl: "https://covers.openlibrary.org/b/id/8406788-M.jpg", tropes: ["historical mystery", "court intrigue"] },
  ],
  "Literary & Contemporary": [
    { title: "Normal People", author: "Sally Rooney", coverUrl: "https://covers.openlibrary.org/b/id/9253396-M.jpg", tropes: ["slow burn", "coming of age"] },
  ],
};

const GOAL_PRESETS = [15, 20, 30, 45, 60];
const STEP_COUNT = 5; // 0=welcome, 1=tropes, 2=suggested, 3=search, 4=goal

export default function OnboardingScreen() {
  const nav = useNavigation<Nav>();
  const { addBook, setHasOnboarded, setPreferredTropes, setDailyGoalMinutes, dailyGoalMinutes } = useStore();

  const [step, setStep] = useState(0);
  const [selectedTropes, setSelectedTropes] = useState<string[]>([]);
  const [tropeGenre, setTropeGenre] = useState<TropeGenre>(GENRE_ORDER[0]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<OLBook[]>([]);
  const [loading, setLoading] = useState(false);
  const [addedBooks, setAddedBooks] = useState<Set<string>>(new Set());
  const [goalMinutes, setGoalMinutes] = useState(dailyGoalMinutes);

  const toggleTrope = (t: string) => {
    setSelectedTropes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : prev.length < 10 ? [...prev, t] : prev,
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
    if (addedBooks.has(book.title)) return;
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
    setAddedBooks((prev) => new Set([...prev, book.title]));
  };

  const handleAddStarterBook = (b: { title: string; author: string; coverUrl: string; tropes: string[] }) => {
    if (addedBooks.has(b.title)) return;
    addBook({
      title: b.title,
      author: b.author,
      pages: 300,
      progress: 0,
      shelf: "reading",
      cover: b.coverUrl,
      tropes: b.tropes,
    });
    setAddedBooks((prev) => new Set([...prev, b.title]));
  };

  // Suggested books: unique titles from selected trope genres
  const suggestedBooks = React.useMemo(() => {
    const selectedGenres = GENRE_ORDER.filter((g) =>
      TROPES_BY_GENRE[g].some((t) => selectedTropes.includes(t))
    );
    const seen = new Set<string>();
    const books: { title: string; author: string; coverUrl: string; tropes: string[] }[] = [];
    for (const genre of selectedGenres) {
      for (const book of (GENRE_STARTER_BOOKS[genre] ?? [])) {
        if (!seen.has(book.title)) {
          seen.add(book.title);
          books.push(book);
        }
      }
    }
    return books.slice(0, 4);
  }, [selectedTropes]);

  const finish = () => {
    setPreferredTropes(selectedTropes);
    setDailyGoalMinutes(goalMinutes);
    setHasOnboarded(true);
    trackEvent("Onboarding Completed", { tropes: selectedTropes, goalMinutes });
    nav.reset({ index: 0, routes: [{ name: "Tabs" }] });
  };

  const sharePersonality = async () => {
    const genre = GENRE_ORDER.find((g) =>
      TROPES_BY_GENRE[g].some((t) => selectedTropes.includes(t))
    ) ?? "Fiction";
    const [t1, t2] = selectedTropes;
    const tropeStr = t2 ? `${t1} and ${t2}` : t1 ?? "great stories";
    try {
      await Share.share({
        message: `I just joined Tropely and apparently I'm a ${genre} reader who lives for ${tropeStr} ✨ tropely.app`,
      });
    } catch {}
  };

  // Step backgrounds
  const BG_COLORS = ["#fce7f3", "#fafaf9", "#f0fdf4", "#fffbeb", "#fafaf9"];
  const bgColor = BG_COLORS[step] ?? "#fafaf9";

  const topGenre = GENRE_ORDER.find((g) =>
    TROPES_BY_GENRE[g].some((t) => selectedTropes.includes(t))
  ) ?? "Fiction";
  const [t1, t2] = selectedTropes;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bgColor }]} edges={["top", "bottom"]}>
      {/* Progress dots */}
      <View style={styles.dots}>
        {Array.from({ length: STEP_COUNT }).map((_, i) => (
          <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
        ))}
      </View>

      {/* Step 0 — Welcome */}
      {step === 0 && (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.welcomeTop}>
            <Text style={styles.wordmark}>Tropely</Text>
            <Text style={styles.tagline}>Read by trope, not just title.</Text>
            <Text style={styles.welcomeSub}>
              Track what you read by vibe, mood, and the tropes that make you obsessed.
            </Text>
          </View>
          <TouchableOpacity style={styles.nextBtn} onPress={() => setStep(1)}>
            <Text style={styles.nextBtnText}>Let's go →</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* Step 1 — Trope selection */}
      {step === 1 && (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.heading}>Pick the tropes{"\n"}you love</Text>
          <Text style={styles.sub}>Up to 10 — we'll shape your whole experience around these.</Text>

          {/* Genre tabs */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.genreTabsScroll}>
            {GENRE_ORDER.map((g) => (
              <TouchableOpacity
                key={g}
                style={[styles.genreTab, tropeGenre === g && styles.genreTabActive]}
                onPress={() => setTropeGenre(g)}
              >
                <Text style={[styles.genreTabText, tropeGenre === g && styles.genreTabTextActive]}>
                  {g}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.tropeGrid}>
            {TROPES_BY_GENRE[tropeGenre].map((t) => {
              const selected = selectedTropes.includes(t);
              const locked = !selected && selectedTropes.length >= 10;
              return (
                <TouchableOpacity
                  key={t}
                  style={[styles.tropeChip, selected && styles.tropeChipSelected, locked && styles.tropeChipLocked]}
                  onPress={() => !locked && toggleTrope(t)}
                >
                  <Text style={[styles.tropeChipText, selected && styles.tropeChipTextSelected]}>{t}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.tropeCounter}>
            {selectedTropes.length} / 10 selected
          </Text>

          <TouchableOpacity
            style={[styles.nextBtn, selectedTropes.length === 0 && styles.nextBtnDisabled]}
            onPress={() => setStep(2)}
            disabled={selectedTropes.length === 0}
          >
            <Text style={styles.nextBtnText}>Continue →</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* Step 2 — Suggested books */}
      {step === 2 && (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.heading}>Suggested for you</Text>
          <Text style={styles.sub}>Based on your tropes — tap + to add any to your shelf.</Text>

          {suggestedBooks.length > 0 ? (
            suggestedBooks.map((b) => {
              const added = addedBooks.has(b.title);
              return (
                <View key={b.title} style={styles.suggestedRow}>
                  <Image source={{ uri: b.coverUrl }} style={styles.suggestedCover} />
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={styles.suggestedTitle} numberOfLines={1}>{b.title}</Text>
                    <Text style={styles.suggestedAuthor}>{b.author}</Text>
                    <View style={styles.suggestedTropes}>
                      {b.tropes.map((t) => (
                        <View key={t} style={styles.tropePill}>
                          <Text style={styles.tropePillText}>{t}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[styles.addBtn, added && styles.addBtnDone]}
                    onPress={() => handleAddStarterBook(b)}
                  >
                    <Text style={styles.addBtnText}>{added ? "✓" : "+"}</Text>
                  </TouchableOpacity>
                </View>
              );
            })
          ) : (
            <Text style={styles.sub}>No suggestions for your tropes yet — you can search next!</Text>
          )}

          <TouchableOpacity style={styles.nextBtn} onPress={() => setStep(3)}>
            <Text style={styles.nextBtnText}>{addedBooks.size > 0 ? "Continue →" : "Skip →"}</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* Step 3 — Search for first book */}
      {step === 3 && (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.heading}>Add your current{"\n"}read</Text>
          <Text style={styles.sub}>Search for any book you're reading right now.</Text>

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
              const added = addedBooks.has(book.title);
              return (
                <TouchableOpacity
                  key={book.key}
                  style={[styles.resultRow, added && styles.resultRowDone]}
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
                  <Text style={[styles.addIcon, added && styles.addIconDone]}>{added ? "✓" : "+"}</Text>
                </TouchableOpacity>
              );
            })
          )}

          <TouchableOpacity style={[styles.nextBtn, { marginTop: 16 }]} onPress={() => setStep(4)}>
            <Text style={styles.nextBtnText}>Continue →</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* Step 4 — Goal + personality card + finish */}
      {step === 4 && (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.heading}>Daily reading goal</Text>
          <Text style={styles.sub}>How long do you want to read each day?</Text>
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

          {/* Reading personality card */}
          <View style={styles.personalityCard}>
            <Text style={styles.personalityLabel}>YOUR READING PERSONALITY</Text>
            <Text style={styles.personalityText}>
              You're a{" "}
              <Text style={styles.personalityBold}>{topGenre}</Text>
              {" "}reader who lives for{" "}
              <Text style={styles.personalityBold}>
                {t2 ? `${t1} and ${t2}` : t1 ?? "great stories"}
              </Text>
              {" "}✨
            </Text>
            <TouchableOpacity style={styles.sharePersonalityBtn} onPress={sharePersonality}>
              <Text style={styles.sharePersonalityBtnText}>Share your reading personality →</Text>
            </TouchableOpacity>
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
  // Welcome step
  welcomeTop: { alignItems: "center", paddingTop: 32, gap: 12 },
  wordmark: { fontSize: 42, fontWeight: "800", color: "#1a1a1a", letterSpacing: -1 },
  tagline: { fontSize: 22, fontWeight: "700", color: "#1a1a1a", textAlign: "center" },
  welcomeSub: { fontSize: 15, color: "#6b7280", textAlign: "center", lineHeight: 22, paddingHorizontal: 8 },
  heading: { fontSize: 30, fontWeight: "800", color: "#1a1a1a", lineHeight: 38 },
  sub: { fontSize: 15, color: "#6b7280", marginTop: -8, lineHeight: 22 },
  // Genre tabs
  genreTabsScroll: { flexGrow: 0 },
  genreTab: { marginRight: 8, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: "rgba(26,26,26,0.15)", backgroundColor: "rgba(255,255,255,0.7)" },
  genreTabActive: { backgroundColor: "#1a1a1a", borderColor: "#1a1a1a" },
  genreTabText: { fontSize: 13, fontWeight: "500", color: "#374151" },
  genreTabTextActive: { color: "#fff", fontWeight: "700" },
  // Trope grid
  tropeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  tropeChip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.7)", borderWidth: 1, borderColor: "rgba(26,26,26,0.1)" },
  tropeChipSelected: { backgroundColor: "#1a1a1a", borderColor: "#1a1a1a" },
  tropeChipLocked: { opacity: 0.4 },
  tropeChipText: { fontSize: 13, fontWeight: "500", color: "#374151" },
  tropeChipTextSelected: { color: "#fff" },
  tropeCounter: { fontSize: 13, color: "#9ca3af", textAlign: "center", marginTop: -8 },
  // Suggested books
  suggestedRow: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "rgba(255,255,255,0.9)", borderRadius: 12, padding: 12 },
  suggestedCover: { width: 52, height: 76, borderRadius: 6 },
  suggestedTitle: { fontSize: 14, fontWeight: "600", color: "#1a1a1a" },
  suggestedAuthor: { fontSize: 12, color: "#6b7280" },
  suggestedTropes: { flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 2 },
  tropePill: { backgroundColor: "#f3f4f6", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  tropePillText: { fontSize: 10, color: "#6b7280" },
  addBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#1a1a1a", alignItems: "center", justifyContent: "center" },
  addBtnDone: { backgroundColor: "#059669" },
  addBtnText: { color: "#fff", fontSize: 18, fontWeight: "700", lineHeight: 20 },
  // Search step
  nextBtn: { backgroundColor: "#1a1a1a", borderRadius: 14, paddingVertical: 16, alignItems: "center", marginTop: 8 },
  nextBtnDisabled: { opacity: 0.4 },
  nextBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  searchRow: { flexDirection: "row", gap: 8 },
  searchInput: { flex: 1, borderWidth: 1, borderColor: "rgba(26,26,26,0.15)", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, backgroundColor: "rgba(255,255,255,0.8)" },
  searchBtn: { backgroundColor: "#1a1a1a", borderRadius: 12, paddingHorizontal: 18, justifyContent: "center" },
  searchBtnText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  resultRow: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "rgba(255,255,255,0.8)", borderRadius: 12, padding: 12 },
  resultRowDone: { opacity: 0.6 },
  resultCover: { width: 40, height: 58, borderRadius: 5 },
  coverPlaceholder: { backgroundColor: "#e5e7eb" },
  resultTitle: { fontSize: 14, fontWeight: "600", color: "#1a1a1a" },
  resultAuthor: { fontSize: 12, color: "#6b7280", marginTop: 2 },
  addIcon: { fontSize: 22, color: "#1a1a1a", fontWeight: "700" },
  addIconDone: { color: "#059669" },
  // Goal step
  goalRow: { flexDirection: "row", flexWrap: "wrap", gap: 12, justifyContent: "center" },
  goalBtn: { width: 80, paddingVertical: 18, borderRadius: 14, borderWidth: 1, borderColor: "rgba(26,26,26,0.15)", backgroundColor: "rgba(255,255,255,0.7)", alignItems: "center" },
  goalBtnActive: { backgroundColor: "#1a1a1a", borderColor: "#1a1a1a" },
  goalBtnText: { fontSize: 18, fontWeight: "700", color: "#6b7280" },
  goalBtnTextActive: { color: "#fff" },
  // Personality card
  personalityCard: { backgroundColor: "#fff", borderRadius: 16, padding: 20, gap: 12, borderWidth: 1, borderColor: "#fde68a" },
  personalityLabel: { fontSize: 10, fontWeight: "700", color: "#9ca3af", letterSpacing: 1 },
  personalityText: { fontSize: 17, color: "#1a1a1a", lineHeight: 26 },
  personalityBold: { fontWeight: "700" },
  sharePersonalityBtn: { borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, paddingVertical: 10, alignItems: "center", marginTop: 4 },
  sharePersonalityBtnText: { fontSize: 13, fontWeight: "600", color: "#6b7280" },
});
