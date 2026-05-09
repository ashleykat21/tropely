import { useState, useEffect } from "react";
import { useSignIn, useSignUp, useClerk, useUser } from "@clerk/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BookHeart, AlertCircle, AlertTriangle } from "lucide-react";

type Mode = "signin" | "signup" | "forgot" | "reset" | "verify";

// How long to wait for Clerk to initialise before declaring failure.
const CLERK_INIT_TIMEOUT_MS = 5_000;

export default function Auth() {
  // NOTE: no useNavigate / no useEffect(isSignedIn → nav).
  // Navigation happens automatically: once setActive() resolves Clerk marks
  // the user as signed-in, AuthProvider picks it up, AppGate switches from
  // <Auth/> to <Routes/>.  Calling nav() here races with that unmount.

  const { signIn } = useSignIn();
  const { signUp } = useSignUp();
  const { setActive } = useClerk();
  // In Clerk v6, isLoaded was removed from useSignIn()/useSignUp() return values.
  // Use useUser().isLoaded which reflects clerk.loaded correctly.
  const { isLoaded: clerkLoaded } = useUser();

  // True once Clerk has finished its initial load cycle.
  const clerkReady = clerkLoaded;

  // If Clerk hasn't initialised after CLERK_INIT_TIMEOUT_MS we declare
  // failure and show a key-status error instead of a frozen "Loading…".
  const [clerkFailed, setClerkFailed] = useState(false);
  useEffect(() => {
    if (clerkReady) return;
    const id = setTimeout(() => setClerkFailed(true), CLERK_INIT_TIMEOUT_MS);
    return () => clearTimeout(id);
  }, [clerkReady]);
  // Clear failed state if Clerk somehow resolves later.
  useEffect(() => {
    if (clerkReady) setClerkFailed(false);
  }, [clerkReady]);

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [name, setName] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Inputs and buttons are interactive only when Clerk is ready and not busy.
  const disabled = !clerkReady || busy;

  const clerkErr = (err: unknown) => {
    const e = err as { errors?: { longMessage?: string; message?: string }[]; message?: string };
    return e.errors?.[0]?.longMessage ?? e.errors?.[0]?.message ?? e.message ?? "Something went wrong.";
  };

  const switchMode = (next: Mode) => {
    setError("");
    setMode(next);
  };

  // ── sign in / sign up ──────────────────────────────────────────────────────
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clerkReady || busy) return;
    setError("");
    setBusy(true);
    try {
      if (mode === "signup") {
        const result = await signUp!.create({
          emailAddress: email,
          password: pwd,
          firstName: name || email.split("@")[0],
        });
        const r = result as { status?: string; createdSessionId?: string };
        if (r.status === "complete" && r.createdSessionId) {
          // Keep busy=true — AppGate unmounts this component once the session
          // propagates. Resetting busy here allows a re-render that can
          // disconnect the form and trigger "Form submission canceled".
          await setActive({ session: r.createdSessionId });
        } else {
          // Email verification required — send the code and show the verify step.
          await signUp!.prepareEmailAddressVerification({ strategy: "email_code" });
          setMode("verify");
          setVerifyCode("");
          setBusy(false);
        }
      } else {
        const result = await signIn!.create({ identifier: email, password: pwd });
        const r = result as { status?: string; createdSessionId?: string };
        if (r.status === "complete" && r.createdSessionId) {
          await setActive({ session: r.createdSessionId });
        } else {
          setError("Sign-in incomplete. Please try again.");
          setBusy(false);
        }
      }
    } catch (err) {
      setError(clerkErr(err));
      setBusy(false);
    }
  };

  // ── forgot password — step 1 ───────────────────────────────────────────────
  const sendReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clerkReady || busy) return;
    setError("");
    setBusy(true);
    try {
      await signIn!.create({ strategy: "reset_password_email_code", identifier: email });
      setMode("reset");
    } catch (err) {
      setError(clerkErr(err));
    } finally {
      setBusy(false);
    }
  };

  // ── forgot password — step 2 ───────────────────────────────────────────────
  const confirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clerkReady || busy) return;
    setError("");
    setBusy(true);
    try {
      const result = await signIn!.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code: resetCode,
        password: newPwd,
      } as Parameters<typeof signIn.attemptFirstFactor>[0]);
      const r = result as { status?: string; createdSessionId?: string };
      if (r.status === "complete" && r.createdSessionId) {
        await setActive({ session: r.createdSessionId });
      } else {
        setError("Reset incomplete. Please try again.");
        setBusy(false);
      }
    } catch (err) {
      setError(clerkErr(err));
      setBusy(false);
    }
  };

  // ── email verification — step after sign-up ───────────────────────────────
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clerkReady || busy) return;
    setError("");
    setBusy(true);
    try {
      const result = await signUp!.attemptEmailAddressVerification({ code: verifyCode });
      const r = result as { status?: string; createdSessionId?: string };
      if (r.status === "complete" && r.createdSessionId) {
        await setActive({ session: r.createdSessionId });
      } else {
        setError("Verification incomplete. Please try again.");
        setBusy(false);
      }
    } catch (err) {
      setError(clerkErr(err));
      setBusy(false);
    }
  };

  // ── submit button label ────────────────────────────────────────────────────
  const submitLabel = (): string => {
    if (!clerkReady) return "Loading…";
    if (busy) {
      if (mode === "signin") return "Signing in…";
      if (mode === "signup") return "Creating account…";
    }
    return mode === "signin" ? "Sign in" : "Create account";
  };

  // ── Clerk failed to initialise ────────────────────────────────────────────
  // Shown only when Clerk hasn't resolved within CLERK_INIT_TIMEOUT_MS.
  // Most common cause: VITE_CLERK_PUBLISHABLE_KEY is wrong or missing.
  if (clerkFailed && !clerkReady) {
    const keySnippet = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
      ? `${String(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY).slice(0, 14)}…`
      : "(not set)";
    return (
      <main className="min-h-screen grid place-items-center px-6 py-12 mood-surface">
        <div className="w-full max-w-md space-y-6 text-center">
          <div className="flex items-center gap-2 justify-center">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-foreground text-background">
              <BookHeart className="h-4 w-4" />
            </div>
            <div className="font-display text-2xl">Tropely</div>
          </div>
          <div className="flex flex-col items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-destructive" />
            <p className="font-medium">Authentication failed to load</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Clerk did not initialise within {CLERK_INIT_TIMEOUT_MS / 1000} seconds.
              Verify that <strong>VITE_CLERK_PUBLISHABLE_KEY</strong> is set correctly
              in your environment variables and that the Clerk application is active.
            </p>
            <p className="text-xs text-muted-foreground">
              Current key: <code className="bg-muted px-1 py-0.5 rounded">{keySnippet}</code>
            </p>
          </div>
        </div>
      </main>
    );
  }

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen grid place-items-center px-6 py-12 mood-surface">
      <div className="w-full max-w-md space-y-8">

        {/* Logo */}
        <div className="flex items-center gap-2 justify-center">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-foreground text-background">
            <BookHeart className="h-4 w-4" />
          </div>
          <div className="font-display text-2xl">Tropely</div>
        </div>

        {/* Heading */}
        <div className="space-y-2 text-center">
          <h1 className="font-display text-4xl leading-tight">
            {mode === "signin" && "Welcome back."}
            {mode === "signup" && "Begin your shelf."}
            {mode === "forgot" && "Reset password."}
            {mode === "reset" && "Enter your code."}
            {mode === "verify" && "Check your inbox."}
          </h1>
          <p className="text-muted-foreground text-sm">
            {mode === "signin" && "Pick up where the feeling left off."}
            {mode === "signup" && "Track reading by emotion, not stars."}
            {mode === "forgot" && "We'll email you a one-time reset code."}
            {mode === "reset" && "Check your inbox for the 6-digit code."}
            {mode === "verify" && `We sent a 6-digit code to ${email}.`}
          </p>
        </div>

        {/* Inline error */}
        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* ── Sign in / Sign up ── */}
        {(mode === "signin" || mode === "signup") && (
          <form onSubmit={submit} noValidate className="space-y-3">
            {mode === "signup" && (
              <div className="space-y-1.5">
                <Label htmlFor="auth-name">Display name</Label>
                <Input
                  id="auth-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  autoComplete="name"
                  disabled={disabled}
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="auth-email">Email</Label>
              <Input
                id="auth-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                disabled={disabled}
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="auth-pwd">Password</Label>
                {mode === "signin" && (
                  <button
                    type="button"
                    onClick={() => switchMode("forgot")}
                    disabled={disabled}
                    className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground disabled:opacity-50"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <Input
                id="auth-pwd"
                type="password"
                required
                minLength={8}
                value={pwd}
                onChange={(e) => setPwd(e.target.value)}
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                disabled={disabled}
              />
            </div>
            <Button type="submit" className="w-full rounded-full h-11" disabled={disabled}>
              {submitLabel()}
            </Button>
          </form>
        )}

        {/* ── Forgot — step 1 ── */}
        {mode === "forgot" && (
          <form onSubmit={sendReset} noValidate className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="reset-email">Email</Label>
              <Input
                id="reset-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                disabled={disabled}
              />
            </div>
            <Button type="submit" className="w-full rounded-full h-11" disabled={disabled}>
              {!clerkReady ? "Loading…" : busy ? "Sending…" : "Send reset code"}
            </Button>
          </form>
        )}

        {/* ── Forgot — step 2 ── */}
        {mode === "reset" && (
          <form onSubmit={confirmReset} noValidate className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="reset-code">Reset code</Label>
              <Input
                id="reset-code"
                required
                value={resetCode}
                onChange={(e) => setResetCode(e.target.value)}
                placeholder="6-digit code"
                autoComplete="one-time-code"
                disabled={disabled}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reset-newpwd">New password</Label>
              <Input
                id="reset-newpwd"
                type="password"
                required
                minLength={8}
                value={newPwd}
                onChange={(e) => setNewPwd(e.target.value)}
                autoComplete="new-password"
                disabled={disabled}
              />
            </div>
            <Button type="submit" className="w-full rounded-full h-11" disabled={disabled}>
              {!clerkReady ? "Loading…" : busy ? "Saving…" : "Set new password"}
            </Button>
          </form>
        )}

        {/* ── Email verification after sign-up ── */}
        {mode === "verify" && (
          <form onSubmit={handleVerify} noValidate className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="verify-code">Verification code</Label>
              <Input
                id="verify-code"
                required
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value)}
                placeholder="6-digit code"
                autoComplete="one-time-code"
                inputMode="numeric"
                disabled={disabled}
              />
            </div>
            <Button type="submit" className="w-full rounded-full h-11" disabled={disabled}>
              {!clerkReady ? "Loading…" : busy ? "Verifying…" : "Verify email"}
            </Button>
          </form>
        )}

        {/* ── Bottom link ── */}
        <p className="text-center text-sm text-muted-foreground">
          {mode === "signin" && (
            <>New here?{" "}
              <button type="button" onClick={() => switchMode("signup")} disabled={disabled} className="underline underline-offset-4 text-foreground disabled:opacity-50">
                Create an account
              </button>
            </>
          )}
          {mode === "signup" && (
            <>Already have an account?{" "}
              <button type="button" onClick={() => switchMode("signin")} disabled={disabled} className="underline underline-offset-4 text-foreground disabled:opacity-50">
                Sign in
              </button>
            </>
          )}
          {(mode === "forgot" || mode === "reset" || mode === "verify") && (
            <button type="button" onClick={() => switchMode("signin")} disabled={disabled} className="underline underline-offset-4 text-foreground disabled:opacity-50">
              Back to sign in
            </button>
          )}
        </p>

      </div>
    </main>
  );
}
