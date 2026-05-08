import { useLibrary, type ShelfTheme } from "@/lib/store";
import { Palette } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const PRESETS: { key: string; label: string; theme: ShelfTheme }[] = [
  { key: "default", label: "Default", theme: { background: "default", accent: "var(--mood-strong)", texture: "none" } },
  { key: "linen",   label: "Linen",   theme: { background: "hsl(38 30% 95%)", accent: "hsl(15 60% 55%)", texture: "linen" } },
  { key: "paper",   label: "Paper",   theme: { background: "hsl(45 40% 96%)", accent: "hsl(28 50% 45%)", texture: "paper" } },
  { key: "wood",    label: "Walnut",  theme: { background: "hsl(25 25% 22%)", accent: "hsl(35 55% 60%)", texture: "wood" } },
  { key: "velvet",  label: "Velvet",  theme: { background: "hsl(280 30% 18%)", accent: "hsl(320 70% 70%)", texture: "velvet" } },
];

export function ShelfCustomizer() {
  const shelfTheme = useLibrary((s) => s.shelfTheme);
  const setShelfTheme = useLibrary((s) => s.setShelfTheme);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Palette className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Shelf style</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {PRESETS.map((p) => {
          const active = shelfTheme.texture === p.theme.texture;
          return (
            <button
              key={p.key}
              onClick={() => {
                setShelfTheme(p.theme);
                toast.success(`Shelf style: ${p.label}`);
              }}
              className={cn(
                "rounded-xl border p-3 text-left transition",
                active ? "border-foreground ring-1 ring-foreground/20" : "border-border hover:bg-foreground/5"
              )}
              style={{
                background: p.theme.background === "default" ? undefined : p.theme.background,
              }}
            >
              <div
                className="h-10 rounded-md mb-2"
                style={{
                  background: p.theme.background === "default"
                    ? "var(--mood-soft)"
                    : `linear-gradient(135deg, ${p.theme.background}, ${p.theme.accent})`,
                }}
              />
              <div className="text-xs font-medium" style={{
                color: p.theme.background.startsWith("hsl(2") || p.theme.background.startsWith("hsl(28")
                  ? "white"
                  : undefined,
              }}>
                {p.label}
              </div>
            </button>
          );
        })}
      </div>
      <p className="text-[11px] text-muted-foreground">
        Theme applies to your library shelves. More skins coming soon.
      </p>
    </div>
  );
}