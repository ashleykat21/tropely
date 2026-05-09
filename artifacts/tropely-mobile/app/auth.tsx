import { useSignIn, useSignUp } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "@/lib/haptics";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

type Mode = "signIn" | "signUp";

export default function AuthScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [mode, setMode] = useState<Mode>("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { signIn, setActive: setSignInActive } = useSignIn();
  const { signUp, setActive: setSignUpActive } = useSignUp();

  const handleSignIn = async () => {
    if (!signIn) return;
    setLoading(true);
    setError("");
    try {
      const result = await signIn.create({ identifier: email, password });
      if (result.status === "complete") {
        await setSignInActive({ session: result.createdSessionId });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (e: unknown) {
      console.error("[auth] sign-in error:", JSON.stringify(e));
      const err = e as { errors?: Array<{ message: string; code?: string }> };
      setError(err.errors?.[0]?.message ?? "Sign in failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!signUp) return;
    setLoading(true);
    setError("");
    try {
      await signUp.create({
        emailAddress: email,
        password,
        firstName: name.split(" ")[0],
        lastName: name.split(" ").slice(1).join(" ") || undefined,
      });
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setPendingVerification(true);
    } catch (e: unknown) {
      const err = e as { errors?: Array<{ message: string }> };
      setError(err.errors?.[0]?.message ?? "Sign up failed");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!signUp) return;
    setLoading(true);
    setError("");
    try {
      const result = await signUp.attemptEmailAddressVerification({ code });
      if (result.status === "complete") {
        await setSignUpActive({ session: result.createdSessionId });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (e: unknown) {
      const err = e as { errors?: Array<{ message: string }> };
      setError(err.errors?.[0]?.message ?? "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const s = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      paddingTop: Platform.OS === "web" ? 67 : insets.top,
      paddingBottom: Platform.OS === "web" ? 34 : insets.bottom,
    },
    inner: { flex: 1, paddingHorizontal: 28, justifyContent: "center" },
    logo: {
      width: 56, height: 56, borderRadius: 16,
      backgroundColor: colors.primary + "30",
      alignItems: "center", justifyContent: "center",
      marginBottom: 24,
    },
    title: {
      fontSize: 28, fontFamily: "Inter_700Bold",
      color: colors.foreground, marginBottom: 6,
    },
    subtitle: {
      fontSize: 15, fontFamily: "Inter_400Regular",
      color: colors.mutedForeground, marginBottom: 32,
    },
    tabs: {
      flexDirection: "row", backgroundColor: colors.secondary,
      borderRadius: 10, padding: 4, marginBottom: 24,
    },
    tab: {
      flex: 1, paddingVertical: 8, alignItems: "center",
      borderRadius: 8,
    },
    tabActive: { backgroundColor: colors.card },
    tabText: {
      fontSize: 14, fontFamily: "Inter_600SemiBold",
      color: colors.mutedForeground,
    },
    tabTextActive: { color: colors.foreground },
    input: {
      backgroundColor: colors.card,
      borderWidth: 1, borderColor: colors.border,
      borderRadius: 10, paddingHorizontal: 14, paddingVertical: 13,
      fontSize: 15, fontFamily: "Inter_400Regular",
      color: colors.foreground, marginBottom: 12,
    },
    error: {
      fontSize: 13, fontFamily: "Inter_400Regular",
      color: colors.destructive, marginBottom: 12, textAlign: "center",
    },
    btn: {
      backgroundColor: colors.primary, borderRadius: 12,
      paddingVertical: 14, alignItems: "center", marginTop: 4,
    },
    btnText: {
      fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#FFFFFF",
    },
  });

  return (
    <KeyboardAvoidingView
      style={s.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={s.inner}>
        <View style={s.logo}>
          <Ionicons name="book" size={28} color={colors.primary} />
        </View>
        <Text style={s.title}>Tropely</Text>
        <Text style={s.subtitle}>Track your reading by mood</Text>

        {pendingVerification ? (
          <>
            <Text style={[s.subtitle, { marginBottom: 16 }]}>
              Enter the code sent to {email}
            </Text>
            <TextInput
              style={s.input}
              placeholder="6-digit code"
              placeholderTextColor={colors.mutedForeground}
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
            />
            {!!error && <Text style={s.error}>{error}</Text>}
            <TouchableOpacity style={s.btn} onPress={handleVerify} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Verify email</Text>}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View style={s.tabs}>
              {(["signIn", "signUp"] as Mode[]).map((m) => (
                <Pressable
                  key={m}
                  style={[s.tab, mode === m && s.tabActive]}
                  onPress={() => { setMode(m); setError(""); }}
                >
                  <Text style={[s.tabText, mode === m && s.tabTextActive]}>
                    {m === "signIn" ? "Sign in" : "Sign up"}
                  </Text>
                </Pressable>
              ))}
            </View>

            {mode === "signUp" && (
              <TextInput
                style={s.input}
                placeholder="Your name"
                placeholderTextColor={colors.mutedForeground}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            )}
            <TextInput
              style={s.input}
              placeholder="Email"
              placeholderTextColor={colors.mutedForeground}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TextInput
              style={s.input}
              placeholder="Password"
              placeholderTextColor={colors.mutedForeground}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            {!!error && <Text style={s.error}>{error}</Text>}

            <TouchableOpacity
              style={s.btn}
              onPress={mode === "signIn" ? handleSignIn : handleSignUp}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={s.btnText}>
                  {mode === "signIn" ? "Sign in" : "Create account"}
                </Text>
              )}
            </TouchableOpacity>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}
