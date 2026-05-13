import { useState } from "react";

// ── Accurate physical book spine data ─────────────────────────────────────────
// Colors, widths, and publisher marks modeled after real editions

interface BookData {
  id: string;
  title: string;
  author: string;
  pages: number; // drives spine width
  spine: {
    bg: string;           // main spine color
    bgEnd?: string;       // gradient end (optional)
    textColor: string;
    accentBar?: string;   // thin accent strip color
    texture?: "linen" | "matte" | "glossy" | "foil";
    publisher?: string;   // small publisher mark
    publisherColor?: string;
  };
}

const BOOKS: Record<string, BookData> = {
  fw: {
    id: "fw", title: "Fourth Wing", author: "Rebecca Yarros", pages: 517,
    spine: { bg: "#5c1a1a", bgEnd: "#7a2020", textColor: "#f0d080", accentBar: "#c8922a",
             texture: "matte", publisher: "E", publisherColor: "#f0d08099" },
  },
  if: {
    id: "if", title: "Iron Flame", author: "Rebecca Yarros", pages: 623,
    spine: { bg: "#1c1c2e", bgEnd: "#2a1a2a", textColor: "#c0a0e0", accentBar: "#7a3fa0",
             texture: "matte", publisher: "E", publisherColor: "#c0a0e099" },
  },
  os: {
    id: "os", title: "Onyx Storm", author: "Rebecca Yarros", pages: 704,
    spine: { bg: "#0d1b2a", bgEnd: "#152535", textColor: "#a0c8e8", accentBar: "#2060a0",
             texture: "matte", publisher: "E", publisherColor: "#a0c8e899" },
  },
  acotar: {
    id: "acotar", title: "A Court of Thorns and Roses", author: "Sarah J. Maas", pages: 419,
    spine: { bg: "#1a1035", bgEnd: "#251545", textColor: "#e8c8a0", accentBar: "#8040c0",
             texture: "matte", publisher: "B", publisherColor: "#e8c8a099" },
  },
  acomaf: {
    id: "acomaf", title: "A Court of Mist and Fury", author: "Sarah J. Maas", pages: 626,
    spine: { bg: "#0e1a28", bgEnd: "#182434", textColor: "#d0b890", accentBar: "#304060",
             texture: "matte", publisher: "B", publisherColor: "#d0b89099" },
  },
  tcp: {
    id: "tcp", title: "The Cruel Prince", author: "Holly Black", pages: 370,
    spine: { bg: "#162411", bgEnd: "#1e3018", textColor: "#c8e8a0", accentBar: "#406030",
             texture: "matte", publisher: "L", publisherColor: "#c8e8a099" },
  },
  kotw: {
    id: "kotw", title: "Kingdom of the Wicked", author: "Kerri Maniscalco", pages: 373,
    spine: { bg: "#1e0d30", bgEnd: "#2a1040", textColor: "#f0d0c0", accentBar: "#602040",
             texture: "matte", publisher: "I", publisherColor: "#f0d0c099" },
  },
  fbaa: {
    id: "fbaa", title: "From Blood and Ash", author: "Jennifer L. Armentrout", pages: 622,
    spine: { bg: "#3a0a18", bgEnd: "#4e1020", textColor: "#f8c8b0", accentBar: "#902030",
             texture: "linen", publisher: "B", publisherColor: "#f8c8b099" },
  },
  hosnr: {
    id: "hosnr", title: "House of Salt and Sorrows", author: "Erin A. Craig", pages: 392,
    spine: { bg: "#0f2e2c", bgEnd: "#163e3b", textColor: "#b0e0d8", accentBar: "#208078",
             texture: "glossy", publisher: "Delacorte", publisherColor: "#b0e0d899" },
  },
  notw: {
    id: "notw", title: "The Name of the Wind", author: "Patrick Rothfuss", pages: 662,
    spine: { bg: "#3c2410", bgEnd: "#4e3018", textColor: "#f0d8b0", accentBar: "#805030",
             texture: "linen", publisher: "DAW", publisherColor: "#f0d8b099" },
  },
  mistborn: {
    id: "mistborn", title: "Mistborn", author: "Brandon Sanderson", pages: 541,
    spine: { bg: "#1e2a38", bgEnd: "#28374a", textColor: "#d0d8e8", accentBar: "#405870",
             texture: "matte", publisher: "TOR", publisherColor: "#d0d8e899" },
  },
  fairytale: {
    id: "fairytale", title: "Fairytale", author: "Stephen King", pages: 608,
    spine: { bg: "#7a2010", bgEnd: "#962818", textColor: "#f8f0e0", accentBar: "#c84020",
             texture: "matte", publisher: "S&S", publisherColor: "#f8f0e099" },
  },
  oif: {
    id: "oif", title: "Our Infinite Fates", author: "Abigail Owen", pages: 336,
    spine: { bg: "#2e1a4a", bgEnd: "#3d2560", textColor: "#e0c8f8", accentBar: "#8060c0",
             texture: "glossy", publisher: "E", publisherColor: "#e0c8f899" },
  },
  dreadbound: {
    id: "dreadbound", title: "Dreadbound", author: "Zoë Hawthorn", pages: 418,
    spine: { bg: "#121c2a", bgEnd: "#1a2838", textColor: "#c0d0e0", accentBar: "#304860",
             texture: "matte", publisher: "Or", publisherColor: "#c0d0e099" },
  },
  dom: {
    id: "dom", title: "Den of Malice", author: "Rina Kent", pages: 358,
    spine: { bg: "#0e0e1a", bgEnd: "#18182a", textColor: "#c8a0c8", accentBar: "#503060",
             texture: "matte", publisher: "RK", publisherColor: "#c8a0c899" },
  },
  sas: {
    id: "sas", title: "Smoke and Ash", author: "Elise Kova", pages: 440,
    spine: { bg: "#1a1010", bgEnd: "#261818", textColor: "#e8c0a0", accentBar: "#704030",
             texture: "matte", publisher: "SS", publisherColor: "#e8c0a099" },
  },
  prisonerthorn: {
    id: "prisonerthorn", title: "Prisoner of Thorns", author: "Eva Chase", pages: 352,
    spine: { bg: "#0e2218", bgEnd: "#142c20", textColor: "#b0e0c0", accentBar: "#206040",
             texture: "glossy", publisher: "Ink", publisherColor: "#b0e0c099" },
  },
  wrath: {
    id: "wrath", title: "Wrath of the Fallen", author: "Nora Roberts", pages: 432,
    spine: { bg: "#2a1a0c", bgEnd: "#382414", textColor: "#f0d8b8", accentBar: "#804020",
             texture: "linen", publisher: "St M", publisherColor: "#f0d8b899" },
  },
};

