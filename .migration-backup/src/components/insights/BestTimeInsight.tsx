import { useMemo } from "react";
import { useLibrary } from "@/lib/store";
import { bestReadingTime, suggestedSessionMinutes } from "@/lib/bestTime";
import { Clock, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function BestTimeInsight() {
  const sessions = useLibrary((s) => s.sessions);
  const best = useMemo(() => bestReadingTime(sessions), [sessions]);
  const suggestedMin = useMemo(() => suggestedSessionMinutes(sessions), [sessions]);

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
    if (!("Notification" in window)) {
      return toast.error("This browser doesn't support reminders.");
    }
    let perm = Notification.permission;
    if (perm === "default") perm = await Notification.requestPermission();
    if (perm !== "granted") return toast.error("Reminder permission denied.");

    // Schedule a one-shot today at best.hour. If past, schedule for tomorrow.
    const now = new Date();
    const target = new Date();
    target.setHours(best.hour, 0, 0, 0);
    if (target.getTime() <= now.getTime()) target.setDate(target.getDate() + 1);
    const ms = target.getTime() - now.getTime();
    setTimeout(() => {
      try {
        new Notification("Feltly — your reading hour", {
          body: `You read best around ${best.label}. A few quiet pages?`,
          icon: "/icon-192.png",
        });
      } catch {}
    }, ms);
    toast.success(`Reminder set for ${target.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.`);
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
      <Button variant="outline" className="rounded-full" onClick={enableReminder}>
        <Bell className="h-3.5 w-3.5 mr-1.5" /> Remind me at {best.label}
      </Button>
    </section>
  );
}