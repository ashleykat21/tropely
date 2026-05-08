import { useState } from "react";
import { useLibrary, type Book } from "@/lib/store";
import { MOODS, type MoodKey } from "@/lib/moods";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { BookOpen, Sparkles } from "lucide-react";
import { toast } from "sonner";

const MOOD_KEYS = Object.keys(MOODS) as MoodKey[];

function MoodPicker({ value, onChange, label }: { value: MoodKey; onChange: (m: MoodKey) => void; label: string }) {
  return (
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
}

export function RereadStartDialog({
  book,
  open,
  onOpenChange,
  onDone,
}: {
  book: Book;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onDone: () => void;
}) {
  const { addJournal } = useLibrary();
  const [text, setText] = useState("");

  const handleDone = (save: boolean) => {
    if (save && text.trim()) {
      addJournal({ bookId: book.id, kind: "reread", text: text.trim() });
    }
    onOpenChange(false);
    onDone();
    setText("");
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleDone(false); else onOpenChange(true); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl flex items-center gap-2">
            <BookOpen className="h-4 w-4" /> What brought you back?
          </DialogTitle>
          <DialogDescription>
            A note to your future self about why you returned to{" "}
            <span className="font-medium text-foreground">{book.title}</span>.
          </DialogDescription>
        </DialogHeader>
        <div className="py-2">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="I kept thinking about the ending… / Someone recommended it again… / I just needed to go back…"
            className="min-h-[90px]"
            autoFocus
          />
        </div>
        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => handleDone(false)}>
            Skip
          </Button>
          <Button onClick={() => handleDone(true)} className="rounded-full">
            Save &amp; start reread
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function RereadFinishDialog({
  book,
  open,
  onOpenChange,
  previousSnapshot,
}: {
  book: Book;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  previousSnapshot?: { arc: { start: MoodKey; middle: MoodKey; end: MoodKey }; rating: number } | null;
}) {
  const { saveRereadSnapshot } = useLibrary();
  const [note, setNote] = useState("");
  const [start, setStart] = useState<MoodKey>(book.mood);
  const [middle, setMiddle] = useState<MoodKey>(book.mood);
  const [end, setEnd] = useState<MoodKey>(book.mood);

  const handleSave = (save: boolean) => {
    if (save) {
      saveRereadSnapshot(book.id, note.trim());
      toast.success("Reread reflection saved.");
    }
    onOpenChange(false);
    setNote("");
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleSave(false); else onOpenChange(true); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl flex items-center gap-2">
            <Sparkles className="h-4 w-4" /> How did it land differently?
          </DialogTitle>
          <DialogDescription>
            You've just finished rereading{" "}
            <span className="font-medium text-foreground">{book.title}</span>.
            What changed?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {previousSnapshot && (
            <div className="rounded-xl border border-border/50 bg-card/60 px-4 py-3 space-y-1">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Your first read</p>
              <div className="flex items-center gap-3 text-sm">
                <span>
                  {MOODS[previousSnapshot.arc.start].emoji}
                  {" → "}
                  {MOODS[previousSnapshot.arc.middle].emoji}
                  {" → "}
                  {MOODS[previousSnapshot.arc.end].emoji}
                </span>
                <span className="text-muted-foreground">· {previousSnapshot.rating}/5</span>
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs uppercase tracking-widest text-muted-foreground">
              What hit differently this time?
            </label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="The ending felt more bittersweet… / I noticed so much I missed before… / It didn't hold up the same way…"
              className="min-h-[90px]"
              autoFocus
            />
          </div>

          <div className="space-y-3">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">This reread's mood arc</p>
            <div className="grid sm:grid-cols-3 gap-4">
              <MoodPicker value={start} onChange={setStart} label="Start" />
              <MoodPicker value={middle} onChange={setMiddle} label="Middle" />
              <MoodPicker value={end} onChange={setEnd} label="End" />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => handleSave(false)}>Skip</Button>
          <Button onClick={() => handleSave(true)} className="rounded-full">Save reflection</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
