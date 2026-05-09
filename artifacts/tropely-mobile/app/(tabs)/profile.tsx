import { useAuth, useUser } from "@clerk/clerk-expo";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Image,
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { computeStreak } from "@/lib/streak";
import { useStore } from "@/lib/store";
import { apiDelete, apiGet, apiPatch, apiPost, baseUrl } from "@/lib/api";

const TAB_BAR_HEIGHT = 84;

// ─── Achievement definitions ──────────────────────────────────────────────────
type Achievement = {
  id: string;
  emoji: string;
  label: string;
  desc: string;
  flairDesc: string;
  earned: boolean;
};

// ─── Row helper ───────────────────────────────────────────────────────────────
function Row({ label, value, onPress }: { label: string; value: string; onPress?: () => void }) {
  const colors = useColors();
  return (
    <TouchableOpacity
      style={{
        flexDirection: "row", justifyContent: "space-between",
        alignItems: "center", paddingVertical: 14, paddingHorizontal: 16,
        borderBottomWidth: 1, borderBottomColor: colors.border,
      }}
      onPress={onPress}
      disabled={!onPress}
    >
      <Text style={{ fontSize: 14, fontFamily: "Inter_500Medium", color: colors.foreground }}>{label}</Text>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <Text style={{ fontSize: 14, fontFamily: "Inter_400Regular", color: colors.mutedForeground }}>{value}</Text>
        {onPress && <Feather name="chevron-right" size={14} color={colors.mutedForeground} />}
      </View>
    </TouchableOpacity>
  );
}

