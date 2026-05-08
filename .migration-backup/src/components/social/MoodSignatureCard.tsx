import { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { useLibrary } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { MOODS, type MoodKey } from "@/lib/moods";
import { Download, Share2, Sparkles, Copy } from "lucide-react";
import { toast } from "sonner";

type MoodSlice = { mood: MoodKey; pct: number; v: number };

function useMoodSignature() {
  const { books, reactionLog, reflections, moodPreferences } = useLibrary();
  const { user } = useAuth();

  return useMemo(() => {
    const counts: Record<string, number> = {};
    books.forEach((b) => (counts[b.mood] = (counts[b.mood] || 0) + 1));
    const total = Math.max(1, Object.values(counts).reduce((a, b) => a + b, 0));
    const slices: MoodSlice[] = Object.entries(counts)
      .map(([k, v]) => ({ mood: k as MoodKey, v, pct: v / total }))
      .sort((a, b) => b.v - a.v)
      .slice(0, 5);

    const top = slices[0]?.mood;
    const finished = books.filter((b) => b.shelf === "finished").length;
    const pages = books.reduce((a, b) => a + b.progress, 0);

    const handle =
      user?.user_metadata?.display_name ||
      user?.email?.split("@")[0] ||
      "reader";

    return {
      slices,
      top,
      finished,
      pages,
      reactions: reactionLog.length,
      reflections: reflections.length,
      handle,
      tagline: moodPreferences?.favorites?.length
        ? moodPreferences.favorites.map((m) => MOODS[m].label.toLowerCase()).join(" · ")
        : top
        ? `mostly ${MOODS[top].label.toLowerCase()}`
        : "just getting started",
    };
  }, [books, reactionLog, reflections, moodPreferences, user]);
}

function CardSvg({ data }: { data: ReturnType<typeof useMoodSignature> }) {
  const W = 540;
  const H = 720;

  // Build conic-style stacked bar
  let acc = 0;
  const barY = 460;
  const barH = 14;
  const barX = 48;
  const barW = W - 96;

  const topMoodColor = data.top
    ? `hsl(${MOODS[data.top].h} ${MOODS[data.top].s}% ${MOODS[data.top].l}%)`
    : "hsl(220 15% 60%)";

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${W} ${H}`}
      width={W}
      height={H}
      style={{ display: "block", maxWidth: "100%", height: "auto", borderRadius: 24 }}
    >
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="hsl(36 30% 96%)" />
          <stop offset="100%" stopColor={topMoodColor} stopOpacity="0.35" />
        </linearGradient>
        <linearGradient id="glow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={topMoodColor} stopOpacity="0.55" />
          <stop offset="100%" stopColor={topMoodColor} stopOpacity="0" />
        </linearGradient>
      </defs>

      <rect x="0" y="0" width={W} height={H} fill="url(#bg)" />
      <circle cx={W - 60} cy={80} r={140} fill="url(#glow)" />

      {/* Brand */}
      <text x={48} y={70} fontFamily="serif" fontStyle="italic" fontSize="22" fill="#1a1a1a">
        Feltly
      </text>
      <text x={48} y={92} fontFamily="sans-serif" fontSize="10" letterSpacing="3" fill="#6b6b6b">
        READ BY EMOTION
      </text>

      {/* Title */}
      <text x={48} y={180} fontFamily="serif" fontSize="44" fill="#111">
        My mood
      </text>
      <text x={48} y={228} fontFamily="serif" fontStyle="italic" fontSize="44" fill={topMoodColor}>
        signature.
      </text>

      {/* Top mood big */}
      {data.top && (
        <g transform={`translate(48, 280)`}>
          <text fontFamily="sans-serif" fontSize="11" letterSpacing="2.5" fill="#6b6b6b">
            DOMINANT MOOD
          </text>
          <text x={0} y={48} fontFamily="serif" fontSize="56" fill="#111">
            {MOODS[data.top].emoji} {MOODS[data.top].label}
          </text>
        </g>
      )}

      {/* Tagline */}
      <text x={48} y={420} fontFamily="serif" fontStyle="italic" fontSize="18" fill="#3a3a3a">
        {data.tagline}
      </text>

      {/* Stacked mood bar */}
      <rect x={barX} y={barY} width={barW} height={barH} rx={barH / 2} fill="#e6e2dc" />
      {data.slices.map((s, i) => {
        const w = s.pct * barW;
        const x = barX + acc;
        acc += w;
        const m = MOODS[s.mood];
        return (
          <rect
            key={s.mood}
            x={x}
            y={barY}
            width={w}
            height={barH}
            fill={`hsl(${m.h} ${m.s}% ${m.l}%)`}
            rx={i === 0 ? barH / 2 : 0}
          />
        );
      })}

      {/* Mood legend */}
      <g transform={`translate(${barX}, ${barY + 38})`}>
        {data.slices.slice(0, 4).map((s, i) => {
          const m = MOODS[s.mood];
          const col = i % 2;
          const row = Math.floor(i / 2);
          return (
            <g key={s.mood} transform={`translate(${col * 220}, ${row * 28})`}>
              <circle cx={6} cy={6} r={6} fill={`hsl(${m.h} ${m.s}% ${m.l}%)`} />
              <text x={20} y={11} fontFamily="sans-serif" fontSize="13" fill="#222">
                {m.label} · {Math.round(s.pct * 100)}%
              </text>
            </g>
          );
        })}
      </g>

      {/* Stats row */}
      <g transform={`translate(48, 620)`}>
        {[
          { label: "BOOKS", value: String(data.finished) },
          { label: "PAGES", value: String(data.pages) },
          { label: "REACTIONS", value: String(data.reactions) },
          { label: "REFLECTIONS", value: String(data.reflections) },
        ].map((s, i) => (
          <g key={s.label} transform={`translate(${i * 112}, 0)`}>
            <text fontFamily="sans-serif" fontSize="9" letterSpacing="2" fill="#6b6b6b">
              {s.label}
            </text>
            <text y={28} fontFamily="serif" fontSize="26" fill="#111">
              {s.value}
            </text>
          </g>
        ))}
      </g>

      {/* Footer */}
      <text x={48} y={H - 28} fontFamily="sans-serif" fontSize="11" fill="#6b6b6b">
        @{data.handle} · felt.app
      </text>
    </svg>
  );
}

async function svgToPngBlob(svgEl: SVGSVGElement, scale = 2): Promise<Blob> {
  const xml = new XMLSerializer().serializeToString(svgEl);
  const svg64 = btoa(unescape(encodeURIComponent(xml)));
  const url = `data:image/svg+xml;base64,${svg64}`;
  const img = new Image();
  img.crossOrigin = "anonymous";
  await new Promise<void>((res, rej) => {
    img.onload = () => res();
    img.onerror = () => rej(new Error("Image failed to load"));
    img.src = url;
  });
  const W = svgEl.viewBox.baseVal.width || svgEl.clientWidth;
  const H = svgEl.viewBox.baseVal.height || svgEl.clientHeight;
  const canvas = document.createElement("canvas");
  canvas.width = W * scale;
  canvas.height = H * scale;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(scale, scale);
  ctx.drawImage(img, 0, 0, W, H);
  return await new Promise<Blob>((res, rej) =>
    canvas.toBlob((b) => (b ? res(b) : rej(new Error("Canvas blob failed"))), "image/png", 0.95)
  );
}

export function MoodSignatureCard() {
  const data = useMoodSignature();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const getSvg = (): SVGSVGElement | null => wrapRef.current?.querySelector("svg") ?? null;

  const download = async () => {
    const svg = getSvg();
    if (!svg) return;
    setBusy(true);
    try {
      const blob = await svgToPngBlob(svg, 2);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `felt-mood-signature.png`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Saved your mood card.");
    } catch (e: any) {
      toast.error(e.message ?? "Couldn't render image.");
    } finally {
      setBusy(false);
    }
  };

  const share = async () => {
    const svg = getSvg();
    if (!svg) return;
    setBusy(true);
    try {
      const blob = await svgToPngBlob(svg, 2);
      const file = new File([blob], "felt-mood-signature.png", { type: "image/png" });
      const nav: any = navigator;
      if (nav.canShare?.({ files: [file] })) {
        await nav.share({
          files: [file],
          title: "My mood signature",
          text: `My reading mood on Feltly: ${data.tagline}`,
        });
      } else {
        await download();
      }
    } catch (e: any) {
      if (e?.name !== "AbortError") toast.error(e.message ?? "Couldn't share.");
    } finally {
      setBusy(false);
    }
  };

  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(
        `My reading mood on Feltly: ${data.tagline}. ${data.finished} books, ${data.pages} pages.`
      );
      toast.success("Copied caption.");
    } catch {
      toast.error("Clipboard unavailable.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="rounded-full">
          <Sparkles className="h-4 w-4 mr-1.5" /> My mood card
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl p-0 overflow-hidden bg-background">
        <div className="p-4 sm:p-6 space-y-4">
          <div ref={wrapRef} className="rounded-2xl overflow-hidden shadow-lg">
            <CardSvg data={data} />
          </div>
          <div className="flex flex-wrap gap-2 justify-end">
            <Button variant="ghost" onClick={copyText} disabled={busy} className="rounded-full">
              <Copy className="h-4 w-4 mr-1.5" /> Copy caption
            </Button>
            <Button variant="outline" onClick={download} disabled={busy} className="rounded-full">
              <Download className="h-4 w-4 mr-1.5" /> Download
            </Button>
            <Button onClick={share} disabled={busy} className="rounded-full">
              <Share2 className="h-4 w-4 mr-1.5" /> Share
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}