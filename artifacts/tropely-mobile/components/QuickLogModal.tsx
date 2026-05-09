import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
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
import { MOOD_KEYS } from "@/lib/moods";
import { useStore } from "@/lib/store";
import type { MoodKey } from "@/constants/colors";

interface Props {
  bookId: string;
  bookTitle: string;
  onClose: () => void;
}

export function QuickLogModal({ bookId, bookTitle, onClose }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const logSession = useStore((s) => s.logSession);
  const updateProgress = useStore((s) => s.updateProgress);
  const book = useStore((s) => s.books.find((b) => b.id === bookId));

  const [pages, setPages] = useState("");
  const [minutes, setMinutes] = useState("");
  const [mood, setMood] = useState<MoodKey | undefined>(book?.mood);
  const [note, setNote] = useState("");

  const save = () => {
    const p = parseInt(pages, 10);
    const m = parseInt(minutes, 10);
    if (isNaN(p) || p <= 0) return;

    logSession({
      bookId,
      pagesRead: p,
      minutes: isNaN(m) ? undefined : m,
      mood,
      note: note.trim() || undefined,
    });

    if (book) {
      updateProgress(bookId, (book.progress ?? 0) + p);
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onClose();
  };

  const s = StyleSheet.create({
    backdrop: {
      position: "absolute", inset: 0,
      backgroundColor: "rgba(0,0,0,0.6)",
      justifyContent: "flex-end",
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
      alignItems: "center", marginBottom: 20,
    },
    title: { fontSize: 17, fontFamily: "Inter_700Bold", color: colors.foreground },
    bookTitle: {
      fontSize: 12, fontFamily: "Inter_400Regular",
      color: colors.mutedForeground, marginTop: 2,
    },
    row: { flexDirection: "row", gap: 10, marginBottom: 16 },
    inputGroup: { flex: 1 },
    label: {
      fontSize: 11, fontFamily: "Inter_600SemiBold",
      color: colors.mutedForeground, textTransform: "uppercase",
      letterSpacing: 0.8, marginBottom: 6,
    },
    input: {
      backgroundColor: colors.background, borderWidth: 1,
      borderColor: colors.border, borderRadius: 10,
      paddingHorizontal: 12, paddingVertical: 11,
      fontSize: 20, fontFamily: "Inter_700Bold",
      color: colors.foreground, textAlign: "center",
    },
    moodSection: { marginBottom: 16 },
    moodRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 },
    noteInput: {
      backgroundColor: colors.background, borderWidth: 1,
      borderColor: colors.border, borderRadius: 10,
      paddingHorizontal: 12, paddingVertical: 10,
      fontSize: 13, fontFamily: "Inter_400Regular",
      color: colors.foreground, marginBottom: 16, height: 60,
      textAlignVertical: "top",
    },
    quickPages: { flexDirection: "row", gap: 6, marginTop: 6 },
    quickBtn: {
      paddingHorizontal: 10, paddingVertical: 5,
      backgroundColor: colors.muted, borderRadius: 8,
    },
    quickBtnText: {
      fontSize: 12, fontFamily: "Inter_500Medium", color: colors.mutedForeground,
    },
    saveBtn: {
      backgroundColor: colors.primary, borderRadius: 12,
      paddingVertical: 14, alignItems: "center",
    },
    saveBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#fff" },
  });

  return (
    <Pressable style={s.backdrop} onPress={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "position" : undefined}>
        <Pressable style={s.sheet} onPress={() => {}}>
          <View style={s.handle} />
          <View style={s.header}>
            <View style={{ flex: 1, marginRight: 16 }}>
              <Text style={s.title}>Log session</Text>
              <Text style={s.bookTitle} numberOfLines={1}>{bookTitle}</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Feather name="x" size={20} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          <View style={s.row}>
            <View style={s.inputGroup}>
              <Text style={s.label}>Pages</Text>
              <TextInput
                style={s.input}
                placeholder="0"
                placeholderTextColor={colors.mutedForeground}
                value={pages}
                onChangeText={setPages}
                keyboardType="number-pad"
                autoFocus
              />
              <View style={s.quickPages}>
                {[5, 10, 20, 30].map((n) => (
                  <TouchableOpacity
                    key={n}
                    style={s.quickBtn}
                    onPress={() => setPages(String((parseInt(pages) || 0) + n))}
                  >
                    <Text style={s.quickBtnText}>+{n}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={s.inputGroup}>
              <Text style={s.label}>Minutes</Text>
              <TextInput
                style={s.input}
                placeholder="0"
                placeholderTextColor={colors.mutedForeground}
                value={minutes}
                onChangeText={setMinutes}
                keyboardType="number-pad"
              />
            </View>
          </View>

          <View style={s.moodSection}>
            <Text style={s.label}>How did it feel?</Text>
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
          </View>

          <TextInput
            style={s.noteInput}
            placeholder="Quick note (optional)"
            placeholderTextColor={colors.mutedForeground}
            value={note}
            onChangeText={setNote}
            multiline
          />

          <TouchableOpacity
            style={[s.saveBtn, (!pages || parseInt(pages) <= 0) && { opacity: 0.5 }]}
            onPress={save}
            disabled={!pages || parseInt(pages) <= 0}
          >
            <Text style={s.saveBtnText}>Save session</Text>
          </TouchableOpacity>
        </Pressable>
      </KeyboardAvoidingView>
    </Pressable>
  );
}