function GoalRow({ label, value, options, onChange }: { label: string; value: number; options: number[]; onChange: (v: number) => void }) {
  const colors = useColors();
  return (
    <View style={{ paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border }}>
      <Text style={{ fontSize: 14, fontFamily: "Inter_500Medium", color: colors.foreground, marginBottom: 10 }}>{label}</Text>
      <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
        {options.map((o) => (
          <Pressable
            key={o}
            style={{
              paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20,
              backgroundColor: value === o ? colors.primary + "20" : colors.muted,
              borderWidth: 1, borderColor: value === o ? colors.primary : colors.border,
            }}
            onPress={() => { onChange(o); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
          >
            <Text style={{ fontSize: 13, fontFamily: "Inter_500Medium", color: value === o ? colors.primary : colors.mutedForeground }}>{o}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

// ─── Achievement badge ────────────────────────────────────────────────────────
function AchievementBadge({
  a, isFlair, onPress,
}: { a: Achievement; isFlair: boolean; onPress?: () => void }) {
  const colors = useColors();
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={onPress ? 0.75 : 1}
      style={[
        st.badge,
        {
          backgroundColor: isFlair
            ? "#9E7CCC18"
            : a.earned ? "#D4A83218" : colors.card,
          borderColor: isFlair
            ? colors.primary
            : a.earned ? "#D4A832" : colors.border,
          borderWidth: isFlair ? 2.5 : a.earned ? 2 : 1,
          shadowColor: isFlair ? colors.primary : a.earned ? "#D4A832" : "transparent",
          shadowOpacity: isFlair ? 0.55 : a.earned ? 0.35 : 0,
          shadowRadius: isFlair ? 14 : 8,
          shadowOffset: { width: 0, height: 2 },
          elevation: isFlair ? 8 : a.earned ? 4 : 0,
        },
      ]}
    >
      {/* Glow ring */}
      {(isFlair || a.earned) && (
        <View style={[
          st.glowRing,
          { backgroundColor: isFlair ? colors.primary + "14" : "#D4A83228" },
        ]} />
      )}

      <Text style={[st.badgeEmoji, { opacity: a.earned ? 1 : 0.3 }]}>{a.emoji}</Text>
      <Text style={[
        st.badgeLabel,
        { color: isFlair ? colors.primary : a.earned ? colors.foreground : colors.mutedForeground },
      ]}>
        {a.label}
      </Text>
      <Text style={[st.badgeDesc, { color: colors.mutedForeground }]} numberOfLines={2}>
        {a.desc}
      </Text>

      {/* Flair crown indicator */}
      {isFlair && (
        <View style={[st.flairCrown, { backgroundColor: colors.primary }]}>
          <Text style={{ fontSize: 8, color: "#fff" }}>★</Text>
        </View>
      )}
      {/* Earned check */}
      {a.earned && !isFlair && (
        <View style={st.earnedCheck}>
          <Text style={{ fontSize: 9, color: "#D4A832" }}>✓</Text>
        </View>
      )}
      {/* Locked overlay */}
      {!a.earned && (
        <View style={[st.lockedOverlay, { backgroundColor: colors.muted + "50" }]}>
          <Text style={{ fontSize: 13, opacity: 0.4 }}>🔒</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ─── Flair picker modal ───────────────────────────────────────────────────────
function FlairPicker({
  visible, achievements, currentFlair, onSelect, onClose,
}: {
  visible: boolean;
  achievements: Achievement[];
  currentFlair: string | null;
  onSelect: (id: string | null) => void;
  onClose: () => void;
}) {
  const colors = useColors();
  const earned = achievements.filter((a) => a.earned);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={st.modalBackdrop} onPress={onClose}>
        <Pressable style={[st.pickerSheet, { backgroundColor: colors.card }]} onPress={() => {}}>
          {/* Handle */}
          <View style={st.handleRow}>
            <View style={[st.handle, { backgroundColor: colors.border }]} />
          </View>

          <Text style={[st.pickerTitle, { color: colors.foreground }]}>Choose Achievement Flair</Text>
          <Text style={[st.pickerSub, { color: colors.mutedForeground }]}>
            Your flair appears on your profile as your featured achievement.
          </Text>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
            {earned.length === 0 ? (
              <View style={{ alignItems: "center", paddingVertical: 32, gap: 8 }}>
                <Text style={{ fontSize: 36 }}>🔒</Text>
                <Text style={[{ fontSize: 14, fontFamily: "Inter_500Medium", textAlign: "center" }, { color: colors.mutedForeground }]}>
                  Earn achievements first to set a flair.
                </Text>
              </View>
            ) : (
              <View style={{ gap: 10, paddingHorizontal: 20, paddingTop: 16 }}>
                {earned.map((a) => {
                  const isSelected = currentFlair === a.id;
                  return (
                    <TouchableOpacity
                      key={a.id}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        onSelect(isSelected ? null : a.id);
                        onClose();
                      }}
                      style={[
                        st.pickerRow,
                        {
                          backgroundColor: isSelected ? colors.primary + "15" : colors.muted + "60",
                          borderColor: isSelected ? colors.primary : colors.border,
                          borderWidth: isSelected ? 2 : 1,
                        },
                      ]}
                    >
                      <Text style={{ fontSize: 28 }}>{a.emoji}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={[st.pickerRowTitle, { color: isSelected ? colors.primary : colors.foreground }]}>
                          {a.label}
                        </Text>
                        <Text style={[st.pickerRowSub, { color: colors.mutedForeground }]}>
                          {a.flairDesc}
                        </Text>
                      </View>
                      {isSelected && (
                        <View style={[st.pickerCheck, { backgroundColor: colors.primary }]}>
                          <Feather name="check" size={13} color="#fff" />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {currentFlair && (
              <TouchableOpacity
                style={[st.clearBtn, { borderColor: colors.border }]}
                onPress={() => { onSelect(null); onClose(); }}
              >
                <Text style={[st.clearBtnTxt, { color: colors.mutedForeground }]}>Remove flair</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { signOut, getToken } = useAuth();
  const { user } = useUser();

  const books             = useStore((s) => s.books);
  const sessions          = useStore((s) => s.sessions);
  const journal           = useStore((s) => s.journal);
  const freeze            = useStore((s) => s.freeze);
  const dailyGoal         = useStore((s) => s.dailyGoal);
  const dailyGoalMinutes  = useStore((s) => s.dailyGoalMinutes);
  const yearlyGoal        = useStore((s) => s.yearlyGoal);
  const setDailyGoal      = useStore((s) => s.setDailyGoal);
  const setDailyGoalMinutes = useStore((s) => s.setDailyGoalMinutes);
  const setYearlyGoal     = useStore((s) => s.setYearlyGoal);
  const profilePicture    = useStore((s) => s.profilePicture);
  const setProfilePicture = useStore((s) => s.setProfilePicture);
  const preferences       = useStore((s) => s.preferences);
  const achievementFlair  = useStore((s) => s.achievementFlair);
  const setAchievementFlair = useStore((s) => s.setAchievementFlair);
  const isUnder16         = useStore((s) => s.isUnder16);
  const setIsUnder16      = useStore((s) => s.setIsUnder16);

  const finished   = books.filter((b) => b.shelf === "finished").length;
  const totalPages = sessions.reduce((sum, s) => sum + s.pagesRead, 0);
  const streak     = computeStreak(sessions, freeze);

  const [showFlairPicker, setShowFlairPicker] = useState(false);
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [serverAvatarUrl, setServerAvatarUrl] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const locationSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    apiGet<{ city?: string | null; country?: string | null; avatarUrl?: string | null }>("/api/profiles/me")
      .then((p) => {
        setCity(p.city ?? "");
        setCountry(p.country ?? "");
        if (p.avatarUrl) setServerAvatarUrl(p.avatarUrl);
      })
      .catch(() => {});
  }, []);

  const saveLocation = (newCity: string, newCountry: string) => {
    if (locationSaveTimer.current) clearTimeout(locationSaveTimer.current);
    locationSaveTimer.current = setTimeout(() => {
      apiPatch("/api/profiles/me", { city: newCity.trim() || null, country: newCountry.trim() || null }).catch(() => {});
    }, 800);
  };

  // ── Achievements ────────────────────────────────────────────────────────────
  const achievements: Achievement[] = [
    { id: "first",    emoji: "📖", label: "First Chapter",   desc: "Added your first book",         flairDesc: "Stepping into the story",      earned: books.length >= 1 },
    { id: "five",     emoji: "📚", label: "Bookworm",         desc: "Finished 5 books",              flairDesc: "Five books and counting",       earned: finished >= 5 },
    { id: "ten",      emoji: "🏆", label: "Bibliophile",      desc: "Finished 10 books",             flairDesc: "Double digits, no breaks",      earned: finished >= 10 },
    { id: "pages100", emoji: "💯", label: "Century",          desc: "Read 100+ pages total",         flairDesc: "100 pages already",             earned: totalPages >= 100 },
    { id: "pages1k",  emoji: "🌟", label: "Marathon Reader",  desc: "Read 1,000+ pages total",       flairDesc: "A thousand pages deep",         earned: totalPages >= 1000 },
    { id: "streak7",  emoji: "🔥", label: "Week Warrior",     desc: "7-day reading streak",          flairDesc: "Seven days straight",           earned: streak.current >= 7 },
    { id: "mood5",    emoji: "💜", label: "Mood Reader",      desc: "Tagged moods on 5+ books",      flairDesc: "Reads by feeling, not genre",   earned: books.filter((b) => b.mood).length >= 5 },
    { id: "trope3",   emoji: "🔮", label: "Trope Hunter",     desc: "Tropes tagged on 3+ books",     flairDesc: "Knows the tropes by heart",     earned: books.filter((b) => (b.tropes?.length ?? 0) > 0).length >= 3 },
    { id: "journal5", emoji: "✍️", label: "Journaler",        desc: "5+ journal entries",            flairDesc: "Writing between the lines",     earned: journal.length >= 5 },
    { id: "fave",     emoji: "⭐", label: "Collector",        desc: "Marked a book as favourite",    flairDesc: "Keeps their favourites close",   earned: books.some((b) => b.isFavorite) },
  ];

  const earnedCount  = achievements.filter((a) => a.earned).length;
  const activeFlair  = achievements.find((a) => a.id === achievementFlair) ?? null;

  // ── Photo picker ─────────────────────────────────────────────────────────────
  async function pickPhoto() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Please allow photo access to set a profile picture.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      const localUri = result.assets[0].uri;
      setProfilePicture(localUri);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setUploadingPhoto(true);
      try {
        const { uploadURL, objectPath } = await apiPost<{ uploadURL: string; objectPath: string }>("/api/avatar/upload-url", {});
        const imageBlob = await fetch(localUri).then((r) => r.blob());
        await fetch(uploadURL, { method: "PUT", body: imageBlob, headers: { "Content-Type": "image/jpeg" } });
        await apiPatch("/api/profiles/me", { avatarUrl: objectPath });
        setServerAvatarUrl(objectPath);
      } catch {
        // local preview still shows — upload failed silently
      } finally {
        setUploadingPhoto(false);
      }
    }
  }

  const handleSignOut = () => {
    Alert.alert("Sign out", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out", style: "destructive",
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          signOut();
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete account",
      "This will permanently delete your account, all your books, reading sessions, journal entries, and chat history. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete my account",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "Are you absolutely sure?",
              "All your data will be gone forever.",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Yes, delete everything",
                  style: "destructive",
                  onPress: async () => {
                    try {
                      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                      await apiDelete("/api/account/me");
                      signOut();
                    } catch {
                      Alert.alert("Error", "Could not delete your account. Please try again or contact support.");
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const initial = (user?.firstName?.[0] ?? user?.emailAddresses?.[0]?.emailAddress?.[0] ?? "?").toUpperCase();

  return (
    <View style={[st.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: (Platform.OS === "web" ? 34 : insets.bottom) + TAB_BAR_HEIGHT + 8 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Avatar header ── */}
        <View style={[st.header, { paddingTop: Platform.OS === "web" ? 67 : insets.top + 12 }]}>
          <TouchableOpacity onPress={pickPhoto} activeOpacity={0.8} disabled={uploadingPhoto}>
            <View style={[st.avatarRing, { borderColor: colors.primary + "60", opacity: uploadingPhoto ? 0.6 : 1 }]}>
              {(serverAvatarUrl || profilePicture) ? (
                <Image
                  source={{ uri: serverAvatarUrl ? `${baseUrl()}/api/storage${serverAvatarUrl}` : profilePicture! }}
                  style={st.avatarImage}
                />
              ) : (
                <View style={[st.avatarFallback, { backgroundColor: colors.primary + "30" }]}>
                  <Text style={[st.avatarText, { color: colors.primary }]}>{initial}</Text>
                </View>
              )}
            </View>
            <View style={[st.cameraBtn, { backgroundColor: uploadingPhoto ? colors.mutedForeground : colors.primary }]}>
              {uploadingPhoto
                ? <ActivityIndicator size={10} color="#fff" />
                : <Feather name="camera" size={11} color="#fff" />}
            </View>
          </TouchableOpacity>

          <Text style={[st.name, { color: colors.foreground }]}>
            {user?.fullName ?? user?.firstName ?? "Reader"}
          </Text>
          <Text style={[st.email, { color: colors.mutedForeground }]}>
            {user?.emailAddresses?.[0]?.emailAddress ?? ""}
          </Text>

          {/* ── Achievement flair badge ── */}
          <TouchableOpacity
            style={[
              st.flairBadge,
              activeFlair
                ? { backgroundColor: colors.primary + "18", borderColor: colors.primary + "80" }
                : { backgroundColor: colors.muted, borderColor: colors.border },
            ]}
            onPress={() => setShowFlairPicker(true)}
            activeOpacity={0.8}
          >
            {activeFlair ? (
              <>
                <Text style={{ fontSize: 16 }}>{activeFlair.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[st.flairLabel, { color: colors.primary }]}>{activeFlair.label}</Text>
                  <Text style={[st.flairSub, { color: colors.mutedForeground }]} numberOfLines={1}>
                    {activeFlair.flairDesc}
                  </Text>
                </View>
                <View style={[st.flairStarBadge, { backgroundColor: colors.primary }]}>
                  <Text style={{ fontSize: 9, color: "#fff" }}>★ FLAIR</Text>
                </View>
              </>
            ) : (
              <>
                <Feather name="award" size={15} color={colors.mutedForeground} />
                <Text style={[st.flairEmpty, { color: colors.mutedForeground }]}>Set achievement flair</Text>
                <Feather name="chevron-right" size={13} color={colors.mutedForeground} />
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={pickPhoto} style={[st.changePhotoBtn, { borderColor: colors.border }]}>
            <Feather name="camera" size={12} color={colors.mutedForeground} />
            <Text style={[st.changePhotoTxt, { color: colors.mutedForeground }]}>
              {profilePicture ? "Change photo" : "Add profile photo"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Stats ── */}
        <View style={st.statsRow}>
          {[
            { label: "Finished",    value: finished },
            { label: "Total pages", value: totalPages },
            { label: "Entries",     value: journal.length },
          ].map((item) => (
            <View key={item.label} style={[st.statBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[st.statVal, { color: colors.foreground }]}>{item.value}</Text>
              <Text style={[st.statLabel, { color: colors.mutedForeground }]}>{item.label}</Text>
            </View>
          ))}
        </View>

        {/* ── Achievement badges ── */}
        <View style={st.section}>
          <View style={st.achieveHeader}>
            <Text style={[st.sectionTitle, { color: colors.mutedForeground }]}>Achievements</Text>
            <View style={[st.achieveCount, { backgroundColor: colors.primary + "20", borderColor: colors.primary + "60" }]}>
              <Text style={[st.achieveCountTxt, { color: colors.primary }]}>
                {earnedCount} / {achievements.length} earned
              </Text>
            </View>
          </View>

          {/* Flair hint */}
          <Text style={[st.flairHint, { color: colors.mutedForeground }]}>
            Tap an earned achievement to set it as your flair ★
          </Text>

          <View style={st.badgeGrid}>
            {achievements.map((a) => (
              <AchievementBadge
                key={a.id}
                a={a}
                isFlair={achievementFlair === a.id}
                onPress={a.earned ? () => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setAchievementFlair(achievementFlair === a.id ? null : a.id);
                } : undefined}
              />
            ))}
          </View>
        </View>

        {/* ── Favourite moods ── */}
        <View style={st.section}>
          <Text style={[st.sectionTitle, { color: colors.mutedForeground }]}>Favourite moods</Text>
          <View style={[st.groupCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Row label="Reading moods" value={preferences?.favoriteMoods?.join(", ") ?? "Not set"} />
          </View>
        </View>

        {/* ── Daily goals ── */}
        <View style={st.section}>
          <Text style={[st.sectionTitle, { color: colors.mutedForeground }]}>Daily goals</Text>
          <View style={[st.groupCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <GoalRow label="Pages per day"   value={dailyGoal}        options={[10, 20, 30, 50, 100]} onChange={setDailyGoal} />
            <GoalRow label="Minutes per day" value={dailyGoalMinutes} options={[15, 30, 45, 60, 90]}  onChange={setDailyGoalMinutes} />
            <GoalRow label="Books per year"  value={yearlyGoal}       options={[12, 24, 36, 50, 100]} onChange={setYearlyGoal} />
          </View>
        </View>

        {/* ── Account ── */}
        <View style={st.section}>
          <Text style={[st.sectionTitle, { color: colors.mutedForeground }]}>Account</Text>
          <View style={[st.groupCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Row label="Email" value={user?.emailAddresses?.[0]?.emailAddress ?? ""} />
            <Row
              label="Member since"
              value={user?.createdAt
                ? new Date(user.createdAt).toLocaleDateString("en", { month: "long", year: "numeric" })
                : "—"}
            />
            {/* Location — for Reading Twins */}
            <View style={{ borderTopWidth: 1, borderTopColor: colors.border, paddingHorizontal: 16, paddingVertical: 12, gap: 8 }}>
              <Text style={{ fontSize: 12, fontFamily: "Inter_500Medium", color: colors.mutedForeground }}>LOCATION · for Reading Twins 👯</Text>
              <TextInput
                style={{ backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, fontSize: 14, fontFamily: "Inter_400Regular", color: colors.foreground }}
                placeholder="City (e.g. London)"
                placeholderTextColor={colors.mutedForeground}
                value={city}
                onChangeText={(v) => { setCity(v); saveLocation(v, country); }}
              />
              <TextInput
                style={{ backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, fontSize: 14, fontFamily: "Inter_400Regular", color: colors.foreground }}
                placeholder="Country (e.g. United Kingdom)"
                placeholderTextColor={colors.mutedForeground}
                value={country}
                onChangeText={(v) => { setCountry(v); saveLocation(city, v); }}
              />
              <Text style={{ fontSize: 11, fontFamily: "Inter_400Regular", color: colors.mutedForeground, lineHeight: 16 }}>
                Only your city and country are stored — no GPS used. Helps match you with nearby readers.
              </Text>
            </View>
            {/* Under-16 toggle */}
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between",
              paddingHorizontal: 16, paddingVertical: 14,
              borderTopWidth: 1, borderTopColor: colors.border }}>
              <View style={{ flex: 1, marginRight: 12 }}>
                <Text style={{ fontSize: 14, fontFamily: "Inter_500Medium", color: colors.foreground }}>
                  Under 16 profile 🔒
                </Text>
                <Text style={{ fontSize: 12, fontFamily: "Inter_400Regular", color: colors.mutedForeground, marginTop: 2, lineHeight: 16 }}>
                  {isUnder16
                    ? "Chat moderation is on. Inappropriate messages are blocked."
                    : "Turn on for readers under 16. Enables stricter chat filtering."}
                </Text>
              </View>
              <Switch
                value={isUnder16 === true}
                onValueChange={(v) => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setIsUnder16(v);
                }}
                trackColor={{ false: colors.border, true: colors.primary + "60" }}
                thumbColor={isUnder16 ? colors.primary : colors.mutedForeground}
              />
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={[st.signOutBtn, { borderColor: colors.destructive + "60" }]}
          onPress={handleSignOut}
        >
          <Text style={[st.signOutTxt, { color: colors.destructive }]}>Sign out</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[st.signOutBtn, { borderColor: colors.destructive + "20", marginTop: 10, marginBottom: 4 }]}
          onPress={handleDeleteAccount}
        >
          <Text style={[st.signOutTxt, { color: colors.destructive + "99", fontSize: 13 }]}>Delete account</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ── Flair picker modal ── */}
      <FlairPicker
        visible={showFlairPicker}
        achievements={achievements}
        currentFlair={achievementFlair}
        onSelect={setAchievementFlair}
        onClose={() => setShowFlairPicker(false)}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const st = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 20, alignItems: "center" },

  avatarRing: { width: 84, height: 84, borderRadius: 42, borderWidth: 2.5, padding: 2, marginBottom: 12 },
  avatarImage: { width: "100%", height: "100%", borderRadius: 38 },
  avatarFallback: { width: "100%", height: "100%", borderRadius: 38, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 32, fontFamily: "Inter_700Bold" },
  cameraBtn: {
    position: "absolute", bottom: 12, right: -2,
    width: 24, height: 24, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: "#fff",
  },
  name: { fontSize: 20, fontFamily: "Inter_700Bold" },
  email: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 3 },

  // Flair badge in header
  flairBadge: {
    flexDirection: "row", alignItems: "center", gap: 10,
    marginTop: 14, paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 20, borderWidth: 1.5, width: "100%",
  },
  flairLabel: { fontSize: 13, fontFamily: "Inter_700Bold" },
  flairSub: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 1 },
  flairEmpty: { flex: 1, fontSize: 13, fontFamily: "Inter_500Medium" },
  flairStarBadge: {
    paddingHorizontal: 7, paddingVertical: 3, borderRadius: 10,
  },

  changePhotoBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    marginTop: 12, paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1,
  },
  changePhotoTxt: { fontSize: 12, fontFamily: "Inter_500Medium" },

  statsRow: { flexDirection: "row", paddingHorizontal: 20, gap: 10, marginBottom: 24 },
  statBox: { flex: 1, borderRadius: 16, padding: 14, alignItems: "center", borderWidth: 1 },
  statVal: { fontSize: 22, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },

  section: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 12, fontFamily: "Inter_600SemiBold", textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  groupCard: { marginHorizontal: 20, borderRadius: 16, overflow: "hidden", borderWidth: 1 },

  achieveHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, marginBottom: 6,
  },
  achieveCount: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  achieveCountTxt: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  flairHint: {
    fontSize: 11, fontFamily: "Inter_400Regular", paddingHorizontal: 20, marginBottom: 12,
  },

  badgeGrid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 16, gap: 10 },
  badge: {
    width: "46%", padding: 14, borderRadius: 18,
    alignItems: "center", gap: 4, overflow: "hidden",
    minHeight: 120,
  },
  glowRing: { position: "absolute", inset: 0, borderRadius: 18 },
  badgeEmoji: { fontSize: 30, marginBottom: 2 },
  badgeLabel: { fontSize: 12, fontFamily: "Inter_700Bold", textAlign: "center" },
  badgeDesc: { fontSize: 10, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 14 },
  flairCrown: {
    position: "absolute", top: 8, right: 8,
    paddingHorizontal: 6, paddingVertical: 3, borderRadius: 8,
  },
  earnedCheck: {
    position: "absolute", top: 8, right: 8,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: "#D4A83222", borderWidth: 1.5, borderColor: "#D4A832",
    alignItems: "center", justifyContent: "center",
  },
  lockedOverlay: {
    position: "absolute", bottom: 8, right: 8,
    width: 22, height: 22, borderRadius: 11,
    alignItems: "center", justifyContent: "center",
  },

  signOutBtn: { marginHorizontal: 20, borderRadius: 12, borderWidth: 1, paddingVertical: 13, alignItems: "center" },
  signOutTxt: { fontSize: 14, fontFamily: "Inter_600SemiBold" },

  // Flair picker modal
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.65)", justifyContent: "flex-end" },
  pickerSheet: {
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    maxHeight: "78%",
    shadowColor: "#000", shadowOffset: { width: 0, height: -6 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 20,
  },
  handleRow: { alignItems: "center", paddingVertical: 12 },
  handle: { width: 40, height: 4, borderRadius: 2 },
  pickerTitle: { fontSize: 20, fontFamily: "Inter_700Bold", textAlign: "center" },
  pickerSub: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", paddingHorizontal: 28, marginTop: 6, lineHeight: 18 },

  pickerRow: {
    flexDirection: "row", alignItems: "center", gap: 14,
    padding: 14, borderRadius: 16,
  },
  pickerRowTitle: { fontSize: 14, fontFamily: "Inter_700Bold" },
  pickerRowSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  pickerCheck: {
    width: 26, height: 26, borderRadius: 13,
    alignItems: "center", justifyContent: "center",
  },
  clearBtn: {
    marginHorizontal: 20, marginTop: 16, borderRadius: 12,
    borderWidth: 1, paddingVertical: 12, alignItems: "center",
  },
  clearBtnTxt: { fontSize: 13, fontFamily: "Inter_500Medium" },
});
