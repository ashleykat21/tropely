import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
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
import { QuickLogModal } from "@/components/QuickLogModal";
import { useColors } from "@/hooks/useColors";
import { MOODS } from "@/lib/moods";
import { computeStreak } from "@/lib/streak";
import { useStore, type Book, type Shelf } from "@/lib/store";
import type { MoodKey } from "@/constants/colors";

const TAB_BAR_HEIGHT = 84;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function moodAccent(mood: MoodKey | undefined, fallback: string): string {
  return mood ? MOODS[mood].accent : fallback;
}

function startOfDay(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

// ─── Book cover thumbnail ─────────────────────────────────────────────────────

function BookCoverThumb({
  book,
  width,
  height,
  radius,
}: {
  book: Book;
  width: number;
  height: number;
  radius?: number;
}) {
  const accent = moodAccent(book.mood, "#9E7CCC");
  const r = radius ?? 8;
  if (book.cover) {
    return (
      <Image
        source={{ uri: book.cover }}
        style={{ width, height, borderRadius: r }}
        resizeMode="cover"
      />
    );
  }
  return (
    <View
      style={{
        width,
        height,
        borderRadius: r,
        backgroundColor: accent + "25",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ fontSize: Math.max(16, width * 0.35) }}>📚</Text>
    </View>
  );
}

// ─── Current book card ────────────────────────────────────────────────────────

function CurrentBookCard({
  book,
  onLogSession,
}: {
  book: Book;
  onLogSession: () => void;
}) {
  const colors = useColors();
  const updateProgress = useStore((s) => s.updateProgress);
  const accent = moodAccent(book.mood, colors.primary);
  const pct = book.pages && book.pages > 0
    ? Math.min(Math.round((book.progress / book.pages) * 100), 100)
    : 0;
  const pagesLeft = book.pages ? Math.max(0, book.pages - book.progress) : null;

  const bump = (delta: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next = Math.max(0, book.progress + delta);
    const clamped = book.pages ? Math.min(next, book.pages) : next;
    updateProgress(book.id, clamped);
  };

  return (
    <View
      style={[
        styles.cardBase,
        {
          backgroundColor: colors.card,
          borderColor: accent + "35",
          borderWidth: 1,
          marginBottom: 4,
        },
      ]}
    >
      <View style={{ flexDirection: "row", gap: 14 }}>
        {/* Cover */}
        <View style={{ flexShrink: 0 }}>
          <BookCoverThumb book={book} width={88} height={124} radius={10} />
        </View>

        {/* Info column */}
        <View style={{ flex: 1, gap: 6 }}>
          {/* Label */}
          <Text
            style={{
              fontSize: 9,
              fontFamily: "Inter_600SemiBold",
              letterSpacing: 1.5,
              textTransform: "uppercase",
              color: colors.mutedForeground,
            }}
          >
            Currently reading
          </Text>

          {/* Title */}
          <Text
            style={{
              fontSize: 18,
              fontFamily: "Inter_700Bold",
              color: colors.foreground,
              lineHeight: 22,
            }}
            numberOfLines={2}
          >
            {book.title}
          </Text>

          {/* Author */}
          <Text
            style={{
              fontSize: 12,
              fontFamily: "Inter_400Regular",
              color: colors.mutedForeground,
              marginTop: -2,
            }}
            numberOfLines={1}
          >
            by {book.author}
          </Text>

          {/* Mood chip */}
          {book.mood && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                backgroundColor: accent + "18",
                borderColor: accent + "45",
                borderWidth: 1,
                borderRadius: 20,
                paddingHorizontal: 8,
                paddingVertical: 3,
                alignSelf: "flex-start",
              }}
            >
              <Text style={{ fontSize: 11 }}>{MOODS[book.mood].emoji}</Text>
              <Text
                style={{
                  fontSize: 10,
                  fontFamily: "Inter_500Medium",
                  color: accent,
                }}
              >
                {MOODS[book.mood].label}
              </Text>
            </View>
          )}

          {/* Progress text */}
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 2 }}>
            <Text
              style={{
                fontSize: 11,
                fontFamily: "Inter_400Regular",
                color: colors.mutedForeground,
              }}
            >
              {book.pages
                ? `Page ${book.progress} of ${book.pages}${pagesLeft ? ` · ${pagesLeft} left` : ""}`
                : book.progress > 0
                ? `Page ${book.progress}`
                : "Not started yet"}
            </Text>
            <Text
              style={{
                fontSize: 16,
                fontFamily: "Inter_700Bold",
                color: accent,
              }}
            >
              {pct}%
            </Text>
          </View>

          {/* Progress bar */}
          <View
            style={{
              height: 5,
              borderRadius: 3,
              backgroundColor: colors.muted,
              overflow: "hidden",
            }}
          >
            <View
              style={{
                width: `${pct}%`,
                height: 5,
                backgroundColor: accent,
                borderRadius: 3,
              }}
            />
          </View>
        </View>
      </View>

      {/* Action row */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          marginTop: 14,
        }}
      >
        {/* −10 / +10 pill */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            borderRadius: 20,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.background,
            overflow: "hidden",
          }}
        >
          <TouchableOpacity
            onPress={() => bump(-10)}
            style={{ paddingHorizontal: 14, paddingVertical: 9 }}
          >
            <Text
              style={{
                fontSize: 13,
                fontFamily: "Inter_500Medium",
                color: colors.mutedForeground,
              }}
            >
              −10
            </Text>
          </TouchableOpacity>
          <View
            style={{
              width: 1,
              height: 18,
              backgroundColor: colors.border,
            }}
          />
          <TouchableOpacity
            onPress={() => bump(10)}
            style={{ paddingHorizontal: 14, paddingVertical: 9 }}
          >
            <Text
              style={{
                fontSize: 13,
                fontFamily: "Inter_600SemiBold",
                color: colors.foreground,
              }}
            >
              +10
            </Text>
          </TouchableOpacity>
        </View>

        {/* Log session button */}
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onLogSession();
          }}
          style={{
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            backgroundColor: accent,
            borderRadius: 20,
            paddingVertical: 10,
          }}
        >
          <Feather name="play" size={13} color="#fff" />
          <Text
            style={{
              fontSize: 13,
              fontFamily: "Inter_600SemiBold",
              color: "#fff",
            }}
          >
            Log session
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Next-read smart card ─────────────────────────────────────────────────────

