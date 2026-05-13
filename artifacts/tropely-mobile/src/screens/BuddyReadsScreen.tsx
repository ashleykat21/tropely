import React, { useState, useEffect, useRef } from "react";
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
import { useAuth } from "@clerk/clerk-expo";
import {
  fetchBuddyReads,
  fetchBuddyReadMessages,
  postBuddyReadMessage,
} from "@/lib/api";

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

const POLL_INTERVAL_MS = 5_000;

export default function BuddyReadsScreen() {
  const { getToken, userId } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    loadRooms();
  }, []);

  useEffect(() => {
    if (!selectedRoom) {
      if (pollRef.current) clearInterval(pollRef.current);
      return;
    }
    loadMessages(selectedRoom.id);
    pollRef.current = setInterval(() => loadMessages(selectedRoom.id), POLL_INTERVAL_MS);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [selectedRoom?.id]);

  const loadRooms = async () => {
    setLoadingRooms(true);
    try {
      const data = await fetchBuddyReads(getToken);
      setRooms(Array.isArray(data) ? data : []);
    } catch {
      // silently fail — user may not have any rooms
    } finally {
      setLoadingRooms(false);
    }
  };

  const loadMessages = async (roomId: string) => {
    try {
      const data = await fetchBuddyReadMessages(roomId, getToken);
      const msgs = Array.isArray(data) ? data : (data.messages ?? []);
      setMessages(msgs);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: false }), 50);
    } catch {
      // polling — silent fail
    }
  };

  const sendMessage = async () => {
    if (!selectedRoom || !inputText.trim() || sending) return;
    setSending(true);
    const text = inputText.trim();
    setInputText("");
    try {
      await postBuddyReadMessage(selectedRoom.id, text, getToken);
      await loadMessages(selectedRoom.id);
    } catch {
      Alert.alert("Failed to send", "Check your connection and try again.");
      setInputText(text);
    } finally {
      setSending(false);
    }
  };

  if (selectedRoom) {
    return (
      <SafeAreaView style={styles.safe} edges={["bottom"]}>
        <View style={styles.chatHeader}>
          <TouchableOpacity onPress={() => setSelectedRoom(null)} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← Rooms</Text>
          </TouchableOpacity>
          <Text style={styles.chatRoomName} numberOfLines={1}>{selectedRoom.name}</Text>
        </View>

        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.messagesList}
          renderItem={({ item: m }) => {
            const isMe = m.userId === userId;
            return (
              <View style={[styles.msgBubble, isMe ? styles.msgBubbleMe : styles.msgBubbleThem]}>
                {!isMe && (
                  <Text style={styles.msgUser}>{m.userId.slice(0, 8)}</Text>
                )}
                <Text style={[styles.msgText, isMe && styles.msgTextMe]}>{m.content}</Text>
                <Text style={styles.msgTime}>
                  {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </Text>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyChat}>
              <Text style={styles.emptyChatText}>No messages yet. Say hello!</Text>
            </View>
          }
        />

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
            style={[styles.sendBtn, (!inputText.trim() || sending) && styles.sendBtnDisabled]}
            onPress={sendMessage}
            disabled={!inputText.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.sendBtnText}>↑</Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Buddy Reads</Text>
        <Text style={styles.subtitle}>Read together, share reactions in real time.</Text>

        {loadingRooms ? (
          <ActivityIndicator style={{ marginTop: 40 }} />
        ) : rooms.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No buddy reads yet</Text>
            <Text style={styles.emptyText}>
              Create a room on the web app at usenevora.com and your rooms will appear here.
            </Text>
          </View>
        ) : (
          rooms.map((room) => (
            <TouchableOpacity
              key={room.id}
              style={styles.roomCard}
              onPress={() => setSelectedRoom(room)}
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
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fafaf9" },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 14, paddingBottom: 32 },
  title: { fontSize: 26, fontWeight: "700", color: "#1a1a1a" },
  subtitle: { fontSize: 14, color: "#9ca3af", marginTop: -4 },
  empty: { paddingTop: 40, alignItems: "center", gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: "600", color: "#1a1a1a" },
  emptyText: { fontSize: 13, color: "#9ca3af", textAlign: "center", paddingHorizontal: 20, lineHeight: 20 },
  roomCard: { backgroundColor: "#fff", borderRadius: 16, padding: 16, flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#f0f0f0" },
  roomName: { fontSize: 16, fontWeight: "600", color: "#1a1a1a" },
  roomBook: { fontSize: 12, color: "#6b7280", marginTop: 2 },
  roomMembers: { fontSize: 11, color: "#9ca3af", marginTop: 2 },
  roomArrow: { fontSize: 18, color: "#d1d5db" },
  // Chat
  chatHeader: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderBottomWidth: 1, borderBottomColor: "#f0f0f0", backgroundColor: "#fff" },
  backBtn: { paddingVertical: 6 },
  backBtnText: { fontSize: 14, color: "#6b7280" },
  chatRoomName: { flex: 1, fontSize: 16, fontWeight: "700", color: "#1a1a1a" },
  messagesList: { padding: 12, gap: 10, flexGrow: 1 },
  msgBubble: { maxWidth: "80%", borderRadius: 16, padding: 10, gap: 2 },
  msgBubbleMe: { alignSelf: "flex-end", backgroundColor: "#1a1a1a" },
  msgBubbleThem: { alignSelf: "flex-start", backgroundColor: "#fff", borderWidth: 1, borderColor: "#f0f0f0" },
  msgUser: { fontSize: 10, color: "#9ca3af", marginBottom: 2 },
  msgText: { fontSize: 14, color: "#1a1a1a", lineHeight: 19 },
  msgTextMe: { color: "#fff" },
  msgTime: { fontSize: 10, color: "#d1d5db", alignSelf: "flex-end" },
  emptyChat: { flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 60 },
  emptyChatText: { fontSize: 14, color: "#9ca3af" },
  inputBar: { flexDirection: "row", gap: 8, padding: 12, borderTopWidth: 1, borderTopColor: "#f0f0f0", backgroundColor: "#fff" },
  inputField: { flex: 1, borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, backgroundColor: "#fafafa" },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#1a1a1a", justifyContent: "center", alignItems: "center", alignSelf: "flex-end" },
  sendBtnDisabled: { opacity: 0.4 },
  sendBtnText: { color: "#fff", fontSize: 18, fontWeight: "700" },
});
