import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from "react-native";

// ─── Palette ────────────────────────────────────────────────────────────────
const C = {
  bg:           "#120F1D",
  bgLayer:      "#160D26",
  card:         "#1B1628",
  cardHigh:     "#221B34",
  cardDeep:     "#251D38",
  border:       "#2E274A",
  borderFaint:  "#241E3A",
  primary:      "#9B72CF",
  primaryDim:   "#7A56B0",
  amber:        "#D4874A",
  gold:         "#D4A832",
  green:        "#52C97E",
  teal:         "#5CB8C8",
  red:          "#BF4D5E",
  text:         "#F0EEF8",
  textSub:      "#C4BFDA",
  muted:        "#7E7A9A",
  lockedBg:     "#191325",
  lockedText:   "#504C6B",
  lockedBorder: "#241E38",
};

// ─── Mock Data ───────────────────────────────────────────────────────────────
const BOOK = {
  title:       "The Midnight Library",
  author:      "Matt Haig",
  genre:       "Literary Fiction · 304 pages",
  progress:    68,
  currentGoal: "Finish Part 2 — Chapter 15",
  deadline:    "May 12",
  members:     8,
};

const READERS = [
  { id: 1, initials: "A",  name: "Aria",   chapter: 14, status: "reading",  streak: 5, pct: 72 },
  { id: 2, initials: "M",  name: "Marcus", chapter: 12, status: "behind",   streak: 2, pct: 58 },
  { id: 3, initials: "Z",  name: "Zoe",    chapter: 15, status: "finished", streak: 8, pct: 82 },
  { id: 4, initials: "K",  name: "Kai",    chapter: 13, status: "onpace",   streak: 4, pct: 65 },
  { id: 5, initials: "R",  name: "River",  chapter: 14, status: "reading",  streak: 3, pct: 70 },
  { id: 6, initials: "S",  name: "Sam",    chapter: 11, status: "behind",   streak: 1, pct: 52 },
];

type ChapterData = {
  id: number; title: string; status: string;
  comments: number; reactions: number; topEmoji: string;
  activeReaders: number; theories: number;
  locked: boolean; unlockedBy?: number;
  hot?: boolean; mostSaved?: boolean;
};

type Milestone = {
  id: number; label: string; title: string; chapters: string;
  deadline: string; done: boolean; data: ChapterData[];
};

