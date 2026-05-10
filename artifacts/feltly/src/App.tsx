import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ClerkProvider, SignIn, SignUp } from "@clerk/react";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import Discover from "./pages/Discover.tsx";
import Journal from "./pages/Journal.tsx";
import Insights from "./pages/Insights.tsx";
import Social from "./pages/Social.tsx";
import Profile from "./pages/Profile.tsx";
import Companion from "./pages/Companion.tsx";
import Auth from "./pages/Auth.tsx";
import Wrap from "./pages/Wrap.tsx";
import Twins from "./pages/Twins.tsx";
import BuddyReadsPage from "./pages/BuddyReads.tsx";
import BookDetail from "./pages/BookDetail.tsx";
import Premium from "./pages/Premium.tsx";
import Tropes from "./pages/Tropes.tsx";
import PublicProfile from "./pages/PublicProfile.tsx";
import { AuthProvider, useAuth } from "@/lib/auth";
import { useLibrarySync } from "@/lib/useLibrarySync";
import { useCompanionFinishedToast } from "@/lib/useCompanionFinishedToast";
import { BookHeart, AlertTriangle } from "lucide-react";

const queryClient = new QueryClient();

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

// ── Side-effect runners ───────────────────────────────────────────────────────

function LibrarySyncRunner() {
  useLibrarySync();
  return null;
}

function CompanionFinishedToastRunner() {
  useCompanionFinishedToast();
  return null;
}

// ── Clerk-hosted fallback pages ───────────────────────────────────────────────

function SignInPage() {
  return (
    <div className="min-h-screen grid place-items-center px-6 py-12 mood-surface">
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="min-h-screen grid place-items-center px-6 py-12 mood-surface">
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
    </div>
  );
}

// ── Splash shown while Clerk initialises ──────────────────────────────────────

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

// ── Shown when VITE_CLERK_PUBLISHABLE_KEY is not configured ───────────────────

function MissingKeyScreen() {
  return (
    <div className="min-h-screen grid place-items-center mood-surface px-6">
      <div className="flex flex-col items-center gap-4 text-center max-w-sm">
        <div className="grid h-12 w-12 place-items-center rounded-xl bg-foreground text-background">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <p className="font-display text-2xl">Tropely</p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          <strong>VITE_CLERK_PUBLISHABLE_KEY</strong> is not set.
          Add it to your Netlify environment variables and redeploy.
        </p>
      </div>
    </div>
  );
}

// ── Top-level gate ────────────────────────────────────────────────────────────

function AppGate() {
  const { user, loading } = useAuth();

  if (loading) return <Splash />;

  if (!user) {
    return (
      <Routes>
        <Route path="/sign-in/*" element={<SignInPage />} />
        <Route path="/sign-up/*" element={<SignUpPage />} />
        <Route path="*"          element={<Auth />} />
      </Routes>
    );
  }

  return (
    <>
      <LibrarySyncRunner />
      <CompanionFinishedToastRunner />
      <Routes>
        <Route path="/"           element={<Index />} />
        <Route path="/discover"   element={<Discover />} />
        <Route path="/journal"    element={<Journal />} />
        <Route path="/insights"   element={<Insights />} />
        <Route path="/social"     element={<Social />} />
        <Route path="/profile"    element={<Profile />} />
        <Route path="/companion"  element={<Companion />} />
        <Route path="/wrap"       element={<Wrap />} />
        <Route path="/twins"      element={<Twins />} />
        <Route path="/buddy-reads" element={<BuddyReadsPage />} />
        <Route path="/book/:id"   element={<BookDetail />} />
        <Route path="/premium"    element={<Premium />} />
        <Route path="/tropes"     element={<Tropes />} />
        <Route path="/u/:username" element={<PublicProfile />} />
        <Route path="/sign-in/*"  element={<SignInPage />} />
        <Route path="/sign-up/*"  element={<SignUpPage />} />
        <Route path="*"           element={<NotFound />} />
      </Routes>
    </>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────

const App = () => {
  // Guard: if the Clerk publishable key was not injected at build time, show a
  // clear error instead of passing undefined to ClerkProvider, which would cause
  // Clerk to never resolve isLoaded and hang on the splash screen forever.
  if (!clerkPubKey) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Sonner />
          <MissingKeyScreen />
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
    >
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Sonner />
          <BrowserRouter basename={basePath}>
            <AuthProvider>
              <AppGate />
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
};

export default App;
