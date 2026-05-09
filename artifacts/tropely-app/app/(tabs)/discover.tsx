import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { coverUrl, OLBook, searchBooks } from "@/lib/openLibrary";
import { useStore } from "@/lib/store";
import { Book, Shelf, TROPES } from "@/types";

type AddStep = "shelf" | "tropes";

export default function DiscoverScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const addBook = useStore((s) => s.addBook);
  const books = useStore((s) => s.books);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<OLBook[]>([]);
  const [loading, setLoading] = useState(false);

  const [addTarget, setAddTarget] = useState<OLBook | null>(null);
  const [shelf, setShelf] = useState<Shelf>("want");
  const [selectedTropes, setSelectedTropes] = useState<string[]>([]);
  const [step, setStep] = useState<AddStep>("shelf");

  const addedKeys = new Set(books.map((b) => b.openLibraryKey).filter(Boolean));

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    const r = await searchBooks(query);
    setResults(r);
    setLoading(false);
  };

  const openAdd = (book: OLBook) => {
    setAddTarget(book);
    setShelf("want");
    setSelectedTropes([]);
    setStep("shelf");
  };

  const confirmAdd = () => {
    if (!addTarget) return;
    const newBook: Book = {
      id: Date.now().toString() + Math.random().toString(36).slice(2, 7),
      title: addTarget.title,
      author: addTarget.author_name?.[0] ?? "Unknown",
      cover: coverUrl(addTarget.cover_i, "L"),
      isbn: addTarget.isbn?.[0],
      pageCount: addTarget.number_of_pages_median,
      currentPage: 0,
      shelf,
      moods: [],
      tropes: selectedTropes,
      sessions: [],
      addedAt: Date.now(),
      openLibraryKey: addTarget.key,
    };
    addBook(newBook);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setAddTarget(null);
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.searchHeader,
          {
            paddingTop: topPad + 8,
            paddingBottom: 12,
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Text style={[styles.screenTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
          Discover
        </Text>
        <View style={[styles.searchRow, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
          <Feather name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            style={[styles.input, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}
            placeholder="Search books, authors..."
            placeholderTextColor={colors.mutedForeground}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <Pressable onPress={() => { setQuery(""); setResults([]); }}>
              <Feather name="x" size={16} color={colors.mutedForeground} />
            </Pressable>
          )}
        </View>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : results.length === 0 ? (
        <View style={styles.centered}>
          <Feather name="search" size={40} color={colors.muted} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            {query ? "No results found" : "Search for a title or author"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.key}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: botPad + 100 },
          ]}
          scrollEnabled={!!results.length}
          renderItem={({ item }) => {
            const isAdded = addedKeys.has(item.key);
            return (
              <View
                style={[
                  styles.resultRow,
                  { borderBottomColor: colors.border, backgroundColor: colors.background },
                ]}
              >
                {item.cover_i ? (
                  <Image
                    source={{ uri: coverUrl(item.cover_i, "M") }}
                    style={[styles.resultCover, { borderRadius: 6 }]}
                    contentFit="cover"
                  />
                ) : (
                  <View
                    style={[
                      styles.resultCover,
                      styles.coverPlaceholder,
                      { backgroundColor: colors.muted, borderRadius: 6 },
                    ]}
                  >
                    <Feather name="book" size={16} color={colors.mutedForeground} />
                  </View>
                )}
                <View style={styles.resultInfo}>
                  <Text style={[styles.resultTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <Text style={[styles.resultAuthor, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]} numberOfLines={1}>
                    {item.author_name?.[0] ?? "Unknown author"}
                  </Text>
                  {item.number_of_pages_median ? (
                    <Text style={[styles.resultPages, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                      {item.number_of_pages_median} pages
                    </Text>
                  ) : null}
                </View>
                <TouchableOpacity
                  style={[
                    styles.addBtn,
                    {
                      backgroundColor: isAdded ? colors.muted : colors.foreground,
                      borderRadius: 20,
                    },
                  ]}
                  onPress={() => !isAdded && openAdd(item)}
                  disabled={isAdded}
                >
                  <Feather
                    name={isAdded ? "check" : "plus"}
                    size={16}
                    color={isAdded ? colors.mutedForeground : colors.primaryForeground}
                  />
                </TouchableOpacity>
              </View>
            );
          }}
        />
      )}

      <Modal
        visible={!!addTarget}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setAddTarget(null)}
      >
        <View style={[styles.modalRoot, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Pressable onPress={() => step === "tropes" ? setStep("shelf") : setAddTarget(null)}>
              <Feather name={step === "tropes" ? "arrow-left" : "x"} size={20} color={colors.foreground} />
            </Pressable>
            <Text style={[styles.modalTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
              {step === "shelf" ? "Add to shelf" : "Tag tropes"}
            </Text>
            <Pressable onPress={step === "shelf" ? () => setStep("tropes") : confirmAdd}>
              <Text style={[styles.modalNext, { color: colors.accent, fontFamily: "Inter_600SemiBold" }]}>
                {step === "shelf" ? "Next" : "Add"}
              </Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.modalBody}>
            {step === "shelf" ? (
              <>
                <Text style={[styles.modalSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                  {addTarget?.title}
                </Text>
                {(["want", "reading", "finished"] as Shelf[]).map((s) => (
                  <Pressable
                    key={s}
                    style={[
                      styles.shelfOption,
                      {
                        backgroundColor: shelf === s ? colors.foreground : colors.card,
                        borderColor: colors.border,
                        borderRadius: colors.radius,
                      },
                    ]}
                    onPress={() => setShelf(s)}
                  >
                    <Text
                      style={[
                        styles.shelfOptionText,
                        {
                          color: shelf === s ? colors.primaryForeground : colors.foreground,
                          fontFamily: "Inter_500Medium",
                        },
                      ]}
                    >
                      {s === "want" ? "Want to Read" : s === "reading" ? "Currently Reading" : "Finished"}
                    </Text>
                    {shelf === s && <Feather name="check" size={16} color={colors.primaryForeground} />}
                  </Pressable>
                ))}
              </>
            ) : (
              <>
                <Text style={[styles.modalSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                  Tag the tropes in this book (optional)
                </Text>
                <View style={styles.tropeGrid}>
                  {TROPES.map((t) => {
                    const sel = selectedTropes.includes(t);
                    return (
                      <Pressable
                        key={t}
                        style={[
                          styles.tropeChip,
                          {
                            backgroundColor: sel ? colors.foreground : colors.card,
                            borderColor: sel ? colors.foreground : colors.border,
                            borderRadius: 20,
                          },
                        ]}
                        onPress={() =>
                          setSelectedTropes((prev) =>
                            sel ? prev.filter((x) => x !== t) : [...prev, t]
                          )
                        }
                      >
                        <Text
                          style={[
                            styles.tropeText,
                            {
                              color: sel ? colors.primaryForeground : colors.foreground,
                              fontFamily: "Inter_400Regular",
                            },
                          ]}
                        >
                          {t}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  searchHeader: { paddingHorizontal: 20, gap: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  screenTitle: { fontSize: 28 },
  searchRow: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderWidth: 1 },
  input: { flex: 1, fontSize: 15 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  emptyText: { fontSize: 15, textAlign: "center" },
  list: { paddingHorizontal: 20, paddingTop: 8 },
  resultRow: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  resultCover: { width: 52, height: 76 },
  coverPlaceholder: { alignItems: "center", justifyContent: "center" },
  resultInfo: { flex: 1, gap: 3 },
  resultTitle: { fontSize: 15, lineHeight: 20 },
  resultAuthor: { fontSize: 13 },
  resultPages: { fontSize: 12, marginTop: 2 },
  addBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  modalRoot: { flex: 1 },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 20, paddingTop: 24, borderBottomWidth: StyleSheet.hairlineWidth },
  modalTitle: { fontSize: 16 },
  modalNext: { fontSize: 16 },
  modalBody: { padding: 20, gap: 14 },
  modalSub: { fontSize: 15, marginBottom: 8 },
  shelfOption: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, borderWidth: 1, marginBottom: 2 },
  shelfOptionText: { fontSize: 16 },
  tropeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  tropeChip: { paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1 },
  tropeText: { fontSize: 14 },
});
