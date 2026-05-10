import { useState } from "react";
import { SignIn, SignUp } from "@clerk/react";
import { BookHeart } from "lucide-react";

const basePath = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

const clerkAppearance = {
  variables: {
    colorPrimary: "#2C1810",
    colorBackground: "#FAF8F5",
    colorInputBackground: "#EDE4D9",
    colorInputText: "#2C1810",
    colorText: "#2C1810",
    colorTextSecondary: "#7C6A5A",
    colorDanger: "#c0392b",
    borderRadius: "1.5rem",
    fontFamily: "inherit",
    fontSize: "0.9375rem",
    spacingUnit: "1rem",
  },
  elements: {
    rootBox: "w-full",
    card: "shadow-none bg-transparent p-0 gap-5",
    header: "hidden",
    headerTitle: "hidden",
    headerSubtitle: "hidden",
    socialButtonsBlockButton:
      "rounded-full border border-[#D6C9BA] bg-white hover:bg-[#F5EFE8] text-[#2C1810] text-sm font-medium h-11 shadow-none transition-colors",
    socialButtonsBlockButtonText: "font-medium",
    dividerRow: "my-2",
    dividerText: "text-[#7C6A5A] text-xs",
    formFieldLabel: "text-sm font-medium text-[#2C1810]",
    formFieldInput:
      "rounded-2xl border-[#D6C9BA] bg-[#EDE4D9] text-[#2C1810] placeholder:text-[#B0967F] focus:border-[#2C1810] focus:ring-0 h-11",
    formButtonPrimary:
      "rounded-full bg-[#2C1810] hover:bg-[#3D2418] text-white text-sm font-medium h-11 shadow-none transition-colors",
    footerActionLink: "text-[#2C1810] underline underline-offset-4 font-normal",
    footerActionText: "text-[#7C6A5A] text-sm",
    footer: "mt-2",
    alert: "rounded-2xl",
    identityPreviewText: "text-[#2C1810]",
    identityPreviewEditButton: "text-[#2C1810]",
  },
};

type Mode = "signin" | "signup";

export default function Auth() {
  const [mode, setMode] = useState<Mode>("signin");

  return (
    <main className="min-h-screen grid place-items-center px-6 py-12 mood-surface">
      <div className="w-full max-w-md space-y-8">

        {/* Tropely branding */}
        <div className="space-y-2 text-center">
          <div className="flex items-center gap-2 justify-center mb-4">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-foreground text-background">
              <BookHeart className="h-4 w-4" />
            </div>
            <div className="font-display text-2xl">Tropely</div>
          </div>
          <h1 className="font-display text-4xl leading-tight">
            {mode === "signin" ? "Welcome back." : "Begin your shelf."}
          </h1>
          <p className="text-muted-foreground text-sm">
            {mode === "signin"
              ? "Pick up where the feeling left off."
              : "Track reading by emotion, not stars."}
          </p>
        </div>

        {/* Clerk embedded component */}
        {mode === "signin" ? (
          <SignIn
            routing="hash"
            appearance={clerkAppearance}
            signUpUrl="#signup"
            forceRedirectUrl="/"
          />
        ) : (
          <SignUp
            routing="hash"
            appearance={clerkAppearance}
            signInUrl="#signin"
            forceRedirectUrl="/"
          />
        )}

        {/* Manual mode toggle */}
        <p className="text-center text-sm text-muted-foreground">
          {mode === "signin" ? (
            <>New here?{" "}
              <button
                type="button"
                onClick={() => setMode("signup")}
                className="underline underline-offset-4 text-foreground"
              >
                Create an account
              </button>
            </>
          ) : (
            <>Already have an account?{" "}
              <button
                type="button"
                onClick={() => setMode("signin")}
                className="underline underline-offset-4 text-foreground"
              >
                Sign in
              </button>
            </>
          )}
        </p>

      </div>
    </main>
  );
}
