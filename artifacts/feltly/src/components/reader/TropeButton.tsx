import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { tropeCategory } from "@/lib/tropes";
import { Layers } from "lucide-react";
import { Link } from "react-router-dom";

interface TropeButtonProps {
  tropes: string[];
  bookId: string;
}

export function TropeButton({ tropes, bookId }: TropeButtonProps) {
  if (tropes.length === 0) {
    return (
      <Link
        to={`/book/${bookId}`}
        className="inline-flex items-center gap-1 rounded-full border border-dashed border-border/60 px-2.5 py-1 text-[11px] text-muted-foreground hover:text-foreground hover:border-border transition"
        title="Add tropes via Edit book"
      >
        <Layers className="h-3 w-3" />
        + Trope
      </Link>
    );
  }

  const first = tropes[0];
  const cat = tropeCategory(first);
  const rest = tropes.length - 1;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/60 px-2.5 py-1 text-[11px] font-medium transition hover:bg-background hover:border-border"
          title="Tropes tagged on this book"
        >
          <span className="text-sm leading-none">{cat?.emoji ?? "📖"}</span>
          <span className="truncate max-w-[96px]">{first}</span>
          {rest > 0 && (
            <span className="rounded-full bg-foreground/10 px-1.5 py-0.5 text-[9px] font-bold leading-none tabular-nums">
              +{rest}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3 space-y-3" align="start" sideOffset={6}>
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
          Tropes · {tropes.length}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {tropes.map((t) => {
            const c = tropeCategory(t);
            return (
              <span
                key={t}
                className="inline-flex items-center gap-1 rounded-full border border-border/50 bg-background/60 px-2 py-1 text-[11px]"
              >
                <span className="text-sm leading-none">{c?.emoji ?? "📖"}</span>
                {t}
              </span>
            );
          })}
        </div>
        <div className="flex items-center justify-between pt-0.5 border-t border-border/40">
          <Link
            to="/tropes"
            className="text-[11px] text-muted-foreground hover:text-foreground transition"
          >
            Your trope universe →
          </Link>
          <Link
            to={`/book/${bookId}`}
            className="text-[11px] text-muted-foreground hover:text-foreground transition"
          >
            Edit
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
