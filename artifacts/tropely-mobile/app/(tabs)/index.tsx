import { Feather } from "@expo/vector-icons";
import * as Haptics from "@/lib/haptics";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Animated,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StreakBadge } from "@/components/StreakBadge";
import { QuickLogModal } from "@/components/QuickLogModal";
import { useColors } from "@/hooks/useColors";
import { MOODS, MOOD_KEYS } from "@/lib/moods";
import { computeStreak } from "@/lib/streak";
import { useStore, type Book } from "@/lib/store";

// ─── Book cover card ──────────────────────────────────────────────────────────
function BookCard({
  book,
  onPress,
  size = "md",
}: {
  book: Book;
  onPress: () => void;
  size?: "sm" | "md";
}) {
  const colors = useColors();
  const accent = book.mood ? MOODS[book.mood].accent : colors.primary;
  const w = size === "sm" ? 90 : 110;
  const h = size === "sm" ? 130 : 160;
  const pct =
    book.pages && book.pages > 0
      ? Math.min(book.progress / book.pages, 1)
      : 0;

  return (
    <TouchableOpacity
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      activeOpacity={0.85}
      style={{ width: w, marginRight: 12 }}
    >
      <View
        style={{
          width: w,
          height: h,
          borderRadius: 10,
          backgroundColor: accent + "22",
          overflow: "hidden",
          borderWidth: 1,
          borderColor: accent + "30",
          shadowColor: accent,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.18,
          shadowRadius: 8,
          elevation: 4,
        }}
      >
        {book.cover ? (
          <Image
            source={{ uri: book.cover }}
            style={{ width: w, height: h }}
            resizeMode="cover"
          />
        ) : (
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              padding: 8,
            }}
          >
            <Text style={{ fontSize: 30, marginBottom: 8 }}>📚</Text>
            <Text
              style={{
                fontSize: 9,
                fontFamily: "Inter_600SemiBold",
                color: accent,
                textAlign: "center",
                lineHeight: 13,
              }}
              numberOfLines={4}
            >
              {book.title}
            </Text>
          </View>
        )}
      </View>

      {/* Progress bar for reading books */}
      {book.shelf === "reading" && book.pages && book.pages > 0 && (
        <View
          style={{
            height: 3,
            borderRadius: 2,
            backgroundColor: colors.border,
            marginTop: 5,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              width: `${pct * 100}%` as any,
              height: 3,
              backgroundColor: accent,
              borderRadius: 2,
            }}
          />
        </View>
      )}

      <Text
        style={{
          fontSize: 11,
          fontFamily: "Inter_600SemiBold",
          color: colors.foreground,
          marginTop: 5,
          lineHeight: 14,
        }}
        numberOfLines={2}
      >
        {book.title}
      </Text>
      <Text
        style={{
          fontSize: 10,
          fontFamily: "Inter_400Regular",
          color: colors.mutedForeground,
          marginTop: 2,
        }}
        numberOfLines={1}
      >
        {book.author}
      </Text>
    </TouchableOpacity>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────
