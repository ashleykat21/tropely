import { useLibrary } from "@/lib/store";
import type { BookcaseShelfStyle, BookcaseSpineStyle } from "@/lib/store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const SHELF_OPTIONS: {
  key: BookcaseShelfStyle;
  label: string;
  preview: string;
  dark?: boolean;
}[] = [
  {
    key: "classic-wood",
    label: "Classic Wood",
    preview: "linear-gradient(135deg,hsl(28 50% 30%),hsl(22 40% 18%))",
    dark: true,
  },
  {
    key: "light-oak",
    label: "Light Oak",
    preview: "linear-gradient(135deg,hsl(36 55% 72%),hsl(32 46% 60%))",
  },
  {
    key: "dark-walnut",
    label: "Dark Walnut",
    preview: "linear-gradient(135deg,hsl(20 28% 16%),hsl(16 20% 10%))",
    dark: true,
  },
  {
    key: "cozy-pastel",
    label: "Cozy Pastel",
    preview: "linear-gradient(135deg,hsl(22 55% 78%),hsl(18 46% 66%))",
  },
  {
    key: "minimal-cream",
    label: "Minimal Cream",
    preview: "linear-gradient(135deg,hsl(40 22% 80%),hsl(36 18% 68%))",
  },
];

const SPINE_OPTIONS: {
  key: BookcaseSpineStyle;
  label: string;
  description: string;
  swatches: string[];
}[] = [
  {
    key: "colorful",
    label: "Colorful",
    description: "Vibrant, unique color per book",
    swatches: [
      "hsl(350 58% 52%)",
      "hsl(42 68% 52%)",
      "hsl(185 48% 40%)",
      "hsl(262 44% 54%)",
      "hsl(22 62% 50%)",
    ],
  },
  {
    key: "neutral",
    label: "Neutral",
    description: "Muted taupes and warm grays",
    swatches: [
      "hsl(35 18% 58%)",
      "hsl(30 14% 52%)",
      "hsl(45 16% 66%)",
      "hsl(200 10% 54%)",
      "hsl(25 20% 46%)",
    ],
  },
  {
    key: "mood-based",
    label: "Mood-based",
    description: "Colors follow each book's emotional tone",
    swatches: [
      "hsl(190 35% 60%)",
      "hsl(28 55% 60%)",
      "hsl(220 25% 55%)",
      "hsl(270 40% 65%)",
      "hsl(45 70% 60%)",
    ],
  },
  {
    key: "genre-based",
    label: "Genre-based",
    description: "Colored by trope category when tagged",
    swatches: [
      "hsl(350 55% 50%)",
      "hsl(220 48% 48%)",
      "hsl(280 42% 52%)",
      "hsl(240 35% 40%)",
      "hsl(48 65% 50%)",
    ],
  },
];

export function BookshelfCustomizer() {
  const bookcaseStyle = useLibrary((s) => s.bookcaseStyle);
  const setBookcaseStyle = useLibrary((s) => s.setBookcaseStyle);

  return (
    <div className="space-y-6 p-4 rounded-2xl border border-border/50 bg-card/60 backdrop-blur">
      {/* Shelf style */}
      <div>
        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-3">
          Shelf style
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {SHELF_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => {
                setBookcaseStyle({ shelf: opt.key });
                toast.success(`Shelf: ${opt.label}`);
              }}
              className={cn(
                "rounded-xl border p-2.5 text-left transition active:scale-95",
                bookcaseStyle.shelf === opt.key
                  ? "border-foreground ring-1 ring-foreground/20"
                  : "border-border hover:border-foreground/30"
              )}
            >
              <div
                className="h-8 rounded-md mb-2"
                style={{ background: opt.preview }}
              />
              <span
                className="text-[11px] font-medium"
                style={{ color: opt.dark ? "hsl(0 0% 65%)" : undefined }}
              >
                {opt.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Spine style */}
      <div>
        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-3">
          Book spine colors
        </p>
        <div className="space-y-2">
          {SPINE_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => {
                setBookcaseStyle({ spine: opt.key });
                toast.success(`Spines: ${opt.label}`);
              }}
              className={cn(
                "w-full flex items-center gap-3 rounded-xl border p-3 text-left transition active:scale-95",
                bookcaseStyle.spine === opt.key
                  ? "border-foreground ring-1 ring-foreground/20 bg-foreground/[0.03]"
                  : "border-border hover:border-foreground/30"
              )}
            >
              <div className="flex gap-[3px] shrink-0">
                {opt.swatches.map((c, i) => (
                  <div
                    key={i}
                    className="w-[10px] h-9 rounded-[3px]"
                    style={{ background: c }}
                  />
                ))}
              </div>
              <div className="min-w-0">
                <p className="text-[12px] font-medium leading-tight">{opt.label}</p>
                <p className="text-[10px] text-muted-foreground leading-snug mt-0.5">
                  {opt.description}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
