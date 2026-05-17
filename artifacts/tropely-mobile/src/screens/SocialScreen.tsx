import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { fetchSocialFeed, type SocialActivity } from "@/lib/api";
import { useStore } from "@/store";

const ACTIVITY_ICONS: Record<string, string> = {
  finished:  "✅",
  started:   "📖",
  quote:     "💬",
  rating:    "⭐",
  milestone: "🏁",
};

function ActivityCard({ item, strictness }: { item: SocialActivity; strictness: string }) {
  const [revealed, setRevealed] = useState(false);
  const blurred = !revealed && item.spoilerLevel === "spoiler" && strictness !== "relaxed";

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        {item.avatarUrl ? (
          <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarInitial}>{(item.username ?? "?")[0].toUpperCase()}</Text>
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.username}>{item.username}</Text>
          <Text style={styles.timestamp}>{new Date(item.createdAt).toLocaleDateString()}</Text>
        </View>
        <Text style={styles.activityIcon}>{ACTIVITY_ICONS[item.type] ?? "📚"}</Text>
      </View>
      <Text style={styles.bookName}>{item.bookTitle}</Text>
      {item.text && (
        <TouchableOpacity onPress={() => blurred && setRevealed(true)} activeOpacity={blurred ? 0.8 : 1}>
          <Text style={[styles.activityText, blurred && styles.blurred]} numberOfLines={blurred ? 2 : undefined}>
            {blurred ? "⚠️ Possible spoiler — tap to reveal" : `"${item.text}"`}
          </Text>
        </TouchableOpacity>
      )}
      {item.rating != null && (
        <Text style={styles.rating}>{"★".repeat(item.rating)}{"☆".repeat(5 - item.rating)}</Text>
      )}
    </View>
  );
}

export default function SocialScreen() {
  const strictness = useStore((s) => s.spoilerStrictness);
  const [items, setItems] = useState<SocialActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState<string | undefined>();
  const [hasMore, setHasMore] = useState(true);

  const load = useCallback(async (reset = false) => {
    try {
      setLoading(true);
      const res = await fetchSocialFeed(reset ? undefined : cursor);
      setItems((prev) => reset ? res.items : [...prev, ...res.items]);
      setCursor(res.nextCursor);
      setHasMore(!!res.nextCursor);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [cursor]);

  useEffect(() => { load(true); }, []);

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => <ActivityCard item={item} strictness={strictness} />}
        onEndReached={() => { if (hasMore && !loading) load(); }}
        onEndReachedThreshold={0.4}
        refreshing={loading && items.length === 0}
        onRefresh={() => load(true)}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>🌿</Text>
              <Text style={styles.emptyTitle}>No activity yet</Text>
              <Text style={styles.emptyText}>Follow friends to see what they're reading.</Text>
            </View>
          ) : null
        }
        ListFooterComponent={loading && items.length > 0 ? <ActivityIndicator style={{ margin: 20 }} /> : null}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fafaf9" },
  list: { padding: 16, gap: 10 },
  card: { backgroundColor: "#fff", borderRadius: 16, padding: 14, borderWidth: 1, borderColor: "#f0ede8", gap: 8 },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: { width: 36, height: 36, borderRadius: 18 },
  avatarPlaceholder: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#f5f0ea", justifyContent: "center", alignItems: "center" },
  avatarInitial: { fontSize: 16, fontWeight: "700", color: "#9ca3af" },
  username: { fontSize: 14, fontWeight: "700", color: "#1a1a1a" },
  timestamp: { fontSize: 11, color: "#9ca3af" },
  activityIcon: { fontSize: 20 },
  bookName: { fontSize: 13, fontWeight: "600", color: "#6b7280" },
  activityText: { fontSize: 14, color: "#1a1a1a", lineHeight: 21, fontStyle: "italic" },
  blurred: { color: "#f0ede8", backgroundColor: "#e8e0d4", borderRadius: 6, overflow: "hidden" },
  rating: { fontSize: 15, color: "#f59e0b", letterSpacing: 1 },
  empty: { paddingTop: 80, alignItems: "center", gap: 10, paddingHorizontal: 32 },
  emptyEmoji: { fontSize: 40 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#1a1a1a" },
  emptyText: { fontSize: 14, color: "#9ca3af", textAlign: "center" },
});
