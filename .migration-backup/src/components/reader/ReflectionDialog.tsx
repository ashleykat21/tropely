import { useState } from "react";
import { useLibrary, type Book } from "@/lib/store";
import { MOODS, type MoodKey } from "@/lib/moods";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Star, Sparkles } from "lucide-react";
import { toast } from "sonner";

const MOOD_KEYS = Object.keys(MOODS) as MoodKey[];

export function ReflectionDialog({ book, open, onOpenChange }: {
  book: Book;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const { saveReflection } = useLibrary();
  const [rating, setRating] = useState(4);
  const [takeaway, setTakeaway] = useState("");
  const [start, setStart] = useState<MoodKey>(book.mood);
  const [middle, setMiddle] = useState<MoodKey>(book.mood);
  const [end, setEnd] = useState<MoodKey>(book.mood);
  const [favoriteQuote, setFavoriteQuote] = useState("");

  const submit = () => {
    if (!takeaway.trim()) {
      toast.error("Add a one-line takeaway so future-you remembers.");
      return;
    }
    saveReflection({
      bookId: book.id,
      rating,
      takeaway: takeaway.trim(),
      arc: { start, middle, end },
      favoriteQuote: favoriteQuote.trim() || undefined,
    });
    toast.success("Reflection saved. The Companion will remember this.");
    onOpenChange(false);
  };

  const MoodPicker = ({ value, onChange, label }: { value: MoodKey; onChange: (m: MoodKey) => void; label: string }) => (
    <div className="space-y-1.5">
      <label className="text-xs uppercase tracking-widest text-muted-foreground">{label}</label>
      <div className="flex flex-wrap gap-1.5">
        {MOOD_KEYS.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => onChange(k)}
            className={cn(
              "rounded-full border px-2.5 py-1 text-xs flex items-center gap-1 transition",
              value === k
                ? "bg-foreground text-background border-foreground"
                : "bg-card border-border hover:bg-muted"
            )}
          >
            <span>{MOODS[k].emoji}</span>
            <span>{MOODS[k].label}</span>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl flex items-center gap-2">
            <Sparkles className="h-4 w-4" /> You finished {book.title}
          </DialogTitle>
          <DialogDescription>
            A small reflection so this stays with you.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="space-y-1.5">
            <label className="text-xs uppercase tracking-widest text-muted-foreground">How did it land?</label>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  aria-label={`${n} stars`}
                >
                  <Star
                    className={cn(
                      "h-7 w-7 transition",
                      n <= rating ? "fill-foreground text-foreground" : "text-muted-foreground/40"
                    )}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs uppercase tracking-widest text-muted-foreground">One-line takeaway</label>
            <Textarea
              value={takeaway}
              onChange={(e) => setTakeaway(e.target.value)}
              placeholder="What you'll carry from it…"
              className="min-h-[60px]"
            />
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <MoodPicker value={start} onChange={setStart} label="Start" />
            <MoodPicker value={middle} onChange={setMiddle} label="Middle" />
            <MoodPicker value={end} onChange={setEnd} label="End" />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs uppercase tracking-widest text-muted-foreground">Favorite line (optional)</label>
            <Textarea
              value={favoriteQuote}
              onChange={(e) => setFavoriteQuote(e.target.value)}
              placeholder="“…”"
              className="min-h-[60px] font-display italic"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Skip for now</Button>
          <Button onClick={submit} className="rounded-full">Save reflection</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
