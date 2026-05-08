import { useState, type ReactNode } from "react";
import { useLibrary } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock, ShieldCheck } from "lucide-react";

interface Props {
  children: ReactNode;
}

export function ParentalGate({ children }: Props) {
  const age = useLibrary((s) => s.age);
  const parentalPin = useLibrary((s) => s.parentalPin);
  const [unlocked, setUnlocked] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);

  if (!age || age > 10 || !parentalPin) return <>{children}</>;
  if (unlocked) return <>{children}</>;

  const tryUnlock = () => {
    if (pin === parentalPin) {
      setUnlocked(true);
      setError(false);
    } else {
      setError(true);
      setPin("");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6 py-12 animate-fade-up">
      <div className="grid h-16 w-16 place-items-center rounded-2xl bg-foreground text-background shadow-soft">
        <Lock className="h-7 w-7" />
      </div>
      <div className="text-center space-y-1.5 max-w-xs">
        <h2 className="font-display text-2xl">Parent unlock</h2>
        <p className="text-sm text-muted-foreground">
          This section is locked for young readers. Enter the parental PIN to continue.
        </p>
      </div>
      <div className="flex flex-col items-center gap-3 w-full max-w-xs">
        <Input
          type="password"
          inputMode="numeric"
          maxLength={4}
          value={pin}
          onChange={(e) => {
            setPin(e.target.value.replace(/\D/g, "").slice(0, 4));
            setError(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && pin.length === 4) tryUnlock();
          }}
          placeholder="4-digit PIN"
          className={`text-center text-xl tracking-[0.5em] font-display h-12 ${
            error ? "border-red-400 focus-visible:ring-red-300" : ""
          }`}
          autoFocus
        />
        {error && (
          <p className="text-xs text-red-500">Incorrect PIN. Try again.</p>
        )}
        <Button
          className="w-full rounded-full"
          onClick={tryUnlock}
          disabled={pin.length < 4}
        >
          <ShieldCheck className="h-4 w-4 mr-2" />
          Unlock
        </Button>
      </div>
    </div>
  );
}
