import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { companionChat } from "@/lib/api";
import { MOODS } from "@/lib/moods";
import { selectors, useStore } from "@/lib/store";

type UIMessage = { id: string; role: "user" | "assistant"; content: string; at: number };

function Bubble({ msg, accentColor }: { msg: UIMessage; accentColor: string }) {
  const colors = useColors();
  const isUser = msg.role === "user";
  return (
    <View style={{
      alignSelf: isUser ? "flex-end" : "flex-start",
      maxWidth: "82%",
      marginBottom: 10,
      marginHorizontal: 16,
    }}>
      <View style={{
        backgroundColor: isUser ? accentColor : colors.card,
        borderRadius: 18,
        borderBottomRightRadius: isUser ? 4 : 18,
        borderBottomLeftRadius: isUser ? 18 : 4,
        paddingHorizontal: 14,
        paddingVertical: 11,
        borderWidth: isUser ? 0 : 1,
        borderColor: colors.border,
      }}>
        <Text style={{
          fontSize: 14,
          fontFamily: "DMSans_400Regular",
          color: isUser ? "#fff" : colors.foreground,
          lineHeight: 21,
        }}>{msg.content}</Text>
      </View>
      <Text style={{
        fontSize: 10,
        fontFamily: "DMSans_400Regular",
        color: colors.mutedForeground,
        marginTop: 4,
        alignSelf: isUser ? "flex-end" : "flex-start",
        marginHorizontal: 4,
      }}>
        {new Date(msg.at).toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" })}
      </Text>
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

  const accentColor = book?.mood ? MOODS[book.mood].accent : colors.moodStrong;

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

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={{
        paddingTop: Platform.OS === "web" ? 67 : insets.top + 8,
        paddingHorizontal: 16, paddingBottom: 14,
        flexDirection: "row", alignItems: "center", gap: 10,
        borderBottomWidth: 1, borderBottomColor: colors.border,
        backgroundColor: colors.background,
      }}>
        <TouchableOpacity
          style={{
            width: 38, height: 38, borderRadius: 12,
            backgroundColor: colors.card, alignItems: "center", justifyContent: "center",
            borderWidth: 1, borderColor: colors.border,
          }}
          onPress={() => router.back()}
        >
          <Feather name="arrow-left" size={17} color={colors.foreground} />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontFamily: "Fraunces_600SemiBold", color: colors.foreground }} numberOfLines={1}>
            {book?.title ?? "Book Companion"}
          </Text>
          <Text style={{ fontSize: 12, fontFamily: "DMSans_400Regular", color: colors.mutedForeground }}>
            AI reading companion
          </Text>
        </View>

        {history.length > 0 && (
          <TouchableOpacity
            style={{
              paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99,
              backgroundColor: colors.muted,
              borderWidth: 1, borderColor: colors.border,
            }}
            onPress={() => clearHistory(decodedKey)}
          >
            <Text style={{ fontSize: 12, fontFamily: "DMSans_500Medium", color: colors.mutedForeground }}>
              Clear
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Messages */}
      {allMessages.length === 0 && !loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 36, gap: 12 }}>
          <View style={{
            width: 68, height: 68, borderRadius: 22,
            backgroundColor: accentColor + "18",
            alignItems: "center", justifyContent: "center",
          }}>
            <Feather name="message-circle" size={30} color={accentColor} />
          </View>
          <Text style={{
            fontSize: 20, fontFamily: "Fraunces_700Bold",
            color: colors.foreground, textAlign: "center",
          }}>Your reading companion</Text>
          <Text style={{
            fontSize: 14, fontFamily: "DMSans_400Regular",
            color: colors.mutedForeground, textAlign: "center", lineHeight: 21,
          }}>
            Ask me anything about {book?.title ?? "the book"} — themes, characters, tropes, or your thoughts.
          </Text>
          {book?.tropes && book.tropes.length > 0 && (
            <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 6, marginTop: 4 }}>
              {book.tropes.slice(0, 4).map((t) => (
                <View key={t} style={{
                  paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99,
                  backgroundColor: accentColor + "15", borderWidth: 1, borderColor: accentColor + "40",
                }}>
                  <Text style={{ fontSize: 11, fontFamily: "DMSans_500Medium", color: accentColor }}>{t}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      ) : (
        <FlatList
          ref={flatRef}
          data={allMessages}
          keyExtractor={(m) => m.id}
          renderItem={({ item }) => <Bubble msg={item} accentColor={accentColor} />}
          contentContainerStyle={{ paddingTop: 18, paddingBottom: 8 }}
          onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: true })}
          scrollEnabled={!!allMessages.length}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            loading ? (
              <View style={{
                alignSelf: "flex-start", marginLeft: 16, marginBottom: 10,
                paddingHorizontal: 16, paddingVertical: 12,
                backgroundColor: colors.card, borderRadius: 18, borderBottomLeftRadius: 4,
                borderWidth: 1, borderColor: colors.border,
                flexDirection: "row", alignItems: "center", gap: 8,
              }}>
                <ActivityIndicator size="small" color={accentColor} />
                <Text style={{ fontSize: 12, fontFamily: "DMSans_400Regular", color: colors.mutedForeground }}>
                  Thinking…
                </Text>
              </View>
            ) : null
          }
        />
      )}

      {/* Input row */}
      <View style={{
        flexDirection: "row", alignItems: "flex-end", gap: 10,
        paddingHorizontal: 16, paddingVertical: 10,
        paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 10,
        borderTopWidth: 1, borderTopColor: colors.border,
        backgroundColor: colors.background,
      }}>
        <TextInput
          style={{
            flex: 1, minHeight: 42, maxHeight: 120,
            backgroundColor: colors.card, borderRadius: 21,
            paddingHorizontal: 16, paddingVertical: 10,
            fontSize: 14, fontFamily: "DMSans_400Regular", color: colors.foreground,
            borderWidth: 1.5, borderColor: colors.border,
          }}
          placeholder={`Ask about ${book?.title ?? "this book"}…`}
          placeholderTextColor={colors.mutedForeground}
          value={input}
          onChangeText={setInput}
          multiline
          onSubmitEditing={send}
          blurOnSubmit={false}
        />
        <TouchableOpacity
          style={{
            width: 42, height: 42, borderRadius: 21,
            backgroundColor: accentColor,
            alignItems: "center", justifyContent: "center",
            opacity: (!input.trim() || loading) ? 0.4 : 1,
          }}
          onPress={send}
          disabled={!input.trim() || loading}
        >
          <Feather name="send" size={16} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
