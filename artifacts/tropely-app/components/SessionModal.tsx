import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { useStore } from "@/lib/store";
import { Book, MOODS, MoodKey, ReadingSession } from "@/types";

interface Props {
  book: Book;
  visible: boolean;
  onClose: () => void;
}

export function SessionModal({ book, visible, onClose }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const logSession = useStore((s) => s.logSession);

  const [pages, setPages] = useState("10");
  const [minutes, setMinutes] = useState("20");
  const [mood, setMood] = useState<MoodKey | null>(null);
  const [note, setNote] = useState("");

  const canSave = mood !== null && Number(pages) > 0;

  const handleSave = () => {
    if (!canSave) return;
    const session: ReadingSession = {
      id: Date.now().toString() + Math.random().toString(36).slice(2, 7),
      date: Date.now(),
      pages: Number(pages) || 0,
      minutes: Number(minutes) || 0,
      mood: mood!,
      note: note.trim() || undefined,
    };
    logSession(book.id, session);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setPages("10");
    setMinutes("20");
    setMood(null);
    setNote("");
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: colors.background }]}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View
          style={[
            styles.header,
            {
              borderBottomColor: colors.border,
              paddingTop: Platform.OS === "web" ? 20 : 16,
            },
          ]}
        >
          <Pressable onPress={onClose} hitSlop={10}>
            <Text style={[styles.cancel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              Cancel
            </Text>
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
            Log session
          </Text>
          <Pressable onPress={handleSave} disabled={!canSave} hitSlop={10}>
            <Text
              style={[
                styles.save,
                {
                  color: canSave ? colors.accent : colors.mutedForeground,
                  fontFamily: "Inter_600SemiBold",
                },
              ]}
            >
              Save
            </Text>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={[
            styles.body,
            { paddingBottom: Math.max(insets.bottom + 20, 40) },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[styles.bookTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
            {book.title}
          </Text>

          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
              PAGES READ
            </Text>
            <View style={styles.numberRow}>
              <Pressable
                style={[styles.stepper, { backgroundColor: colors.muted, borderRadius: 10 }]}
                onPress={() => setPages((v) => String(Math.max(0, Number(v) - 5)))}
              >
                <Text style={[styles.stepperText, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>−5</Text>
              </Pressable>
              <TextInput
                style={[styles.numInput, { color: colors.foreground, borderColor: colors.border, fontFamily: "Inter_600SemiBold" }]}
                value={pages}
                onChangeText={setPages}
                keyboardType="number-pad"
              />
              <Pressable
                style={[styles.stepper, { backgroundColor: colors.muted, borderRadius: 10 }]}
                onPress={() => setPages((v) => String(Number(v) + 5))}
              >
                <Text style={[styles.stepperText, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>+5</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
              MINUTES
            </Text>
            <View style={styles.numberRow}>
              {[15, 30, 45, 60].map((m) => (
                <Pressable
                  key={m}
                  style={[
                    styles.presetBtn,
                    {
                      backgroundColor: minutes === String(m) ? colors.foreground : colors.muted,
                      borderRadius: 10,
                    },
                  ]}
                  onPress={() => setMinutes(String(m))}
                >
                  <Text
                    style={[
                      styles.presetText,
                      {
                        color: minutes === String(m) ? colors.primaryForeground : colors.foreground,
                        fontFamily: "Inter_500Medium",
                      },
                    ]}
                  >
                    {m}m
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
              HOW DID IT FEEL?
            </Text>
            <View style={styles.moodGrid}>
              {MOODS.map((m) => (
                <Pressable
                  key={m.key}
                  onPress={() => setMood(m.key)}
                  style={[
                    styles.moodBtn,
                    {
                      backgroundColor: mood === m.key ? m.color : m.bg,
                      borderRadius: 12,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.moodBtnText,
                      {
                        color: mood === m.key ? "#fff" : m.color,
                        fontFamily: "Inter_500Medium",
                      },
                    ]}
                  >
                    {m.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
              NOTE (OPTIONAL)
            </Text>
            <TextInput
              style={[
                styles.noteInput,
                {
                  color: colors.foreground,
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  borderRadius: 12,
                  fontFamily: "Inter_400Regular",
                },
              ]}
              placeholder="A quote, thought, or feeling..."
              placeholderTextColor={colors.mutedForeground}
              multiline
              numberOfLines={3}
              value={note}
              onChangeText={setNote}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  cancel: { fontSize: 16 },
  headerTitle: { fontSize: 16 },
  save: { fontSize: 16 },
  body: { padding: 20, gap: 24 },
  bookTitle: { fontSize: 18, marginBottom: 4 },
  section: { gap: 12 },
  sectionLabel: { fontSize: 11, letterSpacing: 1.2 },
  numberRow: { flexDirection: "row", gap: 10, alignItems: "center" },
  stepper: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  stepperText: { fontSize: 14 },
  numInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 20,
    textAlign: "center",
  },
  presetBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
  },
  presetText: { fontSize: 14 },
  moodGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  moodBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  moodBtnText: { fontSize: 14 },
  noteInput: {
    borderWidth: 1,
    padding: 12,
    minHeight: 80,
    textAlignVertical: "top",
    fontSize: 15,
  },
});
