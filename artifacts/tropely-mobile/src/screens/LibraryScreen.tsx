import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  FlatList,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/navigation";
import { useStore, useSpoilerLock, type Shelf } from "@/store";

type Nav = NativeStackNavigationProp<RootStackParamList>;

const TABS: { key: Shelf; label: string }[] = [
  { key: "reading", label: "Reading" },
  { key: "want", label: "Want" },
  { key: "finished", label: "Finished" },
  { key: "paused", label: "Paused" },
  { key: "dnf", label: "DNF" },
];

const EMPTY_STATES: Record<Shelf, { emoji: string; title: string; hint: string; action?: string }> = {
  reading: { emoji: "📖", title: "Nothing open right now", hint: "Search for a book and add it to start tracking your reading.", action: "Find a book" },
  want: { emoji: "🎭", title: "No tropes queued up yet", hint: "Find your next obsession.", action: "Discover books" },
  finished: { emoji: "🏁", title: "No finished reads yet", hint: "Your finished reads will show tropes you keep coming back to." },
  paused: { emoji: "⏸️", title: "Nothing on pause", hint: "Books you pause mid-read will land here." },
  dnf: { emoji: "📕", title: "No DNFs yet", hint: "Life's too short for bad books — it's okay to stop." },
};

type SortKey = "recent" | "az" | "pages" | "rating";

const MOOD_COLORS: Record<string, string> = {
  hopeful: "#d1fae5", tense: "#fee2e2", melancholy: "#e0e7ff",
  joyful: "#fef9c3", romantic: "#fce7f3", eerie: "#f3e8ff",
  reflective: "#f0fdf4", adventurous: "#fff7ed", cozy: "#fef3c7", intense: "#fee2e2",
};

// Skeleton card for loading state
function SkeletonCard({ opacity }: { opacity: Animated.Value }) {
  return (
    <Animated.View style={[styles.skeletonCard, { opacity }]}>
      <View style={styles.skeletonCover} />
      <View style={{ flex: 1, gap: 6 }}>
        <View style={styles.skeletonLine} />
        <View style={[styles.skeletonLine, { width: "60%" }]} />
      </View>
    </Animated.View>
  );
}

