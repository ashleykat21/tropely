import { useState } from "react";
import { useFamilyStore, type FamilyProfile } from "@/lib/familyStore";
import { switchToProfile } from "@/lib/profileSwitch";
import { usePremium } from "@/lib/usePremium";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { Plus, Pencil, Trash2, Lock, ShieldCheck, Check, X, Users } from "lucide-react";
import { toast } from "sonner";

function ageLabel(n: number): string {
  if (n === 0) return "—";
  if (n >= 18) return "18+";
  return String(n);
}

const AVATARS = [
  "📖", "🧒", "👦", "👧", "🧑", "👩", "👨", "👵", "👴",
  "🦊", "🐱", "🐻", "🌟", "🦋", "🌈", "🎨", "🎮", "🌙", "⭐", "🌸",
];

const FREE_PROFILE_CAP = 2;

type EditState = {
  name: string;
  emoji: string;
  age: number;
  role: "parent" | "child";
  pinStep: "view" | "set";
  pinDraft: string;
  pinConfirm: string;
};

function makeEditState(p: FamilyProfile): EditState {
  return {
    name: p.name,
    emoji: p.emoji,
    age: p.age != null ? Math.min(p.age, 18) : 0,
    role: p.role,
    pinStep: "view",
    pinDraft: "",
    pinConfirm: "",
  };
}

