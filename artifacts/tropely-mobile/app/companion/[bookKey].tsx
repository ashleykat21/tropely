import { Feather } from "@expo/vector-icons";
import * as Haptics from "@/lib/haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { companionChat } from "@/lib/api";
import { MOODS } from "@/lib/moods";
import { selectors, useStore, type CompanionMessage } from "@/lib/store";

type UIMessage = { id: string; role: "user" | "assistant"; content: string; at: number };

function Bubble({ msg, accentColor }: { msg: UIMessage; accentColor: string }) {
  const colors = useColors();
  const isUser = msg.role === "user";
  return (
    <View
      style={{
        alignSelf: isUser ? "flex-end" : "flex-start",
        maxWidth: "80%",
        marginBottom: 10,
        marginHorizontal: 16,
      }}
    >
      <View
        style={{
          backgroundColor: isUser ? accentColor : colors.card,
          borderRadius: 18,
          borderBottomRightRadius: isUser ? 4 : 18,
          borderBottomLeftRadius: isUser ? 18 : 4,
          paddingHorizontal: 14,
          paddingVertical: 10,
          borderWidth: isUser ? 0 : 1,
          borderColor: colors.border,
        }}
      >
        <Text
          style={{
            fontSize: 14,
            fontFamily: "Inter_400Regular",
            color: isUser ? "#fff" : colors.foreground,
            lineHeight: 20,
          }}
        >
          {msg.content}
        </Text>
      </View>
    </View>
  );
}

export default function CompanionScreen() {
  const { bookKey } = useLocalSearchParams<{ bookKey: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const decodedKey = decodeURIComponent(bookKey ?? "");

  const book = useStore((s) =>
    s.books.find((b) => b.openLibraryKey === decodedKey || b.id === decodedKey)
  );
  const history = useStore(selectors.companionHistory(decodedKey));
  const addCompanionMessage = useStore((s) => s.addCompanionMessage);
  const clearHistory = useStore((s) => s.clearCompanionHistory);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const flatRef = useRef<FlatList>(null);

  const accentColor = book?.mood ? MOODS[book.mood].accent : colors.primary;

  const allMessages: UIMessage[] = history.map((m) => ({
    id: m.id,
    role: m.role,
    content: m.content,
    at: m.at,
  }));

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    addCompanionMessage({ bookKey: decodedKey, role: "user", content: text });
    setLoading(true);

    const apiMessages = [...history, { role: "user" as const, content: text }].map((m) => ({
      role: m.role,
      content: m.content,
    }));

    try {
      const reply = await companionChat(
        decodedKey,
        apiMessages,
        book?.title ?? "this book",
        book?.tropes ?? []
      );
      addCompanionMessage({ bookKey: decodedKey, role: "assistant", content: reply });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      addCompanionMessage({
        bookKey: decodedKey,
        role: "assistant",
        content: "I'm having trouble connecting right now. Try again in a moment.",
      });
    } finally {
      setLoading(false);
    }
  };

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      paddingTop: Platform.OS === "web" ? 67 : insets.top + 8,
      paddingHorizontal: 16, paddingBottom: 12,
      flexDirection: "row", alignItems: "center", gap: 10,
      borderBottomWidth: 1, borderBottomColor: colors.border,
      backgroundColor: colors.background,
    },
    backBtn: {
      width: 36, height: 36, borderRadius: 18,
      backgroundColor: colors.card, alignItems: "center", justifyContent: "center",
    },
    headerInfo: { flex: 1 },
    headerTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: colors.foreground },
    headerSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: colors.mutedForeground },
    clearBtn: {
      paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
      backgroundColor: colors.muted,
    },
    clearText: { fontSize: 11, fontFamily: "Inter_500Medium", color: colors.mutedForeground },
    empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
    emptyIcon: {
      width: 64, height: 64, borderRadius: 32,
      backgroundColor: accentColor + "20",
      alignItems: "center", justifyContent: "center", marginBottom: 14,
    },
    emptyTitle: {
      fontSize: 18, fontFamily: "Inter_600SemiBold",
      color: colors.foreground, textAlign: "center", marginBottom: 6,
    },
    emptySub: {
      fontSize: 14, fontFamily: "Inter_400Regular",
      color: colors.mutedForeground, textAlign: "center", lineHeight: 20,
    },
    inputRow: {
      flexDirection: "row", alignItems: "flex-end", gap: 8,
      paddingHorizontal: 16, paddingVertical: 10,
      paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 10,
      borderTopWidth: 1, borderTopColor: colors.border,
      backgroundColor: colors.background,
    },
    textInput: {
      flex: 1, minHeight: 40, maxHeight: 120,
      backgroundColor: colors.card, borderRadius: 20,
      paddingHorizontal: 14, paddingVertical: 9,
      fontSize: 14, fontFamily: "Inter_400Regular", color: colors.foreground,
      borderWidth: 1, borderColor: colors.border,
    },
    sendBtn: {
      width: 40, height: 40, borderRadius: 20,
      backgroundColor: accentColor,
      alignItems: "center", justifyContent: "center",
    },
    typing: {
      alignSelf: "flex-start", marginLeft: 16, marginBottom: 10,
      paddingHorizontal: 14, paddingVertical: 10,
      backgroundColor: colors.card, borderRadius: 18, borderBottomLeftRadius: 4,
      borderWidth: 1, borderColor: colors.border,
    },
    typingDot: { fontSize: 14, color: colors.mutedForeground },
  });

  return (
    <KeyboardAvoidingView
      style={s.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={0}
    >
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={18} color={colors.foreground} />
        </TouchableOpacity>
        <View style={s.headerInfo}>
          <Text style={s.headerTitle} numberOfLines={1}>
            {book?.title ?? "Book Companion"}
          </Text>
          <Text style={s.headerSub}>AI reading companion</Text>
        </View>
        {history.length > 0 && (
          <TouchableOpacity style={s.clearBtn} onPress={() => clearHistory(decodedKey)}>
            <Text style={s.clearText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {allMessages.length === 0 && !loading ? (
        <View style={s.empty}>
          <View style={s.emptyIcon}>
            <Feather name="message-circle" size={28} color={accentColor} />
          </View>
          <Text style={s.emptyTitle}>Your reading companion</Text>
          <Text style={s.emptySub}>
            Ask me anything about {book?.title ?? "the book"} — themes, characters, tropes, or your thoughts.
          </Text>
        </View>
      ) : (
        <FlatList
          ref={flatRef}
          data={allMessages}
          keyExtractor={(m) => m.id}
          renderItem={({ item }) => <Bubble msg={item} accentColor={accentColor} />}
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 8 }}
          onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: true })}
          scrollEnabled={!!allMessages.length}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            loading ? (
              <View style={s.typing}>
                <ActivityIndicator size="small" color={colors.mutedForeground} />
              </View>
            ) : null
          }
        />
      )}

      <View style={s.inputRow}>
        <TextInput
          style={s.textInput}
          placeholder={`Ask about ${book?.title ?? "this book"}…`}
          placeholderTextColor={colors.mutedForeground}
          value={input}
          onChangeText={setInput}
          multiline
          onSubmitEditing={send}
          blurOnSubmit={false}
        />
        <TouchableOpacity
          style={[s.sendBtn, (!input.trim() || loading) && { opacity: 0.4 }]}
          onPress={send}
          disabled={!input.trim() || loading}
        >
          <Feather name="send" size={16} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
