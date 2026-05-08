import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Loader2, Sparkles, AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLibrary } from "@/lib/store";
import { toast } from "sonner";
import { PremiumButton } from "@/components/premium/LockedFeature";
import { usePremium } from "@/lib/usePremium";

/** Camera/photo capture → AI OCR → save as quote-kind journal entry. */
export function HighlightOCR() {
  const isPremium = usePremium((s) => s.isPremium);
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [extracted, setExtracted] = useState("");
  const [page, setPage] = useState<number | "">("");
  const [error, setError] = useState<string | null>(null);
  const [empty, setEmpty] = useState(false);
  const [lastDataUrl, setLastDataUrl] = useState<string | null>(null);
  const { books, currentId } = useLibrary();
  const navigate = useNavigate();
  const book = books.find((b) => b.id === currentId) ?? books.find((b) => b.shelf === "reading");

  const onPick = () => fileRef.current?.click();

  const runOcr = async (dataUrl: string) => {
    setBusy(true);
    setError(null);
    setEmpty(false);
    setExtracted("");
    try {
      const res = await fetch("/api/ocr-highlight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ imageDataUrl: dataUrl }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error((j as { error?: string }).error || `Couldn't read the image (HTTP ${res.status}).`);
      }
      const data = await res.json();
      const text = (data?.text ?? "").trim();
      if (!text) {
        setEmpty(true);
      } else {
        setExtracted(text);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "OCR failed.");
    } finally {
      setBusy(false);
    }
  };

  const handleFile = async (file: File) => {
    if (!book) {
      toast.error("Set a current book first.");
      return;
    }
    setOpen(true);
    const dataUrl = await new Promise<string>((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result as string);
      r.onerror = rej;
      r.readAsDataURL(file);
    }).catch(() => null);
    if (!dataUrl) {
      setError("Couldn't read that image file.");
      return;
    }
    setLastDataUrl(dataUrl);
    runOcr(dataUrl);
  };

  const retry = () => {
    if (lastDataUrl) runOcr(lastDataUrl);
  };

  const openInJournal = () => {
    if (!book || !extracted.trim()) return;
    const prefill = {
      bookId: book.id,
      kind: "quote" as const,
      text: extracted.trim(),
      page: typeof page === "number" ? page : undefined,
    };
    setOpen(false);
    setExtracted("");
    setPage("");
    setLastDataUrl(null);
    setEmpty(false);
    setError(null);
    navigate("/journal", { state: { prefill } });
  };

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />
      {isPremium ? (
        <Button variant="outline" className="rounded-full gap-2 h-11 px-5" onClick={onPick}>
          <Camera className="h-4 w-4" /> Scan a highlight
        </Button>
      ) : (
        <PremiumButton onClick={onPick} className="rounded-full gap-2 h-11 px-5">
          <Camera className="h-4 w-4" /> Scan a highlight
        </PremiumButton>
      )}

      <Dialog open={open} onOpenChange={(v) => { if (!busy) setOpen(v); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl flex items-center gap-2">
              <Sparkles className="h-4 w-4" style={{ color: "var(--mood-strong)" }} />
              Captured highlight
            </DialogTitle>
          </DialogHeader>
          {busy ? (
            <div className="py-12 flex flex-col items-center gap-2 text-sm text-muted-foreground" aria-live="polite">
              <Loader2 className="h-5 w-5 animate-spin" />
              Reading your page…
            </div>
          ) : error ? (
            <div
              role="alert"
              className="rounded-xl border border-amber-300/60 bg-amber-50/70 px-4 py-4 space-y-3"
            >
              <div className="flex items-start gap-2 text-sm text-amber-900">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-amber-600" />
                <p className="flex-1">{error}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  className="rounded-full gap-1.5 h-9"
                  onClick={retry}
                  disabled={!lastDataUrl}
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Try again
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full h-9"
                  onClick={onPick}
                >
                  <Camera className="h-3.5 w-3.5 mr-1.5" /> Pick another photo
                </Button>
              </div>
            </div>
          ) : empty ? (
            <div className="rounded-xl border border-border/60 bg-card/60 px-4 py-4 space-y-3" aria-live="polite">
              <p className="text-sm text-muted-foreground">
                Couldn't find any text on that page. Try a sharper, well-lit photo with the
                text squared up.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  className="rounded-full gap-1.5 h-9"
                  onClick={retry}
                  disabled={!lastDataUrl}
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Try again
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full h-9"
                  onClick={onPick}
                >
                  <Camera className="h-3.5 w-3.5 mr-1.5" /> Pick another photo
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="rounded-full h-9"
                  onClick={() => { setEmpty(false); setExtracted(""); }}
                >
                  Type it manually
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <Textarea
                value={extracted}
                onChange={(e) => setExtracted(e.target.value)}
                rows={7}
                placeholder="Edit the captured text…"
                className="font-display italic text-base leading-relaxed bg-background/70"
                style={{ fontFamily: "'Fraunces', Georgia, serif" }}
              />
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  className="h-11 w-24 rounded-md border border-input bg-background px-3 text-sm"
                  placeholder="Page"
                  aria-label="Page number"
                  value={page}
                  onChange={(e) => {
                    const v = e.target.value;
                    setPage(v === "" ? "" : parseInt(v, 10));
                  }}
                />
                <span className="text-xs text-muted-foreground">Optional page number</span>
              </div>
              <Button onClick={openInJournal} className="w-full rounded-full h-12 text-base" disabled={!extracted.trim()}>
                Continue in Journal
              </Button>
              <p className="text-[11px] text-muted-foreground text-center -mt-1">
                Review and save the quote in your journal composer.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
