import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MoodChip } from "@/components/MoodChip";
import { useColors } from "@/hooks/useColors";
import { MOOD_KEYS, MOODS } from "@/lib/moods";
import { selectors, useStore, type JournalEntry } from "@/lib/store";
import type { MoodKey } from "@/constants/colors";

const TAB_BAR_HEIGHT = 84;

function EntryCard({ entry, onDelete }: { entry: JournalEntry; onDelete: () => void }) {
  const colors = useColors();
  const book = useStore((s) => s.books.find((b) => b.id === entry.bookId));

  const s = StyleSheet.create({
    card: {
      backgroundColor: colors.card, marginHorizontal: 20,
      borderRadius: colors.radius + 4, padding: 16, marginBottom: 10,
      borderWidth: 1, borderColor: colors.border,
    },
    top: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
    dot: { width: 8, height: 8, borderRadius: 4 },
    book: { fontSize: 12, fontFamily: "Inter_500Medium", color: colors.mutedForeground, flex: 1 },
    date: { fontSize: 11, fontFamily: "Inter_400Regular", color: colors.mutedForeground },
    text: {
      fontSize: 14, fontFamily: "Inter_400Regular",
      color: colors.foreground, lineHeight: 21,
    },
    delBtn: { marginTop: 10, alignSelf: "flex-end" },
  });

  const accent = entry.mood ? MOODS[entry.mood].accent : colors.mutedForeground;

  return (
    <View style={s.card}>
      <View style={s.top}>
        <View style={[s.dot, { backgroundColor: accent }]} />
        <Text style={s.book} numberOfLines={1}>
          {book?.title ?? "General"} {entry.mood ? `· ${MOODS[entry.mood].emoji}` : ""}
        </Text>
        <Text style={s.date}>
          {new Date(entry.createdAt).toLocaleDateString("en", { month: "short", day: "numeric" })}
        </Text>
      </View>
      <Text style={s.text}>{entry.text}</Text>
      <TouchableOpacity style={s.delBtn} onPress={onDelete}>
        <Feather name="trash-2" size={14} color={colors.mutedForeground} />
      </TouchableOpacity>
    </View>
  );
}

