import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
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
import { MOOD_KEYS } from "@/lib/moods";
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

  const s = StyleSheet.create({
    row: {
      flexDirection: "row", alignItems: "center",
      paddingHorizontal: 20, paddingVertical: 10, gap: 12,
    },
    cover: {
      width: 44, height: 64, borderRadius: 6,
      backgroundColor: colors.muted,
    },
    info: { flex: 1, gap: 3 },
    title: {
      fontSize: 14, fontFamily: "Inter_600SemiBold",
      color: colors.foreground, lineHeight: 19,
    },
    author: {
      fontSize: 12, fontFamily: "Inter_400Regular",
      color: colors.mutedForeground,
    },
    year: {
      fontSize: 11, fontFamily: "Inter_400Regular",
      color: colors.mutedForeground,
    },
    addBtn: {
      width: 34, height: 34, borderRadius: 17,
      backgroundColor: colors.primary + "20",
      alignItems: "center", justifyContent: "center",
    },
    sep: { height: 1, backgroundColor: colors.border, marginLeft: 76 },
  });

  return (
    <>
      <Pressable style={s.row} onPress={() => onAdd(item)}>
        {cover ? (
          <Image source={{ uri: cover }} style={s.cover} />
        ) : (
          <View style={s.cover} />
        )}
        <View style={s.info}>
          <Text style={s.title} numberOfLines={2}>{item.title}</Text>
          {item.author_name?.[0] && (
            <Text style={s.author}>{item.author_name[0]}</Text>
          )}
          {item.first_publish_year && (
            <Text style={s.year}>{item.first_publish_year}</Text>
          )}
        </View>
        <TouchableOpacity style={s.addBtn} onPress={() => onAdd(item)}>
          <Feather name="plus" size={18} color={colors.primary} />
        </TouchableOpacity>
      </Pressable>
      <View style={s.sep} />
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

  const s = StyleSheet.create({
    backdrop: {
      position: "absolute", inset: 0,
      backgroundColor: "rgba(0,0,0,0.6)",
      justifyContent: "flex-end",
    },
    sheet: {
      backgroundColor: colors.card,
      borderTopLeftRadius: 20, borderTopRightRadius: 20,
      padding: 24, paddingBottom: 40, gap: 20,
    },
    handle: {
      width: 36, height: 4, borderRadius: 2,
      backgroundColor: colors.border, alignSelf: "center", marginBottom: 4,
    },
    title: {
      fontSize: 18, fontFamily: "Inter_700Bold",
      color: colors.foreground,
    },
    author: {
      fontSize: 14, fontFamily: "Inter_400Regular",
      color: colors.mutedForeground, marginTop: 2,
    },
    label: {
      fontSize: 13, fontFamily: "Inter_600SemiBold",
      color: colors.mutedForeground, marginBottom: 10,
      textTransform: "uppercase", letterSpacing: 0.8,
    },
    row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    chip: {
      paddingHorizontal: 14, paddingVertical: 8,
      borderRadius: 20, borderWidth: 1.5,
      borderColor: colors.border, backgroundColor: colors.background,
    },
    chipActive: { borderColor: colors.primary, backgroundColor: colors.primary + "15" },
    chipText: { fontSize: 13, fontFamily: "Inter_500Medium", color: colors.foreground },
    chipTextActive: { color: colors.primary },
    btn: {
      backgroundColor: colors.primary, borderRadius: 12,
      paddingVertical: 14, alignItems: "center",
    },
    btnText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#fff" },
  });

  return (
    <Pressable style={s.backdrop} onPress={onClose}>
      <Pressable style={s.sheet} onPress={() => {}}>
        <View style={s.handle} />
        <View>
          <Text style={s.title} numberOfLines={2}>{item.title}</Text>
          {item.author_name?.[0] && <Text style={s.author}>{item.author_name[0]}</Text>}
        </View>

        <View>
          <Text style={s.label}>Add to shelf</Text>
          <View style={s.row}>
            {shelves.map((sh) => (
              <Pressable
                key={sh.key}
                style={[s.chip, shelf === sh.key && s.chipActive]}
                onPress={() => setShelf(sh.key)}
              >
                <Text style={[s.chipText, shelf === sh.key && s.chipTextActive]}>
                  {sh.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View>
          <Text style={s.label}>Reading mood</Text>
          <View style={s.row}>
            {MOOD_KEYS.map((k) => (
              <Pressable
                key={k}
                style={[s.chip, mood === k && s.chipActive]}
                onPress={() => setMood(mood === k ? undefined : k)}
              >
                <Text style={[s.chipText, mood === k && s.chipTextActive]}>
                  {k}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <TouchableOpacity style={s.btn} onPress={save}>
          <Text style={s.btnText}>Add to library</Text>
        </TouchableOpacity>
      </Pressable>
    </Pressable>
  );
}

export default function DiscoverScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
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

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      paddingTop: Platform.OS === "web" ? 67 : insets.top + 12,
      paddingHorizontal: 20, paddingBottom: 16,
    },
    title: {
      fontSize: 28, fontFamily: "Inter_700Bold",
      color: colors.foreground, marginBottom: 16,
    },
    searchRow: {
      flexDirection: "row", gap: 10, alignItems: "center",
    },
    input: {
      flex: 1, backgroundColor: colors.card,
      borderWidth: 1, borderColor: colors.border,
      borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
      fontSize: 15, fontFamily: "Inter_400Regular",
      color: colors.foreground,
    },
    searchBtn: {
      width: 46, height: 46, borderRadius: 12,
      backgroundColor: colors.primary,
      alignItems: "center", justifyContent: "center",
    },
    empty: {
      flex: 1, alignItems: "center", justifyContent: "center",
      paddingHorizontal: 40,
    },
    emptyText: {
      fontSize: 15, fontFamily: "Inter_400Regular",
      color: colors.mutedForeground, textAlign: "center", marginTop: 12,
    },
  });

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Discover</Text>
        <View style={s.searchRow}>
          <TextInput
            style={s.input}
            placeholder="Search by title or author…"
            placeholderTextColor={colors.mutedForeground}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={search}
            returnKeyType="search"
          />
          <TouchableOpacity style={s.searchBtn} onPress={search}>
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Feather name="search" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {results.length === 0 && !loading ? (
        <View style={s.empty}>
          <Feather name="search" size={42} color={colors.mutedForeground} />
          <Text style={s.emptyText}>
            Search for a book by title or author to add it to your library.
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
