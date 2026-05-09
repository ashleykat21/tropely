import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Image,
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

const TAB_BAR_HEIGHT = 84;
const COLS = 3;
const GRID_GAP = 10;

const STEPS = [
  {
    n: "1",
    title: "Add a book",
    body: "Search by title or author. Pick the mood it's giving you.",
  },
  {
    n: "2",
    title: "Log how it feels",
    body: "Quick reactions, notes, and short sessions — no rating required.",
  },
  {
    n: "3",
    title: "See your signature",
    body: "Streaks, mood pulse, and a yearly Wrap will start appearing.",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function startOfDay(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

// ─── Book cover ───────────────────────────────────────────────────────────────

function BookCover({
  book,
  width = 80,
  height = 112,
}: {
  book: Book;
  width?: number;
  height?: number;
}) {
  const C = useColors();
  const accent = book.mood ? MOODS[book.mood].accent : C.moodStrong;
  if (book.cover) {
    return (
      <Image
        source={{ uri: book.cover }}
        style={{ width, height, borderRadius: 8 }}
        resizeMode="cover"
      />
    );
  }
  return (
    <View
      style={{
        width,
        height,
        borderRadius: 8,
        backgroundColor: accent + "28",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ fontSize: Math.max(16, width * 0.3) }}>📚</Text>
    </View>
  );
}

// ─── Empty home (no books) ────────────────────────────────────────────────────

function EmptyHome() {
  const C = useColors();
  const router = useRouter();
  const onboarded = useStore((s) => s.onboarded);

  return (
    <View style={{ gap: 16 }}>
      {/* Welcome banner — shown on first launch */}
      {!onboarded && (
        <View
          style={[
            styles.welcomeBanner,
            { backgroundColor: C.card, borderColor: C.border + "80" },
          ]}
        >
          <Text style={{ fontSize: 18 }}>🎉</Text>
          <View style={{ flex: 1, gap: 3 }}>
            <Text
              style={{
                fontSize: 13,
                fontFamily: "DMSans_500Medium",
                color: C.foreground,
              }}
            >
              Welcome to Tropely!
            </Text>
            <Text
              style={{
                fontSize: 12,
                fontFamily: "DMSans_400Regular",
                color: C.mutedForeground,
                lineHeight: 18,
              }}
            >
              Add a book below to get started. After your first few books,
              we'll ask about your reading moods to personalise everything.
            </Text>
          </View>
        </View>
      )}

      {/* Hero card — mood-surface gradient */}
      <LinearGradient
        colors={["#C8E6E6", "#EAF3F3", C.card]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.heroCard, { borderColor: C.border + "66" }]}
      >
        {/* "Your shelf is empty" pill badge */}
        <View
          style={[
            styles.badge,
            {
              borderColor: C.border + "99",
              backgroundColor: "rgba(255,255,255,0.65)",
            },
          ]}
        >
          <Text style={{ fontSize: 11 }}>📚</Text>
          <Text
            style={{
              fontSize: 10,
              fontFamily: "DMSans_400Regular",
              color: C.mutedForeground,
              letterSpacing: 1.4,
              textTransform: "uppercase",
            }}
          >
            Your shelf is empty
          </Text>
        </View>

        {/* Headline — Fraunces serif, 28px */}
        <Text
          style={{
            fontFamily: "Fraunces_400Regular",
            fontSize: 28,
            color: C.foreground,
            lineHeight: 35,
            letterSpacing: -0.5,
            marginTop: 16,
          }}
        >
          Add your first book and{"\n"}
          <Text
            style={{
              fontFamily: "Fraunces_400Regular_Italic",
              color: C.moodStrong,
            }}
          >
            find your tropes
          </Text>
          .
        </Text>

        {/* Body */}
        <Text
          style={{
            fontSize: 14,
            fontFamily: "DMSans_400Regular",
            color: C.mutedForeground,
            lineHeight: 21,
            marginTop: 10,
          }}
        >
          Every story has a shape. Add books, tag your tropes, and the mood
          underneath will surface — building a fingerprint only you could have.
        </Text>

        {/* CTA buttons */}
        <View style={styles.heroButtons}>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/discover")}
            style={[styles.btnFilled, { backgroundColor: C.foreground }]}
            activeOpacity={0.85}
          >
            <Feather name="plus" size={14} color={C.background} />
            <Text
              style={{
                fontSize: 14,
                fontFamily: "DMSans_500Medium",
                color: C.background,
              }}
            >
              Add a book
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/discover")}
            style={[
              styles.btnOutline,
              { borderColor: C.border, backgroundColor: "rgba(255,255,255,0.5)" },
            ]}
            activeOpacity={0.7}
          >
            <Feather name="compass" size={14} color={C.foreground} />
            <Text
              style={{
                fontSize: 14,
                fontFamily: "DMSans_400Regular",
                color: C.foreground,
              }}
            >
              Browse Discover
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* 3-column step cards — matches Feltly's sm:grid-cols-3 */}
      <StepCards />
    </View>
  );
}

function StepCards() {
  const C = useColors();
  return (
    <View style={{ flexDirection: "row", gap: GRID_GAP }}>
      {STEPS.map((step) => (
        <View
          key={step.n}
          style={[
            styles.stepCard,
            { flex: 1, backgroundColor: C.card + "B3", borderColor: C.border + "80" },
          ]}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              marginBottom: 8,
            }}
          >
            <View
              style={[styles.stepBadge, { backgroundColor: C.foreground }]}
            >
              <Text
                style={{
                  fontSize: 10,
                  fontFamily: "DMSans_500Medium",
                  color: C.background,
                }}
              >
                {step.n}
              </Text>
            </View>
            <Text style={{ fontSize: 11 }}>✨</Text>
          </View>
          <Text
            style={{
              fontSize: 14,
              fontFamily: "Fraunces_400Regular",
              color: C.foreground,
              lineHeight: 18,
              marginBottom: 5,
            }}
          >
            {step.title}
          </Text>
          <Text
            style={{
              fontSize: 11,
              fontFamily: "DMSans_400Regular",
              color: C.mutedForeground,
              lineHeight: 16,
            }}
          >
            {step.body}
          </Text>
        </View>
      ))}
    </View>
  );
}

