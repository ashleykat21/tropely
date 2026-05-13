import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  TextInput,
  Alert,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/navigation";
import { useStore, type Shelf, type Mood } from "@/store";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, "BookDetail">;

const SHELVES: { key: Shelf; label: string }[] = [
  { key: "reading", label: "Reading" },
  { key: "want", label: "Want to read" },
  { key: "finished", label: "Finished" },
  { key: "paused", label: "Paused" },
  { key: "dnf", label: "DNF" },
];

const MOODS: { key: Mood; label: string; emoji: string }[] = [
  { key: "hopeful", label: "Hopeful", emoji: "🌱" },
  { key: "tense", label: "Tense", emoji: "⚡" },
  { key: "melancholy", label: "Melancholy", emoji: "🌧" },
  { key: "joyful", label: "Joyful", emoji: "☀️" },
  { key: "romantic", label: "Romantic", emoji: "🌹" },
  { key: "eerie", label: "Eerie", emoji: "🌑" },
  { key: "reflective", label: "Reflective", emoji: "🪞" },
  { key: "adventurous", label: "Adventurous", emoji: "🧭" },
  { key: "cozy", label: "Cozy", emoji: "🕯️" },
  { key: "intense", label: "Intense", emoji: "🔥" },
];

type DetailTab = "details" | "highlights";