// ── Pill tab + shelf structure ────────────────────────────────────────────────

type StarKey = "1" | "2" | "3" | "4" | "5";
type PillKey = "reading" | "tbr" | StarKey;

interface Shelf {
  id: string;
  name: string;
  bookIds: string[];
}

interface PillData {
  label: string;
  emoji?: string;
  starCount?: number;
  shelves: Shelf[];
}

const DEFAULT_PILLS: Record<PillKey, PillData> = {
  reading: {
    label: "Reading",
    emoji: "📖",
    shelves: [
      { id: "r1", name: "Current", bookIds: ["fw", "acotar", "notw"] },
    ],
  },
  tbr: {
    label: "Want to Read",
    emoji: "🔖",
    shelves: [
      { id: "t1", name: "Next Up",      bookIds: ["oif", "dreadbound", "kotw"] },
      { id: "t2", name: "Someday",      bookIds: ["fairytale", "sas", "wrath", "prisonerthorn"] },
    ],
  },
  "1": {
    label: "★",
    starCount: 1,
    shelves: [{ id: "s1", name: "Disappointing", bookIds: [] }],
  },
  "2": {
    label: "★★",
    starCount: 2,
    shelves: [{ id: "s2", name: "It Was Ok", bookIds: ["dom"] }],
  },
  "3": {
    label: "★★★",
    starCount: 3,
    shelves: [
      { id: "s3", name: "Liked It",    bookIds: ["tcp", "hosnr", "fbaa"] },
      { id: "s3b", name: "Dark Reads", bookIds: ["dreadbound", "kotw"] },
    ],
  },
  "4": {
    label: "★★★★",
    starCount: 4,
    shelves: [
      { id: "s4", name: "Really Good", bookIds: ["acomaf", "mistborn", "sas"] },
      { id: "s4b", name: "Faves",      bookIds: ["fbaa", "notw"] },
    ],
  },
  "5": {
    label: "★★★★★",
    starCount: 5,
    shelves: [
      { id: "s5",  name: "All-time Faves", bookIds: ["fw", "if", "os", "acotar"] },
      { id: "s5b", name: "Re-readable",    bookIds: ["notw", "mistborn", "acomaf"] },
    ],
  },
};

const PILL_ORDER: PillKey[] = ["reading", "tbr", "1", "2", "3", "4", "5"];

