import { useState } from "react";

// ─── Physical spine definitions ───────────────────────────────────────────────
// Each entry models the real published edition as closely as possible.
// bg/bgEnd drive the spine gradient; accentBar is the right-edge stripe.

interface SpineDef {
  bg: string;
  bgEnd?: string;
  midGlow?: string;        // optional mid-spine colour stop
  textColor: string;
  accentBar?: string;
  accentBarPos?: "left" | "right" | "both";
  topBand?: string;        // thin colour band across the top
  bottomBand?: string;
  publisher?: string;
  publisherColor?: string;
  texture?: "linen" | "matte" | "glossy" | "foil" | "embossed";
  titleFont?: "serif" | "sans" | "condensed";
  pages: number;
}

interface Book {
  id: string;
  title: string;
  author: string;
  genre: GenreKey;
  pillar?: PillKey;        // which pill it belongs to (set when user "adds" it)
  spine: SpineDef;
}

// ─── Book catalogue ───────────────────────────────────────────────────────────

const CATALOGUE: Book[] = [
  // ── Fourth Wing (Entangled, 2023) ─────────────────────────────────────────
  // Deep crimson; matte; gold foil title; thin gold accent right
  {
    id: "fw", title: "Fourth Wing", author: "Rebecca Yarros", genre: "romantasy", pillar: "reading",
    spine: { bg: "#4a0e0e", bgEnd: "#6b1515", midGlow: "#7d1a1a", textColor: "#e8c46a",
             accentBar: "#c8941e", topBand: "#3a0a0a", bottomBand: "#3a0a0a",
             publisher: "E", publisherColor: "#e8c46a88",
             texture: "matte", titleFont: "serif", pages: 517 },
  },
  // ── Iron Flame (Entangled, 2023) ──────────────────────────────────────────
  // Near-black navy; silver-lavender title; violet accent bar
  {
    id: "if", title: "Iron Flame", author: "Rebecca Yarros", genre: "romantasy", pillar: "5star",
    spine: { bg: "#0e0e1c", bgEnd: "#1a1a2e", midGlow: "#1e1e36", textColor: "#c8b8e8",
             accentBar: "#6040a0", topBand: "#080810", bottomBand: "#080810",
             publisher: "E", publisherColor: "#c8b8e888",
             texture: "matte", titleFont: "serif", pages: 623 },
  },
  // ── Onyx Storm (Entangled, 2025) ──────────────────────────────────────────
  // Deepest navy; icy blue text; blue-grey accent
  {
    id: "os", title: "Onyx Storm", author: "Rebecca Yarros", genre: "romantasy", pillar: "5star",
    spine: { bg: "#08101c", bgEnd: "#101e30", textColor: "#a8c8e0",
             accentBar: "#1e4870", topBand: "#060c14", bottomBand: "#060c14",
             publisher: "E", publisherColor: "#a8c8e088",
             texture: "matte", titleFont: "serif", pages: 704 },
  },
  // ── ACOTAR (Bloomsbury, 2015) ─────────────────────────────────────────────
  // Midnight blue-slate; pale gold title; thin teal accent
  {
    id: "acotar", title: "A Court of Thorns and Roses", author: "Sarah J. Maas", genre: "romantasy", pillar: "5star",
    spine: { bg: "#10202e", bgEnd: "#182e3e", textColor: "#e0cca0",
             accentBar: "#2e6878", accentBarPos: "right",
             publisher: "B", publisherColor: "#e0cca099",
             texture: "matte", titleFont: "serif", pages: 419 },
  },
  // ── ACOMAF (Bloomsbury, 2016) ─────────────────────────────────────────────
  // Darker blue-black; silver text; same teal edge
  {
    id: "acomaf", title: "A Court of Mist and Fury", author: "Sarah J. Maas", genre: "romantasy", pillar: "4star",
    spine: { bg: "#0a1520", bgEnd: "#122030", textColor: "#d0c8e8",
             accentBar: "#284868",
             publisher: "B", publisherColor: "#d0c8e899",
             texture: "matte", titleFont: "serif", pages: 626 },
  },
  // ── The Cruel Prince (Little Brown, 2018) ────────────────────────────────
  // Very dark forest green; cream/gold title; lighter green spine highlight
  {
    id: "tcp", title: "The Cruel Prince", author: "Holly Black", genre: "fantasy", pillar: "4star",
    spine: { bg: "#0c1a0e", bgEnd: "#162814", midGlow: "#1a301a", textColor: "#e8ddb0",
             accentBar: "#2a4a28",
             publisher: "LB", publisherColor: "#e8ddb099",
             texture: "matte", titleFont: "serif", pages: 370 },
  },
  // ── Kingdom of the Wicked (Hodder, 2020) ─────────────────────────────────
  // Deep plum-black; rose-gold text; crimson accent
  {
    id: "kotw", title: "Kingdom of the Wicked", author: "Kerri Maniscalco", genre: "dark-romance", pillar: "3star",
    spine: { bg: "#180820", bgEnd: "#220e2e", textColor: "#f0c8c0",
             accentBar: "#782038",
             publisher: "H", publisherColor: "#f0c8c099",
             texture: "embossed", titleFont: "serif", pages: 373 },
  },
  // ── From Blood and Ash (Blue Tulip, 2020) ────────────────────────────────
  // Rich burgundy; warm cream title; gold bar on right
  {
    id: "fbaa", title: "From Blood and Ash", author: "Jennifer L. Armentrout", genre: "dark-romance", pillar: "4star",
    spine: { bg: "#320810", bgEnd: "#481018", textColor: "#f5e0c8",
             accentBar: "#a84020", accentBarPos: "both",
             publisher: "BT", publisherColor: "#f5e0c899",
             texture: "linen", titleFont: "serif", pages: 622 },
  },
  // ── House of Salt & Sorrows (Delacorte, 2019) ────────────────────────────
  // Dark seafoam-teal; white text; pale coral accent
  {
    id: "hosnr", title: "House of Salt and Sorrows", author: "Erin A. Craig", genre: "fantasy", pillar: "3star",
    spine: { bg: "#0a2824", bgEnd: "#103830", textColor: "#e0f0ee",
             accentBar: "#207060",
             publisher: "D", publisherColor: "#e0f0ee99",
             texture: "glossy", titleFont: "sans", pages: 392 },
  },
  // ── The Name of the Wind (DAW, 2007) ─────────────────────────────────────
  // Walnut brown; warm gold title; tan linen texture; thick spine
  {
    id: "notw", title: "The Name of the Wind", author: "Patrick Rothfuss", genre: "fantasy", pillar: "5star",
    spine: { bg: "#2e1808", bgEnd: "#3e2410", textColor: "#f0d898",
             accentBar: "#7a5030",
             publisher: "DAW", publisherColor: "#f0d89899",
             texture: "linen", titleFont: "serif", pages: 662 },
  },
  // ── Mistborn (Tor, 2006) ──────────────────────────────────────────────────
  // Charcoal-slate; clean white title; steel-blue accent; very thick
  {
    id: "mistborn", title: "Mistborn", author: "Brandon Sanderson", genre: "fantasy", pillar: "5star",
    spine: { bg: "#182030", bgEnd: "#20283a", textColor: "#e8ecf0",
             accentBar: "#304a68",
             publisher: "TOR", publisherColor: "#e8ecf099",
             texture: "matte", titleFont: "sans", pages: 541 },
  },
  // ── Fairytale — Stephen King (Scribner, 2022) ─────────────────────────────
  // Brick red; cream title; wide thick spine
  {
    id: "fairytale", title: "Fairytale", author: "Stephen King", genre: "horror", pillar: "tbr",
    spine: { bg: "#6e1a08", bgEnd: "#8e2410", textColor: "#f8f0e0",
             accentBar: "#c84020", topBand: "#5a1208",
             publisher: "S", publisherColor: "#f8f0e099",
             texture: "matte", titleFont: "sans", pages: 608 },
  },
  // ── Our Infinite Fates (Entangled, 2024) ─────────────────────────────────
  // Soft mauve-violet; ivory text; rose accent
  {
    id: "oif", title: "Our Infinite Fates", author: "Abigail Owen", genre: "romantasy", pillar: "tbr",
    spine: { bg: "#241438", bgEnd: "#301a4a", textColor: "#ecdde8",
             accentBar: "#804070",
             publisher: "E", publisherColor: "#ecdde899",
             texture: "glossy", titleFont: "serif", pages: 336 },
  },
  // ── Dreadbound (Orbit, 2024) ──────────────────────────────────────────────
  // Near-black with cool blue undertone; steel text
  {
    id: "dreadbound", title: "Dreadbound", author: "Zoë Hawthorn", genre: "fantasy", pillar: "tbr",
    spine: { bg: "#0e1420", bgEnd: "#141c2c", textColor: "#b8cce0",
             accentBar: "#284060",
             publisher: "Or", publisherColor: "#b8cce099",
             texture: "matte", titleFont: "sans", pages: 418 },
  },
  // ── Den of Malice (Rina Kent, 2022) ──────────────────────────────────────
  // Almost pure black; orchid text
  {
    id: "dom", title: "Den of Malice", author: "Rina Kent", genre: "dark-romance", pillar: "2star",
    spine: { bg: "#0c080e", bgEnd: "#160e1c", textColor: "#c8a0d0",
             accentBar: "#503060",
             publisher: "RK", publisherColor: "#c8a0d099",
             texture: "matte", titleFont: "sans", pages: 358 },
  },
  // ── Smoke and Ash (Silver Griffyn, 2022) ─────────────────────────────────
  // Dark charcoal-brown; warm amber text; ember accent
  {
    id: "sas", title: "Smoke and Ash", author: "Elise Kova", genre: "romantasy", pillar: "3star",
    spine: { bg: "#1a1008", bgEnd: "#241810", textColor: "#f0c890",
             accentBar: "#904020",
             publisher: "SG", publisherColor: "#f0c89099",
             texture: "embossed", titleFont: "serif", pages: 440 },
  },
];

