import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { coverUrl, searchBooks, type OLSearchResult } from "@/lib/api";
import { MOOD_KEYS, MOODS } from "@/lib/moods";
import { useStore } from "@/lib/store";
import type { MoodKey } from "@/constants/colors";
import type { Book } from "@/lib/store";

const TAB_BAR_HEIGHT = 84;

function ResultRow({
  item,
  onAdd,
}: {
  item: OLSearchResult;
  onAdd: (item: OLSearchResult) => void;
}) {
  const colors = useColors();
  const cover = coverUrl(item.cover_i, "S");

  return (
    <>
      <Pressable
        style={{
          flexDirection: "row", alignItems: "center",
          paddingHorizontal: 20, paddingVertical: 12, gap: 14,
        }}
        onPress={() => onAdd(item)}
      >
        {cover ? (
          <Image
            source={{ uri: cover }}
            style={{ width: 44, height: 64, borderRadius: 8, backgroundColor: colors.muted }}
          />
        ) : (
          <View style={{
            width: 44, height: 64, borderRadius: 8,
            backgroundColor: colors.muted, alignItems: "center", justifyContent: "center",
          }}>
            <Feather name="book" size={18} color={colors.mutedForeground} />
          </View>
        )}
        <View style={{ flex: 1, gap: 3 }}>
          <Text style={{
            fontSize: 14, fontFamily: "Fraunces_600SemiBold",
            color: colors.foreground, lineHeight: 20,
          }} numberOfLines={2}>{item.title}</Text>
          {item.author_name?.[0] && (
            <Text style={{ fontSize: 12, fontFamily: "DMSans_400Regular", color: colors.mutedForeground }}>
              {item.author_name[0]}
            </Text>
          )}
          {item.first_publish_year && (
            <Text style={{ fontSize: 11, fontFamily: "DMSans_400Regular", color: colors.mutedForeground }}>
              {item.first_publish_year}
            </Text>
          )}
        </View>
        <TouchableOpacity
          style={{
            width: 36, height: 36, borderRadius: 18,
            backgroundColor: colors.moodStrong + "18",
            alignItems: "center", justifyContent: "center",
            borderWidth: 1, borderColor: colors.moodStrong + "40",
          }}
          onPress={() => onAdd(item)}
        >
          <Feather name="plus" size={18} color={colors.moodStrong} />
        </TouchableOpacity>
      </Pressable>
      <View style={{ height: 1, backgroundColor: colors.border, marginLeft: 78 }} />
    </>
  );
}

