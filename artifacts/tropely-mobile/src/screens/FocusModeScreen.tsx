import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, Modal, TextInput, ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import type { RootStackParamList } from "@/navigation";
import { useStore } from "@/store";
import type { Mood } from "@/store";
import { LinearGradient } from "expo-linear-gradient";
import { MOOD_GRADIENTS, COLORS, type MoodKey } from "@/constants/theme";

type Route = RouteProp<RootStackParamList, "FocusMode">;

const MOODS: Mood[] = ["cozy", "joyful", "reflective", "tense", "melancholy", "adventurous", "hopeful"];
const MOOD_EMOJIS: Record<string, string> = {
  cozy: "🧸", joyful: "☀️", reflective: "🪞", tense: "⚡",
  melancholy: "🌧️", adventurous: "⛵", hopeful: "🌱",
};

function fmt(sec: number) {
  const m = Math.floor(sec / 60).toString().padStart(2, "0");
  const s = (sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function FocusModeScreen() {
  const nav = useNavigation();
  const route = useRoute<Route>();
  const bookId = route.params?.bookId;

  const book = useStore((s) => s.books.find((b) => b.id === bookId));
  const addSession = useStore((s) => s.addSession);
  const activeMood = useStore((s) => s.activeMood);

  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [showLog, setShowLog] = useState(false);
  const [endPage, setEndPage] = useState(book ? String(book.progress) : "");
  const [mood, setMood] = useState<Mood | null>(null);
  const [note, setNote] = useState("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const gradColors = activeMood && MOOD_GRADIENTS[activeMood] ? MOOD_GRADIENTS[activeMood] : COLORS.gradPrimary;

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  const handleLog = useCallback(() => {
    if (!bookId || !book) { nav.goBack(); return; }
    const minutes = Math.round(elapsed / 60);
    const to = parseInt(endPage, 10) || book.progress;
    addSession({
      bookId,
      date: new Date().toISOString(),
      fromPage: book.progress,
      toPage: to,
      minutes: minutes > 0 ? minutes : undefined,
      mood: mood ?? undefined,
      note: note.trim() || undefined,
    });
    nav.goBack();
  }, [bookId, book, elapsed, endPage, mood, note, addSession, nav]);

  return (
    <LinearGradient colors={gradColors} style={styles.flex}>
      <SafeAreaView style={styles.flex} edges={["top", "bottom"]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              setRunning(false);
              nav.goBack();
            }}
            style={styles.closeBtn}
          >
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
          {book && <Text style={styles.bookTitle} numberOfLines={1}>{book.title}</Text>}
        </View>

        {/* Timer */}
        <View style={styles.timerArea}>
          <Text style={styles.timer}>{fmt(elapsed)}</Text>
          <Text style={styles.timerLabel}>{running ? "Reading…" : elapsed > 0 ? "Paused" : "Ready"}</Text>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity
            style={[styles.mainBtn, running && styles.pauseBtn]}
            onPress={() => setRunning((r) => !r)}
          >
            <Text style={styles.mainBtnText}>{running ? "Pause" : elapsed > 0 ? "Resume" : "Start"}</Text>
          </TouchableOpacity>
          {elapsed > 0 && (
            <View style={styles.subControls}>
              <TouchableOpacity style={styles.subBtn} onPress={() => setShowLog(true)}>
                <Text style={styles.subBtnText}>Log session</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.subBtn, { borderColor: "#ef4444" }]}
                onPress={() => { setRunning(false); setElapsed(0); nav.goBack(); }}
              >
                <Text style={[styles.subBtnText, { color: "#ef4444" }]}>Discard</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Log modal */}
        <Modal visible={showLog} animationType="slide" presentationStyle="pageSheet">
          <SafeAreaView style={styles.modalSafe} edges={["top", "bottom"]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Log Session</Text>
              <TouchableOpacity onPress={() => setShowLog(false)}>
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.modalContent}>
              <Text style={styles.logDuration}>⏱ {fmt(elapsed)} ({Math.round(elapsed / 60)} min)</Text>

              <Text style={styles.fieldLabel}>Ended on page</Text>
              <TextInput
                style={styles.input}
                value={endPage}
                onChangeText={setEndPage}
                keyboardType="number-pad"
                placeholder={String(book?.progress ?? 0)}
                placeholderTextColor="#9ca3af"
              />

              <Text style={styles.fieldLabel}>Reading mood</Text>
              <View style={styles.moodRow}>
                {MOODS.map((m) => (
                  <TouchableOpacity
                    key={m}
                    style={[styles.moodChip, mood === m && styles.moodChipActive]}
                    onPress={() => setMood(m)}
                  >
                    <Text style={styles.moodEmoji}>{MOOD_EMOJIS[m]}</Text>
                    <Text style={[styles.moodLabel, mood === m && styles.moodLabelActive]}>{m}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>Quick note (optional)</Text>
              <TextInput
                style={[styles.input, styles.noteInput]}
                value={note}
                onChangeText={setNote}
                placeholder="How was this session?"
                placeholderTextColor="#9ca3af"
                multiline
              />

              <TouchableOpacity style={styles.saveBtn} onPress={handleLog}>
                <Text style={styles.saveBtnText}>Save &amp; Exit</Text>
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
  header: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16 },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.5)", justifyContent: "center", alignItems: "center" },
  closeText: { fontSize: 14, color: "#6b7280" },
  bookTitle: { flex: 1, fontSize: 14, fontWeight: "600", color: "#1a1a1a" },
  timerArea: { flex: 1, justifyContent: "center", alignItems: "center", gap: 8 },
  timer: { fontSize: 72, fontWeight: "200", color: "#1a1a1a", letterSpacing: -2, fontVariant: ["tabular-nums"] },
  timerLabel: { fontSize: 14, color: "#6b7280", fontWeight: "500" },
  controls: { padding: 24, gap: 12, alignItems: "center" },
  mainBtn: { backgroundColor: "#1a1a1a", borderRadius: 28, paddingVertical: 16, paddingHorizontal: 48 },
  pauseBtn: { backgroundColor: "#6b7280" },
  mainBtnText: { color: "#fff", fontSize: 17, fontWeight: "700" },
  subControls: { flexDirection: "row", gap: 12 },
  subBtn: { borderWidth: 1, borderColor: "#1a1a1a", borderRadius: 20, paddingVertical: 10, paddingHorizontal: 24 },
  subBtnText: { fontSize: 14, fontWeight: "600", color: "#1a1a1a" },
  modalSafe: { flex: 1, backgroundColor: "#fafaf9" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16 },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#1a1a1a" },
  modalContent: { padding: 16, gap: 12 },
  logDuration: { fontSize: 15, fontWeight: "600", color: "#1a1a1a", textAlign: "center", marginBottom: 8 },
  fieldLabel: { fontSize: 12, fontWeight: "700", color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.6 },
  input: { backgroundColor: "#fff", borderRadius: 12, borderWidth: 1, borderColor: "#f0ede8", padding: 12, fontSize: 15, color: "#1a1a1a" },
  noteInput: { minHeight: 80, textAlignVertical: "top" },
  moodRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  moodChip: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: "#f0ede8", backgroundColor: "#fff" },
  moodChipActive: { backgroundColor: "#1a1a1a", borderColor: "#1a1a1a" },
  moodEmoji: { fontSize: 14 },
  moodLabel: { fontSize: 12, color: "#6b7280" },
  moodLabelActive: { color: "#fff" },
  saveBtn: { backgroundColor: "#1a1a1a", borderRadius: 16, padding: 16, alignItems: "center", marginTop: 8 },
  saveBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
