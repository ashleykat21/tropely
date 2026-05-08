import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, X } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Notif = {
  id: string;
  kind: string;
  body: string | null;
  readAt: string | null;
  createdAt: string;
};

export function NotificationsBell() {
  const { user } = useAuth();
  const [items, setItems] = useState<Notif[]>([]);
  const [open, setOpen] = useState(false);

  const unread = items.filter((n) => !n.readAt).length;

  const load = async () => {
    if (!user) return;
    try {
      const res = await fetch("/api/notifications", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setItems(data ?? []);
      }
    } catch {}
  };

  useEffect(() => {
    if (!user) return;
    load();
    const interval = setInterval(load, 60_000);
    return () => clearInterval(interval);
  }, [user?.id]);

  const markAllRead = async () => {
    if (!user || unread === 0) return;
    const ids = items.filter((n) => !n.readAt).map((n) => n.id);
    setItems((s) => s.map((n) => (n.readAt ? n : { ...n, readAt: new Date().toISOString() })));
    try {
      await fetch("/api/notifications/read", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ids }),
      });
    } catch {}
  };

  const dismiss = async (id: string) => {
    setItems((s) => s.filter((n) => n.id !== id));
    try {
      await fetch(`/api/notifications/${id}`, { method: "DELETE", credentials: "include" });
    } catch {}
  };

  if (!user) return null;

  return (
    <Popover open={open} onOpenChange={(v) => { setOpen(v); if (v) markAllRead(); }}>
      <PopoverTrigger asChild>
        <button
          className="relative grid h-9 w-9 place-items-center rounded-full border border-border/60 bg-card/70 hover:bg-card transition"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span
              className="absolute -top-0.5 -right-0.5 grid h-4 min-w-4 px-1 place-items-center rounded-full text-[9px] font-bold text-background"
              style={{ background: "var(--mood-strong)" }}
            >
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0 overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2 border-b border-border/50">
          <div className="text-sm font-medium">Today's digest</div>
          {items.length > 0 && (
            <button
              onClick={async () => {
                setItems([]);
                try {
                  await fetch("/api/notifications", { method: "DELETE", credentials: "include" });
                } catch {}
              }}
              className="text-[11px] text-muted-foreground hover:text-foreground"
            >
              Clear all
            </button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {items.length === 0 && (
            <div className="text-sm text-muted-foreground p-6 text-center">
              Nothing new yet. Your daily digest will appear here.
            </div>
          )}
          {items.map((n) => (
            <div
              key={n.id}
              className={cn(
                "px-3 py-2.5 border-b border-border/40 last:border-b-0 flex gap-2 items-start",
                !n.readAt && "bg-foreground/[0.03]"
              )}
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{n.kind}</div>
                {n.body && <div className="text-xs text-muted-foreground mt-0.5">{n.body}</div>}
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(n.createdAt).toLocaleString([], {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 rounded-full -mr-1 -mt-1 shrink-0"
                onClick={() => dismiss(n.id)}
                aria-label="Dismiss"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
