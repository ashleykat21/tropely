import { useState } from "react";
import { MOODS, type MoodKey } from "@/lib/moods";
import { useLibrary, type Book } from "@/lib/store";
import { Sparkles, Lock } from "lucide-react";
import { toast } from "sonner";
import { usePremium } from "@/lib/usePremium";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const INTENT_KEY = "feltly-tbr-mood-intent";

function getIntents(): Record<string, MoodKey> {
  try {
    return JSON.parse(localStorage.getItem(INTENT_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function setIntent(bookId: string, mood: MoodKey | null) {
  const all = getIntents();
  if (mood) all[bookId] = mood;
  else delete all[bookId];
  localStorage.setItem(INTENT_KEY, JSON.stringify(all));
}

export function useTbrIntent(bookId: string): [MoodKey | null, (m: MoodKey | null) => void] {
  const [intent, setLocalIntent] = useState<MoodKey | null>(
    () => getIntents()[bookId] ?? null
  );
  const update = (m: MoodKey | null) => {
    setLocalIntent(m);
    setIntent(bookId, m);
  };
  return [intent, update];
}

export function TbrMoodIntentBadge({ book }: { book: Book }) {
  const [intent, setLocalIntent] = useState<MoodKey | null>(
    () => getIntents()[book.id] ?? null
  );
  const [open, setOpen] = useState(false);
  const isPremium = usePremium((s) => s.isPremium);

  const update = (m: MoodKey | null) => {
    setLocalIntent(m);
    setIntent(book.id, m);
    setOpen(false);
    if (m) toast.success(`Mood intent set: ${MOODS[m].label}`);
    else toast.success("Mood intent cleared.");
  };

  const m = intent ? MOODS[intent] : null;

  if (!isPremium) {
    return (
      <button
        className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-0.5 rounded-full bg-background/90 border border-border/60 px-1.5 py-0.5 text-[9px] opacity-0 group-hover:opacity-100 transition shadow-sm whitespace-nowrap"
        title="Mood intent — Premium"
        onClick={(e) => {
          e.stopPropagation();
          toast("Mood Intent is Premium", {
            description: "Tag each Want-to-Read book with the feeling you hope to get. Upgrade to unlock.",
            icon: <Sparkles className="h-4 w-4" />,
          });
        }}
      >
        <Lock className="h-2.5 w-2.5 text-muted-foreground" />
        <span className="text-muted-foreground">mood intent</span>
      </button>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-0.5 rounded-full bg-background/90 border border-border/60 px-1.5 py-0.5 text-[9px] opacity-0 group-hover:opacity-100 transition shadow-sm whitespace-nowrap"
          title="Set mood intent"
          onClick={(e) => e.stopPropagation()}
        >
          {m ? (
            <>{m.emoji} <span className="text-muted-foreground">{m.label}</span></>
          ) : (
            <><Sparkles className="h-2.5 w-2.5" style={{ color: "var(--mood-strong)" }} /> mood intent</>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" onClick={(e) => e.stopPropagation()}>
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            How do you hope to feel?
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(MOODS) as MoodKey[]).map((k) => {
              const md = MOODS[k];
              const active = intent === k;
              return (
                <button
                  key={k}
                  onClick={() => update(active ? null : k)}
                  className={`rounded-full border px-2.5 py-1 text-[11px] transition flex items-center gap-1 ${
                    active
                      ? "bg-foreground text-background border-foreground"
                      : "bg-white/60 border-border hover:bg-white"
                  }`}
                >
                  {md.emoji} {md.label}
                </button>
              );
            })}
          </div>
          {intent && (
            <button
              onClick={() => update(null)}
              className="text-[10px] text-muted-foreground hover:text-foreground"
            >
              Clear intent
            </button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function TbrIntentStrip() {
  const books = useLibrary((s) => s.books);
  const isPremium = usePremium((s) => s.isPremium);
  const want = books.filter((b) => b.shelf === "want");

  const intents = getIntents();
  const withIntent = want.filter((b) => intents[b.id]);

  if (withIntent.length === 0) return null;

  if (!isPremium) {
    return (
      <button
        onClick={() =>
          toast("Mood Intent Strip is Premium", {
            description: "See all your TBR mood intentions at a glance. Upgrade to unlock.",
            icon: <Sparkles className="h-4 w-4" />,
          })
        }
        className="flex items-center gap-2 rounded-xl border border-dashed border-border/50 bg-card/40 px-3 py-2 text-xs text-muted-foreground hover:bg-foreground/5 transition w-full"
      >
        <Lock className="h-3 w-3 shrink-0" />
        <span>
          Mood intent overview &mdash; <strong>{withIntent.length}</strong> {withIntent.length === 1 ? "book" : "books"} with intent set &middot; Premium
        </span>
      </button>
    );
  }

  return (
    <div className="flex flex-wrap gap-2 px-1">
      {withIntent.map((b) => {
        const k = intents[b.id] as MoodKey;
        const m = MOODS[k];
        return (
          <div
            key={b.id}
            className="flex items-center gap-1.5 rounded-full border border-border/40 bg-card/70 px-2.5 py-1 text-[11px]"
            style={{ borderColor: `hsl(${m.h} ${m.s}% ${m.l}% / 0.4)` }}
          >
            <span>{m.emoji}</span>
            <span className="font-display truncate max-w-[8rem]">{b.title}</span>
            <span className="text-muted-foreground">&middot; {m.label}</span>
          </div>
        );
      })}
    </div>
  );
}
