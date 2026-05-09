import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useSignIn, useSignUp, useUser, useClerk } from "@clerk/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BookHeart } from "lucide-react";
import { toast } from "sonner";

export default function Auth() {
  const nav = useNavigate();
  const { isSignedIn } = useUser();
  const { signIn } = useSignIn();
  const { signUp } = useSignUp();
  const { setActive } = useClerk();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (isSignedIn) nav("/", { replace: true });
  }, [isSignedIn, nav]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        if (!signUp) throw new Error("Not ready");
        const result = await signUp.create({
          emailAddress: email,
          password: pwd,
          firstName: name || email.split("@")[0],
        });
        const r = result as { status?: string; createdSessionId?: string };
        if (r.status === "complete" && r.createdSessionId) {
          await setActive({ session: r.createdSessionId });
          toast.success("Welcome to Tropely.");
          nav("/", { replace: true });
        } else {
          toast.success("Check your email to verify your account.");
        }
      } else {
        if (!signIn) throw new Error("Not ready");
        const result = await signIn.create({ identifier: email, password: pwd });
        const r = result as { status?: string; createdSessionId?: string };
        if (r.status === "complete" && r.createdSessionId) {
          await setActive({ session: r.createdSessionId });
          toast.success("Welcome back.");
          nav("/", { replace: true });
        }
      }
    } catch (err: unknown) {
      const clerkErr = err as { errors?: { message: string }[]; message?: string };
      toast.error(clerkErr.errors?.[0]?.message ?? clerkErr.message ?? "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  const google = () => {
    nav("/sign-in");
  };

  return (
    <main className="min-h-screen grid place-items-center px-6 py-12 mood-surface">
      <div className="w-full max-w-md space-y-8">
        <Link to="/" className="flex items-center gap-2 justify-center">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-foreground text-background">
            <BookHeart className="h-4 w-4" />
          </div>
          <div className="font-display text-2xl">Tropely</div>
        </Link>

        <div className="space-y-2 text-center">
          <h1 className="font-display text-4xl leading-tight">
            {mode === "signin" ? "Welcome back." : "Begin your shelf."}
          </h1>
          <p className="text-muted-foreground text-sm">
            {mode === "signin" ? "Pick up where the feeling left off." : "Track reading by emotion, not stars."}
          </p>
        </div>

        <Button variant="outline" className="w-full rounded-full h-11" onClick={google} disabled={busy}>
          Continue with Google
        </Button>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <div className="h-px flex-1 bg-border" /> or <div className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={submit} className="space-y-3">
          {mode === "signup" && (
            <div className="space-y-1.5">
              <Label>Display name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
            </div>
          )}
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Password</Label>
            <Input type="password" required minLength={6} value={pwd} onChange={(e) => setPwd(e.target.value)} />
          </div>
          <Button type="submit" className="w-full rounded-full h-11" disabled={busy}>
            {mode === "signin" ? "Sign in" : "Create account"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          {mode === "signin" ? "New here? " : "Already have an account? "}
          <button
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="underline underline-offset-4 text-foreground"
          >
            {mode === "signin" ? "Create an account" : "Sign in"}
          </button>
        </p>
      </div>
    </main>
  );
}
