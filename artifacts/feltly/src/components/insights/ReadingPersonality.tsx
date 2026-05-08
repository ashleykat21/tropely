import { useMemo } from "react";
import { useLibrary } from "@/lib/store";
import { MOODS, type MoodKey } from "@/lib/moods";
import { LockedFeature } from "@/components/premium/LockedFeature";
import { Sparkles } from "lucide-react";

type Personality = {
  name: string;
  tagline: string;
  description: string;
  emoji: string;
  moods: MoodKey[];
};

const PERSONALITIES: Personality[] = [
  {
    name: "The Midnight Wanderer",
    tagline: "You chase the dark side of human nature.",
    description: "Mystery and intensity draw you in. You read to understand what lies beneath the surface — the secrets, the shadows, the things left unsaid.",
    emoji: "🌙",
    moods: ["mysterious", "intense"],
  },
  {
    name: "The Cozy Homebody",
    tagline: "Books are your warmest room.",
    description: "You reach for calm and cozy reads — stories that feel like a warm drink on a cold evening. Your library is a refuge, not an adventure.",
    emoji: "🕯️",
    moods: ["cozy", "calm"],
  },
  {
    name: "The Stargazer",
    tagline: "You read between worlds.",
    description: "Dreamy, atmospheric, and quietly profound — your reads leave you staring at the ceiling long after the last page. You live for the feeling of being somewhere else entirely.",
    emoji: "✨",
    moods: ["dreamy", "melancholy"],
  },
  {
    name: "The Joyful Explorer",
    tagline: "Every book is a reason to celebrate.",
    description: "You bring warmth to everything you read. Joyful and present, you're the person who tells everyone about the book they just have to read.",
    emoji: "🌻",
    moods: ["joyful", "cozy"],
  },
  {
    name: "The Quiet Tide",
    tagline: "You feel everything, slowly.",
    description: "Melancholy and calm guide your reading life. You're drawn to books that linger — the kind you don't want to rush, because finishing feels like a small loss.",
    emoji: "🌊",
    moods: ["calm", "melancholy"],
  },
  {
    name: "The Electric Reader",
    tagline: "You read at full voltage.",
    description: "Intense, driving, page-turning — you thrive on books that demand everything. Your reading sessions are events, not habits.",
    emoji: "🔥",
    moods: ["intense", "joyful"],
  },
  {
    name: "The Wide-Eyed Wanderer",
    tagline: "No mood holds you long.",
    description: "You move fluidly across emotional registers — calm one week, dreamy the next. You resist being pinned down, and your library proves it.",
    emoji: "🗺️",
    moods: [],
  },
];

function derivePersonality(moodCounts: Record<string, number>): Personality {
  const sorted = Object.entries(moodCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([k]) => k as MoodKey);

  const top = sorted[0];
  const second = sorted[1];

  for (const p of PERSONALITIES.slice(0, -1)) {
    const [m1, m2] = p.moods;
    if (top === m1 || top === m2 || second === m1 || second === m2) {
      if (p.moods.includes(top) && (p.moods.includes(second) || !second)) {
        return p;
      }
    }
  }
  // Check single dominant mood match
  for (const p of PERSONALITIES.slice(0, -1)) {
    if (p.moods.includes(top)) return p;
  }
  // Fallback: Wide-Eyed Wanderer
  return PERSONALITIES[PERSONALITIES.length - 1];
}

export function ReadingPersonality() {
  const { books, sessions, journal } = useLibrary();

  const personality = useMemo(() => {
    const moodCounts: Record<string, number> = {};
    // Count from books (weighted by progress)
    books.forEach((b) => {
      const weight = b.progress > 0 ? Math.log(b.progress + 1) : 0.5;
      moodCounts[b.mood] = (moodCounts[b.mood] ?? 0) + weight;
    });
    // Count from sessions
    sessions.forEach((s) => {
      const b = books.find((b) => b.id === s.bookId);
      if (b) moodCounts[b.mood] = (moodCounts[b.mood] ?? 0) + 0.3;
    });
    if (Object.keys(moodCounts).length === 0) return null;
    return derivePersonality(moodCounts);
  }, [books, sessions]);

  const topMoods = useMemo(() => {
    const counts: Record<string, number> = {};
    books.forEach((b) => { counts[b.mood] = (counts[b.mood] ?? 0) + 1; });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([k]) => k as MoodKey);
  }, [books]);

  const totalEntries = journal.length + sessions.length + books.length;
  if (totalEntries < 3 || !personality) return null;

  return (
    <LockedFeature
      title="Reading Personality"
      description="Discover your reading archetype based on the moods, books, and sessions in your library. Upgrade to unlock."
    >
      <section className="rounded-2xl border border-border/40 bg-card/70 p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4" style={{ color: "var(--mood-strong)" }} />
          <h3 className="font-display text-xl">Your reading personality</h3>
        </div>

        <div className="rounded-xl border border-border/40 bg-background/50 p-5 space-y-3">
          <div className="flex items-start gap-3">
            <span className="text-4xl leading-none mt-0.5">{personality.emoji}</span>
            <div>
              <div className="font-display text-2xl leading-tight">{personality.name}</div>
              <div className="text-sm text-muted-foreground italic mt-0.5">{personality.tagline}</div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{personality.description}</p>
        </div>

        {topMoods.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <span className="text-xs text-muted-foreground self-center">Top moods:</span>
            {topMoods.map((k) => {
              const m = MOODS[k];
              return (
                <span
                  key={k}
                  className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px]"
                  style={{ borderColor: `hsl(${m.h} ${m.s}% ${m.l}% / 0.5)`, background: `hsl(${m.h} ${m.s}% ${m.l}% / 0.1)` }}
                >
                  {m.emoji} {m.label}
                </span>
              );
            })}
          </div>
        )}
      </section>
    </LockedFeature>
  );
}
