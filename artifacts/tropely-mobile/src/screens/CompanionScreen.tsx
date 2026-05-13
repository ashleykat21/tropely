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
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRoute, type RouteProp } from "@react-navigation/native";
import { useAuth } from "@clerk/clerk-expo";
import type { RootStackParamList } from "@/navigation";
import { useStore } from "@/store";
import { sendCompanionMessage, type CompanionMessage } from "@/lib/api";

type Route = RouteProp<RootStackParamList, "Companion">;
type Mode = "reflect" | "character";

const RECENT_CHARS_KEY = (bk: string) => `tropely-companion-chars:${bk}`;
const getRecentChars = (bk: string): string[] => {
  // AsyncStorage is async; for simplicity we use a module-level cache here.
  return [];
};

export default function CompanionScreen() {
  const route = useRoute<Route>();
  const { getToken } = useAuth();
  const { books, sessions, journal } = useStore();

  const bookId = route.params?.bookId;
  const readingBooks = books.filter((b) => b.shelf === "reading");
  const [selectedBookId, setSelectedBookId] = useState(
    bookId ?? readingBooks[0]?.id,
  );
  const book = books.find((b) => b.id === selectedBookId) ?? readingBooks[0];

  const [mode, setMode] = useState<Mode>("reflect");
  const [activeCharacter, setActiveCharacter] = useState("");
  const [characterInput, setCharacterInput] = useState("");
  const [messages, setMessages] = useState<CompanionMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const listRef = useRef<FlatList>(null);

  const isPremium = useStore((s) => s.isPremium);

  useEffect(() => {
    if (!book) return;
    const greeting: CompanionMessage = {
      role: "assistant",
      content:
        mode === "reflect"
          ? `Hi! I'm your reading companion for "${book.title}". I know you're on page ${book.progress}. What's resonating with you right now?`
          : activeCharacter
          ? `*clears throat* … You wanted to speak with me? I'm ${activeCharacter}.`
          : "",
    };
    if (greeting.content) setMessages([greeting]);
    else setMessages([]);
  }, [book?.id, mode, activeCharacter]);

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
        getToken,
        mode === "character" && activeCharacter
          ? { characterName: activeCharacter, tropes: book.tropes }
          : { tropes: book.tropes },
      );
      setMessages([...nextMessages, { role: "assistant", content: reply }]);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (err: any) {
      Alert.alert("Error", err.message ?? "Failed to reach the companion.");
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
        {readingBooks.length > 1 && (
          <View style={styles.bookSelector}>
            <FlatList
              horizontal
              data={readingBooks}
              keyExtractor={(b) => b.id}
              showsHorizontalScrollIndicator={false}
              renderItem={({ item: b }) => (
                <TouchableOpacity
                  style={[styles.bookChip, b.id === selectedBookId && styles.bookChipActive]}
                  onPress={() => {
                    setSelectedBookId(b.id);
                    setMode("reflect");
                    setActiveCharacter("");
                  }}
                >
                  <Text style={[styles.bookChipText, b.id === selectedBookId && styles.bookChipTextActive]} numberOfLines={1}>
                    {b.title}
                  </Text>
                </TouchableOpacity>
              )}
            />
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
              🎭 In Character {!isPremium ? "🔒" : ""}
            </Text>
          </TouchableOpacity>
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
          ListFooterComponent={
            busy ? (
              <View style={styles.typingIndicator}>
                <ActivityIndicator size="small" color="#9ca3af" />
                <Text style={styles.typingText}>Thinking…</Text>
              </View>
            ) : null
          }
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
  bookSelector: { paddingVertical: 8, paddingLeft: 12, borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  bookChip: { marginRight: 8, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: "#e5e7eb", backgroundColor: "#fff", maxWidth: 180 },
  bookChipActive: { backgroundColor: "#1a1a1a", borderColor: "#1a1a1a" },
  bookChipText: { fontSize: 12, color: "#6b7280" },
  bookChipTextActive: { color: "#fff" },
  modeRow: { flexDirection: "row", gap: 8, padding: 12, borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  modeBtn: { flex: 1, paddingVertical: 9, borderRadius: 20, alignItems: "center", borderWidth: 1, borderColor: "#e5e7eb" },
  modeBtnActive: { backgroundColor: "#1a1a1a", borderColor: "#1a1a1a" },
  modeBtnText: { fontSize: 13, fontWeight: "500", color: "#6b7280" },
  modeBtnTextActive: { color: "#fff" },
  charPicker: { margin: 12, backgroundColor: "#fff", borderRadius: 16, padding: 16, gap: 10, borderWidth: 1, borderColor: "#f0f0f0" },
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
  bubbleAssistant: { alignSelf: "flex-start", backgroundColor: "#fff", borderWidth: 1, borderColor: "#f0f0f0" },
  characterLabel: { fontSize: 10, fontWeight: "700", color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.5 },
  bubbleText: { fontSize: 14, color: "#1a1a1a", lineHeight: 20 },
  bubbleTextUser: { color: "#fff" },
  typingIndicator: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 16, paddingVertical: 8 },
  typingText: { fontSize: 13, color: "#9ca3af" },
  suggestionsRow: { paddingVertical: 8, borderTopWidth: 1, borderTopColor: "#f0f0f0" },
  suggChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: "#fff", borderWidth: 1, borderColor: "#e5e7eb" },
  suggChipText: { fontSize: 12, color: "#6b7280" },
  inputBar: { flexDirection: "row", gap: 8, padding: 12, borderTopWidth: 1, borderTopColor: "#f0f0f0", backgroundColor: "#fff" },
  inputField: { flex: 1, borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, maxHeight: 100, backgroundColor: "#fafafa" },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#1a1a1a", justifyContent: "center", alignItems: "center", alignSelf: "flex-end" },
  sendBtnDisabled: { opacity: 0.4 },
  sendBtnText: { color: "#fff", fontSize: 18, fontWeight: "700" },
});
