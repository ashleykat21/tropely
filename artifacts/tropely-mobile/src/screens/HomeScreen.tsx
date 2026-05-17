import React, { useState, useCallback, useMemo } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal, TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import type { RootStackParamList } from "@/navigation";
import { useStore, computeStreak, type Mood } from "@/store";
import { useAuth } from "@/context/AuthContext";
import { MOOD_COLORS, MOOD_KEYS, type MoodKey } from "@/constants/theme";
import { trackEvent } from "@/lib/analytics";

type Nav = NativeStackNavigationProp<RootStackParamList>;

const MOODS: Mood[] = ["cozy", "joyful", "reflective", "tense", "melancholy", "adventurous", "hopeful", "romantic", "eerie", "intense"];
const MOOD_EMOJIS: Record<string, string> = {
  cozy: "🧸", joyful: "☀️", reflective: "🪞", tense: "⚡",
  melancholy: "🌧️", adventurous: "⛵", hopeful: "🌱",
  romantic: "🌹", eerie: "🌙", intense: "🔥",
};

const SLUMP_TIPS = [
  "Try a short story collection — no commitment required.",
  "Re-read a comfort read from your shelf.",
  "Lower the bar: audiobook while doing dishes counts.",
  "Pick a book purely for the trope, not the review score.",
];

