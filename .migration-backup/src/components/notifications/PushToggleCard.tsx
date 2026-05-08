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
} from "@/lib/push";

export function PushToggleCard() {
  const [supported, setSupported] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setSupported(isPushSupported());
    isPushEnabled().then(setEnabled);
  }, []);

  async function handleEnable() {
    setBusy(true);
    const r = await subscribeToPush();
    setBusy(false);
    if (r.ok) {
      setEnabled(true);
      toast.success("Push notifications enabled");
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
  }

  async function handleTest() {
    const t = toast.loading("Sending test push…");
    const r = await sendTestPush();
    toast.dismiss(t);
    if (r.ok) toast.success("Sent — check your notifications");
    else toast.error(r.error || "Failed to send");
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
          This browser doesn't support push. Try Chrome, Edge, or installing Feltly to your
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
    </section>
  );
}