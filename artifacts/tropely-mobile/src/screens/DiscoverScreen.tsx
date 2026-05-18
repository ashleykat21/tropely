import React, { useState, useRef, useMemo, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ScrollView,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/navigation";
import { useStore } from "@/store";
import { searchBooks, olCoverUrl, moodTagBooks, type OLBook } from "@/lib/api";
import { trackEvent } from "@/lib/analytics";
import { GradientView } from "@/components/GradientView";
import { AtmosphereDecor } from "@/components/AtmosphereDecor";
import { COLORS } from "@/constants/theme";
import { useAtmosphere, useAtmosphereKey } from "@/hooks/useAtmosphere";

type Nav = NativeStackNavigationProp<RootStackParamList>;

const TROPE_BANNER_MS = 10_000;

const MOOD_PICKS = [
  { mood: "Cozy & Romantic", emoji: "🌸", count: "142 books" },
  { mood: "Mysterious & Dark", emoji: "🌙", count: "98 books" },
  { mood: "Fantasy & Magical", emoji: "✨", count: "203 books" },
  { mood: "Emotional & Heartfelt", emoji: "💙", count: "87 books" },
  { mood: "Light & Fun", emoji: "☀️", count: "156 books" },
];

const TROPE_PICKS = [
  "Enemies to Lovers", "Slow Burn", "Found Family", "Forced Proximity",
  "Second Chance", "Dark Romance", "Grumpy/Sunshine", "Fake Dating",
];
const DEBOUNCE_MS = 500;

// Per-item animated add button so each item manages its own scale animation
function AddButton({ alreadyAdded, onPress }: { alreadyAdded: boolean; onPress: () => void }) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    if (alreadyAdded) return;
    Animated.sequence([
      Animated.timing(scale, { toValue: 1.35, duration: 120, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
    onPress();
  };

  return (
    <TouchableOpacity onPress={handlePress} disabled={alreadyAdded}>
      <Animated.View
        style={[
          styles.addBtn,
          alreadyAdded && styles.addBtnDisabled,
          { transform: [{ scale }] },
        ]}
      >
        <Text style={styles.addBtnText}>{alreadyAdded ? "✓" : "+"}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function DiscoverScreen() {
  const addBook = useStore((s) => s.addBook);
  const updateBook = useStore((s) => s.updateBook);
  const books = useStore((s) => s.books);
  const inbox = useStore((s) => s.inbox);
  const nav = useNavigation<Nav>();
  const unreadCount = inbox.filter((i) => !i.read).length;
  const atmosphere = useAtmosphere();
  const atmosphereKey = useAtmosphereKey();
  const textColor = atmosphere.isDark ? "#ffffff" : COLORS.ink;
  const textColorSoft = atmosphere.isDark ? "rgba(255,255,255,0.6)" : COLORS.inkSoft;

  const addedKeys = useMemo(
    () => new Set(books.flatMap((b) => [b.openLibraryKey, b.title].filter(Boolean) as string[])),
    [books],
  );

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<OLBook[]>([]);
  const [loading, setLoading] = useState(false);

  // Trope banner — interaction flag prevents auto-dismiss while user acts
  const [tropeBanner, setTropeBanner] = useState<{
    bookId: string;
    title: string;
    tropes: string[];
    selected: string[];
    interacting: boolean;
  } | null>(null);
  const bannerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce timer for search
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    try {
      const data = await searchBooks(q);
      setResults(data);
    } catch {
      Alert.alert("Search failed", "Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  const onQueryChange = (text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(text), DEBOUNCE_MS);
  };

  const startBannerTimer = () => {
    if (bannerTimer.current) clearTimeout(bannerTimer.current);
    bannerTimer.current = setTimeout(() => {
      setTropeBanner((prev) => {
        if (prev?.interacting) return prev;
        return null;
      });
    }, TROPE_BANNER_MS);
  };

  const handleAdd = async (book: OLBook) => {
    const cover = book.cover_i ? olCoverUrl(book.cover_i, "M") : undefined;
    const id = addBook({
      title: book.title,
      author: book.author_name?.[0] ?? "Unknown",
      pages: book.number_of_pages_median ?? 300,
      progress: 0,
      shelf: "reading",
      cover,
      openLibraryKey: book.key,
    });
    trackEvent("Book Added", { title: book.title, hasCover: !!cover });

    moodTagBooks([{ key: book.key, title: book.title }])
      .then((tagMap) => {
        const tropes = tagMap[book.key] ?? [];
        if (tropes.length === 0) return;
        setTropeBanner({ bookId: id, title: book.title, tropes, selected: [], interacting: false });
        startBannerTimer();
      })
      .catch((err) => {
        console.warn("[DiscoverScreen] moodTagBooks failed:", err);
      });
  };

  const confirmTropes = () => {
    if (!tropeBanner) return;
    if (tropeBanner.selected.length > 0) {
      updateBook(tropeBanner.bookId, { tropes: tropeBanner.selected });
    }
    if (bannerTimer.current) clearTimeout(bannerTimer.current);
    setTropeBanner(null);
  };

  const toggleTrope = (t: string) => {
    setTropeBanner((prev) => {
      if (!prev) return null;
      const selected = prev.selected.includes(t)
        ? prev.selected.filter((s) => s !== t)
        : [...prev.selected, t];
      return { ...prev, selected, interacting: true };
    });
    // Restart timer now that user has interacted
    startBannerTimer();
  };

  return (
    <GradientView colors={atmosphere.gradient} style={{ flex: 1 }}>
      <AtmosphereDecor atmosphere={atmosphereKey} />
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.discoverHeader}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.discoverTitle, { color: textColor }]}>Discover</Text>
          <Text style={[styles.discoverSub, { color: textColorSoft }]}>What kind of story are you craving?</Text>
        </View>
        <TouchableOpacity style={styles.inboxBtn} onPress={() => nav.navigate("Inbox")} activeOpacity={0.8}>
          <Text style={styles.inboxEmoji}>💬</Text>
          {unreadCount > 0 && (
            <View style={styles.inboxBadge}>
              <Text style={styles.inboxBadgeText}>{unreadCount > 9 ? "9+" : unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
      <View style={styles.searchBar}>
        <TextInput
          style={styles.input}
          placeholder="Search books by title or author…"
          value={query}
          onChangeText={onQueryChange}
          returnKeyType="search"
          onSubmitEditing={() => doSearch(query)}
        />
        <TouchableOpacity style={styles.searchBtn} onPress={() => doSearch(query)}>
          <Text style={styles.searchBtnText}>Search</Text>
        </TouchableOpacity>
      </View>

      {/* Mood & Trope discovery — shown when no search is active */}
      {!query.trim() && !loading && (
        <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
          <View style={styles.discoverSection}>
            <Text style={[styles.discoverSectionTitle, { color: textColor }]}>Browse by mood</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.moodRow}>
              {MOOD_PICKS.map((item) => (
                <TouchableOpacity key={item.mood} style={styles.moodCard} activeOpacity={0.85}>
                  <Text style={styles.moodCardEmoji}>{item.emoji}</Text>
                  <Text style={styles.moodCardLabel} numberOfLines={2}>{item.mood}</Text>
                  <Text style={styles.moodCardCount}>{item.count}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.discoverSection}>
            <Text style={[styles.discoverSectionTitle, { color: textColor }]}>Browse by trope</Text>
            <View style={styles.tropeGrid}>
              {TROPE_PICKS.map((trope) => (
                <TouchableOpacity key={trope} style={styles.tropePickChip} activeOpacity={0.85}>
                  <Text style={styles.tropePickChipText}>{trope}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.discoverSection}>
            <Text style={[styles.discoverSectionTitle, { color: textColor }]}>Popular right now</Text>
            <View style={styles.placeholderBooksRow}>
              {[
                { emoji: "🌹", title: "The Thorns Between Us", color: "#fecdd3" },
                { emoji: "🌙", title: "Midnight in the Stacks", color: "#ddd6fe" },
                { emoji: "⚡", title: "Storm & Fury", color: "#fef9c3" },
              ].map((book) => (
                <View key={book.title} style={[styles.placeholderBook, { backgroundColor: book.color }]}>
                  <Text style={styles.placeholderBookEmoji}>{book.emoji}</Text>
                  <Text style={styles.placeholderBookTitle} numberOfLines={2}>{book.title}</Text>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      )}

      {/* Search results — shown when query is active */}
      {query.trim().length > 0 && (
        <>
          {/* Trope banner */}
          {tropeBanner && (
            <View style={styles.tropeBanner}>
              <Text style={styles.tropeBannerTitle}>Tag tropes for {tropeBanner.title}?</Text>
              <View style={styles.tropeChips}>
                {tropeBanner.tropes.slice(0, 3).map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[
                      styles.tropeChip,
                      tropeBanner.selected.includes(t) && styles.tropeChipSelected,
                    ]}
                    onPress={() => toggleTrope(t)}
                  >
                    <Text style={styles.tropeChipText}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.tropeBannerActions}>
                <TouchableOpacity onPress={confirmTropes} style={styles.tropeSaveBtn}>
                  <Text style={styles.tropeSaveBtnText}>Save</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { if (bannerTimer.current) clearTimeout(bannerTimer.current); setTropeBanner(null); }}>
                  <Text style={styles.tropeDismiss}>Dismiss</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {loading ? (
            <ActivityIndicator style={{ marginTop: 40 }} />
          ) : (
            <FlatList
              data={results}
              keyExtractor={(b) => b.key}
              contentContainerStyle={styles.listContent}
              renderItem={({ item: book }) => {
                const cover = book.cover_i ? olCoverUrl(book.cover_i, "S") : null;
                const alreadyAdded =
                  addedKeys.has(book.key) || addedKeys.has(book.title);
                return (
                  <View style={styles.bookRow}>
                    {cover ? (
                      <Image source={{ uri: cover }} style={styles.cover} />
                    ) : (
                      <View style={[styles.cover, styles.coverPlaceholder]}>
                        <Text style={styles.coverInitial}>{book.title[0]}</Text>
                      </View>
                    )}
                    <View style={styles.bookInfo}>
                      <Text style={styles.bookTitle} numberOfLines={2}>{book.title}</Text>
                      <Text style={styles.bookAuthor}>
                        {book.author_name?.[0] ?? "Unknown author"}
                      </Text>
                      {book.first_publish_year && (
                        <Text style={styles.bookMeta}>{book.first_publish_year}</Text>
                      )}
                    </View>
                    <AddButton alreadyAdded={alreadyAdded} onPress={() => handleAdd(book)} />
                  </View>
                );
              }}
              ListEmptyComponent={
                results.length === 0 && !loading ? (
                  <View style={styles.empty}>
                    <Text style={styles.emptyEmoji}>🔍</Text>
                    <Text style={styles.emptyTitle}>No results found</Text>
                    <Text style={styles.emptyText}>
                      Try a different title or author name.
                    </Text>
                  </View>
                ) : null
              }
            />
          )}
        </>
      )}
    </SafeAreaView>
    </GradientView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  discoverHeader: { flexDirection: "row", alignItems: "flex-start", paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  discoverTitle: { fontSize: 26, fontWeight: "800", color: COLORS.ink },
  discoverSub: { fontSize: 13, color: COLORS.inkSoft, marginTop: 2 },
  inboxBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.5)", justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.6)" },
  inboxEmoji: { fontSize: 16 },
  inboxBadge: { position: "absolute", top: -2, right: -2, width: 16, height: 16, borderRadius: 8, backgroundColor: COLORS.rose, justifyContent: "center", alignItems: "center" },
  inboxBadgeText: { fontSize: 9, color: "#fff", fontWeight: "700" },
  searchBar: { flexDirection: "row", padding: 12, gap: 8 },
  input: { flex: 1, borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, backgroundColor: "#fff" },
  searchBtn: { backgroundColor: "#1a1a1a", borderRadius: 10, paddingHorizontal: 16, justifyContent: "center" },
  searchBtnText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  tropeBanner: { margin: 12, backgroundColor: "#fff", borderRadius: 14, padding: 14, borderWidth: 1, borderColor: "#e5e7eb", gap: 10 },
  tropeBannerTitle: { fontSize: 13, fontWeight: "600", color: "#1a1a1a" },
  tropeChips: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  tropeChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: "#e5e7eb", backgroundColor: "#f9fafb" },
  tropeChipSelected: { backgroundColor: "#1a1a1a", borderColor: "#1a1a1a" },
  tropeChipText: { fontSize: 12 },
  tropeBannerActions: { flexDirection: "row", alignItems: "center", gap: 16 },
  tropeSaveBtn: { backgroundColor: "#1a1a1a", borderRadius: 8, paddingHorizontal: 16, paddingVertical: 7 },
  tropeSaveBtnText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  tropeDismiss: { fontSize: 13, color: "#9ca3af" },
  listContent: { padding: 12, gap: 12 },
  bookRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, backgroundColor: "#fff", borderRadius: 14, padding: 12, borderWidth: 1, borderColor: "#f0ede8" },
  cover: { width: 48, height: 70, borderRadius: 6 },
  coverPlaceholder: { backgroundColor: "#e5e7eb", justifyContent: "center", alignItems: "center" },
  coverInitial: { fontSize: 18, fontWeight: "700", color: "#9ca3af" },
  bookInfo: { flex: 1, gap: 2 },
  bookTitle: { fontSize: 14, fontWeight: "600", color: "#1a1a1a" },
  bookAuthor: { fontSize: 12, color: "#6b7280" },
  bookMeta: { fontSize: 11, color: "#9ca3af" },
  addBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: "#1a1a1a", justifyContent: "center", alignItems: "center" },
  addBtnDisabled: { backgroundColor: "#d1fae5" },
  addBtnText: { color: "#fff", fontSize: 18, lineHeight: 20 },
  empty: { paddingTop: 60, alignItems: "center", gap: 10, paddingHorizontal: 32 },
  emptyEmoji: { fontSize: 36 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: "#1a1a1a", textAlign: "center" },
  emptyText: { fontSize: 14, color: "#9ca3af", textAlign: "center", lineHeight: 20 },
  // Discovery sections
  discoverSection: { paddingHorizontal: 16, paddingBottom: 20 },
  discoverSectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 12 },
  moodRow: { gap: 10, paddingRight: 16 },
  moodCard: {
    width: 110, backgroundColor: "rgba(255,255,255,0.85)", borderRadius: 16,
    padding: 12, alignItems: "center", gap: 4,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.6)",
  },
  moodCardEmoji: { fontSize: 26 },
  moodCardLabel: { fontSize: 11, fontWeight: "600", color: "#1a1a1a", textAlign: "center", lineHeight: 14 },
  moodCardCount: { fontSize: 10, color: "#9ca3af" },
  tropeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tropePickChip: {
    backgroundColor: "rgba(255,255,255,0.8)", borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 1, borderColor: "rgba(167,139,250,0.3)",
  },
  tropePickChipText: { fontSize: 13, fontWeight: "600", color: "#7c3aed" },
  placeholderBooksRow: { flexDirection: "row", gap: 10 },
  placeholderBook: {
    flex: 1, borderRadius: 14, padding: 14, alignItems: "center", gap: 8, minHeight: 110,
    justifyContent: "center",
  },
  placeholderBookEmoji: { fontSize: 28 },
  placeholderBookTitle: { fontSize: 11, fontWeight: "600", color: "#1a1a1a", textAlign: "center", lineHeight: 14 },
});
