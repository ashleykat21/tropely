import { useState } from "react";
import { useLibrary, type Book } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Flag, Lock, Check, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function CheckpointsPanel({ book }: { book: Book }) {
  const { addCheckpoint, removeCheckpoint } = useLibrary();
  const [page, setPage] = useState<string>("");
  const [label, setLabel] = useState<string>("");
  const [open, setOpen] = useState(false);
  const checkpoints = book.checkpoints ?? [];

  const submit = () => {
    const n = parseInt(page, 10);
    if (Number.isNaN(n) || n < 1) return;
    addCheckpoint(book.id, n, label);
    setPage("");
    setLabel("");
    setOpen(false);
  };

  return (
    <div className="rounded-2xl bg-white/50 border border-border/50 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flag className="h-3.5 w-3.5 text-muted-foreground" />
          <p className="text-sm font-medium">Spoiler checkpoints</p>
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 gap-1 text-xs"
          onClick={() => setOpen((o) => !o)}
        >
          <Plus className="h-3 w-3" /> Add
        </Button>
      </div>

      <p className="text-xs text-muted-foreground -mt-1">
        Notes and prompts tagged to a checkpoint stay locked until you reach that page.
      </p>

      {open && (
        <div className="flex items-end gap-2 pt-1">
          <div className="w-20">
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Page</label>
            <Input
              type="number"
              value={page}
              onChange={(e) => setPage(e.target.value)}
              placeholder="120"
              className="h-8 bg-white/70"
            />
          </div>
          <div className="flex-1">
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Label</label>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="End of Act I"
              className="h-8 bg-white/70"
            />
          </div>
          <Button size="sm" onClick={submit} className="h-8 rounded-full">Save</Button>
        </div>
      )}

      {checkpoints.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">No checkpoints yet.</p>
      ) : (
        <ul className="space-y-1.5">
          {checkpoints.map((c) => {
            const reached = book.progress >= c.page;
            return (
              <li
                key={c.id}
                className={cn(
                  "group flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm",
                  reached ? "bg-white/70" : "bg-foreground/5 text-muted-foreground"
                )}
              >
                {reached ? (
                  <Check className="h-3.5 w-3.5 text-foreground" />
                ) : (
                  <Lock className="h-3.5 w-3.5" />
                )}
                <span className="font-medium">p. {c.page}</span>
                <span className="truncate">{c.label}</span>
                <button
                  onClick={() => removeCheckpoint(book.id, c.id)}
                  className="ml-auto opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition"
                  aria-label="Remove checkpoint"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}