import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Modal,
  Alert,
  Share,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/navigation";
import { useStore } from "@/store";
import { usePremium } from "@/hooks/usePremium";
import { trackEvent } from "@/lib/analytics";

type Nav = NativeStackNavigationProp<RootStackParamList>;

type KindFilter = "all" | "note" | "quote";

export default function JournalScreen() {
  const nav = useNavigation<Nav>();
  const { books, journal, addJournalEntry, deleteJournalEntry } = useStore();
  const { isPremium } = usePremium();

  const [showAdd, setShowAdd] = useState(false);
  const [kind, setKind] = useState<"quote" | "note">("note");
  const [text, setText] = useState("");
  const [page, setPage] = useState("");
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [kindFilter, setKindFilter] = useState<KindFilter>("all");
  const [bookFilter, setBookFilter] = useState<string | null>(null);

  const readingBooks = books.filter((b) => b.shelf === "reading");
  const allBooks = books;

  const filtered = useMemo(() => {
    return journal.filter((e) => {
      if (kindFilter !== "all" && e.kind !== kindFilter) return false;
      if (bookFilter && e.bookId !== bookFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        if (!e.text.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [journal, kindFilter, bookFilter, search]);

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
    trackEvent("Journal Entry Added", { kind, hasPage: !!page });
    setText("");
    setPage("");
    setShowAdd(false);
  };

  const exportJournal = async () => {
    if (!isPremium) {
      Alert.alert("Premium feature", "Upgrade to Premium to export your journal.");
      return;
    }
    const lines: string[] = ["# My Reading Journal", ""];
    for (const e of journal) {
      const book = books.find((b) => b.id === e.bookId);
      lines.push(`## ${e.kind === "quote" ? "Highlight" : "Note"} — ${book?.title ?? "Unknown"}`);
      if (e.page) lines.push(`Page ${e.page}`);
      lines.push(e.text);
      lines.push(`*${new Date(e.date).toLocaleDateString()}*`);
      lines.push("");
    }
    try {
      await Share.share({ message: lines.join("\n") });
      trackEvent("Journal Exported", { entryCount: journal.length });
    } catch {}
  };

  const booksWithEntries = useMemo(() => {
    const ids = new Set(journal.map((e) => e.bookId));
    return allBooks.filter((b) => ids.has(b.id));
  }, [journal, allBooks]);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Journal</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.exportBtn, !isPremium && styles.exportBtnLocked]}
            onPress={exportJournal}
          >
            <Text style={styles.exportBtnText}>{isPremium ? "Export" : "✨ Export"}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowAdd(true)}>
            <Text style={styles.addBtnText}>+ Add</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search entries…"
          value={search}
          onChangeText={setSearch}
          clearButtonMode="while-editing"
          returnKeyType="search"
        />
      </View>

      {/* Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterRow}
      >
        {(["all", "quote", "note"] as KindFilter[]).map((k) => (
          <TouchableOpacity
            key={k}
            style={[styles.filterChip, kindFilter === k && styles.filterChipActive]}
            onPress={() => setKindFilter(k)}
          >
            <Text style={[styles.filterChipText, kindFilter === k && styles.filterChipTextActive]}>
              {k === "all" ? "All" : k === "quote" ? "💬 Highlights" : "📝 Notes"}
            </Text>
          </TouchableOpacity>
        ))}
        {booksWithEntries.map((b) => (
          <TouchableOpacity
            key={b.id}
            style={[styles.filterChip, bookFilter === b.id && styles.filterChipActive]}
            onPress={() => setBookFilter(bookFilter === b.id ? null : b.id)}
          >
            <Text
              style={[styles.filterChipText, bookFilter === b.id && styles.filterChipTextActive]}
              numberOfLines={1}
            >
              {b.title}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {journal.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📖</Text>
            <Text style={styles.emptyTitle}>No entries yet</Text>
            <Text style={styles.emptyHint}>
              Add highlights and notes from your reading sessions.
            </Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => setShowAdd(true)}>
              <Text style={styles.emptyBtnText}>Add first entry</Text>
            </TouchableOpacity>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🔍</Text>
            <Text style={styles.emptyTitle}>No matches</Text>
            <Text style={styles.emptyHint}>Try a different search or filter.</Text>
          </View>
        ) : (
          filtered.map((entry) => {
            const book = books.find((b) => b.id === entry.bookId);
            return (
              <View key={entry.id} style={styles.entryCard}>
                <View style={styles.entryHeader}>
                  <View style={[styles.kindBadge, entry.kind === "quote" && styles.kindBadgeQuote]}>
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
                        { text: "Delete", style: "destructive", onPress: () => deleteJournalEntry(entry.id) },
                      ])
                    }
                    style={styles.deleteBtn}
                  >
                    <Text style={styles.deleteBtnText}>✕</Text>
                  </TouchableOpacity>
                </View>
                {entry.kind === "quote" ? (
                  <View style={styles.blockquote}>
                    <View style={styles.blockquoteBorder} />
                    <Text style={styles.blockquoteText}>"{entry.text}"</Text>
                  </View>
                ) : (
                  <Text style={styles.entryText}>{entry.text}</Text>
                )}
                {book && (
                  <TouchableOpacity onPress={() => nav.navigate("BookDetail", { bookId: book.id })}>
                    <Text style={[styles.entryBook, styles.entryBookLink]}>{book.title}</Text>
                  </TouchableOpacity>
                )}
                <Text style={styles.entryDate}>{new Date(entry.date).toLocaleDateString()}</Text>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Stats footer when journal has entries */}
      {journal.length > 0 && (
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {filtered.length} entr{filtered.length !== 1 ? "ies" : "y"}
            {filtered.length !== journal.length ? ` (of ${journal.length})` : ""}
          </Text>
        </View>
      )}

      {/* Add entry modal */}
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
            {readingBooks.length > 0 && (
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
                autoFocus
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f5f0ff" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  title: { fontSize: 26, fontWeight: "700", color: "#1a1a1a" },
  headerActions: { flexDirection: "row", gap: 8, alignItems: "center" },
  exportBtn: { borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  exportBtnLocked: { borderColor: "#fde68a", backgroundColor: "#fffbeb" },
  exportBtnText: { fontSize: 12, fontWeight: "600", color: "#6b7280" },
  addBtn: { backgroundColor: "#1a1a1a", borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 },
  addBtnText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  searchRow: { paddingHorizontal: 16, paddingBottom: 8 },
  searchInput: { backgroundColor: "#f3f4f6", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 9, fontSize: 14, color: "#1a1a1a" },
  filterScroll: { flexGrow: 0 },
  filterRow: { paddingHorizontal: 16, gap: 6, paddingBottom: 10 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: "#f3f4f6", maxWidth: 160 },
  filterChipActive: { backgroundColor: "#1a1a1a" },
  filterChipText: { fontSize: 12, fontWeight: "500", color: "#6b7280" },
  filterChipTextActive: { color: "#fff" },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 12, paddingBottom: 32 },
  empty: { alignItems: "center", paddingTop: 60, gap: 8 },
  emptyEmoji: { fontSize: 36 },
  emptyTitle: { fontSize: 17, fontWeight: "600", color: "#1a1a1a" },
  emptyHint: { fontSize: 14, color: "#9ca3af", textAlign: "center", paddingHorizontal: 32, lineHeight: 20 },
  emptyBtn: { backgroundColor: "#1a1a1a", borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10, marginTop: 8 },
  emptyBtnText: { color: "#fff", fontWeight: "600", fontSize: 13 },
  entryCard: { backgroundColor: "#fff", borderRadius: 14, padding: 14, gap: 8, borderWidth: 1, borderColor: "#f0ede8" },
  entryHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  kindBadge: { backgroundColor: "#f3f4f6", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  kindBadgeQuote: { backgroundColor: "#fef3c7" },
  kindBadgeText: { fontSize: 11, fontWeight: "600", color: "#6b7280" },
  pageLabel: { fontSize: 11, color: "#9ca3af" },
  deleteBtn: { marginLeft: "auto", padding: 4 },
  deleteBtnText: { fontSize: 12, color: "#d1d5db" },
  entryText: { fontSize: 14, color: "#2d1f10", lineHeight: 20 },
  blockquote: { flexDirection: "row", gap: 10 },
  blockquoteBorder: { width: 3, borderRadius: 2, backgroundColor: "#d4c9a8" },
  blockquoteText: { flex: 1, fontSize: 14, color: "#3b2e1a", fontStyle: "italic", lineHeight: 22 },
  entryBook: { fontSize: 11, color: "#6b7280", fontStyle: "italic" },
  entryBookLink: { textDecorationLine: "underline" },
  entryDate: { fontSize: 10, color: "#d1d5db" },
  footer: { borderTopWidth: 1, borderTopColor: "#f0ede8", paddingHorizontal: 16, paddingVertical: 10, backgroundColor: "#fff" },
  footerText: { fontSize: 12, color: "#9ca3af", textAlign: "center" },
  // Modal
  modalSafe: { flex: 1, backgroundColor: "#fafaf9" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, borderBottomWidth: 1, borderBottomColor: "#f0ede8" },
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