const MILESTONES: Milestone[] = [
  {
    id: 1, label: "Milestone 1", title: "The Opening",
    chapters: "Chapters 1–5", deadline: "May 3", done: true,
    data: [
      { id: 1, title: "Between Life and Death", status: "finished", comments: 12, reactions: 28, topEmoji: "🤯", activeReaders: 0, theories: 8,  locked: false, hot: true },
      { id: 2, title: "The Librarian",           status: "finished", comments: 8,  reactions: 19, topEmoji: "💜", activeReaders: 0, theories: 5,  locked: false },
      { id: 3, title: "The Root Cause",           status: "finished", comments: 6,  reactions: 14, topEmoji: "😭", activeReaders: 0, theories: 4,  locked: false, mostSaved: true },
      { id: 4, title: "String Theory of Life",    status: "finished", comments: 9,  reactions: 22, topEmoji: "🔥", activeReaders: 0, theories: 7,  locked: false, hot: true },
      { id: 5, title: "The Possibilities",        status: "finished", comments: 7,  reactions: 11, topEmoji: "✨", activeReaders: 0, theories: 3,  locked: false },
    ],
  },
  {
    id: 2, label: "Milestone 2", title: "Descent into the Library",
    chapters: "Chapters 6–10", deadline: "May 8", done: false,
    data: [
      { id: 6,  title: "A Different Life",  status: "finished",   comments: 5, reactions: 16, topEmoji: "💫", activeReaders: 2, theories: 6, locked: false },
      { id: 7,  title: "The Second Chance", status: "reading",    comments: 3, reactions: 8,  topEmoji: "👀", activeReaders: 4, theories: 3, locked: false },
      { id: 8,  title: "Regret",            status: "not_started",comments: 0, reactions: 0,  topEmoji: "",   activeReaders: 0, theories: 0, locked: false },
      { id: 9,  title: "Another Version",   status: "locked",     comments: 0, reactions: 0,  topEmoji: "",   activeReaders: 0, theories: 0, locked: true, unlockedBy: 8 },
      { id: 10, title: "Sliding Doors",     status: "locked",     comments: 0, reactions: 0,  topEmoji: "",   activeReaders: 0, theories: 0, locked: true, unlockedBy: 9 },
    ],
  },
  {
    id: 3, label: "Milestone 3", title: "Life Unlived",
    chapters: "Chapters 11–15", deadline: "May 12", done: false,
    data: [
      { id: 11, title: "The Weight of Choice",    status: "locked", comments: 0, reactions: 0, topEmoji: "", activeReaders: 0, theories: 0, locked: true, unlockedBy: 10 },
      { id: 12, title: "Everything She Wanted",   status: "locked", comments: 0, reactions: 0, topEmoji: "", activeReaders: 0, theories: 0, locked: true, unlockedBy: 11 },
      { id: 13, title: "Olympic Dreams",          status: "locked", comments: 0, reactions: 0, topEmoji: "", activeReaders: 0, theories: 0, locked: true, unlockedBy: 12 },
      { id: 14, title: "The Letter",              status: "locked", comments: 0, reactions: 0, topEmoji: "", activeReaders: 0, theories: 0, locked: true, unlockedBy: 13 },
      { id: 15, title: "The Midnight Library",    status: "locked", comments: 0, reactions: 0, topEmoji: "", activeReaders: 0, theories: 0, locked: true, unlockedBy: 14 },
    ],
  },
  {
    id: 4, label: "Final Reflection", title: "The Ending",
    chapters: "Chapters 16–End", deadline: "May 17", done: false,
    data: [],
  },
];

const DISCUSSIONS = [
  { ch: 4, title: "String Theory of Life", unlocked: true,  reactions: 22, comments: 9,  emoji: "🔥" },
  { ch: 5, title: "The Possibilities",     unlocked: true,  reactions: 11, comments: 7,  emoji: "✨" },
  { ch: 6, title: "A Different Life",      unlocked: false, reactions: 0,  comments: 0,  emoji: "💫" },
];

const CHECKINS = [
  { id: 1, emoji: "💬", prompt: "Favorite quote so far?" },
  { id: 2, emoji: "🔮", prompt: "Biggest prediction?" },
  { id: 3, emoji: "⭐", prompt: "Rate this chapter" },
  { id: 4, emoji: "👁️",  prompt: "Who do you trust least?" },
];

const POLLS = [
  {
    id: 1,
    question: "Who is hiding something?",
    options: [
      { label: "The Librarian", pct: 42 },
      { label: "Mrs. Elm",      pct: 18 },
      { label: "Hugo",          pct: 27 },
      { label: "Nora herself",  pct: 13 },
    ],
  },
  {
    id: 2,
    question: "Was Nora telling the truth in Chapter 4?",
    options: [
      { label: "Yes, completely", pct: 31 },
      { label: "Half-truth",      pct: 45 },
      { label: "She was lying",   pct: 24 },
    ],
  },
];

const ROOM_FEATURES = [
  { emoji: "💬", label: "Live Discussion" },
  { emoji: "🔥", label: "Reactions" },
  { emoji: "🔮", label: "Predictions" },
  { emoji: "📌", label: "Quote Sharing" },
  { emoji: "📋", label: "Chapter Check-Ins" },
];

