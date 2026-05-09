import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { coverUrl, searchBooks, type OLSearchResult } from "@/lib/api";
import { MOOD_KEYS, MOODS } from "@/lib/moods";
import { useStore, type Book } from "@/lib/store";
import { useColors } from "@/hooks/useColors";
import type { MoodKey } from "@/constants/colors";

const TAB_BAR_HEIGHT = 84;
const CURRENT_YEAR = new Date().getFullYear();
const NEXT_YEAR = CURRENT_YEAR + 1;
type FeedKey = "new" | "upcoming" | "search";
type Length = "short" | "medium" | "long";

const GENRE_CATEGORIES = [
  { emoji: "💕", name: "Romance", q: "romance novel" },
  { emoji: "⚔️", name: "Fantasy", q: "epic fantasy adventure" },
  { emoji: "🔪", name: "Thriller", q: "thriller mystery" },
  { emoji: "📖", name: "Literary", q: "literary fiction" },
  { emoji: "🚀", name: "Sci-Fi", q: "science fiction" },
  { emoji: "👻", name: "Horror", q: "horror fiction" },
  { emoji: "🏰", name: "Historical", q: "historical fiction" },
  { emoji: "☕", name: "Contemporary", q: "contemporary fiction" },
  { emoji: "🌙", name: "Paranormal", q: "paranormal urban fantasy" },
  { emoji: "🫖", name: "Cozy", q: "cozy mystery" },
];

const LENGTHS: { key: Length; label: string; hint: string }[] = [
  { key: "short", label: "Short", hint: "<250p" },
  { key: "medium", label: "Medium", hint: "250–450p" },
  { key: "long", label: "Long", hint: "450p+" },
];

const lengthOf = (p: number | undefined): Length | null => {
  if (!p || p < 1) return null;
  if (p < 250) return "short";
  if (p <= 450) return "medium";
  return "long";
};

const moodFor = (seed: string): MoodKey => {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return MOOD_KEYS[h % MOOD_KEYS.length];
};

function BookCard({
  item,
  onAdd,
}: {
  item: OLSearchResult;
  onAdd: (item: OLSearchResult) => void;
}) {
  const C = useColors();
  const cover = coverUrl(item.cover_i, "M");
  const mood = moodFor(item.key);

  return (
    <TouchableOpacity
      style={{
        flex: 1,
        backgroundColor: C.card,
        borderRadius: 16,
        padding: 12,
        borderWidth: 1,
        borderColor: C.border + "80",
        gap: 8,
      }}
      onPress={() => onAdd(item)}
      activeOpacity={0.85}
    >
      {cover ? (
        <Image
          source={{ uri: cover }}
          style={{ width: "100%", aspectRatio: 2 / 3, borderRadius: 10 }}
          resizeMode="cover"
        />
      ) : (
        <View
          style={{
            width: "100%",
            aspectRatio: 2 / 3,
            borderRadius: 10,
            backgroundColor: MOODS[mood].accent + "22",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ fontSize: 32 }}>📚</Text>
        </View>
      )}
      <View style={{ gap: 2 }}>
        <Text
          style={{
            fontSize: 13,
            fontFamily: "Fraunces_600SemiBold",
            color: C.foreground,
            lineHeight: 18,
          }}
          numberOfLines={2}
        >
          {item.title}
        </Text>
        {item.author_name?.[0] && (
          <Text
            style={{
              fontSize: 11,
              fontFamily: "DMSans_400Regular",
              color: C.mutedForeground,
            }}
            numberOfLines={1}
          >
            {item.author_name[0]}
          </Text>
        )}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
            marginTop: 2,
          }}
        >
          <Text style={{ fontSize: 10 }}>{MOODS[mood].emoji}</Text>
          <Text
            style={{
              fontSize: 10,
              fontFamily: "DMSans_400Regular",
              color: C.mutedForeground,
            }}
          >
            {MOODS[mood].label}
          </Text>
        </View>
      </View>
      <TouchableOpacity
        style={{
          borderRadius: 99,
          paddingVertical: 7,
          backgroundColor: C.foreground,
          alignItems: "center",
        }}
        onPress={() => onAdd(item)}
      >
        <Text
          style={{
            fontSize: 12,
            fontFamily: "DMSans_600SemiBold",
            color: C.background,
          }}
        >
          + Add
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

