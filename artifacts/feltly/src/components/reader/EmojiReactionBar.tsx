import { useState } from "react";
import { REACTION_EMOJIS, ReactionEmoji } from "@/lib/moods";
import { cn } from "@/lib/utils";

export function EmojiReactionBar({
  onReact,
}: {
  onReact: (e: ReactionEmoji) => void;
}) {
  const [bursting, setBursting] = useState<string | null>(null);
  return (
    <div className="flex flex-wrap gap-2 rounded-2xl bg-white/40 border border-border/40 p-1.5">
      {REACTION_EMOJIS.map((e) => (
        <button
          key={e}
          onClick={() => {
            onReact(e);
            setBursting(e);
            setTimeout(() => setBursting(null), 400);
          }}
          className={cn(
            "h-11 w-11 rounded-full bg-white/80 hover:bg-white transition",
            "border border-border/60 text-xl shadow-soft",
            "hover:scale-110 active:scale-95",
            bursting === e && "animate-pop"
          )}
          aria-label={`React with ${e}`}
        >
          {e}
        </button>
      ))}
    </div>
  );
}
