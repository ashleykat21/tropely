import { useRef, useState } from "react";
import { Camera, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useLibrary } from "@/lib/store";
import { supabase } from "@/integrations/supabase/client";
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
  const { books, currentId, addJournal } = useLibrary();
  const book = books.find((b) => b.id === currentId) ?? books.find((b) => b.shelf === "reading");

  const onPick = () => fileRef.current?.click();

  const handleFile = async (file: File) => {
    if (!book) {
      toast.error("Set a current book first.");
      return;
    }
    setBusy(true);
    setOpen(true);
    setExtracted("");
    try {
      const dataUrl = await new Promise<string>((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result as string);
        r.onerror = rej;
        r.readAsDataURL(file);
      });
      // Use Lovable AI Gateway for vision OCR via the companion-chat function in OCR mode.
      const { data, error } = await supabase.functions.invoke("ocr-highlight", {
        body: { imageDataUrl: dataUrl },
      });
      if (error) throw error;
      const text = (data as any)?.text?.trim() ?? "";
      if (!text) {
        toast.error("Couldn't read any text. Try a sharper photo.");
      } else {
        setExtracted(text);
      }
    } catch (e: any) {
      toast.error(e?.message ?? "OCR failed.");
    } finally {
      setBusy(false);
    }
  };

  const save = () => {
    if (!book || !extracted.trim()) return;
    addJournal({
      bookId: book.id,
      kind: "quote",
      text: extracted.trim(),
      page: typeof page === "number" ? page : undefined,
    });
    toast.success("Highlight saved to your journal.");
    setOpen(false);
    setExtracted("");
    setPage("");
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
        <Button variant="outline" className="rounded-full gap-1.5" onClick={onPick}>
          <Camera className="h-3.5 w-3.5" /> Scan a highlight
        </Button>
      ) : (
        <PremiumButton onClick={onPick}>
          <Camera className="h-3.5 w-3.5" /> Scan a highlight
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
            <div className="py-12 flex flex-col items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              Reading your page…
            </div>
          ) : (
            <div className="space-y-3">
              <Textarea
                value={extracted}
                onChange={(e) => setExtracted(e.target.value)}
                rows={6}
                placeholder="Edit the captured text…"
              />
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  className="h-8 w-24 rounded-md border border-input bg-background px-2 text-sm"
                  placeholder="Page"
                  value={page}
                  onChange={(e) => {
                    const v = e.target.value;
                    setPage(v === "" ? "" : parseInt(v, 10));
                  }}
                />
                <span className="text-xs text-muted-foreground">Optional page number</span>
              </div>
              <Button onClick={save} className="w-full rounded-full" disabled={!extracted.trim()}>
                Save to journal
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}