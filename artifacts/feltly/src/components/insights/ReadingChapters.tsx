import { useEffect, useMemo, useState } from "react";
import { useLibrary } from "@/lib/store";
import { computeChapters, getSeenChapterIds, markChaptersSeen } from "@/lib/chapters";
import { BookOpen, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function ReadingChapters() {
  const { books, sessions, reactionLog, reflections, journal } = useLibrary();
  const [open, setOpen] = useState(false);
  const [newIds, setNewIds] = useState<Set<string>>(new Set());

  const chapters = useMemo(
    () => computeChapters({ books, sessions, reactionLog, reflections, journal }),
    [books, sessions, reactionLog, reflections, journal],
  );

  const unlockedIds = useMemo(
    () => chapters.filter((c) => c.unlocked).map((c) => c.id),
    [chapters],
  );

  // Detect newly unlocked chapters on mount and after data changes
  useEffect(() => {
    const seen = getSeenChapterIds();
    const fresh = new Set(unlockedIds.filter((id) => !seen.has(id)));
    setNewIds(fresh);
  }, [unlockedIds]);

  // Mark all unlocked as seen when the panel opens
  useEffect(() => {
    if (open && unlockedIds.length) {
      markChaptersSeen(unlockedIds);
      setNewIds(new Set());
    }
  }, [open, unlockedIds]);

  const unlocked = chapters.filter((c) => c.unlocked).length;

  return (
    <section className="rounded-2xl bg-card/70 border border-border/40 overflow-hidden">
      {/* Collapsible header */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-3 p-6 text-left hover:bg-foreground/[0.02] transition"
        aria-expanded={open}
      >
        <div className="flex items-center gap-3">
          <BookOpen className="h-4 w-4 shrink-0" style={{ color: "var(--mood-strong)" }} />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-2xl leading-none">Your reading story</h2>
              {newIds.size > 0 && (
                <span className="rounded-full bg-foreground text-background text-[10px] font-medium px-2 py-0.5 leading-none">
                  {newIds.size} new
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {unlocked} of {chapters.length} chapters opened
            </p>
          </div>
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>

      {/* Chapter list */}
      {open && (
        <div className="px-6 pb-6">
          <ol className="space-y-px">
            {chapters.map((chapter, i) => {
              const isNew = newIds.has(chapter.id);
              return (
                <li key={chapter.id}>
                  {/* Connector line between chapters */}
                  {i > 0 && (
                    <div className="flex justify-start pl-[1.35rem] py-0.5">
                      <div
                        className={cn(
                          "w-px h-4",
                          chapters[i - 1].unlocked && chapter.unlocked
                            ? "bg-foreground/20"
                            : "bg-border/30",
                        )}
                      />
                    </div>
                  )}
                  <div
                    className={cn(
                      "flex items-start gap-4 rounded-xl p-4 transition-all",
                      chapter.unlocked
                        ? isNew
                          ? "bg-foreground/[0.06] ring-1 ring-foreground/20"
                          : "bg-foreground/[0.03]"
                        : "opacity-50",
                    )}
                  >
                    {/* Emoji + number column */}
                    <div className="flex flex-col items-center gap-1 shrink-0 w-8 pt-0.5">
                      <span
                        className={cn(
                          "text-xl leading-none",
                          !chapter.unlocked && "grayscale",
                        )}
                      >
                        {chapter.emoji}
                      </span>
                    </div>

                    {/* Text column */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={cn(
                            "font-display text-base leading-tight",
                            !chapter.unlocked && "text-muted-foreground",
                          )}
                        >
                          {chapter.title}
                        </span>
                        {isNew && (
                          <span className="rounded-full bg-foreground text-background text-[9px] font-medium px-1.5 py-0.5 leading-none">
                            New
                          </span>
                        )}
                      </div>

                      {chapter.unlocked ? (
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed italic">
                          "{chapter.tagline}"
                        </p>
                      ) : (
                        <>
                          <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                            {chapter.hint}
                          </p>
                          {/* Progress bar */}
                          <div className="h-0.5 mt-2 rounded-full bg-muted overflow-hidden w-full max-w-[120px]">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${chapter.progress * 100}%`,
                                background: "var(--mood-strong)",
                              }}
                            />
                          </div>
                        </>
                      )}
                    </div>

                    {/* Chapter number */}
                    <div
                      className={cn(
                        "text-[10px] font-mono tabular-nums shrink-0 mt-1",
                        chapter.unlocked ? "text-foreground/30" : "text-muted-foreground/40",
                      )}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </section>
  );
}
