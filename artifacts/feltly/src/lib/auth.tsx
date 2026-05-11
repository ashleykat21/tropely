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
// key, CSP block, network error).
const MAX_LOADING_MS = 8_000;

// DEV-ONLY: provides a fake logged-in user so the UI is viewable without Clerk
function DevAuthProvider({ children }: { children: ReactNode }) {
  const fakeUser: AuthUser = { id: "dev-user", email: "dev@tropely.app", displayName: "Dev Preview" };
  return (
    <Ctx.Provider value={{ user: fakeUser, session: { user: fakeUser }, loading: false, signOut: async () => {} }}>
      {children}
    </Ctx.Provider>
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  if (import.meta.env.DEV) return <DevAuthProvider>{children}</DevAuthProvider>;
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { user, isLoaded } = useUser();
  // eslint-disable-next-line react-hooks/rules-of-hooks
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
