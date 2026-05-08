import { useRef, useState } from "react";
import { type Book, useLibrary } from "@/lib/store";
import { MOODS, type MoodKey } from "@/lib/moods";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Share2, Download, Loader2, Check } from "lucide-react";
import { toast } from "sonner";

// ─── helpers ────────────────────────────────────────────────────────────────

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxW: number,
  lineH: number
): number {
  const words = text.split(" ");
  let line = "";
  let curY = y;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, curY);
      line = word;
      curY += lineH;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, curY);
  return curY + lineH;
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

async function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

// ─── card renderer ──────────────────────────────────────────────────────────

const CW = 1080;
const CH = 1620;

async function renderCard(
  book: Book,
  mood: MoodKey,
  quote: string,
  sessionMoods: MoodKey[],
  reflection?: { rating: number }
): Promise<HTMLCanvasElement> {
  const m = MOODS[mood];
  const canvas = document.createElement("canvas");
  canvas.width = CW;
  canvas.height = CH;
  const ctx = canvas.getContext("2d")!;

  // ── background gradient ──
  const bg = ctx.createLinearGradient(0, 0, CW, CH);
  bg.addColorStop(0, `hsl(${m.h} ${m.s}% ${Math.min(m.l + 22, 90)}%)`);
  bg.addColorStop(0.55, `hsl(${m.h} ${m.s}% ${m.l + 6}%)`);
  bg.addColorStop(1, `hsl(${m.h} ${m.s}% ${Math.max(m.l - 18, 15)}%)`);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, CW, CH);

  // subtle noise overlay (diagonal lines)
  ctx.save();
  ctx.globalAlpha = 0.04;
  for (let i = -CH; i < CW + CH; i += 8) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + CH, CH);
    ctx.strokeStyle = "white";
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  ctx.restore();

  // ── book cover ──
  const coverW = 520, coverH = 760;
  const coverX = (CW - coverW) / 2, coverY = 90;

  if (book.cover) {
    const img = await loadImage(book.cover);
    if (img) {
      // shadow
      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,0.45)";
      ctx.shadowBlur = 60;
      ctx.shadowOffsetY = 30;
      roundedRect(ctx, coverX, coverY, coverW, coverH, 28);
      ctx.fillStyle = "rgba(0,0,0,0.01)";
      ctx.fill();
      ctx.restore();
      // image
      ctx.save();
      roundedRect(ctx, coverX, coverY, coverW, coverH, 28);
      ctx.clip();
      ctx.drawImage(img, coverX, coverY, coverW, coverH);
      ctx.restore();
    } else {
      // placeholder
      ctx.save();
      roundedRect(ctx, coverX, coverY, coverW, coverH, 28);
      ctx.fillStyle = `hsl(${m.h} ${m.s}% ${Math.max(m.l - 10, 20)}% / 0.6)`;
      ctx.fill();
      ctx.restore();
    }
  }

  // ── title ──
  ctx.shadowColor = "rgba(0,0,0,0.25)";
  ctx.shadowBlur = 12;
  ctx.textAlign = "center";
  ctx.fillStyle = "white";

  ctx.font = `bold 72px Georgia, "Times New Roman", serif`;
  const titleBottom = wrapText(ctx, book.title, CW / 2, coverY + coverH + 80, 920, 88);

  // ── author ──
  ctx.font = `42px Georgia, "Times New Roman", serif`;
  ctx.globalAlpha = 0.82;
  ctx.shadowBlur = 6;
  ctx.fillText(`by ${book.author}`, CW / 2, titleBottom + 8);
  ctx.globalAlpha = 1;

  // ── mood badge ──
  let badgeY = titleBottom + 80;
  ctx.font = `56px serif`;
  ctx.shadowBlur = 0;
  ctx.fillText(`${m.emoji}  ${m.label}`, CW / 2, badgeY);

  // ── rating stars ──
  if (reflection?.rating) {
    badgeY += 70;
    const starStr = "★".repeat(reflection.rating) + "☆".repeat(5 - reflection.rating);
    ctx.font = `48px serif`;
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = `hsl(${m.h} ${m.s}% ${Math.min(m.l + 30, 95)}%)`;
    ctx.fillText(starStr, CW / 2, badgeY);
    ctx.fillStyle = "white";
    ctx.globalAlpha = 1;
  }

  // ── sparkline ──
  if (sessionMoods.length >= 2) {
    const MOOD_ORDER: MoodKey[] = [
      "joyful", "cozy", "calm", "dreamy", "mysterious", "intense", "melancholy",
    ];
    const sw = 700, sh = 50;
    const sx = (CW - sw) / 2, sy = badgeY + 80;
    const pts = sessionMoods.map((sm, i): [number, number] => {
      const idx = MOOD_ORDER.indexOf(sm);
      const t = idx / (MOOD_ORDER.length - 1);
      return [
        sx + (i / (sessionMoods.length - 1)) * sw,
        sy + t * sh,
      ];
    });

    ctx.save();
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 0.7;

    // area fill
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.lineTo(pts[pts.length - 1][0], sy + sh);
    ctx.lineTo(pts[0][0], sy + sh);
    ctx.closePath();
    ctx.fillStyle = `hsl(${m.h} ${m.s}% ${Math.max(m.l - 5, 10)}% / 0.3)`;
    ctx.fill();

    // line
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.strokeStyle = "rgba(255,255,255,0.85)";
    ctx.lineWidth = 4;
    ctx.lineJoin = "round";
    ctx.stroke();
    ctx.restore();

    badgeY = sy + sh + 50;
  } else {
    badgeY += 60;
  }

  // ── quote ──
  if (quote) {
    ctx.font = `italic 38px Georgia, "Times New Roman", serif`;
    ctx.globalAlpha = 0.88;
    ctx.shadowBlur = 4;
    badgeY = wrapText(ctx, `\u201c${quote}\u201d`, CW / 2, badgeY + 30, 860, 52);
    ctx.globalAlpha = 1;
  }

  // ── pages ──
  ctx.font = `34px sans-serif`;
  ctx.globalAlpha = 0.65;
  ctx.shadowBlur = 0;
  ctx.fillText(`${book.pages} pages`, CW / 2, Math.max(badgeY + 20, CH - 130));

  // ── brand ──
  ctx.font = `bold 26px sans-serif`;
  ctx.globalAlpha = 0.5;
  ctx.letterSpacing = "4px";
  ctx.fillText("READ ON FELTLY", CW / 2, CH - 60);

  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;

  return canvas;
}

