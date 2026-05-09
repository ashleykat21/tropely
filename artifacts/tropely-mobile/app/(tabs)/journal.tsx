import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { MOOD_KEYS, MOODS } from "@/lib/moods";
import { useStore, type JournalEntry } from "@/lib/store";
import type { MoodKey } from "@/constants/colors";

const TAB_BAR_HEIGHT = 84;

function EntryCard({ entry, onDelete }: { entry: JournalEntry; onDelete: () => void }) {
  const colors = useColors();
  const book = useStore((s) => s.books.find((b) => b.id === entry.bookId));
  const accent = entry.mood ? MOODS[entry.mood].accent : colors.moodStrong;

  return (
    <View style={{
      backgroundColor: colors.card, marginHorizontal: 20,
      borderRadius: 16, padding: 18, marginBottom: 10,
      borderWidth: 1, borderColor: colors.border,
    }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <View style={{
          width: 8, height: 8, borderRadius: 4,
          backgroundColor: accent,
        }} />
        {entry.mood && (
          <Text style={{ fontSize: 14 }}>{MOODS[entry.mood].emoji}</Text>
        )}
        {entry.isSpoiler && (
          <View style={{
            backgroundColor: "#D4A83215", borderRadius: 99,
            paddingHorizontal: 8, paddingVertical: 3,
          }}>
            <Text style={{ fontSize: 10, fontFamily: "DMSans_600SemiBold", color: "#D4A832" }}>⚠️ SPOILER</Text>
          </View>
        )}
        <Text style={{
          flex: 1, fontSize: 11, fontFamily: "DMSans_400Regular",
          color: colors.mutedForeground, textAlign: "right",
        }}>
          {new Date(entry.createdAt).toLocaleDateString("en", { month: "short", day: "numeric" })}
        </Text>
      </View>

      {book && (
        <Text style={{
          fontSize: 11, fontFamily: "DMSans_500Medium",
          color: colors.mutedForeground, marginBottom: 8,
          textTransform: "uppercase", letterSpacing: 0.5,
        }} numberOfLines={1}>{book.title}</Text>
      )}

      <Text style={{
        fontSize: 14, fontFamily: "DMSans_400Regular",
        color: colors.foreground, lineHeight: 22,
      }}>{entry.text}</Text>

      <TouchableOpacity style={{ marginTop: 12, alignSelf: "flex-end" }} onPress={onDelete}>
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

  return (
    <Pressable
      style={{
        position: "absolute", inset: 0,
        backgroundColor: "rgba(42,31,20,0.55)", justifyContent: "flex-end",
      }}
      onPress={onClose}
    >
      <Pressable
        style={{
          backgroundColor: colors.card,
          borderTopLeftRadius: 24, borderTopRightRadius: 24,
          paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 16,
          maxHeight: "90%",
        }}
        onPress={() => {}}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={{ padding: 24, gap: 20 }}>
            {/* Handle + header */}
            <View style={{
              width: 36, height: 4, borderRadius: 2,
              backgroundColor: colors.border, alignSelf: "center",
            }} />
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ fontSize: 20, fontFamily: "Fraunces_700Bold", color: colors.foreground }}>New entry</Text>
              <TouchableOpacity onPress={onClose}>
                <Feather name="x" size={20} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>

            {/* Text input */}
            <TextInput
              style={{
                backgroundColor: colors.background,
                borderWidth: 1, borderColor: colors.border,
                borderRadius: 12, padding: 14, height: 120,
                fontSize: 14, fontFamily: "DMSans_400Regular",
                color: colors.foreground, textAlignVertical: "top",
              }}
              placeholder="Anything you want to remember…"
              placeholderTextColor={colors.mutedForeground}
              value={text}
              onChangeText={setText}
              multiline
              autoFocus
            />

            {/* Mood */}
            <View>
              <Text style={{
                fontSize: 11, fontFamily: "DMSans_600SemiBold",
                color: colors.mutedForeground, textTransform: "uppercase",
                letterSpacing: 1, marginBottom: 10,
              }}>Mood</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {MOOD_KEYS.map((k) => (
                  <Pressable
                    key={k}
                    style={{
                      flexDirection: "row", alignItems: "center", gap: 5,
                      paddingHorizontal: 12, paddingVertical: 8, borderRadius: 99,
                      borderWidth: 1.5,
                      borderColor: mood === k ? MOODS[k].accent : colors.border,
                      backgroundColor: mood === k ? MOODS[k].accent + "15" : colors.background,
                    }}
                    onPress={() => setMood(mood === k ? undefined : k)}
                  >
                    <Text style={{ fontSize: 14 }}>{MOODS[k].emoji}</Text>
                    <Text style={{
                      fontSize: 12, fontFamily: "DMSans_500Medium",
                      color: mood === k ? MOODS[k].accent : colors.mutedForeground,
                    }}>{MOODS[k].label}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Book selector */}
            {books.length > 0 && (
              <View>
                <Text style={{
                  fontSize: 11, fontFamily: "DMSans_600SemiBold",
                  color: colors.mutedForeground, textTransform: "uppercase",
                  letterSpacing: 1, marginBottom: 10,
                }}>Book</Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                  {books.map((b) => (
                    <Pressable
                      key={b.id}
                      style={{
                        paddingHorizontal: 14, paddingVertical: 8, borderRadius: 99,
                        borderWidth: 1.5,
                        borderColor: bookId === b.id ? colors.moodStrong : colors.border,
                        backgroundColor: bookId === b.id ? colors.moodStrong + "15" : colors.background,
                      }}
                      onPress={() => setBookId(bookId === b.id ? undefined : b.id)}
                    >
                      <Text style={{
                        fontSize: 12, fontFamily: "DMSans_500Medium",
                        color: bookId === b.id ? colors.moodStrong : colors.foreground,
                      }} numberOfLines={1}>{b.title}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {/* Spoiler toggle */}
            <TouchableOpacity
              style={{
                alignSelf: "flex-start",
                paddingHorizontal: 14, paddingVertical: 8, borderRadius: 99,
                borderWidth: 1.5,
                borderColor: isSpoiler ? "#D4A832" : colors.border,
                backgroundColor: isSpoiler ? "#D4A83215" : colors.background,
              }}
              onPress={() => setIsSpoiler(!isSpoiler)}
            >
              <Text style={{
                fontSize: 13, fontFamily: "DMSans_500Medium",
                color: isSpoiler ? "#D4A832" : colors.mutedForeground,
              }}>⚠️ Spoiler</Text>
            </TouchableOpacity>

            {/* Save button */}
            <TouchableOpacity
              style={{
                backgroundColor: colors.moodStrong, borderRadius: 14,
                paddingVertical: 15, alignItems: "center",
                opacity: !text.trim() ? 0.5 : 1,
              }}
              onPress={save}
              disabled={!text.trim()}
            >
              <Text style={{ fontSize: 15, fontFamily: "DMSans_600SemiBold", color: "#fff" }}>Save entry</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
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

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={{
        paddingTop: Platform.OS === "web" ? 67 : insets.top + 16,
        paddingHorizontal: 20, paddingBottom: 20,
        flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end",
      }}>
        <View style={{ flex: 1, paddingRight: 12 }}>
          <Text style={{
            fontSize: 11, fontFamily: "DMSans_500Medium",
            color: colors.mutedForeground, textTransform: "uppercase",
            letterSpacing: 2.5, marginBottom: 6,
          }}>Journal</Text>
          <Text style={{
            fontSize: 34, fontFamily: "Fraunces_700Bold",
            color: colors.foreground, lineHeight: 40,
          }}>
            Hold onto what{" "}
            <Text style={{ fontStyle: "italic", color: colors.moodStrong }}>moves you</Text>
            .
          </Text>
        </View>
        <TouchableOpacity
          style={{
            width: 42, height: 42, borderRadius: 14,
            backgroundColor: colors.moodStrong,
            alignItems: "center", justifyContent: "center",
          }}
          onPress={() => setAdding(true)}
        >
          <Feather name="plus" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {journal.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 40 }}>
          <View style={{
            width: 64, height: 64, borderRadius: 20,
            backgroundColor: colors.moodTint,
            alignItems: "center", justifyContent: "center", marginBottom: 16,
          }}>
            <Feather name="edit-3" size={28} color={colors.moodStrong} />
          </View>
          <Text style={{
            fontSize: 18, fontFamily: "Fraunces_600SemiBold",
            color: colors.foreground, textAlign: "center", marginBottom: 8,
          }}>Capture your first note</Text>
          <Text style={{
            fontSize: 14, fontFamily: "DMSans_400Regular",
            color: colors.mutedForeground, textAlign: "center", lineHeight: 20, marginBottom: 20,
          }}>
            Anything that moves you — a line, a question, a feeling.
          </Text>
          <TouchableOpacity
            style={{
              backgroundColor: colors.moodStrong, borderRadius: 99,
              paddingHorizontal: 24, paddingVertical: 12,
            }}
            onPress={() => setAdding(true)}
          >
            <Text style={{ fontSize: 14, fontFamily: "DMSans_600SemiBold", color: "#fff" }}>
              Write your first entry
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
