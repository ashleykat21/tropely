import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
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
import { QuickLogModal } from "@/components/QuickLogModal";
import { StreakBadge } from "@/components/StreakBadge";
import { useColors } from "@/hooks/useColors";
import { MOODS } from "@/lib/moods";
import { computeStreak } from "@/lib/streak";
import { useStore, type Book } from "@/lib/store";

// ─── Shelf themes ──────────────────────────────────────────────────────────────
const THEMES = {
  darkWalnut: { id: "darkWalnut", name: "Dark Walnut",  bg: "#0E0A06", wall: "#1A1208", shelf: "#5C3E28", edge: "#3A2415", title: "#F0DEC8", grain: "#00000025", emoji: "🪵" },
  lightOak:   { id: "lightOak",   name: "Light Oak",    bg: "#EEE2CA", wall: "#F8F0DC", shelf: "#C8A060", edge: "#A87840", title: "#2A1808", grain: "#00000018", emoji: "🌾" },
  midnight:   { id: "midnight",   name: "Midnight",     bg: "#06080F", wall: "#0C0E1E", shelf: "#1E1C32", edge: "#141228", title: "#D0CEEE", grain: "#ffffff08", emoji: "🌙" },
  crimson:    { id: "crimson",    name: "Crimson Den",  bg: "#100606", wall: "#180A0A", shelf: "#6A1818", edge: "#4E1010", title: "#EDD4D4", grain: "#00000025", emoji: "🌹" },
  sage:       { id: "sage",       name: "Sage Forest",  bg: "#060C06", wall: "#0A120A", shelf: "#22402A", edge: "#162C1C", title: "#CCEACC", grain: "#00000020", emoji: "🌿" },
} as const;
type ThemeKey = keyof typeof THEMES;

// ─── Spine helpers ────────────────────────────────────────────────────────────
const SPINE_W = 44;
const SPINE_PALETTE = ["#9B72CF","#D4874A","#5CB8C8","#52C97E","#D4A832","#BF4D5E","#7A8EBF","#C47A55","#B06090","#4A8BB0","#7DC28A","#C4A030"];
const SPINE_HEIGHTS = [152, 168, 158, 174, 148, 164, 155, 170, 145, 162, 178, 150];

function hashStr(str: string, mod: number): number {
  let h = 0;
  for (const c of str) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h % mod;
}
function spineColor(book: Book): string {
  return book.mood ? MOODS[book.mood].accent : SPINE_PALETTE[hashStr(book.title, SPINE_PALETTE.length)];
}
function spineHeight(bookId: string, idx: number): number {
  return SPINE_HEIGHTS[(hashStr(bookId, 7) + idx) % SPINE_HEIGHTS.length];
}

// ─── Single book spine ────────────────────────────────────────────────────────
function BookSpine({ book, idx, isSelected, onPress }: { book: Book; idx: number; isSelected: boolean; onPress: () => void }) {
  const col = spineColor(book);
  const h = spineHeight(book.id, idx);
  const diff = (h - SPINE_W) / 2;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      style={[
        st.spine,
        {
          width: SPINE_W,
          height: h,
          backgroundColor: col,
          shadowColor: col,
          shadowOpacity: isSelected ? 0.7 : 0.3,
          shadowRadius: isSelected ? 12 : 4,
          shadowOffset: { width: 2, height: 4 },
          elevation: isSelected ? 12 : 4,
          transform: [{ translateY: isSelected ? -22 : 0 }],
          borderTopLeftRadius: 2,
          borderTopRightRadius: 3,
        },
      ]}
    >
      {/* Left highlight (like light hitting the spine) */}
      <View style={[st.spineEdgeLight, { backgroundColor: "#ffffff20" }]} />
      {/* Right shadow edge */}
      <View style={[st.spineEdgeDark, { backgroundColor: "#00000030" }]} />

      {/* Rotated title text */}
      <View style={{ width: SPINE_W, height: h, overflow: "hidden" }}>
        <View style={{
          width: h, height: SPINE_W,
          position: "absolute",
          top: diff, left: -diff,
          transform: [{ rotate: "-90deg" }],
          justifyContent: "center",
          paddingHorizontal: 8,
        }}>
          <Text style={st.spineTitle} numberOfLines={1}>
            {book.title.toUpperCase()}
          </Text>
          <Text style={st.spineAuthor} numberOfLines={1}>
            {book.author}
          </Text>
        </View>
      </View>

      {/* Mood pip at bottom */}
      {book.mood && (
        <View style={st.spineMoodPip}>
          <Text style={{ fontSize: 9 }}>{MOODS[book.mood].emoji}</Text>
        </View>
      )}

      {/* Top gold stripe for selected */}
      {isSelected && (
        <View style={[st.spineTopStripe, { backgroundColor: "#ffffff55" }]} />
      )}
    </TouchableOpacity>
  );
}