// ── Book Spine ────────────────────────────────────────────────────────────────

const BASE_WIDTH = 24; // pages / 500 * BASE_WIDTH, min 18 max 38

function spineWidth(pages: number) {
  return Math.max(18, Math.min(38, Math.round((pages / 540) * BASE_WIDTH)));
}

function BookSpine({ book, height = 130 }: { book: BookData; height?: number }) {
  const [hovered, setHovered] = useState(false);
  const w = spineWidth(book.pages);
  const { spine } = book;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={`${book.title} · ${book.author}`}
      style={{
        width: w,
        height,
        flexShrink: 0,
        cursor: "pointer",
        transition: "transform 0.18s ease",
        transform: hovered ? "translateY(-6px)" : "translateY(0)",
        position: "relative",
      }}
    >
      {/* Main spine body */}
      <div style={{
        width: "100%",
        height: "100%",
        background: spine.bgEnd
          ? `linear-gradient(90deg, ${spine.bg} 0%, ${spine.bgEnd} 55%, ${spine.bg}cc 100%)`
          : spine.bg,
        borderRadius: "2px 4px 4px 2px",
        boxShadow: hovered
          ? "inset -2px 0 5px rgba(0,0,0,0.35), 4px 8px 18px rgba(0,0,0,0.38), inset 2px 0 3px rgba(255,255,255,0.06)"
          : "inset -2px 0 4px rgba(0,0,0,0.28), 2px 3px 8px rgba(0,0,0,0.22), inset 2px 0 3px rgba(255,255,255,0.06)",
        overflow: "hidden",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}>

        {/* Texture overlay */}
        {spine.texture === "linen" && (
          <div style={{
            position: "absolute", inset: 0,
            backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)",
            pointerEvents: "none",
          }} />
        )}
        {spine.texture === "glossy" && (
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(90deg, rgba(255,255,255,0.12) 0%, transparent 40%, rgba(0,0,0,0.08) 100%)",
            pointerEvents: "none",
          }} />
        )}

        {/* Left binding highlight */}
        <div style={{
          position: "absolute", left: 0, top: 0, bottom: 0, width: 2,
          background: "rgba(255,255,255,0.14)",
        }} />

        {/* Accent colour bar */}
        {spine.accentBar && (
          <div style={{
            position: "absolute", right: 0, top: 0, bottom: 0, width: 3,
            background: spine.accentBar,
            opacity: 0.8,
          }} />
        )}

        {/* Title — vertical */}
        <div style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          padding: "6px 2px 4px",
        }}>
          <span style={{
            writingMode: "vertical-rl",
            textOrientation: "mixed",
            transform: "rotate(180deg)",
            fontSize: w > 25 ? 8 : 7,
            fontWeight: 700,
            color: spine.textColor,
            letterSpacing: "0.04em",
            lineHeight: 1.15,
            maxHeight: height - 36,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            textShadow: "0 1px 3px rgba(0,0,0,0.55)",
            fontFamily: "'Georgia', serif",
          }}>
            {book.title}
          </span>
        </div>

        {/* Author + publisher at bottom */}
        <div style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          paddingBottom: 4,
          gap: 1,
        }}>
          {w >= 22 && (
            <span style={{
              writingMode: "vertical-rl",
              transform: "rotate(180deg)",
              fontSize: 6,
              color: `${spine.textColor}99`,
              whiteSpace: "nowrap",
              overflow: "hidden",
              maxHeight: 60,
              letterSpacing: "0.02em",
              textShadow: "0 1px 2px rgba(0,0,0,0.4)",
            }}>
              {book.author.split(" ").slice(-1)[0]}
            </span>
          )}
          {spine.publisher && (
            <span style={{
              writingMode: "vertical-rl",
              transform: "rotate(180deg)",
              fontSize: 5,
              color: spine.publisherColor ?? `${spine.textColor}88`,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              fontWeight: 700,
            }}>
              {spine.publisher}
            </span>
          )}
        </div>
      </div>

      {/* Hover tooltip */}
      {hovered && (
        <div style={{
          position: "absolute",
          bottom: "calc(100% + 6px)",
          left: "50%",
          transform: "translateX(-50%)",
          background: "rgba(10,10,18,0.92)",
          color: "#f8f4ee",
          fontSize: 9,
          fontWeight: 600,
          padding: "4px 7px",
          borderRadius: 5,
          whiteSpace: "nowrap",
          pointerEvents: "none",
          zIndex: 10,
          boxShadow: "0 2px 8px rgba(0,0,0,0.35)",
          maxWidth: 140,
          textAlign: "center",
          lineHeight: 1.4,
        }}>
          <div>{book.title}</div>
          <div style={{ fontSize: 8, opacity: 0.65, fontWeight: 400 }}>{book.author}</div>
        </div>
      )}
    </div>
  );
}

