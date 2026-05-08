import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
  bg: "#120F1D", card: "#1B1628", cardDeep: "#221B34", border: "#2E274A",
  primary: "#9B72CF", amber: "#D4874A", gold: "#D4A832", green: "#52C97E",
  teal: "#5CB8C8", red: "#BF4D5E", text: "#F0EEF8", sub: "#C4BFDA",
  muted: "#7E7A9A", lockedBg: "#191325", lockedText: "#504C6B", lockedBorder: "#241E38",
};

// ─── Mock data ────────────────────────────────────────────────────────────────
const BOOK = { title: "The Midnight Library", author: "Matt Haig", genre: "Literary Fiction · 304 pages", progress: 68, currentGoal: "Finish Part 2 — Chapter 15", deadline: "May 12", members: 8 };

const READERS = [
  { id: 1, initials: "A", name: "Aria",   chapter: 14, status: "reading",  streak: 5, pct: 72 },
  { id: 2, initials: "M", name: "Marcus", chapter: 12, status: "behind",   streak: 2, pct: 58 },
  { id: 3, initials: "Z", name: "Zoe",    chapter: 15, status: "finished", streak: 8, pct: 82 },
  { id: 4, initials: "K", name: "Kai",    chapter: 13, status: "onpace",   streak: 4, pct: 65 },
  { id: 5, initials: "R", name: "River",  chapter: 14, status: "reading",  streak: 3, pct: 70 },
];

type ChapterData = { id: number; title: string; status: string; comments: number; reactions: number; topEmoji: string; activeReaders: number; theories: number; locked: boolean; unlockedBy?: number; hot?: boolean };
type Milestone  = { id: number; label: string; title: string; chapters: string; deadline: string; done: boolean; data: ChapterData[] };

const MILESTONES: Milestone[] = [
  { id: 1, label: "Milestone 1", title: "The Opening", chapters: "Chapters 1–5", deadline: "May 3", done: true, data: [
    { id: 1, title: "Between Life and Death", status: "finished", comments: 12, reactions: 28, topEmoji: "🤯", activeReaders: 0, theories: 8, locked: false, hot: true },
    { id: 2, title: "The Librarian",           status: "finished", comments: 8,  reactions: 19, topEmoji: "💜", activeReaders: 0, theories: 5, locked: false },
    { id: 3, title: "The Root Cause",           status: "finished", comments: 6,  reactions: 14, topEmoji: "😭", activeReaders: 0, theories: 4, locked: false },
    { id: 4, title: "String Theory of Life",   status: "finished", comments: 9,  reactions: 22, topEmoji: "🔥", activeReaders: 0, theories: 7, locked: false, hot: true },
    { id: 5, title: "The Possibilities",        status: "finished", comments: 7,  reactions: 11, topEmoji: "✨", activeReaders: 0, theories: 3, locked: false },
  ]},
  { id: 2, label: "Milestone 2", title: "Descent into the Library", chapters: "Chapters 6–10", deadline: "May 8", done: false, data: [
    { id: 6, title: "A Different Life",   status: "finished",    comments: 5, reactions: 16, topEmoji: "💫", activeReaders: 2, theories: 6, locked: false },
    { id: 7, title: "The Second Chance",  status: "reading",     comments: 3, reactions: 8,  topEmoji: "👀", activeReaders: 4, theories: 3, locked: false },
    { id: 8, title: "Regret",             status: "not_started", comments: 0, reactions: 0,  topEmoji: "",   activeReaders: 0, theories: 0, locked: false },
    { id: 9, title: "Another Version",    status: "locked",      comments: 0, reactions: 0,  topEmoji: "",   activeReaders: 0, theories: 0, locked: true, unlockedBy: 8 },
    { id: 10, title: "Sliding Doors",     status: "locked",      comments: 0, reactions: 0,  topEmoji: "",   activeReaders: 0, theories: 0, locked: true, unlockedBy: 9 },
  ]},
  { id: 3, label: "Milestone 3", title: "Life Unlived", chapters: "Chapters 11–15", deadline: "May 12", done: false, data: [
    { id: 11, title: "The Weight of Choice",  status: "locked", comments: 0, reactions: 0, topEmoji: "", activeReaders: 0, theories: 0, locked: true, unlockedBy: 10 },
    { id: 12, title: "Everything She Wanted", status: "locked", comments: 0, reactions: 0, topEmoji: "", activeReaders: 0, theories: 0, locked: true, unlockedBy: 11 },
    { id: 13, title: "Olympic Dreams",        status: "locked", comments: 0, reactions: 0, topEmoji: "", activeReaders: 0, theories: 0, locked: true, unlockedBy: 12 },
    { id: 14, title: "The Letter",            status: "locked", comments: 0, reactions: 0, topEmoji: "", activeReaders: 0, theories: 0, locked: true, unlockedBy: 13 },
    { id: 15, title: "The Midnight Library",  status: "locked", comments: 0, reactions: 0, topEmoji: "", activeReaders: 0, theories: 0, locked: true, unlockedBy: 14 },
  ]},
  { id: 4, label: "Final Reflection", title: "The Ending", chapters: "Chapters 16–End", deadline: "May 17", done: false, data: [] },
];

