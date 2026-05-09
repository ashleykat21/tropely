import { SignIn as ClerkSignIn } from "@clerk/clerk-expo/web";
import React from "react";
import { useColors } from "@/hooks/useColors";

export default function AuthScreen() {
  const colors = useColors();

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: colors.background,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 16px",
      }}
    >
      <ClerkSignIn routing="hash" fallbackRedirectUrl="/" />
    </div>
  );
}
