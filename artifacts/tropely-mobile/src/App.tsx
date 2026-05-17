import "react-native-url-polyfill/auto";
import React, { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as Linking from "expo-linking";
import { StatusBar } from "expo-status-bar";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { RootNavigator } from "@/navigation";
import { AuthScreen } from "@/screens/AuthScreen";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { auth } from "@/lib/firebase";
import { trackEvent, identifyUser } from "@/lib/analytics";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

function AppNavigator() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (user) {
      identifyUser(user.uid, { email: user.email ?? "" });
    }
  }, [user?.uid]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fafaf9" }}>
        <ActivityIndicator size="large" color="#1a1a1a" />
      </View>
    );
  }

  return user ? <RootNavigator /> : <AuthScreen />;
}

export default function App() {
  useEffect(() => {
    trackEvent("App Opened");

    const handleUrl = async ({ url }: { url: string }) => {
      if (url.includes("access_token") || url.includes("refresh_token")) {
        // Firebase handles deep links automatically
      }
    };

    const sub = Linking.addEventListener("url", handleUrl);
    Linking.getInitialURL().then((url) => {
      if (url) handleUrl({ url });
    });
    return () => sub.remove();
  }, []);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <SafeAreaProvider>
            <StatusBar style="auto" />
            <NavigationContainer>
              <AppNavigator />
            </NavigationContainer>
          </SafeAreaProvider>
        </QueryClientProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