// ─── Ghost spine (empty slot) ─────────────────────────────────────────────────
function GhostSpine({ idx, theme }: { idx: number; theme: typeof THEMES.darkWalnut }) {
  const h = SPINE_HEIGHTS[idx % SPINE_HEIGHTS.length];
  return (
    <View style={{
      width: SPINE_W, height: h, borderRadius: 3,
      borderWidth: 1, borderStyle: "dashed",
      borderColor: theme.title + "20",
      backgroundColor: theme.title + "04",
    }} />
  );
}

// ─── Add-book slot ────────────────────────────────────────────────────────────
function AddSlot({ theme, onPress }: { theme: typeof THEMES.darkWalnut; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        width: SPINE_W + 8, height: 130, borderRadius: 4,
        borderWidth: 1.5, borderStyle: "dashed",
        borderColor: theme.title + "35",
        alignItems: "center", justifyContent: "center",
        marginLeft: 4,
      }}
    >
      <Text style={{ fontSize: 22, color: theme.title + "40" }}>+</Text>
    </TouchableOpacity>
  );
}

// ─── Wooden shelf plank ───────────────────────────────────────────────────────
function Plank({ theme }: { theme: typeof THEMES.darkWalnut }) {
  return (
    <View>
      {/* Front rounded edge of shelf */}
      <View style={{ height: 7, backgroundColor: theme.edge, borderRadius: 1 }}>
        <View style={{ height: 1.5, backgroundColor: "#ffffff15", marginTop: 1 }} />
      </View>
      {/* Main shelf surface */}
      <View style={{ height: 11, backgroundColor: theme.shelf }}>
        <View style={{ height: 1, backgroundColor: theme.grain, marginTop: 3 }} />
        <View style={{ height: 1, backgroundColor: theme.grain, marginTop: 3 }} />
      </View>
      {/* Underside shadow */}
      <View style={{ height: 12, backgroundColor: "#00000060" }} />
    </View>
  );
}

// ─── One shelf row ────────────────────────────────────────────────────────────
interface ShelfRowProps {
  label: string;
  books: Book[];
  theme: typeof THEMES.darkWalnut;
  selectedId: string | null;
  onPress: (b: Book) => void;
  onAdd: () => void;
  showGhosts?: boolean;
}

function ShelfRow({ label, books, theme, selectedId, onPress, onAdd, showGhosts }: ShelfRowProps) {
  const VISIBLE_EMPTY = 5;
  return (
    <View>
      {/* Wall section above books */}
      <View style={{ backgroundColor: theme.wall, paddingTop: 20 }}>
        {/* Shelf label pinned to the wall */}
        <Text style={[st.shelfLabel, { color: theme.title + "70" }]}>
          {label}
        </Text>

        {/* Book spines row */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 18, gap: 3, alignItems: "flex-end", paddingBottom: 0, minHeight: 178 }}
        >
          {books.map((b, i) => (
            <BookSpine
              key={b.id}
              book={b}
              idx={i}
              isSelected={selectedId === b.id}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                onPress(b);
              }}
            />
          ))}

          {/* Ghost placeholders when empty */}
          {showGhosts && books.length === 0 &&
            Array.from({ length: VISIBLE_EMPTY }).map((_, i) => (
              <GhostSpine key={i} idx={i} theme={theme} />
            ))
          }

          {/* Add slot */}
          <AddSlot theme={theme} onPress={onAdd} />
        </ScrollView>
      </View>

      {/* Plank */}
      <Plank theme={theme} />
    </View>
  );
}

