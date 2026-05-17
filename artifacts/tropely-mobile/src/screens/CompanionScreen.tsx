import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRoute, type RouteProp } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { RootStackParamList } from "@/navigation";
import { useStore } from "@/store";
import { sendCompanionMessage, type CompanionMessage } from "@/lib/api";
import { usePremium } from "@/hooks/usePremium";
import { trackEvent } from "@/lib/analytics";

type Route = RouteProp<RootStackParamList, "Companion">;
type Mode = "reflect" | "character";

function historyKey(bookId: string, mode: Mode, characterName: string) {
  return `tropely-companion:${bookId}:${mode}:${characterName}`;
}

function TypingIndicator() {
  const dots = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];

  useEffect(() => {
    const anims = dots.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 180),
          Animated.timing(dot, { toValue: 1, duration: 260, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 260, useNativeDriver: true }),
          Animated.delay(540 - i * 180),
        ]),
      ),
    );
    anims.forEach((a) => a.start());
    return () => anims.forEach((a) => a.stop());
  }, []);

  return (
    <View style={styles.typingWrap}>
      {dots.map((dot, i) => (
        <Animated.View
          key={i}
          style={[
            styles.typingDot,
            {
              opacity: dot,
              transform: [{ translateY: dot.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }) }],
            },
          ]}
        />
      ))}
    </View>
  );
}

