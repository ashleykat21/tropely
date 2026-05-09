import { Feather } from "@expo/vector-icons";
import * as Haptics from "@/lib/haptics";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Animated,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { MOODS } from "@/lib/moods";
import { useStore, type Book } from "@/lib/store";

const TAB_BAR_HEIGHT = 84;
const SPINE_W = 44;
const SPINE_H = 158;
const SPINE_GAP = 4;
const SHEET_H = 430;

// ─── Shelf themes ──────────────────────────────────────────────────────────────
const THEMES = {
  darkWalnut: { id: "darkWalnut", name: "Dark Walnut",  bg: "#110C08", shelf: "#4A3322", edge: "#2E1E0E", title: "#EAD8C4", emoji: "🪵" },
  lightOak:   { id: "lightOak",   name: "Light Oak",    bg: "#F2E6CF", shelf: "#C4975A", edge: "#A87A3C", title: "#2A1808", emoji: "🌾" },
  midnight:   { id: "midnight",   name: "Midnight",     bg: "#08091A", shelf: "#1C1A30", edge: "#14122A", title: "#D4D2F0", emoji: "🌙" },
  crimson:    { id: "crimson",    name: "Crimson Den",  bg: "#130808", shelf: "#5E1616", edge: "#480E0E", title: "#EDD2D2", emoji: "🌹" },
  sage:       { id: "sage",       name: "Sage Forest",  bg: "#090E09", shelf: "#1E361E", edge: "#142814", title: "#CAEACA", emoji: "🌿" },
} as const;

type ThemeKey = keyof typeof THEMES;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const SPINE_PALETTE = ["#9B72CF","#D4874A","#5CB8C8","#52C97E","#D4A832","#BF4D5E","#7A8EBF","#C47A55","#B06090","#4A8BB0"];
function hashColor(str: string): string {
  let h = 0;
  for (const c of str) h = (h + c.charCodeAt(0)) % SPINE_PALETTE.length;
  return SPINE_PALETTE[h];
}
function spineColor(book: Book): string {
  return book.mood ? MOODS[book.mood].accent : hashColor(book.title);
}

// ─── Spine component ──────────────────────────────────────────────────────────
const TEXT_CONTAINER_W = SPINE_H;
const TEXT_CONTAINER_H = SPINE_W;
const TEXT_OFFSET = (SPINE_H - SPINE_W) / 2;

