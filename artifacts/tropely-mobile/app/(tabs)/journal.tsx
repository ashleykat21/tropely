import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useMemo, useState } from "react";
import {
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
import { useStore, type JournalEntry, type JournalKind } from "@/lib/store";

const TAB_BAR_HEIGHT = 84;

// Exact emojis from Lovable's moods.ts REACTION_EMOJIS
const REACTION_EMOJIS = ["😭", "😌", "😡", "🤯", "😴", "🥰", "😂", "😱", "🥲", "🤔"];

type KindDef = { key: JournalKind; label: string; icon: string };
const KINDS: KindDef[] = [
  { key: "note",       label: "Note",       icon: "edit-3" },
  { key: "quote",      label: "Quote",      icon: "message-square" },
  { key: "reflection", label: "Reflection", icon: "star" },
  { key: "trigger",    label: "Trigger",    icon: "zap" },
  { key: "reread",     label: "Reread",     icon: "rotate-ccw" },
];

const PROMPTS: Record<JournalKind, string[]> = {
  note: [
    "What surprised me in this chapter…",
    "A detail I don't want to forget…",
    "Something that felt off — or exactly right…",
  ],
  quote: [
    "The line I can't stop thinking about…",
    "A sentence that hit harder than expected…",
    "The most beautiful line so far…",
  ],
  reflection: [
    "What did this chapter stir up in me?",
    "How did the mood shift here?",
    "Which character am I rooting for — and why?",
  ],
  trigger: [
    "This moment caught me off guard…",
    "I felt it in my chest when…",
  ],
  reread: [
    "What brought me back to this book…",
    "I kept thinking about this story because…",
  ],
};

function EntryCard({ entry, onDelete }: { entry: JournalEntry; onDelete: () => void }) {
  const C = useColors();
  const book = useStore((s) => s.books.find((b) => b.id === entry.bookId));
  const reactToJournal = useStore((s) => s.reactToJournal);
  const kind = KINDS.find((k) => k.key === entry.kind) ?? KINDS[0];

  return (
    <View style={{ backgroundColor: C.card + "CC", marginHorizontal: 20, borderRadius: 16, padding: 20, marginBottom: 10, borderWidth: 1, borderColor: C.border + "80" }}>
      {/* Header row */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1, flexWrap: "wrap" }}>
          <Feather name={kind.icon as any} size={13} color={C.mutedForeground} />
          <Text style={{ fontSize: 11, fontFamily: "DMSans_600SemiBold", color: C.mutedForeground, textTransform: "uppercase", letterSpacing: 1.5 }}>
            {kind.label}
          </Text>
          {entry.page !== undefined && (
            <Text style={{ fontSize: 11, fontFamily: "DMSans_400Regular", color: C.mutedForeground }}>· p. {entry.page}</Text>
          )}
          {book && (
            <View style={{ borderRadius: 99, borderWidth: 1, borderColor: C.border + "99", backgroundColor: C.background + "66", paddingHorizontal: 8, paddingVertical: 2 }}>
              <Text style={{ fontSize: 11, fontFamily: "DMSans_400Regular", color: C.mutedForeground }} numberOfLines={1}>{book.title}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity onPress={onDelete}>
          <Feather name="trash-2" size={15} color={C.mutedForeground} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      {entry.kind === "quote" ? (
        <Text style={{ fontSize: 16, fontFamily: "Fraunces_400Regular_Italic", color: C.foreground, lineHeight: 26, marginBottom: 8 }}>
          "{entry.text}"
        </Text>
      ) : (
        <Text style={{ fontSize: 14, fontFamily: "DMSans_400Regular", color: C.foreground + "E6", lineHeight: 22, marginBottom: 8 }}>
          {entry.text}
        </Text>
      )}

      <Text style={{ fontSize: 11, fontFamily: "DMSans_400Regular", color: C.mutedForeground, marginBottom: 10 }}>
        {new Date(entry.createdAt).toLocaleString()}
      </Text>

      {/* Reactions — matching Lovable exactly */}
      <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
        {(entry.reactions ?? []).length > 0 && (
          <Text style={{ fontSize: 16, marginRight: 4 }}>{(entry.reactions ?? []).join(" ")}</Text>
        )}
        <View style={{ flexDirection: "row", alignItems: "center", borderRadius: 99, backgroundColor: C.background + "99", borderWidth: 1, borderColor: C.border + "66", paddingHorizontal: 6, paddingVertical: 3, gap: 2 }}>
          {REACTION_EMOJIS.slice(0, 6).map((em) => (
            <TouchableOpacity
              key={em}
              style={{ paddingHorizontal: 4 }}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                reactToJournal(entry.id, em);
              }}
            >
              <Text style={{ fontSize: 15 }}>{em}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}

export default function JournalScreen() {
  const C = useColors();
  const insets = useSafeAreaInsets();
  const books = useStore((s) => s.books);
  const journal = useStore((s) => s.journal);
  const addJournal = useStore((s) => s.addJournal);
  const removeJournal = useStore((s) => s.removeJournal);

  const ALL_ID = "__all__";
  const [bookId, setBookId] = useState<string>(ALL_ID);
  const [kind, setKind] = useState<JournalKind>("note");
  const [text, setText] = useState("");
  const [page, setPage] = useState<string>("");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const byBook = bookId === ALL_ID ? journal : journal.filter((j) => j.bookId === bookId);
    const q = search.trim().toLowerCase();
    return q ? byBook.filter((j) => j.text.toLowerCase().includes(q)) : byBook;
  }, [journal, bookId, search]);

  const selectedBook = books.find((b) => b.id === bookId);

  const submit = () => {
    if (!text.trim()) return;
    addJournal({
      bookId: bookId === ALL_ID ? undefined : bookId,
      kind,
      text: text.trim(),
      page: page ? parseInt(page) : undefined,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setText("");
    setPage("");
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.background }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingTop: Platform.OS === "web" ? 67 : insets.top + 16,
          paddingBottom: (Platform.OS === "web" ? 34 : insets.bottom) + TAB_BAR_HEIGHT,
        }}
      >
        {/* ── Page header ── */}
        <View style={{ paddingHorizontal: 20, gap: 4, marginBottom: 28 }}>
          <Text style={{ fontSize: 11, fontFamily: "DMSans_600SemiBold", color: C.mutedForeground, textTransform: "uppercase", letterSpacing: 4 }}>
            Journal
          </Text>
          <Text style={{ fontFamily: "Fraunces_400Regular", fontSize: 36, color: C.foreground, lineHeight: 38, letterSpacing: -0.5 }}>
            {"Hold onto what "}
            <Text style={{ fontStyle: "italic", color: C.moodStrong }}>moves you</Text>
            {"."}
          </Text>
        </View>

        {/* ── Book selector pills ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: 24 }}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 8, flexDirection: "row" }}
        >
          <TouchableOpacity
            style={{ paddingHorizontal: 16, paddingVertical: 9, borderRadius: 99, borderWidth: 1, borderColor: bookId === ALL_ID ? C.foreground : C.border, backgroundColor: bookId === ALL_ID ? C.foreground : C.card + "B3" }}
            onPress={() => setBookId(ALL_ID)}
          >
            <Text style={{ fontSize: 14, fontFamily: "DMSans_400Regular", color: bookId === ALL_ID ? C.background : C.mutedForeground }}>All books</Text>
          </TouchableOpacity>
          {books.map((b) => (
            <TouchableOpacity
              key={b.id}
              style={{ paddingHorizontal: 16, paddingVertical: 9, borderRadius: 99, borderWidth: 1, borderColor: bookId === b.id ? C.foreground : C.border, backgroundColor: bookId === b.id ? C.foreground : C.card + "B3" }}
              onPress={() => setBookId(b.id)}
            >
              <Text style={{ fontSize: 14, fontFamily: "DMSans_400Regular", color: bookId === b.id ? C.background : C.mutedForeground }} numberOfLines={1}>
                {b.title}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── Composer card ── */}
        <View style={{ marginHorizontal: 20, marginBottom: 32, borderRadius: 16, padding: 20, backgroundColor: C.moodTint + "80", borderWidth: 1, borderColor: C.border + "66", gap: 14 }}>
          {/* Kind tabs */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {KINDS.map((k) => {
                const active = kind === k.key;
                return (
                  <TouchableOpacity
                    key={k.key}
                    style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 99, borderWidth: 1, borderColor: active ? C.foreground : C.border, backgroundColor: active ? C.foreground : C.card + "99" }}
                    onPress={() => setKind(k.key)}
                  >
                    <Feather name={k.icon as any} size={13} color={active ? C.background : C.mutedForeground} />
                    <Text style={{ fontSize: 13, fontFamily: "DMSans_400Regular", color: active ? C.background : C.mutedForeground }}>
                      {k.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          {/* Writing prompt chips */}
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
            {PROMPTS[kind].map((p) => (
              <TouchableOpacity
                key={p}
                style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99, borderWidth: 1, borderColor: C.border + "80", backgroundColor: C.card + "80" }}
                onPress={() => setText((prev) => prev ? prev : p)}
              >
                <Text style={{ fontSize: 11, fontFamily: "DMSans_400Regular", color: C.mutedForeground }}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Textarea */}
          <TextInput
            style={{ backgroundColor: C.card + "B3", borderWidth: 1, borderColor: C.border + "99", borderRadius: 12, padding: 14, minHeight: 120, fontSize: 14, fontFamily: "DMSans_400Regular", color: C.foreground, textAlignVertical: "top" }}
            placeholder={
              kind === "quote" ? "\u201cThe line you can\u2019t stop thinking about\u2026\u201d"
              : kind === "reflection" ? "What did this chapter stir up?"
              : "Anything you want to remember\u2026"
            }
            placeholderTextColor={C.mutedForeground}
            value={text}
            onChangeText={setText}
            multiline
          />

          {/* Page + Save row — matching Lovable */}
          <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 10 }}>
            <View style={{ width: 100 }}>
              <Text style={{ fontSize: 11, fontFamily: "DMSans_600SemiBold", color: C.mutedForeground, marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>
                Page
              </Text>
              <TextInput
                style={{ height: 42, borderRadius: 10, borderWidth: 1, borderColor: C.border + "99", backgroundColor: C.card + "B3", paddingHorizontal: 12, fontSize: 14, fontFamily: "DMSans_400Regular", color: C.foreground }}
                placeholder="—"
                placeholderTextColor={C.mutedForeground}
                value={page}
                onChangeText={(t) => setPage(t.replace(/[^0-9]/g, ""))}
                keyboardType="number-pad"
              />
            </View>
            <TouchableOpacity
              style={{ flex: 1, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 99, backgroundColor: C.foreground, opacity: !text.trim() ? 0.45 : 1, alignItems: "center" }}
              onPress={submit}
              disabled={!text.trim()}
            >
              <Text style={{ fontSize: 14, fontFamily: "DMSans_600SemiBold", color: C.background }}>Save entry</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Entries section header + search ── */}
        <View style={{ paddingHorizontal: 20, marginBottom: 14, gap: 12 }}>
          <Text style={{ fontFamily: "Fraunces_400Regular", fontSize: 24, color: C.foreground }}>
            {bookId === ALL_ID ? "All entries" : selectedBook ? `Entries · ${selectedBook.title}` : "Entries"}
          </Text>
          {/* Search bar — matching Lovable */}
          <View style={{ flexDirection: "row", alignItems: "center", borderRadius: 12, borderWidth: 1, borderColor: C.border + "99", backgroundColor: C.card + "99", paddingHorizontal: 12, height: 40, gap: 8 }}>
            <Feather name="search" size={14} color={C.mutedForeground} />
            <TextInput
              style={{ flex: 1, fontSize: 14, fontFamily: "DMSans_400Regular", color: C.foreground }}
              placeholder="Search entries…"
              placeholderTextColor={C.mutedForeground}
              value={search}
              onChangeText={setSearch}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch("")}>
                <Feather name="x" size={14} color={C.mutedForeground} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ── Entries list ── */}
        {filtered.length === 0 ? (
          <View style={{ marginHorizontal: 20, borderRadius: 16, padding: 40, borderWidth: 1, borderColor: C.border + "99", borderStyle: "dashed", alignItems: "center", gap: 12 }}>
            {search ? (
              <Text style={{ fontSize: 14, fontFamily: "DMSans_400Regular", color: C.mutedForeground, textAlign: "center" }}>
                No entries match "{search}".
              </Text>
            ) : (
              <>
                <View style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: C.foreground + "0D", alignItems: "center", justifyContent: "center" }}>
                  <Feather name="edit-3" size={20} color={C.moodStrong} />
                </View>
                <View style={{ alignItems: "center", gap: 4 }}>
                  <Text style={{ fontFamily: "Fraunces_400Regular", fontSize: 20, color: C.foreground, textAlign: "center" }}>
                    Capture your first note or quote.
                  </Text>
                  <Text style={{ fontSize: 14, fontFamily: "DMSans_400Regular", color: C.mutedForeground, textAlign: "center", lineHeight: 20 }}>
                    Anything that moves you — a line, a question, a feeling.
                  </Text>
                </View>
              </>
            )}
          </View>
        ) : (
          <View>
            {filtered.map((entry) => (
              <EntryCard key={entry.id} entry={entry} onDelete={() => removeJournal(entry.id)} />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
