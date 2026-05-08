import { useFamilyStore, loadProfileData } from "@/lib/familyStore";
import { computeStreak } from "@/lib/streak";
import { useMemo } from "react";
import { Flame } from "lucide-react";
import { ManageFamilySheet } from "./ManageFamilySheet";
import { useState } from "react";

type ProfileSnap = {
  id: string;
  name: string;
  emoji: string;
  bookCount: number;
  streak: number;
};

export function FamilyProgressCard() {
  const { profiles, activeProfileId } = useFamilyStore();
  const [manageOpen, setManageOpen] = useState(false);

  const snaps: ProfileSnap[] = useMemo(() => {
    return profiles.map((p) => {
      if (p.id === activeProfileId) {
        return null;
      }
      try {
        const data = loadProfileData(p.id) as Record<string, unknown> | null;
        const books = Array.isArray(data?.books) ? data!.books as unknown[] : [];
        const sessions = Array.isArray(data?.sessions) ? data!.sessions as Parameters<typeof computeStreak>[0] : [];
        const freeze = (data?.freeze as Parameters<typeof computeStreak>[1]) ?? { available: 0, lastEarnedWeek: "", consumedDays: [] };
        const { current } = computeStreak(sessions, freeze);
        return { id: p.id, name: p.name, emoji: p.emoji, bookCount: books.length, streak: current };
      } catch {
        return { id: p.id, name: p.name, emoji: p.emoji, bookCount: 0, streak: 0 };
      }
    }).filter(Boolean) as ProfileSnap[];
  }, [profiles, activeProfileId]);

  if (snaps.length === 0) return null;

  return (
    <>
      <section className="w-full max-w-3xl rounded-2xl border border-border/50 bg-card/70 backdrop-blur p-5">
        <div className="flex items-center justify-between mb-3 gap-3">
          <div className="group-heading">Family reading</div>
          <button
            onClick={() => setManageOpen(true)}
            className="inline-flex items-center min-h-[44px] px-3 -mr-2 rounded-full text-sm text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition"
          >
            Manage →
          </button>
        </div>
        <div className="flex flex-wrap gap-2.5">
          {snaps.map((s) => (
            <div
              key={s.id}
              className="flex items-center gap-3 rounded-xl border border-border/40 bg-background/40 px-3.5 py-2.5 min-h-[52px]"
            >
              <span className="text-2xl leading-none" aria-hidden>{s.emoji}</span>
              <div className="leading-tight">
                <div className="text-sm font-medium">{s.name}</div>
                <div className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1.5">
                  <span>{s.bookCount} book{s.bookCount !== 1 ? "s" : ""}</span>
                  {s.streak > 0 && (
                    <>
                      <span className="text-border" aria-hidden>·</span>
                      <span className="inline-flex items-center gap-1">
                        <Flame className="h-3 w-3" style={{ color: "var(--mood-strong)" }} />
                        {s.streak}d
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
      <ManageFamilySheet open={manageOpen} onClose={() => setManageOpen(false)} />
    </>
  );
}
