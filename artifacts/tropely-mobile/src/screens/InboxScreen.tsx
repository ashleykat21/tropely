import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useStore, type InboxItem } from "@/store";
import { COLORS, CARD_STYLE, SHADOW } from "@/constants/theme";
import { GradientView } from "@/components/GradientView";
import { AtmosphereDecor } from "@/components/AtmosphereDecor";
import { useAtmosphere, useAtmosphereKey } from "@/hooks/useAtmosphere";

const TYPE_ICONS: Record<InboxItem["type"], string> = {
  buddy_invite: "👥",
  buddy_message: "💬",
  achievement: "🏆",
  system: "📢",
};

function relativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function InboxScreen() {
  const { inbox, markInboxRead, clearInbox } = useStore();
  const atmosphere = useAtmosphere();
  const atmosphereKey = useAtmosphereKey();

  const unreadCount = inbox.filter((i) => !i.read).length;

  if (inbox.length === 0) {
    return (
      <GradientView colors={atmosphere.gradient} style={{ flex: 1 }}>
        <AtmosphereDecor atmosphere={atmosphereKey} />
        <SafeAreaView style={styles.safe} edges={["bottom"]}>
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>✨</Text>
            <Text style={styles.emptyTitle}>No messages yet</Text>
            <Text style={styles.emptyDesc}>Buddy reads, achievements, and updates will appear here.</Text>
          </View>
        </SafeAreaView>
      </GradientView>
    );
  }

  const grouped: Record<InboxItem["type"], InboxItem[]> = {
    buddy_invite: [],
    buddy_message: [],
    achievement: [],
    system: [],
  };
  for (const item of inbox) {
    grouped[item.type].push(item);
  }

  const typeOrder: InboxItem["type"][] = ["buddy_invite", "buddy_message", "achievement", "system"];
  const typeLabels: Record<InboxItem["type"], string> = {
    buddy_invite: "Buddy Invites",
    buddy_message: "Buddy Messages",
    achievement: "Achievements",
    system: "Updates",
  };

  return (
    <GradientView colors={atmosphere.gradient} style={{ flex: 1 }}>
      <AtmosphereDecor atmosphere={atmosphereKey} />
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <View style={styles.headerRow}>
        {unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadBadgeText}>{unreadCount} unread</Text>
          </View>
        )}
        <TouchableOpacity onPress={clearInbox}>
          <Text style={styles.clearText}>Clear all</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {typeOrder.map((type) => {
          const items = grouped[type];
          if (items.length === 0) return null;
          return (
            <View key={type}>
              <Text style={styles.sectionLabel}>{typeLabels[type]}</Text>
              {items.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.itemCard, !item.read && styles.itemCardUnread]}
                  onPress={() => markInboxRead(item.id)}
                  activeOpacity={0.8}
                >
                  <View style={styles.itemIconBubble}>
                    <Text style={styles.itemIcon}>{TYPE_ICONS[item.type]}</Text>
                  </View>
                  <View style={styles.itemBody}>
                    <View style={styles.itemTitleRow}>
                      <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
                      {!item.read && <View style={styles.unreadDot} />}
                    </View>
                    <Text style={styles.itemText} numberOfLines={2}>{item.body}</Text>
                    <Text style={styles.itemDate}>{relativeDate(item.date)}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
    </GradientView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
  },
  unreadBadge: {
    backgroundColor: COLORS.lavender,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  unreadBadgeText: { fontSize: 12, color: "#fff", fontWeight: "700" },
  clearText: { fontSize: 13, color: COLORS.inkSoft, fontWeight: "600" },
  content: { padding: 16, gap: 10, paddingBottom: 40 },
  sectionLabel: {
    fontSize: 11, fontWeight: "700", color: COLORS.inkSoft,
    letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 6, marginTop: 8,
  },
  itemCard: {
    ...CARD_STYLE,
    ...SHADOW,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 8,
  },
  itemCardUnread: { borderColor: COLORS.lavender, borderWidth: 1.5 },
  itemIconBubble: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(167,139,250,0.12)",
    justifyContent: "center", alignItems: "center",
  },
  itemIcon: { fontSize: 20 },
  itemBody: { flex: 1, gap: 3 },
  itemTitleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  itemTitle: { flex: 1, fontSize: 14, fontWeight: "700", color: COLORS.ink },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.lavender },
  itemText: { fontSize: 13, color: COLORS.inkMid, lineHeight: 18 },
  itemDate: { fontSize: 11, color: COLORS.inkSoft },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: 40, gap: 12 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 20, fontWeight: "700", color: COLORS.ink },
  emptyDesc: { fontSize: 14, color: COLORS.inkSoft, textAlign: "center", lineHeight: 20 },
});