// ─── Genre / mood shelf config ────────────────────────────────────────────────

type GenreKey = "romantasy" | "fantasy" | "dark-romance" | "horror" | "historical" | "contemporary" | "sci-fi" | "thriller";

interface GenreDef {
  name: string;
  emoji: string;
  color: string;
}

const GENRES: Record<GenreKey, GenreDef> = {
  romantasy:       { name: "Romantasy",        emoji: "🐉", color: "#7a2840" },
  fantasy:         { name: "Fantasy",           emoji: "⚔️", color: "#2a3878" },
  "dark-romance":  { name: "Dark Romance",      emoji: "🥀", color: "#5a1030" },
  horror:          { name: "Horror",            emoji: "👁️", color: "#3a1010" },
  historical:      { name: "Historical",        emoji: "📜", color: "#6a4c14" },
  contemporary:    { name: "Contemporary",      emoji: "☀️", color: "#1a5060" },
  "sci-fi":        { name: "Sci-Fi",            emoji: "🚀", color: "#104840" },
  thriller:        { name: "Thriller",          emoji: "🔪", color: "#2a2a2a" },
};

// ─── Pill config ──────────────────────────────────────────────────────────────

type PillKey = "reading" | "tbr" | "1star" | "2star" | "3star" | "4star" | "5star";