function BookSpine({ book, isSelected, onPress }: { book: Book; isSelected: boolean; onPress: () => void }) {
  const col = spineColor(book);
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.88}
      style={[
        styles.spine,
        {
          backgroundColor: col,
          shadowColor: col,
          transform: [{ translateY: isSelected ? -14 : 0 }],
        },
      ]}
    >
      {/* Side highlight strip */}
      <View style={[styles.spineHighlight, { backgroundColor: "#ffffff28" }]} />
      {/* Rotated title text */}
      <View style={{ width: SPINE_W, height: SPINE_H, overflow: "hidden" }}>
        <View
          style={{
            width: TEXT_CONTAINER_W,
            height: TEXT_CONTAINER_H,
            position: "absolute",
            top: TEXT_OFFSET,
            left: -TEXT_OFFSET,
            transform: [{ rotate: "-90deg" }],
            justifyContent: "center",
            paddingHorizontal: 8,
          }}
        >
          <Text style={styles.spineTitle} numberOfLines={1}>
            {book.title.toUpperCase()}
          </Text>
          <Text style={styles.spineAuthor} numberOfLines={1}>
            {book.author}
          </Text>
        </View>
      </View>
      {/* Mood emoji at base */}
      {book.mood && (
        <View style={styles.spineMood}>
          <Text style={{ fontSize: 9 }}>{MOODS[book.mood].emoji}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ─── Shelf section ────────────────────────────────────────────────────────────
interface ShelfSectionProps {
  label: string;
  count: number;
  books: Book[];
  theme: (typeof THEMES)[ThemeKey];
  selectedId: string | null;
  onPress: (b: Book) => void;
  onAddPress: () => void;
}

function ShelfSection({ label, count, books, theme, selectedId, onPress, onAddPress }: ShelfSectionProps) {
  return (
    <View style={{ backgroundColor: theme.bg, marginBottom: 2 }}>
      <Text style={[styles.shelfLabel, { color: theme.title + "90" }]}>
        {label}
        <Text style={{ color: theme.title + "50" }}> · {count}</Text>
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.spineRow}
      >
        {books.map((b) => (
          <BookSpine
            key={b.id}
            book={b}
            isSelected={selectedId === b.id}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onPress(b);
            }}
          />
        ))}
        {/* Add book slot */}
        <TouchableOpacity style={[styles.addSlot, { borderColor: theme.shelf }]} onPress={onAddPress}>
          <Text style={[styles.addSlotPlus, { color: theme.title + "50" }]}>+</Text>
        </TouchableOpacity>
      </ScrollView>
      {/* Wooden plank */}
      <View style={[styles.plank, { backgroundColor: theme.shelf }]}>
        <View style={[styles.plankEdge, { backgroundColor: theme.edge }]} />
        <View style={[styles.plankGroove, { backgroundColor: "#00000020" }]} />
      </View>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function LibraryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const books = useStore((s) => s.books);
  const shelfTheme = useStore((s) => s.shelfTheme) as ThemeKey;
  const setShelfTheme = useStore((s) => s.setShelfTheme);

  const reading  = books.filter((b) => b.shelf === "reading");
  const want     = books.filter((b) => b.shelf === "want");
  const finished = books.filter((b) => b.shelf === "finished");
  const paused   = books.filter((b) => b.shelf === "paused");

  const theme = THEMES[shelfTheme] ?? THEMES.darkWalnut;

  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [showThemePicker, setShowThemePicker] = useState(false);

  const slideAnim = useRef(new Animated.Value(SHEET_H + 100)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  function openBook(b: Book) {
    setSelectedBook(b);
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 60, friction: 11 }),
      Animated.timing(backdropAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  }

  function closeBook() {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: SHEET_H + 100, duration: 240, useNativeDriver: true }),
      Animated.timing(backdropAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => setSelectedBook(null));
  }

  const accent = selectedBook?.mood ? MOODS[selectedBook.mood].accent : colors.primary;
  const progress = selectedBook?.pages && selectedBook.pages > 0
    ? Math.min(selectedBook.progress / selectedBook.pages, 1) : 0;

  return (
    <View style={[styles.root, { backgroundColor: theme.bg }]}>
      {/* ── Header ── */}
      <View style={[styles.header, {
        paddingTop: Platform.OS === "web" ? 67 : insets.top + 12,
        backgroundColor: theme.bg,
      }]}>
        <View>
          <Text style={[styles.headerTitle, { color: theme.title }]}>My Library</Text>
          <Text style={[styles.headerSub, { color: theme.title + "60" }]}>
            {books.length} {books.length === 1 ? "book" : "books"} on your shelves
          </Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={[styles.headerBtn, { backgroundColor: theme.shelf + "80", borderColor: theme.shelf }]}
            onPress={() => router.push("/buddy-reads")}
          >
            <Feather name="users" size={16} color={theme.title} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerBtn, { backgroundColor: theme.shelf + "80", borderColor: theme.shelf }]}
            onPress={() => setShowThemePicker(true)}
          >
            <Text style={{ fontSize: 16 }}>🎨</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Bookshelf ── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: (Platform.OS === "web" ? 34 : insets.bottom) + TAB_BAR_HEIGHT + 20,
          paddingTop: 16,
        }}
      >
        <ShelfSection label="Currently Reading" count={reading.length} books={reading} theme={theme} selectedId={selectedBook?.id ?? null} onPress={openBook} onAddPress={() => router.push("/discover")} />
        <ShelfSection label="Want to Read" count={want.length} books={want} theme={theme} selectedId={selectedBook?.id ?? null} onPress={openBook} onAddPress={() => router.push("/discover")} />
        <ShelfSection label="Finished" count={finished.length} books={finished} theme={theme} selectedId={selectedBook?.id ?? null} onPress={openBook} onAddPress={() => router.push("/discover")} />
        {paused.length > 0 && (
          <ShelfSection label="Paused" count={paused.length} books={paused} theme={theme} selectedId={selectedBook?.id ?? null} onPress={openBook} onAddPress={() => {}} />
        )}

        {books.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={{ fontSize: 52, marginBottom: 16 }}>📚</Text>
            <Text style={[styles.emptyTitle, { color: theme.title }]}>Your shelves await</Text>
            <Text style={[styles.emptySub, { color: theme.title + "55" }]}>
              Find your next read and fill your library.
            </Text>
            <TouchableOpacity
              style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
              onPress={() => router.push("/discover")}
            >
              <Text style={styles.emptyBtnText}>Discover Books</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* ── Backdrop ── */}
      {selectedBook && (
        <Animated.View
          style={[styles.backdrop, { opacity: backdropAnim }]}
          pointerEvents="auto"
        >
          <Pressable style={{ flex: 1 }} onPress={closeBook} />
        </Animated.View>
      )}

      {/* ── Book detail sheet ── */}
      {selectedBook && (
        <Animated.View
          style={[styles.sheet, { backgroundColor: colors.card, transform: [{ translateY: slideAnim }] }]}
        >
          <View style={styles.handleRow}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
          </View>

          <View style={styles.sheetContent}>
            {/* Cover */}
            <View style={[styles.sheetCover, { backgroundColor: accent + "18", borderColor: accent + "40" }]}>
              {selectedBook.cover
                ? <Image source={{ uri: selectedBook.cover }} style={styles.sheetCoverImg} />
                : <Feather name="book" size={30} color={accent} />
              }
            </View>

            {/* Info */}
            <View style={{ flex: 1 }}>
              <Text style={[styles.sheetTitle, { color: colors.foreground }]} numberOfLines={2}>
                {selectedBook.title}
              </Text>
              <Text style={[styles.sheetAuthor, { color: colors.mutedForeground }]} numberOfLines={1}>
                {selectedBook.author}
              </Text>

              {selectedBook.mood && (
                <View style={[styles.moodPill, { backgroundColor: accent + "20", borderColor: accent + "50" }]}>
                  <Text style={{ fontSize: 12 }}>{MOODS[selectedBook.mood].emoji}</Text>
                  <Text style={[styles.moodPillText, { color: accent }]}>
                    {MOODS[selectedBook.mood].label}
                  </Text>
                </View>
              )}

              {selectedBook.pages && selectedBook.pages > 0 && (
                <View style={{ marginTop: 10 }}>
                  <View style={[styles.progressTrack, { backgroundColor: colors.muted }]}>
                    <View style={[styles.progressFill, { backgroundColor: accent, width: `${progress * 100}%` as any }]} />
                  </View>
                  <Text style={[styles.progressLabel, { color: colors.mutedForeground }]}>
                    {selectedBook.progress} / {selectedBook.pages} pages · {Math.round(progress * 100)}%
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Actions */}
          <View style={styles.sheetActions}>
            <TouchableOpacity
              style={[styles.sheetPrimary, { backgroundColor: accent }]}
              onPress={() => { closeBook(); router.push(`/book/${selectedBook.id}`); }}
            >
              <Text style={styles.sheetPrimaryText}>Full Details &amp; Options</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sheetSecondary, { borderColor: colors.border }]}
              onPress={() => {
                closeBook();
                router.push(`/companion/${encodeURIComponent(selectedBook.openLibraryKey ?? selectedBook.id)}`);
              }}
            >
              <Feather name="message-circle" size={15} color={colors.mutedForeground} />
              <Text style={[styles.sheetSecondaryText, { color: colors.mutedForeground }]}>AI Companion</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      {/* ── Theme picker modal ── */}
      <Modal visible={showThemePicker} transparent animationType="slide" onRequestClose={() => setShowThemePicker(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setShowThemePicker(false)}>
          <Pressable style={[styles.themeSheet, { backgroundColor: colors.card }]} onPress={() => {}}>
            <View style={styles.handleRow}>
              <View style={[styles.handle, { backgroundColor: colors.border }]} />
            </View>
            <Text style={[styles.themeHeading, { color: colors.foreground }]}>Shelf Theme</Text>
            <Text style={[styles.themeSub, { color: colors.mutedForeground }]}>
              Personalise the look of your bookshelf
            </Text>
            <View style={styles.themeGrid}>
              {(Object.keys(THEMES) as ThemeKey[]).map((key) => {
                const t = THEMES[key];
                const active = shelfTheme === key;
                return (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.themeOption,
                      { backgroundColor: t.bg, borderColor: active ? colors.primary : t.shelf + "CC" },
                      active && { borderWidth: 2.5 },
                    ]}
                    onPress={() => {
                      setShelfTheme(key);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                  >
                    <Text style={{ fontSize: 28, marginBottom: 6 }}>{t.emoji}</Text>
                    <Text style={[styles.themeOptionName, { color: t.title }]}>{t.name}</Text>
                    {/* mini shelf preview */}
                    <View style={[styles.miniShelf, { backgroundColor: t.shelf }]} />
                    {active && (
                      <View style={[styles.activeBadge, { backgroundColor: colors.primary }]}>
                        <Feather name="check" size={10} color="#fff" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
            <TouchableOpacity
              style={[styles.themeDone, { backgroundColor: colors.primary }]}
              onPress={() => setShowThemePicker(false)}
            >
              <Text style={styles.themeDoneText}>Done</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  header: {
    paddingHorizontal: 20, paddingBottom: 14,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
  },
  headerTitle: { fontSize: 26, fontFamily: "Inter_700Bold" },
  headerSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  headerRight: { flexDirection: "row", gap: 10 },
  headerBtn: {
    width: 40, height: 40, borderRadius: 20, borderWidth: 1,
    alignItems: "center", justifyContent: "center",
  },

  shelfLabel: {
    fontSize: 11, fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.8, textTransform: "uppercase",
    paddingHorizontal: 20, marginBottom: 10, marginTop: 16,
  },
  spineRow: {
    paddingHorizontal: 20, paddingBottom: 0,
    gap: SPINE_GAP, alignItems: "flex-end",
    minHeight: SPINE_H + 6,
  },
  spine: {
    width: SPINE_W, height: SPINE_H, borderRadius: 3,
    overflow: "hidden",
    shadowOffset: { width: 2, height: 4 }, shadowOpacity: 0.45, shadowRadius: 5,
    elevation: 5,
  },
  spineHighlight: { position: "absolute", left: 0, top: 0, bottom: 0, width: 5 },
  spineTitle: { fontSize: 8, fontFamily: "Inter_600SemiBold", color: "#ffffffDD", letterSpacing: 0.4 },
  spineAuthor: { fontSize: 6.5, fontFamily: "Inter_400Regular", color: "#ffffff66", marginTop: 3 },
  spineMood: { position: "absolute", bottom: 6, left: 0, right: 0, alignItems: "center" },
  addSlot: {
    width: SPINE_W, height: SPINE_H, borderRadius: 3,
    borderWidth: 1.5, borderStyle: "dashed",
    alignItems: "center", justifyContent: "center",
  },
  addSlotPlus: { fontSize: 22 },

  plank: { height: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.55, shadowRadius: 8, elevation: 6 },
  plankEdge: { height: 5 },
  plankGroove: { height: 1, marginTop: 2 },

  emptyState: { alignItems: "center", paddingVertical: 64, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 22, fontFamily: "Inter_700Bold", marginBottom: 8, textAlign: "center" },
  emptySub: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", marginBottom: 28 },
  emptyBtn: { paddingHorizontal: 28, paddingVertical: 13, borderRadius: 14 },
  emptyBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#fff" },

  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.65)" },
  sheet: {
    position: "absolute", bottom: 0, left: 0, right: 0, height: SHEET_H,
    borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingBottom: 24,
    shadowColor: "#000", shadowOffset: { width: 0, height: -6 }, shadowOpacity: 0.35, shadowRadius: 20, elevation: 24,
  },
  handleRow: { alignItems: "center", paddingVertical: 12 },
  handle: { width: 38, height: 4, borderRadius: 2 },
  sheetContent: { flexDirection: "row", gap: 14, paddingHorizontal: 20, paddingBottom: 18 },
  sheetCover: {
    width: 82, height: 118, borderRadius: 8, borderWidth: 1,
    alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.22, shadowRadius: 8,
  },
  sheetCoverImg: { width: 82, height: 118, borderRadius: 8 },
  sheetTitle: { fontSize: 17, fontFamily: "Inter_700Bold", lineHeight: 22, marginBottom: 4 },
  sheetAuthor: { fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: 8 },
  moodPill: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12,
    borderWidth: 1, alignSelf: "flex-start",
  },
  moodPillText: { fontSize: 11, fontFamily: "Inter_500Medium" },
  progressTrack: { height: 5, borderRadius: 3, overflow: "hidden", marginBottom: 4 },
  progressFill: { height: "100%", borderRadius: 3 },
  progressLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  sheetActions: { paddingHorizontal: 20, gap: 10 },
  sheetPrimary: { borderRadius: 14, paddingVertical: 13, alignItems: "center" },
  sheetPrimaryText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#fff" },
  sheetSecondary: {
    borderRadius: 14, paddingVertical: 12, alignItems: "center",
    borderWidth: 1, flexDirection: "row", gap: 8, justifyContent: "center",
  },
  sheetSecondaryText: { fontSize: 14, fontFamily: "Inter_500Medium" },

  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  themeSheet: { borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingBottom: 36, paddingHorizontal: 20 },
  themeHeading: { fontSize: 20, fontFamily: "Inter_700Bold", textAlign: "center", marginBottom: 4 },
  themeSub: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", marginBottom: 20 },
  themeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, justifyContent: "center" },
  themeOption: {
    width: "44%", paddingVertical: 18, paddingHorizontal: 12,
    borderRadius: 18, alignItems: "center", borderWidth: 1.5, overflow: "hidden",
  },
  themeOptionName: { fontSize: 12, fontFamily: "Inter_600SemiBold", textAlign: "center", marginBottom: 8 },
  miniShelf: { height: 6, width: "100%", borderRadius: 2 },
  activeBadge: {
    position: "absolute", top: 8, right: 8,
    width: 20, height: 20, borderRadius: 10, alignItems: "center", justifyContent: "center",
  },
  themeDone: { borderRadius: 14, paddingVertical: 14, alignItems: "center", marginTop: 20 },
  themeDoneText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#fff" },
});