// ─── component ──────────────────────────────────────────────────────────────

export function ShareCardModal({ book }: { book: Book }) {
  const { sessions, journal, reflections } = useLibrary();
  const [open, setOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const topQuote = journal
    .filter((j) => j.bookId === book.id && j.kind === "quote" && j.text.length > 10)
    .sort((a, b) => b.createdAt - a.createdAt)[0]?.text ?? "";

  const bookSessions = sessions
    .filter((s) => s.bookId === book.id)
    .sort((a, b) => a.at - b.at);

  const sessionMoods: MoodKey[] = bookSessions.map((s) => s.mood);
  const reflection = reflections.find((r) => r.bookId === book.id);
  const m = MOODS[book.mood];

  const download = async () => {
    setDownloading(true);
    try {
      const canvas = await renderCard(book, book.mood, topQuote, sessionMoods, reflection);
      const link = document.createElement("a");
      link.download = `${book.title.replace(/[^a-z0-9]/gi, "-").toLowerCase()}-feltly.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast.success("Card downloaded!");
    } catch (e) {
      toast.error("Couldn\u2019t generate the card.");
      console.error(e);
    } finally {
      setDownloading(false);
    }
  };

  const share = async () => {
    try {
      const canvas = await renderCard(book, book.mood, topQuote, sessionMoods, reflection);
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        if (navigator.share && navigator.canShare?.({ files: [] })) {
          const file = new File([blob], `${book.title}-feltly.png`, { type: "image/png" });
          await navigator.share({ files: [file], title: book.title, text: `I just finished "${book.title}" on Tropely` });
        } else {
          await navigator.clipboard.writeText(`I just finished \u201c${book.title}\u201d by ${book.author} ${m.emoji} \u2014 read on Tropely`);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
          toast.success("Text copied to clipboard!");
        }
      });
    } catch {}
  };

  return (
    <>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
        className="absolute bottom-2 right-2 rounded-full bg-background/90 border border-border/60 p-1.5 opacity-0 group-hover:opacity-100 transition hover:bg-background shadow-sm"
        aria-label="Share this book"
        title="Share mood card"
      >
        <Share2 className="h-3.5 w-3.5 text-muted-foreground" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Share your mood card</DialogTitle>
          </DialogHeader>

          {/* Card preview */}
          <div
            ref={previewRef}
            className="rounded-2xl overflow-hidden shadow-lg relative"
            style={{
              background: `linear-gradient(135deg, hsl(${m.h} ${m.s}% ${Math.min(m.l + 22, 90)}%), hsl(${m.h} ${m.s}% ${Math.max(m.l - 10, 20)}%))`,
              aspectRatio: "2/3",
            }}
          >
            <div className="absolute inset-0 flex flex-col items-center justify-start p-5 gap-3">
              {/* Cover */}
              {book.cover ? (
                <img
                  src={book.cover}
                  alt={book.title}
                  className="w-36 rounded-xl shadow-book object-cover"
                  style={{ aspectRatio: "2/3" }}
                />
              ) : (
                <div
                  className="w-36 rounded-xl flex items-center justify-center font-display text-white/80 text-sm text-center p-3"
                  style={{ aspectRatio: "2/3", background: `hsl(${m.h} ${m.s}% ${Math.max(m.l - 15, 15)}% / 0.5)` }}
                >
                  {book.title.slice(0, 24)}
                </div>
              )}

              {/* Title */}
              <div className="text-center text-white space-y-0.5">
                <div className="font-display text-lg leading-tight line-clamp-2 drop-shadow">{book.title}</div>
                <div className="text-xs opacity-75">by {book.author}</div>
              </div>

              {/* Mood badge */}
              <div className="flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur px-3 py-1.5">
                <span>{m.emoji}</span>
                <span className="text-xs font-medium text-white">{m.label}</span>
              </div>

              {/* Rating */}
              {reflection?.rating && (
                <div className="text-yellow-200 text-sm tracking-wider">
                  {"★".repeat(reflection.rating)}{"☆".repeat(5 - reflection.rating)}
                </div>
              )}

              {/* Mini sparkline */}
              {sessionMoods.length >= 2 && (
                <div className="w-full px-4">
                  <MiniSparkline moods={sessionMoods} baseHue={m.h} />
                </div>
              )}

              {/* Quote */}
              {topQuote && (
                <div className="text-center text-white/85 text-[11px] italic leading-snug line-clamp-3 px-2 drop-shadow">
                  &ldquo;{topQuote}&rdquo;
                </div>
              )}

              {/* Brand */}
              <div className="mt-auto text-[9px] uppercase tracking-[0.2em] text-white/50">
                Read on Tropely
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              onClick={download}
              disabled={downloading}
              className="flex-1 rounded-full gap-1.5"
              style={{ background: "var(--mood-strong)" }}
            >
              {downloading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Download PNG
            </Button>
            <Button
              onClick={share}
              variant="outline"
              className="rounded-full gap-1.5"
            >
              {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
              {copied ? "Copied!" : "Share"}
            </Button>
          </div>
          <p className="text-[11px] text-center text-muted-foreground">
            High-res 1080&times;1620px card — perfect for Instagram stories.
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}

function MiniSparkline({ moods, baseHue }: { moods: MoodKey[]; baseHue: number }) {
  const ORDER: MoodKey[] = [
    "joyful", "cozy", "calm", "dreamy", "mysterious", "intense", "melancholy",
  ];
  const W = 100, H = 22;
  const pts = moods.map((sm, i): [number, number] => {
    const idx = ORDER.indexOf(sm);
    const t = idx / (ORDER.length - 1);
    return [
      (i / (moods.length - 1)) * W,
      t * H,
    ];
  });
  const pathD = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
  const areaD = `${pathD} L ${pts[pts.length - 1][0]} ${H} L 0 ${H} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }}>
      <path d={areaD} fill={`hsl(${baseHue} 40% 90% / 0.25)`} />
      <path d={pathD} fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}