const DISCUSSIONS = [
  { ch: 4, title: "String Theory of Life", unlocked: true,  reactions: 22, comments: 9,  emoji: "🔥" },
  { ch: 5, title: "The Possibilities",     unlocked: true,  reactions: 11, comments: 7,  emoji: "✨" },
  { ch: 6, title: "A Different Life",      unlocked: false, reactions: 0,  comments: 0,  emoji: "💫" },
];
const CHECKINS    = [{ id: 1, emoji: "💬", prompt: "Favourite quote so far?" }, { id: 2, emoji: "🔮", prompt: "Biggest prediction?" }, { id: 3, emoji: "⭐", prompt: "Rate this chapter" }, { id: 4, emoji: "👁️", prompt: "Who do you trust least?" }];
const QUICK_EMO   = ["💜","👋","🔥","📚","🤯","😭","👀"];
const POLLS       = [{ id: 1, question: "Who is hiding something?", options: [{ label: "The Librarian", pct: 42 },{ label: "Mrs. Elm", pct: 18 },{ label: "Hugo", pct: 27 },{ label: "Nora herself", pct: 13 }] },{ id: 2, question: "Was Nora telling the truth in Ch. 4?", options: [{ label: "Yes, completely", pct: 31 },{ label: "Half-truth", pct: 45 },{ label: "She was lying", pct: 24 }] }];
const RECAP       = [{ emoji: "🎯", label: "Most Accurate Prediction", value: "Zoe — \"Hugo is a parallel Nora\"" },{ emoji: "💬", label: "Favourite Quote", value: "\"Between life and death there is a library.\"" },{ emoji: "🔥", label: "Most Reacted Chapter", value: "Chapter 4 — 22 reactions" },{ emoji: "⭐", label: "Group Average Rating", value: "4.3 / 5.0 stars" },{ emoji: "😂", label: "Funniest Reaction", value: "Marcus: \"I quit my job after reading this\"" },{ emoji: "💜", label: "Emotional Journey", value: "😰 → 😮 → 😭 → 💫 → 💜" }];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function sCol(s: string) { return s==="reading"?C.teal:s==="onpace"?C.green:s==="behind"?C.red:s==="finished"?C.gold:C.muted; }
function sLab(s: string) { return s==="reading"?"Reading now":s==="onpace"?"On pace":s==="behind"?"Behind":s==="finished"?"Finished ✓":s; }
function cCol(s: string) { return s==="finished"?C.green:s==="reading"?C.teal:s==="not_started"?C.muted:C.lockedText; }
function cLab(s: string) { return s==="finished"?"Finished":s==="reading"?"Reading":s==="not_started"?"Not started":"Locked"; }