function ResultRow({
  item,
  onAdd,
}: {
  item: OLSearchResult;
  onAdd: (item: OLSearchResult) => void;
}) {
  const C = useColors();
  const cover = coverUrl(item.cover_i, "S");

  return (
    <>
      <Pressable
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 20,
          paddingVertical: 12,
          gap: 14,
        }}
        onPress={() => onAdd(item)}
      >
        {cover ? (
          <Image
            source={{ uri: cover }}
            style={{ width: 44, height: 64, borderRadius: 8, backgroundColor: C.muted }}
          />
        ) : (
          <View
            style={{
              width: 44,
              height: 64,
              borderRadius: 8,
              backgroundColor: C.muted,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Feather name="book" size={18} color={C.mutedForeground} />
          </View>
        )}
        <View style={{ flex: 1, gap: 3 }}>
          <Text
            style={{
              fontSize: 14,
              fontFamily: "Fraunces_600SemiBold",
              color: C.foreground,
              lineHeight: 20,
            }}
            numberOfLines={2}
          >
            {item.title}
          </Text>
          {item.author_name?.[0] && (
            <Text
              style={{ fontSize: 12, fontFamily: "DMSans_400Regular", color: C.mutedForeground }}
            >
              {item.author_name[0]}
            </Text>
          )}
        </View>
        <TouchableOpacity
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: C.moodStrong + "18",
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderColor: C.moodStrong + "40",
          }}
          onPress={() => onAdd(item)}
        >
          <Feather name="plus" size={18} color={C.moodStrong} />
        </TouchableOpacity>
      </Pressable>
      <View style={{ height: 1, backgroundColor: C.border, marginLeft: 78 }} />
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
  const C = useColors();
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
      mood: mood ?? moodFor(item.key),
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onClose();
  };

  return (
    <Pressable
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: "rgba(42,31,20,0.55)",
        justifyContent: "flex-end",
      }}
      onPress={onClose}
    >
      <Pressable
        style={{
          backgroundColor: C.card,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          padding: 24,
          paddingBottom: 40,
          gap: 22,
        }}
        onPress={() => {}}
      >
        <View
          style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: C.border, alignSelf: "center" }}
        />
        <View>
          <Text
            style={{ fontSize: 20, fontFamily: "Fraunces_700Bold", color: C.foreground, lineHeight: 26 }}
            numberOfLines={2}
          >
            {item.title}
          </Text>
          {item.author_name?.[0] && (
            <Text style={{ fontSize: 14, fontFamily: "DMSans_400Regular", color: C.mutedForeground, marginTop: 3 }}>
              {item.author_name[0]}
            </Text>
          )}
        </View>

        <View>
          <Text style={{ fontSize: 11, fontFamily: "DMSans_600SemiBold", color: C.mutedForeground, marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>
            Add to shelf
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {shelves.map((sh) => (
              <Pressable
                key={sh.key}
                style={{
                  paddingHorizontal: 16, paddingVertical: 9, borderRadius: 99, borderWidth: 1.5,
                  borderColor: shelf === sh.key ? C.moodStrong : C.border,
                  backgroundColor: shelf === sh.key ? C.moodStrong + "15" : C.background,
                }}
                onPress={() => setShelf(sh.key)}
              >
                <Text style={{ fontSize: 13, fontFamily: "DMSans_500Medium", color: shelf === sh.key ? C.moodStrong : C.foreground }}>
                  {sh.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View>
          <Text style={{ fontSize: 11, fontFamily: "DMSans_600SemiBold", color: C.mutedForeground, marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>
            Reading mood
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {MOOD_KEYS.map((k) => (
              <Pressable
                key={k}
                style={{
                  paddingHorizontal: 14, paddingVertical: 8, borderRadius: 99, borderWidth: 1.5,
                  borderColor: mood === k ? MOODS[k].accent : C.border,
                  backgroundColor: mood === k ? MOODS[k].accent + "18" : C.background,
                  flexDirection: "row", alignItems: "center", gap: 5,
                }}
                onPress={() => setMood(mood === k ? undefined : k)}
              >
                <Text style={{ fontSize: 14 }}>{MOODS[k].emoji}</Text>
                <Text style={{ fontSize: 12, fontFamily: "DMSans_500Medium", color: mood === k ? MOODS[k].accent : C.foreground }}>
                  {MOODS[k].label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={{ backgroundColor: C.moodStrong, borderRadius: 14, paddingVertical: 15, alignItems: "center" }}
          onPress={save}
        >
          <Text style={{ fontSize: 15, fontFamily: "DMSans_600SemiBold", color: "#fff" }}>
            Add to library
          </Text>
        </TouchableOpacity>
      </Pressable>
    </Pressable>
  );
}

export default function DiscoverScreen() {
  const C = useColors();
  const insets = useSafeAreaInsets();

  const [q, setQ] = useState("");
  const [feed, setFeed] = useState<FeedKey>("new");
  const [searchResults, setSearchResults] = useState<OLSearchResult[]>([]);
  const [newReleases, setNewReleases] = useState<OLSearchResult[]>([]);
  const [upcoming, setUpcoming] = useState<OLSearchResult[]>([]);
  const [feedLoading, setFeedLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [catFilter, setCatFilter] = useState<string | null>(null);
  const [activeMood, setActiveMood] = useState<MoodKey | null>(null);
  const [activeLength, setActiveLength] = useState<Length | null>(null);
  const [adding, setAdding] = useState<OLSearchResult | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fetchFeeds = async () => {
      setFeedLoading(true);
      try {
        const fields = "key,title,author_name,cover_i,number_of_pages_median,first_publish_year";
        const [newRes, upRes] = await Promise.all([
          fetch(`https://openlibrary.org/search.json?q=first_publish_year%3A${CURRENT_YEAR}&sort=new&limit=24&fields=${fields}`).then((r) => r.json()),
          fetch(`https://openlibrary.org/search.json?q=first_publish_year%3A${NEXT_YEAR}&sort=new&limit=24&fields=${fields}`).then((r) => r.json()),
        ]);
        if (cancelled) return;
        const withCovers = (docs: OLSearchResult[]) => docs.filter((d) => d.cover_i && d.title).slice(0, 18);
        setNewReleases(withCovers(newRes.docs ?? []));
        setUpcoming(withCovers(upRes.docs ?? []));
      } catch {
      } finally {
        if (!cancelled) setFeedLoading(false);
      }
    };
    fetchFeeds();
    return () => { cancelled = true; };
  }, []);

  const doSearch = async (term: string) => {
    if (!term.trim()) return;
    setSearchLoading(true);
    setFeed("search");
    try {
      const res = await searchBooks(term.trim());
      setSearchResults(res);
    } catch {
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const baseFeed = useMemo<OLSearchResult[]>(() => {
    if (feed === "search") return searchResults;
    if (feed === "upcoming") return upcoming;
    return newReleases;
  }, [feed, searchResults, upcoming, newReleases]);

  const visible = useMemo<OLSearchResult[]>(() => {
    return baseFeed.filter((r) => {
      if (activeLength) {
        const lk = lengthOf(r.number_of_pages_median);
        if (lk !== activeLength) return false;
      }
      return true;
    });
  }, [baseFeed, activeLength]);

  const isLoading = feedLoading || searchLoading;

  return (
    <View style={{ flex: 1, backgroundColor: C.background }}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: Platform.OS === "web" ? 67 : insets.top + 16,
          paddingBottom: (Platform.OS === "web" ? 34 : insets.bottom) + TAB_BAR_HEIGHT,
        }}
      >
        {/* ── Page header ── */}
        <View style={{ paddingHorizontal: 20, gap: 4, marginBottom: 24 }}>
          <Text style={{
            fontSize: 11, fontFamily: "DMSans_600SemiBold",
            color: C.mutedForeground, textTransform: "uppercase", letterSpacing: 4,
          }}>
            Discover
          </Text>
          <Text style={{ fontFamily: "Fraunces_400Regular", fontSize: 36, color: C.foreground, lineHeight: 38, letterSpacing: -0.5 }}>
            {"Find your next "}
            <Text style={{ fontStyle: "italic", color: C.moodStrong }}>trope</Text>
            {"."}
          </Text>
          <Text style={{ fontSize: 14, fontFamily: "DMSans_400Regular", color: C.mutedForeground, lineHeight: 20, marginTop: 4 }}>
            Browse by story shape, then let the mood underneath guide you in.
          </Text>
        </View>

        {/* ── Search ── */}
        <View style={{ paddingHorizontal: 20, flexDirection: "row", gap: 10, alignItems: "center", marginBottom: 24 }}>
          <View style={{
            flex: 1, flexDirection: "row", alignItems: "center",
            backgroundColor: C.card + "CC", borderWidth: 1, borderColor: C.border,
            borderRadius: 99, paddingHorizontal: 14, gap: 8, height: 46,
          }}>
            <Feather name="search" size={16} color={C.mutedForeground} />
            <TextInput
              style={{ flex: 1, fontSize: 14, fontFamily: "DMSans_400Regular", color: C.foreground }}
              placeholder="Title, author, trope, or ISBN…"
              placeholderTextColor={C.mutedForeground}
              value={q}
              onChangeText={(t) => {
                setQ(t);
                if (t === "" && feed === "search") setFeed("new");
              }}
              onSubmitEditing={() => doSearch(q)}
              returnKeyType="search"
            />
            {q.length > 0 && (
              <TouchableOpacity onPress={() => { setQ(""); setSearchResults([]); if (feed === "search") setFeed("new"); }}>
                <Feather name="x" size={14} color={C.mutedForeground} />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            style={{ height: 46, paddingHorizontal: 18, borderRadius: 99, backgroundColor: C.foreground, alignItems: "center", justifyContent: "center" }}
            onPress={() => doSearch(q)}
          >
            {searchLoading
              ? <ActivityIndicator color={C.background} size="small" />
              : <Text style={{ fontSize: 14, fontFamily: "DMSans_600SemiBold", color: C.background }}>Search</Text>
            }
          </TouchableOpacity>
        </View>

        {/* ── Browse by genre ── */}
        <View style={{ paddingHorizontal: 20, marginBottom: 24, gap: 10 }}>
          <Text style={{ fontSize: 11, fontFamily: "DMSans_600SemiBold", color: C.mutedForeground, textTransform: "uppercase", letterSpacing: 3.2 }}>
            Browse by genre
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
            {GENRE_CATEGORIES.map((cat) => {
              const active = catFilter === cat.name;
              return (
                <TouchableOpacity
                  key={cat.name}
                  style={{
                    flexDirection: "row", alignItems: "center", gap: 5,
                    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 99, borderWidth: 1,
                    borderColor: active ? C.foreground : C.border + "99",
                    backgroundColor: active ? C.foreground : C.card + "B3",
                  }}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    if (active) {
                      setCatFilter(null); setQ(""); setFeed("new");
                    } else {
                      setCatFilter(cat.name); doSearch(cat.q);
                    }
                  }}
                >
                  <Text style={{ fontSize: 12 }}>{cat.emoji}</Text>
                  <Text style={{ fontSize: 12, fontFamily: "DMSans_400Regular", color: active ? C.background : C.mutedForeground }}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── Feed tabs ── */}
        <View style={{ paddingHorizontal: 20, marginBottom: 20, flexDirection: "row", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
          <View style={{
            flexDirection: "row", borderRadius: 99, borderWidth: 1,
            borderColor: C.border + "99", backgroundColor: C.card + "CC", padding: 4,
          }}>
            {(["new", "upcoming", ...(feed === "search" ? ["search" as FeedKey] : [])] as FeedKey[]).map((f) => {
              const active = feed === f;
              const label = f === "new" ? "✦ New releases" : f === "upcoming" ? "Upcoming" : "Search results";
              return (
                <TouchableOpacity
                  key={f}
                  style={{
                    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 99,
                    backgroundColor: active ? C.foreground : "transparent",
                  }}
                  onPress={() => setFeed(f)}
                >
                  <Text style={{ fontSize: 13, fontFamily: "DMSans_400Regular", color: active ? C.background : C.mutedForeground }}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {feed !== "search" && (
            <Text style={{ fontSize: 12, fontFamily: "DMSans_400Regular", color: C.mutedForeground }}>
              {feed === "new" ? `Published in ${CURRENT_YEAR}` : `Coming in ${NEXT_YEAR}`}
            </Text>
          )}
        </View>

        {/* ── Filters ── */}
        <View style={{
          marginHorizontal: 20, marginBottom: 20,
          borderRadius: 16, borderWidth: 1, borderColor: C.border + "80",
          backgroundColor: C.card + "80", padding: 16, gap: 14,
        }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Feather name="sliders" size={14} color={C.mutedForeground} />
            <Text style={{ fontSize: 14, fontFamily: "DMSans_400Regular", color: C.mutedForeground }}>
              Combine filters to refine the results:
            </Text>
          </View>

          <View style={{ gap: 8 }}>
            <Text style={{ fontSize: 10, fontFamily: "DMSans_600SemiBold", color: C.mutedForeground, textTransform: "uppercase", letterSpacing: 3.2 }}>
              Mood undertone
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
              {MOOD_KEYS.map((k) => {
                const active = activeMood === k;
                return (
                  <TouchableOpacity
                    key={k}
                    style={{
                      flexDirection: "row", alignItems: "center", gap: 5,
                      paddingHorizontal: 10, paddingVertical: 6, borderRadius: 99, borderWidth: 1,
                      borderColor: active ? C.foreground : C.border,
                      backgroundColor: active ? C.foreground : C.card + "B3",
                    }}
                    onPress={() => setActiveMood(active ? null : k)}
                  >
                    <Text style={{ fontSize: 12 }}>{MOODS[k].emoji}</Text>
                    <Text style={{ fontSize: 12, fontFamily: "DMSans_400Regular", color: active ? C.background : C.foreground }}>
                      {MOODS[k].label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={{ gap: 8 }}>
            <Text style={{ fontSize: 10, fontFamily: "DMSans_600SemiBold", color: C.mutedForeground, textTransform: "uppercase", letterSpacing: 3.2 }}>
              Length
            </Text>
            <View style={{ flexDirection: "row", gap: 6 }}>
              {LENGTHS.map((l) => {
                const active = activeLength === l.key;
                return (
                  <TouchableOpacity
                    key={l.key}
                    style={{
                      paddingHorizontal: 10, paddingVertical: 6, borderRadius: 99, borderWidth: 1,
                      borderColor: active ? C.foreground : C.border,
                      backgroundColor: active ? C.foreground : C.card + "B3",
                    }}
                    onPress={() => setActiveLength(active ? null : l.key)}
                  >
                    <Text style={{ fontSize: 12, fontFamily: "DMSans_400Regular", color: active ? C.background : C.foreground }}>
                      {l.label}{" "}
                      <Text style={{ fontSize: 10, opacity: 0.6 }}>{l.hint}</Text>
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {(activeMood || activeLength) && (
            <TouchableOpacity onPress={() => { setActiveMood(null); setActiveLength(null); }}>
              <Text style={{ fontSize: 12, fontFamily: "DMSans_400Regular", color: C.mutedForeground, textDecorationLine: "underline" }}>
                Clear all filters
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Book grid / Results ── */}
        {isLoading && visible.length === 0 ? (
          <View style={{ alignItems: "center", paddingVertical: 48 }}>
            <ActivityIndicator color={C.moodStrong} />
          </View>
        ) : feed === "search" ? (
          <View>
            {visible.map((item) => (
              <ResultRow key={item.key} item={item} onAdd={setAdding} />
            ))}
            {visible.length === 0 && !searchLoading && (
              <View style={{ alignItems: "center", paddingVertical: 48, paddingHorizontal: 40, gap: 12 }}>
                <View style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: C.moodTint, alignItems: "center", justifyContent: "center" }}>
                  <Feather name="search" size={24} color={C.moodStrong} />
                </View>
                <Text style={{ fontSize: 18, fontFamily: "Fraunces_600SemiBold", color: C.foreground, textAlign: "center" }}>
                  No results found
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View style={{ paddingHorizontal: 20, gap: 12 }}>
            {visible.length === 0 && !feedLoading && (
              <View style={{ alignItems: "center", paddingVertical: 40, gap: 12 }}>
                <View style={{
                  width: 56, height: 56, borderRadius: 16,
                  borderWidth: 1, borderStyle: "dashed", borderColor: C.border,
                  alignItems: "center", justifyContent: "center",
                }}>
                  <Text style={{ fontSize: 24 }}>📚</Text>
                </View>
                <Text style={{ fontSize: 16, fontFamily: "Fraunces_400Regular", color: C.foreground, textAlign: "center" }}>
                  No books for this filter yet
                </Text>
              </View>
            )}
            {Array.from({ length: Math.ceil(visible.length / 2) }).map((_, rowIdx) => {
              const left = visible[rowIdx * 2];
              const right = visible[rowIdx * 2 + 1];
              return (
                <View key={rowIdx} style={{ flexDirection: "row", gap: 12 }}>
                  {left && <View style={{ flex: 1 }}><BookCard item={left} onAdd={setAdding} /></View>}
                  {right ? (
                    <View style={{ flex: 1 }}><BookCard item={right} onAdd={setAdding} /></View>
                  ) : (
                    <View style={{ flex: 1 }} />
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {adding && <AddModal item={adding} onClose={() => setAdding(null)} />}
    </View>
  );
}