function ProfileRow({
  profile,
  isActive,
  onSwitch,
}: {
  profile: FamilyProfile;
  isActive: boolean;
  onSwitch: () => void;
}) {
  const { updateProfile, removeProfile, profiles } = useFamilyStore();
  const [editing, setEditing] = useState(false);
  const [state, setState] = useState<EditState>(() => makeEditState(profile));

  const parentCount = profiles.filter((p) => p.role === "parent").length;
  const canDelete = !(profile.role === "parent" && parentCount <= 1);

  const saveEdit = () => {
    if (!state.name.trim()) return;
    updateProfile(profile.id, {
      name: state.name.trim(),
      emoji: state.emoji,
      age: state.age > 0 ? state.age : undefined,
      role: state.role,
    });
    setEditing(false);
    toast.success("Profile updated.");
  };

  const savePin = () => {
    if (state.pinDraft.length < 4 || state.pinDraft !== state.pinConfirm) return;
    updateProfile(profile.id, { switchPin: state.pinDraft });
    setState((s) => ({ ...s, pinStep: "view", pinDraft: "", pinConfirm: "" }));
    toast.success("Switch PIN saved.");
  };

  const removePin = () => {
    updateProfile(profile.id, { switchPin: undefined });
    toast.success("Switch PIN removed.");
  };

  const handleDelete = () => {
    if (!canDelete) return;
    if (!window.confirm(`Remove ${profile.name} from family profiles? Their reading data will remain saved.`)) return;
    removeProfile(profile.id);
    if (isActive) switchToProfile("default");
    toast.success(`${profile.name} removed.`);
  };

  if (!editing) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-border/40 bg-background/40 px-3 py-2.5">
        <span className="text-2xl leading-none shrink-0">{profile.emoji}</span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-sm truncate">{profile.name}</span>
            {isActive && (
              <span className="rounded-full bg-foreground text-background text-[9px] uppercase tracking-wider px-1.5 py-0.5 font-medium">
                Active
              </span>
            )}
            {profile.switchPin && (
              <span title="PIN protected">
                <Lock className="h-3 w-3 text-muted-foreground shrink-0" />
              </span>
            )}
          </div>
          <div className="text-[11px] text-muted-foreground capitalize">
            {profile.role}{profile.age != null ? ` · ${profile.age} yrs` : ""}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {!isActive && (
            <Button size="sm" variant="ghost" className="h-7 rounded-full text-xs px-2.5" onClick={onSwitch}>
              Switch
            </Button>
          )}
          <button
            onClick={() => { setState(makeEditState(profile)); setEditing(true); }}
            className="inline-grid h-7 w-7 place-items-center rounded-full text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition"
          >
            <Pencil className="h-3 w-3" />
          </button>
          {canDelete && (
            <button
              onClick={handleDelete}
              className="inline-grid h-7 w-7 place-items-center rounded-full text-muted-foreground hover:text-red-500 hover:bg-red-50 transition"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/50 bg-background/60 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Edit profile</span>
        <button onClick={() => setEditing(false)} className="text-muted-foreground hover:text-foreground transition">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Emoji picker */}
      <div className="flex flex-wrap gap-1.5">
        {AVATARS.map((em) => (
          <button
            key={em}
            onClick={() => setState((s) => ({ ...s, emoji: em }))}
            className={cn(
              "h-9 w-9 rounded-xl text-xl transition",
              state.emoji === em ? "bg-foreground/10 ring-1 ring-foreground/30" : "hover:bg-foreground/5"
            )}
          >
            {em}
          </button>
        ))}
      </div>

      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">Name</label>
        <Input
          value={state.name}
          onChange={(e) => setState((s) => ({ ...s, name: e.target.value }))}
          placeholder="Name"
          className="h-8"
          maxLength={24}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs text-muted-foreground">Age</label>
          <span className="text-xs font-medium tabular-nums">{ageLabel(state.age)}</span>
        </div>
        <Slider
          min={0}
          max={18}
          step={1}
          value={[state.age]}
          onValueChange={([v]) => setState((s) => ({ ...s, age: v }))}
        />
        <p className="text-[10px] text-muted-foreground">Drag left to skip age</p>
      </div>

      <div className="flex gap-2">
        {(["parent", "child"] as const).map((r) => (
          <button
            key={r}
            onClick={() => setState((s) => ({ ...s, role: r }))}
            className={cn(
              "flex-1 rounded-full border py-1.5 text-xs transition capitalize",
              state.role === r
                ? "bg-foreground text-background border-foreground"
                : "border-border text-muted-foreground hover:text-foreground"
            )}
          >
            {r}
          </button>
        ))}
      </div>

      {/* Switch PIN section */}
      <div className="border-t border-border/40 pt-3 space-y-2">
        <p className="text-xs text-muted-foreground">
          <Lock className="h-3 w-3 inline mr-1" />
          Switch PIN — require a PIN to switch <em>to</em> this profile.
        </p>
        {state.pinStep === "view" ? (
          <div className="flex items-center gap-2 flex-wrap">
            {profile.switchPin ? (
              <>
                <span className="text-xs rounded-full border border-border/60 px-2.5 py-1 flex items-center gap-1">
                  <Lock className="h-3 w-3" /> PIN set ••••
                </span>
                <Button size="sm" variant="outline" className="rounded-full h-7 text-xs"
                  onClick={() => setState((s) => ({ ...s, pinStep: "set", pinDraft: "", pinConfirm: "" }))}>
                  Change
                </Button>
                <Button size="sm" variant="ghost" className="rounded-full h-7 text-xs text-muted-foreground"
                  onClick={removePin}>
                  Remove
                </Button>
              </>
            ) : (
              <Button size="sm" variant="outline" className="rounded-full h-7 text-xs gap-1.5"
                onClick={() => setState((s) => ({ ...s, pinStep: "set" }))}>
                <Lock className="h-3 w-3" /> Add PIN
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={state.pinDraft}
                onChange={(e) => setState((s) => ({ ...s, pinDraft: e.target.value.replace(/\D/g, "").slice(0, 4) }))}
                placeholder="New PIN"
                className="text-center tracking-[0.4em] font-display h-8 w-24"
              />
              <Input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={state.pinConfirm}
                onChange={(e) => setState((s) => ({ ...s, pinConfirm: e.target.value.replace(/\D/g, "").slice(0, 4) }))}
                placeholder="Confirm"
                className="text-center tracking-[0.4em] font-display h-8 w-24"
              />
            </div>
            {state.pinDraft.length === 4 && state.pinConfirm.length === 4 && state.pinDraft !== state.pinConfirm && (
              <p className="text-[11px] text-red-500">PINs don't match.</p>
            )}
            <div className="flex gap-2">
              <Button size="sm" className="rounded-full h-7 text-xs gap-1"
                disabled={state.pinDraft.length < 4 || state.pinDraft !== state.pinConfirm}
                onClick={savePin}>
                <ShieldCheck className="h-3 w-3" /> Save PIN
              </Button>
              <Button size="sm" variant="ghost" className="rounded-full h-7 text-xs"
                onClick={() => setState((s) => ({ ...s, pinStep: "view" }))}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2 pt-1">
        <Button size="sm" className="rounded-full flex-1" onClick={saveEdit} disabled={!state.name.trim()}>
          <Check className="h-3 w-3 mr-1" /> Save
        </Button>
        <Button size="sm" variant="ghost" className="rounded-full" onClick={() => setEditing(false)}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

type AddState = { name: string; emoji: string; age: number; role: "parent" | "child" };

export function ManageFamilySheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { profiles, activeProfileId, addProfile } = useFamilyStore();
  const isPremium = usePremium((s) => s.isPremium);
  const [showAdd, setShowAdd] = useState(false);
  const [add, setAdd] = useState<AddState>({ name: "", emoji: "🧒", age: 0, role: "child" });

  const canAdd = isPremium || profiles.length < FREE_PROFILE_CAP;

  const handleAdd = () => {
    if (!add.name.trim()) return;
    const name = add.name.trim();
    const newId = addProfile({
      name,
      emoji: add.emoji,
      age: add.age > 0 ? add.age : undefined,
      role: add.role,
    });
    setAdd({ name: "", emoji: "🧒", age: 0, role: "child" });
    setShowAdd(false);
    toast.success(`${name} added to family!`, {
      description: "Stay on your profile or switch to theirs.",
      action: { label: "Switch now", onClick: () => { switchToProfile(newId); onClose(); } },
      duration: 8000,
    });
  };

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="pb-2">
          <SheetTitle className="font-display text-2xl flex items-center gap-2">
            <Users className="h-5 w-5" /> Family profiles
          </SheetTitle>
        </SheetHeader>

        <p className="text-sm text-muted-foreground mb-5">
          Each family member gets their own reading library, shelves, and streak. Switch between profiles any time.
        </p>

        <div className="space-y-2 mb-5">
          {profiles.map((p) => (
            <ProfileRow
              key={p.id}
              profile={p}
              isActive={p.id === activeProfileId}
              onSwitch={() => {
                switchToProfile(p.id);
                onClose();
                toast.success(`Reading as ${p.name}`);
              }}
            />
          ))}
        </div>

        {!showAdd ? (
          canAdd ? (
            <Button
              variant="outline"
              className="w-full rounded-full gap-2"
              onClick={() => setShowAdd(true)}
            >
              <Plus className="h-4 w-4" /> Add family member
            </Button>
          ) : (
            <div className="rounded-xl border border-dashed border-border/60 p-4 text-center text-sm text-muted-foreground">
              <Lock className="h-4 w-4 mx-auto mb-1.5 text-muted-foreground" />
              Free accounts support up to {FREE_PROFILE_CAP} profiles.
              Upgrade to Premium for unlimited family members.
            </div>
          )
        ) : (
          <div className="rounded-xl border border-border/50 bg-card/60 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">New family member</p>
              <button onClick={() => setShowAdd(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Emoji picker */}
            <div className="flex flex-wrap gap-1.5">
              {AVATARS.map((em) => (
                <button
                  key={em}
                  onClick={() => setAdd((s) => ({ ...s, emoji: em }))}
                  className={cn(
                    "h-9 w-9 rounded-xl text-xl transition",
                    add.emoji === em ? "bg-foreground/10 ring-1 ring-foreground/30" : "hover:bg-foreground/5"
                  )}
                >
                  {em}
                </button>
              ))}
            </div>

            <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Name</label>
                <Input
                  value={add.name}
                  onChange={(e) => setAdd((s) => ({ ...s, name: e.target.value }))}
                  placeholder="e.g. Lola"
                  className="h-8"
                  maxLength={24}
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-muted-foreground">Age</label>
                  <span className="text-xs font-medium tabular-nums">{ageLabel(add.age)}</span>
                </div>
                <Slider
                  min={0}
                  max={18}
                  step={1}
                  value={[add.age]}
                  onValueChange={([v]) => setAdd((s) => ({ ...s, age: v }))}
                />
                <p className="text-[10px] text-muted-foreground">Drag left to skip age</p>
              </div>

            <div className="flex gap-2">
              {(["child", "parent"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setAdd((s) => ({ ...s, role: r }))}
                  className={cn(
                    "flex-1 rounded-full border py-1.5 text-xs transition capitalize",
                    add.role === r
                      ? "bg-foreground text-background border-foreground"
                      : "border-border text-muted-foreground hover:text-foreground"
                  )}
                >
                  {r}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <Button
                className="flex-1 rounded-full"
                disabled={!add.name.trim()}
                onClick={handleAdd}
              >
                <Plus className="h-4 w-4 mr-1" /> Add & switch
              </Button>
              <Button variant="ghost" className="rounded-full" onClick={() => setShowAdd(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
