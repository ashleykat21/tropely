import { useState, useEffect } from "react";
import { useSignIn, useSignUp, useClerk, useUser } from "@clerk/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BookHeart, AlertCircle, AlertTriangle } from "lucide-react";

type Mode = "signin" | "signup" | "forgot" | "reset" | "verify";

const CLERK_INIT_TIMEOUT_MS = 30_000;

function withTimeout<T>(promise: Promise<T>, ms = 12_000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error(`Request timed out after ${ms / 1000}s. Check your connection and try again.`)),
        ms
      )
    ),
  ]);
}

function extractSessionId(result: unknown): string | null {
  if (!result || typeof result !== "object") return null;
  const r = result as Record<string, unknown>;
  if (typeof r.createdSessionId === "string" && r.createdSessionId) return r.createdSessionId;
  const nested = (r.signIn ?? r.signUp) as Record<string, unknown> | undefined;
  if (nested && typeof nested.createdSessionId === "string" && nested.createdSessionId)
    return nested.createdSessionId;
  const sess = r.session as Record<string, unknown> | undefined;
  if (sess && typeof sess.id === "string" && sess.id) return sess.id;
  return null;
}

function extractStatus(result: unknown): string {
  if (!result || typeof result !== "object") return "unknown";
  const r = result as Record<string, unknown>;
  if (typeof r.status === "string") return r.status;
  const nested = (r.signIn ?? r.signUp) as Record<string, unknown> | undefined;
  if (nested && typeof nested.status === "string") return nested.status;
  return "unknown";
}