interface Pill {
  key: PillKey;
  label: string;
  emoji?: string;
  stars?: number;
}

const PILLS: Pill[] = [
  { key: "reading", label: "Reading",      emoji: "📖" },
  { key: "tbr",     label: "Want to Read", emoji: "🔖" },
  { key: "1star",   label: "★",      stars: 1 },
  { key: "2star",   label: "★★",     stars: 2 },
  { key: "3star",   label: "★★★",    stars: 3 },
  { key: "4star",   label: "★★★★",   stars: 4 },
  { key: "5star",   label: "★★★★★",  stars: 5 },
];

// ─── Add-book modal data ──────────────────────────────────────────────────────

const SEARCH_POOL = CATALOGUE.map((b) => ({ ...b }));

// ─── Spine width ──────────────────────────────────────────────────────────────

function spineW(pages: number) {
  return Math.max(17, Math.min(40, Math.round((pages / 560) * 26)));
}

// ─── Book Spine component ─────────────────────────────────────────────────────

function BookSpine({ book, height = 134 }: { book: Book; height?: number }) {
  const [hov, setHov] = useState(false);
  const w = spineW(book.spine.pages);
  const s = book.spine;

  const gradient = s.midGlow
    ? `linear-gradient(90deg, ${s.bg} 0%, ${s.midGlow} 45%, ${s.bgEnd ?? s.bg}cc 100%)`
    : s.bgEnd
      ? `linear-gradient(90deg, ${s.bg} 0%, ${s.bgEnd} 60%, ${s.bg}cc 100%)`
      : s.bg;

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      title={`${book.title} · ${book.author}`}
      style={{
        width: w, height, flexShrink: 0, cursor: "pointer", position: "relative",
        transition: "transform 0.16s ease",
        transform: hov ? "translateY(-8px)" : "translateY(0)",
      }}
    >
      <div style={{
        width: "100%", height: "100%",
        background: gradient,
        borderRadius: "2px 5px 5px 2px",
        boxShadow: hov
          ? "inset -3px 0 6px rgba(0,0,0,0.45), 5px 10px 22px rgba(0,0,0,0.50), inset 2px 0 4px rgba(255,255,255,0.07)"
          : "inset -2px 0 5px rgba(0,0,0,0.35), 2px 4px 10px rgba(0,0,0,0.32), inset 2px 0 3px rgba(255,255,255,0.06)",
        overflow: "hidden", position: "relative",
        display: "flex", flexDirection: "column", alignItems: "center",
      }}>

        {/* Top colour band */}
        {s.topBand && (
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 5,
            background: s.topBand, opacity: 0.9 }} />
        )}
        {/* Bottom colour band */}
        {s.bottomBand && (
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 5,
            background: s.bottomBand, opacity: 0.9 }} />
        )}

        {/* Left binding edge highlight */}
        <div style={{ position: "absolute", left: 0, top: 5, bottom: 5, width: 2,
          background: "linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.08) 100%)",
          borderRadius: 1 }} />

        {/* Texture overlays */}
        {s.texture === "linen" && (
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none",
            backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.025) 3px, rgba(255,255,255,0.025) 6px)" }} />
        )}
        {s.texture === "glossy" && (
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none",
            background: "linear-gradient(105deg, rgba(255,255,255,0.14) 0%, transparent 45%, rgba(0,0,0,0.10) 100%)" }} />
        )}
        {s.texture === "embossed" && (
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none",
            backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 6px, rgba(255,255,255,0.015) 6px, rgba(255,255,255,0.015) 7px)" }} />
        )}
        {s.texture === "foil" && (
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none",
            background: "linear-gradient(90deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.18) 30%, rgba(255,255,255,0.05) 60%, rgba(255,255,255,0.12) 80%, rgba(255,255,255,0.05) 100%)" }} />
        )}

        {/* Right accent bar */}
        {s.accentBar && (s.accentBarPos !== "left") && (
          <div style={{ position: "absolute", right: 0, top: 5, bottom: 5, width: 3,
            background: s.accentBar, opacity: 0.85, borderRadius: "0 2px 2px 0" }} />
        )}
        {/* Left accent bar (both) */}
        {s.accentBar && s.accentBarPos === "both" && (
          <div style={{ position: "absolute", left: 2, top: 5, bottom: 5, width: 2,
            background: s.accentBar, opacity: 0.55 }} />
        )}

        {/* Title (vertical) */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
          width: "100%", padding: "9px 3px 2px", overflow: "hidden" }}>
          <span style={{
            writingMode: "vertical-rl",
            textOrientation: "mixed",
            transform: "rotate(180deg)",
            fontSize: w >= 28 ? 9 : w >= 22 ? 8 : 7,
            fontWeight: 700,
            color: s.textColor,
            fontFamily: s.titleFont === "sans" ? "system-ui, sans-serif"
              : s.titleFont === "condensed" ? "'Arial Narrow', sans-serif"
              : "Georgia, 'Times New Roman', serif",
            letterSpacing: "0.04em",
            lineHeight: 1.12,
            maxHeight: height - 38,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            textShadow: "0 1px 4px rgba(0,0,0,0.65)",
          }}>
            {book.title}
          </span>
        </div>

        {/* Author surname + publisher at base */}
        <div style={{ width: "100%", display: "flex", flexDirection: "column",
          alignItems: "center", paddingBottom: 6, gap: 2 }}>
          {w >= 21 && (
            <span style={{
              writingMode: "vertical-rl", transform: "rotate(180deg)",
              fontSize: 6, color: `${s.textColor}88`, whiteSpace: "nowrap",
              overflow: "hidden", maxHeight: 56, letterSpacing: "0.03em",
              textShadow: "0 1px 2px rgba(0,0,0,0.5)",
            }}>
              {book.author.split(" ").slice(-1)[0]}
            </span>
          )}
          {s.publisher && (
            <span style={{
              writingMode: "vertical-rl", transform: "rotate(180deg)",
              fontSize: 5, fontWeight: 700, letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: s.publisherColor ?? `${s.textColor}77`,
            }}>
              {s.publisher}
            </span>
          )}
        </div>
      </div>

      {/* Hover tooltip */}
      {hov && (
        <div style={{
          position: "absolute", bottom: "calc(100% + 7px)", left: "50%",
          transform: "translateX(-50%)",
          background: "rgba(8,8,16,0.94)", color: "#f4efe8",
          fontSize: 9, fontWeight: 600, padding: "5px 8px", borderRadius: 6,
          whiteSpace: "nowrap", pointerEvents: "none", zIndex: 20,
          boxShadow: "0 3px 12px rgba(0,0,0,0.5)",
          lineHeight: 1.5, textAlign: "center",
        }}>
          <div>{book.title}</div>
          <div style={{ fontSize: 8, opacity: 0.6, fontWeight: 400 }}>{book.author}</div>
        </div>
      )}
    </div>
  );
}

