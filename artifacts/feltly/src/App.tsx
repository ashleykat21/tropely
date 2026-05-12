import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SignIn, SignUp } from "@clerk/react";
import { useState } from "react";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import Discover from "./pages/Discover.tsx";
import Journal from "./pages/Journal.tsx";
import Insights from "./pages/Insights.tsx";
import Social from "./pages/Social.tsx";
import Profile from "./pages/Profile.tsx";
import Companion from "./pages/Companion.tsx";
import Wrap from "./pages/Wrap.tsx";
import Twins from "./pages/Twins.tsx";
import BuddyReadsPage from "./pages/BuddyReads.tsx";
import BookDetail from "./pages/BookDetail.tsx";
import Library from "./pages/Library.tsx";
import Premium from "./pages/Premium.tsx";
import Tropes from "./pages/Tropes.tsx";
import PublicProfile from "./pages/PublicProfile.tsx";
import { AuthProvider, useAuth } from "@/lib/auth";
import { useLibrarySync } from "@/lib/useLibrarySync";
import { useCompanionFinishedToast } from "@/lib/useCompanionFinishedToast";
import { useSeriesFinishedPrompt } from "@/lib/useSeriesFinishedPrompt";
import { BookHeart } from "lucide-react";

// ── BUILD MARKER — must appear in dist grep ────────────────────────────────
const BUILD_MARKER = "FINAL AUTH BUILD - PASSWORD ONLY - NO EMAIL CODE";

const queryClient = new QueryClient();

// BASE_URL is "/" on native Capacitor builds; strip trailing slash for BrowserRouter basename.
const basePath = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");

// ── Side-effect runners ───────────────────────────────────────────────────────

function LibrarySyncRunner() {
  useLibrarySync();
  return null;
}

function CompanionFinishedToastRunner() {
  useCompanionFinishedToast();
  return null;
}

function SeriesFinishedPromptRunner() {
  useSeriesFinishedPrompt();
  return null;
}

// ── Debug banner — bright, visible in both auth and app screens ───────────────

function DebugBanner() {
  return (
    <div style={{
      background: "#ef4444",
      color: "#fff",
      fontWeight: 700,
      fontSize: 13,
      padding: "6px 16px",
      textAlign: "center",
      width: "100%",
      letterSpacing: "0.03em",
    }}>
      {BUILD_MARKER}
    </div>
  );
}

// ── Unauthenticated auth screen ───────────────────────────────────────────────
// Uses routing="hash" so Clerk internal navigation works in Capacitor WebView
// without a real server (no path-based redirects needed).

function AuthScreen() {
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");

  return (
    <div className="min-h-screen flex flex-col items-center mood-surface">
      <DebugBanner />
      <div className="flex flex-col items-center gap-6 w-full px-6 py-12">
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <button
            onClick={() => setMode("sign-in")}
            style={{
              padding: "8px 20px",
              background: mode === "sign-in" ? "#6366f1" : "#1e293b",
              color: mode === "sign-in" ? "#fff" : "#94a3b8",
              border: "1px solid #334155",
              borderRadius: 6,
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            Sign In
          </button>
          <button
            onClick={() => setMode("sign-up")}
            style={{
              padding: "8px 20px",
              background: mode === "sign-up" ? "#6366f1" : "#1e293b",
              color: mode === "sign-up" ? "#fff" : "#94a3b8",
              border: "1px solid #334155",
              borderRadius: 6,
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            Sign Up
          </button>
        </div>
        {mode === "sign-in" ? (
          <SignIn routing="hash" afterSignInUrl="/" />
        ) : (
          <SignUp routing="hash" afterSignUpUrl="/" />
        )}
      </div>
    </div>
  );
}

// ── Splash ────────────────────────────────────────────────────────────────────

function Splash() {
  return (
    <div className="min-h-screen grid place-items-center mood-surface">
      <div className="flex flex-col items-center gap-4 animate-pulse">
        <div className="grid h-12 w-12 place-items-center rounded-xl bg-foreground text-background">
          <BookHeart className="h-5 w-5" />
        </div>
        <p className="font-display text-2xl">Tropely</p>
      </div>
    </div>
  );
}

// ── Top-level gate ────────────────────────────────────────────────────────────

function AppGate() {
  const { user, loading } = useAuth();

  if (loading) return <Splash />;

  if (!user) {
    return <AuthScreen />;
  }

  return (
    <>
      <LibrarySyncRunner />
      <CompanionFinishedToastRunner />
      <SeriesFinishedPromptRunner />
      <DebugBanner />
      <Routes>
        <Route path="/"            element={<Index />} />
        <Route path="/discover"    element={<Discover />} />
        <Route path="/journal"     element={<Journal />} />
        <Route path="/insights"    element={<Insights />} />
        <Route path="/social"      element={<Social />} />
        <Route path="/profile"     element={<Profile />} />
        <Route path="/companion"   element={<Companion />} />
        <Route path="/wrap"        element={<Wrap />} />
        <Route path="/twins"       element={<Twins />} />
        <Route path="/buddy-reads" element={<BuddyReadsPage />} />
        <Route path="/library"     element={<Library />} />
        <Route path="/book/:id"    element={<BookDetail />} />
        <Route path="/premium"     element={<Premium />} />
        <Route path="/tropes"      element={<Tropes />} />
        <Route path="/u/:username" element={<PublicProfile />} />
        <Route path="*"            element={<NotFound />} />
      </Routes>
    </>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────
// ClerkProvider lives in main.tsx (wraps this component).

const App = () => (
  <BrowserRouter basename={basePath}>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Sonner />
        <AuthProvider>
          <AppGate />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </BrowserRouter>
);

export default App;