export default function CompanionScreen() {
  const route = useRoute<Route>();
  const { books, age } = useStore();
  const { isPremium } = usePremium();

  const isUnder13 = age !== null && age < 13;

  const bookId = route.params?.bookId;
  const allReadingBooks = books.filter((b) => b.shelf === "reading");
  const readingBooks = isPremium ? allReadingBooks : allReadingBooks.slice(0, 1);
  const [selectedBookId, setSelectedBookId] = useState(bookId ?? readingBooks[0]?.id);
  const book = books.find((b) => b.id === selectedBookId) ?? readingBooks[0];

  const [mode, setMode] = useState<Mode>("reflect");
  const [activeCharacter, setActiveCharacter] = useState("");
  const [characterInput, setCharacterInput] = useState("");
  const [messages, setMessages] = useState<CompanionMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    trackEvent("Companion Opened", { mode, bookId: selectedBookId ?? null });
  }, []);

  // Load persisted history when book/mode/character changes
  useEffect(() => {
    if (!book) return;
    const key = historyKey(selectedBookId ?? book.id, mode, activeCharacter);
    AsyncStorage.getItem(key).then((stored) => {
      if (stored) {
        try {
          setMessages(JSON.parse(stored));
          return;
        } catch {}
      }
      // No history — show greeting
      const greeting: CompanionMessage = {
        role: "assistant",
        content:
          mode === "reflect"
            ? `Hi! I'm your reading companion for "${book.title}". I know you're on page ${book.progress}. What's resonating with you right now?`
            : activeCharacter
            ? `*clears throat* … You wanted to speak with me? I'm ${activeCharacter}.`
            : "",
      };
      setMessages(greeting.content ? [greeting] : []);
    });
  }, [selectedBookId, book?.id, mode, activeCharacter]);

  // Save history whenever messages change
  useEffect(() => {
    if (!book || messages.length === 0) return;
    const key = historyKey(selectedBookId ?? book.id, mode, activeCharacter);
    AsyncStorage.setItem(key, JSON.stringify(messages));
  }, [messages]);

  const switchBook = (id: string) => {
    // Current history already saved via the effect above
    setSelectedBookId(id);
    setMode("reflect");
    setActiveCharacter("");
  };

  const send = async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text || busy || !book) return;
    if (mode === "character" && !isPremium) {
      Alert.alert("Premium feature", "Character chat requires a premium subscription.");
      return;
    }

    const userMsg: CompanionMessage = { role: "user", content: text };
    const nextMessages: CompanionMessage[] = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setBusy(true);

    try {
      const reply = await sendCompanionMessage(
        book.openLibraryKey ?? book.id,
        nextMessages,
        mode === "character" && activeCharacter
          ? { characterName: activeCharacter, tropes: book.tropes }
          : { tropes: book.tropes },
      );
      const finalMessages: CompanionMessage[] = [...nextMessages, { role: "assistant", content: reply }];
      setMessages(finalMessages);
      trackEvent("Companion Message Sent", { mode, isCharacter: mode === "character" });
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to reach the companion.";
      Alert.alert("Error", msg);
      setMessages(messages);
    } finally {
      setBusy(false);
    }
  };

  const reflectSuggestions = book
    ? [
        `How is page ${book.progress} sitting with me?`,
        "What's the emotional arc so far?",
        "Reflect on a line I saved.",
      ]
    : [];

  const characterSuggestions = activeCharacter
    ? [
        "How are you feeling right now?",
        "What are you most afraid of?",
        "What do you want more than anything?",
      ]
    : [];

  const suggestions = mode === "character" ? characterSuggestions : reflectSuggestions;

  if (!book) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Add a book to your reading shelf to use the companion.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={90}
      >
        {/* Book selector */}
        {allReadingBooks.length > 1 && (
          <View style={styles.bookSelector}>
            <FlatList
              horizontal
              data={readingBooks}
              keyExtractor={(b) => b.id}
              showsHorizontalScrollIndicator={false}
              renderItem={({ item: b }) => (
                <TouchableOpacity
                  style={[styles.bookChip, b.id === selectedBookId && styles.bookChipActive]}
                  onPress={() => switchBook(b.id)}
                >
                  <Text style={[styles.bookChipText, b.id === selectedBookId && styles.bookChipTextActive]} numberOfLines={1}>
                    {b.title}
                  </Text>
                </TouchableOpacity>
              )}
            />
            {!isPremium && (
              <Text style={styles.companionPremiumNote}>✨ Premium — unlock companion for all your books</Text>
            )}
          </View>
        )}

        {/* Mode toggle */}
        <View style={styles.modeRow}>
          <TouchableOpacity
            style={[styles.modeBtn, mode === "reflect" && styles.modeBtnActive]}
            onPress={() => { setMode("reflect"); setActiveCharacter(""); }}
          >
            <Text style={[styles.modeBtnText, mode === "reflect" && styles.modeBtnTextActive]}>
              📖 Reflect
            </Text>
          </TouchableOpacity>
          {!isUnder13 && (
            <TouchableOpacity
              style={[styles.modeBtn, mode === "character" && styles.modeBtnActive]}
              onPress={() => {
                if (!isPremium) {
                  Alert.alert("Premium feature", "Character chat requires a premium subscription.");
                  return;
                }
                setMode("character");
                setActiveCharacter("");
              }}
            >
              <Text style={[styles.modeBtnText, mode === "character" && styles.modeBtnTextActive]}>
                🎭 In Character {!isPremium ? "✨" : ""}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Character picker */}
        {mode === "character" && !activeCharacter && (
          <View style={styles.charPicker}>
            <Text style={styles.charPickerTitle}>Who do you want to speak with?</Text>
            <Text style={styles.charPickerSub}>
              Any character from "{book.title}", up to page {book.progress}.
            </Text>
            <View style={styles.charInputRow}>
              <TextInput
                style={styles.charInput}
                placeholder="Character name…"
                value={characterInput}
                onChangeText={setCharacterInput}
                onSubmitEditing={() => {
                  if (characterInput.trim()) setActiveCharacter(characterInput.trim());
                }}
              />
              <TouchableOpacity
                style={[styles.charBeginBtn, !characterInput.trim() && styles.charBeginBtnDisabled]}
                onPress={() => { if (characterInput.trim()) setActiveCharacter(characterInput.trim()); }}
                disabled={!characterInput.trim()}
              >
                <Text style={styles.charBeginBtnText}>Begin</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.charSuggestions}>
              {["the protagonist", "the narrator", "the antagonist", "a side character"].map((s) => (
                <TouchableOpacity key={s} style={styles.charSuggChip} onPress={() => setCharacterInput(s)}>
                  <Text style={styles.charSuggText}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Messages */}
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(_, i) => String(i)}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          renderItem={({ item: m }) => (
            <View style={[styles.bubble, m.role === "user" ? styles.bubbleUser : styles.bubbleAssistant]}>
              {m.role === "assistant" && mode === "character" && activeCharacter && (
                <Text style={styles.characterLabel}>{activeCharacter}</Text>
              )}
              <Text style={[styles.bubbleText, m.role === "user" && styles.bubbleTextUser]}>
                {m.content}
              </Text>
            </View>
          )}
          ListFooterComponent={busy ? <TypingIndicator /> : null}
        />

        {/* Suggestions */}
        {!busy && suggestions.length > 0 && messages.length <= 1 && (
          <View style={styles.suggestionsRow}>
            <FlatList
              horizontal
              data={suggestions}
              keyExtractor={(s) => s}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 12, gap: 8 }}
              renderItem={({ item: s }) => (
                <TouchableOpacity style={styles.suggChip} onPress={() => send(s)}>
                  <Text style={styles.suggChipText}>{s}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        {/* Input bar */}
        {(mode === "reflect" || activeCharacter) && (
          <View style={styles.inputBar}>
            <TextInput
              style={styles.inputField}
              value={input}
              onChangeText={setInput}
              placeholder={
                mode === "character"
                  ? `Say something to ${activeCharacter}…`
                  : "What's resonating right now?"
              }
              multiline
              maxLength={500}
              editable={!busy}
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!input.trim() || busy) && styles.sendBtnDisabled]}
              onPress={() => send()}
              disabled={!input.trim() || busy}
            >
              <Text style={styles.sendBtnText}>↑</Text>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fafaf9" },
  empty: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32 },
  emptyText: { fontSize: 15, color: "#9ca3af", textAlign: "center" },
  bookSelector: { paddingVertical: 8, paddingLeft: 12, borderBottomWidth: 1, borderBottomColor: "#f0ede8", gap: 6 },
  companionPremiumNote: { fontSize: 11, color: "#9ca3af", paddingHorizontal: 4, paddingBottom: 4 },
  bookChip: { marginRight: 8, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: "#e5e7eb", backgroundColor: "#fff", maxWidth: 180 },
  bookChipActive: { backgroundColor: "#1a1a1a", borderColor: "#1a1a1a" },
  bookChipText: { fontSize: 12, color: "#6b7280" },
  bookChipTextActive: { color: "#fff" },
  modeRow: { flexDirection: "row", gap: 8, padding: 12, borderBottomWidth: 1, borderBottomColor: "#f0ede8" },
  modeBtn: { flex: 1, paddingVertical: 9, borderRadius: 20, alignItems: "center", borderWidth: 1, borderColor: "#e5e7eb" },
  modeBtnActive: { backgroundColor: "#1a1a1a", borderColor: "#1a1a1a" },
  modeBtnText: { fontSize: 13, fontWeight: "500", color: "#6b7280" },
  modeBtnTextActive: { color: "#fff" },
  charPicker: { margin: 12, backgroundColor: "#fff", borderRadius: 16, padding: 16, gap: 10, borderWidth: 1, borderColor: "#f0ede8" },
  charPickerTitle: { fontSize: 15, fontWeight: "700", color: "#1a1a1a" },
  charPickerSub: { fontSize: 12, color: "#9ca3af" },
  charInputRow: { flexDirection: "row", gap: 8 },
  charInput: { flex: 1, borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, fontSize: 14, backgroundColor: "#fafafa" },
  charBeginBtn: { backgroundColor: "#1a1a1a", borderRadius: 10, paddingHorizontal: 16, justifyContent: "center" },
  charBeginBtnDisabled: { opacity: 0.4 },
  charBeginBtnText: { color: "#fff", fontWeight: "600" },
  charSuggestions: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  charSuggChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: "#f3f4f6" },
  charSuggText: { fontSize: 12, color: "#6b7280" },
  messagesList: { padding: 12, gap: 12, flexGrow: 1 },
  bubble: { maxWidth: "85%", borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10, gap: 4 },
  bubbleUser: { alignSelf: "flex-end", backgroundColor: "#1a1a1a" },
  bubbleAssistant: { alignSelf: "flex-start", backgroundColor: "#fff", borderWidth: 1, borderColor: "#f0ede8" },
  characterLabel: { fontSize: 10, fontWeight: "700", color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.5 },
  bubbleText: { fontSize: 14, color: "#1a1a1a", lineHeight: 20 },
  bubbleTextUser: { color: "#fff" },
  typingWrap: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 16, paddingVertical: 12, alignSelf: "flex-start", backgroundColor: "#fff", borderRadius: 18, marginLeft: 12, marginBottom: 8, borderWidth: 1, borderColor: "#f0ede8" },
  typingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#9ca3af" },
  suggestionsRow: { paddingVertical: 8, borderTopWidth: 1, borderTopColor: "#f0ede8" },
  suggChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: "#fff", borderWidth: 1, borderColor: "#e5e7eb" },
  suggChipText: { fontSize: 12, color: "#6b7280" },
  inputBar: { flexDirection: "row", gap: 8, padding: 12, borderTopWidth: 1, borderTopColor: "#f0ede8", backgroundColor: "#fff" },
  inputField: { flex: 1, borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, maxHeight: 100, backgroundColor: "#fafafa" },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#1a1a1a", justifyContent: "center", alignItems: "center", alignSelf: "flex-end" },
  sendBtnDisabled: { opacity: 0.4 },
  sendBtnText: { color: "#fff", fontSize: 18, fontWeight: "700" },
});
