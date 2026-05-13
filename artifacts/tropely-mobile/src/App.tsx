import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ClerkProvider, useAuth, SignedIn, SignedOut } from "@clerk/clerk-expo";
import { tokenCache } from "@/lib/tokenCache";
import { setBaseUrl, setAuthTokenGetter } from "@workspace/api-client-react";
import { RootNavigator } from "@/navigation";
import { AuthScreen } from "@/screens/AuthScreen";
import { StatusBar } from "expo-status-bar";

// Point the shared API client at the production server
setBaseUrl(process.env.EXPO_PUBLIC_API_BASE_URL ?? "https://usenevora.com");

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

const PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

// Wire the Clerk session token into the API client so every
// request includes Authorization: Bearer <token>
function ClerkTokenBridge({ children }: { children: React.ReactNode }) {
  const { getToken } = useAuth();
  React.useEffect(() => {
    setAuthTokenGetter(() => getToken());
    return () => setAuthTokenGetter(null);
  }, [getToken]);
  return <>{children}</>;
}

export default function App() {
  return (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} tokenCache={tokenCache}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <StatusBar style="auto" />
          <NavigationContainer>
            <SignedIn>
              <ClerkTokenBridge>
                <RootNavigator />
              </ClerkTokenBridge>
            </SignedIn>
            <SignedOut>
              <AuthScreen />
            </SignedOut>
          </NavigationContainer>
        </SafeAreaProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}