function NextReadCard({ book, onPress }: { book: Book; onPress: () => void }) {
  const colors = useColors();
  const accent = moodAccent(book.mood, colors.primary);
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.smartCard,
        {
          backgroundColor: pressed ? colors.muted : colors.card,
          borderColor: colors.border,
        },
      ]}
    >
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 10,
          backgroundColor: accent + "18",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Feather name="bookmark" size={15} color={accent} />
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 9,
            fontFamily: "Inter_500Medium",
            letterSpacing: 1.2,
            textTransform: "uppercase",
            color: colors.mutedForeground,
            marginBottom: 2,
          }}
        >
          Reading next
        </Text>
        <Text
          style={{
            fontSize: 13,
            fontFamily: "Inter_600SemiBold",
            color: colors.foreground,
          }}
          numberOfLines={1}
        >
          {book.title}
        </Text>
        <Text
          style={{
            fontSize: 11,
            fontFamily: "Inter_400Regular",
            color: colors.mutedForeground,
          }}
          numberOfLines={1}
        >
          by {book.author}
        </Text>
      </View>
      {book.cover && (
        <Image
          source={{ uri: book.cover }}
          style={{ width: 32, height: 44, borderRadius: 4, flexShrink: 0 }}
          resizeMode="cover"
        />
      )}
    </Pressable>
  );
}

// ─── Slump card ───────────────────────────────────────────────────────────────