const RECAP = [
  { emoji: "🎯", label: "Most Accurate Prediction", value: "Zoe — \"Hugo is a parallel Nora\"" },
  { emoji: "💬", label: "Favorite Quote",            value: "\"Between life and death there is a library.\"" },
  { emoji: "🔥", label: "Most Reacted Chapter",      value: "Chapter 4 — 22 reactions" },
  { emoji: "⭐", label: "Group Average Rating",       value: "4.3 / 5.0 stars" },
  { emoji: "😂", label: "Funniest Reaction",          value: "Marcus: \"I quit my job after reading this\"" },
  { emoji: "💜", label: "Emotional Journey",          value: "😰 → 😮 → 😭 → 💫 → 💜" },
];

const QUICK_REACTIONS = ["💜", "👋", "🔥", "📚", "🤯", "😭", "👀"];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function statusColor(s: string): string {
  return s === "reading" ? C.teal : s === "onpace" ? C.green : s === "behind" ? C.red : s === "finished" ? C.gold : C.muted;
}
function statusLabel(s: string): string {
  return s === "reading" ? "Reading now" : s === "onpace" ? "On pace" : s === "behind" ? "Behind" : s === "finished" ? "Finished ✓" : s;
}
function chStatusColor(s: string): string {
  return s === "finished" ? C.green : s === "reading" ? C.teal : s === "not_started" ? C.muted : C.lockedText;
}
function chStatusLabel(s: string): string {
  return s === "finished" ? "Finished" : s === "reading" ? "Reading" : s === "not_started" ? "Not started" : "Locked";
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Bar({ pct, color, height = 6 }: { pct: number; color: string; height?: number }) {
  return (
    <View style={[s.barTrack, { height }]}>
      <View style={[s.barFill, { width: `${Math.min(100, pct)}%` as any, backgroundColor: color, height }]} />
    </View>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={s.sectionHeader}>
      <Text style={s.sectionTitle}>{title}</Text>
      {subtitle ? <Text style={s.sectionSub}>{subtitle}</Text> : null}
    </View>
  );
}

function Tag({ label, color }: { label: string; color: string }) {
  return (
    <View style={[s.tag, { backgroundColor: color + "22", borderColor: color + "55" }]}>
      <Text style={[s.tagText, { color }]}>{label}</Text>
    </View>
  );
}

function ReaderCard({ r }: { r: typeof READERS[0] }) {
  const col = statusColor(r.status);
  return (
    <View style={s.readerCard}>
      <View style={[s.avatar, { backgroundColor: col + "30", borderColor: col + "80" }]}>
        <Text style={[s.avatarText, { color: col }]}>{r.initials}</Text>
      </View>
      <Text style={s.readerName}>{r.name}</Text>
      <Text style={[s.readerStatus, { color: col }]}>{statusLabel(r.status)}</Text>
      <Text style={s.readerCh}>Ch. {r.chapter}</Text>
      <Bar pct={r.pct} color={col} height={3} />
      <View style={s.readerBottom}>
        <Text style={s.streakText}>🔥 {r.streak}</Text>
        <Text style={s.pctText}>{r.pct}%</Text>
      </View>
    </View>
  );
}

function ChapterRow({ ch, onPress }: { ch: ChapterData; onPress: () => void }) {
  if (ch.locked) {
    return (
      <View style={[s.chRow, s.chRowLocked]}>
        <View style={s.chLeft}>
          <Text style={s.lockIcon}>🔒</Text>
          <View>
            <Text style={[s.chTitle, { color: C.lockedText }]}>Ch. {ch.id} — {ch.title}</Text>
            <Text style={s.chLockHint}>Finish Ch. {ch.unlockedBy} to unlock</Text>
          </View>
        </View>
      </View>
    );
  }

  const finished = ch.status === "finished";
  const reading  = ch.status === "reading";
  const col = chStatusColor(ch.status);

  return (
    <View style={s.chCard}>
      <View style={s.chCardTop}>
        <View style={s.chLeft}>
          <View style={[s.chDot, { backgroundColor: col }]} />
          <View style={{ flex: 1 }}>
            <Text style={s.chTitle}>Ch. {ch.id} — {ch.title}</Text>
            <View style={s.chBadgeRow}>
              <Tag label={chStatusLabel(ch.status)} color={col} />
              {ch.hot       && <Tag label="🔥 Most reacted"   color={C.amber} />}
              {ch.mostSaved && <Tag label="📌 Most saved quote" color={C.primary} />}
            </View>
          </View>
        </View>
      </View>

      {(finished || reading) && (
        <View style={s.chSocial}>
          {ch.activeReaders > 0 && (
            <Text style={s.chSocialItem}>👤 {ch.activeReaders} reading now</Text>
          )}
          {ch.theories > 0 && (
            <Text style={s.chSocialItem}>🔮 {ch.theories} theories</Text>
          )}
          {ch.reactions > 0 && (
            <Text style={s.chSocialItem}>{ch.topEmoji} {ch.reactions} reactions</Text>
          )}
          {ch.comments > 0 && (
            <Text style={s.chSocialItem}>💬 {ch.comments} comments</Text>
          )}
        </View>
      )}

      <View style={s.chActions}>
        {ch.status === "not_started" && (
          <Pressable style={[s.chBtn, { backgroundColor: C.primary }]} onPress={onPress}>
            <Text style={s.chBtnText}>Start Chapter</Text>
          </Pressable>
        )}
        {ch.status === "reading" && (
          <>
            <Pressable style={[s.chBtn, { backgroundColor: C.green }]} onPress={onPress}>
              <Text style={s.chBtnText}>Mark Finished</Text>
            </Pressable>
            <Pressable style={[s.chBtn, s.chBtnOutline]} onPress={onPress}>
              <Text style={[s.chBtnText, { color: C.teal }]}>Open Discussion</Text>
            </Pressable>
          </>
        )}
        {ch.status === "finished" && (
          <Pressable style={[s.chBtn, s.chBtnOutline]} onPress={onPress}>
            <Text style={[s.chBtnText, { color: C.primary }]}>Open Discussion</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

function MilestoneSection({ m, expanded, onToggle }: {
  m: Milestone; expanded: boolean; onToggle: () => void;
}) {
  const allDone = m.done;
  const borderCol = allDone ? C.green : m.id === 4 ? C.muted : C.primary;

  return (
    <View style={[s.milestoneCard, { borderLeftColor: borderCol }]}>
      <Pressable style={s.milestoneHeader} onPress={onToggle}>
        <View style={s.milestoneHeaderLeft}>
          <View style={s.milestoneLabelRow}>
            <Text style={[s.milestoneLabel, { color: borderCol }]}>{m.label}</Text>
            {allDone && <Tag label="Complete ✓" color={C.green} />}
          </View>
          <Text style={s.milestoneTitle}>{m.title}</Text>
          <Text style={s.milestoneSub}>{m.chapters}</Text>
        </View>
        <View style={s.milestoneRight}>
          <View style={[s.deadlinePill, { borderColor: borderCol + "60" }]}>
            <Text style={[s.deadlineText, { color: borderCol }]}>📅 {m.deadline}</Text>
          </View>
          <Text style={s.chevron}>{expanded ? "▲" : "▼"}</Text>
        </View>
      </Pressable>

      {expanded && m.data.length > 0 && (
        <View style={s.chapterList}>
          {m.data.map((ch) => (
            <ChapterRow key={ch.id} ch={ch} onPress={() => {}} />
          ))}
        </View>
      )}

      {expanded && m.data.length === 0 && (
        <View style={s.emptyMilestone}>
          <Text style={s.emptyText}>📖 Chapters revealed when Milestone 3 is complete.</Text>
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
        const isVoted = voted === i;
        const showBar = voted !== null;
        return (
          <Pressable key={i} style={s.pollOption} onPress={() => setVoted(i)}>
            <View style={s.pollRow}>
              <Text style={[s.pollLabel, isVoted && { color: C.primary }]}>{o.label}</Text>
              {showBar && <Text style={[s.pollPct, isVoted && { color: C.primary }]}>{o.pct}%</Text>}
            </View>
            {showBar && (
              <View style={[s.barTrack, { height: 4, marginTop: 4 }]}>
                <View style={[s.barFill, {
                  width: `${o.pct}%` as any,
                  height: 4,
                  backgroundColor: isVoted ? C.primary : C.primaryDim + "80",
                }]} />
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
function BuddyReadsScreen() {
  const [expanded, setExpanded] = useState<Set<number>>(new Set([2]));
  const [reactions, setReactions] = useState<Record<string, boolean>>({});

  function toggleMilestone(id: number) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleReaction(emoji: string) {
    setReactions((prev) => ({ ...prev, [emoji]: !prev[emoji] }));
  }

  return (
    <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>

      {/* ── 1. Header ───────────────────────────────────────── */}
      <View style={s.header}>
        <Text style={s.appName}>TROPELY</Text>
        <Text style={s.pageTitle}>Buddy Reads</Text>
        <Text style={s.pageSubtitle}>Read together, react together, finish together.</Text>
      </View>

      {/* ── 2. Current Buddy Read Card ───────────────────────── */}
      <View style={s.buddyCard}>
        <View style={s.bookCoverPlaceholder}>
          <Text style={s.bookCoverEmoji}>📖</Text>
        </View>
        <View style={s.bookInfo}>
          <Text style={s.bookTitle}>{BOOK.title}</Text>
          <Text style={s.bookAuthor}>{BOOK.author}</Text>
          <Text style={s.bookGenre}>{BOOK.genre}</Text>

          <View style={s.bookMeta}>
            <Tag label={`👥 ${BOOK.members} readers`} color={C.primary} />
            <Tag label={`📅 Due ${BOOK.deadline}`}    color={C.amber} />
          </View>

          <View style={s.progressSection}>
            <View style={s.progressLabel}>
              <Text style={s.progressText}>Group progress</Text>
              <Text style={[s.progressText, { color: C.primary, fontWeight: "700" }]}>{BOOK.progress}%</Text>
            </View>
            <Bar pct={BOOK.progress} color={C.primary} height={8} />
            <Text style={s.goalText}>🎯 {BOOK.currentGoal}</Text>
          </View>

          <Pressable style={s.joinBtn}>
            <Text style={s.joinBtnText}>Join Reading Room →</Text>
          </Pressable>
        </View>
      </View>

      {/* ── 3. Active Readers ────────────────────────────────── */}
      <SectionHeader title="Active Readers" subtitle={`${READERS.filter(r => r.status === "reading").length} reading right now`} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.readersScroll} contentContainerStyle={s.readersContent}>
        {READERS.map((r) => <ReaderCard key={r.id} r={r} />)}
      </ScrollView>

      {/* ── 4 + 5. Milestone-Based Chapters ─────────────────── */}
      <SectionHeader title="Reading Milestones" subtitle="Spoiler-safe chapter progression" />
      <View style={s.milestoneList}>
        {MILESTONES.map((m) => (
          <MilestoneSection
            key={m.id}
            m={m}
            expanded={expanded.has(m.id)}
            onToggle={() => toggleMilestone(m.id)}
          />
        ))}
      </View>

      {/* ── 6. Spoiler-Safe Discussion Preview ───────────────── */}
      <SectionHeader title="Chapter Discussions" subtitle="Spoiler-safe rooms per chapter" />
      <View style={s.cardGroup}>
        {DISCUSSIONS.map((d) => (
          <Pressable
            key={d.ch}
            style={[s.discussionCard, !d.unlocked && s.discussionLocked]}
            disabled={!d.unlocked}
          >
            <View style={s.discussionTop}>
              <Text style={[s.discussionTitle, !d.unlocked && { color: C.lockedText }]}>
                {d.emoji} Ch. {d.ch} — {d.title}
              </Text>
              {d.unlocked
                ? <Tag label="Unlocked" color={C.green} />
                : <Tag label="🔒 Locked" color={C.lockedText} />}
            </View>
            {d.unlocked ? (
              <View style={s.discussionMeta}>
                <Text style={s.chSocialItem}>🔥 {d.reactions} reactions</Text>
                <Text style={s.chSocialItem}>💬 {d.comments} comments</Text>
                <Text style={[s.chSocialItem, { color: C.primary }]}>Open →</Text>
              </View>
            ) : (
              <Text style={s.chLockHint}>Finish the chapter to unlock the room</Text>
            )}
          </Pressable>
        ))}
      </View>

      {/* ── 7. Chapter Check-Ins ─────────────────────────────── */}
      <SectionHeader title="Chapter Check-Ins" subtitle="Leave your mark after each chapter" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.readersScroll} contentContainerStyle={s.readersContent}>
        {CHECKINS.map((c) => (
          <Pressable key={c.id} style={s.checkinCard}>
            <Text style={s.checkinEmoji}>{c.emoji}</Text>
            <Text style={s.checkinPrompt}>{c.prompt}</Text>
            <View style={s.checkinAction}>
              <Text style={s.checkinActionText}>Tap to respond</Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>

      {/* ── 8. Quick Reactions ───────────────────────────────── */}
      <SectionHeader title="Quick Reactions" subtitle="How are you feeling about the book?" />
      <View style={s.reactionRow}>
        {QUICK_REACTIONS.map((emoji) => {
          const active = reactions[emoji];
          return (
            <Pressable
              key={emoji}
              style={[s.reactionBtn, active && { backgroundColor: C.primary + "30", borderColor: C.primary }]}
              onPress={() => toggleReaction(emoji)}
            >
              <Text style={s.reactionEmoji}>{emoji}</Text>
            </Pressable>
          );
        })}
      </View>

      {/* ── 9. Predictions & Polls ───────────────────────────── */}
      <SectionHeader title="Predictions & Polls" subtitle="Vote — results revealed after the chapter" />
      <View style={s.cardGroup}>
        {POLLS.map((poll) => <PollCard key={poll.id} poll={poll} />)}
      </View>

      {/* ── 10. Reading Room Preview ─────────────────────────── */}
      <SectionHeader title="Inside the Reading Room" subtitle="Everything that unlocks per chapter" />
      <View style={s.roomCard}>
        <Text style={s.roomIntro}>Tap any unlocked chapter to enter its room:</Text>
        <View style={s.roomFeatures}>
          {ROOM_FEATURES.map((f) => (
            <View key={f.label} style={s.roomFeature}>
              <Text style={s.roomFeatureEmoji}>{f.emoji}</Text>
              <Text style={s.roomFeatureLabel}>{f.label}</Text>
            </View>
          ))}
        </View>
        <Pressable style={[s.joinBtn, { marginTop: 16 }]}>
          <Text style={s.joinBtnText}>Enter Chapter 7 Room →</Text>
        </Pressable>
      </View>

      {/* ── 11. End-of-Book Recap ────────────────────────────── */}
      <SectionHeader title="End-of-Book Recap" subtitle="Unlocks when the group finishes" />
      <View style={[s.cardGroup, s.recapGroup]}>
        {RECAP.map((r) => (
          <View key={r.label} style={s.recapCard}>
            <Text style={s.recapEmoji}>{r.emoji}</Text>
            <View style={s.recapText}>
              <Text style={s.recapLabel}>{r.label}</Text>
              <Text style={s.recapValue}>{r.value}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// ─── Root App ─────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <BuddyReadsScreen />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe:            { flex: 1, backgroundColor: C.bg },
  scroll:          { flex: 1, backgroundColor: C.bg },
  scrollContent:   { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24 },

  // Header
  header:          { paddingVertical: 20, alignItems: "center" },
  appName:         { fontSize: 11, letterSpacing: 4, color: C.primary, fontWeight: "700", marginBottom: 4 },
  pageTitle:       { fontSize: 26, fontWeight: "800", color: C.text, marginBottom: 4 },
  pageSubtitle:    { fontSize: 13, color: C.muted, textAlign: "center", lineHeight: 18 },

  // Section headers
  sectionHeader:   { marginTop: 28, marginBottom: 12 },
  sectionTitle:    { fontSize: 17, fontWeight: "700", color: C.text },
  sectionSub:      { fontSize: 12, color: C.muted, marginTop: 2 },

  // Tag pill
  tag:             { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, borderWidth: 1, alignSelf: "flex-start", marginRight: 4 },
  tagText:         { fontSize: 11, fontWeight: "600" },

  // Progress bar
  barTrack:        { backgroundColor: C.border, borderRadius: 4, overflow: "hidden", width: "100%" },
  barFill:         { borderRadius: 4 },

  // Buddy read card
  buddyCard:       { backgroundColor: C.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.border, flexDirection: "row", gap: 14 },
  bookCoverPlaceholder: { width: 72, height: 106, backgroundColor: C.cardDeep, borderRadius: 8, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: C.primary + "40" },
  bookCoverEmoji:  { fontSize: 30 },
  bookInfo:        { flex: 1 },
  bookTitle:       { fontSize: 15, fontWeight: "800", color: C.text, marginBottom: 2 },
  bookAuthor:      { fontSize: 13, color: C.textSub, marginBottom: 2 },
  bookGenre:       { fontSize: 11, color: C.muted, marginBottom: 8 },
  bookMeta:        { flexDirection: "row", flexWrap: "wrap", gap: 4, marginBottom: 10 },
  progressSection: { marginBottom: 10 },
  progressLabel:   { flexDirection: "row", justifyContent: "space-between", marginBottom: 5 },
  progressText:    { fontSize: 12, color: C.muted },
  goalText:        { fontSize: 11, color: C.amber, marginTop: 5 },
  joinBtn:         { backgroundColor: C.primary, borderRadius: 10, paddingVertical: 10, alignItems: "center" },
  joinBtnText:     { fontSize: 13, fontWeight: "700", color: "#fff" },

  // Readers strip
  readersScroll:   { marginHorizontal: -16 },
  readersContent:  { paddingHorizontal: 16, gap: 10, paddingBottom: 4 },
  readerCard:      { backgroundColor: C.card, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: C.border, width: 118, gap: 4 },
  avatar:          { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", borderWidth: 1.5, marginBottom: 2 },
  avatarText:      { fontSize: 14, fontWeight: "700" },
  readerName:      { fontSize: 13, fontWeight: "700", color: C.text },
  readerStatus:    { fontSize: 10, fontWeight: "600" },
  readerCh:        { fontSize: 11, color: C.muted },
  readerBottom:    { flexDirection: "row", justifyContent: "space-between", marginTop: 3 },
  streakText:      { fontSize: 11, color: C.gold },
  pctText:         { fontSize: 11, color: C.muted },

  // Milestone
  milestoneList:   { gap: 10 },
  milestoneCard:   { backgroundColor: C.card, borderRadius: 14, padding: 14, borderLeftWidth: 3, borderWidth: 1, borderColor: C.border },
  milestoneHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  milestoneHeaderLeft: { flex: 1, gap: 2 },
  milestoneLabelRow:   { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 2 },
  milestoneLabel:  { fontSize: 11, fontWeight: "700", letterSpacing: 0.5, textTransform: "uppercase" },
  milestoneTitle:  { fontSize: 15, fontWeight: "700", color: C.text },
  milestoneSub:    { fontSize: 12, color: C.muted },
  milestoneRight:  { alignItems: "flex-end", gap: 6 },
  deadlinePill:    { borderWidth: 1, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  deadlineText:    { fontSize: 11, fontWeight: "600" },
  chevron:         { fontSize: 12, color: C.muted, marginTop: 4 },
  chapterList:     { marginTop: 14, gap: 10 },
  emptyMilestone:  { marginTop: 14, padding: 14, backgroundColor: C.cardDeep, borderRadius: 10 },
  emptyText:       { fontSize: 12, color: C.muted, textAlign: "center" },

  // Chapter card
  chCard:          { backgroundColor: C.cardDeep, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: C.borderFaint, gap: 8 },
  chRow:           { flexDirection: "row", alignItems: "center", paddingVertical: 8 },
  chRowLocked:     { backgroundColor: C.lockedBg, borderRadius: 10, padding: 10, borderWidth: 1, borderColor: C.lockedBorder },
  chCardTop:       { flexDirection: "row", alignItems: "flex-start" },
  chLeft:          { flex: 1, flexDirection: "row", alignItems: "flex-start", gap: 10 },
  chDot:           { width: 8, height: 8, borderRadius: 4, marginTop: 5 },
  lockIcon:        { fontSize: 14, marginRight: 8 },
  chTitle:         { fontSize: 13, fontWeight: "600", color: C.text, marginBottom: 5 },
  chLockHint:      { fontSize: 11, color: C.lockedText, marginTop: 2 },
  chBadgeRow:      { flexDirection: "row", flexWrap: "wrap", gap: 4 },
  chSocial:        { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chSocialItem:    { fontSize: 11, color: C.muted },
  chActions:       { flexDirection: "row", gap: 8 },
  chBtn:           { flex: 1, paddingVertical: 7, borderRadius: 8, alignItems: "center" },
  chBtnOutline:    { borderWidth: 1, borderColor: C.border },
  chBtnText:       { fontSize: 12, fontWeight: "700", color: "#fff" },

  // Discussion cards
  cardGroup:       { gap: 10 },
  discussionCard:  { backgroundColor: C.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.border },
  discussionLocked:{ opacity: 0.55 },
  discussionTop:   { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  discussionTitle: { fontSize: 13, fontWeight: "700", color: C.text, flex: 1, marginRight: 8 },
  discussionMeta:  { flexDirection: "row", gap: 12 },

  // Check-ins
  checkinCard:     { backgroundColor: C.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.border, width: 148, alignItems: "center", gap: 6 },
  checkinEmoji:    { fontSize: 26 },
  checkinPrompt:   { fontSize: 12, fontWeight: "600", color: C.text, textAlign: "center" },
  checkinAction:   { backgroundColor: C.primary + "22", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, marginTop: 4 },
  checkinActionText:{ fontSize: 11, color: C.primary, fontWeight: "600" },

  // Reactions
  reactionRow:     { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  reactionBtn:     { width: 48, height: 48, borderRadius: 24, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, alignItems: "center", justifyContent: "center" },
  reactionEmoji:   { fontSize: 22 },

  // Polls
  pollCard:        { backgroundColor: C.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.border, gap: 10 },
  pollQ:           { fontSize: 14, fontWeight: "700", color: C.text },
  pollOption:      { backgroundColor: C.cardDeep, borderRadius: 10, padding: 10, borderWidth: 1, borderColor: C.borderFaint },
  pollRow:         { flexDirection: "row", justifyContent: "space-between" },
  pollLabel:       { fontSize: 13, color: C.textSub, flex: 1 },
  pollPct:         { fontSize: 13, fontWeight: "700", color: C.muted },

  // Room preview
  roomCard:        { backgroundColor: C.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.border },
  roomIntro:       { fontSize: 13, color: C.muted, marginBottom: 14 },
  roomFeatures:    { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  roomFeature:     { backgroundColor: C.cardDeep, borderRadius: 10, padding: 10, alignItems: "center", gap: 4, minWidth: 80, flex: 1 },
  roomFeatureEmoji:{ fontSize: 20 },
  roomFeatureLabel:{ fontSize: 11, color: C.textSub, textAlign: "center", fontWeight: "600" },

  // Recap
  recapGroup:      { gap: 10 },
  recapCard:       { backgroundColor: C.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.border, flexDirection: "row", alignItems: "flex-start", gap: 12 },
  recapEmoji:      { fontSize: 24, marginTop: 1 },
  recapText:       { flex: 1 },
  recapLabel:      { fontSize: 11, color: C.muted, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 3 },
  recapValue:      { fontSize: 13, color: C.text, fontWeight: "500", lineHeight: 18 },
});