export default function LibraryScreen() {
  const nav = useNavigation<Nav>();
  const { books, reflections } = useStore();
  const spoilerLock = useSpoilerLock();

  const [activeShelf, setActiveShelf] = useState<Shelf>("reading");
  const [sort, setSort] = useState<SortKey>("recent");
  const [viewMode, setViewMode] = useState<"spine" | "grid">("spine");
  const [filters, setFilters] = useState<{ moods: string[]; tropes: string[] }>({ moods: [], tropes: [] });
  const [mounted, setMounted] = useState(false);

  const toggleMoodFilter = (mood: string) =>
    setFilters((prev) => ({
      ...prev,
      moods: prev.moods.includes(mood) ? prev.moods.filter((m) => m !== mood) : [...prev.moods, mood],
    }));

  const toggleTropeFilter = (trope: string) =>
    setFilters((prev) => ({
      ...prev,
      tropes: prev.tropes.includes(trope) ? prev.tropes.filter((t) => t !== trope) : [...prev.tropes, trope],
    }));

  const clearFilters = () => setFilters({ moods: [], tropes: [] });

  const skeletonOpacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    // Pulse skeleton
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(skeletonOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(skeletonOpacity, { toValue: 0.4, duration: 600, useNativeDriver: true }),
      ])
    );
    pulse.start();
    const timer = setTimeout(() => { setMounted(true); pulse.stop(); }, 400);
    return () => { clearTimeout(timer); pulse.stop(); };
  }, []);

  const shelfBooks = useMemo(
    () => books.filter((b) => b.shelf === activeShelf),
    [books, activeShelf]
  );

  // Unique tropes + moods from current shelf
  const shelfTropes = useMemo(() => {
    const all = shelfBooks.flatMap((b) => b.tropes ?? []);
    return [...new Set(all)].slice(0, 12);
  }, [shelfBooks]);

  const shelfMoods = useMemo(() => {
    return [...new Set(shelfBooks.map((b) => b.mood).filter(Boolean) as string[])];
  }, [shelfBooks]);

  const hasActiveFilters = filters.moods.length > 0 || filters.tropes.length > 0;

  const sorted = useMemo(() => {
    let list = shelfBooks;
    if (filters.moods.length > 0) list = list.filter((b) => b.mood && filters.moods.includes(b.mood));
    if (filters.tropes.length > 0) list = list.filter((b) => filters.tropes.every((t) => b.tropes?.includes(t)));
    return [...list].sort((a, b) => {
      if (sort === "az") return a.title.localeCompare(b.title);
      if (sort === "pages") return b.pages - a.pages;
      if (sort === "rating") {
        const ra = reflections.find((r) => r.bookId === a.id)?.rating ?? 0;
        const rb = reflections.find((r) => r.bookId === b.id)?.rating ?? 0;
        return rb - ra;
      }
      return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
    });
  }, [shelfBooks, filters, sort, reflections]);

  const getStars = (bookId: string) => reflections.find((r) => r.bookId === bookId)?.rating ?? 0;
  const empty = EMPTY_STATES[activeShelf];

  const isSpoiled = (book: (typeof books)[0]) =>
    spoilerLock && activeShelf === "reading" && book.progress === 0;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Your shelf</Text>
        <View style={styles.viewToggle}>
          <TouchableOpacity
            style={[styles.viewBtn, viewMode === "spine" && styles.viewBtnActive]}
            onPress={() => setViewMode("spine")}
          >
            <Text style={[styles.viewBtnText, viewMode === "spine" && styles.viewBtnTextActive]}>☰</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.viewBtn, viewMode === "grid" && styles.viewBtnActive]}
            onPress={() => setViewMode("grid")}
          >
            <Text style={[styles.viewBtnText, viewMode === "grid" && styles.viewBtnTextActive]}>⊞</Text>
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
        {TABS.map((t) => {
          const count = books.filter((b) => b.shelf === t.key).length;
          return (
            <TouchableOpacity
              key={t.key}
              onPress={() => { setActiveShelf(t.key); clearFilters(); }}
              style={[styles.tab, activeShelf === t.key && styles.tabActive]}
            >
              <Text style={[styles.tabText, activeShelf === t.key && styles.tabTextActive]}>
                {t.label}
                {count > 0 ? ` (${count})` : ""}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Sort + mood + trope filter bar */}
      {shelfBooks.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.sortContainer}
          contentContainerStyle={styles.sortRow}
        >
          {(["recent", "az", "pages"] as SortKey[])
            .concat(activeShelf === "finished" ? ["rating" as SortKey] : [])
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
          {shelfMoods.length > 0 && <View style={styles.sortDivider} />}
          {shelfMoods.map((mood) => (
            <TouchableOpacity
              key={`mood-${mood}`}
              onPress={() => toggleMoodFilter(mood)}
              style={[
                styles.tropeChip,
                filters.moods.includes(mood) && { backgroundColor: MOOD_COLORS[mood] ?? "#e5e7eb", borderColor: "#1a1a1a" },
              ]}
            >
              <Text style={[styles.tropeChipText, filters.moods.includes(mood) && styles.tropeChipTextActive]}>
                {mood}
              </Text>
            </TouchableOpacity>
          ))}
          {shelfTropes.length > 0 && <View style={styles.sortDivider} />}
          {shelfTropes.map((trope) => (
            <TouchableOpacity
              key={`trope-${trope}`}
              onPress={() => toggleTropeFilter(trope)}
              style={[styles.tropeChip, filters.tropes.includes(trope) && styles.tropeChipActive]}
            >
              <Text style={[styles.tropeChipText, filters.tropes.includes(trope) && styles.tropeChipTextActive]}>
                {trope}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {!mounted ? (
        <View style={styles.skeletonContainer}>
          {[0, 1, 2, 3].map((i) => (
            <SkeletonCard key={i} opacity={skeletonOpacity} />
          ))}
        </View>
      ) : sorted.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>{hasActiveFilters ? "🔍" : empty.emoji}</Text>
          <Text style={styles.emptyTitle}>
            {hasActiveFilters ? "No matches" : empty.title}
          </Text>
          <Text style={styles.emptyHint}>
            {hasActiveFilters ? "Try different filters." : empty.hint}
          </Text>
          {hasActiveFilters ? (
            <TouchableOpacity style={styles.emptyBtn} onPress={clearFilters}>
              <Text style={styles.emptyBtnText}>Clear filters</Text>
            </TouchableOpacity>
          ) : empty.action ? (
            <TouchableOpacity
              style={styles.emptyBtn}
              onPress={() => {
                if (activeShelf === "reading" || activeShelf === "want") {
                  (nav as any).navigate("Discover");
                }
              }}
            >
              <Text style={styles.emptyBtnText}>{empty.action}</Text>
            </TouchableOpacity>
          ) : null}
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
              {b.consumption === "listen" && (
                <View style={styles.audioBadge}>
                  <Text style={styles.audioBadgeText}>🎧</Text>
                </View>
              )}
              <Text style={styles.gridTitle} numberOfLines={2}>{b.title}</Text>
              {(b.tropes ?? []).length > 0 && (
                <View style={styles.gridTropePill}>
                  <Text style={styles.gridTropePillText} numberOfLines={1}>{b.tropes![0]}</Text>
                </View>
              )}
              {activeShelf === "finished" && getStars(b.id) > 0 && (
                <Text style={styles.stars}>{"★".repeat(getStars(b.id))}</Text>
              )}
            </TouchableOpacity>
          )}
        />
      ) : (
        <ScrollView style={styles.spineScroll} contentContainerStyle={styles.spineContent}>
          {sorted.map((b) => {
            const spoiled = isSpoiled(b);
            const pct = b.pages > 0 ? Math.min(100, (b.progress / b.pages) * 100) : 0;
            return (
              <TouchableOpacity
                key={b.id}
                style={styles.spineRow}
                onPress={() => nav.navigate("BookDetail", { bookId: b.id })}
                activeOpacity={0.7}
              >
                {b.cover ? (
                  <Image source={{ uri: b.cover }} style={styles.spineRowCover} />
                ) : (
                  <View style={[styles.spineRowCover, styles.coverPlaceholder]}>
                    <Text style={styles.spineRowInitial}>{b.title[0]}</Text>
                  </View>
                )}
                <View style={styles.spineRowInfo}>
                  <View style={styles.spineRowTitle}>
                    <Text style={styles.spineRowTitleText} numberOfLines={1}>{b.title}</Text>
                    {b.consumption === "listen" && <Text style={styles.audioIcon}>🎧</Text>}
                  </View>
                  <Text style={styles.spineRowAuthor} numberOfLines={1}>{b.author}</Text>
                  {activeShelf === "reading" && !spoiled && (
                    <View style={styles.progressTrack}>
                      <View style={[styles.progressBar, { width: `${pct}%` }]} />
                    </View>
                  )}
                  {activeShelf === "reading" && spoiled && (
                    <Text style={styles.spoilerNote}>🔒 Not started</Text>
                  )}
                  {(b.tropes ?? []).length > 0 && (
                    <View style={styles.spineTropeRow}>
                      {b.tropes!.slice(0, 2).map((t) => (
                        <View key={t} style={styles.spineTropePill}>
                          <Text style={styles.spineTropePillText}>{t}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                  {activeShelf === "finished" && getStars(b.id) > 0 && (
                    <Text style={styles.starsSmall}>{"★".repeat(getStars(b.id))}</Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fafaf9" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  title: { fontSize: 26, fontWeight: "700", color: "#1a1a1a" },
  viewToggle: { flexDirection: "row", gap: 4, backgroundColor: "#f5f0ea", borderRadius: 8, padding: 3 },
  viewBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
  viewBtnActive: { backgroundColor: "#fff" },
  viewBtnText: { fontSize: 14, color: "#9ca3af" },
  viewBtnTextActive: { color: "#1a1a1a" },
  tabsContainer: { flexGrow: 0 },
  tabs: { paddingHorizontal: 12, gap: 6, paddingVertical: 8 },
  tab: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: "#f5f0ea" },
  tabActive: { backgroundColor: "#1a1a1a" },
  tabText: { fontSize: 13, fontWeight: "500", color: "#6b7280" },
  tabTextActive: { color: "#fff" },
  sortContainer: { flexGrow: 0 },
  sortRow: { paddingHorizontal: 16, gap: 6, paddingBottom: 10, alignItems: "center" },
  sortChip: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: "#e5e7eb" },
  sortChipActive: { borderColor: "#1a1a1a", backgroundColor: "#1a1a1a" },
  sortChipText: { fontSize: 12, color: "#6b7280" },
  sortChipTextActive: { color: "#fff" },
  sortDivider: { width: 1, height: 20, backgroundColor: "#e5e7eb", marginHorizontal: 2 },
  tropeChip: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, backgroundColor: "#f5f0ea" },
  tropeChipActive: { backgroundColor: "#1a1a1a" },
  tropeChipText: { fontSize: 12, color: "#6b7280" },
  tropeChipTextActive: { color: "#fff" },
  // Skeleton
  skeletonContainer: { padding: 16, gap: 12 },
  skeletonCard: { flexDirection: "row", gap: 12, alignItems: "center", backgroundColor: "#fff", borderRadius: 14, padding: 12, borderWidth: 1, borderColor: "#f0ede8" },
  skeletonCover: { width: 48, height: 72, borderRadius: 6, backgroundColor: "#e5e7eb" },
  skeletonLine: { height: 12, backgroundColor: "#e5e7eb", borderRadius: 6, width: "80%" },
  // Empty
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32, gap: 8 },
  emptyEmoji: { fontSize: 40, marginBottom: 4 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: "#1a1a1a", textAlign: "center" },
  emptyHint: { fontSize: 13, color: "#9ca3af", textAlign: "center", lineHeight: 20 },
  emptyBtn: { backgroundColor: "#1a1a1a", borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10, marginTop: 8 },
  emptyBtnText: { color: "#fff", fontWeight: "600", fontSize: 13 },
  // Grid
  gridContent: { padding: 12, gap: 4 },
  gridItem: { flex: 1, margin: 4, alignItems: "center", gap: 4 },
  gridCover: { width: "100%", aspectRatio: 2 / 3, borderRadius: 6 },
  audioBadge: { position: "absolute", top: 4, right: 4, backgroundColor: "rgba(0,0,0,0.6)", borderRadius: 8, padding: 2 },
  audioBadgeText: { fontSize: 10 },
  coverPlaceholder: { backgroundColor: "#e5e7eb", justifyContent: "center", alignItems: "center" },
  coverInitial: { fontSize: 20, fontWeight: "700", color: "#9ca3af" },
  gridTitle: { fontSize: 10, color: "#2d1f10", textAlign: "center" },
  gridTropePill: { backgroundColor: "#f5f0ea", borderRadius: 6, paddingHorizontal: 4, paddingVertical: 1, alignSelf: "center" },
  gridTropePillText: { fontSize: 8, color: "#7a6655", fontWeight: "500", textAlign: "center" },
  stars: { fontSize: 10, color: "#f59e0b" },
  // Spine (list view)
  spineScroll: { flex: 1 },
  spineContent: { padding: 16, gap: 2, paddingBottom: 32 },
  spineRow: { flexDirection: "row", gap: 12, padding: 10, borderRadius: 12, backgroundColor: "#fff", marginBottom: 8, borderWidth: 1, borderColor: "#f0ede8" },
  spineRowCover: { width: 44, height: 66, borderRadius: 6 },
  spineRowInitial: { fontSize: 18, fontWeight: "700", color: "#9ca3af" },
  spineRowInfo: { flex: 1, gap: 4, justifyContent: "center" },
  spineRowTitle: { flexDirection: "row", alignItems: "center", gap: 6 },
  spineRowTitleText: { flex: 1, fontSize: 14, fontWeight: "600", color: "#1a1a1a" },
  audioIcon: { fontSize: 12 },
  spineRowAuthor: { fontSize: 12, color: "#9ca3af" },
  progressTrack: { height: 3, backgroundColor: "#f5f0ea", borderRadius: 2, overflow: "hidden", marginTop: 2 },
  progressBar: { height: "100%", backgroundColor: "#1a1a1a", borderRadius: 2 },
  spoilerNote: { fontSize: 11, color: "#9ca3af" },
  spineTropeRow: { flexDirection: "row", gap: 4, flexWrap: "wrap" },
  spineTropePill: { backgroundColor: "#f5f0ea", borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  spineTropePillText: { fontSize: 9, color: "#7a6655", fontWeight: "500" },
  starsSmall: { fontSize: 10, color: "#f59e0b" },
});
