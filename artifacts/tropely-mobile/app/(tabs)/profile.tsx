import { useAuth, useUser } from "@clerk/clerk-expo";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
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

type Achievement = {
  id: string;
  emoji: string;
  label: string;
  desc: string;
  flairDesc: string;
  earned: boolean;
};

function SectionLabel({ children }: { children: string }) {
  const colors = useColors();
  return (
    <Text style={{
      fontSize: 11, fontFamily: "DMSans_600SemiBold",
      color: colors.mutedForeground, textTransform: "uppercase",
      letterSpacing: 2, marginBottom: 12, paddingHorizontal: 20,
    }}>{children}</Text>
  );
}

function SettingRow({ label, value, onPress }: { label: string; value?: string; onPress?: () => void }) {
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
      <Text style={{ fontSize: 14, fontFamily: "DMSans_500Medium", color: colors.foreground }}>{label}</Text>
      {value !== undefined && (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Text style={{ fontSize: 14, fontFamily: "DMSans_400Regular", color: colors.mutedForeground }}>{value}</Text>
          {onPress && <Feather name="chevron-right" size={14} color={colors.mutedForeground} />}
        </View>
      )}
    </TouchableOpacity>
  );
}

function GoalRow({ label, value, options, onChange }: {
  label: string; value: number; options: number[]; onChange: (v: number) => void;
}) {
  const colors = useColors();
  return (
    <View style={{ paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border }}>
      <Text style={{ fontSize: 14, fontFamily: "DMSans_500Medium", color: colors.foreground, marginBottom: 10 }}>{label}</Text>
      <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
        {options.map((o) => (
          <Pressable
            key={o}
            style={{
              paddingHorizontal: 16, paddingVertical: 7, borderRadius: 99,
              backgroundColor: value === o ? colors.moodStrong + "18" : colors.background,
              borderWidth: 1.5, borderColor: value === o ? colors.moodStrong : colors.border,
            }}
            onPress={() => { onChange(o); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
          >
            <Text style={{
              fontSize: 13, fontFamily: "DMSans_500Medium",
              color: value === o ? colors.moodStrong : colors.mutedForeground,
            }}>{o}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function AchievementBadge({ a, isFlair, onPress }: { a: Achievement; isFlair: boolean; onPress?: () => void }) {
  const colors = useColors();
  const borderColor = isFlair ? colors.moodStrong : a.earned ? "#D4A832" : colors.border;
  const bgColor = isFlair ? colors.moodStrong + "15" : a.earned ? "#D4A83215" : colors.card;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={onPress ? 0.75 : 1}
      style={{
        width: "46%", padding: 14, borderRadius: 18,
        alignItems: "center", gap: 4, overflow: "hidden",
        minHeight: 120, backgroundColor: bgColor,
        borderWidth: isFlair ? 2.5 : a.earned ? 2 : 1,
        borderColor,
      }}
    >
      <Text style={{ fontSize: 30, marginBottom: 2, opacity: a.earned ? 1 : 0.3 }}>{a.emoji}</Text>
      <Text style={{
        fontSize: 12, fontFamily: "DMSans_600SemiBold", textAlign: "center",
        color: isFlair ? colors.moodStrong : a.earned ? colors.foreground : colors.mutedForeground,
      }}>{a.label}</Text>
      <Text style={{
        fontSize: 10, fontFamily: "DMSans_400Regular", textAlign: "center",
        color: colors.mutedForeground, lineHeight: 14,
      }} numberOfLines={2}>{a.desc}</Text>
      {isFlair && (
        <View style={{
          position: "absolute", top: 8, right: 8,
          backgroundColor: colors.moodStrong, borderRadius: 8,
          paddingHorizontal: 6, paddingVertical: 3,
        }}>
          <Text style={{ fontSize: 8, color: "#fff", fontFamily: "DMSans_600SemiBold" }}>★ FLAIR</Text>
        </View>
      )}
      {a.earned && !isFlair && (
        <View style={{
          position: "absolute", top: 8, right: 8, width: 18, height: 18, borderRadius: 9,
          backgroundColor: "#D4A83222", borderWidth: 1.5, borderColor: "#D4A832",
          alignItems: "center", justifyContent: "center",
        }}>
          <Text style={{ fontSize: 9, color: "#D4A832" }}>✓</Text>
        </View>
      )}
      {!a.earned && (
        <View style={{
          position: "absolute", bottom: 8, right: 8, width: 22, height: 22, borderRadius: 11,
          backgroundColor: colors.muted + "80", alignItems: "center", justifyContent: "center",
        }}>
          <Text style={{ fontSize: 12, opacity: 0.5 }}>🔒</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

function FlairPicker({ visible, achievements, currentFlair, onSelect, onClose }: {
  visible: boolean; achievements: Achievement[]; currentFlair: string | null;
  onSelect: (id: string | null) => void; onClose: () => void;
}) {
  const colors = useColors();
  const earned = achievements.filter((a) => a.earned);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: "rgba(42,31,20,0.55)", justifyContent: "flex-end" }} onPress={onClose}>
        <Pressable style={{ backgroundColor: colors.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: "78%" }} onPress={() => {}}>
          <View style={{ alignItems: "center", paddingVertical: 12 }}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border }} />
          </View>
          <Text style={{ fontSize: 20, fontFamily: "Fraunces_700Bold", color: colors.foreground, textAlign: "center", paddingHorizontal: 20 }}>
            Choose Achievement Flair
          </Text>
          <Text style={{ fontSize: 13, fontFamily: "DMSans_400Regular", color: colors.mutedForeground, textAlign: "center", paddingHorizontal: 28, marginTop: 6, lineHeight: 18 }}>
            Your flair appears on your profile as your featured achievement.
          </Text>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
            {earned.length === 0 ? (
              <View style={{ alignItems: "center", paddingVertical: 32, gap: 8 }}>
                <Text style={{ fontSize: 36 }}>🔒</Text>
                <Text style={{ fontSize: 14, fontFamily: "DMSans_500Medium", textAlign: "center", color: colors.mutedForeground }}>
                  Earn achievements first to set a flair.
                </Text>
              </View>
            ) : (
              <View style={{ gap: 10, paddingHorizontal: 20, paddingTop: 16 }}>
                {earned.map((a) => {
                  const selected = currentFlair === a.id;
                  return (
                    <TouchableOpacity
                      key={a.id}
                      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onSelect(selected ? null : a.id); onClose(); }}
                      style={{
                        flexDirection: "row", alignItems: "center", gap: 14,
                        padding: 14, borderRadius: 16,
                        backgroundColor: selected ? colors.moodStrong + "15" : colors.muted + "60",
                        borderWidth: selected ? 2 : 1,
                        borderColor: selected ? colors.moodStrong : colors.border,
                      }}
                    >
                      <Text style={{ fontSize: 28 }}>{a.emoji}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, fontFamily: "DMSans_600SemiBold", color: selected ? colors.moodStrong : colors.foreground }}>
                          {a.label}
                        </Text>
                        <Text style={{ fontSize: 12, fontFamily: "DMSans_400Regular", color: colors.mutedForeground, marginTop: 2 }}>
                          {a.flairDesc}
                        </Text>
                      </View>
                      {selected && (
                        <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: colors.moodStrong, alignItems: "center", justifyContent: "center" }}>
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
                style={{ marginHorizontal: 20, marginTop: 16, borderRadius: 12, borderWidth: 1, borderColor: colors.border, paddingVertical: 12, alignItems: "center" }}
                onPress={() => { onSelect(null); onClose(); }}
              >
                <Text style={{ fontSize: 13, fontFamily: "DMSans_500Medium", color: colors.mutedForeground }}>Remove flair</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { signOut } = useAuth();
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
  const familyAccount     = useStore((s) => s.familyAccount);
  const setFamilyAccount  = useStore((s) => s.setFamilyAccount);
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

  const achievements: Achievement[] = [
    { id: "first",    emoji: "📖", label: "First Chapter",  desc: "Added your first book",        flairDesc: "Stepping into the story",    earned: books.length >= 1 },
    { id: "five",     emoji: "📚", label: "Bookworm",        desc: "Finished 5 books",             flairDesc: "Five books and counting",    earned: finished >= 5 },
    { id: "ten",      emoji: "🏆", label: "Bibliophile",     desc: "Finished 10 books",            flairDesc: "Double digits, no breaks",   earned: finished >= 10 },
    { id: "pages100", emoji: "💯", label: "Century",         desc: "Read 100+ pages total",        flairDesc: "100 pages already",          earned: totalPages >= 100 },
    { id: "pages1k",  emoji: "🌟", label: "Marathon Reader", desc: "Read 1,000+ pages total",      flairDesc: "A thousand pages deep",      earned: totalPages >= 1000 },
    { id: "streak7",  emoji: "🔥", label: "Week Warrior",    desc: "7-day reading streak",         flairDesc: "Seven days straight",        earned: streak.current >= 7 },
    { id: "mood5",    emoji: "💜", label: "Mood Reader",     desc: "Tagged moods on 5+ books",     flairDesc: "Reads by feeling, not genre",earned: books.filter((b) => b.mood).length >= 5 },
    { id: "trope3",   emoji: "🔮", label: "Trope Hunter",    desc: "Tropes tagged on 3+ books",    flairDesc: "Knows the tropes by heart",  earned: books.filter((b) => (b.tropes?.length ?? 0) > 0).length >= 3 },
    { id: "journal5", emoji: "✍️", label: "Journaler",       desc: "5+ journal entries",           flairDesc: "Writing between the lines",  earned: journal.length >= 5 },
    { id: "fave",     emoji: "⭐", label: "Collector",       desc: "Marked a book as favourite",   flairDesc: "Keeps their favourites close",earned: books.some((b) => b.isFavorite) },
  ];

  const earnedCount = achievements.filter((a) => a.earned).length;
  const activeFlair = achievements.find((a) => a.id === achievementFlair) ?? null;

  async function pickPhoto() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Please allow photo access to set a profile picture.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"], allowsEditing: true, aspect: [1, 1], quality: 0.8,
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
      } catch { } finally {
        setUploadingPhoto(false);
      }
    }
  }

  const handleSignOut = () => {
    Alert.alert("Sign out", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign out", style: "destructive", onPress: () => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); signOut(); } },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert("Delete account", "This will permanently delete your account and all your data. This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete my account", style: "destructive",
        onPress: () => {
          Alert.alert("Are you absolutely sure?", "All your data will be gone forever.", [
            { text: "Cancel", style: "cancel" },
            {
              text: "Yes, delete everything", style: "destructive",
              onPress: async () => {
                try {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                  await apiDelete("/api/account/me");
                  signOut();
                } catch {
                  Alert.alert("Error", "Could not delete your account. Please try again.");
                }
              },
            },
          ]);
        },
      },
    ]);
  };

  const initial = (user?.firstName?.[0] ?? user?.emailAddresses?.[0]?.emailAddress?.[0] ?? "?").toUpperCase();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: (Platform.OS === "web" ? 34 : insets.bottom) + TAB_BAR_HEIGHT + 8 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero header ── */}
        <LinearGradient
          colors={[colors.moodTint, colors.background]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={{
            paddingTop: Platform.OS === "web" ? 67 : insets.top + 20,
            paddingHorizontal: 20, paddingBottom: 24, alignItems: "center",
          }}
        >
          {/* Avatar */}
          <TouchableOpacity onPress={pickPhoto} activeOpacity={0.8} disabled={uploadingPhoto}>
            <View style={{
              width: 88, height: 88, borderRadius: 44,
              borderWidth: 3, borderColor: colors.moodStrong + "60",
              padding: 3, marginBottom: 14, opacity: uploadingPhoto ? 0.6 : 1,
            }}>
              {(serverAvatarUrl || profilePicture) ? (
                <Image
                  source={{ uri: serverAvatarUrl ? `${baseUrl()}/api/storage${serverAvatarUrl}` : profilePicture! }}
                  style={{ width: "100%", height: "100%", borderRadius: 38 }}
                />
              ) : (
                <View style={{
                  width: "100%", height: "100%", borderRadius: 38,
                  backgroundColor: colors.moodStrong + "25",
                  alignItems: "center", justifyContent: "center",
                }}>
                  <Text style={{ fontSize: 32, fontFamily: "Fraunces_700Bold", color: colors.moodStrong }}>{initial}</Text>
                </View>
              )}
            </View>
            <View style={{
              position: "absolute", bottom: 14, right: -2,
              width: 26, height: 26, borderRadius: 13,
              backgroundColor: uploadingPhoto ? colors.mutedForeground : colors.moodStrong,
              alignItems: "center", justifyContent: "center",
              borderWidth: 2.5, borderColor: colors.background,
            }}>
              {uploadingPhoto
                ? <ActivityIndicator size={10} color="#fff" />
                : <Feather name="camera" size={12} color="#fff" />}
            </View>
          </TouchableOpacity>

          <Text style={{ fontSize: 22, fontFamily: "Fraunces_700Bold", color: colors.foreground }}>
            {user?.fullName ?? user?.firstName ?? "Reader"}
          </Text>
          <Text style={{ fontSize: 13, fontFamily: "DMSans_400Regular", color: colors.mutedForeground, marginTop: 3 }}>
            {user?.emailAddresses?.[0]?.emailAddress ?? ""}
          </Text>

          {/* Flair badge */}
          <TouchableOpacity
            onPress={() => setShowFlairPicker(true)}
            activeOpacity={0.8}
            style={{
              flexDirection: "row", alignItems: "center", gap: 10,
              marginTop: 14, paddingHorizontal: 16, paddingVertical: 11,
              borderRadius: 99, borderWidth: 1.5, width: "100%",
              backgroundColor: activeFlair ? colors.moodStrong + "15" : colors.card,
              borderColor: activeFlair ? colors.moodStrong + "80" : colors.border,
            }}
          >
            {activeFlair ? (
              <>
                <Text style={{ fontSize: 18 }}>{activeFlair.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontFamily: "DMSans_600SemiBold", color: colors.moodStrong }}>{activeFlair.label}</Text>
                  <Text style={{ fontSize: 11, fontFamily: "DMSans_400Regular", color: colors.mutedForeground, marginTop: 1 }} numberOfLines={1}>
                    {activeFlair.flairDesc}
                  </Text>
                </View>
                <View style={{ backgroundColor: colors.moodStrong, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 }}>
                  <Text style={{ fontSize: 9, color: "#fff", fontFamily: "DMSans_600SemiBold" }}>★ FLAIR</Text>
                </View>
              </>
            ) : (
              <>
                <Feather name="award" size={15} color={colors.mutedForeground} />
                <Text style={{ flex: 1, fontSize: 13, fontFamily: "DMSans_500Medium", color: colors.mutedForeground }}>Set achievement flair</Text>
                <Feather name="chevron-right" size={13} color={colors.mutedForeground} />
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={pickPhoto}
            style={{
              flexDirection: "row", alignItems: "center", gap: 6,
              marginTop: 10, paddingHorizontal: 14, paddingVertical: 7,
              borderRadius: 99, borderWidth: 1, borderColor: colors.border,
            }}
          >
            <Feather name="camera" size={12} color={colors.mutedForeground} />
            <Text style={{ fontSize: 12, fontFamily: "DMSans_500Medium", color: colors.mutedForeground }}>
              {profilePicture ? "Change photo" : "Add profile photo"}
            </Text>
          </TouchableOpacity>
        </LinearGradient>

        {/* ── Stats ── */}
        <View style={{ flexDirection: "row", paddingHorizontal: 20, gap: 10, marginBottom: 28 }}>
          {[
            { label: "Finished", value: finished },
            { label: "Pages read", value: totalPages },
            { label: "Entries", value: journal.length },
          ].map((item) => (
            <View key={item.label} style={{
              flex: 1, backgroundColor: colors.card, borderRadius: 16,
              padding: 14, alignItems: "center", borderWidth: 1, borderColor: colors.border,
            }}>
              <Text style={{ fontSize: 22, fontFamily: "Fraunces_700Bold", color: colors.foreground }}>{item.value}</Text>
              <Text style={{ fontSize: 11, fontFamily: "DMSans_400Regular", color: colors.mutedForeground, marginTop: 3, textTransform: "uppercase", letterSpacing: 0.5 }}>{item.label}</Text>
            </View>
          ))}
        </View>

        {/* ── Achievements ── */}
        <View style={{ marginBottom: 28 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, marginBottom: 6 }}>
            <Text style={{ fontSize: 11, fontFamily: "DMSans_600SemiBold", color: colors.mutedForeground, textTransform: "uppercase", letterSpacing: 2 }}>
              Achievements
            </Text>
            <View style={{ backgroundColor: colors.moodStrong + "18", borderWidth: 1, borderColor: colors.moodStrong + "50", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 }}>
              <Text style={{ fontSize: 12, fontFamily: "DMSans_600SemiBold", color: colors.moodStrong }}>
                {earnedCount} / {achievements.length}
              </Text>
            </View>
          </View>
          <Text style={{ fontSize: 11, fontFamily: "DMSans_400Regular", color: colors.mutedForeground, paddingHorizontal: 20, marginBottom: 14 }}>
            Tap an earned achievement to set it as your flair ★
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 16, gap: 10 }}>
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

        {/* ── Daily goals ── */}
        <View style={{ marginBottom: 28 }}>
          <SectionLabel>Daily goals</SectionLabel>
          <View style={{ marginHorizontal: 20, backgroundColor: colors.card, borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: colors.border }}>
            <GoalRow label="Pages per day"   value={dailyGoal}        options={[10, 20, 30, 50, 100]} onChange={setDailyGoal} />
            <GoalRow label="Minutes per day" value={dailyGoalMinutes} options={[15, 30, 45, 60, 90]}  onChange={setDailyGoalMinutes} />
            <GoalRow label="Books per year"  value={yearlyGoal}       options={[12, 24, 36, 50, 100]} onChange={setYearlyGoal} />
          </View>
        </View>

        {/* ── Favourite moods ── */}
        {preferences?.favoriteMoods && preferences.favoriteMoods.length > 0 && (
          <View style={{ marginBottom: 28 }}>
            <SectionLabel>Favourite moods</SectionLabel>
            <View style={{ marginHorizontal: 20, backgroundColor: colors.card, borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: colors.border }}>
              <SettingRow label="Reading moods" value={preferences.favoriteMoods.join(", ")} />
            </View>
          </View>
        )}

        {/* ── Account ── */}
        <View style={{ marginBottom: 28 }}>
          <SectionLabel>Account</SectionLabel>
          <View style={{ marginHorizontal: 20, backgroundColor: colors.card, borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: colors.border }}>
            <SettingRow label="Email" value={user?.emailAddresses?.[0]?.emailAddress ?? ""} />
            <SettingRow
              label="Member since"
              value={user?.createdAt
                ? new Date(user.createdAt).toLocaleDateString("en", { month: "long", year: "numeric" })
                : "—"}
            />
            {/* Location for Reading Twins */}
            <View style={{ borderTopWidth: 1, borderTopColor: colors.border, paddingHorizontal: 16, paddingVertical: 14, gap: 10 }}>
              <Text style={{ fontSize: 11, fontFamily: "DMSans_600SemiBold", color: colors.mutedForeground, textTransform: "uppercase", letterSpacing: 1 }}>
                Location · for Reading Twins 👯
              </Text>
              <TextInput
                style={{ backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, fontFamily: "DMSans_400Regular", color: colors.foreground }}
                placeholder="City (e.g. London)"
                placeholderTextColor={colors.mutedForeground}
                value={city}
                onChangeText={(v) => { setCity(v); saveLocation(v, country); }}
              />
              <TextInput
                style={{ backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, fontFamily: "DMSans_400Regular", color: colors.foreground }}
                placeholder="Country (e.g. United Kingdom)"
                placeholderTextColor={colors.mutedForeground}
                value={country}
                onChangeText={(v) => { setCountry(v); saveLocation(city, v); }}
              />
              <Text style={{ fontSize: 11, fontFamily: "DMSans_400Regular", color: colors.mutedForeground, lineHeight: 16 }}>
                Only your city and country are stored — no GPS used.
              </Text>
            </View>
            {/* Family account toggle */}
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14, borderTopWidth: 1, borderTopColor: colors.border }}>
              <View style={{ flex: 1, marginRight: 12 }}>
                <Text style={{ fontSize: 14, fontFamily: "DMSans_500Medium", color: colors.foreground }}>Family account 👨‍👩‍👧‍👦</Text>
                <Text style={{ fontSize: 12, fontFamily: "DMSans_400Regular", color: colors.mutedForeground, marginTop: 2, lineHeight: 16 }}>
                  {familyAccount ? "Chat moderation and safe messaging are active." : "Enable to read together with your family."}
                </Text>
              </View>
              <Switch
                value={familyAccount === true}
                onValueChange={(v) => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setFamilyAccount(v); }}
                trackColor={{ false: colors.border, true: colors.moodStrong + "60" }}
                thumbColor={familyAccount ? colors.moodStrong : colors.mutedForeground}
              />
            </View>
            {/* Under-16 toggle */}
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14, borderTopWidth: 1, borderTopColor: colors.border }}>
              <View style={{ flex: 1, marginRight: 12 }}>
                <Text style={{ fontSize: 14, fontFamily: "DMSans_500Medium", color: colors.foreground }}>Under 16 profile 🔒</Text>
                <Text style={{ fontSize: 12, fontFamily: "DMSans_400Regular", color: colors.mutedForeground, marginTop: 2, lineHeight: 16 }}>
                  {isUnder16 ? "Chat moderation is on." : "Turn on for readers under 16."}
                </Text>
              </View>
              <Switch
                value={isUnder16 === true}
                onValueChange={(v) => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setIsUnder16(v); if (v) setFamilyAccount(true); }}
                trackColor={{ false: colors.border, true: colors.moodStrong + "60" }}
                thumbColor={isUnder16 ? colors.moodStrong : colors.mutedForeground}
              />
            </View>
          </View>
        </View>

        {/* ── Sign out / delete ── */}
        <TouchableOpacity
          style={{ marginHorizontal: 20, borderRadius: 14, borderWidth: 1.5, borderColor: colors.destructive + "60", paddingVertical: 14, alignItems: "center" }}
          onPress={handleSignOut}
        >
          <Text style={{ fontSize: 14, fontFamily: "DMSans_600SemiBold", color: colors.destructive }}>Sign out</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{ marginHorizontal: 20, marginTop: 10, marginBottom: 4, borderRadius: 14, borderWidth: 1, borderColor: colors.destructive + "25", paddingVertical: 13, alignItems: "center" }}
          onPress={handleDeleteAccount}
        >
          <Text style={{ fontSize: 13, fontFamily: "DMSans_500Medium", color: colors.destructive + "99" }}>Delete account</Text>
        </TouchableOpacity>
      </ScrollView>

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