function Bar({ pct, color, h=5 }: { pct: number; color: string; h?: number }) {
  return (
    <View style={[s.barTrack, { height: h }]}>
      <View style={[s.barFill, { width: `${Math.min(100,pct)}%` as any, height: h, backgroundColor: color }]} />
    </View>
  );
}
function Tag({ label, color }: { label: string; color: string }) {
  return <View style={[s.tag, { backgroundColor: color+"22", borderColor: color+"55" }]}><Text style={[s.tagTxt, { color }]}>{label}</Text></View>;
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function ReaderCard({ r }: { r: typeof READERS[0] }) {
  const col = sCol(r.status);

  function handleLongPress() {
    Alert.alert(r.name, "What would you like to do?", [
      {
        text: "🚫 Block user",
        style: "destructive",
        onPress: () =>
          Alert.alert("Block " + r.name + "?", "They won't be able to see your activity and you won't see theirs.", [
            { text: "Cancel", style: "cancel" },
            {
              text: "Block",
              style: "destructive",
              onPress: () => Alert.alert("Blocked", r.name + " has been blocked."),
            },
          ]),
      },
      {
        text: "⚑ Report user",
        onPress: () =>
          Alert.alert("Report " + r.name, "Select a reason:", [
            { text: "Cancel", style: "cancel" },
            { text: "Harassment or bullying", onPress: () => Alert.alert("Reported", "Thank you. We'll review this report.") },
            { text: "Inappropriate content", onPress: () => Alert.alert("Reported", "Thank you. We'll review this report.") },
            { text: "Spam", onPress: () => Alert.alert("Reported", "Thank you. We'll review this report.") },
          ]),
      },
      { text: "Cancel", style: "cancel" },
    ]);
  }

  return (
    <TouchableOpacity style={s.readerCard} onLongPress={handleLongPress} activeOpacity={0.85}>
      <View style={[s.avatar, { backgroundColor: col+"30", borderColor: col+"80" }]}>
        <Text style={[s.avatarTxt, { color: col }]}>{r.initials}</Text>
      </View>
      <Text style={s.readerName}>{r.name}</Text>
      <Text style={[s.readerStatus, { color: col }]}>{sLab(r.status)}</Text>
      <Text style={s.readerCh}>Ch. {r.chapter}</Text>
      <Bar pct={r.pct} color={col} h={3} />
      <View style={s.readerFoot}>
        <Text style={[s.readerSub, { color: C.gold }]}>🔥 {r.streak}</Text>
        <Text style={s.readerSub}>{r.pct}%</Text>
      </View>
    </TouchableOpacity>
  );
}

function ChapterRow({ ch, onPress }: { ch: ChapterData; onPress: () => void }) {
  if (ch.locked) {
    return (
      <View style={[s.chRow, s.chLocked]}>
        <Text style={{ fontSize: 14, marginRight: 8 }}>🔒</Text>
        <View>
          <Text style={[s.chTitle, { color: C.lockedText }]}>Ch. {ch.id} — {ch.title}</Text>
          <Text style={s.chHint}>Finish Ch. {ch.unlockedBy} to unlock</Text>
        </View>
      </View>
    );
  }
  const col = cCol(ch.status);
  return (
    <View style={s.chCard}>
      <View style={s.chTop}>
        <View style={[s.chDot, { backgroundColor: col }]} />
        <View style={{ flex: 1 }}>
          <Text style={s.chTitle}>Ch. {ch.id} — {ch.title}</Text>
          <View style={s.chBadges}>
            <Tag label={cLab(ch.status)} color={col} />
            {ch.hot && <Tag label="🔥 Most reacted" color={C.amber} />}
          </View>
        </View>
      </View>
      {(ch.status==="finished"||ch.status==="reading") && (
        <View style={s.chSocial}>
          {ch.activeReaders>0 && <Text style={s.chMeta}>👤 {ch.activeReaders} reading</Text>}
          {ch.theories>0 && <Text style={s.chMeta}>🔮 {ch.theories} theories</Text>}
          {ch.reactions>0 && <Text style={s.chMeta}>{ch.topEmoji} {ch.reactions}</Text>}
          {ch.comments>0 && <Text style={s.chMeta}>💬 {ch.comments}</Text>}
        </View>
      )}
      <View style={s.chActions}>
        {ch.status==="not_started" && <Pressable style={[s.chBtn,{backgroundColor:C.primary}]} onPress={onPress}><Text style={s.chBtnTxt}>Start Chapter</Text></Pressable>}
        {ch.status==="reading" && <>
          <Pressable style={[s.chBtn,{backgroundColor:C.green}]} onPress={onPress}><Text style={s.chBtnTxt}>Mark Finished</Text></Pressable>
          <Pressable style={[s.chBtn,s.chBtnOut]} onPress={onPress}><Text style={[s.chBtnTxt,{color:C.teal}]}>Open Discussion</Text></Pressable>
        </>}
        {ch.status==="finished" && <Pressable style={[s.chBtn,s.chBtnOut]} onPress={onPress}><Text style={[s.chBtnTxt,{color:C.primary}]}>Open Discussion</Text></Pressable>}
      </View>
    </View>
  );
}

function MilestoneSection({ m, expanded, onToggle }: { m: Milestone; expanded: boolean; onToggle: () => void }) {
  const col = m.done ? C.green : m.id===4 ? C.muted : C.primary;
  return (
    <View style={[s.milestone, { borderLeftColor: col }]}>
      <Pressable style={s.milestoneHead} onPress={onToggle}>
        <View style={{ flex: 1 }}>
          <View style={s.milestoneLabelRow}>
            <Text style={[s.milestoneLabel, { color: col }]}>{m.label}</Text>
            {m.done && <Tag label="Complete ✓" color={C.green} />}
          </View>
          <Text style={s.milestoneTitle}>{m.title}</Text>
          <Text style={s.milestoneSub}>{m.chapters}</Text>
        </View>
        <View style={s.milestoneRight}>
          <View style={[s.deadlinePill, { borderColor: col+"60" }]}>
            <Text style={[s.deadlineTxt, { color: col }]}>📅 {m.deadline}</Text>
          </View>
          <Text style={s.chevron}>{expanded ? "▲" : "▼"}</Text>
        </View>
      </Pressable>
      {expanded && (
        <View style={s.chList}>
          {m.data.length === 0
            ? <View style={s.emptyMilestone}><Text style={s.emptyTxt}>📖 Chapters revealed when Milestone 3 is complete.</Text></View>
            : m.data.map(ch => <ChapterRow key={ch.id} ch={ch} onPress={() => {}} />)
          }
        </View>
      )}
    </View>
  );
}

function PollCard({ poll }: { poll: typeof POLLS[0] }) {
  const [voted, setVoted] = useState<number | null>(null);
  return (
    <View style={s.pollCard}>
      <Text style={s.pollQ}>{poll.question}</Text>
      {poll.options.map((o, i) => {
        const active = voted === i;
        return (
          <Pressable key={i} style={s.pollOption} onPress={() => setVoted(i)}>
            <View style={s.pollRow}>
              <Text style={[s.pollLabel, active && { color: C.primary }]}>{o.label}</Text>
              {voted !== null && <Text style={[s.pollPct, active && { color: C.primary }]}>{o.pct}%</Text>}
            </View>
            {voted !== null && (
              <Bar pct={o.pct} color={active ? C.primary : C.primary+"40"} h={4} />
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function BuddyReadsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [expanded, setExpanded] = useState<Set<number>>(new Set([2]));
  const [reactions, setReactions] = useState<Record<string, boolean>>({});

  function toggle(id: number) {
    setExpanded(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  const TAB_BAR_HEIGHT = 84;

  return (
    <View style={[s.root, { paddingTop: Platform.OS==="web" ? 67 : insets.top }]}>
      {/* Back button */}
      <View style={s.topBar}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={18} color={C.text} />
        </TouchableOpacity>
        <Text style={s.topTitle}>Buddy Reads</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        style={{ flex: 1, backgroundColor: C.bg }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: (Platform.OS==="web"?34:insets.bottom) + TAB_BAR_HEIGHT + 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Subtitle */}
        <Text style={s.subtitle}>Read together, react together, finish together.</Text>

        {/* ── 1. Current buddy read ── */}
        <View style={s.buddyCard}>
          <View style={s.bookCover}><Text style={{ fontSize: 32 }}>📖</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={s.bookTitle}>{BOOK.title}</Text>
            <Text style={s.bookAuthor}>{BOOK.author}</Text>
            <Text style={s.bookGenre}>{BOOK.genre}</Text>
            <View style={s.tagRow}>
              <Tag label={`👥 ${BOOK.members} readers`} color={C.primary} />
              <Tag label={`📅 Due ${BOOK.deadline}`}    color={C.amber} />
            </View>
            <View style={s.progressLabelRow}>
              <Text style={s.progressLabelTxt}>Group progress</Text>
              <Text style={[s.progressLabelTxt, { color: C.primary, fontWeight: "700" }]}>{BOOK.progress}%</Text>
            </View>
            <Bar pct={BOOK.progress} color={C.primary} h={8} />
            <Text style={s.goalTxt}>🎯 {BOOK.currentGoal}</Text>
            <Pressable style={s.joinBtn}><Text style={s.joinBtnTxt}>Join Reading Room →</Text></Pressable>
          </View>
        </View>

        {/* ── 2. Active readers ── */}
        <Text style={s.sectionTitle}>Active Readers</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -16 }} contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}>
          {READERS.map(r => <ReaderCard key={r.id} r={r} />)}
        </ScrollView>

        {/* ── 3. Milestones ── */}
        <Text style={s.sectionTitle}>Reading Milestones</Text>
        <View style={{ gap: 10 }}>
          {MILESTONES.map(m => <MilestoneSection key={m.id} m={m} expanded={expanded.has(m.id)} onToggle={() => toggle(m.id)} />)}
        </View>

        {/* ── 4. Spoiler-safe discussions ── */}
        <Text style={s.sectionTitle}>Chapter Discussions</Text>
        <View style={{ gap: 10 }}>
          {DISCUSSIONS.map(d => (
            <Pressable key={d.ch} style={[s.discCard, !d.unlocked && { opacity: 0.5 }]} disabled={!d.unlocked}>
              <View style={s.discTop}>
                <Text style={[s.discTitle, !d.unlocked && { color: C.lockedText }]}>{d.emoji} Ch. {d.ch} — {d.title}</Text>
                <Tag label={d.unlocked ? "Unlocked" : "🔒 Locked"} color={d.unlocked ? C.green : C.lockedText} />
              </View>
              {d.unlocked
                ? <View style={{ flexDirection: "row", gap: 12 }}><Text style={s.chMeta}>🔥 {d.reactions}</Text><Text style={s.chMeta}>💬 {d.comments}</Text><Text style={[s.chMeta, { color: C.primary }]}>Open →</Text></View>
                : <Text style={s.chHint}>Finish the chapter to unlock the room</Text>
              }
            </Pressable>
          ))}
        </View>

        {/* ── 5. Check-ins ── */}
        <Text style={s.sectionTitle}>Chapter Check-Ins</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -16 }} contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}>
          {CHECKINS.map(c => (
            <Pressable key={c.id} style={s.checkinCard}>
              <Text style={{ fontSize: 26 }}>{c.emoji}</Text>
              <Text style={s.checkinPrompt}>{c.prompt}</Text>
              <View style={s.checkinAction}><Text style={{ fontSize: 11, color: C.primary, fontWeight: "600" }}>Tap to respond</Text></View>
            </Pressable>
          ))}
        </ScrollView>

        {/* ── 6. Quick reactions ── */}
        <Text style={s.sectionTitle}>Quick Reactions</Text>
        <View style={s.emoRow}>
          {QUICK_EMO.map(e => {
            const active = reactions[e];
            return (
              <Pressable key={e} style={[s.emoBtn, active && { backgroundColor: C.primary+"30", borderColor: C.primary }]} onPress={() => setReactions(p => ({ ...p, [e]: !p[e] }))}>
                <Text style={{ fontSize: 22 }}>{e}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* ── 7. Polls ── */}
        <Text style={s.sectionTitle}>Predictions &amp; Polls</Text>
        <View style={{ gap: 10 }}>
          {POLLS.map(p => <PollCard key={p.id} poll={p} />)}
        </View>

        {/* ── 8. End-of-book recap ── */}
        <Text style={s.sectionTitle}>End-of-Book Recap</Text>
        <View style={{ gap: 10 }}>
          {RECAP.map(r => (
            <View key={r.label} style={s.recapCard}>
              <Text style={{ fontSize: 24 }}>{r.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.recapLabel}>{r.label}</Text>
                <Text style={s.recapValue}>{r.value}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, backgroundColor: C.bg },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: C.card, alignItems: "center", justifyContent: "center" },
  topTitle: { fontSize: 17, fontFamily: "Inter_700Bold", color: C.text },
  subtitle: { fontSize: 13, color: C.muted, textAlign: "center", marginBottom: 20, lineHeight: 18 },

  sectionTitle: { fontSize: 16, fontFamily: "Inter_700Bold", color: C.text, marginTop: 28, marginBottom: 12 },

  // Progress bar
  barTrack: { backgroundColor: C.border, borderRadius: 4, overflow: "hidden", width: "100%" },
  barFill: { borderRadius: 4 },

  // Tags
  tag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, borderWidth: 1, alignSelf: "flex-start", marginRight: 4 },
  tagTxt: { fontSize: 11, fontWeight: "600" },

  // Buddy card
  buddyCard: { backgroundColor: C.card, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: C.border, flexDirection: "row", gap: 12, marginBottom: 8 },
  bookCover: { width: 70, height: 104, backgroundColor: C.cardDeep, borderRadius: 8, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: C.primary+"40" },
  bookTitle: { fontSize: 14, fontWeight: "800", color: C.text, marginBottom: 2 },
  bookAuthor: { fontSize: 12, color: C.sub, marginBottom: 2 },
  bookGenre: { fontSize: 11, color: C.muted, marginBottom: 8 },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 4, marginBottom: 10 },
  progressLabelRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 5 },
  progressLabelTxt: { fontSize: 11, color: C.muted },
  goalTxt: { fontSize: 11, color: C.amber, marginTop: 5, marginBottom: 8 },
  joinBtn: { backgroundColor: C.primary, borderRadius: 10, paddingVertical: 9, alignItems: "center" },
  joinBtnTxt: { fontSize: 12, fontWeight: "700", color: "#fff" },

  // Reader cards
  readerCard: { backgroundColor: C.card, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: C.border, width: 116, gap: 4 },
  avatar: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", borderWidth: 1.5, marginBottom: 2 },
  avatarTxt: { fontSize: 14, fontWeight: "700" },
  readerName: { fontSize: 12, fontWeight: "700", color: C.text },
  readerStatus: { fontSize: 10, fontWeight: "600" },
  readerCh: { fontSize: 11, color: C.muted },
  readerFoot: { flexDirection: "row", justifyContent: "space-between", marginTop: 2 },
  readerSub: { fontSize: 11, color: C.muted },

  // Milestone
  milestone: { backgroundColor: C.card, borderRadius: 14, padding: 14, borderLeftWidth: 3, borderWidth: 1, borderColor: C.border },
  milestoneHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  milestoneLabelRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 2 },
  milestoneLabel: { fontSize: 10, fontWeight: "700", letterSpacing: 0.5, textTransform: "uppercase" },
  milestoneTitle: { fontSize: 14, fontWeight: "700", color: C.text },
  milestoneSub: { fontSize: 12, color: C.muted },
  milestoneRight: { alignItems: "flex-end", gap: 6 },
  deadlinePill: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  deadlineTxt: { fontSize: 11, fontWeight: "600" },
  chevron: { fontSize: 12, color: C.muted },
  chList: { marginTop: 14, gap: 10 },
  emptyMilestone: { padding: 12, backgroundColor: C.cardDeep, borderRadius: 10 },
  emptyTxt: { fontSize: 12, color: C.muted, textAlign: "center" },

  // Chapter row/card
  chRow: { flexDirection: "row", alignItems: "center", paddingVertical: 8 },
  chLocked: { backgroundColor: C.lockedBg, borderRadius: 10, padding: 10, borderWidth: 1, borderColor: C.lockedBorder },
  chCard: { backgroundColor: C.cardDeep, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: C.border+"80", gap: 8 },
  chTop: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  chDot: { width: 8, height: 8, borderRadius: 4, marginTop: 4 },
  chTitle: { fontSize: 12, fontWeight: "600", color: C.text, marginBottom: 4 },
  chHint: { fontSize: 11, color: C.lockedText },
  chBadges: { flexDirection: "row", flexWrap: "wrap", gap: 4 },
  chSocial: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chMeta: { fontSize: 11, color: C.muted },
  chActions: { flexDirection: "row", gap: 8 },
  chBtn: { flex: 1, paddingVertical: 7, borderRadius: 8, alignItems: "center" },
  chBtnOut: { borderWidth: 1, borderColor: C.border },
  chBtnTxt: { fontSize: 11, fontWeight: "700", color: "#fff" },

  // Discussion
  discCard: { backgroundColor: C.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.border },
  discTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  discTitle: { fontSize: 12, fontWeight: "700", color: C.text, flex: 1, marginRight: 8 },

  // Check-ins
  checkinCard: { backgroundColor: C.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.border, width: 146, alignItems: "center", gap: 6 },
  checkinPrompt: { fontSize: 12, fontWeight: "600", color: C.text, textAlign: "center" },
  checkinAction: { backgroundColor: C.primary+"22", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },

  // Reactions
  emoRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  emoBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, alignItems: "center", justifyContent: "center" },

  // Polls
  pollCard: { backgroundColor: C.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.border, gap: 8 },
  pollQ: { fontSize: 14, fontWeight: "700", color: C.text },
  pollOption: { backgroundColor: C.cardDeep, borderRadius: 10, padding: 10, borderWidth: 1, borderColor: C.border+"80", gap: 4 },
  pollRow: { flexDirection: "row", justifyContent: "space-between" },
  pollLabel: { fontSize: 13, color: C.sub, flex: 1 },
  pollPct: { fontSize: 13, fontWeight: "700", color: C.muted },

  // Recap
  recapCard: { backgroundColor: C.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.border, flexDirection: "row", gap: 12, alignItems: "flex-start" },
  recapLabel: { fontSize: 10, color: C.muted, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 3 },
  recapValue: { fontSize: 13, color: C.text, fontWeight: "500", lineHeight: 18 },
});
