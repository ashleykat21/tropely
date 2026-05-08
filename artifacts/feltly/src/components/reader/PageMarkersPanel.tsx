import { useState } from "react";
import { useLibrary, type Book } from "@/lib/store";
import { Pin, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function PageMarkersPanel({ book }: { book: Book }) {
  const markers = useLibrary((s) => s.markers.filter((m) => m.bookId === book.id));
  const addMarker = useLibrary((s) => s.addMarker);
  const removeMarker = useLibrary((s) => s.removeMarker);
  const [adding, setAdding] = useState(false);
  const [page, setPage] = useState("");
  const [label, setLabel] = useState("");

  const submit = () => {
    const p = parseInt(page, 10);
    if (isNaN(p) || p < 1 || p > book.pages) return;
    addMarker({ bookId: book.id, page: p, label: label.trim() || `Page ${p}` });
    setPage("");
    setLabel("");
    setAdding(false);
  };

  const sorted = [...markers].sort((a, b) => a.page - b.page);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Pin className="h-3 w-3" />
          <span>Page markers{sorted.length > 0 ? ` · ${sorted.length}` : ""}</span>
        </div>
        <button
          onClick={() => setAdding((v) => !v)}
          className="text-[11px] text-muted-foreground hover:text-foreground transition inline-flex items-center gap-0.5"
        >
          <Plus className="h-3 w-3" />
          Pin a moment
        </button>
      </div>

      {adding && (
        <div className="flex items-center gap-2 rounded-xl border border-border/50 bg-background/60 px-3 py-2">
          <Input
            type="number"
            min={1}
            max={book.pages}
            value={page}
            onChange={(e) => setPage(e.target.value)}
            placeholder="Page"
            className="h-7 w-16 text-center text-xs rounded-full"
            inputMode="numeric"
          />
          <Input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="What happened here?"
            className="h-7 text-xs flex-1 rounded-full"
            onKeyDown={(e) => e.key === "Enter" && submit()}
            autoFocus
          />
          <Button size="sm" className="h-7 rounded-full px-3 text-xs" onClick={submit}>
            Pin
          </Button>
        </div>
      )}

      {sorted.length > 0 && (
        <ol className="space-y-px">
          {sorted.map((m) => {
            const pct = Math.round((m.page / book.pages) * 100);
            return (
              <li
                key={m.id}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 bg-background/40 group"
              >
                <span className="text-[10px] font-mono tabular-nums text-muted-foreground w-8 shrink-0">
                  {pct}%
                </span>
                <div
                  className="h-1 w-8 rounded-full bg-muted overflow-hidden shrink-0"
                  aria-hidden
                >
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${pct}%`, background: "var(--mood-strong)" }}
                  />
                </div>
                <span className="text-xs flex-1 min-w-0 truncate">{m.label}</span>
                <span className="text-[10px] text-muted-foreground/60 tabular-nums shrink-0">
                  p.{m.page}
                </span>
                <button
                  onClick={() => removeMarker(m.id)}
                  className="opacity-0 group-hover:opacity-100 transition text-muted-foreground hover:text-destructive shrink-0"
                  aria-label="Remove marker"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
