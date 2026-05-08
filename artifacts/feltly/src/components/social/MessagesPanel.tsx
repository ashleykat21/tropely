import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ArrowLeft, Edit, Send, X } from "lucide-react";

const STORAGE_KEY = "feltly:messages:v1";

type DM = {
  id: string;
  fromId: string;
  fromName: string;
  toId: string;
  toName: string;
  text: string;
  at: number;
};

function loadMessages(): DM[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveMessages(msgs: DM[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(msgs));
}

function getConversations(msgs: DM[], myId: string) {
  const byUser: Record<string, { userId: string; userName: string; last: DM }> = {};
  for (const m of msgs) {
    const otherId = m.fromId === myId ? m.toId : m.fromId;
    const otherName = m.fromId === myId ? m.toName : m.fromName;
    if (!byUser[otherId] || m.at > byUser[otherId].last.at) {
      byUser[otherId] = { userId: otherId, userName: otherName, last: m };
    }
  }
  return Object.values(byUser).sort((a, b) => b.last.at - a.last.at);
}

function getThread(msgs: DM[], myId: string, otherId: string) {
  return msgs
    .filter((m) => (m.fromId === myId && m.toId === otherId) || (m.fromId === otherId && m.toId === myId))
    .sort((a, b) => a.at - b.at);
}

function timeAgo(ts: number) {
  const diff = Date.now() - ts;
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return new Date(ts).toLocaleDateString();
}

type Props = {
  open: boolean;
  onClose: () => void;
};

export function MessagesPanel({ open, onClose }: Props) {
  const { user } = useAuth();
  const myId = user?.id ?? "local";
  const myName = user?.displayName ?? user?.email ?? "Me";

  const [messages, setMessages] = useState<DM[]>([]);
  const [view, setView] = useState<"list" | "thread" | "new">("list");
  const [activeUser, setActiveUser] = useState<{ id: string; name: string } | null>(null);
  const [draft, setDraft] = useState("");
  const [newRecipient, setNewRecipient] = useState("");
  const [newText, setNewText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) setMessages(loadMessages());
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeUser]);

  const conversations = getConversations(messages, myId);
  const thread = activeUser ? getThread(messages, myId, activeUser.id) : [];

  function send() {
    if (!draft.trim() || !activeUser) return;
    const msg: DM = {
      id: crypto.randomUUID(),
      fromId: myId,
      fromName: myName,
      toId: activeUser.id,
      toName: activeUser.name,
      text: draft.trim(),
      at: Date.now(),
    };
    const updated = [...messages, msg];
    setMessages(updated);
    saveMessages(updated);
    setDraft("");
  }

  function startNew() {
    if (!newRecipient.trim() || !newText.trim()) return;
    const recipientId = `user:${newRecipient.trim().toLowerCase()}`;
    const msg: DM = {
      id: crypto.randomUUID(),
      fromId: myId,
      fromName: myName,
      toId: recipientId,
      toName: newRecipient.trim(),
      text: newText.trim(),
      at: Date.now(),
    };
    const updated = [...messages, msg];
    setMessages(updated);
    saveMessages(updated);
    setActiveUser({ id: recipientId, name: newRecipient.trim() });
    setNewRecipient("");
    setNewText("");
    setView("thread");
  }

  function openThread(userId: string, userName: string) {
    setActiveUser({ id: userId, name: userName });
    setView("thread");
  }

  function goBack() {
    setView("list");
    setActiveUser(null);
    setDraft("");
  }

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <SheetContent side="right" className="w-full sm:w-96 p-0 flex flex-col">
        {/* Header */}
        <SheetHeader className="flex-row items-center justify-between px-4 py-3 border-b border-border/50 shrink-0">
          <div className="flex items-center gap-2">
            {view !== "list" && (
              <button onClick={goBack} className="text-muted-foreground hover:text-foreground transition">
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <SheetTitle className="text-base">
              {view === "list" && "Messages"}
              {view === "thread" && activeUser?.name}
              {view === "new" && "New Message"}
            </SheetTitle>
          </div>
          <div className="flex items-center gap-1">
            {view === "list" && (
              <button
                onClick={() => setView("new")}
                className="h-8 w-8 grid place-items-center rounded-full hover:bg-accent transition text-muted-foreground hover:text-foreground"
                title="New message"
              >
                <Edit className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="h-8 w-8 grid place-items-center rounded-full hover:bg-accent transition text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </SheetHeader>

        {/* Conversation list */}
        {view === "list" && (
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-4 px-8 text-center">
                <div className="h-14 w-14 rounded-full bg-muted grid place-items-center">
                  <Edit className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium text-sm">No messages yet</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Start a conversation with another reader.
                  </p>
                </div>
                <Button size="sm" onClick={() => setView("new")}>
                  New Message
                </Button>
              </div>
            ) : (
              <ul className="divide-y divide-border/40">
                {conversations.map((c) => (
                  <li key={c.userId}>
                    <button
                      onClick={() => openThread(c.userId, c.userName)}
                      className="w-full flex items-start gap-3 px-4 py-3.5 hover:bg-accent/50 transition text-left"
                    >
                      <div className="h-9 w-9 rounded-full bg-muted shrink-0 grid place-items-center text-sm font-semibold uppercase">
                        {c.userName[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-sm truncate">{c.userName}</span>
                          <span className="text-[10px] text-muted-foreground shrink-0">
                            {timeAgo(c.last.at)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {c.last.fromId === myId ? "You: " : ""}{c.last.text}
                        </p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Thread view */}
        {view === "thread" && activeUser && (
          <>
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {thread.length === 0 && (
                <p className="text-xs text-muted-foreground text-center pt-8">
                  Send your first message to {activeUser.name}.
                </p>
              )}
              {thread.map((m) => {
                const mine = m.fromId === myId;
                return (
                  <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                    <div
                      className={cn(
                        "max-w-[75%] rounded-2xl px-3.5 py-2 text-sm",
                        mine
                          ? "rounded-br-sm text-white"
                          : "rounded-bl-sm bg-muted text-foreground"
                      )}
                      style={mine ? { background: "var(--mood-strong)" } : undefined}
                    >
                      <p>{m.text}</p>
                      <p className={cn("text-[10px] mt-1", mine ? "text-white/60" : "text-muted-foreground")}>
                        {timeAgo(m.at)}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>
            <div className="shrink-0 border-t border-border/50 px-4 py-3 flex items-center gap-2">
              <Input
                className="h-9 text-sm rounded-full"
                placeholder="Write a message…"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              />
              <button
                onClick={send}
                disabled={!draft.trim()}
                className="h-9 w-9 grid place-items-center rounded-full transition disabled:opacity-40"
                style={{ background: "var(--mood-strong)" }}
              >
                <Send className="h-4 w-4 text-white" />
              </button>
            </div>
          </>
        )}

        {/* New message */}
        {view === "new" && (
          <div className="flex-1 flex flex-col gap-4 px-4 py-5">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">To</label>
              <Input
                placeholder="Reader username or name…"
                value={newRecipient}
                onChange={(e) => setNewRecipient(e.target.value)}
                className="h-9"
              />
            </div>
            <div className="space-y-1.5 flex-1 flex flex-col">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Message</label>
              <textarea
                className="flex-1 min-h-32 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
                placeholder="Write something…"
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
              />
            </div>
            <Button
              className="w-full"
              disabled={!newRecipient.trim() || !newText.trim()}
              onClick={startNew}
            >
              <Send className="h-4 w-4 mr-2" />
              Send Message
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