// ─── Genre shelf row ──────────────────────────────────────────────────────────

function GenreShelf({
  genreKey, books, customName, onRename,
}: {
  genreKey: GenreKey;
  books: Book[];
  customName: string;
  onRename: (n: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(customName);
  const g = GENRES[genreKey];

  return (
    <div style={{ marginBottom: 22 }}>
      {/* Genre label row */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 7, paddingLeft: 2 }}>
        <span style={{ fontSize: 13 }}>{g.emoji}</span>
        {editing ? (
          <form onSubmit={(e) => { e.preventDefault(); onRename(draft); setEditing(false); }}
            style={{ display: "flex", gap: 4 }}>
            <input
              autoFocus value={draft}
              onChange={(e) => setDraft(e.target.value)}
              style={{
                fontSize: 11, fontWeight: 700, fontFamily: "Georgia, serif",
                border: "1px solid rgba(255,255,255,0.22)", borderRadius: 5,
                padding: "2px 8px", background: "rgba(255,255,255,0.1)",
                color: "#f0ece4", outline: "none", width: 120,
              }}
            />
            <button type="submit" style={{ fontSize: 10, padding: "2px 7px", borderRadius: 5,
              background: "#c8a030", color: "#100800", border: "none", cursor: "pointer", fontWeight: 700 }}>✓</button>
            <button type="button" onClick={() => setEditing(false)} style={{ fontSize: 10,
              padding: "2px 6px", borderRadius: 5, background: "rgba(255,255,255,0.12)",
              color: "#f0ece4", border: "none", cursor: "pointer" }}>✕</button>
          </form>
        ) : (
          <button onClick={() => { setDraft(customName); setEditing(true); }}
            style={{ background: "none", border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 3, padding: 0 }}>
            <span style={{ fontSize: 11, fontWeight: 700, fontFamily: "Georgia, serif",
              color: "#f0ece4", letterSpacing: "0.01em" }}>{customName}</span>
            <span style={{ fontSize: 9, color: "rgba(240,236,228,0.35)" }}>✎</span>
          </button>
        )}
        <span style={{ fontSize: 10, color: "rgba(240,236,228,0.35)", fontWeight: 500 }}>
          {books.length}
        </span>
      </div>

      {/* Spine scroll */}
      <div style={{ overflowX: "auto", scrollbarWidth: "none", paddingLeft: 4, paddingBottom: 2 }}>
        <div style={{ display: "flex", gap: 3, alignItems: "flex-end", minHeight: 134, paddingRight: 8 }}>
          {books.length === 0
            ? <div style={{ height: 134, display: "flex", alignItems: "center",
                color: "rgba(240,236,228,0.22)", fontSize: 11, fontStyle: "italic", paddingLeft: 2 }}>
                No books yet
              </div>
            : books.map((b) => <BookSpine key={b.id} book={b} />)
          }
        </div>
      </div>

      {/* Wooden shelf plank */}
      <div style={{
        height: 8, marginTop: -1,
        background: "linear-gradient(180deg, hsl(27 48% 52%) 0%, hsl(24 42% 44%) 55%, hsl(20 36% 36%) 100%)",
        borderRadius: "0 0 4px 4px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.36), inset 0 1px 0 rgba(255,255,255,0.09), inset 0 -1px 0 rgba(0,0,0,0.2)",
      }} />
      {/* Plank drop shadow */}
      <div style={{ height: 4, background: "rgba(0,0,0,0.18)",
        borderRadius: "0 0 4px 4px", filter: "blur(3px)", marginLeft: 6, marginRight: 6 }} />
    </div>
  );
}

// ─── Add Book modal ───────────────────────────────────────────────────────────

function AddBookModal({
  activePill, onAdd, onClose, genreNames,
}: {
  activePill: PillKey;
  onAdd: (book: Book) => void;
  onClose: () => void;
  genreNames: GenreNames;
}) {
  const [query, setQuery] = useState("");

  const customKeywords = Object.fromEntries(
    Object.entries(genreNames).map(([gk, name]) => [
      gk,
      (name ?? "").toLowerCase().split(/\s+/).filter((w) => w.length > 2),
    ])
  );
  const scoreBook = (b: Book) => {
    const kws = customKeywords[b.genre] ?? [];
    if (!kws.length) return 0;
    const text = `${b.title} ${b.author}`.toLowerCase();
    return kws.filter((kw) => text.includes(kw)).length;
  };

  const baseResults = query.length > 1
    ? SEARCH_POOL.filter((b) =>
        b.title.toLowerCase().includes(query.toLowerCase()) ||
        b.author.toLowerCase().includes(query.toLowerCase())
      )
    : SEARCH_POOL.slice(0, 6);

  const results = [...baseResults].sort((a, b) => scoreBook(b) - scoreBook(a));

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.72)",
      zIndex: 100, display: "flex", alignItems: "flex-end",
    }} onClick={onClose}>
      <div style={{
        width: "100%",
        background: "linear-gradient(160deg, rgba(45,27,78,0.97) 0%, rgba(26,42,74,0.97) 50%, rgba(42,24,64,0.97) 100%)",
        borderRadius: "16px 16px 0 0",
        padding: "20px 16px 36px",
        boxShadow: "0 -8px 32px rgba(0,0,0,0.5)",
        maxHeight: "70vh", overflowY: "auto",
      }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#f0ece4", fontFamily: "Georgia, serif" }}>
              Add a book
            </div>
            <div style={{ fontSize: 10, color: "rgba(240,236,228,0.4)", marginTop: 2 }}>
              Genre auto-detected · added to {PILLS.find(p => p.key === activePill)?.label}
            </div>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.1)", border: "none",
            borderRadius: "50%", width: 28, height: 28, cursor: "pointer", color: "#f0ece4", fontSize: 14 }}>✕</button>
        </div>
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search title or author…"
          style={{
            width: "100%", boxSizing: "border-box",
            fontSize: 13, border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: 10, padding: "9px 12px",
            background: "rgba(255,255,255,0.07)", color: "#f0ece4",
            outline: "none", marginBottom: 12,
          }}
        />
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {results.map((b) => (
            <button key={b.id} onClick={() => onAdd({ ...b, pillar: activePill })}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 10, padding: "8px 10px", cursor: "pointer", textAlign: "left",
              }}>
              {/* Mini spine preview */}
              <div style={{
                width: 10, height: 44, flexShrink: 0, borderRadius: "1px 2px 2px 1px",
                background: b.spine.bgEnd
                  ? `linear-gradient(90deg, ${b.spine.bg}, ${b.spine.bgEnd})`
                  : b.spine.bg,
                boxShadow: "inset -1px 0 2px rgba(0,0,0,0.3)",
              }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#f0ece4",
                  fontFamily: "Georgia, serif", lineHeight: 1.3 }}>{b.title}</div>
                <div style={{ fontSize: 10, color: "rgba(240,236,228,0.5)", marginTop: 1 }}>{b.author}</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3 }}>
                <span style={{
                  fontSize: 9, fontWeight: 600, padding: "2px 7px", borderRadius: 10,
                  background: "rgba(255,255,255,0.08)", color: "rgba(240,236,228,0.5)",
                  textTransform: "uppercase", letterSpacing: "0.05em",
                }}>
                  {GENRES[b.genre]?.emoji} {genreNames[b.genre] ?? GENRES[b.genre]?.name}
                </span>
                <span style={{
                  fontSize: 8, color: "rgba(200,160,48,0.6)",
                  fontWeight: 500, letterSpacing: "0.02em",
                }}>
                  → {genreNames[b.genre] ?? GENRES[b.genre]?.name}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const BG = "linear-gradient(160deg, #2d1b4e 0%, #1a2a4a 25%, #1e3a2a 55%, #3a1a2e 80%, #2a1840 100%)";

