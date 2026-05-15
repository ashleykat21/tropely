import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Linking from "expo-linking";
import { useAuth } from "@/context/AuthContext";

type AuthView = "welcome" | "signin" | "magic";

const BG: Record<AuthView, string> = {
  welcome: "#e0e7ff",
  signin: "#fce7f3",
  magic: "#d1fae5",
};

export function AuthScreen() {
  const { signInWithEmail, signInWithPassword, signUpWithPassword } = useAuth();
  const [view, setView] = useState<AuthView>("welcome");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);

  const bg = BG[view];

  const clearError = () => setFieldError(null);

  // ── Welcome ──────────────────────────────────────────────────────────────────

  if (view === "welcome") {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: bg }]} edges={["top", "bottom"]}>
        <View style={styles.welcomeWrap}>
          <View style={styles.heroArea}>
            <Text style={styles.wordmark}>Tropely</Text>
            <Text style={styles.heroTagline}>Read by trope, not just title.</Text>
            <Text style={styles.heroSub}>
              Track your books through the tropes that make you obsessed —
              enemies-to-lovers, slow burn, found family, and more.
            </Text>
          </View>
          <View style={styles.welcomeBtns}>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => { setIsCreatingAccount(true); setView("signin"); }}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryBtnText}>Get started</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.ghostBtn}
              onPress={() => { setIsCreatingAccount(false); setView("signin"); }}
              activeOpacity={0.7}
            >
              <Text style={styles.ghostBtnText}>Sign in</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ── Magic link sent ──────────────────────────────────────────────────────────

  if (view === "magic") {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: bg }]} edges={["top", "bottom"]}>
        <View style={styles.magicSent}>
          <Text style={styles.magicEmoji}>✨</Text>
          <Text style={styles.magicTitle}>Check your email</Text>
          <Text style={styles.magicSub}>
            We sent a sign in link to {email}. Tap it to open Tropely automatically.
          </Text>
          <TouchableOpacity style={styles.openEmailBtn} onPress={() => Linking.openURL("mailto:")}>
            <Text style={styles.openEmailBtnText}>Open email app</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setView("signin")}>
            <Text style={styles.linkBtnText}>← Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Sign In / Sign Up ────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!email.trim()) { setFieldError("Enter your email."); return; }
    clearError();
    setLoading(true);
    try {
      if (isCreatingAccount) {
        if (password !== confirmPassword) { setFieldError("Passwords don't match"); setLoading(false); return; }
        const { error } = await signUpWithPassword(email.trim(), password);
        if (error) setFieldError(error);
      } else {
        const { error } = await signInWithPassword(email.trim(), password);
        if (error) setFieldError(error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLink = async () => {
    if (!email.trim()) { setFieldError("Enter your email first."); return; }
    clearError();
    setLoading(true);
    try {
      const { error } = await signInWithEmail(email.trim());
      if (error) setFieldError(error);
      else setView("magic");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bg }]} edges={["top", "bottom"]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <TouchableOpacity style={styles.backBtn} onPress={() => setView("welcome")}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <ScrollView contentContainerStyle={styles.formWrap} keyboardShouldPersistTaps="handled">
          <Text style={styles.heading}>
            {isCreatingAccount ? "Create your account" : "Welcome back"}
          </Text>
          <Text style={styles.formSub}>
            {isCreatingAccount ? "Start your trope-first reading journey" : "Sign in to your reading list"}
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#9ca3af"
            value={email}
            onChangeText={(t) => { setEmail(t); clearError(); }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#9ca3af"
            value={password}
            onChangeText={(t) => { setPassword(t); clearError(); }}
            secureTextEntry
            autoComplete={isCreatingAccount ? "new-password" : "current-password"}
          />
          {isCreatingAccount && (
            <TextInput
              style={styles.input}
              placeholder="Confirm password"
              placeholderTextColor="#9ca3af"
              value={confirmPassword}
              onChangeText={(t) => { setConfirmPassword(t); clearError(); }}
              secureTextEntry
              autoComplete="new-password"
            />
          )}

          {fieldError && <Text style={styles.errorText}>{fieldError}</Text>}

          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryBtnText}>
                {isCreatingAccount ? "Create account" : "Sign in"}
              </Text>
            )}
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={styles.ghostBtn}
            onPress={handleMagicLink}
            disabled={loading}
            activeOpacity={0.7}
          >
            <Text style={styles.ghostBtnText}>Send magic link instead</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkBtn}
            onPress={() => { setIsCreatingAccount(!isCreatingAccount); clearError(); }}
          >
            <Text style={styles.linkBtnText}>
              {isCreatingAccount ? (
                <>Already have an account? <Text style={styles.linkBold}>Sign in</Text></>
              ) : (
                <>No account? <Text style={styles.linkBold}>Create one</Text></>
              )}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },

  // Welcome
  welcomeWrap: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: 28,
    paddingTop: 60,
    paddingBottom: 48,
  },
  heroArea: { gap: 16 },
  wordmark: { fontSize: 56, fontWeight: "800", color: "#1a1a1a", letterSpacing: -2 },
  heroTagline: { fontSize: 22, fontWeight: "600", color: "#1a1a1a", letterSpacing: -0.3 },
  heroSub: { fontSize: 15, color: "#4b5563", lineHeight: 22 },
  welcomeBtns: { gap: 12 },

  // Shared form
  backBtn: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 4 },
  backBtnText: { fontSize: 15, color: "#6b7280", fontWeight: "500" },
  formWrap: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 28,
    paddingBottom: 48,
    gap: 14,
  },
  heading: { fontSize: 32, fontWeight: "800", color: "#1a1a1a", letterSpacing: -0.5 },
  formSub: { fontSize: 15, color: "#6b7280", marginTop: -6, marginBottom: 6 },

  // Inputs
  input: {
    backgroundColor: "rgba(255,255,255,0.85)",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 15,
    fontSize: 16,
    color: "#1a1a1a",
    borderWidth: 1,
    borderColor: "rgba(26,26,26,0.08)",
  },

  // Error
  errorText: { fontSize: 13, color: "#dc2626", marginTop: -4 },

  // Buttons
  primaryBtn: {
    backgroundColor: "#1a1a1a",
    borderRadius: 14,
    paddingVertical: 17,
    alignItems: "center",
    marginTop: 4,
  },
  primaryBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  ghostBtn: {
    borderRadius: 14,
    paddingVertical: 17,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "rgba(26,26,26,0.18)",
    backgroundColor: "rgba(255,255,255,0.5)",
  },
  ghostBtnText: { color: "#374151", fontSize: 16, fontWeight: "600" },
  linkBtn: { alignItems: "center", paddingVertical: 6 },
  linkBtnText: { fontSize: 14, color: "#6b7280" },
  linkBold: { fontWeight: "700", color: "#1a1a1a" },

  // Divider
  divider: { flexDirection: "row", alignItems: "center", gap: 8, marginVertical: 4 },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#e5e7eb" },
  dividerText: { fontSize: 12, color: "#9ca3af" },

  // Magic link
  magicSent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    padding: 32,
  },
  magicEmoji: { fontSize: 48 },
  magicTitle: { fontSize: 22, fontWeight: "700", color: "#1a1a1a", textAlign: "center" },
  magicSub: { fontSize: 14, color: "#6b7280", textAlign: "center", lineHeight: 20 },
  openEmailBtn: {
    backgroundColor: "#1a1a1a",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 28,
  },
  openEmailBtnText: { color: "#fff", fontSize: 15, fontWeight: "600" },
});
