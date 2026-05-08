import { useMemo, useState } from "react";
import { useLibrary } from "@/lib/store";
import { bestReadingTime, suggestedSessionMinutes } from "@/lib/bestTime";
import { Clock, Bell, BellOff, Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { usePremium } from "@/lib/usePremium";
import { subscribeToPush, isPushSupported, setReminderPreferences } from "@/lib/push";
import { useNavigate } from "react-router-dom";

const REMINDER_KEY = "feltly-reading-reminder";

function getReminderPref(): { hour: number; label: string } | null {
  try { return JSON.parse(localStorage.getItem(REMINDER_KEY) ?? "null"); } catch { return null; }
}
function setReminderPref(hour: number, label: string) {
  localStorage.setItem(REMINDER_KEY, JSON.stringify({ hour, label }));
}
function clearReminderPref() {
  localStorage.removeItem(REMINDER_KEY);
}

export function BestTimeInsight() {
  const sessions = useLibrary((s) => s.sessions);
  const best = useMemo(() => bestReadingTime(sessions), [sessions]);
  const suggestedMin = useMemo(() => suggestedSessionMinutes(sessions), [sessions]);
  const isPremium = usePremium((s) => s.isPremium);
  const [reminderSet, setReminderSet] = useState(() => !!getReminderPref());
  const nav = useNavigate();

  if (!best) {
    return (
      <section className="rounded-2xl bg-card/70 p-6 border border-border/40">
        <div className="flex items-center gap-2 mb-1">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-display text-2xl">Your reading hour</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Log a few more sessions and we'll find the time of day you read best.
        </p>
      </section>
    );
  }

  const enableReminder = async () => {
    if (!isPushSupported()) {
      toast.error("This browser doesn't support push reminders. Try Chrome, Edge, or installing Tropely to your home screen on iOS 16.4+.");
      return;
    }
    const r = await subscribeToPush({ reminderHour: best!.hour, reminderLabel: best!.label });
    if (!r.ok) {
      toast.error(r.error ?? "Couldn't enable reminders.");
      return;
    }
    setReminderPref(best!.hour, best!.label);
    setReminderSet(true);
    const target = new Date();
    target.setHours(best!.hour, 0, 0, 0);
    if (target.getTime() <= Date.now()) target.setDate(target.getDate() + 1);
    toast.success(
      `Daily reminder set for ${target.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} — sent from the server, even when the app is closed.`,
    );
  };

  const disableReminder = async () => {
    await setReminderPreferences(null, null);
    clearReminderPref();
    setReminderSet(false);
    toast.message("Reading reminder turned off.");
  };

  return (
    <section className="rounded-2xl bg-card/70 p-6 border border-border/40 space-y-3">
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4" style={{ color: "var(--mood-strong)" }} />
        <h2 className="font-display text-2xl">Your reading hour</h2>
      </div>
      <p className="text-sm text-muted-foreground -mt-1">
        You read best around{" "}
        <span className="font-display text-foreground">{best.label}</span> —
        averaging <span className="text-foreground">{best.avgPages} pages</span> per session
        across <span className="text-foreground">{best.sessionCount}</span> reads.
      </p>
      {suggestedMin && (
        <p className="text-xs text-muted-foreground -mt-1">
          Try a <span className="text-foreground">{suggestedMin}-minute</span> session — that
          matches your usual rhythm.
        </p>
      )}
      {isPremium ? (
        reminderSet ? (
          <div className="flex items-center gap-2 flex-wrap">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/70 px-3 py-1.5 text-sm">
              <Bell className="h-3.5 w-3.5 text-sky-600" />
              Daily reminder at {best.label}
            </div>
            <Button variant="ghost" className="rounded-full" onClick={disableReminder}>
              <BellOff className="h-3.5 w-3.5 mr-1.5" /> Turn off
            </Button>
          </div>
        ) : (
          <Button variant="outline" className="rounded-full" onClick={enableReminder}>
            <Bell className="h-3.5 w-3.5 mr-1.5" /> Remind me daily at {best.label}
          </Button>
        )
      ) : (
        <Button
          variant="outline"
          className="rounded-full opacity-70"
          onClick={() => toast("Smart Reminders are Premium", {
            description: "Get a daily notification at your best reading hour. Upgrade to unlock.",
            icon: <Sparkles className="h-4 w-4" />,
            action: { label: "See plans", onClick: () => nav("/premium") },
          })}
        >
          <Lock className="h-3.5 w-3.5 mr-1.5" /> Remind me at {best.label}
        </Button>
      )}
    </section>
  );
}