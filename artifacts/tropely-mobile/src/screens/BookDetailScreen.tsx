import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  TextInput,
  Alert,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/navigation";
import { useStore, type Shelf, type Mood } from "@/store";
import { usePremium } from "@/hooks/usePremium";
import { FREE_LIMITS } from "@/constants/premiumFeatures";
import { TROPES_BY_GENRE, GENRE_ORDER, type TropeGenre } from "@/constants/tropes";
import { trackEvent } from "@/lib/analytics";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, "BookDetail">;

const SHELVES: { key: Shelf; label: string }[] = [
  { key: "reading", label: "Reading" },
  { key: "want", label: "Want to read" },
  { key: "finished", label: "Finished" },
  { key: "paused", label: "Paused" },
  { key: "dnf", label: "DNF" },
];

const MOODS: { key: Mood; label: string; emoji: string }[] = [
  { key: "hopeful", label: "Hopeful", emoji: "🌱" },
  { key: "tense", label: "Tense", emoji: "⚡" },
  { key: "melancholy", label: "Melancholy", emoji: "🌧" },
  { key: "joyful", label: "Joyful", emoji: "☀️" },
  { key: "romantic", label: "Romantic", emoji: "🌹" },
  { key: "eerie", label: "Eerie", emoji: "🌑" },
  { key: "reflective", label: "Reflective", emoji: "🪞" },
  { key: "adventurous", label: "Adventurous", emoji: "🧭" },
  { key: "cozy", label: "Cozy", emoji: "🕯️" },
  { key: "intense", label: "Intense", emoji: "🔥" },
];

const MOOD_COLORS: Record<string, string> = {
  hopeful: "#d1fae5", tense: "#fee2e2", melancholy: "#e0e7ff",
  joyful: "#fef9c3", romantic: "#fce7f3", eerie: "#f3e8ff",
  reflective: "#f0fdf4", adventurous: "#fff7ed", cozy: "#fef3c7", intense: "#fee2e2",
};

type DetailTab = "details" | "sessions" | "highlights";

