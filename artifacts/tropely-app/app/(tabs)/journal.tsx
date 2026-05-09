import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { EmptyState } from "@/components/EmptyState";
import { useColors } from "@/hooks/useColors";
import { useStore } from "@/lib/store";
import { JournalEntry, JournalType } from "@/types";

const TYPE_LABELS: Record<JournalType, string> = {
  note: "Note",
  quote: "Quote",
  reflection: "Reflection",
};

const TYPE_ICONS: Record<JournalType, React.ComponentProps<typeof Feather>["name"]> = {
  note: "edit-3",
  quote: "message-square",
  reflection: "heart",
};

export default function JournalScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const journals = useStore((s) => s.journals);
  const books = useStore((s) => s.books);
  const addJournal = useStore((s) => s.addJournal);
  const removeJournal = useStore((s) => s.removeJournal);

  const [showAdd, setShowAdd] = useState(false);
  const [type, setType] = useState<JournalType>("note");
  const [selectedBookId, setSelectedBookId] = useState<string>("");
  const [content, setContent] = useState("");

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const handleAdd = () => {
    if (!content.trim() || !selectedBookId) return;
    const book = books.find((b) => b.id === selectedBookId);
    if (!book) return;
    const entry: JournalEntry = {
      id: Date.now().toString() + Math.random().toString(36).slice(2, 7),
      bookId: selectedBookId,
      bookTitle: book.title,
      date: Date.now(),
      content: content.trim(),
      type,
    };
    addJournal(entry);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setContent("");
    setSelectedBookId("");
    setType("note");
    setShowAdd(false);
  };

  const handleDelete = (id: string) => {
    Alert.alert("Delete entry", "Remove this journal entry?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => removeJournal(id),
      },
    ]);
  };

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          { paddingTop: topPad + 8, backgroundColor: colors.background, borderBottomColor: colors.border },
        ]}
      >
        <Text style={[styles.screenTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
          Journal
        </Text>
      </View>

      {journals.length === 0 ? (
        <EmptyState
          icon="edit-3"
          title="Your journal is empty"
          subtitle="Record quotes, thoughts, and reflections as you read."
        />
      ) : (
        <FlatList
          data={journals}
          keyExtractor={(j) => j.id}
          contentContainerStyle={[styles.list, { paddingBottom: botPad + 100 }]}
          scrollEnabled={!!journals.length}
          renderItem={({ item }) => (
            <Pressable
              style={[
                styles.entry,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  borderRadius: colors.radius,
                },
              ]}
              onLongPress={() => handleDelete(item.id)}
            >
              <View style={styles.entryTop}>
                <View style={[styles.typeChip, { backgroundColor: colors.muted, borderRadius: 8 }]}>
                  <Feather name={TYPE_ICONS[item.type]} size={11} color={colors.mutedForeground} />
                  <Text style={[styles.typeLabel, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
                    {TYPE_LABELS[item.type]}
                  </Text>
                </View>
                <Text style={[styles.entryDate, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                  {formatDate(item.date)}
                </Text>
              </View>
              <Text style={[styles.entryContent, { color: colors.foreground, fontFamily: "Inter_400Regular" }]} numberOfLines={4}>
                {item.type === "quote" ? `"${item.content}"` : item.content}
              </Text>
              <Text style={[styles.entryBook, { color: colors.accent, fontFamily: "Inter_500Medium" }]} numberOfLines={1}>
                {item.bookTitle}
              </Text>
            </Pressable>
          )}
        />
      )}

      <Pressable
        style={[styles.fab, { backgroundColor: colors.foreground, bottom: botPad + 100 }]}
        onPress={() => {
          if (books.length === 0) return;
          setSelectedBookId(books[0].id);
          setShowAdd(true);
        }}
      >
        <Feather name="plus" size={22} color={colors.primaryForeground} />
      </Pressable>

      <Modal visible={showAdd} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowAdd(false)}>
        <View style={[styles.modalRoot, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Pressable onPress={() => setShowAdd(false)}>
              <Feather name="x" size={20} color={colors.foreground} />
            </Pressable>
            <Text style={[styles.modalTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
              New entry
            </Text>
            <Pressable onPress={handleAdd} disabled={!content.trim() || !selectedBookId}>
              <Text
                style={[
                  styles.modalSave,
                  {
                    color: content.trim() && selectedBookId ? colors.accent : colors.mutedForeground,
                    fontFamily: "Inter_600SemiBold",
                  },
                ]}
              >
                Save
              </Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="handled">
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
              TYPE
            </Text>
            <View style={styles.typeRow}>
              {(["note", "quote", "reflection"] as JournalType[]).map((t) => (
                <Pressable
                  key={t}
                  style={[
                    styles.typeBtn,
                    {
                      backgroundColor: type === t ? colors.foreground : colors.muted,
                      borderRadius: 12,
                    },
                  ]}
                  onPress={() => setType(t)}
                >
                  <Text
                    style={[
                      styles.typeBtnText,
                      {
                        color: type === t ? colors.primaryForeground : colors.foreground,
                        fontFamily: "Inter_500Medium",
                      },
                    ]}
                  >
                    {TYPE_LABELS[t]}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={[styles.fieldLabel, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
              BOOK
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bookScroll}>
              {books.map((b) => (
                <Pressable
                  key={b.id}
                  style={[
                    styles.bookChip,
                    {
                      backgroundColor: selectedBookId === b.id ? colors.foreground : colors.card,
                      borderColor: colors.border,
                      borderRadius: 20,
                    },
                  ]}
                  onPress={() => setSelectedBookId(b.id)}
                >
                  <Text
                    style={[
                      styles.bookChipText,
                      {
                        color: selectedBookId === b.id ? colors.primaryForeground : colors.foreground,
                        fontFamily: "Inter_400Regular",
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {b.title}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            <Text style={[styles.fieldLabel, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
              {type === "quote" ? "QUOTE" : type === "reflection" ? "REFLECTION" : "NOTE"}
            </Text>
            <TextInput
              style={[
                styles.contentInput,
                {
                  color: colors.foreground,
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  borderRadius: 12,
                  fontFamily: "Inter_400Regular",
                },
              ]}
              placeholder={
                type === "quote"
                  ? "Paste a favourite quote..."
                  : type === "reflection"
                  ? "What are you feeling about this book?"
                  : "Write a note..."
              }
              placeholderTextColor={colors.mutedForeground}
              multiline
              numberOfLines={6}
              value={content}
              onChangeText={setContent}
              textAlignVertical="top"
            />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  screenTitle: { fontSize: 28 },
  list: { padding: 20, gap: 14 },
  entry: { padding: 16, borderWidth: 1, gap: 8 },
  entryTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  typeChip: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3 },
  typeLabel: { fontSize: 11 },
  entryDate: { fontSize: 12 },
  entryContent: { fontSize: 15, lineHeight: 22 },
  entryBook: { fontSize: 12 },
  fab: {
    position: "absolute",
    right: 24,
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  modalRoot: { flex: 1 },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    paddingTop: 24,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalTitle: { fontSize: 16 },
  modalSave: { fontSize: 16 },
  modalBody: { padding: 20, gap: 12 },
  fieldLabel: { fontSize: 11, letterSpacing: 1.2 },
  typeRow: { flexDirection: "row", gap: 10 },
  typeBtn: { paddingHorizontal: 16, paddingVertical: 9 },
  typeBtnText: { fontSize: 14 },
  bookScroll: { marginHorizontal: -20, paddingHorizontal: 20 },
  bookChip: { paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, marginRight: 8, maxWidth: 160 },
  bookChipText: { fontSize: 13 },
  contentInput: {
    borderWidth: 1,
    padding: 14,
    minHeight: 140,
    fontSize: 16,
    lineHeight: 24,
  },
});
