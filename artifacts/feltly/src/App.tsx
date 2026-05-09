import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
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
import BookDetail from "./pages/BookDetail.tsx";
import Premium from "./pages/Premium.tsx";
import Tropes from "./pages/Tropes.tsx";
import { AuthProvider } from "@/lib/auth";
import { useLibrarySync } from "@/lib/useLibrarySync";
import { useCompanionFinishedToast } from "@/lib/useCompanionFinishedToast";

const queryClient = new QueryClient();

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string;

const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL as string | undefined;

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

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

function LibrarySyncRunner() {
  useLibrarySync();
  return null;
}

function CompanionFinishedToastRunner() {
  useCompanionFinishedToast();
  return null;
}

const App = () => (
  <ClerkProvider
    publishableKey={clerkPubKey!}
    proxyUrl={clerkProxyUrl}
    signInUrl={`${basePath}/sign-in`}
    signUpUrl={`${basePath}/sign-up`}
  >
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Sonner />
        <BrowserRouter basename={basePath}>
          <AuthProvider>
            <LibrarySyncRunner />
            <CompanionFinishedToastRunner />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/discover" element={<Discover />} />
              <Route path="/journal" element={<Journal />} />
              <Route path="/insights" element={<Insights />} />
              <Route path="/social" element={<Social />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/companion" element={<Companion />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/sign-in/*" element={<SignInPage />} />
              <Route path="/sign-up/*" element={<SignUpPage />} />
              <Route path="/wrap" element={<Wrap />} />
              <Route path="/twins" element={<Twins />} />
              <Route path="/book/:id" element={<BookDetail />} />
              <Route path="/premium" element={<Premium />} />
              <Route path="/tropes" element={<Tropes />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ClerkProvider>
);

export default App;
