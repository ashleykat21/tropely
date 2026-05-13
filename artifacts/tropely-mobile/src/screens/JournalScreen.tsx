import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Modal,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useStore } from "@/store";

export default function JournalScreen() {
  const { books, journal, addJournalEntry, deleteJournalEntry } = useStore();
  const [showAdd, setShowAdd] = useState(false);
  const [kind, setKind] = useState<"quote" | "note">("note");
  const [text, setText] = useState("");
  const [page, setPage] = useState("");
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);

  const readingBooks = books.filter((b) => b.shelf === "reading");

  const save = () => {
    if (!text.trim()) return;
    const bookId = selectedBookId ?? readingBooks[0]?.id;
    if (!bookId) {
      Alert.alert("No book selected", "Add a book to your reading shelf first.");
      return;
    }
    addJournalEntry({
      bookId,
      kind,
      text: text.trim(),
      page: page ? parseInt(page, 10) : undefined,
      date: new Date().toISOString(),
    });
    setText("");
    setPage("");
    setShowAdd(false);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Journal</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAdd(true)}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {journal.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No entries yet</Text>
            <Text style={styles.emptyHint}>
              Add highlights and notes from your reading sessions.
            </Text>
          </View>
        ) : (
          journal.map((entry) => {
            const book = books.find((b) => b.id === entry.bookId);
            return (
              <View key={entry.id} style={styles.entryCard}>
                <View style={styles.entryHeader}>
                  <View style={styles.kindBadge}>
                    <Text style={styles.kindBadgeText}>
                      {entry.kind === "quote" ? "💬 Highlight" : "📝 Note"}
                    </Text>
                  </View>
                  {typeof entry.page === "number" && (
                    <Text style={styles.pageLabel}>p. {entry.page}</Text>
                  )}
                  <TouchableOpacity
                    onPress={() =>
                      Alert.alert("Delete entry?", "", [
                        { text: "Cancel", style: "cancel" },
                        {
                          text: "Delete",
                          style: "destructive",
                          onPress: () => deleteJournalEntry(entry.id),
                        },
                      ])
                    }
                    style={styles.deleteBtn}
                  >
                    <Text style={styles.deleteBtnText}>✕</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.entryText}>{entry.text}</Text>
                {book && (
                  <Text style={styles.entryBook}>{book.title}</Text>
                )}
                <Text style={styles.entryDate}>
                  {new Date(entry.date).toLocaleDateString()}
                </Text>
              </View>
            );
          })
        )}
      </ScrollView>

      <Modal visible={showAdd} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAdd(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>New entry</Text>
            <TouchableOpacity onPress={save}>
              <Text style={styles.saveText}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalContent}>
            {/* Kind toggle */}
            <View style={styles.kindToggle}>
              {(["note", "quote"] as const).map((k) => (
                <TouchableOpacity
                  key={k}
                  style={[styles.kindBtn, kind === k && styles.kindBtnActive]}
                  onPress={() => setKind(k)}
                >
                  <Text style={[styles.kindBtnText, kind === k && styles.kindBtnTextActive]}>
                    {k === "note" ? "📝 Note" : "💬 Highlight"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Book selector */}
            {readingBooks.length > 1 && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>BOOK</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {readingBooks.map((b) => (
                    <TouchableOpacity
                      key={b.id}
                      style={[
                        styles.bookChip,
                        (selectedBookId ?? readingBooks[0]?.id) === b.id && styles.bookChipActive,
                      ]}
                      onPress={() => setSelectedBookId(b.id)}
                    >
                      <Text style={styles.bookChipText} numberOfLines={1}>{b.title}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Page number */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>PAGE (OPTIONAL)</Text>
              <TextInput
                style={styles.pageInput}
                placeholder="e.g. 142"
                value={page}
                onChangeText={setPage}
                keyboardType="number-pad"
              />
            </View>

            {/* Text */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>
                {kind === "quote" ? "HIGHLIGHT TEXT" : "YOUR NOTE"}
              </Text>
              <TextInput
                style={styles.textArea}
                placeholder={kind === "quote" ? "Paste or type the passage…" : "Write your thought…"}
                value={text}
                onChangeText={setText}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fafaf9" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16 },
  title: { fontSize: 26, fontWeight: "700", color: "#1a1a1a" },
  addBtn: { backgroundColor: "#1a1a1a", borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 },
  addBtnText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 12, paddingBottom: 32 },
  empty: { flex: 1, alignItems: "center", paddingTop: 60, gap: 8 },
  emptyTitle: { fontSize: 17, fontWeight: "600", color: "#1a1a1a" },
  emptyHint: { fontSize: 14, color: "#9ca3af", textAlign: "center", paddingHorizontal: 32 },
  entryCard: { backgroundColor: "#fff", borderRadius: 14, padding: 14, gap: 8, borderWidth: 1, borderColor: "#f0f0f0" },
  entryHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  kindBadge: { backgroundColor: "#f3f4f6", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  kindBadgeText: { fontSize: 11, fontWeight: "600", color: "#6b7280" },
  pageLabel: { fontSize: 11, color: "#9ca3af" },
  deleteBtn: { marginLeft: "auto", padding: 4 },
  deleteBtnText: { fontSize: 12, color: "#d1d5db" },
  entryText: { fontSize: 14, color: "#1a1a1a", lineHeight: 20 },
  entryBook: { fontSize: 11, color: "#6b7280", fontStyle: "italic" },
  entryDate: { fontSize: 10, color: "#d1d5db" },
  // Modal
  modalSafe: { flex: 1, backgroundColor: "#fafaf9" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  cancelText: { fontSize: 15, color: "#9ca3af" },
  modalTitle: { fontSize: 16, fontWeight: "600", color: "#1a1a1a" },
  saveText: { fontSize: 15, fontWeight: "600", color: "#1a1a1a" },
  modalScroll: { flex: 1 },
  modalContent: { padding: 16, gap: 16, paddingBottom: 40 },
  kindToggle: { flexDirection: "row", backgroundColor: "#f3f4f6", borderRadius: 10, padding: 3, gap: 3 },
  kindBtn: { flex: 1, paddingVertical: 9, borderRadius: 8, alignItems: "center" },
  kindBtnActive: { backgroundColor: "#fff" },
  kindBtnText: { fontSize: 13, fontWeight: "500", color: "#9ca3af" },
  kindBtnTextActive: { color: "#1a1a1a" },
  section: { gap: 6 },
  sectionLabel: { fontSize: 10, fontWeight: "700", color: "#9ca3af", letterSpacing: 1 },
  bookChip: { marginRight: 8, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: "#e5e7eb", backgroundColor: "#fff", maxWidth: 160 },
  bookChipActive: { backgroundColor: "#1a1a1a", borderColor: "#1a1a1a" },
  bookChipText: { fontSize: 12, color: "#1a1a1a" },
  pageInput: { borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, backgroundColor: "#fff" },
  textArea: { borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, backgroundColor: "#fff", minHeight: 140 },
});
