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
  Alert,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSignIn, useSignUp } from "@clerk/clerk-expo";

type AuthView = "welcome" | "signin" | "signup" | "verify";

const BG: Record<AuthView, string> = {
  welcome: "#e0e7ff",
  signin: "#fce7f3",
  signup: "#d1fae5",
  verify: "#d1fae5",
};

export function AuthScreen() {
  const [view, setView] = useState<AuthView>("welcome");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const { signIn, setActive: setSignInActive, isLoaded: signInLoaded } = useSignIn();
  const { signUp, setActive: setSignUpActive, isLoaded: signUpLoaded } = useSignUp();

  const handleSignIn = async () => {
    if (!signInLoaded) return;
    setLoading(true);
    try {
      const result = await signIn.create({ identifier: email, password });
      if (result.status === "complete") {
        await setSignInActive({ session: result.createdSessionId });
      }
    } catch (err: any) {
      Alert.alert("Sign in failed", err?.errors?.[0]?.message ?? err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!signUpLoaded) return;
    setLoading(true);
    try {
      const [firstName, ...rest] = name.trim().split(" ");
      const lastName = rest.join(" ") || undefined;
      await signUp.create({ emailAddress: email, password, firstName, lastName });
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setView("verify");
    } catch (err: any) {
      Alert.alert("Sign up failed", err?.errors?.[0]?.message ?? err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!signUpLoaded) return;
    setLoading(true);
    try {
      const result = await signUp.attemptEmailAddressVerification({ code });
      if (result.status === "complete") {
        await setSignUpActive({ session: result.createdSessionId });
      }
    } catch (err: any) {
      Alert.alert("Verification failed", err?.errors?.[0]?.message ?? err.message);
    } finally {
      setLoading(false);
    }
  };

  const bg = BG[view];

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
              onPress={() => setView("signup")}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryBtnText}>Get started</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.ghostBtn}
              onPress={() => setView("signin")}
              activeOpacity={0.7}
            >
              <Text style={styles.ghostBtnText}>Sign in</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ── Verify ───────────────────────────────────────────────────────────────────

  if (view === "verify") {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: bg }]} edges={["top", "bottom"]}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <TouchableOpacity style={styles.backBtn} onPress={() => setView("signup")}>
            <Text style={styles.backBtnText}>← Back</Text>
          </TouchableOpacity>
          <View style={styles.formWrap}>
            <Text style={styles.heading}>Check your email</Text>
            <Text style={styles.formSub}>We sent a code to {email}</Text>
            <TextInput
              style={styles.input}
              placeholder="6-digit code"
              placeholderTextColor="#9ca3af"
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              autoComplete="one-time-code"
            />
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={handleVerify}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.primaryBtnText}>Verify email</Text>}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ── Sign In ──────────────────────────────────────────────────────────────────

  if (view === "signin") {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: bg }]} edges={["top", "bottom"]}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <TouchableOpacity style={styles.backBtn} onPress={() => setView("welcome")}>
            <Text style={styles.backBtnText}>← Back</Text>
          </TouchableOpacity>
          <ScrollView
            contentContainerStyle={styles.formWrap}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.heading}>Welcome back</Text>
            <Text style={styles.formSub}>Sign in to your reading list</Text>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#9ca3af"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#9ca3af"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="current-password"
            />
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={handleSignIn}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.primaryBtnText}>Sign in</Text>}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.linkBtn}
              onPress={() => setView("signup")}
            >
              <Text style={styles.linkBtnText}>
                No account?{" "}
                <Text style={styles.linkBold}>Create one</Text>
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ── Sign Up ──────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bg }]} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => setView("welcome")}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <ScrollView
          contentContainerStyle={styles.formWrap}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.heading}>Create your account</Text>
          <Text style={styles.formSub}>Start your trope-first reading journey</Text>
          <TextInput
            style={styles.input}
            placeholder="Your name"
            placeholderTextColor="#9ca3af"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            autoComplete="name"
          />
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#9ca3af"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#9ca3af"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="new-password"
          />
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={handleSignUp}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.primaryBtnText}>Create account</Text>}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.linkBtn}
            onPress={() => setView("signin")}
          >
            <Text style={styles.linkBtnText}>
              Already have an account?{" "}
              <Text style={styles.linkBold}>Sign in</Text>
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
  wordmark: {
    fontSize: 56,
    fontWeight: "800",
    color: "#1a1a1a",
    letterSpacing: -2,
  },
  heroTagline: {
    fontSize: 22,
    fontWeight: "600",
    color: "#1a1a1a",
    letterSpacing: -0.3,
  },
  heroSub: {
    fontSize: 15,
    color: "#4b5563",
    lineHeight: 22,
  },
  welcomeBtns: { gap: 12 },

  // Shared form layout
  backBtn: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 4 },
  backBtnText: { fontSize: 15, color: "#6b7280", fontWeight: "500" },
  formWrap: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 28,
    paddingBottom: 48,
    gap: 14,
  },
  heading: {
    fontSize: 32,
    fontWeight: "800",
    color: "#1a1a1a",
    letterSpacing: -0.5,
  },
  formSub: {
    fontSize: 15,
    color: "#6b7280",
    marginTop: -6,
    marginBottom: 6,
  },

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
});
