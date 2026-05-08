import { useState } from "react";
import { TROPE_CATEGORIES, suggestTropes } from "@/lib/tropes";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, Wand2, X } from "lucide-react";

interface TropePickerProps {
  selected: string[];
  onChange: (tropes: string[]) => void;
  bookTitle?: string;
  bookTags?: string[];
  autoSuggested?: boolean;
  onClearAutoSuggested?: () => void;
}

export function TropePicker({
  selected,
  onChange,
  bookTitle = "",
  bookTags = [],
  autoSuggested = false,
  onClearAutoSuggested,
}: TropePickerProps) {
  const [expanded, setExpanded] = useState(false);
  const [openCat, setOpenCat] = useState<string | null>("Romance");

  const toggle = (trope: string) => {
    if (selected.includes(trope)) {
      onChange(selected.filter((t) => t !== trope));
      onClearAutoSuggested?.();
    } else if (selected.length < 10) {
      onChange([...selected, trope]);
      onClearAutoSuggested?.();
    }
  };

  const handleManualSuggest = () => {
    const suggestions = suggestTropes(bookTitle, bookTags);
    if (suggestions.length === 0) return;
    const next = [...new Set([...selected, ...suggestions])].slice(0, 10);
    onChange(next);
    setExpanded(true);
  };

  return (
    <div className="space-y-2">
      {/* Selected chips summary */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => toggle(t)}
              className="rounded-full bg-foreground text-background border border-foreground px-2.5 py-1 text-[11px] transition hover:opacity-80"
            >
              {t} ×
            </button>
          ))}
        </div>
      )}

      {/* Auto-suggested indicator */}
      {autoSuggested && selected.length > 0 && (
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Wand2 className="h-3 w-3" style={{ color: "var(--mood-strong)" }} />
          <span>Auto-suggested from title — tap any to remove</span>
          <button
            type="button"
            onClick={() => { onChange([]); onClearAutoSuggested?.(); }}
            className="ml-auto flex items-center gap-0.5 hover:text-foreground transition"
            title="Clear auto-suggestions"
          >
            <X className="h-3 w-3" /> Clear
          </button>
        </div>
      )}

      {/* Expand / collapse toggle + manual refresh */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition"
        >
          {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          {expanded ? "Hide tropes" : `Browse tropes${selected.length > 0 ? ` (${selected.length} selected)` : ""}`}
        </button>
        {bookTitle && (
          <button
            type="button"
            onClick={handleManualSuggest}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition"
            title="Re-run suggestions from title"
          >
            <Wand2 className="h-3 w-3" /> Refresh
          </button>
        )}
      </div>

      {expanded && (
        <div className="rounded-2xl border border-border/50 bg-background/50 overflow-hidden">
          {/* Category tabs */}
          <div className="flex overflow-x-auto border-b border-border/40 scrollbar-none">
            {TROPE_CATEGORIES.map((cat) => (
              <button
                key={cat.name}
                type="button"
                onClick={() => setOpenCat(openCat === cat.name ? null : cat.name)}
                className={cn(
                  "flex-shrink-0 px-3 py-2 text-[11px] font-medium transition whitespace-nowrap",
                  openCat === cat.name
                    ? "border-b-2 border-foreground text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {cat.emoji} {cat.name}
              </button>
            ))}
          </div>

          {/* Active category chips */}
          {openCat && (() => {
            const cat = TROPE_CATEGORIES.find((c) => c.name === openCat);
            if (!cat) return null;
            return (
              <div className="flex flex-wrap gap-1.5 p-3">
                {cat.tropes.map((trope) => {
                  const active = selected.includes(trope);
                  const disabled = !active && selected.length >= 10;
                  return (
                    <button
                      key={trope}
                      type="button"
                      disabled={disabled}
                      onClick={() => toggle(trope)}
                      className={cn(
                        "rounded-full border px-2.5 py-1 text-[11px] transition",
                        active
                          ? "bg-foreground text-background border-foreground"
                          : disabled
                          ? "opacity-40 cursor-not-allowed bg-white/40 border-border"
                          : "bg-white/60 border-border hover:bg-white"
                      )}
                    >
                      {trope}
                    </button>
                  );
                })}
              </div>
            );
          })()}
          <p className="text-[10px] text-muted-foreground px-3 pb-2">Up to 10 tropes per book.</p>
        </div>
      )}
    </div>
  );
}
