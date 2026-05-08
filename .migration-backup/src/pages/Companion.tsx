import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/lib/auth";
import { useLibrary } from "@/lib/store";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AddBookDialog } from "@/components/reader/AddBookDialog";
import { usePremium } from "@/lib/usePremium";
import { Lock } from "lucide-react";
import { Link } from "react-router-dom";

type Msg = { role: "user" | "assistant"; content: string };

export default function Companion() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const isPremium = usePremium((s) => s.isPremium);
  const { books, currentId } = useLibrary();
  const { sessions, reflections, journal, spoilerStrictness } = useLibrary();
  const book = books.find((b) => b.id === currentId);
  const bookSessions = book ? sessions.filter((s) => s.bookId === book.id).slice(0, 5) : [];
  const bookReflection = book ? reflections.find((r) => r.bookId === book.id) : null;
  const bookJournal = book ? journal.filter((j) => j.bookId === book.id).slice(0, 8) : [];
  const bookKey = book ? `${book.title}::${book.author}` : "";
  const greeting: Msg = {
    role: "assistant",
    content: book ? `Tell me where you are in "${book.title}." What's lingering?` : "Add a book to your shelf and we'll talk.",
  };
  const [messages, setMessages] = useState<Msg[]>([greeting]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && !user) nav("/auth");
  }, [user, loading, nav]);

  if (!loading && user && !isPremium) {
    return (
      <AppShell>
        <div className="space-y-6 max-w-2xl">
          <header className="space-y-2 animate-fade-up">
            <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground flex items-center gap-1.5">
              <Sparkles className="h-3 w-3" /> AI Companion
            </p>
            <h1 className="font-display text-4xl sm:text-5xl leading-[1.05]">
              Reflect on what you{" "}
              <span className="italic" style={{ color: "var(--mood-strong)" }}>
                just read
              </span>
              .
            </h1>
          </header>
          <section className="rounded-2xl mood-surface border border-border/40 p-8 text-center space-y-4">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-foreground/5">
              <Lock className="h-6 w-6" style={{ color: "var(--mood-strong)" }} />
            </div>
            <div className="space-y-1">
              <div className="font-display text-2xl">The Companion is premium.</div>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                A spoiler-safe reading companion that remembers your highlights, sessions and
                reflections. Unlock with a Premium subscription in the App Store / Play Store.
              </p>
            </div>
            <Link
              to="/profile"
              className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/80 px-4 py-2 text-sm hover:bg-background transition"
            >
              <Sparkles className="h-3.5 w-3.5" style={{ color: "var(--mood-strong)" }} />
              Manage subscription
            </Link>
          </section>
        </div>
      </AppShell>
    );
  }

  // Load past conversation for this book
  useEffect(() => {
    if (!user || !book) return;
    let cancelled = false;
    setHistoryLoaded(false);
    (async () => {
      const { data, error } = await supabase
        .from("companion_messages")
        .select("role, content, created_at")
        .eq("user_id", user.id)
        .eq("book_key", bookKey)
        .order("created_at", { ascending: true })
        .limit(200);
      if (cancelled) return;
      if (error) {
        console.error(error);
        setHistoryLoaded(true);
        return;
      }
      if (data && data.length > 0) {
        setMessages(data.map((d) => ({ role: d.role as "user" | "assistant", content: d.content })));
      } else {
        setMessages([greeting]);
      }
      setHistoryLoaded(true);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, bookKey]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const persist = async (role: "user" | "assistant", content: string) => {
    if (!user || !book) return;
    await supabase.from("companion_messages").insert({
      user_id: user.id,
      book_key: bookKey,
      role,
      content,
    });
  };

  const clearHistory = async () => {
    if (!user || !book) return;
    await supabase
      .from("companion_messages")
      .delete()
      .eq("user_id", user.id)
      .eq("book_key", bookKey);
    setMessages([greeting]);
    toast.success("Conversation cleared.");
  };

  const suggestions = book
    ? [
        bookSessions[0] ? `How is page ${book.progress} sitting with me?` : `Help me start "${book.title}".`,
        bookJournal.find((j) => j.kind === "quote") ? "Reflect on a line I saved." : "What should I notice next?",
        bookReflection ? "What did I take away from this book?" : "What's the emotional arc so far?",
        ...((book.checkpoints ?? [])
          .filter((c) => book.progress >= c.page)
          .slice(-1)
          .map((c) => `What changed for me by "${c.label}" (p. ${c.page})?`)),
      ]
    : [];

  const send = async () => {
    const text = input.trim();
    if (!text || busy || !book) return;
    const userMsg: Msg = { role: "user", content: text };
    const next: Msg[] = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setBusy(true);
    persist("user", text);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error("Sign in to chat with the Companion.");
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/companion-chat`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          messages: next,
          spoilerStrictness,
          book: {
            title: book.title,
            author: book.author,
            mood: book.mood,
            progress: book.progress,
            pages: book.pages,
              reactions: book.reactions.slice(-12),
            recentSessions: bookSessions.map((s) => ({ mood: s.mood, pagesRead: s.pagesRead, note: s.note })),
              journal: bookJournal.map((j) => ({ kind: j.kind, text: j.text, page: j.page, mood: j.mood })),
            reflection: bookReflection
              ? { rating: bookReflection.rating, takeaway: bookReflection.takeaway, arc: bookReflection.arc, favoriteQuote: bookReflection.favoriteQuote }
              : null,
          },
        }),
      });

      if (!res.ok || !res.body) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? `HTTP ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      setMessages((m) => [...m, { role: "assistant", content: "" }]);
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") continue;
          try {
            const j = JSON.parse(data);
            const delta = j.choices?.[0]?.delta?.content ?? "";
            if (delta) {
              acc += delta;
              setMessages((m) => [...m.slice(0, -1), { role: "assistant", content: acc }]);
            }
          } catch {}
        }
      }
      if (acc) persist("assistant", acc);
    } catch (e: any) {
      toast.error(e.message ?? "Companion went quiet.");
      setMessages((m) => m.slice(0, -1));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-3xl">
        <header className="space-y-2 animate-fade-up">
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground flex items-center gap-1.5">
            <Sparkles className="h-3 w-3" /> AI Companion
          </p>
          <h1 className="font-display text-4xl sm:text-5xl leading-[1.05]">
            Reflect on what you{" "}
            <span className="italic" style={{ color: "var(--mood-strong)" }}>
              just read
            </span>
            .
          </h1>
          {book && (
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                Talking about <span className="font-medium text-foreground">{book.title}</span> · page{" "}
                {book.progress}/{book.pages}. No spoilers ahead.
              </p>
              {historyLoaded && messages.length > 1 && (
                <Button size="sm" variant="ghost" onClick={clearHistory} className="text-xs gap-1.5 h-7">
                  <Trash2 className="h-3 w-3" /> Clear
                </Button>
              )}
            </div>
          )}
        </header>

        {!book && (
          <div className="rounded-2xl border border-dashed border-border/60 p-8 text-center space-y-4">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-foreground/5">
              <Sparkles className="h-5 w-5" style={{ color: "var(--mood-strong)" }} />
            </div>
            <div className="space-y-1">
              <div className="font-display text-xl">Pick a book to talk about.</div>
              <p className="text-sm text-muted-foreground">
                The Companion needs a current read to stay spoiler-safe and personal.
              </p>
            </div>
            <div className="flex justify-center">
              <AddBookDialog />
            </div>
          </div>
        )}

        <section className="rounded-2xl mood-surface border border-border/40 p-4 sm:p-6 min-h-[420px] flex flex-col">
          <div className="flex-1 space-y-4 overflow-auto max-h-[55vh]">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "ml-auto bg-foreground text-background"
                    : "bg-white/70 border border-border/60"
                }`}
              >
                {m.content || <span className="opacity-50">…</span>}
              </div>
            ))}
            <div ref={endRef} />
          </div>

          {book && !busy && suggestions.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => setInput(s)}
                  className="rounded-full border border-border/60 bg-white/70 px-3 py-1.5 text-xs text-foreground/80 hover:bg-white transition"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          <div className="mt-4 flex items-end gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={book ? "What's resonating right now?" : "Add a book first."}
              className="min-h-[52px] bg-white/70"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              disabled={!book || busy}
            />
            <Button onClick={send} disabled={!book || busy} className="rounded-full h-[52px] px-5">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