export default function BookDetailScreen() {
  const nav = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { bookId } = route.params;
  const {
    books, sessions, reflections, highlights,
    updateBook, moveToShelf, addSession, setReflection, removeBook,
    addHighlight, deleteHighlight,
  } = useStore();
  const { isPremium } = usePremium();

  const book = books.find((b) => b.id === bookId);
  const bookSessions = sessions.filter((s) => s.bookId === bookId);
  const reflection = reflections.find((r) => r.bookId === bookId);
  const bookHighlights = highlights.filter((h) => h.bookId === bookId);

  const isAudio = book?.consumption === "listen";
  const total = isAudio ? (book?.audioMinutes ?? book?.pages ?? 0) : (book?.pages ?? 0);
  const moodBg = book?.mood ? (MOOD_COLORS[book.mood] ?? "#f5f0ea") : "#f5f0ea";

  const [activeTab, setActiveTab] = useState<DetailTab>("details");
  const [progressInput, setProgressInput] = useState(book?.progress?.toString() ?? "");

  const [showSessionModal, setShowSessionModal] = useState(false);
  const [logPages, setLogPages] = useState("");
  const [logMinutes, setLogMinutes] = useState("");
  const [logMood, setLogMood] = useState<Mood | null>(null);
  const [logNote, setLogNote] = useState("");

  const [showShelfModal, setShowShelfModal] = useState(false);
  const [showMoodModal, setShowMoodModal] = useState(false);

  const [reflectionText, setReflectionText] = useState(reflection?.text ?? "");
  const [rating, setRating] = useState(reflection?.rating ?? 0);
  const [tropeGenre, setTropeGenre] = useState<TropeGenre>(GENRE_ORDER[0]);

  const [showHighlightForm, setShowHighlightForm] = useState(false);
  const [hlText, setHlText] = useState("");
  const [hlTrope, setHlTrope] = useState("");
  const [hlMood, setHlMood] = useState<Mood | null>(null);
  const [hlPage, setHlPage] = useState("");

  if (!book) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.notFound}>Book not found.</Text>
      </SafeAreaView>
    );
  }

  const bookTropes = book.tropes ?? [];
  const canAddHighlight = isPremium || bookHighlights.length < FREE_LIMITS.HIGHLIGHTS;
  const currentShelf = SHELVES.find((s) => s.key === book.shelf);
  const currentMood = MOODS.find((m) => m.key === book.mood);
  const pct = total > 0 ? Math.min(100, (book.progress / total) * 100) : 0;

  const saveProgress = () => {
    const n = parseInt(progressInput, 10);
    if (!isNaN(n) && n >= 0 && n <= total) updateBook(bookId, { progress: n });
  };

  const logSession = () => {
    const from = book.progress;
    const to = parseInt(logPages, 10);
    if (isNaN(to) || to <= from) {
      Alert.alert("Invalid pages", "End page must be greater than current progress.");
      return;
    }
    addSession({
      bookId,
      date: new Date().toISOString(),
      fromPage: from,
      toPage: to,
      minutes: logMinutes ? parseInt(logMinutes, 10) : undefined,
      mood: logMood ?? undefined,
    });
    updateBook(bookId, { progress: to });
    setProgressInput(to.toString());
    setLogPages("");
    setLogMinutes("");
    setLogMood(null);
    setLogNote("");
    setShowSessionModal(false);
    trackEvent("Session Logged", { bookId, pages: to - from });
  };

  const saveReflection = () => {
    setReflection(bookId, reflectionText, rating || undefined);
    trackEvent("Reflection Saved", { bookId, rating });
    Alert.alert("Saved", "Your reflection has been saved.");
  };

  const saveHighlight = () => {
    if (!hlText.trim()) return;
    addHighlight({
      bookId,
      text: hlText.trim(),
      trope: hlTrope.trim() || undefined,
      mood: hlMood ?? undefined,
      page: hlPage ? parseInt(hlPage, 10) : undefined,
      date: new Date().toISOString(),
    });
    trackEvent("Highlight Added", { bookId, hasTrope: !!hlTrope });
    setHlText(""); setHlTrope(""); setHlMood(null); setHlPage("");
    setShowHighlightForm(false);
  };

  const toggleTrope = (trope: string) => {
    const active = bookTropes.includes(trope);
    if (!active && bookTropes.length >= 10) return;
    const next = active ? bookTropes.filter((t) => t !== trope) : [...bookTropes, trope];
    updateBook(bookId, { tropes: next });
    if (!active) trackEvent("Trope Tagged", { trope, bookId });
  };

  const removeTrope = (trope: string) => {
    updateBook(bookId, { tropes: bookTropes.filter((t) => t !== trope) });
  };

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      {/* Mood-tinted hero */}
      <View style={[styles.hero, { backgroundColor: moodBg }]}>
        <View style={styles.heroContent}>
          {book.cover ? (
            <Image source={{ uri: book.cover }} style={styles.cover} />
          ) : (
            <View style={[styles.cover, styles.coverPlaceholder]}>
              <Text style={styles.coverInitial}>{book.title[0]}</Text>
            </View>
          )}
          <View style={styles.heroInfo}>
            <Text style={styles.bookTitle}>{book.title}</Text>
            <Text style={styles.bookAuthor}>{book.author}</Text>
            {isAudio ? (
              <Text style={styles.bookMeta}>🎧 Audiobook{book.audioMinutes ? ` · ${book.audioMinutes} min` : ""}</Text>
            ) : (
              <Text style={styles.bookMeta}>{book.pages} pages</Text>
            )}
            {book.narrator && <Text style={styles.bookMeta}>Narrated by {book.narrator}</Text>}
            {book.translator && <Text style={styles.bookMeta}>Translated by {book.translator}</Text>}
            <View style={styles.heroActions}>
              <TouchableOpacity style={styles.heroPill} onPress={() => setShowShelfModal(true)}>
                <Text style={styles.heroPillText}>{currentShelf?.label ?? "No shelf"}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.heroPill} onPress={() => setShowMoodModal(true)}>
                <Text style={styles.heroPillText}>
                  {currentMood ? `${currentMood.emoji} ${currentMood.label}` : "Set mood"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        {book.shelf === "reading" && (
          <View style={styles.heroProgress}>
            <View style={styles.heroProgressTrack}>
              <View style={[styles.heroProgressBar, { width: `${pct}%` }]} />
            </View>
            <Text style={styles.heroProgressText}>
              {isAudio ? `${book.progress} / ${total} min` : `Page ${book.progress} of ${book.pages}`}
            </Text>
          </View>
        )}
      </View>

      {/* Tab bar */}
      <View style={styles.tabs}>
        {(["details", "sessions", "highlights"] as DetailTab[]).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, activeTab === t && styles.tabActive]}
            onPress={() => setActiveTab(t)}
          >
            <Text style={[styles.tabText, activeTab === t && styles.tabTextActive]}>
              {t === "details" ? "Details" : t === "sessions" ? `Sessions (${bookSessions.length})` : `Highlights (${bookHighlights.length})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Details tab ── */}
      {activeTab === "details" && (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Progress</Text>
            <View style={styles.row}>
              <TextInput
                style={styles.input}
                value={progressInput}
                onChangeText={setProgressInput}
                keyboardType="number-pad"
                placeholder={isAudio ? "Minutes listened" : "Current page"}
              />
              <TouchableOpacity style={styles.saveBtn} onPress={saveProgress}>
                <Text style={styles.saveBtnText}>Update</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.logSessionBtn} onPress={() => setShowSessionModal(true)}>
              <Text style={styles.logSessionBtnText}>+ Log reading session</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.companionBtn} onPress={() => nav.navigate("Companion", { bookId })}>
            <Text style={styles.companionBtnText}>✨ Open AI Companion</Text>
          </TouchableOpacity>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Reflection</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((n) => (
                <TouchableOpacity key={n} onPress={() => setRating(rating === n ? 0 : n)}>
                  <Text style={[styles.star, n <= rating && styles.starFilled]}>★</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={styles.textArea}
              value={reflectionText}
              onChangeText={setReflectionText}
              placeholder="What did this book mean to you?"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <TouchableOpacity style={styles.saveBtn} onPress={saveReflection}>
              <Text style={styles.saveBtnText}>Save reflection</Text>
            </TouchableOpacity>
          </View>

          {bookTropes.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Tagged tropes</Text>
              <Text style={styles.cardSub}>Long-press a trope to remove it.</Text>
              <View style={styles.tropeChips}>
                {bookTropes.map((trope) => (
                  <TouchableOpacity
                    key={trope}
                    style={styles.tropeChipTagged}
                    onLongPress={() => removeTrope(trope)}
                    delayLongPress={400}
                  >
                    <Text style={styles.tropeChipTaggedText}>{trope}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Add tropes</Text>
              {bookTropes.length > 0 && (
                <Text style={styles.tropeCountBadge}>{bookTropes.length}/10</Text>
              )}
            </View>
            <Text style={styles.cardSub}>Tap to tag (max 10). Long-press a tagged trope to remove it.</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {GENRE_ORDER.map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[styles.genreTab, tropeGenre === g && styles.genreTabActive]}
                  onPress={() => setTropeGenre(g)}
                >
                  <Text style={[styles.genreTabText, tropeGenre === g && styles.genreTabTextActive]}>{g}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={styles.tropeChips}>
              {TROPES_BY_GENRE[tropeGenre].map((trope) => {
                const active = bookTropes.includes(trope);
                const locked = !active && bookTropes.length >= 10;
                return (
                  <TouchableOpacity
                    key={trope}
                    style={[styles.tropeChip, active && styles.tropeChipActive, locked && styles.tropeChipLocked]}
                    onPress={() => !locked && toggleTrope(trope)}
                    onLongPress={() => active && removeTrope(trope)}
                    delayLongPress={400}
                    activeOpacity={locked ? 1 : 0.7}
                  >
                    <Text style={[styles.tropeChipText, active && styles.tropeChipTextActive]}>{trope}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <TouchableOpacity
            style={styles.removeBtn}
            onPress={() =>
              Alert.alert("Remove book?", "This will delete all sessions and journal entries for this book.", [
                { text: "Cancel", style: "cancel" },
                { text: "Remove", style: "destructive", onPress: () => { removeBook(bookId); nav.goBack(); } },
              ])
            }
          >
            <Text style={styles.removeBtnText}>Remove from library</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* ── Sessions tab ── */}
      {activeTab === "sessions" && (
        <View style={{ flex: 1 }}>
          <View style={styles.tabPaneHeader}>
            <Text style={styles.tabPaneTitle}>Reading sessions</Text>
            <TouchableOpacity style={styles.tabPaneBtn} onPress={() => setShowSessionModal(true)}>
              <Text style={styles.tabPaneBtnText}>+ Log</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.scroll} contentContainerStyle={styles.tabPaneContent}>
            {bookSessions.length === 0 ? (
              <View style={styles.paneEmpty}>
                <Text style={styles.paneEmptyEmoji}>📖</Text>
                <Text style={styles.paneEmptyTitle}>No sessions yet</Text>
                <Text style={styles.paneEmptyHint}>Log your first reading session to start tracking.</Text>
                <TouchableOpacity style={styles.paneEmptyBtn} onPress={() => setShowSessionModal(true)}>
                  <Text style={styles.paneEmptyBtnText}>Log a session</Text>
                </TouchableOpacity>
              </View>
            ) : (
              [...bookSessions].reverse().map((s) => (
                <View key={s.id} style={styles.sessionCard}>
                  <View style={styles.sessionCardTop}>
                    <Text style={styles.sessionCardDate}>
                      {new Date(s.date).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
                    </Text>
                    {s.mood && <Text style={styles.sessionCardMood}>{MOODS.find((m) => m.key === s.mood)?.emoji}</Text>}
                  </View>
                  <Text style={styles.sessionCardPages}>
                    {isAudio ? `${s.fromPage}–${s.toPage} min` : `Pages ${s.fromPage}–${s.toPage}`}
                    {s.minutes ? ` · ${s.minutes} min read` : ""}
                    {` · ${s.toPage - s.fromPage} ${isAudio ? "min" : "pages"}`}
                  </Text>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      )}

      {/* ── Highlights tab ── */}
      {activeTab === "highlights" && (
        <View style={{ flex: 1 }}>
          <View style={styles.tabPaneHeader}>
            <Text style={styles.tabPaneTitle}>Highlights & quotes</Text>
            {canAddHighlight ? (
              <TouchableOpacity style={styles.tabPaneBtn} onPress={() => setShowHighlightForm(true)}>
                <Text style={styles.tabPaneBtnText}>+ Add</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.lockBadge}>
                <Text style={styles.lockBadgeText}>✨ Premium to add more</Text>
              </View>
            )}
          </View>
          {!isPremium && bookHighlights.length >= FREE_LIMITS.HIGHLIGHTS && (
            <View style={styles.limitBanner}>
              <Text style={styles.limitBannerText}>
                Free plan limit reached ({FREE_LIMITS.HIGHLIGHTS} highlights). Upgrade to Premium for unlimited highlights.
              </Text>
            </View>
          )}
          <ScrollView style={styles.scroll} contentContainerStyle={styles.tabPaneContent}>
            {bookHighlights.length === 0 ? (
              <View style={styles.paneEmpty}>
                <Text style={styles.paneEmptyEmoji}>💬</Text>
                <Text style={styles.paneEmptyTitle}>No highlights yet</Text>
                <Text style={styles.paneEmptyHint}>Save a passage that moved you — tag it with a trope and a mood.</Text>
                <TouchableOpacity style={styles.paneEmptyBtn} onPress={() => setShowHighlightForm(true)}>
                  <Text style={styles.paneEmptyBtnText}>Add your first highlight</Text>
                </TouchableOpacity>
              </View>
            ) : (
              bookHighlights.map((h) => (
                <View key={h.id} style={styles.hlCard}>
                  <View style={styles.hlCardMeta}>
                    {h.trope && <View style={styles.hlTropePill}><Text style={styles.hlTropePillText}>{h.trope}</Text></View>}
                    {h.mood && (
                      <View style={styles.hlMoodPill}>
                        <Text style={styles.hlMoodPillText}>{MOODS.find((m) => m.key === h.mood)?.emoji} {h.mood}</Text>
                      </View>
                    )}
                    {h.page && <Text style={styles.hlPage}>p. {h.page}</Text>}
                    <TouchableOpacity
                      onPress={() => Alert.alert("Delete highlight?", "", [
                        { text: "Cancel", style: "cancel" },
                        { text: "Delete", style: "destructive", onPress: () => deleteHighlight(h.id) },
                      ])}
                      style={styles.hlDelete}
                    >
                      <Text style={styles.hlDeleteText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.blockquote}>
                    <View style={styles.blockquoteBorder} />
                    <Text style={styles.hlText}>"{h.text}"</Text>
                  </View>
                  <Text style={styles.hlDate}>{new Date(h.date).toLocaleDateString()}</Text>
                </View>
              ))
            )}
          </ScrollView>

          <Modal visible={showHighlightForm} animationType="slide" presentationStyle="pageSheet">
            <SafeAreaView style={styles.modalSafe}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setShowHighlightForm(false)}>
                  <Text style={styles.modalCancel}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Add highlight</Text>
                <TouchableOpacity onPress={saveHighlight}>
                  <Text style={styles.modalSave}>Save</Text>
                </TouchableOpacity>
              </View>
              <ScrollView contentContainerStyle={styles.modalContent}>
                <Text style={styles.fieldLabel}>QUOTE OR PASSAGE</Text>
                <TextInput
                  style={styles.textArea}
                  value={hlText}
                  onChangeText={setHlText}
                  placeholder="Paste or type the text…"
                  multiline
                  numberOfLines={5}
                  textAlignVertical="top"
                  autoFocus
                />
                <Text style={styles.fieldLabel}>TROPE TAG (OPTIONAL)</Text>
                {bookTropes.length > 0 ? (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {bookTropes.map((t) => (
                      <TouchableOpacity
                        key={t}
                        style={[styles.pickerChip, hlTrope === t && styles.pickerChipActive]}
                        onPress={() => setHlTrope(hlTrope === t ? "" : t)}
                      >
                        <Text style={[styles.pickerChipText, hlTrope === t && styles.pickerChipTextActive]}>{t}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                ) : (
                  <TextInput style={styles.input} value={hlTrope} onChangeText={setHlTrope} placeholder="e.g. enemies-to-lovers" />
                )}
                <Text style={styles.fieldLabel}>MOOD (OPTIONAL)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {MOODS.map((m) => (
                    <TouchableOpacity
                      key={m.key}
                      style={[styles.pickerChip, hlMood === m.key && styles.pickerChipActive]}
                      onPress={() => setHlMood(hlMood === m.key ? null : m.key)}
                    >
                      <Text style={[styles.pickerChipText, hlMood === m.key && styles.pickerChipTextActive]}>{m.emoji} {m.label}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <Text style={styles.fieldLabel}>PAGE (OPTIONAL)</Text>
                <TextInput
                  style={[styles.input, { width: 100 }]}
                  value={hlPage}
                  onChangeText={setHlPage}
                  keyboardType="number-pad"
                  placeholder="e.g. 142"
                />
              </ScrollView>
            </SafeAreaView>
          </Modal>
        </View>
      )}

      {/* Session log modal */}
      <Modal visible={showSessionModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowSessionModal(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Log session</Text>
            <TouchableOpacity onPress={logSession}>
              <Text style={styles.modalSave}>Save</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.fieldLabel}>{isAudio ? "ENDED AT MINUTE" : "ENDED ON PAGE"}</Text>
            <TextInput
              style={styles.input}
              value={logPages}
              onChangeText={setLogPages}
              keyboardType="number-pad"
              placeholder={isAudio ? "e.g. 65" : "e.g. 142"}
              autoFocus
            />
            <Text style={styles.fieldLabel}>MINUTES READ (OPTIONAL)</Text>
            <TextInput
              style={[styles.input, { width: 120 }]}
              value={logMinutes}
              onChangeText={setLogMinutes}
              keyboardType="number-pad"
              placeholder="e.g. 30"
            />
            <Text style={styles.fieldLabel}>SESSION MOOD (OPTIONAL)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {MOODS.map((m) => (
                <TouchableOpacity
                  key={m.key}
                  style={[styles.pickerChip, logMood === m.key && styles.pickerChipActive]}
                  onPress={() => setLogMood(logMood === m.key ? null : m.key)}
                >
                  <Text style={[styles.pickerChipText, logMood === m.key && styles.pickerChipTextActive]}>{m.emoji} {m.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={styles.fieldLabel}>QUICK NOTE (OPTIONAL)</Text>
            <TextInput
              style={styles.textArea}
              value={logNote}
              onChangeText={setLogNote}
              placeholder="What's on your mind after this session?"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Shelf picker modal */}
      <Modal visible={showShelfModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalHeader}>
            <View style={{ width: 60 }} />
            <Text style={styles.modalTitle}>Move to shelf</Text>
            <TouchableOpacity onPress={() => setShowShelfModal(false)} style={{ width: 60, alignItems: "flex-end" }}>
              <Text style={styles.modalSave}>Done</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.listModal}>
            {SHELVES.map((s) => (
              <TouchableOpacity
                key={s.key}
                style={[styles.listModalItem, book.shelf === s.key && styles.listModalItemActive]}
                onPress={() => { moveToShelf(bookId, s.key); setShowShelfModal(false); }}
              >
                <Text style={[styles.listModalItemText, book.shelf === s.key && styles.listModalItemTextActive]}>{s.label}</Text>
                {book.shelf === s.key && <Text style={styles.listModalCheck}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </SafeAreaView>
      </Modal>

      {/* Mood picker modal */}
      <Modal visible={showMoodModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalHeader}>
            <View style={{ width: 60 }} />
            <Text style={styles.modalTitle}>Reading mood</Text>
            <TouchableOpacity onPress={() => setShowMoodModal(false)} style={{ width: 60, alignItems: "flex-end" }}>
              <Text style={styles.modalSave}>Done</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.listModal}>
            {MOODS.map((m) => (
              <TouchableOpacity
                key={m.key}
                style={[
                  styles.listModalItem,
                  book.mood === m.key && styles.listModalItemActive,
                  book.mood === m.key ? { backgroundColor: MOOD_COLORS[m.key] ?? "#f5f0ea" } : {},
                ]}
                onPress={() => {
                  updateBook(bookId, { mood: book.mood === m.key ? undefined : m.key });
                  setShowMoodModal(false);
                }}
              >
                <Text style={styles.moodModalEmoji}>{m.emoji}</Text>
                <Text style={[styles.listModalItemText, book.mood === m.key && styles.listModalItemTextActive]}>{m.label}</Text>
                {book.mood === m.key && <Text style={styles.listModalCheck}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fafaf9" },
  notFound: { padding: 32, textAlign: "center", color: "#a89880" },
  // Hero
  hero: { padding: 16, paddingBottom: 14 },
  heroContent: { flexDirection: "row", gap: 14, alignItems: "flex-start" },
  cover: { width: 80, height: 120, borderRadius: 8 },
  coverPlaceholder: { backgroundColor: "#ede8df", justifyContent: "center", alignItems: "center" },
  coverInitial: { fontSize: 28, fontWeight: "700", color: "#a89880" },
  heroInfo: { flex: 1, gap: 4 },
  bookTitle: { fontSize: 18, fontWeight: "700", color: "#2d1f10", lineHeight: 24 },
  bookAuthor: { fontSize: 13, color: "#7a6655" },
  bookMeta: { fontSize: 11, color: "#a89880" },
  heroActions: { flexDirection: "row", gap: 6, marginTop: 6, flexWrap: "wrap" },
  heroPill: { backgroundColor: "rgba(255,255,255,0.75)", borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: "#d4c9a8" },
  heroPillText: { fontSize: 11, fontWeight: "500", color: "#3b2e1a" },
  heroProgress: { marginTop: 14, gap: 4 },
  heroProgressTrack: { height: 4, backgroundColor: "rgba(0,0,0,0.1)", borderRadius: 2, overflow: "hidden" },
  heroProgressBar: { height: "100%", backgroundColor: "rgba(0,0,0,0.28)", borderRadius: 2 },
  heroProgressText: { fontSize: 10, color: "#7a6655" },
  // Tabs
  tabs: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#f0ede8", backgroundColor: "#fff" },
  tab: { flex: 1, paddingVertical: 12, alignItems: "center" },
  tabActive: { borderBottomWidth: 2, borderBottomColor: "#3b2e1a" },
  tabText: { fontSize: 12, fontWeight: "500", color: "#a89880" },
  tabTextActive: { color: "#2d1f10", fontWeight: "700" },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 14, paddingBottom: 40 },
  // Cards
  card: { backgroundColor: "#fff", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#f0ede8", gap: 10 },
  cardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cardTitle: { fontSize: 14, fontWeight: "700", color: "#2d1f10" },
  cardSub: { fontSize: 11, color: "#a89880", marginTop: -6, lineHeight: 16 },
  row: { flexDirection: "row", gap: 8 },
  input: { borderWidth: 1, borderColor: "#ede8df", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, fontSize: 14, backgroundColor: "#fafaf9", flex: 1 },
  saveBtn: { backgroundColor: "#3b2e1a", borderRadius: 10, paddingHorizontal: 16, justifyContent: "center" },
  saveBtnText: { color: "#fff", fontWeight: "600", fontSize: 13 },
  logSessionBtn: { backgroundColor: "#f5f0ea", borderRadius: 10, paddingVertical: 11, alignItems: "center" },
  logSessionBtnText: { fontSize: 13, fontWeight: "600", color: "#3b2e1a" },
  companionBtn: { backgroundColor: "#3b2e1a", borderRadius: 14, paddingVertical: 14, alignItems: "center" },
  companionBtnText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  starsRow: { flexDirection: "row", gap: 4 },
  star: { fontSize: 28, color: "#ede8df" },
  starFilled: { color: "#d4a853" },
  textArea: { borderWidth: 1, borderColor: "#ede8df", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, minHeight: 100, backgroundColor: "#fafaf9" },
  fieldLabel: { fontSize: 10, fontWeight: "700", color: "#a89880", letterSpacing: 1 },
  // Tropes
  genreTab: { marginRight: 8, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: "#ede8df", backgroundColor: "#fafaf9" },
  genreTabActive: { backgroundColor: "#3b2e1a", borderColor: "#3b2e1a" },
  genreTabText: { fontSize: 11, color: "#7a6655", fontWeight: "500" },
  genreTabTextActive: { color: "#fff", fontWeight: "700" },
  tropeChips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tropeChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: "#f5f0ea", borderWidth: 1, borderColor: "transparent" },
  tropeChipActive: { backgroundColor: "#3b2e1a", borderColor: "#3b2e1a" },
  tropeChipLocked: { opacity: 0.4 },
  tropeChipText: { fontSize: 11, color: "#7a6655" },
  tropeChipTextActive: { color: "#fff" },
  tropeChipTagged: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: "#3b2e1a" },
  tropeChipTaggedText: { fontSize: 11, color: "#fff", fontWeight: "500" },
  tropeCountBadge: { fontSize: 11, fontWeight: "600", color: "#7a6655", backgroundColor: "#f5f0ea", paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  removeBtn: { borderWidth: 1, borderColor: "#fee2e2", borderRadius: 12, paddingVertical: 14, alignItems: "center", backgroundColor: "#fff" },
  removeBtnText: { fontSize: 14, fontWeight: "600", color: "#ef4444" },
  // Tab pane headers
  tabPaneHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, paddingBottom: 8 },
  tabPaneTitle: { fontSize: 17, fontWeight: "700", color: "#2d1f10" },
  tabPaneBtn: { backgroundColor: "#3b2e1a", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7 },
  tabPaneBtnText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  tabPaneContent: { padding: 16, gap: 10, paddingBottom: 40 },
  paneEmpty: { alignItems: "center", paddingTop: 48, gap: 8 },
  paneEmptyEmoji: { fontSize: 36 },
  paneEmptyTitle: { fontSize: 16, fontWeight: "700", color: "#2d1f10" },
  paneEmptyHint: { fontSize: 13, color: "#a89880", textAlign: "center", paddingHorizontal: 24, lineHeight: 20 },
  paneEmptyBtn: { backgroundColor: "#3b2e1a", borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10, marginTop: 8 },
  paneEmptyBtnText: { color: "#fff", fontWeight: "600", fontSize: 13 },
  // Sessions
  sessionCard: { backgroundColor: "#fff", borderRadius: 12, padding: 12, gap: 4, borderWidth: 1, borderColor: "#f0ede8" },
  sessionCardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sessionCardDate: { fontSize: 12, fontWeight: "600", color: "#3b2e1a" },
  sessionCardMood: { fontSize: 16 },
  sessionCardPages: { fontSize: 12, color: "#7a6655" },
  // Highlights
  lockBadge: { backgroundColor: "#fef3c7", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  lockBadgeText: { fontSize: 11, fontWeight: "600", color: "#92400e" },
  limitBanner: { marginHorizontal: 16, marginBottom: 8, backgroundColor: "#fef3c7", borderRadius: 10, padding: 12 },
  limitBannerText: { fontSize: 12, color: "#92400e", lineHeight: 18 },
  hlCard: { backgroundColor: "#fff", borderRadius: 14, padding: 14, gap: 10, borderWidth: 1, borderColor: "#f0ede8" },
  hlCardMeta: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 6 },
  hlTropePill: { backgroundColor: "#f5f0ea", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  hlTropePillText: { fontSize: 11, color: "#7a6655", fontWeight: "500" },
  hlMoodPill: { backgroundColor: "#fef3c7", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  hlMoodPillText: { fontSize: 11, color: "#92400e" },
  hlPage: { fontSize: 11, color: "#a89880" },
  hlDelete: { marginLeft: "auto", padding: 4 },
  hlDeleteText: { fontSize: 12, color: "#d1c4b0" },
  blockquote: { flexDirection: "row", gap: 10 },
  blockquoteBorder: { width: 3, borderRadius: 2, backgroundColor: "#d4c9a8" },
  hlText: { flex: 1, fontSize: 14, color: "#3b2e1a", lineHeight: 22, fontStyle: "italic" },
  hlDate: { fontSize: 10, color: "#d1c4b0" },
  // Picker chips (shared across modals)
  pickerChip: { marginRight: 8, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: "#ede8df", backgroundColor: "#fafaf9" },
  pickerChipActive: { backgroundColor: "#3b2e1a", borderColor: "#3b2e1a" },
  pickerChipText: { fontSize: 12, color: "#7a6655" },
  pickerChipTextActive: { color: "#fff" },
  // List modals (shelf + mood)
  listModal: { padding: 16, gap: 8 },
  listModalItem: { padding: 14, borderRadius: 12, backgroundColor: "#fff", borderWidth: 1, borderColor: "#f0ede8", flexDirection: "row", alignItems: "center", gap: 12 },
  listModalItemActive: { borderColor: "#d4c9a8" },
  listModalItemText: { fontSize: 15, color: "#3b2e1a", flex: 1 },
  listModalItemTextActive: { fontWeight: "600" },
  listModalCheck: { fontSize: 16, color: "#3b2e1a" },
  moodModalEmoji: { fontSize: 20 },
  // Modals
  modalSafe: { flex: 1, backgroundColor: "#fafaf9" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, borderBottomWidth: 1, borderBottomColor: "#f0ede8", backgroundColor: "#fff" },
  modalCancel: { fontSize: 15, color: "#a89880" },
  modalTitle: { fontSize: 16, fontWeight: "700", color: "#2d1f10" },
  modalSave: { fontSize: 15, fontWeight: "700", color: "#3b2e1a" },
  modalContent: { padding: 16, gap: 14, paddingBottom: 48 },
});
