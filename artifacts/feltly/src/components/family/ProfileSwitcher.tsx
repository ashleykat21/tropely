import { useState } from "react";
import { useFamilyStore } from "@/lib/familyStore";
import { switchToProfile } from "@/lib/profileSwitch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ManageFamilySheet } from "@/components/family/ManageFamilySheet";
import { cn } from "@/lib/utils";
import { Lock, Users } from "lucide-react";
import { toast } from "sonner";

export function ProfileSwitcher() {
  const { profiles, activeProfileId } = useFamilyStore();
  const activeProfile = profiles.find((p) => p.id === activeProfileId) ?? profiles[0];
  const [open, setOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);

  const doSwitch = (id: string) => {
    const profile = profiles.find((p) => p.id === id);
    if (!profile) return;
    switchToProfile(id);
    setOpen(false);
    setPendingId(null);
    toast.success(`Reading as ${profile.name}`);
  };

  const handleProfileClick = (id: string) => {
    if (id === activeProfileId) return;
    const profile = profiles.find((p) => p.id === id);
    if (!profile) return;
    if (profile.switchPin) {
      setPendingId(id);
      setPinInput("");
      setPinError(false);
    } else {
      doSwitch(id);
    }
  };

  const handlePinSubmit = () => {
    if (!pendingId) return;
    const profile = profiles.find((p) => p.id === pendingId);
    if (!profile) return;
    if (pinInput === profile.switchPin) {
      doSwitch(pendingId);
    } else {
      setPinError(true);
      setPinInput("");
    }
  };

  return (
    <>
      <Popover open={open} onOpenChange={(v) => { setOpen(v); if (!v) setPendingId(null); }}>
        <PopoverTrigger asChild>
          <button
            title={`Reading as ${activeProfile?.name ?? "Me"}`}
            className="inline-grid h-9 w-9 place-items-center rounded-full border border-border/60 bg-card/70 backdrop-blur transition hover:bg-card text-base leading-none"
          >
            {activeProfile?.emoji ?? "📖"}
          </button>
        </PopoverTrigger>

        <PopoverContent className="w-72 p-4 space-y-3" align="end">
          {pendingId ? (
            <>
              <p className="text-sm font-medium">
                Enter PIN for {profiles.find((p) => p.id === pendingId)?.name}
              </p>
              <Input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value.replace(/\D/g, "").slice(0, 4));
                  setPinError(false);
                }}
                onKeyDown={(e) => { if (e.key === "Enter" && pinInput.length === 4) handlePinSubmit(); }}
                placeholder="••••"
                className={cn(
                  "text-center tracking-[0.5em] font-display h-10",
                  pinError && "border-red-400 focus-visible:ring-red-300"
                )}
                autoFocus
              />
              {pinError && <p className="text-xs text-red-500">Incorrect PIN. Try again.</p>}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1 rounded-full"
                  disabled={pinInput.length < 4}
                  onClick={handlePinSubmit}
                >
                  Unlock
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="rounded-full"
                  onClick={() => setPendingId(null)}
                >
                  Cancel
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Switch reader</p>
              <div className="flex flex-wrap gap-2">
                {profiles.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleProfileClick(p.id)}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-xl px-3 py-2 transition hover:bg-foreground/5 min-w-[4rem]",
                      p.id === activeProfileId && "bg-foreground/[0.07] ring-1 ring-foreground/20"
                    )}
                    title={p.switchPin ? `${p.name} (PIN protected)` : p.name}
                  >
                    <span className="text-2xl leading-none">{p.emoji}</span>
                    <span className="text-[11px] text-muted-foreground truncate max-w-[5rem]">{p.name}</span>
                    {p.switchPin && (
                      <Lock className="h-2.5 w-2.5 text-muted-foreground" />
                    )}
                  </button>
                ))}
              </div>
              <div className="border-t border-border/40 pt-2">
                <button
                  onClick={() => { setOpen(false); setManageOpen(true); }}
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition"
                >
                  <Users className="h-3.5 w-3.5" /> Manage family
                </button>
              </div>
            </>
          )}
        </PopoverContent>
      </Popover>

      <ManageFamilySheet open={manageOpen} onClose={() => setManageOpen(false)} />
    </>
  );
}
