// Canvas-based share image generator. Returns a downloadable PNG blob.

export type QuoteCardOpts = {
  quote: string;
  bookTitle?: string;
  bookAuthor?: string;
  page?: number;
  brand?: string; // default "Feltly"
};

export type WrapCardOpts = {
  year: number | string;
  bookCount: number;
  pageCount: number;
  topMoodEmoji?: string;
  topMoodLabel?: string;
  signature?: string; // user-provided, e.g. "Cozy & curious"
  brand?: string;
};

const BRAND = "Feltly";

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.replace(/\s+/g, " ").trim().split(" ");
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line ? line + " " + w : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function paintBackground(ctx: CanvasRenderingContext2D, w: number, h: number) {
  // Warm dark gradient consistent with the Feltly identity
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, "#1f1722");
  g.addColorStop(0.55, "#2a1f2c");
  g.addColorStop(1, "#3a2436");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  // Soft radial glow
  const r = ctx.createRadialGradient(w * 0.78, h * 0.2, 40, w * 0.78, h * 0.2, w * 0.7);
  r.addColorStop(0, "rgba(255, 196, 150, 0.22)");
  r.addColorStop(1, "rgba(255, 196, 150, 0)");
  ctx.fillStyle = r;
  ctx.fillRect(0, 0, w, h);

  // Grain dots
  ctx.fillStyle = "rgba(255,255,255,0.018)";
  for (let i = 0; i < 600; i++) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    ctx.fillRect(x, y, 1, 1);
  }
}

function paintBrand(ctx: CanvasRenderingContext2D, w: number, h: number, brand: string) {
  ctx.fillStyle = "rgba(255,238,220,0.6)";
  ctx.font = "500 22px ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(brand, 64, h - 64);

  ctx.fillStyle = "rgba(255,238,220,0.3)";
  ctx.font = "400 16px ui-sans-serif, system-ui, sans-serif";
  const tag = "Read by emotion";
  const tagW = ctx.measureText(tag).width;
  ctx.fillText(tag, w - 64 - tagW, h - 64);
}

export async function renderQuoteCard(opts: QuoteCardOpts): Promise<Blob> {
  const W = 1080;
  const H = 1350; // 4:5 — Instagram portrait
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  paintBackground(ctx, W, H);

  // Big opening quote glyph
  ctx.fillStyle = "rgba(255,210,170,0.18)";
  ctx.font = "700 360px Georgia, 'Times New Roman', serif";
  ctx.textBaseline = "top";
  ctx.fillText("\u201C", 56, 80);

  // Quote body
  ctx.fillStyle = "#fbe9d6";
  const quote = (opts.quote || "").trim();
  // Pick a font size that fits comfortably
  const maxWidth = W - 128;
  let size = 64;
  let lines: string[] = [];
  while (size >= 32) {
    ctx.font = `500 ${size}px Georgia, 'Times New Roman', serif`;
    lines = wrapText(ctx, quote, maxWidth);
    const totalH = lines.length * size * 1.25;
    if (totalH < H - 520) break;
    size -= 4;
  }
  ctx.font = `500 ${size}px Georgia, 'Times New Roman', serif`;
  const lineH = size * 1.25;
  const totalH = lines.length * lineH;
  let y = (H - totalH) / 2 - 40;
  for (const ln of lines) {
    ctx.fillText(ln, 64, y);
    y += lineH;
  }

  // Attribution: title + author + page
  const meta: string[] = [];
  if (opts.bookTitle) meta.push(opts.bookTitle);
  if (opts.bookAuthor) meta.push(opts.bookAuthor);
  ctx.fillStyle = "rgba(255,238,220,0.85)";
  ctx.font = "600 28px ui-sans-serif, system-ui, sans-serif";
  if (meta.length) {
    const text = "— " + meta.join(", ");
    ctx.fillText(text, 64, y + 24);
  }
  if (opts.page) {
    ctx.fillStyle = "rgba(255,238,220,0.55)";
    ctx.font = "400 22px ui-sans-serif, system-ui, sans-serif";
    ctx.fillText(`p. ${opts.page}`, 64, y + 64);
  }

  paintBrand(ctx, W, H, opts.brand || BRAND);
  return await new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), "image/png", 0.95));
}

export async function renderWrapCard(opts: WrapCardOpts): Promise<Blob> {
  const W = 1080;
  const H = 1350;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  paintBackground(ctx, W, H);

  // Year label
  ctx.fillStyle = "rgba(255,238,220,0.55)";
  ctx.font = "500 28px ui-sans-serif, system-ui, sans-serif";
  ctx.textBaseline = "top";
  ctx.fillText(`Reading Wrap · ${opts.year}`, 64, 80);

  // Big stat: book count
  ctx.fillStyle = "#fbe9d6";
  ctx.font = "700 280px Georgia, 'Times New Roman', serif";
  ctx.fillText(String(opts.bookCount), 64, 140);

  ctx.fillStyle = "rgba(255,238,220,0.7)";
  ctx.font = "500 36px ui-sans-serif, system-ui, sans-serif";
  ctx.fillText(opts.bookCount === 1 ? "book finished" : "books finished", 64, 460);

  // Pages
  ctx.fillStyle = "rgba(255,238,220,0.85)";
  ctx.font = "600 44px ui-sans-serif, system-ui, sans-serif";
  ctx.fillText(`${opts.pageCount.toLocaleString()} pages turned`, 64, 560);

  // Top mood
  if (opts.topMoodEmoji || opts.topMoodLabel) {
    ctx.fillStyle = "rgba(255,238,220,0.55)";
    ctx.font = "500 26px ui-sans-serif, system-ui, sans-serif";
    ctx.fillText("Most-felt mood", 64, 680);

    ctx.fillStyle = "#fbe9d6";
    ctx.font = "600 96px Georgia, 'Times New Roman', serif";
    const emoji = opts.topMoodEmoji || "✨";
    const label = opts.topMoodLabel || "";
    ctx.fillText(`${emoji} ${label}`, 64, 720);
  }

  // Signature
  if (opts.signature) {
    ctx.fillStyle = "rgba(255,238,220,0.85)";
    ctx.font = "italic 500 38px Georgia, 'Times New Roman', serif";
    const lines = wrapText(ctx, `“${opts.signature}”`, W - 128);
    let y = 920;
    for (const ln of lines) {
      ctx.fillText(ln, 64, y);
      y += 50;
    }
  }

  paintBrand(ctx, W, H, opts.brand || BRAND);
  return await new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), "image/png", 0.95));
}

export async function shareOrDownload(blob: Blob, fileName: string, title = "Feltly") {
  const file = new File([blob], fileName, { type: "image/png" });
  // Try Web Share with files first (mobile)
  // @ts-ignore
  if (navigator.canShare && navigator.canShare({ files: [file] }) && navigator.share) {
    try {
      // @ts-ignore
      await navigator.share({ files: [file], title });
      return "shared" as const;
    } catch {
      /* user cancelled — fall through to download */
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return "downloaded" as const;
}