function AddModal({
  item,
  onClose,
}: {
  item: OLSearchResult;
  onClose: () => void;
}) {
  const colors = useColors();
  const addBook = useStore((s) => s.addBook);
  const [shelf, setShelf] = useState<Book["shelf"]>("want");
  const [mood, setMood] = useState<MoodKey | undefined>(undefined);

  const shelves: { key: Book["shelf"]; label: string }[] = [
    { key: "want", label: "Want to read" },
    { key: "reading", label: "Reading" },
    { key: "finished", label: "Finished" },
  ];

  const save = () => {
    addBook({
      title: item.title,
      author: item.author_name?.[0] ?? "Unknown",
      cover: item.cover_i ? coverUrl(item.cover_i, "M") : undefined,
      pages: item.number_of_pages_median,
      openLibraryKey: item.key,
      shelf,
      mood,
      tags: item.subject?.slice(0, 5) ?? [],
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onClose();
  };

  return (
    <Pressable
      style={{ position: "absolute", inset: 0, backgroundColor: "rgba(42,31,20,0.55)", justifyContent: "flex-end" }}
      onPress={onClose}
    >
      <Pressable
        style={{
          backgroundColor: colors.card,
          borderTopLeftRadius: 24, borderTopRightRadius: 24,
          padding: 24, paddingBottom: 40, gap: 22,
        }}
        onPress={() => {}}
      >
        <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: "center" }} />

        <View>
          <Text style={{ fontSize: 20, fontFamily: "Fraunces_700Bold", color: colors.foreground, lineHeight: 26 }}
            numberOfLines={2}>{item.title}</Text>
          {item.author_name?.[0] && (
            <Text style={{ fontSize: 14, fontFamily: "DMSans_400Regular", color: colors.mutedForeground, marginTop: 3 }}>
              {item.author_name[0]}
            </Text>
          )}
        </View>

        <View>
          <Text style={{
            fontSize: 11, fontFamily: "DMSans_600SemiBold",
            color: colors.mutedForeground, marginBottom: 10,
            textTransform: "uppercase", letterSpacing: 1,
          }}>Add to shelf</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {shelves.map((sh) => (
              <Pressable
                key={sh.key}
                style={{
                  paddingHorizontal: 16, paddingVertical: 9,
                  borderRadius: 99, borderWidth: 1.5,
                  borderColor: shelf === sh.key ? colors.moodStrong : colors.border,
                  backgroundColor: shelf === sh.key ? colors.moodStrong + "15" : colors.background,
                }}
                onPress={() => setShelf(sh.key)}
              >
                <Text style={{
                  fontSize: 13, fontFamily: "DMSans_500Medium",
                  color: shelf === sh.key ? colors.moodStrong : colors.foreground,
                }}>{sh.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View>
          <Text style={{
            fontSize: 11, fontFamily: "DMSans_600SemiBold",
            color: colors.mutedForeground, marginBottom: 10,
            textTransform: "uppercase", letterSpacing: 1,
          }}>Reading mood</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {MOOD_KEYS.map((k) => (
              <Pressable
                key={k}
                style={{
                  paddingHorizontal: 14, paddingVertical: 8,
                  borderRadius: 99, borderWidth: 1.5,
                  borderColor: mood === k ? MOODS[k].accent : colors.border,
                  backgroundColor: mood === k ? MOODS[k].accent + "18" : colors.background,
                  flexDirection: "row", alignItems: "center", gap: 5,
                }}
                onPress={() => setMood(mood === k ? undefined : k)}
              >
                <Text style={{ fontSize: 14 }}>{MOODS[k].emoji}</Text>
                <Text style={{
                  fontSize: 12, fontFamily: "DMSans_500Medium",
                  color: mood === k ? MOODS[k].accent : colors.foreground,
                }}>{MOODS[k].label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={{
            backgroundColor: colors.moodStrong, borderRadius: 14,
            paddingVertical: 15, alignItems: "center",
          }}
          onPress={save}
        >
          <Text style={{ fontSize: 15, fontFamily: "DMSans_600SemiBold", color: "#fff" }}>Add to library</Text>
        </TouchableOpacity>
      </Pressable>
    </Pressable>
  );
}

export default function DiscoverScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<OLSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState<OLSearchResult | null>(null);

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await searchBooks(query.trim());
      setResults(res);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={{
        paddingTop: Platform.OS === "web" ? 67 : insets.top + 16,
        paddingHorizontal: 20, paddingBottom: 20,
      }}>
        <Text style={{
          fontSize: 11, fontFamily: "DMSans_500Medium",
          color: colors.mutedForeground, textTransform: "uppercase",
          letterSpacing: 2.5, marginBottom: 6,
        }}>Discover</Text>
        <Text style={{
          fontSize: 34, fontFamily: "Fraunces_700Bold",
          color: colors.foreground, lineHeight: 40, marginBottom: 20,
        }}>
          Find your next{" "}
          <Text style={{ fontStyle: "italic", color: colors.moodStrong }}>trope</Text>
          .
        </Text>

        {/* Reading Twins banner */}
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push("/twins");
          }}
          style={{
            flexDirection: "row", alignItems: "center", gap: 12,
            backgroundColor: colors.card, borderWidth: 1,
            borderColor: colors.moodStrong + "30",
            borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 14,
          }}
        >
          <Text style={{ fontSize: 26 }}>👯</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontFamily: "Fraunces_600SemiBold", color: colors.foreground }}>Reading Twins</Text>
            <Text style={{ fontSize: 12, fontFamily: "DMSans_400Regular", color: colors.mutedForeground, marginTop: 2 }}>
              Find readers who match your taste
            </Text>
          </View>
          <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
        </TouchableOpacity>

        {/* Search bar */}
        <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
          <View style={{
            flex: 1, flexDirection: "row", alignItems: "center",
            backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
            borderRadius: 99, paddingHorizontal: 14, gap: 8,
          }}>
            <Feather name="search" size={16} color={colors.mutedForeground} />
            <TextInput
              style={{
                flex: 1, paddingVertical: 12,
                fontSize: 14, fontFamily: "DMSans_400Regular",
                color: colors.foreground,
              }}
              placeholder="Title, author, or trope…"
              placeholderTextColor={colors.mutedForeground}
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={search}
              returnKeyType="search"
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => { setQuery(""); setResults([]); }}>
                <Feather name="x" size={14} color={colors.mutedForeground} />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            style={{
              width: 46, height: 46, borderRadius: 23,
              backgroundColor: colors.moodStrong,
              alignItems: "center", justifyContent: "center",
            }}
            onPress={search}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Feather name="search" size={18} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {results.length === 0 && !loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 40 }}>
          <View style={{
            width: 64, height: 64, borderRadius: 20,
            backgroundColor: colors.moodTint,
            alignItems: "center", justifyContent: "center", marginBottom: 16,
          }}>
            <Feather name="search" size={28} color={colors.moodStrong} />
          </View>
          <Text style={{
            fontSize: 18, fontFamily: "Fraunces_600SemiBold",
            color: colors.foreground, textAlign: "center", marginBottom: 8,
          }}>Search for a book</Text>
          <Text style={{
            fontSize: 14, fontFamily: "DMSans_400Regular",
            color: colors.mutedForeground, textAlign: "center", lineHeight: 20,
          }}>
            Search by title or author to add it to your library.
          </Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.key}
          renderItem={({ item }) => (
            <ResultRow item={item} onAdd={setAdding} />
          )}
          contentContainerStyle={{
            paddingBottom: (Platform.OS === "web" ? 34 : insets.bottom) + TAB_BAR_HEIGHT,
          }}
          scrollEnabled={!!results.length}
          showsVerticalScrollIndicator={false}
        />
      )}

      {adding && <AddModal item={adding} onClose={() => setAdding(null)} />}
    </View>
  );
}