// ─── Now Reading card ─────────────────────────────────────────────────────────
function NowReadingCard({ book, onBump }: { book: Book; onBump: (delta: number) => void }) {
  const colors = useColors();
  const accent = book.mood ? MOODS[book.mood].accent : colors.primary;
  const pct = book.pages && book.pages > 0 ? Math.min(book.progress / book.pages, 1) : 0;
  const pagesLeft = book.pages ? Math.max(0, book.pages - book.progress) : null;

  return (
    <View style={{
      marginHorizontal: 16, marginTop: 14, marginBottom: 4,
      borderRadius: 18, padding: 14,
      backgroundColor: colors.card, borderWidth: 1, borderColor: accent + "35",
    }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        {/* Cover */}
        <View style={{ width: 50, height: 70, borderRadius: 8, backgroundColor: accent + "20",
          alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
          {book.cover
            ? <Image source={{ uri: book.cover }} style={{ width: 50, height: 70 }} resizeMode="cover" />
            : <Text style={{ fontSize: 24 }}>📚</Text>}
        </View>

        {/* Info */}
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 10, fontFamily: "Inter_600SemiBold", color: accent,
            letterSpacing: 1, textTransform: "uppercase", marginBottom: 3 }}>
            Now Reading
          </Text>
          <Text style={{ fontSize: 14, fontFamily: "Inter_700Bold", color: colors.foreground }}
            numberOfLines={1}>{book.title}</Text>
          <Text style={{ fontSize: 12, fontFamily: "Inter_400Regular", color: colors.mutedForeground, marginTop: 2, marginBottom: 8 }}>
            {book.pages
              ? `Page ${book.progress} of ${book.pages}${pagesLeft !== null && pagesLeft > 0 ? ` · ${pagesLeft} to go` : ""}`
              : book.progress > 0 ? `Page ${book.progress}` : "Not started yet"}
          </Text>
          <View style={{ height: 4, borderRadius: 2, backgroundColor: colors.muted, overflow: "hidden" }}>
            <View style={{ width: `${pct * 100}%` as any, height: 4, backgroundColor: accent, borderRadius: 2 }} />
          </View>
        </View>

        {/* Quick page bumps */}
        <View style={{ gap: 6, flexShrink: 0 }}>
          <TouchableOpacity
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onBump(10); }}
            style={{ backgroundColor: accent + "22", borderRadius: 10, paddingHorizontal: 10,
              paddingVertical: 7, borderWidth: 1, borderColor: accent + "40", alignItems: "center" }}
          >
            <Text style={{ fontSize: 12, fontFamily: "Inter_700Bold", color: accent }}>+10</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onBump(1); }}
            style={{ backgroundColor: colors.muted + "80", borderRadius: 10,
              paddingHorizontal: 10, paddingVertical: 7, alignItems: "center" }}
          >
            <Text style={{ fontSize: 12, fontFamily: "Inter_600SemiBold", color: colors.mutedForeground }}>+1</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
