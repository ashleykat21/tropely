import { createContext, useContext, ReactNode, useEffect, useState } from "react";
import { useUser, useClerk } from "@clerk/react";

type AuthUser = { id: string; email?: string; displayName?: string };

type AuthCtx = {
  user: AuthUser | null;
  session: { user: AuthUser } | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
});

// Maximum time we will show the splash before forcing the app past the loading
// state. Guards against Clerk never resolving (e.g. missing/wrong publishable
// key, CSP block, network error, or domain lock on a live Clerk key).
// Kept short so the app stays responsive on native Capacitor where Clerk may
// be blocked by the capacitor://localhost origin not yet allowlisted.
const MAX_LOADING_MS = 4_000;

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user, isLoaded } = useUser();
  const { signOut: clerkSignOut } = useClerk();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (isLoaded) return;
    const id = setTimeout(() => setTimedOut(true), MAX_LOADING_MS);
    return () => clearTimeout(id);
  }, [isLoaded]);

  const authUser = user
    ? {
        id: user.id,
        email: user.primaryEmailAddress?.emailAddress,
        displayName:
          user.fullName ||
          user.username ||
          user.primaryEmailAddress?.emailAddress?.split("@")[0] ||
          "Reader",
      }
    : null;

  // Treat as resolved if Clerk confirmed OR if the safety timeout fired.
  const loading = !isLoaded && !timedOut;

  return (
    <Ctx.Provider
      value={{
        user: authUser,
        session: authUser ? { user: authUser } : null,
        loading,
        signOut: async () => {
          await clerkSignOut();
        },
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
