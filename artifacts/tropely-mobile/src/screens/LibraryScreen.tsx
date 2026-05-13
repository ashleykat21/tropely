import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/navigation";
import { useStore, type Shelf } from "@/store";

type Nav = NativeStackNavigationProp<RootStackParamList>;

const TABS: { key: Shelf; label: string }[] = [
  { key: "reading", label: "Reading" },
  { key: "want", label: "Want" },
  { key: "finished", label: "Finished" },
  { key: "paused", label: "Paused" },
  { key: "dnf", label: "DNF" },
];

type SortKey = "recent" | "az" | "pages" | "rating";

export default function LibraryScreen() {
  const nav = useNavigation<Nav>();
  const { books, reflections } = useStore();
  const [activeShelf, setActiveShelf] = useState<Shelf>("reading");
  const [sort, setSort] = useState<SortKey>("recent");
  const [viewMode, setViewMode] = useState<"spine" | "grid">("spine");

  const shelfBooks = books.filter((b) => b.shelf === activeShelf);

  const sorted = [...shelfBooks].sort((a, b) => {
    if (sort === "az") return a.title.localeCompare(b.title);
    if (sort === "pages") return b.pages - a.pages;
    if (sort === "rating") {
      const ra = reflections.find((r) => r.bookId === a.id)?.rating ?? 0;
      const rb = reflections.find((r) => r.bookId === b.id)?.rating ?? 0;
      return rb - ra;
    }
    return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
  });

  const getStars = (bookId: string) => {
    return reflections.find((r) => r.bookId === bookId)?.rating ?? 0;
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Your library</Text>
        <View style={styles.viewToggle}>
          <TouchableOpacity
            style={[styles.viewBtn, viewMode === "spine" && styles.viewBtnActive]}
            onPress={() => setViewMode("spine")}
          >
            <Text style={[styles.viewBtnText, viewMode === "spine" && styles.viewBtnTextActive]}>
              ☰
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.viewBtn, viewMode === "grid" && styles.viewBtnActive]}
            onPress={() => setViewMode("grid")}
          >
            <Text style={[styles.viewBtnText, viewMode === "grid" && styles.viewBtnTextActive]}>
              ⊞
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Shelf tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsContainer}
        contentContainerStyle={styles.tabs}
      >
        {TABS.map((t) => (
          <TouchableOpacity
            key={t.key}
            onPress={() => setActiveShelf(t.key)}
            style={[styles.tab, activeShelf === t.key && styles.tabActive]}
          >
            <Text style={[styles.tabText, activeShelf === t.key && styles.tabTextActive]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Sort bar (not on want shelf) */}
      {activeShelf !== "want" && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.sortContainer}
          contentContainerStyle={styles.sortRow}
        >
          {(["recent", "az", "pages"] as SortKey[])
            .concat(activeShelf === "finished" ? ["rating"] : [])
            .map((s) => (
              <TouchableOpacity
                key={s}
                onPress={() => setSort(s)}
                style={[styles.sortChip, sort === s && styles.sortChipActive]}
              >
                <Text style={[styles.sortChipText, sort === s && styles.sortChipTextActive]}>
                  {s === "az" ? "A→Z" : s === "recent" ? "Recent" : s === "pages" ? "Pages" : "Rating"}
                </Text>
              </TouchableOpacity>
            ))}
        </ScrollView>
      )}

      {sorted.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No books here yet.</Text>
        </View>
      ) : viewMode === "grid" ? (
        <FlatList
          data={sorted}
          keyExtractor={(b) => b.id}
          numColumns={4}
          contentContainerStyle={styles.gridContent}
          renderItem={({ item: b }) => (
            <TouchableOpacity
              style={styles.gridItem}
              onPress={() => nav.navigate("BookDetail", { bookId: b.id })}
            >
              {b.cover ? (
                <Image source={{ uri: b.cover }} style={styles.gridCover} />
              ) : (
                <View style={[styles.gridCover, styles.coverPlaceholder]}>
                  <Text style={styles.coverInitial}>{b.title[0]}</Text>
                </View>
              )}
              <Text style={styles.gridTitle} numberOfLines={2}>{b.title}</Text>
              {activeShelf === "finished" && getStars(b.id) > 0 && (
                <Text style={styles.stars}>{"★".repeat(getStars(b.id))}</Text>
              )}
            </TouchableOpacity>
          )}
        />
      ) : (
        // Spine view (horizontal rows per shelf)
        <ScrollView style={styles.spineScroll} contentContainerStyle={styles.spineContent}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {sorted.map((b) => (
              <TouchableOpacity
                key={b.id}
                style={styles.spineItem}
                onPress={() => nav.navigate("BookDetail", { bookId: b.id })}
              >
                {b.cover ? (
                  <Image source={{ uri: b.cover }} style={styles.spineCover} />
                ) : (
                  <View style={[styles.spineCover, styles.coverPlaceholder]}>
                    <Text style={styles.spineInitial}>{b.title[0]}</Text>
                  </View>
                )}
                <Text style={styles.spineTitle} numberOfLines={2}>{b.title}</Text>
                {activeShelf === "finished" && getStars(b.id) > 0 && (
                  <Text style={styles.stars}>{"★".repeat(getStars(b.id))}</Text>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fafaf9" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  title: { fontSize: 26, fontWeight: "700", color: "#1a1a1a" },
  viewToggle: { flexDirection: "row", gap: 4, backgroundColor: "#f3f4f6", borderRadius: 8, padding: 3 },
  viewBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
  viewBtnActive: { backgroundColor: "#fff" },
  viewBtnText: { fontSize: 14, color: "#9ca3af" },
  viewBtnTextActive: { color: "#1a1a1a" },
  tabsContainer: { flexGrow: 0 },
  tabs: { paddingHorizontal: 12, gap: 6, paddingVertical: 8 },
  tab: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: "#f3f4f6" },
  tabActive: { backgroundColor: "#1a1a1a" },
  tabText: { fontSize: 13, fontWeight: "500", color: "#6b7280" },
  tabTextActive: { color: "#fff" },
  sortContainer: { flexGrow: 0 },
  sortRow: { paddingHorizontal: 16, gap: 6, paddingBottom: 8 },
  sortChip: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: "#e5e7eb" },
  sortChipActive: { borderColor: "#1a1a1a", backgroundColor: "#1a1a1a" },
  sortChipText: { fontSize: 12, color: "#6b7280" },
  sortChipTextActive: { color: "#fff" },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { fontSize: 14, color: "#9ca3af" },
  gridContent: { padding: 12, gap: 4 },
  gridItem: { flex: 1, margin: 4, alignItems: "center", gap: 4 },
  gridCover: { width: "100%", aspectRatio: 2 / 3, borderRadius: 6 },
  coverPlaceholder: { backgroundColor: "#e5e7eb", justifyContent: "center", alignItems: "center" },
  coverInitial: { fontSize: 20, fontWeight: "700", color: "#9ca3af" },
  gridTitle: { fontSize: 10, color: "#1a1a1a", textAlign: "center" },
  stars: { fontSize: 10, color: "#f59e0b" },
  spineScroll: { flex: 1 },
  spineContent: { padding: 16 },
  spineItem: { width: 90, marginRight: 12, alignItems: "center", gap: 6 },
  spineCover: { width: 72, height: 108, borderRadius: 6 },
  spineInitial: { fontSize: 24, fontWeight: "700", color: "#9ca3af" },
  spineTitle: { fontSize: 10, color: "#1a1a1a", textAlign: "center" },
});
