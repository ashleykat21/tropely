import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { apiGet } from "@/lib/api";

interface Twin {
  userId: string;
  displayName: string | null;
  city: string | null;
  country: string | null;
  score: number;
  sharedMoods: string[];
  sharedGenres: string[];
  proximity: "city" | "country" | "worldwide";
}

function ProximityBadge({ proximity, city, country }: { proximity: Twin["proximity"]; city: string | null; country: string | null }) {
  const colors = useColors();
  if (proximity === "city" && city) {
    return (
      <View style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#22c55e20", borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 }}>
        <Text style={{ fontSize: 11 }}>📍</Text>
        <Text style={{ fontSize: 11, fontFamily: "Inter_600SemiBold", color: "#22c55e" }}>Nearby · {city}</Text>
      </View>
    );
  }
  if (proximity === "country" && country) {
    return (
      <View style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#3b82f620", borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 }}>
        <Text style={{ fontSize: 11 }}>🌍</Text>
        <Text style={{ fontSize: 11, fontFamily: "Inter_600SemiBold", color: "#3b82f6" }}>Same country · {country}</Text>
      </View>
    );
  }
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: colors.muted, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 }}>
      <Text style={{ fontSize: 11 }}>🌐</Text>
      <Text style={{ fontSize: 11, fontFamily: "Inter_400Regular", color: colors.mutedForeground }}>Worldwide</Text>
    </View>
  );
}

function ScoreRing({ score }: { score: number }) {
  const colors = useColors();
  const color = score >= 70 ? "#a855f7" : score >= 50 ? "#ec4899" : "#f59e0b";
  return (
    <View style={{ alignItems: "center", justifyContent: "center", width: 54, height: 54, borderRadius: 27, borderWidth: 3, borderColor: color + "40", backgroundColor: color + "15" }}>
      <Text style={{ fontSize: 17, fontFamily: "Inter_700Bold", color }}>{score}</Text>
      <Text style={{ fontSize: 8, fontFamily: "Inter_400Regular", color: colors.mutedForeground, marginTop: -2 }}>match</Text>
    </View>
  );
}

function TwinCard({ twin }: { twin: Twin }) {
  const colors = useColors();
  const initials = twin.displayName
    ? twin.displayName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  return (
    <View style={[{
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      gap: 12,
    }]}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary + "20", alignItems: "center", justifyContent: "center" }}>
          <Text style={{ fontSize: 16, fontFamily: "Inter_700Bold", color: colors.primary }}>{initials}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontFamily: "Inter_600SemiBold", color: colors.foreground }}>
            {twin.displayName ?? "Reader"}
          </Text>
          <View style={{ marginTop: 4 }}>
            <ProximityBadge proximity={twin.proximity} city={twin.city} country={twin.country} />
          </View>
        </View>
        <ScoreRing score={twin.score} />
      </View>

      {twin.sharedMoods.length > 0 && (
        <View>
          <Text style={{ fontSize: 11, fontFamily: "Inter_500Medium", color: colors.mutedForeground, marginBottom: 6 }}>SHARED MOODS</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
            {twin.sharedMoods.slice(0, 5).map((m) => (
              <View key={m} style={{ backgroundColor: colors.primary + "18", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 }}>
                <Text style={{ fontSize: 12, fontFamily: "Inter_500Medium", color: colors.primary }}>{m}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {twin.sharedGenres.length > 0 && (
        <View>
          <Text style={{ fontSize: 11, fontFamily: "Inter_500Medium", color: colors.mutedForeground, marginBottom: 6 }}>SHARED GENRES</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
            {twin.sharedGenres.slice(0, 4).map((g) => (
              <View key={g} style={{ backgroundColor: colors.muted, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 }}>
                <Text style={{ fontSize: 12, fontFamily: "Inter_400Regular", color: colors.mutedForeground }}>{g}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

export default function TwinsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [twins, setTwins] = useState<Twin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet<Twin[]>("/api/reading-twins");
      setTwins(data);
    } catch {
      setError("Could not load reading twins. Try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      paddingTop: Platform.OS === "web" ? 67 : insets.top + 12,
      paddingHorizontal: 20,
      paddingBottom: 16,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    backBtn: {
      width: 38, height: 38, borderRadius: 12,
      backgroundColor: colors.card,
      borderWidth: 1, borderColor: colors.border,
      alignItems: "center", justifyContent: "center",
    },
    titleBlock: { flex: 1 },
    title: { fontSize: 22, fontFamily: "Inter_700Bold", color: colors.foreground },
    subtitle: { fontSize: 13, fontFamily: "Inter_400Regular", color: colors.mutedForeground, marginTop: 2 },
    body: { flex: 1, paddingHorizontal: 20 },
    center: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 40 },
    emptyText: { fontSize: 15, fontFamily: "Inter_400Regular", color: colors.mutedForeground, textAlign: "center", marginTop: 12, lineHeight: 22 },
    tipCard: {
      backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
      borderRadius: 14, padding: 14, marginBottom: 16, flexDirection: "row", gap: 10, alignItems: "flex-start",
    },
    tipText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", color: colors.mutedForeground, lineHeight: 19 },
  });

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={18} color={colors.foreground} />
        </TouchableOpacity>
        <View style={s.titleBlock}>
          <Text style={s.title}>Reading Twins 👯</Text>
          <Text style={s.subtitle}>Readers who match your taste</Text>
        </View>
        <TouchableOpacity onPress={load}>
          <Feather name="refresh-cw" size={18} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={s.emptyText}>Finding your reading twins…</Text>
        </View>
      ) : error ? (
        <View style={s.center}>
          <Feather name="wifi-off" size={40} color={colors.mutedForeground} />
          <Text style={s.emptyText}>{error}</Text>
          <TouchableOpacity onPress={load} style={{ marginTop: 16, backgroundColor: colors.primary, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10 }}>
            <Text style={{ color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 14 }}>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : twins.length === 0 ? (
        <View style={s.center}>
          <Text style={{ fontSize: 40 }}>👯</Text>
          <Text style={s.emptyText}>
            No twins found yet. Complete your taste profile in Settings and add more books to get matched.
          </Text>
        </View>
      ) : (
        <ScrollView style={s.body} contentContainerStyle={{ paddingBottom: insets.bottom + 30 }} showsVerticalScrollIndicator={false}>
          <View style={[s.tipCard, { marginTop: 4 }]}>
            <Text style={{ fontSize: 16 }}>💡</Text>
            <Text style={s.tipText}>
              Sorted by proximity first — nearby readers appear at the top. Set your city in Profile to see who's close to you.
            </Text>
          </View>
          {twins.map((t) => <TwinCard key={t.userId} twin={t} />)}
        </ScrollView>
      )}
    </View>
  );
}
