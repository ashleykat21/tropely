import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Notif = {
  id: string;
  kind: string;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
};

export function NotificationsBell() {
  const { user } = useAuth();
  const [items, setItems] = useState<Notif[]>([]);
  const [open, setOpen] = useState(false);

  const unread = items.filter((n) => !n.read_at).length;

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);
    setItems((data as Notif[]) ?? []);
  };

  useEffect(() => {
    if (!user) return;
    load();
    const ch = supabase
      .channel(`notif-${user.id}-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload) => setItems((s) => [payload.new as Notif, ...s])
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [user?.id]);

  const markAllRead = async () => {
    if (!user || unread === 0) return;
    const ids = items.filter((n) => !n.read_at).map((n) => n.id);
    setItems((s) => s.map((n) => (n.read_at ? n : { ...n, read_at: new Date().toISOString() })));
    await supabase.from("notifications").update({ read_at: new Date().toISOString() }).in("id", ids);
  };

  const dismiss = async (id: string) => {
    setItems((s) => s.filter((n) => n.id !== id));
    await supabase.from("notifications").delete().eq("id", id);
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
                if (user) await supabase.from("notifications").delete().eq("user_id", user.id);
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
                !n.read_at && "bg-foreground/[0.03]"
              )}
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{n.title}</div>
                {n.body && <div className="text-xs text-muted-foreground mt-0.5">{n.body}</div>}
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(n.created_at).toLocaleString([], {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  {n.link && (
                    <Link
                      to={n.link}
                      onClick={() => setOpen(false)}
                      className="text-[11px] underline text-foreground/80 hover:text-foreground"
                    >
                      Open
                    </Link>
                  )}
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