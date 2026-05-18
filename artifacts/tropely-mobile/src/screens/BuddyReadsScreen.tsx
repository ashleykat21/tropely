import React, { useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Alert,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUser } from "@/context/AuthContext";
import { useStore } from "@/store";
import { useBuddyRooms, useBuddyMessages, useSendBuddyMessage } from "@/hooks/useBuddyReads";
import { usePremium } from "@/hooks/usePremium";
import { trackEvent } from "@/lib/analytics";
import { FREE_LIMITS } from "@/constants/premiumFeatures";
import { GradientView } from "@/components/GradientView";
import { COLORS, getAvatarById } from "@/constants/theme";
import { useAtmosphere } from "@/hooks/useAtmosphere";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/navigation";

type Nav = NativeStackNavigationProp<RootStackParamList>;

type Room = {
  id: string;
  name: string;
  bookTitle?: string;
  memberCount?: number;
};

type ChatMessage = {
  id: string;
  content: string;
  userId: string;
  createdAt: string;
};

const CHAPTER_SIZE = 30;

function deriveChapters(totalPages: number) {
  const count = Math.max(1, Math.ceil(totalPages / CHAPTER_SIZE));
  return Array.from({ length: count }, (_, i) => ({
    number: i + 1,
    startPage: i * CHAPTER_SIZE,
  }));
}