export default function Auth() {
  const { signIn } = useSignIn() as any;
  const { signUp } = useSignUp() as any;
  const { setActive } = useClerk();
  const { isLoaded: clerkLoaded } = useUser();
  const clerkReady = clerkLoaded;

  const [clerkFailed, setClerkFailed] = useState(false);
  useEffect(() => {
    if (clerkReady) return;
    const id = setTimeout(() => setClerkFailed(true), CLERK_INIT_TIMEOUT_MS);
    return () => clearTimeout(id);
  }, [clerkReady]);
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

  const disabled = !clerkReady || busy;

  const clerkErr = (err: unknown) => {
    const e = err as { errors?: { longMessage?: string; message?: string }[]; message?: string };
    return e.errors?.[0]?.longMessage ?? e.errors?.[0]?.message ?? e.message ?? "Something went wrong.";
  };

  const switchMode = (next: Mode) => {
    setError("");
    setMode(next);
  };

  // ── Sign in / Sign up ──────────────────────────────────────────────────────
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clerkReady || busy) return;
    setError("");
    setBusy(true);
    try {
      if (mode === "signup") {
        if (!signUp) { setError("Sign-up is not available. Please refresh."); setBusy(false); return; }

        const result = await withTimeout(signUp.create({
          emailAddress: email,
          password: pwd,
          ...(name.trim() ? { firstName: name.trim() } : {}),
        }));

        const sessionId = extractSessionId(result) ?? signUp.createdSessionId ?? null;
        const status = extractStatus(result);

        // If Clerk already completed the sign-up (e.g. no verification needed)
        if ((status === "complete" || status === "active") && sessionId) {
          await withTimeout(setActive({ session: sessionId }));
          return;
        }

        // Trigger the email verification code — Clerk v6 correct API
        await withTimeout(
          signUp.prepareEmailAddressVerification({ strategy: "email_code" })
        );
        setMode("verify");
        setVerifyCode("");
        setBusy(false);

      } else {
        if (!signIn) { setError("Sign-in is not available. Please refresh."); setBusy(false); return; }

        const result = await withTimeout(signIn.create({ identifier: email, password: pwd }));

        const sessionId = extractSessionId(result) ?? signIn.createdSessionId ?? null;
        const status = extractStatus(result);

        console.debug("[Auth] signIn.create result:", { status, sessionId });

        if (sessionId) {
          await withTimeout(setActive({ session: sessionId }));
          return;
        }

        if (status === "complete") {
          const clientSessionId = (signIn as any)?.session?.id;
          if (clientSessionId) { await withTimeout(setActive({ session: clientSessionId })); return; }
        }

        if (status === "needs_first_factor" || status === "needs_identifier") {
          setError("Password sign-in is not enabled for this account. Try resetting your password.");
        } else {
          setError("Incorrect email or password. Please try again.");
        }
        setBusy(false);
      }
    } catch (err) {
      console.debug("[Auth] error:", err);
      setError(clerkErr(err));
      setBusy(false);
    }
  };

  // ── Forgot password — step 1 ───────────────────────────────────────────────
  const sendReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clerkReady || busy) return;
    if (!signIn) { setError("Sign-in is not available. Please refresh."); return; }
    setError("");
    setBusy(true);
    try {
      await withTimeout(signIn.resetPasswordEmailCode.sendCode({ identifier: email }));
      setMode("reset");
    } catch (err) {
      setError(clerkErr(err));
    } finally {
      setBusy(false);
    }
  };

  // ── Forgot password — step 2: verify code + new password ──────────────────
  const confirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clerkReady || busy) return;
    if (!signIn) { setError("Sign-in is not available. Please refresh."); setBusy(false); return; }
    setError("");
    setBusy(true);
    try {
      await withTimeout(signIn.resetPasswordEmailCode.verifyCode({ code: resetCode }));
      const result = await withTimeout(signIn.resetPasswordEmailCode.submitPassword({ password: newPwd }));
      const sessionId = extractSessionId(result) ?? signIn.createdSessionId ?? null;
      if (sessionId) {
        await withTimeout(setActive({ session: sessionId }));
        return;
      }
      setError("Reset incomplete. Please try again.");
      setBusy(false);
    } catch (err) {
      setError(clerkErr(err));
      setBusy(false);
    }
  };

  // ── Email verification after sign-up ──────────────────────────────────────
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clerkReady || busy) return;
    if (!signUp) { setError("Sign-up is not available. Please refresh."); setBusy(false); return; }
    setError("");
    setBusy(true);
    try {
      // Clerk v6 correct API for email code verification
      const result = await withTimeout(
        signUp.attemptEmailAddressVerification({ code: verifyCode })
      );
      console.debug("[Auth] attemptEmailAddressVerification result:", result);

      const sessionId = extractSessionId(result) ?? signUp.createdSessionId ?? null;
      const status = extractStatus(result);

      if (sessionId) {
        await withTimeout(setActive({ session: sessionId }));
        return;
      }

      if (status === "complete") {
        setError("Verification complete but no session found. Please try signing in.");
        switchMode("signin");
      } else {
        setError("Invalid or expired code. Please check and try again.");
      }
      setBusy(false);
    } catch (err) {
      setError(clerkErr(err));
      setBusy(false);
    }
  };

  // ── Resend verification code ───────────────────────────────────────────────
  const resendCode = async () => {
    if (!signUp || busy) return;
    setBusy(true);
    setError("");
    try {
      // Clerk v6 correct API
      await withTimeout(signUp.prepareEmailAddressVerification({ strategy: "email_code" }));
    } catch (err) {
      setError(clerkErr(err));
    } finally {
      setBusy(false);
    }
  };

  const submitLabel = (): string => {
    if (!clerkReady) return "Loading…";
    if (busy) {
      if (mode === "signin") return "Signing in…";
      if (mode === "signup") return "Creating account…";
    }
    return mode === "signin" ? "Sign in" : "Create account";
  };

  // ── Clerk failed to initialise ─────────────────────────────────────────────
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
              Verify that <strong>VITE_CLERK_PUBLISHABLE_KEY</strong> is set correctly.
            </p>
            <p className="text-xs text-muted-foreground">
              Current key: <code className="bg-muted px-1 py-0.5 rounded">{keySnippet}</code>
            </p>
          </div>
        </div>
      </main>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen grid place-items-center px-6 py-12 mood-surface">
      <div className="w-full max-w-md space-y-8">

        <div className="flex items-center gap-2 justify-center">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-foreground text-background">
            <BookHeart className="h-4 w-4" />
          </div>
          <div className="font-display text-2xl">Tropely</div>
        </div>

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
            {mode === "reset" && "Check your inbox for the 6-digit code, then set a new password."}
            {mode === "verify" && `We sent a verification code to ${email}.`}
          </p>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

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
            <div className="rounded-lg border border-border/60 bg-muted/40 px-3 py-2.5 text-xs text-muted-foreground leading-relaxed">
              Check your spam or junk folder if you don't see it within a minute.
            </div>
            <Button type="submit" className="w-full rounded-full h-11" disabled={disabled}>
              {!clerkReady ? "Loading…" : busy ? "Verifying…" : "Verify email"}
            </Button>
            <button
              type="button"
              disabled={disabled}
              className="w-full text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground disabled:opacity-50"
              onClick={resendCode}
            >
              Resend code
            </button>
          </form>
        )}

        <p className="text-center text-sm text-muted-foreground">
          {mode === "signin" && (
            <>New here?{" "}
              <button
                type="button"
                onClick={() => switchMode("signup")}
                disabled={disabled}
                className="underline underline-offset-4 text-foreground disabled:opacity-50"
              >
                Create an account
              </button>
            </>
          )}
          {mode === "signup" && (
            <>Already have an account?{" "}
              <button
                type="button"
                onClick={() => switchMode("signin")}
                disabled={disabled}
                className="underline underline-offset-4 text-foreground disabled:opacity-50"
              >
                Sign in
              </button>
            </>
          )}
          {(mode === "forgot" || mode === "reset" || mode === "verify") && (
            <button
              type="button"
              onClick={() => switchMode("signin")}
              disabled={disabled}
              className="underline underline-offset-4 text-foreground disabled:opacity-50"
            >
              Back to sign in
            </button>
          )}
        </p>

      </div>
    </main>
  );
}