function NewEntrySheet({ onClose }: { onClose: () => void }) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const books = useStore((s) => s.books.filter((b) => b.shelf === "reading"));
  const addJournal = useStore((s) => s.addJournal);

  const [text, setText] = useState("");
  const [mood, setMood] = useState<MoodKey | undefined>(undefined);
  const [bookId, setBookId] = useState<string | undefined>(undefined);
  const [isSpoiler, setIsSpoiler] = useState(false);

  const save = () => {
    if (!text.trim()) return;
    addJournal({ text: text.trim(), mood, bookId, isSpoiler });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onClose();
  };

  const s = StyleSheet.create({
    backdrop: {
      position: "absolute", inset: 0,
      backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end",
    },
    sheet: {
      backgroundColor: colors.card,
      borderTopLeftRadius: 20, borderTopRightRadius: 20,
      padding: 20,
      paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 16,
    },
    handle: {
      width: 36, height: 4, borderRadius: 2,
      backgroundColor: colors.border, alignSelf: "center", marginBottom: 16,
    },
    header: {
      flexDirection: "row", justifyContent: "space-between",
      alignItems: "center", marginBottom: 16,
    },
    title: { fontSize: 17, fontFamily: "Inter_700Bold", color: colors.foreground },
    input: {
      backgroundColor: colors.background,
      borderWidth: 1, borderColor: colors.border,
      borderRadius: 10, padding: 12, height: 100,
      fontSize: 14, fontFamily: "Inter_400Regular",
      color: colors.foreground, textAlignVertical: "top",
      marginBottom: 16,
    },
    label: {
      fontSize: 12, fontFamily: "Inter_600SemiBold",
      color: colors.mutedForeground, textTransform: "uppercase",
      letterSpacing: 0.8, marginBottom: 10,
    },
    moodRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
    bookRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
    bookChip: {
      paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
      borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background,
    },
    bookChipActive: { borderColor: colors.primary, backgroundColor: colors.primary + "15" },
    bookChipText: { fontSize: 12, fontFamily: "Inter_500Medium", color: colors.foreground },
    bookChipTextActive: { color: colors.primary },
    row: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16 },
    toggleBtn: {
      paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8,
      borderWidth: 1, borderColor: colors.border,
    },
    toggleBtnActive: { borderColor: "#D4A832", backgroundColor: "#D4A83215" },
    toggleText: { fontSize: 12, fontFamily: "Inter_500Medium", color: colors.mutedForeground },
    toggleTextActive: { color: "#D4A832" },
    btn: {
      backgroundColor: colors.primary, borderRadius: 12,
      paddingVertical: 13, alignItems: "center",
    },
    btnText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#fff" },
  });

  return (
    <Pressable style={s.backdrop} onPress={onClose}>
      <Pressable style={s.sheet} onPress={() => {}}>
        <View style={s.handle} />
        <View style={s.header}>
          <Text style={s.title}>New entry</Text>
          <TouchableOpacity onPress={onClose}>
            <Feather name="x" size={20} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        <TextInput
          style={s.input}
          placeholder="What's on your mind?"
          placeholderTextColor={colors.mutedForeground}
          value={text}
          onChangeText={setText}
          multiline
          autoFocus
        />

        <Text style={s.label}>Mood</Text>
        <View style={s.moodRow}>
          {MOOD_KEYS.map((k) => (
            <MoodChip
              key={k}
              moodKey={k}
              selected={mood === k}
              onPress={() => setMood(mood === k ? undefined : k)}
              compact
            />
          ))}
        </View>

        {books.length > 0 && (
          <>
            <Text style={s.label}>Book</Text>
            <View style={s.bookRow}>
              {books.map((b) => (
                <Pressable
                  key={b.id}
                  style={[s.bookChip, bookId === b.id && s.bookChipActive]}
                  onPress={() => setBookId(bookId === b.id ? undefined : b.id)}
                >
                  <Text style={[s.bookChipText, bookId === b.id && s.bookChipTextActive]} numberOfLines={1}>
                    {b.title}
                  </Text>
                </Pressable>
              ))}
            </View>
          </>
        )}

        <View style={s.row}>
          <TouchableOpacity
            style={[s.toggleBtn, isSpoiler && s.toggleBtnActive]}
            onPress={() => setIsSpoiler(!isSpoiler)}
          >
            <Text style={[s.toggleText, isSpoiler && s.toggleTextActive]}>⚠️ Spoiler</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={[s.btn, !text.trim() && { opacity: 0.5 }]} onPress={save} disabled={!text.trim()}>
          <Text style={s.btnText}>Save entry</Text>
        </TouchableOpacity>
      </Pressable>
    </Pressable>
  );
}

export default function JournalScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const journal = useStore((s) => s.journal);
  const removeJournal = useStore((s) => s.removeJournal);
  const [adding, setAdding] = useState(false);

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      paddingTop: Platform.OS === "web" ? 67 : insets.top + 12,
      paddingHorizontal: 20, paddingBottom: 16,
      flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end",
    },
    title: { fontSize: 28, fontFamily: "Inter_700Bold", color: colors.foreground },
    addBtn: {
      width: 38, height: 38, borderRadius: 10,
      backgroundColor: colors.primary,
      alignItems: "center", justifyContent: "center",
    },
    empty: {
      flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 40,
    },
    emptyText: {
      fontSize: 15, fontFamily: "Inter_400Regular",
      color: colors.mutedForeground, textAlign: "center", marginTop: 12,
    },
  });

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Journal</Text>
        <TouchableOpacity style={s.addBtn} onPress={() => setAdding(true)}>
          <Feather name="plus" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {journal.length === 0 ? (
        <View style={s.empty}>
          <Feather name="edit-3" size={42} color={colors.mutedForeground} />
          <Text style={s.emptyText}>
            Your reading thoughts live here.{"\n"}Write your first entry.
          </Text>
          <TouchableOpacity
            style={{ marginTop: 16, paddingHorizontal: 20, paddingVertical: 10, backgroundColor: colors.primary, borderRadius: 10 }}
            onPress={() => setAdding(true)}
          >
            <Text style={{ fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#fff" }}>
              New entry
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={journal}
          keyExtractor={(e) => e.id}
          renderItem={({ item }) => (
            <EntryCard entry={item} onDelete={() => removeJournal(item.id)} />
          )}
          contentContainerStyle={{
            paddingTop: 4,
            paddingBottom: (Platform.OS === "web" ? 34 : insets.bottom) + TAB_BAR_HEIGHT,
          }}
          scrollEnabled={!!journal.length}
          showsVerticalScrollIndicator={false}
        />
      )}

      {adding && <NewEntrySheet onClose={() => setAdding(false)} />}
    </View>
  );
}
