import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/navigation";
import { useStore } from "@/store";
import { searchBooks, olCoverUrl, moodTagBooks, type OLBook } from "@/lib/api";
import { useAuth } from "@clerk/clerk-expo";

type Nav = NativeStackNavigationProp<RootStackParamList>;

const TROPE_BANNER_MS = 10_000;

export default function DiscoverScreen() {
  const nav = useNavigation<Nav>();
  const { getToken } = useAuth();
  const addBook = useStore((s) => s.addBook);
  const updateBook = useStore((s) => s.updateBook);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<OLBook[]>([]);
  const [loading, setLoading] = useState(false);

  // Trope banner state
  const [tropeBanner, setTropeBanner] = useState<{
    bookId: string;
    title: string;
    tropes: string[];
    selected: string[];
  } | null>(null);
  const bannerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const data = await searchBooks(query);
      setResults(data);
    } catch {
      Alert.alert("Search failed", "Check your connection and try again.");
    } finally {
      setLoading(false);
    }
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

    // Kick off trope tagging in background
    moodTagBooks(
      [{ key: book.key, title: book.title }],
      getToken,
    ).then((tagMap) => {
      const tropes = tagMap[book.key] ?? [];
      if (tropes.length === 0) return;
      // Show trope banner for 10s
      if (bannerTimer.current) clearTimeout(bannerTimer.current);
      setTropeBanner({ bookId: id, title: book.title, tropes, selected: [] });
      bannerTimer.current = setTimeout(() => setTropeBanner(null), TROPE_BANNER_MS);
    }).catch(() => {});
  };

  const confirmTropes = () => {
    if (!tropeBanner) return;
    if (tropeBanner.selected.length > 0) {
      updateBook(tropeBanner.bookId, { tropes: tropeBanner.selected });
    }
    setTropeBanner(null);
    if (bannerTimer.current) clearTimeout(bannerTimer.current);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.searchBar}>
        <TextInput
          style={styles.input}
          placeholder="Search books by title or author…"
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
          onSubmitEditing={doSearch}
        />
        <TouchableOpacity style={styles.searchBtn} onPress={doSearch}>
          <Text style={styles.searchBtnText}>Search</Text>
        </TouchableOpacity>
      </View>

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
                onPress={() =>
                  setTropeBanner((prev) =>
                    prev
                      ? {
                          ...prev,
                          selected: prev.selected.includes(t)
                            ? prev.selected.filter((s) => s !== t)
                            : [...prev.selected, t],
                        }
                      : null,
                  )
                }
              >
                <Text style={styles.tropeChipText}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.tropeBannerActions}>
            <TouchableOpacity onPress={confirmTropes} style={styles.tropeSaveBtn}>
              <Text style={styles.tropeSaveBtnText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setTropeBanner(null)}>
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
            const alreadyAdded = useStore.getState().books.some(
              (b) => b.openLibraryKey === book.key || b.title === book.title,
            );
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
                <TouchableOpacity
                  style={[styles.addBtn, alreadyAdded && styles.addBtnDisabled]}
                  onPress={() => !alreadyAdded && handleAdd(book)}
                  disabled={alreadyAdded}
                >
                  <Text style={styles.addBtnText}>{alreadyAdded ? "✓" : "+"}</Text>
                </TouchableOpacity>
              </View>
            );
          }}
          ListEmptyComponent={
            results.length === 0 && !loading ? (
              <View style={styles.empty}>
                <Text style={styles.emptyText}>Search for a book to get started.</Text>
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fafaf9" },
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
  bookRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, backgroundColor: "#fff", borderRadius: 14, padding: 12, borderWidth: 1, borderColor: "#f0f0f0" },
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
  empty: { paddingTop: 60, alignItems: "center" },
  emptyText: { fontSize: 14, color: "#9ca3af" },
});
