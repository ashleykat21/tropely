import { useLibrary, type ShelfTheme } from "@/lib/store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Pipette } from "lucide-react";
import { useRef } from "react";

const PRESETS: { key: string; label: string; theme: ShelfTheme; dark?: boolean }[] = [
  // ── Light ──────────────────────────────────────────────────────────
  { key: "default",    label: "Mood",       theme: { background: "default",            accent: "var(--mood-strong)", texture: "none" } },
  { key: "ivory",      label: "Ivory",      theme: { background: "hsl(50 40% 97%)",    accent: "hsl(42 60% 50%)",    texture: "none" } },
  { key: "linen",      label: "Linen",      theme: { background: "hsl(38 30% 95%)",    accent: "hsl(15 60% 55%)",    texture: "linen" } },
  { key: "paper",      label: "Paper",      theme: { background: "hsl(45 40% 96%)",    accent: "hsl(28 50% 45%)",    texture: "paper" } },
  { key: "rose",       label: "Rose",       theme: { background: "hsl(345 35% 96%)",   accent: "hsl(345 55% 58%)",   texture: "none" } },
  { key: "sage",       label: "Sage",       theme: { background: "hsl(140 25% 94%)",   accent: "hsl(145 40% 42%)",   texture: "none" } },
  { key: "sky",        label: "Sky",        theme: { background: "hsl(205 50% 95%)",   accent: "hsl(210 65% 50%)",   texture: "none" } },
  { key: "lavender",   label: "Lavender",   theme: { background: "hsl(255 35% 96%)",   accent: "hsl(260 55% 60%)",   texture: "none" } },
  // ── Dark ───────────────────────────────────────────────────────────
  { key: "walnut",     label: "Walnut",     theme: { background: "hsl(25 25% 22%)",    accent: "hsl(35 55% 60%)",    texture: "wood" },   dark: true },
  { key: "midnight",   label: "Midnight",   theme: { background: "hsl(225 35% 14%)",   accent: "hsl(215 80% 65%)",   texture: "none" },   dark: true },
  { key: "forest",     label: "Forest",     theme: { background: "hsl(150 30% 14%)",   accent: "hsl(140 55% 55%)",   texture: "none" },   dark: true },
  { key: "velvet",     label: "Velvet",     theme: { background: "hsl(280 30% 18%)",   accent: "hsl(320 70% 70%)",   texture: "velvet" }, dark: true },
  { key: "espresso",   label: "Espresso",   theme: { background: "hsl(15 20% 12%)",    accent: "hsl(30 70% 60%)",    texture: "none" },   dark: true },
];

export function ShelfCustomizer() {
  const shelfTheme = useLibrary((s) => s.shelfTheme);
  const setShelfTheme = useLibrary((s) => s.setShelfTheme);
  const colorRef = useRef<HTMLInputElement>(null);

  const isCustomAccent =
    shelfTheme.accent.startsWith("#") && !PRESETS.some((p) => p.theme.accent === shelfTheme.accent);

  return (
    <div className="space-y-4">
      {/* Preset tiles */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
        {PRESETS.map((p) => {
          const active =
            p.key === "default"
              ? shelfTheme.background === "default"
              : shelfTheme.background === p.theme.background;

          return (
            <button
              key={p.key}
              onClick={() => {
                setShelfTheme(p.theme);
                toast.success(`Shelf: ${p.label}`);
              }}
              className={cn(
                "rounded-xl border p-2.5 text-left transition",
                active
                  ? "border-foreground ring-1 ring-foreground/20"
                  : "border-border hover:border-foreground/30"
              )}
              style={{
                background: p.theme.background === "default" ? undefined : p.theme.background,
              }}
            >
              <div
                className="h-8 rounded-md mb-2 transition"
                style={{
                  background:
                    p.theme.background === "default"
                      ? "linear-gradient(135deg, var(--mood-soft), var(--mood-strong))"
                      : `linear-gradient(135deg, ${p.theme.background}, ${active && isCustomAccent ? shelfTheme.accent : p.theme.accent})`,
                }}
              />
              <div className="flex items-center gap-1.5">
                {p.theme.background !== "default" && (
                  <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ background: active && isCustomAccent ? shelfTheme.accent : p.theme.accent }}
                  />
                )}
                <span
                  className="text-[11px] font-medium truncate"
                  style={{ color: p.dark ? "hsl(0 0% 80%)" : undefined }}
                >
                  {p.label}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Custom accent colour */}
      <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-background/40 p-3">
        <div
          className="h-8 w-8 rounded-lg border border-border/60 shrink-0 cursor-pointer transition hover:scale-105"
          style={{ background: shelfTheme.accent.startsWith("#") ? shelfTheme.accent : "var(--mood-strong)" }}
          onClick={() => colorRef.current?.click()}
          title="Pick a custom accent colour"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 text-xs font-medium">
            <Pipette className="h-3 w-3 text-muted-foreground" />
            Custom accent colour
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Overrides the accent on your current shelf style.
          </p>
        </div>
        <input
          ref={colorRef}
          type="color"
          className="sr-only"
          value={shelfTheme.accent.startsWith("#") ? shelfTheme.accent : "#a78bfa"}
          onChange={(e) => {
            setShelfTheme({ ...shelfTheme, accent: e.target.value });
          }}
          onBlur={(e) => {
            if (e.target.value) toast.success("Accent colour updated");
          }}
          aria-label="Custom accent colour picker"
        />
        <button
          onClick={() => colorRef.current?.click()}
          className="rounded-full border border-border/60 bg-background/60 px-2.5 py-1.5 text-xs hover:bg-foreground/5 transition shrink-0"
        >
          Pick
        </button>
        {shelfTheme.accent.startsWith("#") && (
          <button
            onClick={() => {
              const preset = PRESETS.find(
                (p) =>
                  p.key === "default"
                    ? shelfTheme.background === "default"
                    : shelfTheme.background === p.theme.background
              );
              if (preset) {
                setShelfTheme({ ...shelfTheme, accent: preset.theme.accent });
                toast.success("Accent reset to preset");
              }
            }}
            className="text-[11px] text-muted-foreground hover:text-foreground transition shrink-0"
          >
            Reset
          </button>
        )}
      </div>

      <p className="text-[11px] text-muted-foreground">
        Applies to your library shelves and book card backgrounds.
      </p>
    </div>
  );
}