// ── Shelf row (editable name + horizontal spine scroll + wooden plank) ─────────

function ShelfRow({
  shelf, onRename,
}: {
  shelf: Shelf;
  onRename: (name: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(shelf.name);
  const books = shelf.bookIds.map((id) => BOOKS[id]).filter(Boolean);

  return (
    <div style={{ marginBottom: 18 }}>
      {/* Shelf label */}
      <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 6, paddingLeft: 2 }}>
        {editing ? (
          <form
            onSubmit={(e) => { e.preventDefault(); onRename(draft); setEditing(false); }}
            style={{ display: "flex", gap: 4 }}
          >
            <input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              style={{
                fontSize: 11, fontWeight: 700,
                border: "1px solid rgba(255,255,255,0.25)",
                borderRadius: 5, padding: "2px 7px",
                background: "rgba(255,255,255,0.12)",
                color: "#f0ece6", outline: "none", width: 110,
              }}
            />
            <button type="submit" style={{ fontSize: 10, padding: "2px 7px", borderRadius: 5, background: "#e8c66a", color: "#1a1208", border: "none", cursor: "pointer", fontWeight: 700 }}>✓</button>
            <button type="button" onClick={() => setEditing(false)} style={{ fontSize: 10, padding: "2px 6px", borderRadius: 5, background: "rgba(255,255,255,0.15)", color: "#f0ece6", border: "none", cursor: "pointer" }}>✕</button>
          </form>
        ) : (
          <button
            onClick={() => { setDraft(shelf.name); setEditing(true); }}
            style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 3, padding: 0 }}
          >
            <span style={{ fontSize: 11, fontWeight: 700, color: "#f0ece6", fontFamily: "Georgia, serif", letterSpacing: "0.01em" }}>
              {shelf.name}
            </span>
            <span style={{ fontSize: 9, color: "rgba(240,236,230,0.45)" }}>✎</span>
          </button>
        )}
        <span style={{ fontSize: 10, color: "rgba(240,236,230,0.4)", fontWeight: 500 }}>
          {books.length} {books.length === 1 ? "book" : "books"}
        </span>
      </div>

      {/* Spine scroll */}
      <div
        style={{
          overflowX: "auto",
          scrollbarWidth: "none",
          paddingLeft: 4,
          paddingRight: 8,
          paddingBottom: 2,
        }}
      >
        <div style={{ display: "flex", gap: 3, alignItems: "flex-end", minHeight: 130 }}>
          {books.length === 0 ? (
            <div style={{
              height: 130, display: "flex", alignItems: "center", paddingLeft: 4,
              color: "rgba(240,236,230,0.3)", fontSize: 11, fontStyle: "italic",
            }}>
              No books yet
            </div>
          ) : (
            books.map((b) => <BookSpine key={b.id} book={b} height={130} />)
          )}
        </div>
      </div>

      {/* Wooden shelf plank */}
      <div style={{
        height: 7,
        background: "linear-gradient(180deg, hsl(28 52% 56%) 0%, hsl(25 46% 46%) 60%, hsl(22 40% 38%) 100%)",
        borderRadius: "0 0 3px 3px",
        boxShadow: "0 4px 10px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.1)",
        marginLeft: 0,
        marginRight: 0,
      }} />

      {/* Plank shadow */}
      <div style={{
        height: 3,
        background: "rgba(0,0,0,0.14)",
        borderRadius: "0 0 3px 3px",
        filter: "blur(2px)",
        marginLeft: 4,
        marginRight: 4,
      }} />
    </div>
  );
}

// ── Star pill label ───────────────────────────────────────────────────────────

