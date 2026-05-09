import { createContext, useContext, ReactNode } from "react";
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user, isLoaded } = useUser();
  const { signOut: clerkSignOut } = useClerk();

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

  return (
    <Ctx.Provider
      value={{
        user: authUser,
        session: authUser ? { user: authUser } : null,
        loading: !isLoaded,
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
