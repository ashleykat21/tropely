import { useMemo } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useLibrary } from "@/lib/store";
import { TopTropesInsight } from "@/components/insights/TopTropesInsight";
import { TropeMoodCorrelation } from "@/components/tropes/TropeMoodCorrelation";
import { TropeChallenge } from "@/components/tropes/TropeChallenge";
import { TrendingTropes } from "@/components/tropes/TrendingTropes";
import { renderTropeCard, shareOrDownload } from "@/lib/shareImage";
import { Button } from "@/components/ui/button";
import { Share2, Layers } from "lucide-react";
import { toast } from "sonner";
import { AddBookDialog } from "@/components/reader/AddBookDialog";

export default function Tropes() {
  const books = useLibrary((s) => s.books);

  const topTropes = useMemo(() => {
    const counts: Record<string, number> = {};
    books.forEach((b) =>
      (b.tropes ?? []).forEach((t) => {
        counts[t] = (counts[t] || 0) + 1;
      })
    );
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10) as [string, number][];
  }, [books]);

  const isCold = topTropes.length === 0;

  const shareFingerprint = async () => {
    const t = toast.loading("Creating your trope fingerprint card…");
    try {
      const blob = await renderTropeCard({ tropes: topTropes });
      const r = await shareOrDownload(blob, "tropely-tropes.png");
      toast.dismiss(t);
      toast.success(r === "shared" ? "Shared!" : "Saved to your device");
    } catch {
      toast.dismiss(t);
      toast.error("Couldn't generate the image");
    }
  };

  return (
    <AppShell>
      <div className="space-y-8 max-w-4xl">
        <header className="space-y-3 animate-fade-up">
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Tropes</p>
          <h1 className="font-display text-4xl sm:text-5xl leading-[1.05]">
            Your story{" "}
            <span className="italic" style={{ color: "var(--mood-strong)" }}>
              fingerprint
            </span>
            .
          </h1>
          <p className="text-sm text-muted-foreground max-w-lg">
            Every trope you love carries a mood. Here's the pattern only your reading history could make.
          </p>
          {!isCold && (
            <Button
              variant="outline"
              className="rounded-full gap-2"
              onClick={shareFingerprint}
            >
              <Share2 className="h-3.5 w-3.5" />
              Share my fingerprint
            </Button>
          )}
        </header>

        {isCold ? (
          <div className="rounded-2xl border border-dashed border-border/60 p-12 text-center space-y-4">
            <div
              className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-foreground/5"
            >
              <Layers className="h-6 w-6" style={{ color: "var(--mood-strong)" }} />
            </div>
            <div className="font-display text-2xl">Your fingerprint is waiting.</div>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Tag books with tropes when adding or editing them — the mood underneath each one will surface automatically, building your unique story signature.
            </p>
            <div className="flex justify-center pt-1">
              <AddBookDialog />
            </div>
          </div>
        ) : (
          <>
            <TopTropesInsight />
            <TropeMoodCorrelation />
            <TropeChallenge />
            <TrendingTropes userTropes={topTropes.map(([t]) => t)} />
          </>
        )}
      </div>
    </AppShell>
  );
}