function SectionHeader({
  title,
  count,
  onMore,
}: {
  title: string;
  count?: number;
  onMore?: () => void;
}) {
  const colors = useColors();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 12,
        paddingHorizontal: 20,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Text
          style={{
            fontSize: 16,
            fontFamily: "Inter_700Bold",
            color: colors.foreground,
          }}
        >
          {title}
        </Text>
        {count !== undefined && count > 0 && (
          <View
            style={{
              backgroundColor: colors.muted,
              borderRadius: 10,
              paddingHorizontal: 7,
              paddingVertical: 2,
            }}
          >
            <Text
              style={{
                fontSize: 11,
                fontFamily: "Inter_600SemiBold",
                color: colors.mutedForeground,
              }}
            >
              {count}
            </Text>
          </View>
        )}
      </View>
      {onMore && (
        <TouchableOpacity onPress={onMore}>
          <Text
            style={{
              fontSize: 13,
              fontFamily: "Inter_500Medium",
              color: colors.primary,
            }}
          >
            See all
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
const SHEET_H = 460;

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colors = useColors();

  const books = useStore((s) => s.books);
  const sessions = useStore((s) => s.sessions);
  const freeze = useStore((s) => s.freeze);
  const updateProgress = useStore((s) => s.updateProgress);

  const reading = books.filter((b) => b.shelf === "reading");
  const want = books.filter((b) => b.shelf === "want");
  const finished = books.filter((b) => b.shelf === "finished");

  const streak = computeStreak(sessions, freeze);

  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [activeMood, setActiveMood] = useState<string | null>(null);
  const [showLog, setShowLog] = useState(false);

  const slideAnim = useRef(new Animated.Value(SHEET_H + 80)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  function openBook(b: Book) {
    setSelectedBook(b);
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 58,
        friction: 10,
      }),
      Animated.timing(backdropAnim, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }

  function closeBook(cb?: () => void) {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: SHEET_H + 80,
        duration: 260,
        useNativeDriver: true,
      }),
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setSelectedBook(null);
      cb?.();
    });
  }

  const accent = selectedBook?.mood
    ? MOODS[selectedBook.mood].accent
    : colors.primary;
  const progress =
    selectedBook?.pages && selectedBook.pages > 0
      ? Math.min(selectedBook.progress / selectedBook.pages, 1)
      : 0;

  // Mood-filtered want-to-read books
  const moodWant = activeMood
    ? want.filter((b) => b.mood === activeMood)
    : want;

  // Moods that have books in want
  const availableMoods = MOOD_KEYS.filter((m) =>
    want.some((b) => b.mood === m)
  );

  const TAB_BAR_HEIGHT = 84;

  return (
    <View style={[st.root, { backgroundColor: colors.background }]}>
      {/* ── Header ── */}
      <View
        style={[
          st.header,
          {
            paddingTop:
              Platform.OS === "web" ? 20 : insets.top + 10,
            backgroundColor: colors.card,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <View>
          <Text style={[st.headerTitle, { color: colors.foreground }]}>
            Tropely
          </Text>
          <Text
            style={[st.headerSub, { color: colors.mutedForeground }]}
          >
            {books.length === 0
              ? "Start tracking your reads"
              : `${books.length} book${books.length === 1 ? "" : "s"} in your library`}
          </Text>
        </View>
        <View style={st.headerRight}>
          {streak.current > 0 && (
            <View
              style={[
                st.streakPill,
                {
                  backgroundColor: "#D4A83215",
                  borderColor: "#D4A83260",
                },
              ]}
            >
              <Text style={{ fontSize: 13 }}>🔥</Text>
              <Text style={[st.streakTxt, { color: "#D4A832" }]}>
                {streak.current}
              </Text>
            </View>
          )}
          <TouchableOpacity
            style={[
              st.addBtn,
              { backgroundColor: colors.primary },
            ]}
            onPress={() => router.push("/discover")}
          >
            <Feather name="plus" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingBottom:
            (Platform.OS === "web" ? 34 : insets.bottom) +
            TAB_BAR_HEIGHT +
            24,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Now Reading ── */}
        {reading.length > 0 && (
          <View style={{ marginTop: 24 }}>
            <SectionHeader
              title="Now Reading"
              count={reading.length}
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20 }}
            >
              {reading.map((b) => (
                <BookCard key={b.id} book={b} onPress={() => openBook(b)} />
              ))}
              <TouchableOpacity
                onPress={() => router.push("/discover")}
                style={[st.addBookSlot, { borderColor: colors.border }]}
              >
                <Feather name="plus" size={22} color={colors.mutedForeground} />
                <Text
                  style={{
                    fontSize: 11,
                    fontFamily: "Inter_500Medium",
                    color: colors.mutedForeground,
                    marginTop: 6,
                    textAlign: "center",
                  }}
                >
                  Add book
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}

        {/* ── Want to Read (with mood filter) ── */}
        {want.length > 0 && (
          <View style={{ marginTop: 28 }}>
            <SectionHeader title="Want to Read" count={want.length} />

            {/* Mood filter chips */}
            {availableMoods.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{
                  paddingHorizontal: 20,
                  gap: 8,
                  marginBottom: 14,
                }}
              >
                <TouchableOpacity
                  onPress={() => setActiveMood(null)}
                  style={[
                    st.moodChip,
                    {
                      backgroundColor:
                        activeMood === null
                          ? colors.primary
                          : colors.muted,
                      borderColor:
                        activeMood === null
                          ? colors.primary
                          : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      st.moodChipTxt,
                      {
                        color:
                          activeMood === null ? "#fff" : colors.mutedForeground,
                      },
                    ]}
                  >
                    All
                  </Text>
                </TouchableOpacity>
                {availableMoods.map((m) => {
                  const mood = MOODS[m];
                  const active = activeMood === m;
                  return (
                    <TouchableOpacity
                      key={m}
                      onPress={() => {
                        Haptics.impactAsync(
                          Haptics.ImpactFeedbackStyle.Light
                        );
                        setActiveMood(active ? null : m);
                      }}
                      style={[
                        st.moodChip,
                        {
                          backgroundColor: active
                            ? mood.accent + "22"
                            : colors.muted,
                          borderColor: active
                            ? mood.accent
                            : colors.border,
                        },
                      ]}
                    >
                      <Text style={{ fontSize: 13 }}>{mood.emoji}</Text>
                      <Text
                        style={[
                          st.moodChipTxt,
                          {
                            color: active
                              ? mood.accent
                              : colors.mutedForeground,
                          },
                        ]}
                      >
                        {mood.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20 }}
            >
              {moodWant.map((b) => (
                <BookCard
                  key={b.id}
                  book={b}
                  size="sm"
                  onPress={() => openBook(b)}
                />
              ))}
              {moodWant.length === 0 && (
                <View style={st.emptyMoodState}>
                  <Text
                    style={{
                      fontSize: 13,
                      fontFamily: "Inter_400Regular",
                      color: colors.mutedForeground,
                    }}
                  >
                    No {activeMood} books in your TBR
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        )}

        {/* ── Finished ── */}
        {finished.length > 0 && (
          <View style={{ marginTop: 28 }}>
            <SectionHeader title="Finished" count={finished.length} />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20 }}
            >
              {finished.map((b) => (
                <BookCard
                  key={b.id}
                  book={b}
                  size="sm"
                  onPress={() => openBook(b)}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* ── Empty state ── */}
        {books.length === 0 && (
          <View style={[st.emptyState, { marginTop: 60 }]}>
            <Text style={{ fontSize: 52, marginBottom: 16 }}>📚</Text>
            <Text
              style={[st.emptyTitle, { color: colors.foreground }]}
            >
              Your library awaits
            </Text>
            <Text
              style={[st.emptySub, { color: colors.mutedForeground }]}
            >
              Search for a book and tag it with a mood to get started.
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
        <Animated.View
          style={[
            st.sheet,
            {
              backgroundColor: colors.card,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={[st.sheetAccentBar, { backgroundColor: accent }]} />

          <View style={st.handleRow}>
            <View style={[st.handle, { backgroundColor: colors.border }]} />
          </View>

          <View style={st.sheetBody}>
            {/* Cover */}
            <View
              style={[
                st.coverWrap,
                {
                  backgroundColor: accent + "18",
                  borderColor: accent + "50",
                  shadowColor: accent,
                },
              ]}
            >
              {selectedBook.cover ? (
                <Image
                  source={{ uri: selectedBook.cover }}
                  style={st.coverImg}
                  resizeMode="cover"
                />
              ) : (
                <View
                  style={[
                    st.coverPlaceholder,
                    { backgroundColor: accent + "15" },
                  ]}
                >
                  <Text style={{ fontSize: 38 }}>📚</Text>
                </View>
              )}
            </View>

            {/* Info */}
            <View style={st.infoCol}>
              <Text
                style={[st.bookTitle, { color: colors.foreground }]}
                numberOfLines={3}
              >
                {selectedBook.title}
              </Text>
              <Text
                style={[st.bookAuthor, { color: colors.mutedForeground }]}
                numberOfLines={1}
              >
                {selectedBook.author}
              </Text>

              <View style={st.chipRow}>
                {selectedBook.mood && (
                  <View
                    style={[
                      st.chip,
                      {
                        backgroundColor: accent + "20",
                        borderColor: accent + "60",
                      },
                    ]}
                  >
                    <Text style={{ fontSize: 11 }}>
                      {MOODS[selectedBook.mood].emoji}
                    </Text>
                    <Text style={[st.chipTxt, { color: accent }]}>
                      {MOODS[selectedBook.mood].label}
                    </Text>
                  </View>
                )}
                <View
                  style={[
                    st.chip,
                    {
                      backgroundColor: colors.muted,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      st.chipTxt,
                      { color: colors.mutedForeground },
                    ]}
                  >
                    {selectedBook.shelf === "reading"
                      ? "Reading"
                      : selectedBook.shelf === "want"
                      ? "Want"
                      : selectedBook.shelf === "finished"
                      ? "Finished"
                      : "Paused"}
                  </Text>
                </View>
              </View>

              {/* Progress */}
              {selectedBook.shelf === "reading" && (
                <View style={{ marginTop: 10 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 8,
                    }}
                  >
                    <TouchableOpacity
                      style={{
                        backgroundColor: colors.muted,
                        borderRadius: 8,
                        paddingHorizontal: 10,
                        paddingVertical: 5,
                      }}
                      onPress={() => {
                        Haptics.impactAsync(
                          Haptics.ImpactFeedbackStyle.Light
                        );
                        updateProgress(
                          selectedBook.id,
                          Math.max(0, selectedBook.progress - 10)
                        );
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          fontFamily: "Inter_500Medium",
                          color: colors.mutedForeground,
                        }}
                      >
                        −10
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{
                        backgroundColor: colors.muted,
                        borderRadius: 8,
                        paddingHorizontal: 10,
                        paddingVertical: 5,
                      }}
                      onPress={() => {
                        Haptics.impactAsync(
                          Haptics.ImpactFeedbackStyle.Light
                        );
                        updateProgress(
                          selectedBook.id,
                          Math.max(0, selectedBook.progress - 1)
                        );
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          fontFamily: "Inter_500Medium",
                          color: colors.mutedForeground,
                        }}
                      >
                        −1
                      </Text>
                    </TouchableOpacity>
                    <View style={{ alignItems: "center" }}>
                      <Text
                        style={{
                          fontSize: 20,
                          fontFamily: "Inter_700Bold",
                          color: colors.foreground,
                        }}
                      >
                        {selectedBook.progress}
                      </Text>
                      <Text
                        style={{
                          fontSize: 10,
                          fontFamily: "Inter_400Regular",
                          color: colors.mutedForeground,
                        }}
                      >
                        {selectedBook.pages
                          ? `of ${selectedBook.pages} pages`
                          : "pages read"}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={{
                        backgroundColor: accent + "22",
                        borderRadius: 8,
                        paddingHorizontal: 10,
                        paddingVertical: 5,
                        borderWidth: 1,
                        borderColor: accent + "40",
                      }}
                      onPress={() => {
                        Haptics.impactAsync(
                          Haptics.ImpactFeedbackStyle.Light
                        );
                        updateProgress(
                          selectedBook.id,
                          Math.min(
                            selectedBook.pages ?? Infinity,
                            selectedBook.progress + 1
                          )
                        );
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          fontFamily: "Inter_600SemiBold",
                          color: accent,
                        }}
                      >
                        +1
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{
                        backgroundColor: accent + "22",
                        borderRadius: 8,
                        paddingHorizontal: 10,
                        paddingVertical: 5,
                        borderWidth: 1,
                        borderColor: accent + "40",
                      }}
                      onPress={() => {
                        Haptics.impactAsync(
                          Haptics.ImpactFeedbackStyle.Light
                        );
                        updateProgress(
                          selectedBook.id,
                          Math.min(
                            selectedBook.pages ?? Infinity,
                            selectedBook.progress + 10
                          )
                        );
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          fontFamily: "Inter_700Bold",
                          color: accent,
                        }}
                      >
                        +10
                      </Text>
                    </TouchableOpacity>
                  </View>
                  {selectedBook.pages && selectedBook.pages > 0 && (
                    <View
                      style={[
                        st.progressTrack,
                        { backgroundColor: colors.muted },
                      ]}
                    >
                      <View
                        style={[
                          st.progressFill,
                          {
                            backgroundColor: accent,
                            width: `${progress * 100}%` as any,
                          },
                        ]}
                      />
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
              onPress={() =>
                closeBook(() => router.push(`/book/${selectedBook.id}`))
              }
            >
              <Feather name="book-open" size={15} color="#fff" />
              <Text style={st.actionPrimaryTxt}>View &amp; Edit</Text>
            </TouchableOpacity>

            <View style={st.actionRow}>
              {selectedBook.shelf === "reading" && (
                <TouchableOpacity
                  style={[
                    st.actionSecondary,
                    { borderColor: colors.border, flex: 1 },
                  ]}
                  onPress={() => closeBook(() => setShowLog(true))}
                >
                  <Feather
                    name="plus-circle"
                    size={14}
                    color={colors.mutedForeground}
                  />
                  <Text
                    style={[
                      st.actionSecondaryTxt,
                      { color: colors.mutedForeground },
                    ]}
                  >
                    Log
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[
                  st.actionSecondary,
                  { borderColor: colors.border, flex: 1 },
                ]}
                onPress={() =>
                  closeBook(() =>
                    router.push(
                      `/companion/${encodeURIComponent(
                        selectedBook.openLibraryKey ?? selectedBook.id
                      )}`
                    )
                  )
                }
              >
                <Feather
                  name="message-circle"
                  size={14}
                  color={colors.mutedForeground}
                />
                <Text
                  style={[
                    st.actionSecondaryTxt,
                    { color: colors.mutedForeground },
                  ]}
                >
                  Companion
                </Text>
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
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const st = StyleSheet.create({
  root: { flex: 1 },

  header: {
    paddingHorizontal: 20,
    paddingBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 24, fontFamily: "Inter_700Bold" },
  headerSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  streakPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  streakTxt: { fontSize: 13, fontFamily: "Inter_700Bold" },
  addBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },

  addBookSlot: {
    width: 110,
    height: 160,
    borderRadius: 10,
    borderWidth: 1.5,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  moodChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  moodChipTxt: { fontSize: 12, fontFamily: "Inter_500Medium" },

  emptyMoodState: {
    width: 220,
    height: 130,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },

  emptyState: { alignItems: "center", paddingHorizontal: 40 },
  emptyTitle: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    marginBottom: 10,
    textAlign: "center",
  },
  emptySub: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 28,
  },
  emptyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 26,
    paddingVertical: 14,
    borderRadius: 14,
  },
  emptyBtnTxt: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },

  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: SHEET_H,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 30,
    overflow: "hidden",
  },
  sheetAccentBar: { height: 3, width: "100%" },
  handleRow: { alignItems: "center", paddingVertical: 12 },
  handle: { width: 40, height: 4, borderRadius: 2 },

  sheetBody: {
    flexDirection: "row",
    gap: 14,
    paddingHorizontal: 20,
    paddingBottom: 18,
    flex: 1,
  },
  coverWrap: {
    width: 88,
    height: 128,
    borderRadius: 10,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
    overflow: "hidden",
    flexShrink: 0,
  },
  coverImg: { width: 88, height: 128 },
  coverPlaceholder: {
    width: 88,
    height: 128,
    alignItems: "center",
    justifyContent: "center",
  },

  infoCol: { flex: 1, justifyContent: "flex-start" },
  bookTitle: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    lineHeight: 22,
    marginBottom: 4,
  },
  bookAuthor: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginBottom: 10,
  },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  chipTxt: { fontSize: 11, fontFamily: "Inter_500Medium" },
  progressTrack: { height: 6, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 3 },

  sheetActions: { paddingHorizontal: 20, paddingBottom: 24, gap: 10 },
  actionPrimary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    paddingVertical: 14,
  },
  actionPrimaryTxt: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
  actionRow: { flexDirection: "row", gap: 10 },
  actionSecondary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 14,
    paddingVertical: 12,
    borderWidth: 1,
  },
  actionSecondaryTxt: { fontSize: 13, fontFamily: "Inter_500Medium" },
});