const SHEET_H = 460;

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colors = useColors();

  const books    = useStore((s) => s.books);
  const sessions = useStore((s) => s.sessions);
  const freeze   = useStore((s) => s.freeze);
  const shelfTheme = useStore((s) => s.shelfTheme) as ThemeKey;
  const setShelfTheme = useStore((s) => s.setShelfTheme);
  const updateProgress = useStore((s) => s.updateProgress);

  const reading  = books.filter((b) => b.shelf === "reading");
  const want     = books.filter((b) => b.shelf === "want");
  const finished = books.filter((b) => b.shelf === "finished");
  const paused   = books.filter((b) => b.shelf === "paused");

  const streak = computeStreak(sessions, freeze);
  const theme  = THEMES[shelfTheme] ?? THEMES.darkWalnut;

  const [selectedBook, setSelectedBook]     = useState<Book | null>(null);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [showLog, setShowLog]               = useState(false);

  const slideAnim   = useRef(new Animated.Value(SHEET_H + 80)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  function openBook(b: Book) {
    setSelectedBook(b);
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 58, friction: 10 }),
      Animated.timing(backdropAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
    ]).start();
  }

  function closeBook(cb?: () => void) {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: SHEET_H + 80, duration: 260, useNativeDriver: true }),
      Animated.timing(backdropAnim, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start(() => {
      setSelectedBook(null);
      cb?.();
    });
  }

  const accent   = selectedBook?.mood ? MOODS[selectedBook.mood].accent : colors.primary;
  const progress = selectedBook?.pages && selectedBook.pages > 0
    ? Math.min(selectedBook.progress / selectedBook.pages, 1) : 0;

  const TAB_BAR_HEIGHT = 84;

  return (
    <View style={[st.root, { backgroundColor: theme.bg }]}>

      {/* ── Header ── */}
      <View style={[st.header, {
        paddingTop: Platform.OS === "web" ? 67 : insets.top + 10,
        backgroundColor: theme.wall,
        borderBottomColor: theme.shelf + "80",
      }]}>
        <View>
          <Text style={[st.headerTitle, { color: theme.title }]}>Tropely</Text>
          <Text style={[st.headerSub, { color: theme.title + "60" }]}>
            {books.length === 0 ? "Your shelves await" : `${books.length} book${books.length === 1 ? "" : "s"} collected`}
          </Text>
        </View>
        <View style={st.headerRight}>
          {streak.current > 0 && (
            <View style={[st.streakPill, { backgroundColor: "#D4A83222", borderColor: "#D4A83260" }]}>
              <Text style={{ fontSize: 13 }}>🔥</Text>
              <Text style={[st.streakTxt, { color: "#D4A832" }]}>{streak.current}</Text>
            </View>
          )}
          <TouchableOpacity
            style={[st.headerBtn, { backgroundColor: theme.shelf + "80", borderColor: theme.shelf }]}
            onPress={() => setShowThemePicker(true)}
          >
            <Text style={{ fontSize: 15 }}>🎨</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[st.headerBtn, { backgroundColor: colors.primary, borderColor: colors.primary }]}
            onPress={() => router.push("/discover")}
          >
            <Feather name="plus" size={17} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Bookshelf ── */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingBottom: (Platform.OS === "web" ? 34 : insets.bottom) + TAB_BAR_HEIGHT + 16,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Now Reading quick-progress card */}
        {reading.length > 0 && (
          <NowReadingCard
            book={reading[0]}
            onBump={(delta) => updateProgress(reading[0].id, Math.min(
              reading[0].pages ?? Infinity,
              Math.max(0, reading[0].progress + delta)
            ))}
          />
        )}

        <ShelfRow
          label="📖  Currently Reading"
          books={reading}
          theme={theme}
          selectedId={selectedBook?.id ?? null}
          onPress={openBook}
          onAdd={() => router.push("/discover")}
          showGhosts
        />
        <ShelfRow
          label="🔖  Want to Read"
          books={want}
          theme={theme}
          selectedId={selectedBook?.id ?? null}
          onPress={openBook}
          onAdd={() => router.push("/discover")}
          showGhosts
        />
        <ShelfRow
          label="✅  Finished"
          books={finished}
          theme={theme}
          selectedId={selectedBook?.id ?? null}
          onPress={openBook}
          onAdd={() => router.push("/discover")}
          showGhosts
        />
        {paused.length > 0 && (
          <ShelfRow
            label="⏸  Paused"
            books={paused}
            theme={theme}
            selectedId={selectedBook?.id ?? null}
            onPress={openBook}
            onAdd={() => {}}
          />
        )}

        {/* Empty state CTA */}
        {books.length === 0 && (
          <View style={[st.emptyState, { backgroundColor: theme.wall }]}>
            <Text style={[st.emptyTitle, { color: theme.title }]}>Fill your shelves</Text>
            <Text style={[st.emptySub, { color: theme.title + "55" }]}>
              Search for a book and it'll appear on your shelf.
            </Text>
            <TouchableOpacity
              style={[st.emptyBtn, { backgroundColor: colors.primary }]}
              onPress={() => router.push("/discover")}
            >
              <Feather name="search" size={14} color="#fff" />
              <Text style={st.emptyBtnTxt}>Find Books</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* ── Backdrop ── */}
      {selectedBook && (
        <Animated.View
          style={[st.backdrop, { opacity: backdropAnim }]}
          pointerEvents="auto"
        >
          <Pressable style={{ flex: 1 }} onPress={() => closeBook()} />
        </Animated.View>
      )}

      {/* ── Book detail sheet ── */}
      {selectedBook && (
        <Animated.View style={[st.sheet, {
          backgroundColor: colors.card,
          transform: [{ translateY: slideAnim }],
        }]}>
          {/* Accent top bar matching mood */}
          <View style={[st.sheetAccentBar, { backgroundColor: accent }]} />

          {/* Handle */}
          <View style={st.handleRow}>
            <View style={[st.handle, { backgroundColor: colors.border }]} />
          </View>

          {/* Book content */}
          <View style={st.sheetBody}>
            {/* Cover */}
            <View style={[st.coverWrap, {
              backgroundColor: accent + "18",
              borderColor: accent + "50",
              shadowColor: accent,
            }]}>
              {selectedBook.cover
                ? <Image source={{ uri: selectedBook.cover }} style={st.coverImg} resizeMode="cover" />
                : (
                  <View style={[st.coverPlaceholder, { backgroundColor: accent + "15" }]}>
                    <Text style={{ fontSize: 38 }}>📚</Text>
                  </View>
                )
              }
            </View>

            {/* Info */}
            <View style={st.infoCol}>
              <Text style={[st.bookTitle, { color: colors.foreground }]} numberOfLines={3}>
                {selectedBook.title}
              </Text>
              <Text style={[st.bookAuthor, { color: colors.mutedForeground }]} numberOfLines={1}>
                {selectedBook.author}
              </Text>

              {/* Mood + shelf chips */}
              <View style={st.chipRow}>
                {selectedBook.mood && (
                  <View style={[st.chip, { backgroundColor: accent + "20", borderColor: accent + "60" }]}>
                    <Text style={{ fontSize: 11 }}>{MOODS[selectedBook.mood].emoji}</Text>
                    <Text style={[st.chipTxt, { color: accent }]}>{MOODS[selectedBook.mood].label}</Text>
                  </View>
                )}
                <View style={[st.chip, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                  <Text style={[st.chipTxt, { color: colors.mutedForeground }]}>
                    {selectedBook.shelf === "reading" ? "Reading" :
                     selectedBook.shelf === "want" ? "Want" :
                     selectedBook.shelf === "finished" ? "Finished" : "Paused"}
                  </Text>
                </View>
              </View>

              {/* Progress */}
              {selectedBook.shelf === "reading" && (
                <View style={{ marginTop: 10 }}>
                  {/* Page counter + bump buttons */}
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <TouchableOpacity
                      style={{ backgroundColor: colors.muted, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 }}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        updateProgress(selectedBook.id, Math.max(0, selectedBook.progress - 10));
                      }}
                    >
                      <Text style={{ fontSize: 12, fontFamily: "Inter_500Medium", color: colors.mutedForeground }}>−10</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{ backgroundColor: colors.muted, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 }}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        updateProgress(selectedBook.id, Math.max(0, selectedBook.progress - 1));
                      }}
                    >
                      <Text style={{ fontSize: 12, fontFamily: "Inter_500Medium", color: colors.mutedForeground }}>−1</Text>
                    </TouchableOpacity>
                    <View style={{ alignItems: "center" }}>
                      <Text style={{ fontSize: 20, fontFamily: "Inter_700Bold", color: colors.foreground }}>
                        {selectedBook.progress}
                      </Text>
                      <Text style={{ fontSize: 10, fontFamily: "Inter_400Regular", color: colors.mutedForeground }}>
                        {selectedBook.pages ? `of ${selectedBook.pages} pages` : "pages read"}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={{ backgroundColor: accent + "22", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: accent + "40" }}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        updateProgress(selectedBook.id, Math.min(selectedBook.pages ?? Infinity, selectedBook.progress + 1));
                      }}
                    >
                      <Text style={{ fontSize: 12, fontFamily: "Inter_600SemiBold", color: accent }}>+1</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{ backgroundColor: accent + "22", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: accent + "40" }}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        updateProgress(selectedBook.id, Math.min(selectedBook.pages ?? Infinity, selectedBook.progress + 10));
                      }}
                    >
                      <Text style={{ fontSize: 12, fontFamily: "Inter_700Bold", color: accent }}>+10</Text>
                    </TouchableOpacity>
                  </View>
                  {/* Progress bar */}
                  {selectedBook.pages && selectedBook.pages > 0 && (
                    <View style={[st.progressTrack, { backgroundColor: colors.muted }]}>
                      <View style={[st.progressFill, {
                        backgroundColor: accent,
                        width: `${progress * 100}%` as any,
                      }]} />
                    </View>
                  )}
                </View>
              )}
            </View>
          </View>

          {/* Action buttons */}
          <View style={st.sheetActions}>
            <TouchableOpacity
              style={[st.actionPrimary, { backgroundColor: accent }]}
              onPress={() => closeBook(() => router.push(`/book/${selectedBook.id}`))}
            >
              <Feather name="book-open" size={15} color="#fff" />
              <Text style={st.actionPrimaryTxt}>View &amp; Edit</Text>
            </TouchableOpacity>

            <View style={st.actionRow}>
              {selectedBook.shelf === "reading" && (
                <TouchableOpacity
                  style={[st.actionSecondary, { borderColor: colors.border, flex: 1 }]}
                  onPress={() => {
                    closeBook(() => setShowLog(true));
                  }}
                >
                  <Feather name="plus-circle" size={14} color={colors.mutedForeground} />
                  <Text style={[st.actionSecondaryTxt, { color: colors.mutedForeground }]}>Log</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[st.actionSecondary, { borderColor: colors.border, flex: 1 }]}
                onPress={() => closeBook(() => router.push(`/companion/${encodeURIComponent(selectedBook.openLibraryKey ?? selectedBook.id)}`))}
              >
                <Feather name="message-circle" size={14} color={colors.mutedForeground} />
                <Text style={[st.actionSecondaryTxt, { color: colors.mutedForeground }]}>Companion</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      )}

      {/* ── Quick log modal ── */}
      {showLog && selectedBook && (
        <QuickLogModal
          bookId={selectedBook.id}
          bookTitle={selectedBook.title}
          onClose={() => setShowLog(false)}
        />
      )}

      {/* ── Theme picker ── */}
      <Modal visible={showThemePicker} transparent animationType="slide" onRequestClose={() => setShowThemePicker(false)}>
        <Pressable style={st.modalBackdrop} onPress={() => setShowThemePicker(false)}>
          <Pressable style={[st.themeSheet, { backgroundColor: colors.card }]} onPress={() => {}}>
            <View style={st.handleRow}>
              <View style={[st.handle, { backgroundColor: colors.border }]} />
            </View>
            <Text style={[st.themeHeading, { color: colors.foreground }]}>Shelf Theme</Text>
            <View style={st.themeGrid}>
              {(Object.keys(THEMES) as ThemeKey[]).map((key) => {
                const t = THEMES[key];
                const active = shelfTheme === key;
                return (
                  <TouchableOpacity
                    key={key}
                    style={[st.themeCard, {
                      backgroundColor: t.bg,
                      borderColor: active ? colors.primary : t.shelf + "AA",
                      borderWidth: active ? 2.5 : 1.5,
                    }]}
                    onPress={() => {
                      setShelfTheme(key);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                  >
                    {/* Mini shelf preview */}
                    <View style={{ height: 40, backgroundColor: t.wall, borderRadius: 6, marginBottom: 8, justifyContent: "flex-end", overflow: "hidden", padding: 4 }}>
                      <View style={{ flexDirection: "row", gap: 2, alignItems: "flex-end" }}>
                        {[22, 28, 24, 30, 20, 26].map((h, i) => (
                          <View key={i} style={{ width: 6, height: h, borderRadius: 1, backgroundColor: SPINE_PALETTE[i * 2] }} />
                        ))}
                      </View>
                      <View style={{ height: 5, backgroundColor: t.shelf, marginTop: 1 }} />
                    </View>
                    <Text style={{ fontSize: 13 }}>{t.emoji}</Text>
                    <Text style={[st.themeCardName, { color: t.title }]}>{t.name}</Text>
                    {active && (
                      <View style={[st.activeCheck, { backgroundColor: colors.primary }]}>
                        <Feather name="check" size={10} color="#fff" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
            <TouchableOpacity
              style={[st.themeDone, { backgroundColor: colors.primary }]}
              onPress={() => setShowThemePicker(false)}
            >
              <Text style={st.themeDoneTxt}>Done</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const st = StyleSheet.create({
  root: { flex: 1 },

  header: {
    paddingHorizontal: 20, paddingBottom: 14,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 24, fontFamily: "Inter_700Bold" },
  headerSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  streakPill: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1,
  },
  streakTxt: { fontSize: 13, fontFamily: "Inter_700Bold" },
  headerBtn: {
    width: 38, height: 38, borderRadius: 19, borderWidth: 1,
    alignItems: "center", justifyContent: "center",
  },

  // Shelf row
  shelfLabel: {
    fontSize: 10, fontFamily: "Inter_600SemiBold",
    letterSpacing: 1, textTransform: "uppercase",
    paddingHorizontal: 20, marginBottom: 8,
  },

  // Spine parts
  spine: { overflow: "hidden" },
  spineEdgeLight: { position: "absolute", left: 0, top: 0, bottom: 0, width: 4, zIndex: 1 },
  spineEdgeDark:  { position: "absolute", right: 0, top: 0, bottom: 0, width: 3, zIndex: 1 },
  spineTitle:     { fontSize: 8, fontFamily: "Inter_700Bold", color: "#ffffffDD", letterSpacing: 0.3 },
  spineAuthor:    { fontSize: 6.5, fontFamily: "Inter_400Regular", color: "#ffffff66", marginTop: 3 },
  spineMoodPip:   { position: "absolute", bottom: 5, left: 0, right: 0, alignItems: "center" },
  spineTopStripe: { position: "absolute", top: 0, left: 0, right: 0, height: 3 },

  // Empty state
  emptyState: { alignItems: "center", paddingVertical: 48, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 20, fontFamily: "Inter_700Bold", marginBottom: 8, textAlign: "center" },
  emptySub:   { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20, marginBottom: 24 },
  emptyBtn:   { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 24, paddingVertical: 13, borderRadius: 14 },
  emptyBtnTxt: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#fff" },

  // Backdrop + sheet
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.72)" },
  sheet: {
    position: "absolute", bottom: 0, left: 0, right: 0, height: SHEET_H,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    shadowColor: "#000", shadowOffset: { width: 0, height: -8 }, shadowOpacity: 0.4, shadowRadius: 24, elevation: 30,
    overflow: "hidden",
  },
  sheetAccentBar: { height: 3, width: "100%" },
  handleRow: { alignItems: "center", paddingVertical: 12 },
  handle: { width: 40, height: 4, borderRadius: 2 },

  sheetBody: { flexDirection: "row", gap: 14, paddingHorizontal: 20, paddingBottom: 18, flex: 1 },
  coverWrap: {
    width: 88, height: 128, borderRadius: 10, borderWidth: 1,
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 8,
    overflow: "hidden",
    flexShrink: 0,
  },
  coverImg: { width: 88, height: 128 },
  coverPlaceholder: { width: 88, height: 128, alignItems: "center", justifyContent: "center" },

  infoCol: { flex: 1, justifyContent: "flex-start" },
  bookTitle:  { fontSize: 17, fontFamily: "Inter_700Bold", lineHeight: 22, marginBottom: 4 },
  bookAuthor: { fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: 10 },
  chipRow:    { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, borderWidth: 1 },
  chipTxt: { fontSize: 11, fontFamily: "Inter_500Medium" },
  progressLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  progressTrack: { height: 6, borderRadius: 3, overflow: "hidden" },
  progressFill:  { height: "100%", borderRadius: 3 },

  sheetActions: { paddingHorizontal: 20, paddingBottom: 24, gap: 10 },
  actionPrimary: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 14, paddingVertical: 14 },
  actionPrimaryTxt: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#fff" },
  actionRow: { flexDirection: "row", gap: 10 },
  actionSecondary: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 14, paddingVertical: 12, borderWidth: 1 },
  actionSecondaryTxt: { fontSize: 13, fontFamily: "Inter_500Medium" },

  // Theme picker
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.65)", justifyContent: "flex-end" },
  themeSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingBottom: 36, paddingHorizontal: 20 },
  themeHeading: { fontSize: 20, fontFamily: "Inter_700Bold", textAlign: "center", marginBottom: 18 },
  themeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, justifyContent: "center" },
  themeCard: { width: "44%", padding: 14, borderRadius: 18, alignItems: "center", overflow: "hidden" },
  themeCardName: { fontSize: 12, fontFamily: "Inter_600SemiBold", textAlign: "center", marginTop: 4 },
  activeCheck: { position: "absolute", top: 8, right: 8, width: 20, height: 20, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  themeDone: { borderRadius: 14, paddingVertical: 14, alignItems: "center", marginTop: 20 },
  themeDoneTxt: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#fff" },
});
