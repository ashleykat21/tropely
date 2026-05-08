import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, AlertCircle, MessageSquarePlus } from "lucide-react";

interface FeedbackSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Status = "idle" | "submitting" | "success" | "error";

export function FeedbackSheet({ open, onOpenChange }: FeedbackSheetProps) {
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  function reset() {
    setMessage("");
    setEmail("");
    setStatus("idle");
    setErrorMsg("");
  }

  function handleOpenChange(v: boolean) {
    if (!v) reset();
    onOpenChange(v);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;
    setStatus("submitting");
    setErrorMsg("");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: message.trim(), email: email.trim() || undefined }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error || `Server error ${res.status}`);
      }
      setStatus("success");
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setStatus("error");
    }
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[90dvh] overflow-y-auto">
        <SheetHeader className="mb-4">
          <SheetTitle className="flex items-center gap-2">
            <MessageSquarePlus className="h-4 w-4" />
            Send Feedback
          </SheetTitle>
        </SheetHeader>

        {status === "success" ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <CheckCircle className="h-10 w-10 text-green-500" />
            <p className="font-medium">Thank you for your feedback!</p>
            <p className="text-sm text-muted-foreground">
              We read every message and appreciate you taking the time.
            </p>
            <Button variant="outline" className="mt-2" onClick={() => handleOpenChange(false)}>
              Close
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="feedback-message">
                Your feedback <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="feedback-message"
                placeholder="Tell us what's working, what's broken, or what you'd love to see next…"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                maxLength={5000}
                required
                disabled={status === "submitting"}
                className="resize-none"
              />
              <span className="text-[11px] text-muted-foreground text-right">
                {message.length}/5000
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="feedback-email">
                Email <span className="text-muted-foreground text-xs">(optional — if you'd like a reply)</span>
              </Label>
              <Input
                id="feedback-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={status === "submitting"}
              />
            </div>

            {status === "error" && (
              <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <Button
              type="submit"
              disabled={status === "submitting" || !message.trim()}
              className="w-full"
            >
              {status === "submitting" ? "Sending…" : "Send feedback"}
            </Button>
          </form>
        )}
      </SheetContent>
    </Sheet>
  );
}
