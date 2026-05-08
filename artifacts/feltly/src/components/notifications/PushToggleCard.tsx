import { useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  isPushSupported,
  isPushEnabled,
  subscribeToPush,
  unsubscribeFromPush,
  sendTestPush,
  getPushStatus,
  type PushStatus,
} from "@/lib/push";

function fmtRelative(ts: number): string {
  const diff = Date.now() - ts;
  const min = Math.round(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  return `${day}d ago`;
}

export function PushToggleCard() {
  const [supported, setSupported] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<PushStatus | null>(null);

  async function refreshStatus() {
    const s = await getPushStatus();
    setStatus(s);
  }

  useEffect(() => {
    setSupported(isPushSupported());
    isPushEnabled().then(setEnabled);
    refreshStatus();
  }, []);

  async function handleEnable() {
    setBusy(true);
    const r = await subscribeToPush();
    setBusy(false);
    if (r.ok) {
      setEnabled(true);
      toast.success("Push notifications enabled");
      refreshStatus();
    } else {
      toast.error(r.error || "Couldn't enable push");
    }
  }

  async function handleDisable() {
    setBusy(true);
    await unsubscribeFromPush();
    setBusy(false);
    setEnabled(false);
    toast.message("Push notifications disabled");
    refreshStatus();
  }

  async function handleTest() {
    const t = toast.loading("Sending test push…");
    const r = await sendTestPush();
    toast.dismiss(t);
    if (r.ok) {
      toast.success("Sent — check your notifications");
      setTimeout(refreshStatus, 600);
    } else toast.error(r.error || "Failed to send");
  }

  return (
    <section className="rounded-2xl bg-card/70 p-6 border border-border/40 space-y-3">
      <div className="flex items-center gap-2">
        <Bell className="h-4 w-4 text-muted-foreground" />
        <h2 className="font-display text-2xl">Push notifications</h2>
      </div>
      <p className="text-sm text-muted-foreground -mt-1">
        Get nudged when buddy reads get new messages, when a Reading Twin appears, and when
        your daily digest is ready — even with the app closed.
      </p>
      {!supported ? (
        <p className="text-xs text-muted-foreground">
          This browser doesn't support push. Try Chrome, Edge, or installing Tropely to your
          home screen on iOS 16.4+.
        </p>
      ) : enabled ? (
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="rounded-full" onClick={handleTest}>
            <Bell className="h-3.5 w-3.5 mr-1.5" /> Send test push
          </Button>
          <Button variant="ghost" className="rounded-full" onClick={handleDisable} disabled={busy}>
            <BellOff className="h-3.5 w-3.5 mr-1.5" /> Turn off
          </Button>
        </div>
      ) : (
        <Button className="rounded-full" onClick={handleEnable} disabled={busy}>
          <Bell className="h-3.5 w-3.5 mr-1.5" /> Enable push notifications
        </Button>
      )}
      {status && status.configured && (status.devices > 0 || status.lastSentAt) && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1 text-[11px] text-muted-foreground border-t border-border/40 mt-2">
          <span>
            {status.active} active {status.active === 1 ? "device" : "devices"}
            {status.devices > status.active && ` · ${status.devices - status.active} disabled`}
          </span>
          {status.lastSentAt && <span>Last sent {fmtRelative(status.lastSentAt)}</span>}
          {status.nextReminderHour !== null && (
            <span>
              Daily reminder at{" "}
              {new Date(0, 0, 0, status.nextReminderHour).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
        </div>
      )}
    </section>
  );
}