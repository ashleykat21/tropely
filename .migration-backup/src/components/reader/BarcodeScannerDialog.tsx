import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, ScanLine } from "lucide-react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { BarcodeFormat, DecodeHintType } from "@zxing/library";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDetected: (isbn: string) => void;
};

const isLikelyIsbn = (raw: string) => /^(97(8|9))?\d{9}(\d|X)$/i.test(raw.replace(/[-\s]/g, ""));

export function BarcodeScannerDialog({ open, onOpenChange, onDetected }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setError(null);
    setStarting(true);

    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.EAN_13, BarcodeFormat.EAN_8, BarcodeFormat.UPC_A]);
    const reader = new BrowserMultiFormatReader(hints);

    (async () => {
      try {
        const controls = await reader.decodeFromVideoDevice(
          undefined,
          videoRef.current!,
          (result) => {
            if (!result || cancelled) return;
            const text = result.getText().replace(/[-\s]/g, "");
            if (isLikelyIsbn(text)) {
              controls.stop();
              onDetected(text);
              onOpenChange(false);
            }
          }
        );
        controlsRef.current = controls;
        if (cancelled) controls.stop();
      } catch (e: any) {
        setError(e?.message ?? "Could not start camera");
      } finally {
        setStarting(false);
      }
    })();

    return () => {
      cancelled = true;
      controlsRef.current?.stop();
      controlsRef.current = null;
    };
  }, [open, onDetected, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <ScanLine className="h-5 w-5" /> Scan barcode
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-black">
            <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
            <div className="pointer-events-none absolute inset-x-8 top-1/2 -translate-y-1/2 h-20 rounded-xl border-2 border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
            {starting && (
              <div className="absolute inset-0 grid place-items-center text-white">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            )}
          </div>
          {error ? (
            <p className="text-xs text-destructive">{error}</p>
          ) : (
            <p className="text-xs text-muted-foreground text-center">
              Point the camera at the barcode on the back cover.
            </p>
          )}
          <Button variant="outline" className="w-full rounded-full" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}