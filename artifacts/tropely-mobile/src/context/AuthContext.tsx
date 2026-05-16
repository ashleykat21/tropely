import React, { createContext, useContext, useEffect, useState } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithOtp,
  sendSignInLinkToEmail,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signInWithEmail: (email: string) => Promise<{ error: string | null }>;
  signInWithPassword: (email: string, password: string) => Promise<{ error: string | null }>;
  signUpWithPassword: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  getToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  const signInWithEmail = async (email: string) => {
    try {
      await sendSignInLinkToEmail(auth, email, {
        url: "tropely://auth/callback",
        handleCodeInApp: true,
        iOS: { bundleId: "com.nevora.tropely" },
      });
      return { error: null };
    } catch (e: any) {
      return { error: e.message };
    }
  };

  const signInWithPassword = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return { error: null };
    } catch (e: any) {
      return { error: e.message };
    }
  };

  const signUpWithPassword = async (email: string, password: string) => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      return { error: null };
    } catch (e: any) {
      return { error: e.message };
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  const getToken = async () => {
    return user ? await user.getIdToken() : null;
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      signInWithEmail,
      signInWithPassword,
      signUpWithPassword,
      signOut,
      getToken,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

export function useUser() {
  const { user } = useAuth();
  return user;
}