function StarLabel({ count }: { count: number }) {
  return (
    <span style={{ color: "#e8c66a", fontSize: 11, letterSpacing: -1 }}>
      {"★".repeat(count)}
      <span style={{ color: "rgba(240,236,230,0.25)", fontSize: 11 }}>
        {"★".repeat(5 - count)}
      </span>
    </span>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

const BG = "linear-gradient(170deg, #1a1410 0%, #1e1812 40%, #16120e 100%)";

export function LibrarySpineView() {
  const [activePill, setActivePill] = useState<PillKey>("reading");
  const [pills, setPills] = useState(DEFAULT_PILLS);

  const pill = pills[activePill];

  const renameSelf = (shelfId: string, name: string) => {
    setPills((p) => ({
      ...p,
      [activePill]: {
        ...p[activePill],
        shelves: p[activePill].shelves.map((s) => s.id === shelfId ? { ...s, name } : s),
      },
    }));
  };

  const totalBooks = Object.values(pills)
    .flatMap((p) => p.shelves.flatMap((s) => s.bookIds))
    .filter((v, i, a) => a.indexOf(v) === i).length;

  return (
    <div style={{ minHeight: "100vh", background: BG, fontFamily: "system-ui, sans-serif" }}>

      {/* Header */}
      <div style={{ padding: "20px 16px 12px" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
          <div>
            <h2 style={{
              fontFamily: "Georgia, serif", fontSize: 24, fontWeight: 700, margin: 0,
              color: "#f0ece6", letterSpacing: "-0.01em",
            }}>
              My Library
            </h2>
            <p style={{ fontSize: 11, color: "rgba(240,236,230,0.45)", margin: "3px 0 0", fontWeight: 500 }}>
              {totalBooks} books across your shelves
            </p>
          </div>
          {/* Sort icon placeholder */}
          <button style={{
            background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 8, padding: "5px 9px", cursor: "pointer",
            color: "rgba(240,236,230,0.6)", fontSize: 13,
          }}>
            ⇅
          </button>
        </div>
      </div>

      {/* Pill tabs */}
      <div style={{
        overflowX: "auto", scrollbarWidth: "none",
        padding: "0 16px 12px",
        display: "flex", gap: 6,
      }}>
        {PILL_ORDER.map((key) => {
          const p = pills[key];
          const active = activePill === key;
          const isStarKey = !isNaN(Number(key));
          return (
            <button
              key={key}
              onClick={() => setActivePill(key)}
              style={{
                flexShrink: 0,
                display: "flex", alignItems: "center", gap: 4,
                padding: "5px 11px",
                borderRadius: 20,
                border: active
                  ? "1px solid rgba(232,198,106,0.5)"
                  : "1px solid rgba(255,255,255,0.12)",
                background: active
                  ? "rgba(232,198,106,0.15)"
                  : "rgba(255,255,255,0.06)",
                cursor: "pointer",
                fontSize: 11,
                fontWeight: active ? 700 : 500,
                color: active ? "#e8c66a" : "rgba(240,236,230,0.55)",
                transition: "all 0.15s",
                whiteSpace: "nowrap",
              }}
            >
              {p.emoji && <span style={{ fontSize: 12 }}>{p.emoji}</span>}
              {isStarKey && p.starCount ? (
                <StarLabel count={p.starCount} />
              ) : (
                !isStarKey && <span>{p.label}</span>
              )}
              <span style={{
                fontSize: 9, fontWeight: 600,
                background: active ? "rgba(232,198,106,0.2)" : "rgba(255,255,255,0.08)",
                color: active ? "#e8c66a" : "rgba(240,236,230,0.4)",
                padding: "1px 5px", borderRadius: 10,
              }}>
                {p.shelves.flatMap((s) => s.bookIds).length}
              </span>
            </button>
          );
        })}
      </div>

      {/* Divider */}
      <div style={{
        height: 1,
        background: "rgba(255,255,255,0.07)",
        margin: "0 16px 14px",
      }} />

      {/* Active pill content */}
      <div style={{ padding: "0 12px 24px" }}>

        {/* Pill header with star display for rating tabs */}
        {pill.starCount && (
          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            marginBottom: 12, paddingLeft: 4,
          }}>
            <span style={{ fontSize: 16, color: "#e8c66a", letterSpacing: -1 }}>
              {"★".repeat(pill.starCount)}
              <span style={{ color: "rgba(240,236,230,0.15)", fontSize: 16 }}>
                {"★".repeat(5 - pill.starCount)}
              </span>
            </span>
            <span style={{ fontSize: 11, color: "rgba(240,236,230,0.4)", fontWeight: 500 }}>
              {pill.starCount}-star reads
            </span>
          </div>
        )}

        {pill.shelves.map((shelf) => (
          <ShelfRow
            key={shelf.id}
            shelf={shelf}
            onRename={(name) => renameSelf(shelf.id, name)}
          />
        ))}

        {pill.shelves.length === 0 && (
          <div style={{
            textAlign: "center", padding: "40px 0",
            color: "rgba(240,236,230,0.3)", fontSize: 12, fontStyle: "italic",
          }}>
            No shelves in this category yet
          </div>
        )}
      </div>
    </div>
  );
}
