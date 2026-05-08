import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
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
import { AuthProvider } from "@/lib/auth";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/discover" element={<Discover />} />
            <Route path="/journal" element={<Journal />} />
            <Route path="/insights" element={<Insights />} />
            <Route path="/social" element={<Social />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/companion" element={<Companion />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/wrap" element={<Wrap />} />
            <Route path="/twins" element={<Twins />} />
            <Route path="/book/:id" element={<BookDetail />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