// ─── Home smart cards (context-aware nudges) ──────────────────────────────────

function SlumpCard({ currentBook }: { currentBook: Book | undefined }) {
  const sessions = useStore((s) => s.sessions);
  const books = useStore((s) => s.books);
  const C = useColors();
  const router = useRouter();

  const daysSince = useMemo(() => {
    if (!sessions.length) return Infinity;
    const last = Math.max(...sessions.map((s) => s.at));
    return Math.floor((Date.now() - last) / (1000 * 60 * 60 * 24));
  }, [sessions]);

  const hasReading = books.some((b) => b.shelf === "reading");
  if (!hasReading || daysSince < 5) return null;

  return (
    <TouchableOpacity
      onPress={() => currentBook && router.push(`/book/${currentBook.id}`)}
      style={[styles.smartCard, { backgroundColor: C.card + "99", borderColor: C.border + "80" }]}
      activeOpacity={0.75}
    >
      <Text style={{ fontSize: 20, lineHeight: 24 }}>📖</Text>
      <View style={{ flex: 1, gap: 2 }}>
        <Text
          style={{
            fontSize: 13,
            fontFamily: "Fraunces_400Regular",
            color: C.foreground,
            lineHeight: 17,
          }}
        >
          {daysSince === Infinity
            ? "Ready when you are."
            : `${daysSince} day${daysSince === 1 ? "" : "s"} since your last session.`}
        </Text>
        <Text
          style={{
            fontSize: 12,
            fontFamily: "DMSans_400Regular",
            color: C.mutedForeground,
          }}
          numberOfLines={1}
        >
          {currentBook
            ? `"${currentBook.title}" is waiting for you.`
            : "Your book is waiting."}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

function MoodTBRCard({ currentBook }: { currentBook: Book | undefined }) {
  const books = useStore((s) => s.books);
  const C = useColors();
  const router = useRouter();

  const suggestion = useMemo(() => {
    const tbr = books.filter((b) => b.shelf === "want");
    if (!tbr.length) return null;
    if (currentBook) {
      const match = tbr.find((b) => b.mood === currentBook.mood);
      if (match) {
        return {
          book: match,
          reason: currentBook.mood
            ? `matches your ${MOODS[currentBook.mood].label} mood`
            : "next on your shelf",
        };
      }
    }
    const recent = [...tbr].sort((a, b) => b.addedAt - a.addedAt)[0];
    return { book: recent, reason: "next on your shelf" };
  }, [books, currentBook]);

  if (!suggestion) return null;

  return (
    <TouchableOpacity
      onPress={() => router.push(`/book/${suggestion.book.id}`)}
      style={[
        styles.smartCard,
        { backgroundColor: C.card + "99", borderColor: C.border + "80" },
      ]}
      activeOpacity={0.75}
    >
      <Feather name="compass" size={16} color={C.mutedForeground} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text
          style={{
            fontSize: 10,
            fontFamily: "DMSans_400Regular",
            color: C.mutedForeground,
            textTransform: "uppercase",
            letterSpacing: 1.5,
          }}
        >
          Consider reading next
        </Text>
        <Text
          style={{
            fontSize: 13,
            fontFamily: "Fraunces_400Regular",
            color: C.foreground,
            lineHeight: 17,
          }}
          numberOfLines={1}
        >
          {suggestion.book.title}
        </Text>
        <Text
          style={{
            fontSize: 11,
            fontFamily: "DMSans_400Regular",
            color: C.mutedForeground,
          }}
          numberOfLines={1}
        >
          {suggestion.reason}
        </Text>
      </View>
      {suggestion.book.cover && (
        <Image
          source={{ uri: suggestion.book.cover }}
          style={{ width: 32, height: 46, borderRadius: 4 }}
          resizeMode="cover"
        />
      )}
    </TouchableOpacity>
  );
}

function HomeSmartCards({ currentBook }: { currentBook: Book | undefined }) {
  return (
    <View style={{ gap: 8 }}>
      <MoodTBRCard currentBook={currentBook} />
      <SlumpCard currentBook={currentBook} />
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
  const C = useColors();
  const updateProgress = useStore((s) => s.updateProgress);
  const accent = book.mood ? MOODS[book.mood].accent : C.moodStrong;
  const moodH = 180; // default teal hue — matches Feltly's default mood-h
  const pct =
    book.pages && book.pages > 0
      ? Math.min(Math.round((book.progress / book.pages) * 100), 100)
      : 0;
  const pagesLeft = book.pages ? Math.max(0, book.pages - book.progress) : null;

  const bump = (delta: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next = Math.max(0, book.progress + delta);
    const clamped = book.pages ? Math.min(next, book.pages) : next;
    updateProgress(book.id, clamped);
  };

  // Mood-surface: diagonal gradient from lighter mood tint → card cream
  // approximating Feltly's radial gradient mood-surface
  const gradStart = `hsl(${moodH}, 35%, 88%)`;
  const gradEnd = C.card;

  return (
    <LinearGradient
      colors={[gradStart as any, gradEnd as any]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.currentCard, { borderColor: accent + "30" }]}
    >
      {/* Currently reading label */}
      <Text
        style={{
          fontSize: 9,
          fontFamily: "DMSans_400Regular",
          letterSpacing: 2,
          textTransform: "uppercase",
          color: C.mutedForeground,
          marginBottom: 14,
        }}
      >
        Currently reading
      </Text>

      <View style={{ flexDirection: "row", gap: 16 }}>
        {/* Cover */}
        <View style={{ flexShrink: 0 }}>
          <BookCover book={book} width={88} height={124} />
        </View>

        {/* Info column */}
        <View style={{ flex: 1, gap: 6 }}>
          {/* Mood chip */}
          {book.mood && (
            <View
              style={[
                styles.moodChip,
                {
                  backgroundColor: accent + "18",
                  borderColor: accent + "40",
                },
              ]}
            >
              <Text style={{ fontSize: 11 }}>{MOODS[book.mood].emoji}</Text>
              <Text
                style={{
                  fontSize: 10,
                  fontFamily: "DMSans_500Medium",
                  color: accent,
                }}
              >
                {MOODS[book.mood].label}
              </Text>
            </View>
          )}

          {/* Title — Fraunces serif */}
          <Text
            style={{
              fontSize: 20,
              fontFamily: "Fraunces_400Regular",
              color: C.foreground,
              lineHeight: 24,
              letterSpacing: -0.3,
            }}
            numberOfLines={2}
          >
            {book.title}
          </Text>

          {/* Author */}
          <Text
            style={{
              fontSize: 12,
              fontFamily: "DMSans_400Regular",
              color: C.mutedForeground,
            }}
            numberOfLines={1}
          >
            by {book.author}
          </Text>

          {/* Mood undertone — matches Feltly's italic sub-line */}
          {book.mood && (
            <Text
              style={{
                fontSize: 10,
                fontFamily: "DMSans_400Regular",
                color: C.mutedForeground,
                opacity: 0.7,
              }}
            >
              {MOODS[book.mood].emoji} {MOODS[book.mood].label} · mood undertone
            </Text>
          )}

          {/* Progress numbers */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-end",
              justifyContent: "space-between",
              marginTop: 2,
            }}
          >
            <Text
              style={{
                fontSize: 11,
                fontFamily: "DMSans_400Regular",
                color: C.mutedForeground,
                flex: 1,
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
                fontSize: 22,
                fontFamily: "Fraunces_400Regular",
                color: accent,
                lineHeight: 24,
              }}
            >
              {pct}%
            </Text>
          </View>

          {/* Progress bar */}
          <View
            style={{
              height: 6,
              borderRadius: 3,
              backgroundColor: "rgba(255,255,255,0.5)",
              overflow: "hidden",
            }}
          >
            <View
              style={{
                width: `${pct}%`,
                height: 6,
                backgroundColor: accent,
                borderRadius: 3,
              }}
            />
          </View>
        </View>
      </View>

      {/* ±10 bumps + Log session — matches Feltly's progress action row */}
      <View style={styles.progressActions}>
        <View
          style={[
            styles.bumpGroup,
            {
              backgroundColor: "rgba(255,255,255,0.6)",
              borderColor: C.border,
            },
          ]}
        >
          <TouchableOpacity style={styles.bumpBtn} onPress={() => bump(-10)}>
            <Feather name="minus" size={15} color={C.foreground} />
          </TouchableOpacity>
          <Text
            style={{
              fontSize: 10,
              fontFamily: "DMSans_400Regular",
              color: C.mutedForeground,
              paddingHorizontal: 4,
            }}
          >
            ±10
          </Text>
          <TouchableOpacity style={styles.bumpBtn} onPress={() => bump(10)}>
            <Feather name="plus" size={15} color={C.foreground} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          onPress={onLogSession}
          style={[styles.logBtn, { backgroundColor: C.moodStrong }]}
          activeOpacity={0.85}
        >
          <Feather name="play" size={13} color="#fff" />
          <Text
            style={{
              fontSize: 13,
              fontFamily: "DMSans_500Medium",
              color: "#fff",
            }}
          >
            Log session
          </Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

// ─── Journal quick-link row ───────────────────────────────────────────────────

function JournalLink() {
  const C = useColors();
  const router = useRouter();
  return (
    <TouchableOpacity
      onPress={() => router.push("/(tabs)/journal")}
      style={[
        styles.journalLink,
        { backgroundColor: C.card + "B3", borderColor: C.border + "80" },
      ]}
      activeOpacity={0.75}
    >
      <View
        style={[
          styles.journalIconBox,
          { backgroundColor: C.foreground + "0D" },
        ]}
      >
        <Feather name="edit-3" size={14} color={C.foreground} />
      </View>
      <View style={{ flex: 1, gap: 1 }}>
        <Text
          style={{
            fontSize: 13,
            fontFamily: "Fraunces_400Regular",
            color: C.foreground,
          }}
        >
          Journal
        </Text>
        <Text
          style={{
            fontSize: 11,
            fontFamily: "DMSans_400Regular",
            color: C.mutedForeground,
          }}
        >
          Notes, quotes & reflections
        </Text>
      </View>
      <Feather name="chevron-right" size={16} color={C.mutedForeground} />
    </TouchableOpacity>
  );
}

// ─── Streak strip ─────────────────────────────────────────────────────────────

function StreakStrip() {
  const C = useColors();
  const sessions = useStore((s) => s.sessions);
  const dailyGoal = useStore((s) => s.dailyGoal ?? 20);
  const freeze = useStore((s) => s.freeze);

  const streak = useMemo(
    () => computeStreak(sessions, freeze),
    [sessions, freeze]
  );

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

  const goalPct = Math.min(1, streak.todayPages / dailyGoal);
  const goalMet = streak.todayPages >= dailyGoal;
  const maxPages = Math.max(dailyGoal, ...last7.map((x) => x.pages), 1);

  return (
    <View
      style={[
        styles.streakCard,
        { backgroundColor: C.card + "CC", borderColor: C.border + "80" },
      ]}
    >
      {/* ── Streak count row ── */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <View
          style={[
            styles.streakIcon,
            {
              backgroundColor: streak.current > 0 ? C.foreground : C.muted,
            },
          ]}
        >
          <Text style={{ fontSize: 15 }}>🔥</Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Text
              style={{
                fontSize: 9,
                fontFamily: "DMSans_400Regular",
                color: C.mutedForeground,
                letterSpacing: 2,
                textTransform: "uppercase",
              }}
            >
              Streak
            </Text>
          </View>
          <Text
            style={{
              fontSize: 21,
              fontFamily: "Fraunces_400Regular",
              color: C.foreground,
              lineHeight: 26,
            }}
          >
            {streak.current}{" "}
            <Text
              style={{
                fontSize: 13,
                fontFamily: "DMSans_400Regular",
                color: C.mutedForeground,
              }}
            >
              day{streak.current === 1 ? "" : "s"}
            </Text>
          </Text>
          <Text
            style={{
              fontSize: 11,
              fontFamily: "DMSans_400Regular",
              color: C.mutedForeground,
              marginTop: 1,
            }}
          >
            {streak.freezeSavedToday
              ? "A freeze covered yesterday — you're safe."
              : streak.longest > streak.current
                ? `Best: ${streak.longest} days`
                : streak.current > 0
                  ? "Personal best — keep going."
                  : "Log a session today to start one."}
          </Text>
        </View>
      </View>

      {/* ── Daily goal bar ── */}
      <View style={styles.streakDivider} />
      <View>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 6,
          }}
        >
          <Text
            style={{
              fontSize: 9,
              fontFamily: "DMSans_400Regular",
              color: C.mutedForeground,
              textTransform: "uppercase",
              letterSpacing: 1.5,
            }}
          >
            🎯  Today's goal
          </Text>
          <Text
            style={{
              fontSize: 11,
              fontFamily: "DMSans_400Regular",
              color: C.mutedForeground,
            }}
          >
            {streak.todayPages} / {dailyGoal} pages
          </Text>
        </View>
        <View
          style={{
            height: 6,
            borderRadius: 3,
            backgroundColor: C.muted,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              width: `${goalPct * 100}%`,
              height: 6,
              borderRadius: 3,
              backgroundColor: goalMet ? C.moodStrong : C.foreground + "99",
            }}
          />
        </View>
        <Text
          style={{
            fontSize: 11,
            fontFamily: "DMSans_400Regular",
            color: goalMet ? C.foreground : C.mutedForeground,
            marginTop: 5,
          }}
        >
          {goalMet
            ? "Goal hit. Streak safe for today."
            : `${dailyGoal - streak.todayPages} more pages to lock in today.`}
        </Text>
      </View>

      {/* ── 7-day mini bar chart ── */}
      <View style={styles.streakDivider} />
      <View>
        <Text
          style={{
            fontSize: 9,
            fontFamily: "DMSans_400Regular",
            color: C.mutedForeground,
            textTransform: "uppercase",
            letterSpacing: 1.5,
            marginBottom: 10,
          }}
        >
          📅  Last 7 days
        </Text>
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-end",
            height: 44,
            gap: 4,
          }}
        >
          {last7.map((d, i) => {
            const barH = d.pages > 0 ? Math.max((d.pages / maxPages) * 44, 8) : 4;
            const hit = d.pages >= dailyGoal;
            const isToday = i === 6;
            const dayLabel = new Date(d.day).toLocaleDateString(undefined, {
              weekday: "narrow",
            });
            return (
              <View
                key={d.day}
                style={{ flex: 1, alignItems: "center", gap: 4, justifyContent: "flex-end" }}
              >
                <View
                  style={{
                    width: "100%",
                    height: barH,
                    borderRadius: 3,
                    backgroundColor: hit
                      ? C.moodStrong
                      : C.foreground + (d.pages > 0 ? "40" : "1A"),
                  }}
                />
                <Text
                  style={{
                    fontSize: 9,
                    fontFamily: isToday ? "DMSans_500Medium" : "DMSans_400Regular",
                    color: isToday ? C.foreground : C.mutedForeground,
                    letterSpacing: 0.5,
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

const SHELF_TABS: { key: Shelf; label: string }[] = [
  { key: "reading", label: "Reading" },
  { key: "want", label: "Want" },
  { key: "paused", label: "Paused" },
  { key: "finished", label: "Finished" },
  { key: "dropped", label: "DNF" },
];

function ShelvesSection() {
  const C = useColors();
  const router = useRouter();
  const books = useStore((s) => s.books);
  const reflections = useStore((s) => s.reflections);
  const [activeTab, setActiveTab] = useState<Shelf>("reading");

  const shelfBooks = books.filter((b) => b.shelf === activeTab);
  const coverW = Math.floor((310 - GRID_GAP * (COLS - 1)) / COLS);
  const coverH = Math.floor(coverW * 1.42);

  const ratingMap = useMemo(() => {
    const m = new Map<string, number>();
    reflections.forEach((r) => { if (r.rating != null) m.set(r.bookId, r.rating); });
    return m;
  }, [reflections]);

  return (
    <View style={{ gap: 14 }}>
      {/* "Your library" heading — matches Feltly's font-display text-2xl */}
      <Text
        style={{
          fontSize: 22,
          fontFamily: "Fraunces_400Regular",
          color: C.foreground,
          letterSpacing: -0.3,
        }}
      >
        Your library
      </Text>

      {/* Tab row — scrollable pill chips inside a bordered container */}
      <View
        style={[
          styles.tabContainer,
          { backgroundColor: C.card + "CC", borderColor: C.border + "99" },
        ]}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 2 }}
        >
          {SHELF_TABS.map((tab) => {
            const active = activeTab === tab.key;
            const count = books.filter((b) => b.shelf === tab.key).length;
            return (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                style={[
                  styles.shelfTab,
                  {
                    backgroundColor: active ? C.foreground : "transparent",
                  },
                ]}
                activeOpacity={0.8}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontFamily: "DMSans_500Medium",
                    color: active ? C.background : C.mutedForeground,
                  }}
                >
                  {tab.label}
                </Text>
                {count > 0 && (
                  <View
                    style={[
                      styles.countBadge,
                      {
                        backgroundColor: active
                          ? "rgba(255,255,255,0.22)"
                          : C.muted,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        fontSize: 10,
                        fontFamily: "DMSans_400Regular",
                        color: active ? C.background : C.mutedForeground,
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
      </View>

      {/* Books grid or empty */}
      {shelfBooks.length === 0 ? (
        <View
          style={[
            styles.shelfEmpty,
            { backgroundColor: C.card + "80", borderColor: C.border + "60", borderStyle: "dashed" },
          ]}
        >
          <Text
            style={{
              fontSize: 12,
              fontFamily: "DMSans_400Regular",
              color: C.mutedForeground,
              textAlign: "center",
              lineHeight: 18,
            }}
          >
            Nothing here yet.{"\n"}Add a book to this shelf.
          </Text>
        </View>
      ) : (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: GRID_GAP }}>
          {shelfBooks.map((b) => {
            const accent = b.mood ? MOODS[b.mood].accent : C.moodStrong;
            const rating = ratingMap.get(b.id);
            return (
              <TouchableOpacity
                key={b.id}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push(`/book/${b.id}`);
                }}
                style={{ width: coverW, gap: 5 }}
                activeOpacity={0.8}
              >
                <View
                  style={{
                    borderRadius: 10,
                    overflow: "hidden",
                    padding: 4,
                    backgroundColor: "rgba(255,255,255,0.4)",
                  }}
                >
                  <BookCover book={b} width={coverW - 8} height={coverH - 8} />
                </View>
                <Text
                  style={{
                    fontSize: 11,
                    fontFamily: "Fraunces_400Regular",
                    color: C.foreground,
                    lineHeight: 14,
                  }}
                  numberOfLines={2}
                >
                  {b.title}
                </Text>
                <Text
                  style={{
                    fontSize: 10,
                    fontFamily: "DMSans_400Regular",
                    color: C.mutedForeground,
                  }}
                  numberOfLines={1}
                >
                  {b.author}
                </Text>
                {b.mood && (
                  <Text
                    style={{
                      fontSize: 9,
                      fontFamily: "DMSans_400Regular",
                      color: C.mutedForeground,
                      opacity: 0.7,
                    }}
                  >
                    {MOODS[b.mood].emoji} {MOODS[b.mood].label}
                  </Text>
                )}
                {activeTab === "reading" && b.pages && b.pages > 0 && (
                  <View
                    style={{
                      height: 3,
                      borderRadius: 2,
                      backgroundColor: C.muted,
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
                {activeTab === "finished" && rating != null && rating > 0 && (
                  <View style={{ flexDirection: "row", gap: 1 }}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Text
                        key={i}
                        style={{ fontSize: 9, color: i < rating ? "#C49A28" : C.border }}
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

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const C = useColors();
  const router = useRouter();
  const books = useStore((s) => s.books);
  const sessions = useStore((s) => s.sessions);
  const freeze = useStore((s) => s.freeze);
  const [logOpen, setLogOpen] = useState(false);

  const hasBooks = books.length > 0;
  const currentBook = books.find((b) => b.shelf === "reading") ?? books[0];

  const streak = useMemo(() => computeStreak(sessions, freeze), [sessions, freeze]);

  return (
    <View style={{ flex: 1, backgroundColor: C.background }}>
      {/* ── Sticky top header ── */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 4,
            backgroundColor: C.background + "E6",
            borderBottomColor: C.border + "66",
          },
        ]}
      >
        <Text
          style={{
            fontSize: 17,
            fontFamily: "Fraunces_600SemiBold",
            color: C.foreground,
            letterSpacing: -0.4,
          }}
        >
          Tropely
        </Text>
        <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
          {/* Streak pill — matches Feltly's header streak badge */}
          {streak.current > 0 && (
            <View
              style={[
                styles.streakPill,
                { borderColor: C.border + "99", backgroundColor: C.card + "B3" },
              ]}
            >
              <Text style={{ fontSize: 11 }}>🔥</Text>
              <Text
                style={{
                  fontSize: 12,
                  fontFamily: "DMSans_500Medium",
                  color: C.foreground,
                }}
              >
                {streak.current}
              </Text>
            </View>
          )}
          {/* Journal icon */}
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/journal")}
            style={[
              styles.headerIconBtn,
              { borderColor: C.border + "99", backgroundColor: C.card + "B3" },
            ]}
            activeOpacity={0.7}
          >
            <Feather name="edit-3" size={16} color={C.mutedForeground} />
          </TouchableOpacity>
          {/* Log button — shown when there are books */}
          {hasBooks && (
            <TouchableOpacity
              onPress={() => setLogOpen(true)}
              style={[styles.logHeaderBtn, { backgroundColor: C.foreground }]}
              activeOpacity={0.85}
            >
              <Feather name="plus" size={13} color={C.background} />
              <Text
                style={{
                  fontSize: 12,
                  fontFamily: "DMSans_500Medium",
                  color: C.background,
                }}
              >
                Log
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Journal prompt strip — matches Feltly's AppShell journal strip ── */}
      <TouchableOpacity
        onPress={() => router.push("/(tabs)/journal")}
        style={[
          styles.journalStrip,
          {
            backgroundColor: C.card + "66",
            borderBottomColor: C.border + "4D",
          },
        ]}
        activeOpacity={0.75}
      >
        <Feather name="pen-tool" size={13} color={C.mutedForeground} />
        <Text
          style={{
            fontSize: 13,
            fontFamily: "DMSans_400Regular",
            color: C.mutedForeground,
            flex: 1,
          }}
          numberOfLines={1}
        >
          What moved you today? Write a note, quote, or reflection…
        </Text>
      </TouchableOpacity>

      {/* ── Scrollable body ── */}
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 22,
          paddingBottom: TAB_BAR_HEIGHT + insets.bottom + 16,
          gap: 16,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* TODAY tagline section — exact match to Feltly Index.tsx */}
        <View style={{ gap: 4 }}>
          <Text
            style={{
              fontSize: 10,
              fontFamily: "DMSans_400Regular",
              color: C.mutedForeground,
              letterSpacing: 2.5,
              textTransform: "uppercase",
            }}
          >
            Today
          </Text>
          <Text
            style={{
              fontSize: 26,
              fontFamily: "Fraunces_400Regular",
              color: C.foreground,
              lineHeight: 31,
              letterSpacing: -0.5,
            }}
          >
            You're always living a{" "}
            <Text
              style={{
                fontFamily: "Fraunces_400Regular_Italic",
                color: C.moodStrong,
              }}
            >
              trope
            </Text>
            .
          </Text>
          <Text
            style={{
              fontSize: 13,
              fontFamily: "DMSans_400Regular",
              color: C.mutedForeground,
              lineHeight: 19,
              marginTop: 2,
            }}
          >
            Mood tracked as undertone on every page — your story fingerprint,
            built one book at a time.
          </Text>
        </View>

        {/* ── Content ── */}
        {hasBooks ? (
          <>
            {/* CurrentBookCard */}
            {currentBook && (
              <CurrentBookCard
                book={currentBook}
                onLogSession={() => setLogOpen(true)}
              />
            )}

            {/* HomeSmartCards — between book card and journal link */}
            <HomeSmartCards currentBook={currentBook} />

            {/* Journal link row */}
            <JournalLink />

            {/* Streak strip */}
            <StreakStrip />

            {/* Shelves section */}
            <ShelvesSection />
          </>
        ) : (
          <EmptyHome />
        )}
      </ScrollView>

      {/* ── Session log modal ── */}
      {logOpen && currentBook && (
        <QuickLogModal
          bookId={currentBook.id}
          bookTitle={currentBook.title}
          onClose={() => setLogOpen(false)}
        />
      )}
    </View>
  );
}

// ─── StyleSheet ───────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  streakPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 18,
    borderWidth: 1,
  },
  logHeaderBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 18,
  },
  journalStrip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  welcomeBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  heroCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    overflow: "hidden",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  heroButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 18,
  },
  btnFilled: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 999,
  },
  btnOutline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 999,
    borderWidth: 1,
  },
  stepCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
  },
  stepBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  currentCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
  },
  moodChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  progressActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 16,
  },
  bumpGroup: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 999,
    padding: 3,
  },
  bumpBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  logBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 999,
    paddingVertical: 12,
  },
  smartCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  journalLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  journalIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  streakCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 0,
  },
  streakDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#00000018",
    marginVertical: 14,
  },
  streakIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  tabContainer: {
    borderRadius: 999,
    borderWidth: 1,
    padding: 3,
  },
  shelfTab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  countBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  shelfEmpty: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 32,
    alignItems: "center",
    gap: 10,
  },
});