export default function HomeScreen() {
  const nav = useNavigation<Nav>();
  const { user } = useAuth();

  const books      = useStore((s) => s.books);
  const sessions   = useStore((s) => s.sessions);
  const addSession = useStore((s) => s.addSession);
  const updateBook = useStore((s) => s.updateBook);
  const activeMood    = useStore((s) => s.activeMood);
  const setActiveMood = useStore((s) => s.setActiveMood);
  const dailyGoalPages = useStore((s) => s.dailyGoalPages);

  const currentBook = useStore((s) =>
    s.books.find((b) => b.id === s.currentId && b.shelf === "reading") ??
    s.books.find((b) => b.shelf === "reading") ?? null,
  );

  const streak = useMemo(() => computeStreak(sessions), [sessions]);

  const todayPages = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return sessions
      .filter((s) => s.date.slice(0, 10) === today)
      .reduce((sum, s) => sum + (s.toPage - s.fromPage), 0);
  }, [sessions]);

  const readingBooks = books.filter((b) => b.shelf === "reading");
  const isSlump = readingBooks.length > 0 && streak === 0 && sessions.length > 0;

  const moodTheme = activeMood ? MOOD_COLORS[activeMood] : { grad: ["#fafaf9", "#f5f0ea"] as [string, string], bg: "#fafaf9" };

  const [showMoodPicker, setShowMoodPicker] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [sessionEndPage, setSessionEndPage] = useState("");
  const [sessionMood, setSessionMood] = useState<Mood | null>(null);
  const [sessionNote, setSessionNote] = useState("");

  const firstName = user?.displayName?.split(" ")[0] ?? "Reader";

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return `Good morning, ${firstName} ☀️`;
    if (h < 17) return `Good afternoon, ${firstName} 🌿`;
    return `Good evening, ${firstName} 🌙`;
  }, [firstName]);

  const handleLogSession = useCallback(() => {
    if (!currentBook) return;
    const to = parseInt(sessionEndPage, 10) || currentBook.progress;
    addSession({
      bookId: currentBook.id,
      date: new Date().toISOString(),
      fromPage: currentBook.progress,
      toPage: to,
      mood: sessionMood ?? undefined,
      note: sessionNote.trim() || undefined,
    });
    if (to > currentBook.progress) {
      updateBook(currentBook.id, { progress: to });
    }
    trackEvent("Session Logged", { fromHome: true });
    setShowSessionModal(false);
    setSessionEndPage("");
    setSessionMood(null);
    setSessionNote("");
  }, [currentBook, sessionEndPage, sessionMood, sessionNote, addSession, updateBook]);

  const progressPct = currentBook
    ? Math.min(100, Math.round((currentBook.progress / currentBook.pages) * 100))
    : 0;

  return (
    <LinearGradient colors={moodTheme.grad as [string, string]} style={styles.flex}>
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.greeting}>{greeting}</Text>
            <TouchableOpacity
              style={styles.journalBtn}
              onPress={() => nav.navigate("Journal")}
            >
              <Text style={styles.journalBtnText}>📓</Text>
            </TouchableOpacity>
          </View>

          {/* Mood selector strip */}
          <TouchableOpacity style={styles.moodStrip} onPress={() => setShowMoodPicker(true)}>
            <Text style={styles.moodStripLabel}>
              {activeMood ? `${MOOD_COLORS[activeMood].emoji} ${MOOD_COLORS[activeMood].label} mode` : "✨ Set your reading mood"}
            </Text>
            <Text style={styles.moodStripArrow}>›</Text>
          </TouchableOpacity>

          {/* Streak + daily stats */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statNum}>{streak}</Text>
              <Text style={styles.statLabel}>day streak 🔥</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNum}>{todayPages}</Text>
              <Text style={styles.statLabel}>pages today</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNum}>{books.filter((b) => b.shelf === "finished").length}</Text>
              <Text style={styles.statLabel}>finished</Text>
            </View>
          </View>

          {/* Current read */}
          {currentBook ? (
            <View style={styles.card}>
              <Text style={styles.cardSection}>Now Reading</Text>
              <Text style={styles.currentTitle} numberOfLines={2}>{currentBook.title}</Text>
              <Text style={styles.currentAuthor}>{currentBook.author}</Text>

              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
              </View>
              <Text style={styles.progressLabel}>
                p. {currentBook.progress} / {currentBook.pages} · {progressPct}%
              </Text>

              {dailyGoalPages > 0 && (
                <View style={styles.goalRow}>
                  <Text style={styles.goalLabel}>Today's goal</Text>
                  <View style={styles.goalTrack}>
                    <View style={[styles.goalFill, { width: `${Math.min(100, Math.round((todayPages / dailyGoalPages) * 100))}%` }]} />
                  </View>
                  <Text style={styles.goalPct}>{Math.min(100, Math.round((todayPages / dailyGoalPages) * 100))}%</Text>
                </View>
              )}

              <View style={styles.bookActions}>
                <TouchableOpacity
                  style={styles.actionBtnPrimary}
                  onPress={() => nav.navigate("FocusMode", { bookId: currentBook.id })}
                >
                  <Text style={styles.actionBtnPrimaryText}>⏱ Focus Mode</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionBtnSecondary}
                  onPress={() => setShowSessionModal(true)}
                >
                  <Text style={styles.actionBtnSecondaryText}>Log pages</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionBtnSecondary}
                  onPress={() => nav.navigate("BookDetail", { bookId: currentBook.id })}
                >
                  <Text style={styles.actionBtnSecondaryText}>Details</Text>
                </TouchableOpacity>
              </View>

              {progressPct >= 90 && (
                <View style={styles.finishPrompt}>
                  <Text style={styles.finishPromptText}>📖 Almost there! Are you close to finishing?</Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.card}>
              <Text style={styles.emptyTitle}>Start your reading journey 🌱</Text>
              <Text style={styles.emptyText}>Search for a book to add to your shelf.</Text>
              <TouchableOpacity
                style={styles.actionBtnPrimary}
                onPress={() => (nav as any).navigate("Discover")}
              >
                <Text style={styles.actionBtnPrimaryText}>Find books →</Text>
              </TouchableOpacity>
            </View>
          )}

          {isSlump && (
            <View style={[styles.card, styles.slumpCard]}>
              <Text style={styles.slumpTitle}>Reading slump? It happens. 💛</Text>
              <Text style={styles.slumpTip}>{SLUMP_TIPS[Math.floor(Math.random() * SLUMP_TIPS.length)]}</Text>
            </View>
          )}

          {readingBooks.length > 1 && (
            <>
              <Text style={styles.sectionHeader}>Also on your shelf</Text>
              {readingBooks
                .filter((b) => b.id !== currentBook?.id)
                .slice(0, 3)
                .map((book) => (
                  <TouchableOpacity
                    key={book.id}
                    style={styles.miniBook}
                    onPress={() => nav.navigate("BookDetail", { bookId: book.id })}
                  >
                    <View style={styles.miniBookDot} />
                    <Text style={styles.miniBookTitle} numberOfLines={1}>{book.title}</Text>
                    <Text style={styles.miniBookPct}>{Math.round((book.progress / book.pages) * 100)}%</Text>
                  </TouchableOpacity>
                ))}
            </>
          )}
        </ScrollView>

        {/* Mood picker modal */}
        <Modal visible={showMoodPicker} animationType="slide" presentationStyle="pageSheet">
          <SafeAreaView style={styles.modalSafe} edges={["top", "bottom"]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reading Mood</Text>
              <TouchableOpacity onPress={() => setShowMoodPicker(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSub}>Your mood tints the whole app palette.</Text>
            <ScrollView contentContainerStyle={styles.moodGrid}>
              {MOOD_KEYS.map((mk) => {
                const m = MOOD_COLORS[mk];
                return (
                  <TouchableOpacity
                    key={mk}
                    style={[styles.moodOption, { backgroundColor: m.chip }, activeMood === mk && styles.moodOptionActive]}
                    onPress={() => { setActiveMood(mk); setShowMoodPicker(false); }}
                  >
                    <Text style={styles.moodOptionEmoji}>{m.emoji}</Text>
                    <Text style={styles.moodOptionLabel}>{m.label}</Text>
                  </TouchableOpacity>
                );
              })}
              {activeMood && (
                <TouchableOpacity style={styles.clearMoodBtn} onPress={() => { setActiveMood(null); setShowMoodPicker(false); }}>
                  <Text style={styles.clearMoodText}>Clear mood</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </SafeAreaView>
        </Modal>

        {/* Session log modal */}
        <Modal visible={showSessionModal} animationType="slide" presentationStyle="pageSheet">
          <SafeAreaView style={styles.modalSafe} edges={["top", "bottom"]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Log Pages</Text>
              <TouchableOpacity onPress={() => setShowSessionModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.modalContent}>
              <Text style={styles.fieldLabel}>Current page (was: {currentBook?.progress ?? 0})</Text>
              <TextInput
                style={styles.input}
                value={sessionEndPage}
                onChangeText={setSessionEndPage}
                keyboardType="number-pad"
                placeholder="Ending page"
                placeholderTextColor="#9ca3af"
              />
              <Text style={styles.fieldLabel}>Reading mood</Text>
              <View style={styles.moodRow}>
                {MOODS.slice(0, 6).map((m) => (
                  <TouchableOpacity
                    key={m}
                    style={[styles.moodChip, sessionMood === m && styles.moodChipActive]}
                    onPress={() => setSessionMood(m)}
                  >
                    <Text>{MOOD_EMOJIS[m]}</Text>
                    <Text style={[styles.moodChipLabel, sessionMood === m && { color: "#fff" }]}>{m}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.fieldLabel}>Quick note</Text>
              <TextInput
                style={[styles.input, styles.noteInput]}
                value={sessionNote}
                onChangeText={setSessionNote}
                placeholder="How was it?"
                placeholderTextColor="#9ca3af"
                multiline
              />
              <TouchableOpacity style={styles.saveBtn} onPress={handleLogSession}>
                <Text style={styles.saveBtnText}>Save</Text>
              </TouchableOpacity>
            </ScrollView>
          </SafeAreaView>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safe: { flex: 1 },
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  greeting: { fontSize: 20, fontWeight: "700", color: "#1a1a1a", flex: 1 },
  journalBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.7)", justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "#f0ede8" },
  journalBtnText: { fontSize: 18 },
  moodStrip: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "rgba(255,255,255,0.7)", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: "#f0ede8" },
  moodStripLabel: { fontSize: 14, fontWeight: "500", color: "#1a1a1a" },
  moodStripArrow: { fontSize: 18, color: "#9ca3af" },
  statsRow: { flexDirection: "row", gap: 8 },
  statCard: { flex: 1, backgroundColor: "rgba(255,255,255,0.8)", borderRadius: 14, padding: 12, alignItems: "center", borderWidth: 1, borderColor: "#f0ede8" },
  statNum: { fontSize: 24, fontWeight: "800", color: "#1a1a1a" },
  statLabel: { fontSize: 11, color: "#9ca3af", textAlign: "center", marginTop: 2 },
  card: { backgroundColor: "#fff", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#f0ede8", gap: 8 },
  cardSection: { fontSize: 11, fontWeight: "700", color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.8 },
  currentTitle: { fontSize: 20, fontWeight: "700", color: "#1a1a1a" },
  currentAuthor: { fontSize: 13, color: "#6b7280" },
  progressTrack: { height: 6, backgroundColor: "#f5f0ea", borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: "#1a1a1a", borderRadius: 3 },
  progressLabel: { fontSize: 12, color: "#9ca3af" },
  goalRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  goalLabel: { fontSize: 11, color: "#9ca3af", width: 80 },
  goalTrack: { flex: 1, height: 4, backgroundColor: "#f5f0ea", borderRadius: 2, overflow: "hidden" },
  goalFill: { height: "100%", backgroundColor: "#d4c9a8", borderRadius: 2 },
  goalPct: { fontSize: 11, color: "#9ca3af", width: 30, textAlign: "right" },
  bookActions: { flexDirection: "row", gap: 8, marginTop: 4 },
  actionBtnPrimary: { flex: 1, backgroundColor: "#1a1a1a", borderRadius: 10, paddingVertical: 10, alignItems: "center" },
  actionBtnPrimaryText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  actionBtnSecondary: { flex: 1, borderWidth: 1, borderColor: "#f0ede8", borderRadius: 10, paddingVertical: 10, alignItems: "center" },
  actionBtnSecondaryText: { color: "#1a1a1a", fontSize: 13, fontWeight: "600" },
  finishPrompt: { backgroundColor: "#fef9c3", borderRadius: 10, padding: 10 },
  finishPromptText: { fontSize: 13, color: "#854d0e" },
  emptyTitle: { fontSize: 17, fontWeight: "700", color: "#1a1a1a" },
  emptyText: { fontSize: 13, color: "#9ca3af" },
  slumpCard: { backgroundColor: "#fef3c7", borderColor: "#fde68a" },
  slumpTitle: { fontSize: 15, fontWeight: "700", color: "#92400e" },
  slumpTip: { fontSize: 13, color: "#78350f", lineHeight: 19 },
  sectionHeader: { fontSize: 13, fontWeight: "700", color: "#6b7280", marginTop: 4 },
  miniBook: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#fff", borderRadius: 12, padding: 12, borderWidth: 1, borderColor: "#f0ede8" },
  miniBookDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#d4c9a8" },
  miniBookTitle: { flex: 1, fontSize: 14, fontWeight: "600", color: "#1a1a1a" },
  miniBookPct: { fontSize: 12, color: "#9ca3af" },
  modalSafe: { flex: 1, backgroundColor: "#fafaf9" },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16 },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#1a1a1a" },
  modalClose: { fontSize: 16, color: "#9ca3af" },
  modalSub: { fontSize: 13, color: "#6b7280", paddingHorizontal: 16, marginBottom: 8 },
  modalContent: { padding: 16, gap: 12 },
  moodGrid: { padding: 16, flexDirection: "row", flexWrap: "wrap", gap: 10 },
  moodOption: { width: "30%", aspectRatio: 1, borderRadius: 16, justifyContent: "center", alignItems: "center", gap: 6 },
  moodOptionActive: { borderWidth: 2, borderColor: "#1a1a1a" },
  moodOptionEmoji: { fontSize: 28 },
  moodOptionLabel: { fontSize: 12, fontWeight: "600", color: "#1a1a1a" },
  clearMoodBtn: { width: "100%", alignItems: "center", paddingVertical: 12 },
  clearMoodText: { fontSize: 14, color: "#9ca3af" },
  fieldLabel: { fontSize: 11, fontWeight: "700", color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.6 },
  input: { backgroundColor: "#fff", borderRadius: 12, borderWidth: 1, borderColor: "#f0ede8", padding: 12, fontSize: 15, color: "#1a1a1a" },
  noteInput: { minHeight: 72, textAlignVertical: "top" },
  moodRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  moodChip: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: "#f0ede8", backgroundColor: "#fff" },
  moodChipActive: { backgroundColor: "#1a1a1a", borderColor: "#1a1a1a" },
  moodChipLabel: { fontSize: 12, color: "#6b7280" },
  saveBtn: { backgroundColor: "#1a1a1a", borderRadius: 14, padding: 14, alignItems: "center" },
  saveBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
