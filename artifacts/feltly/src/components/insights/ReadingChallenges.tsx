import { useState, useMemo } from "react";
import { useLibrary } from "@/lib/store";
import { Trophy, Plus, Check, X, Target, BookOpen, Flame, Star, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const STORAGE_KEY = "tropely-reading-challenges";

type Challenge = {
  id: string;
  title: string;
  goal: number;
  unit: "books" | "pages" | "sessions" | "custom";
  autoTrack: boolean;
  manualProgress?: number;
  createdAt: number;
  completedAt?: number;
};

type ChallengeWithProgress = Challenge & { progress: number; pct: number; done: boolean };

const TEMPLATES: Omit<Challenge, "id" | "createdAt">[] = [
  { title: "Read 12 books this year", goal: 12, unit: "books", autoTrack: true },
  { title: "Log 50 reading sessions", goal: 50, unit: "sessions", autoTrack: true },
  { title: "Read 5,000 pages", goal: 5000, unit: "pages", autoTrack: true },
  { title: "Finish a book in a new genre", goal: 1, unit: "books", autoTrack: false },
  { title: "Read a book in one sitting", goal: 1, unit: "custom", autoTrack: false },
  { title: "Read 5 consecutive days", goal: 5, unit: "sessions", autoTrack: false },
  { title: "Try an audiobook", goal: 1, unit: "custom", autoTrack: false },
  { title: "Re-read a favourite", goal: 1, unit: "custom", autoTrack: false },
];

function load(): Challenge[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]"); } catch { return []; }
}
function save(data: Challenge[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function uid() { return Math.random().toString(36).slice(2, 10); }

export function ReadingChallenges() {
  const { books, sessions } = useLibrary();
  const [challenges, setChallenges] = useState<Challenge[]>(load);
  const [showTemplates, setShowTemplates] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newGoal, setNewGoal] = useState("10");
  const [newUnit, setNewUnit] = useState<Challenge["unit"]>("books");
  const [showForm, setShowForm] = useState(false);

  const bookCount = books.filter((b) => b.shelf === "finished").length;
  const pageCount = sessions.reduce((a, s) => a + s.pagesRead, 0);
  const sessionCount = sessions.length;

  const withProgress = useMemo<ChallengeWithProgress[]>(() => {
    return challenges.map((c) => {
      let progress = c.manualProgress ?? 0;
      if (c.autoTrack) {
        if (c.unit === "books") progress = bookCount;
        else if (c.unit === "pages") progress = pageCount;
        else if (c.unit === "sessions") progress = sessionCount;
      }
      const pct = Math.min(1, progress / Math.max(1, c.goal));
      const done = progress >= c.goal;
      return { ...c, progress, pct, done };
    });
  }, [challenges, bookCount, pageCount, sessionCount]);

  const persist = (next: Challenge[]) => {
    setChallenges(next);
    save(next);
  };

  const addTemplate = (t: Omit<Challenge, "id" | "createdAt">) => {
    const already = challenges.some((c) => c.title === t.title);
    if (already) { toast("Already tracking that challenge."); return; }
    persist([...challenges, { ...t, id: uid(), createdAt: Date.now() }]);
    toast.success("Challenge added!");
    setShowTemplates(false);
  };

  const addCustom = () => {
    const goal = parseInt(newGoal, 10);
    if (!newTitle.trim() || isNaN(goal) || goal < 1) {
      toast.error("Enter a title and a goal number.");
      return;
    }
    persist([...challenges, {
      id: uid(),
      title: newTitle.trim(),
      goal,
      unit: newUnit,
      autoTrack: newUnit !== "custom",
      createdAt: Date.now(),
    }]);
    setNewTitle("");
    setNewGoal("10");
    setShowForm(false);
    toast.success("Challenge created!");
  };

  const bump = (id: string) => {
    persist(challenges.map((c) => {
      if (c.id !== id || c.autoTrack) return c;
      const next = (c.manualProgress ?? 0) + 1;
      const done = next >= c.goal;
      if (done && !c.completedAt) toast.success("🏆 Challenge complete!");
      return { ...c, manualProgress: next, completedAt: done ? Date.now() : c.completedAt };
    }));
  };

  const remove = (id: string) => {
    persist(challenges.filter((c) => c.id !== id));
  };

  const unitLabel = (c: ChallengeWithProgress) => {
    if (c.unit === "custom") return "";
    return ` ${c.unit}`;
  };

  return (
    <section className="rounded-2xl bg-card/70 p-6 border border-border/40 space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4" style={{ color: "var(--mood-strong)" }} />
          <h3 className="font-display text-2xl">Reading challenges</h3>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setShowTemplates((v) => !v); setShowForm(false); }}
            className="rounded-full border border-border/60 bg-card/80 px-3 py-1.5 text-xs hover:bg-foreground/5 transition flex items-center gap-1.5"
          >
            <Target className="h-3.5 w-3.5" /> Templates
          </button>
          <button
            onClick={() => { setShowForm((v) => !v); setShowTemplates(false); }}
            className="rounded-full border border-border/60 bg-card/80 px-3 py-1.5 text-xs hover:bg-foreground/5 transition flex items-center gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" /> Custom
          </button>
        </div>
      </div>

      {showTemplates && (
        <div className="rounded-2xl border border-border/40 bg-background/40 p-4 space-y-2">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Choose a template</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {TEMPLATES.map((t) => {
              const taken = challenges.some((c) => c.title === t.title);
              return (
                <button
                  key={t.title}
                  onClick={() => addTemplate(t)}
                  disabled={taken}
                  className={cn(
                    "text-left rounded-xl border p-3 text-sm transition",
                    taken
                      ? "border-border/30 opacity-40 cursor-not-allowed"
                      : "border-border/60 hover:border-foreground/40 hover:bg-foreground/[0.02]"
                  )}
                >
                  <div className="font-medium leading-snug">{t.title}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    Goal: {t.goal.toLocaleString()} {t.unit !== "custom" ? t.unit : "completion"}
                    {t.autoTrack ? " · auto-tracked" : " · manual"}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {showForm && (
        <div className="rounded-2xl border border-border/40 bg-background/40 p-4 space-y-3">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Custom challenge</p>
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="e.g. Read before bed every night…"
            className="bg-white/80"
          />
          <div className="flex gap-2 items-end">
            <div className="w-28">
              <label className="text-xs text-muted-foreground">Goal</label>
              <Input
                type="number"
                min={1}
                value={newGoal}
                onChange={(e) => setNewGoal(e.target.value)}
                className="bg-white/80 h-9"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-muted-foreground">Unit</label>
              <div className="flex gap-1 flex-wrap mt-1">
                {(["books", "pages", "sessions", "custom"] as Challenge["unit"][]).map((u) => (
                  <button
                    key={u}
                    onClick={() => setNewUnit(u)}
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-xs transition capitalize",
                      newUnit === u
                        ? "bg-foreground text-background border-foreground"
                        : "border-border/60 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>
            <Button onClick={addCustom} className="rounded-full h-9">Add</Button>
          </div>
        </div>
      )}

      {withProgress.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/50 p-8 text-center space-y-2">
          <div className="text-2xl">🏆</div>
          <p className="text-sm text-muted-foreground">No challenges yet. Pick a template or create your own.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {withProgress.map((c) => (
            <div
              key={c.id}
              className={cn(
                "rounded-xl border p-4 space-y-2 transition",
                c.done
                  ? "border-amber-200 bg-amber-50/40"
                  : "border-border/40 bg-background/30"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-0.5 flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    {c.done && <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400 shrink-0" />}
                    <span className="text-sm font-medium leading-snug">{c.title}</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {c.progress.toLocaleString()} / {c.goal.toLocaleString()}{unitLabel(c)}
                    {c.autoTrack && <span className="ml-1 opacity-60">· auto</span>}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  {!c.autoTrack && !c.done && (
                    <button
                      onClick={() => bump(c.id)}
                      title="Mark one progress"
                      className="rounded-full border border-border/60 bg-background/80 p-1 hover:bg-foreground/5 transition"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  )}
                  {c.done && (
                    <div className="rounded-full bg-amber-100 border border-amber-200 p-1">
                      <Check className="h-3.5 w-3.5 text-amber-600" />
                    </div>
                  )}
                  <button
                    onClick={() => remove(c.id)}
                    title="Remove challenge"
                    className="rounded-full border border-border/60 bg-background/80 p-1 hover:bg-foreground/5 transition text-muted-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${c.pct * 100}%`,
                    background: c.done ? "hsl(45 90% 55%)" : "var(--mood-strong)",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
