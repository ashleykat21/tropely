import { useRef } from "react";
import { useLibrary } from "@/lib/store";
import { MOODS } from "@/lib/moods";
import { Image, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const SHELF_LABELS: Record<string, string> = {
  reading:  "Currently Reading",
  want:     "Want to Read",
  finished: "Finished",
  paused:   "Paused",
  dnf:      "DNF",
};

interface Props {
  open: boolean;
  onClose: () => void;
}

export function LibraryPortrait({ open, onClose }: Props) {
  const books        = useLibrary((s) => s.books);
  const sessions     = useLibrary((s) => s.sessions);
  const portraitRef  = useRef<HTMLDivElement>(null);

  if (!open) return null;

  const byShelf = (["reading", "finished", "want", "paused", "dnf"] as const).map((shelf) => ({
    shelf,
    label: SHELF_LABELS[shelf],
    books: books.filter((b) => b.shelf === shelf),
  })).filter((s) => s.books.length > 0);

  const totalPages  = sessions.reduce((a, s) => a + s.pagesRead, 0);
  const moodCounts: Record<string, number> = {};
  sessions.forEach((s) => { moodCounts[s.mood] = (moodCounts[s.mood] || 0) + s.pagesRead; });
  const topMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
  const topMoodInfo = topMood ? MOODS[topMood as keyof typeof MOODS] : null;

  const handlePrint = () => window.print();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm max-h-[90vh] overflow-y-auto rounded-3xl bg-background shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 rounded-full border border-border/60 bg-background/80 p-1.5 text-muted-foreground hover:text-foreground transition"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Portrait card */}
        <div
          ref={portraitRef}
          className="p-6 space-y-5 print:block"
          style={{
            background: topMoodInfo
              ? `linear-gradient(160deg, hsl(${topMoodInfo.h} ${topMoodInfo.s}% 94%) 0%, hsl(${topMoodInfo.h} ${topMoodInfo.s}% 90%) 100%)`
              : "linear-gradient(160deg, hsl(34 38% 94%) 0%, hsl(32 36% 90%) 100%)",
          }}
        >
          {/* Header */}
          <div className="space-y-0.5">
            <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">My Tropely Library</p>
            <div className="font-display text-2xl leading-snug">
              {books.length} {books.length === 1 ? "book" : "books"} ·{" "}
              {totalPages.toLocaleString()} pages
            </div>
            {topMoodInfo && (
              <p className="text-xs text-muted-foreground">
                Mostly {topMoodInfo.emoji} {topMoodInfo.label.toLowerCase()} reads
              </p>
            )}
          </div>

          {/* Shelves as spine rows */}
          {byShelf.map(({ shelf, label, books: shelfBooks }) => (
            <div key={shelf} className="space-y-1.5">
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
              <div className="flex gap-1 flex-wrap">
                {shelfBooks.map((b) => {
                  const m = b.mood ? MOODS[b.mood] : null;
                  const hue = m ? m.h : 34;
                  const sat = m ? m.s : 30;
                  const lit = m ? m.l : 60;
                  const pageW = Math.max(10, Math.min(24, Math.round(((b.pages ?? 300) / 500) * 18)));
                  return (
                    <div
                      key={b.id}
                      title={`${b.title} · ${b.author}`}
                      style={{
                        width: pageW,
                        height: 72,
                        borderRadius: "2px 4px 4px 2px",
                        background: `linear-gradient(180deg, hsl(${hue} ${sat}% ${lit}%) 0%, hsl(${hue} ${sat}% ${Math.max(30, lit - 12)}%) 100%)`,
                        boxShadow: "inset -1px 0 3px rgba(0,0,0,0.25), 1px 2px 6px rgba(0,0,0,0.15)",
                        flexShrink: 0,
                      }}
                    />
                  );
                })}
              </div>
            </div>
          ))}

          {/* Footer watermark */}
          <p className="text-[9px] text-muted-foreground/60 text-right pt-1">
            tropely.app · {new Date().getFullYear()}
          </p>
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-border/40 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 gap-1.5 rounded-full"
            onClick={handlePrint}
          >
            <Image className="h-3.5 w-3.5" />
            Save as PDF
          </Button>
          {typeof navigator.share === "function" && (
            <Button
              size="sm"
              className="flex-1 rounded-full gap-1.5"
              onClick={() =>
                navigator.share({
                  title: "My Tropely Library",
                  text: `${books.length} books · ${totalPages.toLocaleString()} pages tracked on Tropely`,
                  url: window.location.origin,
                })
              }
            >
              Share
            </Button>
          )}
        </div>

        <p className="px-4 pb-4 text-[10px] text-muted-foreground text-center">
          Take a screenshot or save as PDF to share your portrait.
        </p>
      </div>
    </div>
  );
}
