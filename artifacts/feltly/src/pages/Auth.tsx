import { useState, useEffect } from "react";
import { useSignIn, useSignUp, useClerk, useUser } from "@clerk/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BookHeart, AlertCircle, AlertTriangle } from "lucide-react";

type Mode = "signin" | "signup" | "forgot" | "reset" | "verify";

const CLERK_INIT_TIMEOUT_MS = 30_000;

// Resolve session ID from whatever shape Clerk v6 returns
function extractSessionId(result: unknown): string | null {
  if (!result || typeof result !== "object") return null;
  const r = result as Record<string, unknown>;
  // Direct property
  if (typeof r.createdSessionId === "string" && r.createdSessionId) return r.createdSessionId;
  // Nested under signIn / signUp
  const nested = (r.signIn ?? r.signUp) as Record<string, unknown> | undefined;
  if (nested && typeof nested.createdSessionId === "string" && nested.createdSessionId)
    return nested.createdSessionId;
  // session object
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

const basePath = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

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

  // ── Google SSO ─────────────────────────────────────────────────────────────
  const handleGoogleSSO = async () => {
    if (!signIn || busy) return;
    setError("");
    setBusy(true);
    try {
      await signIn.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: `${window.location.origin}${basePath}/sign-in/sso-callback`,
        redirectUrlComplete: `${window.location.origin}/`,
      });
      // Clerk navigates the page to Google — control does not return here
    } catch (err) {
      setError(clerkErr(err));
      setBusy(false);
    }
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

        const result = await signUp.create({
          emailAddress: email,
          password: pwd,
          ...(name.trim() ? { firstName: name.trim() } : {}),
        });

        // Also read from the proxy getter in case result shape differs
        const sessionId = extractSessionId(result) ?? signUp.createdSessionId ?? null;
        const status = extractStatus(result);

        if ((status === "complete" || status === "active") && sessionId) {
          await setActive({ session: sessionId });
          return;
        }

        // Email verification required
        await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
        setMode("verify");
        setVerifyCode("");
        setBusy(false);

      } else {
        if (!signIn) { setError("Sign-in is not available. Please refresh."); setBusy(false); return; }

        const result = await signIn.create({ identifier: email, password: pwd });

        // Read session from result AND proxy getter
        const sessionId = extractSessionId(result) ?? signIn.createdSessionId ?? null;
        const status = extractStatus(result);

        console.debug("[Auth] signIn.create result:", { status, sessionId, result });

        if (sessionId) {
          await setActive({ session: sessionId });
          return;
        }

        if (status === "complete") {
          // session ID might be on the client directly
          const clientSessionId = (signIn as any)?.session?.id;
          if (clientSessionId) { await setActive({ session: clientSessionId }); return; }
        }

        if (status === "needs_first_factor" || status === "needs_identifier") {
          setError("Password sign-in is not enabled for this account. Try Google sign-in or reset your password.");
        } else {
          setError(`Incorrect email or password. Please try again.`);
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
      await signIn.resetPasswordEmailCode.sendCode({ identifier: email });
      setMode("reset");
    } catch (err) {
      setError(clerkErr(err));
    } finally {
      setBusy(false);
    }
  };

  // ── Forgot password — step 2: verify code + submit new password ────────────
  const confirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clerkReady || busy) return;
    if (!signIn) { setError("Sign-in is not available. Please refresh."); setBusy(false); return; }
    setError("");
    setBusy(true);
    try {
      await signIn.resetPasswordEmailCode.verifyCode({ code: resetCode });
      const result = await signIn.resetPasswordEmailCode.submitPassword({ password: newPwd });
      const sessionId = extractSessionId(result) ?? signIn.createdSessionId ?? null;
      if (sessionId) {
        await setActive({ session: sessionId });
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
      const result = await signUp.attemptEmailAddressVerification({ code: verifyCode });
      const sessionId = extractSessionId(result) ?? signUp.createdSessionId ?? null;
      console.debug("[Auth] verifyEmailCode result:", { result, sessionId });
      if (sessionId) {
        await setActive({ session: sessionId });
        return;
      }
      // Fallback: check Clerk client directly
      const status = extractStatus(result);
      if (status === "complete") {
        setError("Verification complete but no session found. Please try signing in.");
        switchMode("signin");
      } else {
        setError("Verification incomplete. Please check the code and try again.");
      }
      setBusy(false);
    } catch (err) {
      setError(clerkErr(err));
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

  // ── Clerk failed to initialise ────────────────────────────────────────────
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

  // ── render ─────────────────────────────────────────────────────────────────
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
            {mode === "verify" && `We sent a 6-digit code to ${email}.`}
          </p>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Google SSO — available on sign-in and sign-up screens */}
        {(mode === "signin" || mode === "signup") && (
          <button
            type="button"
            onClick={handleGoogleSSO}
            disabled={disabled}
            className="w-full flex items-center justify-center gap-3 rounded-full border border-border bg-background py-2.5 px-4 text-sm font-medium shadow-sm hover:bg-muted transition-colors disabled:opacity-50"
          >
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>
        )}

        {(mode === "signin" || mode === "signup") && (
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <div className="flex-1 h-px bg-border" />
            <span>or</span>
            <div className="flex-1 h-px bg-border" />
          </div>
        )}

        {(mode === "signin" || mode === "signup") && (
          <form onSubmit={submit} noValidate className="space-y-3">
            {mode === "signup" && (
              <div className="space-y-1.5">
                <Label htmlFor="auth-name">Display name</Label>
                <Input id="auth-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" autoComplete="name" disabled={disabled} />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="auth-email">Email</Label>
              <Input id="auth-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" disabled={disabled} />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="auth-pwd">Password</Label>
                {mode === "signin" && (
                  <button type="button" onClick={() => switchMode("forgot")} disabled={disabled} className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground disabled:opacity-50">
                    Forgot password?
                  </button>
                )}
              </div>
              <Input id="auth-pwd" type="password" required minLength={8} value={pwd} onChange={(e) => setPwd(e.target.value)} autoComplete={mode === "signup" ? "new-password" : "current-password"} disabled={disabled} />
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
              <Input id="reset-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" disabled={disabled} />
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
              <Input id="reset-code" required value={resetCode} onChange={(e) => setResetCode(e.target.value)} placeholder="6-digit code" autoComplete="one-time-code" disabled={disabled} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reset-newpwd">New password</Label>
              <Input id="reset-newpwd" type="password" required minLength={8} value={newPwd} onChange={(e) => setNewPwd(e.target.value)} autoComplete="new-password" disabled={disabled} />
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
              <Input id="verify-code" required value={verifyCode} onChange={(e) => setVerifyCode(e.target.value)} placeholder="6-digit code" autoComplete="one-time-code" inputMode="numeric" disabled={disabled} />
            </div>
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800 leading-relaxed">
              Check your spam / junk folder — dev-mode emails sometimes land there. Alternatively, go back and sign up with Google to skip email verification.
            </div>
            <Button type="submit" className="w-full rounded-full h-11" disabled={disabled}>
              {!clerkReady ? "Loading…" : busy ? "Verifying…" : "Verify email"}
            </Button>
            <button
              type="button"
              disabled={disabled}
              className="w-full text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground disabled:opacity-50"
              onClick={async () => {
                if (!signUp || busy) return;
                setBusy(true);
                setError("");
                try {
                  await signUp.verifications.sendEmailCode();
                } catch (err) {
                  setError(clerkErr(err));
                } finally {
                  setBusy(false);
                }
              }}
            >
              Resend code
            </button>
          </form>
        )}

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