export default function BookDetailScreen() {
  const nav = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { bookId } = route.params;
  const {
    books, sessions, reflections, highlights,
    updateBook, moveToShelf, addSession, setReflection, removeBook,
    addHighlight, deleteHighlight,
  } = useStore();

  const book = books.find((b) => b.id === bookId);
  const bookSessions = sessions.filter((s) => s.bookId === bookId).slice(0, 5);
  const reflection = reflections.find((r) => r.bookId === bookId);
  const bookHighlights = highlights.filter((h) => h.bookId === bookId);

  const [activeTab, setActiveTab] = useState<DetailTab>("details");
  const [progressInput, setProgressInput] = useState(book?.progress?.toString() ?? "");
  const [logPages, setLogPages] = useState("");
  const [logMinutes, setLogMinutes] = useState("");
  const [reflectionText, setReflectionText] = useState(reflection?.text ?? "");
  const [rating, setRating] = useState(reflection?.rating ?? 0);

  // Highlight form state
  const [showHighlightForm, setShowHighlightForm] = useState(false);
  const [hlText, setHlText] = useState("");
  const [hlTrope, setHlTrope] = useState("");
  const [hlMood, setHlMood] = useState<Mood | null>(null);
  const [hlPage, setHlPage] = useState("");

  if (!book) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.notFound}>Book not found.</Text>
      </SafeAreaView>
    );
  }

  const saveProgress = () => {
    const n = parseInt(progressInput, 10);
    if (!isNaN(n) && n >= 0 && n <= book.pages) updateBook(bookId, { progress: n });
  };

  const logSession = () => {
    const from = book.progress;
    const to = parseInt(logPages, 10);
    if (isNaN(to) || to <= from) {
      Alert.alert("Invalid pages", "End page must be greater than current progress.");
      return;
    }
    addSession({
      bookId,
      date: new Date().toISOString(),
      fromPage: from,
      toPage: to,
      minutes: logMinutes ? parseInt(logMinutes, 10) : undefined,
    });
    updateBook(bookId, { progress: to });
    setProgressInput(to.toString());
    setLogPages("");
    setLogMinutes("");
  };

  const saveReflection = () => {
    setReflection(bookId, reflectionText, rating || undefined);
    Alert.alert("Saved", "Your reflection has been saved.");
  };

  const saveHighlight = () => {
    if (!hlText.trim()) return;
    addHighlight({
      bookId,
      text: hlText.trim(),
      trope: hlTrope.trim() || undefined,
      mood: hlMood ?? undefined,
      page: hlPage ? parseInt(hlPage, 10) : undefined,
      date: new Date().toISOString(),
    });
    setHlText("");
    setHlTrope("");
    setHlMood(null);
    setHlPage("");
    setShowHighlightForm(false);
  };

  const bookTropes = book.tropes ?? [];

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      {/* Tab bar */}
      <View style={styles.tabs}>
        {(["details", "highlights"] as DetailTab[]).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, activeTab === t && styles.tabActive]}
            onPress={() => setActiveTab(t)}
          >
            <Text style={[styles.tabText, activeTab === t && styles.tabTextActive]}>
              {t === "details" ? "Details" : `Highlights (${bookHighlights.length})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === "details" ? (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          {/* Cover + title */}
          <View style={styles.heroRow}>
            {book.cover ? (
              <Image source={{ uri: book.cover }} style={styles.cover} />
            ) : (
              <View style={[styles.cover, styles.coverPlaceholder]}>
                <Text style={styles.coverInitial}>{book.title[0]}</Text>
              </View>
            )}
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={styles.bookTitle}>{book.title}</Text>
              <Text style={styles.bookAuthor}>{book.author}</Text>
              {book.narrator && <Text style={styles.bookMeta}>Narrated by {book.narrator}</Text>}
              {book.translator && <Text style={styles.bookMeta}>Translated by {book.translator}</Text>}
              <Text style={styles.bookMeta}>{book.pages} pages</Text>
            </View>
          </View>

          {/* Shelf */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Shelf</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {SHELVES.map((s) => (
                <TouchableOpacity
                  key={s.key}
                  style={[styles.shelfChip, book.shelf === s.key && styles.shelfChipActive]}
                  onPress={() => moveToShelf(bookId, s.key)}
                >
                  <Text style={[styles.shelfChipText, book.shelf === s.key && styles.shelfChipTextActive]}>
                    {s.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Mood */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Reading mood</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {MOODS.map((m) => (
                <TouchableOpacity
                  key={m.key}
                  style={[styles.moodChip, book.mood === m.key && styles.moodChipActive]}
                  onPress={() => updateBook(bookId, { mood: book.mood === m.key ? undefined : m.key })}
                >
                  <Text style={styles.moodChipText}>{m.emoji} {m.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Progress */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Progress</Text>
            <View style={styles.progressBarTrack}>
              <View
                style={[
                  styles.progressBar,
                  { width: `${book.pages > 0 ? Math.min(100, (book.progress / book.pages) * 100) : 0}%` },
                ]}
              />
            </View>
            <Text style={styles.progressText}>Page {book.progress} of {book.pages}</Text>
            <View style={styles.row}>
              <TextInput
                style={styles.input}
                value={progressInput}
                onChangeText={setProgressInput}
                keyboardType="number-pad"
                placeholder="Current page"
              />
              <TouchableOpacity style={styles.saveBtn} onPress={saveProgress}>
                <Text style={styles.saveBtnText}>Update</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Log session */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Log reading session</Text>
            <View style={styles.row}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={logPages}
                onChangeText={setLogPages}
                keyboardType="number-pad"
                placeholder="Ended on page…"
              />
              <TextInput
                style={[styles.input, { width: 90 }]}
                value={logMinutes}
                onChangeText={setLogMinutes}
                keyboardType="number-pad"
                placeholder="Min"
              />
            </View>
            <TouchableOpacity style={styles.logBtn} onPress={logSession}>
              <Text style={styles.logBtnText}>Log session</Text>
            </TouchableOpacity>
            {bookSessions.length > 0 && (
              <View style={styles.sessionList}>
                {bookSessions.map((s) => (
                  <View key={s.id} style={styles.sessionRow}>
                    <Text style={styles.sessionDate}>{new Date(s.date).toLocaleDateString()}</Text>
                    <Text style={styles.sessionPages}>p. {s.fromPage}–{s.toPage}</Text>
                    {s.minutes && <Text style={styles.sessionMin}>{s.minutes} min</Text>}
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* AI Companion */}
          <TouchableOpacity
            style={styles.companionBtn}
            onPress={() => nav.navigate("Companion", { bookId })}
          >
            <Text style={styles.companionBtnText}>✨ Open AI Companion</Text>
          </TouchableOpacity>

          {/* Reflection */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Reflection</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((n) => (
                <TouchableOpacity key={n} onPress={() => setRating(rating === n ? 0 : n)}>
                  <Text style={[styles.star, n <= rating && styles.starFilled]}>★</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={styles.textArea}
              value={reflectionText}
              onChangeText={setReflectionText}
              placeholder="What did this book mean to you?"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <TouchableOpacity style={styles.saveBtn} onPress={saveReflection}>
              <Text style={styles.saveBtnText}>Save reflection</Text>
            </TouchableOpacity>
          </View>

          {/* Tropes */}
          {bookTropes.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Tropes</Text>
              <View style={styles.tropeChips}>
                {bookTropes.map((t) => (
                  <View key={t} style={styles.tropeChip}>
                    <Text style={styles.tropeChipText}>{t}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Danger zone */}
          <TouchableOpacity
            style={styles.removeBtn}
            onPress={() =>
              Alert.alert("Remove book?", "This will delete all sessions and journal entries for this book.", [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Remove",
                  style: "destructive",
                  onPress: () => { removeBook(bookId); nav.goBack(); },
                },
              ])
            }
          >
            <Text style={styles.removeBtnText}>Remove from library</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        // Highlights tab
        <View style={{ flex: 1 }}>
          <View style={styles.hlHeader}>
            <Text style={styles.hlHeaderTitle}>Highlights & quotes</Text>
            <TouchableOpacity
              style={styles.hlAddBtn}
              onPress={() => setShowHighlightForm(true)}
            >
              <Text style={styles.hlAddBtnText}>+ Add</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scroll} contentContainerStyle={styles.hlContent}>
            {bookHighlights.length === 0 ? (
              <View style={styles.hlEmpty}>
                <Text style={styles.hlEmptyEmoji}>💬</Text>
                <Text style={styles.hlEmptyTitle}>No highlights yet</Text>
                <Text style={styles.hlEmptyHint}>
                  Save a passage that moved you — tag it with a trope and a mood.
                </Text>
                <TouchableOpacity
                  style={styles.hlEmptyBtn}
                  onPress={() => setShowHighlightForm(true)}
                >
                  <Text style={styles.hlEmptyBtnText}>Add your first highlight</Text>
                </TouchableOpacity>
              </View>
            ) : (
              bookHighlights.map((h) => (
                <View key={h.id} style={styles.hlCard}>
                  <View style={styles.hlCardMeta}>
                    {h.trope && (
                      <View style={styles.hlTropePill}>
                        <Text style={styles.hlTropePillText}>{h.trope}</Text>
                      </View>
                    )}
                    {h.mood && (
                      <View style={styles.hlMoodPill}>
                        <Text style={styles.hlMoodPillText}>
                          {MOODS.find((m) => m.key === h.mood)?.emoji} {h.mood}
                        </Text>
                      </View>
                    )}
                    {h.page && <Text style={styles.hlPage}>p. {h.page}</Text>}
                    <TouchableOpacity
                      onPress={() =>
                        Alert.alert("Delete highlight?", "", [
                          { text: "Cancel", style: "cancel" },
                          { text: "Delete", style: "destructive", onPress: () => deleteHighlight(h.id) },
                        ])
                      }
                      style={styles.hlDelete}
                    >
                      <Text style={styles.hlDeleteText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.hlText}>"{h.text}"</Text>
                  <Text style={styles.hlDate}>{new Date(h.date).toLocaleDateString()}</Text>
                </View>
              ))
            )}
          </ScrollView>

          {/* Add highlight modal */}
          <Modal visible={showHighlightForm} animationType="slide" presentationStyle="pageSheet">
            <SafeAreaView style={styles.modalSafe}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setShowHighlightForm(false)}>
                  <Text style={styles.modalCancel}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Add highlight</Text>
                <TouchableOpacity onPress={saveHighlight}>
                  <Text style={styles.modalSave}>Save</Text>
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.scroll} contentContainerStyle={styles.modalContent}>
                <Text style={styles.fieldLabel}>QUOTE OR PASSAGE</Text>
                <TextInput
                  style={styles.textArea}
                  value={hlText}
                  onChangeText={setHlText}
                  placeholder="Paste or type the text…"
                  multiline
                  numberOfLines={5}
                  textAlignVertical="top"
                  autoFocus
                />

                <Text style={styles.fieldLabel}>TROPE TAG (OPTIONAL)</Text>
                {bookTropes.length > 0 ? (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {bookTropes.map((t) => (
                      <TouchableOpacity
                        key={t}
                        style={[styles.hlPickerChip, hlTrope === t && styles.hlPickerChipActive]}
                        onPress={() => setHlTrope(hlTrope === t ? "" : t)}
                      >
                        <Text style={[styles.hlPickerChipText, hlTrope === t && styles.hlPickerChipTextActive]}>
                          {t}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                ) : (
                  <TextInput
                    style={styles.input}
                    value={hlTrope}
                    onChangeText={setHlTrope}
                    placeholder="e.g. enemies-to-lovers"
                  />
                )}

                <Text style={styles.fieldLabel}>MOOD (OPTIONAL)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {MOODS.map((m) => (
                    <TouchableOpacity
                      key={m.key}
                      style={[styles.hlPickerChip, hlMood === m.key && styles.hlPickerChipActive]}
                      onPress={() => setHlMood(hlMood === m.key ? null : m.key)}
                    >
                      <Text style={[styles.hlPickerChipText, hlMood === m.key && styles.hlPickerChipTextActive]}>
                        {m.emoji} {m.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <Text style={styles.fieldLabel}>PAGE (OPTIONAL)</Text>
                <TextInput
                  style={[styles.input, { width: 100 }]}
                  value={hlPage}
                  onChangeText={setHlPage}
                  keyboardType="number-pad"
                  placeholder="e.g. 142"
                />
              </ScrollView>
            </SafeAreaView>
          </Modal>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fafaf9" },
  notFound: { padding: 32, textAlign: "center", color: "#9ca3af" },
  tabs: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#f0f0f0", backgroundColor: "#fff" },
  tab: { flex: 1, paddingVertical: 12, alignItems: "center" },
  tabActive: { borderBottomWidth: 2, borderBottomColor: "#1a1a1a" },
  tabText: { fontSize: 13, fontWeight: "500", color: "#9ca3af" },
  tabTextActive: { color: "#1a1a1a", fontWeight: "700" },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 14, paddingBottom: 40 },
  heroRow: { flexDirection: "row", gap: 14, alignItems: "flex-start" },
  cover: { width: 80, height: 120, borderRadius: 8 },
  coverPlaceholder: { backgroundColor: "#e5e7eb", justifyContent: "center", alignItems: "center" },
  coverInitial: { fontSize: 28, fontWeight: "700", color: "#9ca3af" },
  bookTitle: { fontSize: 18, fontWeight: "700", color: "#1a1a1a", lineHeight: 24 },
  bookAuthor: { fontSize: 13, color: "#6b7280" },
  bookMeta: { fontSize: 11, color: "#9ca3af" },
  card: { backgroundColor: "#fff", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#f0f0f0", gap: 10 },
  cardTitle: { fontSize: 14, fontWeight: "700", color: "#1a1a1a" },
  shelfChip: { marginRight: 8, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: "#e5e7eb", backgroundColor: "#fafafa" },
  shelfChipActive: { backgroundColor: "#1a1a1a", borderColor: "#1a1a1a" },
  shelfChipText: { fontSize: 13, color: "#6b7280" },
  shelfChipTextActive: { color: "#fff" },
  moodChip: { marginRight: 8, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: "#f3f4f6" },
  moodChipActive: { backgroundColor: "#1a1a1a" },
  moodChipText: { fontSize: 12, color: "#1a1a1a" },
  progressBarTrack: { height: 6, backgroundColor: "#f3f4f6", borderRadius: 3, overflow: "hidden" },
  progressBar: { height: "100%", backgroundColor: "#1a1a1a", borderRadius: 3 },
  progressText: { fontSize: 12, color: "#9ca3af" },
  row: { flexDirection: "row", gap: 8 },
  input: { borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, fontSize: 14, backgroundColor: "#fafafa", flex: 1 },
  saveBtn: { backgroundColor: "#1a1a1a", borderRadius: 10, paddingHorizontal: 16, justifyContent: "center" },
  saveBtnText: { color: "#fff", fontWeight: "600", fontSize: 13 },
  logBtn: { backgroundColor: "#f3f4f6", borderRadius: 10, paddingVertical: 11, alignItems: "center" },
  logBtnText: { fontSize: 14, fontWeight: "600", color: "#1a1a1a" },
  sessionList: { gap: 6, marginTop: 4 },
  sessionRow: { flexDirection: "row", gap: 10, alignItems: "center" },
  sessionDate: { fontSize: 11, color: "#9ca3af", flex: 1 },
  sessionPages: { fontSize: 12, color: "#6b7280" },
  sessionMin: { fontSize: 11, color: "#9ca3af" },
  companionBtn: { backgroundColor: "#1a1a1a", borderRadius: 14, paddingVertical: 14, alignItems: "center" },
  companionBtnText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  starsRow: { flexDirection: "row", gap: 4 },
  star: { fontSize: 28, color: "#e5e7eb" },
  starFilled: { color: "#f59e0b" },
  textArea: { borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, minHeight: 100, backgroundColor: "#fafafa" },
  tropeChips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tropeChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: "#f3f4f6" },
  tropeChipText: { fontSize: 12, color: "#6b7280" },
  removeBtn: { borderWidth: 1, borderColor: "#fee2e2", borderRadius: 12, paddingVertical: 14, alignItems: "center", backgroundColor: "#fff" },
  removeBtnText: { fontSize: 14, fontWeight: "600", color: "#ef4444" },
  // Highlights tab
  hlHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, paddingBottom: 8 },
  hlHeaderTitle: { fontSize: 17, fontWeight: "700", color: "#1a1a1a" },
  hlAddBtn: { backgroundColor: "#1a1a1a", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7 },
  hlAddBtnText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  hlContent: { padding: 16, gap: 12, paddingBottom: 40 },
  hlEmpty: { alignItems: "center", paddingTop: 48, gap: 8 },
  hlEmptyEmoji: { fontSize: 36 },
  hlEmptyTitle: { fontSize: 16, fontWeight: "700", color: "#1a1a1a" },
  hlEmptyHint: { fontSize: 13, color: "#9ca3af", textAlign: "center", paddingHorizontal: 24, lineHeight: 20 },
  hlEmptyBtn: { backgroundColor: "#1a1a1a", borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10, marginTop: 8 },
  hlEmptyBtnText: { color: "#fff", fontWeight: "600", fontSize: 13 },
  hlCard: { backgroundColor: "#fff", borderRadius: 14, padding: 14, gap: 10, borderWidth: 1, borderColor: "#f0f0f0" },
  hlCardMeta: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 6 },
  hlTropePill: { backgroundColor: "#f3f4f6", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  hlTropePillText: { fontSize: 11, color: "#6b7280", fontWeight: "500" },
  hlMoodPill: { backgroundColor: "#fef3c7", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  hlMoodPillText: { fontSize: 11, color: "#92400e" },
  hlPage: { fontSize: 11, color: "#9ca3af" },
  hlDelete: { marginLeft: "auto", padding: 4 },
  hlDeleteText: { fontSize: 12, color: "#d1d5db" },
  hlText: { fontSize: 14, color: "#1a1a1a", lineHeight: 22, fontStyle: "italic" },
  hlDate: { fontSize: 10, color: "#d1d5db" },
  // Modal
  modalSafe: { flex: 1, backgroundColor: "#fafaf9" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, borderBottomWidth: 1, borderBottomColor: "#f0f0f0", backgroundColor: "#fff" },
  modalCancel: { fontSize: 15, color: "#9ca3af" },
  modalTitle: { fontSize: 16, fontWeight: "700", color: "#1a1a1a" },
  modalSave: { fontSize: 15, fontWeight: "700", color: "#1a1a1a" },
  modalContent: { padding: 16, gap: 14, paddingBottom: 48 },
  fieldLabel: { fontSize: 10, fontWeight: "700", color: "#9ca3af", letterSpacing: 1 },
  hlPickerChip: { marginRight: 8, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: "#e5e7eb", backgroundColor: "#fafafa" },
  hlPickerChipActive: { backgroundColor: "#1a1a1a", borderColor: "#1a1a1a" },
  hlPickerChipText: { fontSize: 12, color: "#6b7280" },
  hlPickerChipTextActive: { color: "#fff" },
});