export default function BuddyReadsScreen() {
  const nav = useNavigation<Nav>();
  const user = useUser();
  const userId = user?.uid ?? null;
  const { isPremium } = usePremium();
  const age = useStore((s) => s.age);
  const spoilerLock = useStore((s) => s.spoilerLock);
  const books = useStore((s) => s.books);
  const equippedBadgeId = useStore((s) => s.equippedBadgeId);
  const selectedAvatar = useStore((s) => s.selectedAvatar);
  const inbox = useStore((s) => s.inbox);
  const avatar = getAvatarById(selectedAvatar);
  const unreadCount = inbox.filter((i) => !i.read).length;
  const atmosphere = useAtmosphere();
  const textColor = atmosphere.isDark ? "#ffffff" : "#1a1a1a";
  const textColorSoft = atmosphere.isDark ? "rgba(255,255,255,0.6)" : "#9ca3af";

  const BADGE_EMOJIS: Record<string, string> = {
    first_book: "📖", consistent_reader: "🔥", bookmarker: "🔖", finisher: "🏁",
    mood_reader: "🎭", night_owl: "🌙", bibliophile: "📚", speed_reader: "🏃",
    annotator: "💬", trope_hunter: "🎯", social_reader: "👯", dnf_queen: "💔",
    re_reader: "🔁", mood_traveller: "🌈", epic_reader: "🕯️", streak_master: "🏆",
    journaller: "✍️", critic: "🌟", trope_obsessed: "👑", reading_twin: "🤝",
  };
  const equippedEmoji = equippedBadgeId ? (BADGE_EMOJIS[equippedBadgeId] ?? "") : "";

  const isUnder13 = age !== null && age < 13;

  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [selectedChapterIdx, setSelectedChapterIdx] = useState(0);
  const [inputText, setInputText] = useState("");
  const listRef = useRef<FlatList>(null);

  const { data: roomsData = [], isLoading: loadingRooms } = useBuddyRooms();
  const rooms: Room[] = Array.isArray(roomsData) ? roomsData : [];

  const { data: messagesData } = useBuddyMessages(selectedRoom?.id ?? null);
  const messages: ChatMessage[] = Array.isArray(messagesData)
    ? messagesData
    : (messagesData?.messages ?? []);

  const sendMutation = useSendBuddyMessage(selectedRoom?.id ?? null);

  // Find the book in the local store matching the room's bookTitle
  const roomBook = selectedRoom?.bookTitle
    ? books.find((b) => b.title === selectedRoom.bookTitle)
    : undefined;
  const myCurrentPage = roomBook?.progress ?? 0;

  const chapters = roomBook ? deriveChapters(roomBook.pages) : [];
  const activeChapter = chapters[selectedChapterIdx];
  const isChapterLocked =
    activeChapter &&
    spoilerLock &&
    myCurrentPage < activeChapter.startPage &&
    activeChapter.number > 1;

  // Presence: users who sent a message recently (proxy for "currently reading")
  const recentSenders = Array.from(
    new Map(
      [...messages]
        .reverse()
        .slice(0, 10)
        .map((m) => [m.userId, m]),
    ).values(),
  ).slice(0, 5);
  const nearbyReaders = recentSenders.filter(
    (m) => m.userId !== userId,
  );

  const sendMessage = async () => {
    if (!selectedRoom || !inputText.trim() || sendMutation.isPending) return;
    const text = inputText.trim();
    setInputText("");
    try {
      await sendMutation.mutateAsync(text);
      trackEvent("Buddy Message Sent");
      setTimeout(() => listRef.current?.scrollToEnd({ animated: false }), 100);
    } catch {
      Alert.alert("Failed to send", "Check your connection and try again.");
      setInputText(text);
    }
  };

  const openRoom = (room: Room) => {
    setSelectedRoom(room);
    trackEvent("Buddy Read Opened", { roomId: room.id });
  };

  if (selectedRoom) {
    return (
      <SafeAreaView style={styles.safe} edges={["bottom"]}>
        <View style={styles.chatHeader}>
          <TouchableOpacity onPress={() => { setSelectedRoom(null); setSelectedChapterIdx(0); }} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← Rooms</Text>
          </TouchableOpacity>
          <Text style={styles.chatRoomName} numberOfLines={1}>{selectedRoom.name}</Text>
          {chapters.length > 1 && (
            <Text style={styles.chapterChatBadge}>✨ Chapter Chat</Text>
          )}
        </View>

        {/* Chapter tabs */}
        {chapters.length > 1 && (
          <View style={styles.chapterTabsWrapper}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chapterTabs}>
              {chapters.map((ch, idx) => {
                const locked = spoilerLock && myCurrentPage < ch.startPage && ch.number > 1;
                return (
                  <TouchableOpacity
                    key={ch.number}
                    style={[styles.chapterTab, selectedChapterIdx === idx && styles.chapterTabActive]}
                    onPress={() => setSelectedChapterIdx(idx)}
                  >
                    <Text style={[styles.chapterTabText, selectedChapterIdx === idx && styles.chapterTabTextActive]}>
                      {locked ? "🔒" : `Ch ${ch.number}`}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Presence indicator */}
            {nearbyReaders.length > 0 && (
              <View style={styles.presenceRow}>
                {nearbyReaders.slice(0, 3).map((m) => (
                  <View key={m.userId} style={styles.presenceAvatar}>
                    <Text style={styles.presenceInitial}>{m.userId[0].toUpperCase()}</Text>
                    <View style={styles.presenceDot} />
                  </View>
                ))}
                <Text style={styles.presenceText}>reading nearby</Text>
              </View>
            )}
          </View>
        )}

        {isChapterLocked ? (
          <View style={styles.lockedChapter}>
            <Text style={styles.lockedEmoji}>🔒</Text>
            <Text style={styles.lockedTitle}>Chapter {activeChapter.number} locked</Text>
            <Text style={styles.lockedSub}>
              Reach page {activeChapter.startPage} to unlock this chapter's discussion.
            </Text>
            <Text style={styles.lockedCurrentPage}>
              You're on page {myCurrentPage} — {activeChapter.startPage - myCurrentPage} pages to go.
            </Text>
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(m) => m.id}
            contentContainerStyle={styles.messagesList}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
            renderItem={({ item: m }) => {
              const isMe = m.userId === userId;
              return (
                <View style={[styles.msgBubble, isMe ? styles.msgBubbleMe : styles.msgBubbleThem]}>
                  {!isMe && (
                    <Text style={styles.msgUser}>{m.userId.slice(0, 8)}</Text>
                  )}
                  {isMe && equippedEmoji ? (
                    <Text style={styles.msgFlair}>{equippedEmoji}</Text>
                  ) : null}
                  <Text style={[styles.msgText, isMe && styles.msgTextMe]}>{m.content}</Text>
                  <Text style={styles.msgTime}>
                    {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </Text>
                </View>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyChat}>
                <Text style={styles.emptyChatEmoji}>👋</Text>
                <Text style={styles.emptyChatText}>Say the first thing!</Text>
              </View>
            }
          />
        )}

        {isUnder13 ? (
          <View style={styles.restrictedBar}>
            <Text style={styles.restrictedText}>Chat is restricted for your account.</Text>
          </View>
        ) : (
          <View style={styles.inputBar}>
            <TextInput
              style={styles.inputField}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Message…"
              onSubmitEditing={sendMessage}
              returnKeyType="send"
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!inputText.trim() || sendMutation.isPending) && styles.sendBtnDisabled]}
              onPress={sendMessage}
              disabled={!inputText.trim() || sendMutation.isPending}
            >
              {sendMutation.isPending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.sendBtnText}>↑</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    );
  }

  return (
    <GradientView colors={atmosphere.gradient} style={{ flex: 1 }}>
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.buddyHeader}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: textColor }]}>Buddy Reads</Text>
            <Text style={[styles.subtitle, { color: textColorSoft }]}>Read together, share reactions in real time.</Text>
          </View>
          <View style={[styles.myAvatarBubble, { backgroundColor: avatar.bg }]}>
            <Text style={styles.myAvatarEmoji}>{avatar.emoji}</Text>
          </View>
          <TouchableOpacity style={styles.inboxBtn} onPress={() => nav.navigate("Inbox")} activeOpacity={0.8}>
            <Text style={styles.inboxEmoji}>💬</Text>
            {unreadCount > 0 && (
              <View style={styles.inboxBadge}>
                <Text style={styles.inboxBadgeText}>{unreadCount > 9 ? "9+" : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {loadingRooms ? (
          <ActivityIndicator style={{ marginTop: 40 }} />
        ) : rooms.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📚</Text>
            <Text style={[styles.emptyTitle, { color: textColor }]}>No Buddy Reads yet</Text>
            <Text style={[styles.emptyText, { color: textColorSoft }]}>Start a private reading room with up to 3 friends.</Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => { /* placeholder */ }}>
              <Text style={styles.primaryBtnText}>Start Buddy Read</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => { /* placeholder */ }}>
              <Text style={[styles.secondaryBtnText, { color: atmosphere.accentColor }]}>Enter Invite Code</Text>
            </TouchableOpacity>
            <Text style={[styles.freeNote, { color: textColorSoft }]}>Free rooms support up to 3 readers</Text>
          </View>
        ) : (
          <>
            {(isPremium ? rooms : rooms.slice(0, FREE_LIMITS.BUDDY_ROOMS)).map((room) => (
              <TouchableOpacity
                key={room.id}
                style={styles.roomCard}
                onPress={() => openRoom(room)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.roomName}>{room.name}</Text>
                  {room.bookTitle && (
                    <Text style={styles.roomBook}>{room.bookTitle}</Text>
                  )}
                  {room.memberCount && (
                    <Text style={styles.roomMembers}>{room.memberCount} readers</Text>
                  )}
                </View>
                <Text style={styles.roomArrow}>→</Text>
              </TouchableOpacity>
            ))}
            {!isPremium && rooms.length > FREE_LIMITS.BUDDY_ROOMS && (
              <View style={styles.premiumRoomCard}>
                <Text style={styles.premiumRoomText}>
                  ✨ Premium — unlock unlimited buddy read rooms
                </Text>
                <Text style={styles.premiumRoomSub}>
                  You have {rooms.length - FREE_LIMITS.BUDDY_ROOMS} more room{rooms.length - FREE_LIMITS.BUDDY_ROOMS !== 1 ? "s" : ""} waiting
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
    </GradientView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  buddyHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 4 },
  myAvatarBubble: { width: 36, height: 36, borderRadius: 18, justifyContent: "center", alignItems: "center" },
  myAvatarEmoji: { fontSize: 20 },
  inboxBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.5)", justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.6)" },
  inboxEmoji: { fontSize: 16 },
  inboxBadge: { position: "absolute", top: -2, right: -2, width: 16, height: 16, borderRadius: 8, backgroundColor: COLORS.rose, justifyContent: "center", alignItems: "center" },
  inboxBadgeText: { fontSize: 9, color: "#fff", fontWeight: "700" },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 14, paddingBottom: 32 },
  title: { fontSize: 26, fontWeight: "700", color: "#1a1a1a" },
  subtitle: { fontSize: 14, color: "#9ca3af", marginTop: -4 },
  empty: { paddingTop: 40, alignItems: "center", gap: 8, paddingHorizontal: 24 },
  emptyEmoji: { fontSize: 48, marginBottom: 4 },
  emptyTitle: { fontSize: 18, fontWeight: "700", textAlign: "center" },
  emptyText: { fontSize: 14, textAlign: "center", lineHeight: 20, marginBottom: 4 },
  primaryBtn: { backgroundColor: "#a78bfa", borderRadius: 14, paddingVertical: 13, paddingHorizontal: 32, marginTop: 8 },
  primaryBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  secondaryBtn: { marginTop: 4, paddingVertical: 8 },
  secondaryBtnText: { fontSize: 14, fontWeight: "600" },
  freeNote: { fontSize: 12, marginTop: 8, textAlign: "center" },
  roomCard: { backgroundColor: "#fff", borderRadius: 16, padding: 16, flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#f0ede8" },
  roomName: { fontSize: 16, fontWeight: "600", color: "#1a1a1a" },
  roomBook: { fontSize: 12, color: "#6b7280", marginTop: 2 },
  roomMembers: { fontSize: 11, color: "#9ca3af", marginTop: 2 },
  roomArrow: { fontSize: 18, color: "#d1d5db" },
  premiumRoomCard: { backgroundColor: "#fef9c3", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#fde68a", gap: 4 },
  premiumRoomText: { fontSize: 14, fontWeight: "600", color: "#92400e" },
  premiumRoomSub: { fontSize: 12, color: "#a16207" },
  chapterChatBadge: { fontSize: 11, fontWeight: "600", color: "#9ca3af" },
  // Chat
  chatHeader: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderBottomWidth: 1, borderBottomColor: "#f0ede8", backgroundColor: "#fff" },
  backBtn: { paddingVertical: 6 },
  backBtnText: { fontSize: 14, color: "#6b7280" },
  chatRoomName: { flex: 1, fontSize: 16, fontWeight: "700", color: "#1a1a1a" },
  // Chapter tabs
  chapterTabsWrapper: { backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#f0ede8" },
  chapterTabs: { paddingHorizontal: 12, paddingVertical: 8, gap: 6 },
  chapterTab: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: "#f3f4f6" },
  chapterTabActive: { backgroundColor: "#1a1a1a" },
  chapterTabText: { fontSize: 12, fontWeight: "500", color: "#6b7280" },
  chapterTabTextActive: { color: "#fff" },
  // Presence
  presenceRow: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 12, paddingBottom: 8 },
  presenceAvatar: { width: 20, height: 20, borderRadius: 10, backgroundColor: "#d1fae5", justifyContent: "center", alignItems: "center" },
  presenceInitial: { fontSize: 9, fontWeight: "700", color: "#065f46" },
  presenceDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#22c55e", position: "absolute", bottom: -1, right: -1, borderWidth: 1, borderColor: "#fff" },
  presenceText: { fontSize: 10, color: "#9ca3af" },
  // Locked chapter
  lockedChapter: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32, gap: 12 },
  lockedEmoji: { fontSize: 48 },
  lockedTitle: { fontSize: 18, fontWeight: "700", color: "#1a1a1a" },
  lockedSub: { fontSize: 14, color: "#6b7280", textAlign: "center", lineHeight: 20 },
  lockedCurrentPage: { fontSize: 12, color: "#9ca3af", textAlign: "center" },
  // Messages
  messagesList: { padding: 12, gap: 10, flexGrow: 1 },
  msgBubble: { maxWidth: "80%", borderRadius: 16, padding: 10, gap: 2 },
  msgBubbleMe: { alignSelf: "flex-end", backgroundColor: "#1a1a1a" },
  msgBubbleThem: { alignSelf: "flex-start", backgroundColor: "#fff", borderWidth: 1, borderColor: "#f0ede8" },
  msgUser: { fontSize: 10, color: "#9ca3af", marginBottom: 2 },
  msgFlair: { fontSize: 10, alignSelf: "flex-end" },
  msgText: { fontSize: 14, color: "#1a1a1a", lineHeight: 19 },
  msgTextMe: { color: "#fff" },
  msgTime: { fontSize: 10, color: "#d1d5db", alignSelf: "flex-end" },
  emptyChat: { flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 80, gap: 8 },
  emptyChatEmoji: { fontSize: 36 },
  emptyChatText: { fontSize: 15, color: "#9ca3af", fontWeight: "500" },
  // Input
  restrictedBar: { padding: 16, borderTopWidth: 1, borderTopColor: "#f0ede8", backgroundColor: "#fef9c3", alignItems: "center" },
  restrictedText: { fontSize: 13, color: "#92400e" },
  inputBar: { flexDirection: "row", gap: 8, padding: 12, borderTopWidth: 1, borderTopColor: "#f0ede8", backgroundColor: "#fff" },
  inputField: { flex: 1, borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, backgroundColor: "#fafafa" },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#1a1a1a", justifyContent: "center", alignItems: "center", alignSelf: "flex-end" },
  sendBtnDisabled: { opacity: 0.4 },
  sendBtnText: { color: "#fff", fontSize: 18, fontWeight: "700" },
});