function SlumpCard({ daysSince, bookTitle }: { daysSince: number; bookTitle?: string }) {
  const colors = useColors();
  return (
    <View style={[styles.smartCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={{ fontSize: 22, flexShrink: 0 }}>📖</Text>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 13,
            fontFamily: "Inter_600SemiBold",
            color: colors.foreground,
          }}
        >
          {daysSince >= 999
            ? "Ready when you are."
            : `${daysSince} day${daysSince === 1 ? "" : "s"} since your last session.`}
        </Text>
        {bookTitle && (
          <Text
            style={{
              fontSize: 11,
              fontFamily: "Inter_400Regular",
              color: colors.mutedForeground,
              marginTop: 2,
            }}
            numberOfLines={1}
          >
            "{bookTitle}" is waiting for you.
          </Text>
        )}
      </View>
    </View>
  );
}

// ─── Streak strip ─────────────────────────────────────────────────────────────

function StreakStrip() {
  const colors = useColors();
  const sessions = useStore((s) => s.sessions);
  const freeze = useStore((s) => s.freeze);
  const dailyGoal = useStore((s) => s.dailyGoal);

  const streak = useMemo(() => computeStreak(sessions, freeze), [sessions, freeze]);

  const last7 = useMemo(() => {
    const today = startOfDay(Date.now());
    const map = new Map<number, number>();
    for (const s of sessions) {
      const d = startOfDay(s.at);
      map.set(d, (map.get(d) ?? 0) + s.pagesRead);
    }
    return Array.from({ length: 7 }, (_, i) => {
      const day = today - (6 - i) * 86400000;
      return { day, pages: map.get(day) ?? 0 };
    });
  }, [sessions]);

  const goalPct = Math.min(1, streak.todayPages / Math.max(1, dailyGoal));
  const goalMet = streak.todayPages >= dailyGoal;
  const accentColor = "#9E7CCC";
  const maxPages = Math.max(dailyGoal, ...last7.map((d) => d.pages), 1);

  return (
    <View
      style={[
        styles.cardBase,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderWidth: 1,
          gap: 16,
        },
      ]}
    >
      {/* Row 1 — Streak + Goal */}
      <View style={{ flexDirection: "row", gap: 16 }}>
        {/* Streak */}
        <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 10 }}>
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              backgroundColor:
                streak.current > 0 ? colors.foreground : colors.muted,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontSize: 16 }}>🔥</Text>
          </View>
          <View>
            <Text
              style={{
                fontSize: 9,
                fontFamily: "Inter_500Medium",
                letterSpacing: 1.2,
                textTransform: "uppercase",
                color: colors.mutedForeground,
              }}
            >
              Streak
            </Text>
            <Text
              style={{
                fontSize: 20,
                fontFamily: "Inter_700Bold",
                color: colors.foreground,
                lineHeight: 24,
              }}
            >
              {streak.current}{" "}
              <Text
                style={{
                  fontSize: 12,
                  fontFamily: "Inter_400Regular",
                  color: colors.mutedForeground,
                }}
              >
                day{streak.current === 1 ? "" : "s"}
              </Text>
            </Text>
            <Text
              style={{
                fontSize: 10,
                fontFamily: "Inter_400Regular",
                color: colors.mutedForeground,
              }}
            >
              {streak.current > 0 ? "Keep it up." : "Start today."}
            </Text>
          </View>
        </View>

        {/* Daily goal */}
        <View style={{ flex: 1 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 6,
            }}
          >
            <Text
              style={{
                fontSize: 9,
                fontFamily: "Inter_500Medium",
                letterSpacing: 1.2,
                textTransform: "uppercase",
                color: colors.mutedForeground,
              }}
            >
              Today's goal
            </Text>
            <Text
              style={{
                fontSize: 10,
                fontFamily: "Inter_400Regular",
                color: colors.mutedForeground,
              }}
            >
              {streak.todayPages}/{dailyGoal} pg
            </Text>
          </View>
          <View
            style={{
              height: 5,
              borderRadius: 3,
              backgroundColor: colors.muted,
              overflow: "hidden",
            }}
          >
            <View
              style={{
                width: `${goalPct * 100}%`,
                height: 5,
                backgroundColor: goalMet ? accentColor : colors.foreground + "99",
                borderRadius: 3,
              }}
            />
          </View>
          <Text
            style={{
              fontSize: 10,
              fontFamily: "Inter_400Regular",
              color: goalMet ? accentColor : colors.mutedForeground,
              marginTop: 5,
            }}
          >
            {goalMet
              ? "Goal hit. Streak safe."
              : `${dailyGoal - streak.todayPages} more pages`}
          </Text>
        </View>
      </View>

      {/* Row 2 — 7-day bars */}
      <View>
        <Text
          style={{
            fontSize: 9,
            fontFamily: "Inter_500Medium",
            letterSpacing: 1.2,
            textTransform: "uppercase",
            color: colors.mutedForeground,
            marginBottom: 8,
          }}
        >
          Last 7 days
        </Text>
        <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 4, height: 40 }}>
          {last7.map((d, i) => {
            const barH = d.pages > 0
              ? Math.max(6, Math.round((d.pages / maxPages) * 36))
              : 3;
            const hit = d.pages >= dailyGoal;
            const isToday = i === 6;
            const dayLabel = new Date(d.day).toLocaleDateString(undefined, {
              weekday: "narrow",
            });
            return (
              <View
                key={d.day}
                style={{ flex: 1, alignItems: "center", gap: 3 }}
              >
                <View
                  style={{
                    width: "100%",
                    height: barH,
                    borderRadius: 3,
                    backgroundColor: hit
                      ? accentColor
                      : colors.foreground + (d.pages > 0 ? "55" : "20"),
                  }}
                />
                <Text
                  style={{
                    fontSize: 9,
                    fontFamily: isToday ? "Inter_600SemiBold" : "Inter_400Regular",
                    color: isToday ? colors.foreground : colors.mutedForeground,
                    textTransform: "uppercase",
                  }}
                >
                  {dayLabel}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

// ─── Shelves section ──────────────────────────────────────────────────────────

type ShelfTab = { key: Shelf | "dnf"; label: string };
const SHELF_TABS: ShelfTab[] = [
  { key: "reading",  label: "Reading"  },
  { key: "want",     label: "Want"     },
  { key: "paused",   label: "Paused"   },
  { key: "finished", label: "Finished" },
  { key: "dropped",  label: "DNF"      },
];

function ShelvesSection() {
  const colors = useColors();
  const router = useRouter();
  const books = useStore((s) => s.books);
  const [activeTab, setActiveTab] = useState<string>("reading");

  const shelfBooks = useMemo(
    () => books.filter((b) => b.shelf === activeTab),
    [books, activeTab]
  );

  const COVER_W = 88;
  const COVER_H = 124;

  return (
    <View style={{ gap: 12 }}>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Text
          style={{
            fontSize: 18,
            fontFamily: "Inter_700Bold",
            color: colors.foreground,
          }}
        >
          Your library
        </Text>
        <TouchableOpacity
          onPress={() => router.push("/discover")}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 16,
            backgroundColor: colors.primary,
          }}
        >
          <Feather name="plus" size={13} color="#fff" />
          <Text
            style={{
              fontSize: 12,
              fontFamily: "Inter_600SemiBold",
              color: "#fff",
            }}
          >
            Add book
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 6, paddingRight: 4 }}
      >
        {SHELF_TABS.map((t) => {
          const count = books.filter((b) => b.shelf === t.key).length;
          const active = activeTab === t.key;
          return (
            <TouchableOpacity
              key={t.key}
              onPress={() => setActiveTab(t.key)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 5,
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: active ? colors.foreground : colors.border,
                backgroundColor: active ? colors.foreground : colors.card,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontFamily: "Inter_500Medium",
                  color: active ? colors.card : colors.mutedForeground,
                }}
              >
                {t.label}
              </Text>
              {count > 0 && (
                <View
                  style={{
                    minWidth: 16,
                    height: 16,
                    borderRadius: 8,
                    backgroundColor: active
                      ? colors.card + "40"
                      : colors.muted,
                    alignItems: "center",
                    justifyContent: "center",
                    paddingHorizontal: 4,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 9,
                      fontFamily: "Inter_600SemiBold",
                      color: active ? colors.card : colors.mutedForeground,
                    }}
                  >
                    {count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Book grid */}
      {shelfBooks.length === 0 ? (
        <View
          style={{
            borderWidth: 1,
            borderStyle: "dashed",
            borderColor: colors.border,
            borderRadius: 16,
            padding: 32,
            alignItems: "center",
            gap: 8,
          }}
        >
          <Text style={{ fontSize: 28 }}>📚</Text>
          <Text
            style={{
              fontSize: 13,
              fontFamily: "Inter_500Medium",
              color: colors.mutedForeground,
              textAlign: "center",
            }}
          >
            Nothing here yet.{"\n"}Add a book to this shelf.
          </Text>
        </View>
      ) : (
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          {shelfBooks.map((b) => {
            const accent = moodAccent(b.mood, colors.primary);
            return (
              <TouchableOpacity
                key={b.id}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push(`/book/${b.id}`);
                }}
                style={{
                  width: COVER_W,
                  gap: 5,
                }}
              >
                <BookCoverThumb book={b} width={COVER_W} height={COVER_H} radius={8} />
                <Text
                  style={{
                    fontSize: 11,
                    fontFamily: "Inter_600SemiBold",
                    color: colors.foreground,
                    lineHeight: 14,
                  }}
                  numberOfLines={2}
                >
                  {b.title}
                </Text>
                <Text
                  style={{
                    fontSize: 10,
                    fontFamily: "Inter_400Regular",
                    color: colors.mutedForeground,
                  }}
                  numberOfLines={1}
                >
                  {b.author}
                </Text>
                {b.mood && (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 3,
                    }}
                  >
                    <Text style={{ fontSize: 9 }}>{MOODS[b.mood].emoji}</Text>
                    <Text
                      style={{
                        fontSize: 9,
                        fontFamily: "Inter_400Regular",
                        color: accent,
                      }}
                    >
                      {MOODS[b.mood].label}
                    </Text>
                  </View>
                )}
                {activeTab === "reading" && b.pages && b.pages > 0 && (
                  <View
                    style={{
                      height: 3,
                      borderRadius: 2,
                      backgroundColor: colors.muted,
                      overflow: "hidden",
                    }}
                  >
                    <View
                      style={{
                        width: `${Math.round((b.progress / b.pages) * 100)}%`,
                        height: 3,
                        backgroundColor: accent,
                        borderRadius: 2,
                      }}
                    />
                  </View>
                )}
                {activeTab === "finished" && b.rating && b.rating > 0 && (
                  <View style={{ flexDirection: "row", gap: 1 }}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Text
                        key={i}
                        style={{
                          fontSize: 9,
                          color: i < b.rating! ? "#D4A832" : colors.border,
                        }}
                      >
                        ★
                      </Text>
                    ))}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}

// ─── Empty home (no books at all) ────────────────────────────────────────────

function EmptyHome() {
  const colors = useColors();
  const router = useRouter();
  return (
    <View
      style={[
        styles.cardBase,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderWidth: 1,
          alignItems: "center",
          gap: 12,
          paddingVertical: 40,
        },
      ]}
    >
      <Text style={{ fontSize: 40 }}>📚</Text>
      <View style={{ alignItems: "center", gap: 4 }}>
        <Text
          style={{
            fontSize: 18,
            fontFamily: "Inter_700Bold",
            color: colors.foreground,
            textAlign: "center",
          }}
        >
          Fill your shelves
        </Text>
        <Text
          style={{
            fontSize: 13,
            fontFamily: "Inter_400Regular",
            color: colors.mutedForeground,
            textAlign: "center",
            maxWidth: 240,
            lineHeight: 18,
          }}
        >
          Search for a book and it'll appear on your shelf.
        </Text>
      </View>
      <TouchableOpacity
        onPress={() => router.push("/discover")}
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          backgroundColor: colors.primary,
          borderRadius: 20,
          paddingHorizontal: 20,
          paddingVertical: 11,
          marginTop: 4,
        }}
      >
        <Feather name="search" size={14} color="#fff" />
        <Text
          style={{
            fontSize: 14,
            fontFamily: "Inter_600SemiBold",
            color: "#fff",
          }}
        >
          Find Books
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colors = useColors();

  const books    = useStore((s) => s.books);
  const sessions = useStore((s) => s.sessions);

  const [showLog, setShowLog] = useState(false);

  const readingBook = books.find((b) => b.shelf === "reading") ?? null;

  // Slump detection
  const { daysSince, slumpBookTitle } = useMemo(() => {
    if (!sessions.length) return { daysSince: Infinity, slumpBookTitle: undefined };
    const last = Math.max(...sessions.map((s) => s.at));
    const days = Math.floor((Date.now() - last) / 86400000);
    const title = readingBook?.title;
    return { daysSince: days, slumpBookTitle: title };
  }, [sessions, readingBook]);

  const showSlump = readingBook && daysSince >= 5;

  // Next-read pick (highest priority Want book)
  const nextReadBook = useMemo(() => {
    const want = books.filter((b) => b.shelf === "want");
    if (!want.length) return null;
    return [...want].sort((a, b) => (a.addedAt > b.addedAt ? -1 : 1))[0];
  }, [books]);

  const today = new Date();
  const dateLabel = today.toLocaleDateString("en", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const hasBooks = books.length > 0;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: Platform.OS === "web" ? 72 : insets.top + 16,
          paddingBottom:
            (Platform.OS === "web" ? 34 : insets.bottom) + TAB_BAR_HEIGHT + 24,
          paddingHorizontal: 16,
          gap: 16,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={{ gap: 4, marginBottom: 4 }}>
          <Text
            style={{
              fontSize: 10,
              fontFamily: "Inter_500Medium",
              letterSpacing: 2,
              textTransform: "uppercase",
              color: colors.mutedForeground,
            }}
          >
            {dateLabel}
          </Text>
          <Text
            style={{
              fontSize: 26,
              fontFamily: "Inter_700Bold",
              color: colors.foreground,
              lineHeight: 30,
            }}
          >
            You&apos;re always living a{" "}
            <Text style={{ color: colors.primary, fontStyle: "italic" }}>
              trope
            </Text>
            .
          </Text>
          <Text
            style={{
              fontSize: 13,
              fontFamily: "Inter_400Regular",
              color: colors.mutedForeground,
              lineHeight: 18,
              maxWidth: 300,
            }}
          >
            Mood tracked as undertone on every page.
          </Text>
        </View>

        {hasBooks ? (
          <>
            {/* Current book card */}
            {readingBook && (
              <CurrentBookCard
                book={readingBook}
                onLogSession={() => setShowLog(true)}
              />
            )}

            {/* Smart contextual cards */}
            {nextReadBook && (
              <NextReadCard
                book={nextReadBook}
                onPress={() => router.push(`/book/${nextReadBook.id}`)}
              />
            )}
            {showSlump && (
              <SlumpCard
                daysSince={daysSince >= 999 ? 999 : daysSince}
                bookTitle={slumpBookTitle}
              />
            )}

            {/* Journal quick link */}
            <Pressable
              onPress={() => router.push("/journal")}
              style={({ pressed }) => [
                styles.smartCard,
                {
                  backgroundColor: pressed ? colors.muted : colors.card,
                  borderColor: colors.border,
                },
              ]}
            >
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  backgroundColor: colors.muted,
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Feather name="edit-3" size={14} color={colors.mutedForeground} />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 13,
                    fontFamily: "Inter_600SemiBold",
                    color: colors.foreground,
                  }}
                >
                  Journal
                </Text>
                <Text
                  style={{
                    fontSize: 11,
                    fontFamily: "Inter_400Regular",
                    color: colors.mutedForeground,
                  }}
                >
                  Notes, quotes & reflections
                </Text>
              </View>
              <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
            </Pressable>

            {/* Streak strip */}
            <StreakStrip />

            {/* Shelves */}
            <ShelvesSection />
          </>
        ) : (
          <EmptyHome />
        )}
      </ScrollView>

      {/* Session log modal */}
      {showLog && readingBook && (
        <QuickLogModal
          bookId={readingBook.id}
          bookTitle={readingBook.title}
          onClose={() => setShowLog(false)}
        />
      )}
    </View>
  );
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  cardBase: {
    borderRadius: 20,
    padding: 16,
  },
  smartCard: {
    borderRadius: 16,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
  },
});
