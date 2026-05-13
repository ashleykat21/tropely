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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/navigation";
import { useStore, type Shelf } from "@/store";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, "BookDetail">;

const SHELVES: { key: Shelf; label: string }[] = [
  { key: "reading", label: "Reading" },
  { key: "want", label: "Want to read" },
  { key: "finished", label: "Finished" },
  { key: "paused", label: "Paused" },
  { key: "dnf", label: "DNF" },
];

const MOODS = [
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

export default function BookDetailScreen() {
  const nav = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { bookId } = route.params;
  const { books, sessions, reflections, updateBook, moveToShelf, addSession, setReflection, removeBook } = useStore();

  const book = books.find((b) => b.id === bookId);
  const bookSessions = sessions.filter((s) => s.bookId === bookId).slice(0, 5);
  const reflection = reflections.find((r) => r.bookId === bookId);

  const [progressInput, setProgressInput] = useState(book?.progress?.toString() ?? "");
  const [logPages, setLogPages] = useState("");
  const [logMinutes, setLogMinutes] = useState("");
  const [reflectionText, setReflectionText] = useState(reflection?.text ?? "");
  const [rating, setRating] = useState(reflection?.rating ?? 0);

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

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
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

        {/* Shelf selector */}
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
                onPress={() => updateBook(bookId, { mood: book.mood === m.key ? undefined : m.key as any })}
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

        {/* AI Companion shortcut */}
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
        {(book.tropes ?? []).length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Tropes</Text>
            <View style={styles.tropeChips}>
              {book.tropes!.map((t) => (
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fafaf9" },
  notFound: { padding: 32, textAlign: "center", color: "#9ca3af" },
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
});
