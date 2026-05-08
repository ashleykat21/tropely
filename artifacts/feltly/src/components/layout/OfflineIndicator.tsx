import { useEffect, useState } from "react";
import { CloudOff, RefreshCw } from "lucide-react";
import { subscribePending } from "@/lib/offlineQueue";

export function OfflineIndicator() {
  const [online, setOnline] = useState(typeof navigator === "undefined" ? true : navigator.onLine);
  const [pending, setPending] = useState(0);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    const unsub = subscribePending(setPending);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
      unsub();
    };
  }, []);

  if (online && pending === 0) return null;

  return (
    <div
      className="hidden sm:flex items-center gap-1.5 rounded-full border border-border/60 bg-card/70 px-2.5 py-1 text-[11px] text-muted-foreground"
      title={online ? "Syncing pending changes" : "Offline — changes will sync when you're back"}
    >
      {online ? (
        <RefreshCw className="h-3 w-3 animate-spin" />
      ) : (
        <CloudOff className="h-3 w-3" />
      )}
      {online ? `Syncing ${pending}` : pending > 0 ? `Offline · ${pending} queued` : "Offline"}
    </div>
  );
}