type GenreNames = Partial<Record<GenreKey, string>>;

export function LibrarySpineView() {
  const [activePill, setActivePill] = useState<PillKey>("reading");
  const [books, setBooks] = useState<Book[]>(CATALOGUE);
  const [genreNames, setGenreNames] = useState<GenreNames>({});
  const [showAdd, setShowAdd] = useState(false);

  const pillBooks = books.filter((b) => b.pillar === activePill);

  // Group by genre, only genres that have books
  const genreGroups = Object.keys(GENRES).reduce<Partial<Record<GenreKey, Book[]>>>((acc, gk) => {
    const genre = gk as GenreKey;
    const gb = pillBooks.filter((b) => b.genre === genre);
    if (gb.length > 0) acc[genre] = gb;
    return acc;
  }, {});

  const addBook = (book: Book) => {
    setBooks((prev) => {
      const exists = prev.find((b) => b.id === book.id);
      if (exists) return prev.map((b) => b.id === book.id ? { ...b, pillar: book.pillar } : b);
      return [...prev, book];
    });
    setShowAdd(false);
  };

  const pillCount = (key: PillKey) => books.filter((b) => b.pillar === key).length;

  const totalBooks = [...new Set(books.map((b) => b.id))].length;

  return (
    <div style={{ minHeight: "100vh", background: BG, fontFamily: "system-ui, sans-serif" }}>

      {/* Header */}
      <div style={{ padding: "22px 16px 10px", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <h2 style={{ fontFamily: "Georgia, serif", fontSize: 24, fontWeight: 700,
            margin: 0, color: "#f0ece4", letterSpacing: "-0.01em" }}>My Library</h2>
          <p style={{ fontSize: 11, color: "rgba(240,236,228,0.38)", margin: "3px 0 0", fontWeight: 500 }}>
            {totalBooks} books shelved
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          style={{
            display: "flex", alignItems: "center", gap: 5,
            padding: "7px 13px", borderRadius: 20,
            background: "rgba(200,160,48,0.18)", border: "1px solid rgba(200,160,48,0.4)",
            color: "#e8c66a", cursor: "pointer", fontSize: 11, fontWeight: 700,
            letterSpacing: "0.01em",
          }}>
          <span style={{ fontSize: 15, lineHeight: 1 }}>+</span>
          <span>Add Book</span>
        </button>
      </div>

      {/* Pills */}
      <div style={{ overflowX: "auto", scrollbarWidth: "none", padding: "4px 16px 14px",
        display: "flex", gap: 6 }}>
        {PILLS.map((pill) => {
          const active = activePill === pill.key;
          const count = pillCount(pill.key);
          return (
            <button key={pill.key} onClick={() => setActivePill(pill.key)} style={{
              flexShrink: 0, display: "flex", alignItems: "center", gap: 4,
              padding: "5px 12px", borderRadius: 20,
              border: active ? "1px solid rgba(200,160,48,0.55)" : "1px solid rgba(255,255,255,0.10)",
              background: active ? "rgba(200,160,48,0.14)" : "rgba(255,255,255,0.04)",
              cursor: "pointer", fontSize: 11, fontWeight: active ? 700 : 500,
              color: active ? "#e8c66a" : "rgba(240,236,228,0.45)",
              transition: "all 0.14s", whiteSpace: "nowrap",
            }}>
              {pill.emoji && <span style={{ fontSize: 12 }}>{pill.emoji}</span>}
              {pill.stars ? (
                <span style={{ color: active ? "#e8c66a" : "rgba(240,236,228,0.4)", letterSpacing: -1 }}>
                  {"★".repeat(pill.stars)}
                  <span style={{ opacity: 0.2 }}>{"★".repeat(5 - pill.stars)}</span>
                </span>
              ) : (
                <span>{pill.label}</span>
              )}
              {count > 0 && (
                <span style={{ fontSize: 9, fontWeight: 700,
                  background: active ? "rgba(200,160,48,0.25)" : "rgba(255,255,255,0.07)",
                  color: active ? "#e8c66a" : "rgba(240,236,228,0.35)",
                  padding: "1px 5px", borderRadius: 10 }}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "0 16px 16px" }} />

      {/* Genre shelves */}
      <div style={{ padding: "0 12px 32px", backdropFilter: "none" }}>
        {Object.entries(genreGroups).map(([gk, gbooks]) => (
          <GenreShelf
            key={gk}
            genreKey={gk as GenreKey}
            books={gbooks!}
            customName={genreNames[gk as GenreKey] ?? GENRES[gk as GenreKey].name}
            onRename={(n) => setGenreNames((prev) => ({ ...prev, [gk]: n }))}
          />
        ))}
        {pillBooks.length === 0 && (
          <div style={{ textAlign: "center", padding: "52px 0",
            color: "rgba(240,236,228,0.22)", fontSize: 12, fontStyle: "italic" }}>
            No books here yet — tap + Add Book to start
          </div>
        )}
      </div>

      {showAdd && (
        <AddBookModal
          activePill={activePill}
          onAdd={addBook}
          onClose={() => setShowAdd(false)}
          genreNames={genreNames}
        />
      )}
    </div>
  );
}
