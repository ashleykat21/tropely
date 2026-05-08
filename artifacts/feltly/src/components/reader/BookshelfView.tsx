import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, BookOpen } from "lucide-react";
import type { Book, BookcaseStyle, BookcaseSpineStyle } from "@/lib/store";
import { MOODS } from "@/lib/moods";
import { tropeCategory } from "@/lib/tropes";

const BOOKS_PER_ROW = 6;

const SHELF_CONFIG: Record<
  string,
  {
    containerBg: string;
    plankBg: string;
    plankTop: string;
    plankShadow: string;
    textDark: boolean;
  }
> = {
  "classic-wood": {
    containerBg: "hsl(24 30% 11%)",
    plankBg: "linear-gradient(180deg,hsl(28 50% 30%) 0%,hsl(25 44% 24%) 60%,hsl(22 40% 19%) 100%)",
    plankTop: "hsl(30 55% 35%)",
    plankShadow: "0 3px 10px rgba(0,0,0,0.5)",
    textDark: false,
  },
  "light-oak": {
    containerBg: "hsl(38 35% 86%)",
    plankBg: "linear-gradient(180deg,hsl(36 55% 72%) 0%,hsl(34 50% 66%) 60%,hsl(32 46% 60%) 100%)",
    plankTop: "hsl(38 58% 76%)",
    plankShadow: "0 3px 8px rgba(0,0,0,0.18)",
    textDark: true,
  },
  "dark-walnut": {
    containerBg: "hsl(18 18% 8%)",
    plankBg: "linear-gradient(180deg,hsl(20 28% 16%) 0%,hsl(18 24% 13%) 60%,hsl(16 20% 10%) 100%)",
    plankTop: "hsl(24 35% 20%)",
    plankShadow: "0 3px 12px rgba(0,0,0,0.7)",
    textDark: false,
  },
  "cozy-pastel": {
    containerBg: "hsl(355 30% 93%)",
    plankBg: "linear-gradient(180deg,hsl(22 55% 78%) 0%,hsl(20 50% 72%) 60%,hsl(18 46% 66%) 100%)",
    plankTop: "hsl(24 58% 80%)",
    plankShadow: "0 3px 8px rgba(0,0,0,0.15)",
    textDark: true,
  },
  "minimal-cream": {
    containerBg: "hsl(46 28% 96%)",
    plankBg: "linear-gradient(180deg,hsl(40 22% 80%) 0%,hsl(38 20% 74%) 60%,hsl(36 18% 68%) 100%)",
    plankTop: "hsl(42 25% 82%)",
    plankShadow: "0 3px 6px rgba(0,0,0,0.12)",
    textDark: true,
  },
};

const COLORFUL_PALETTE = [
  "hsl(350 58% 52%)", "hsl(22 62% 50%)", "hsl(42 68% 52%)",
  "hsl(145 42% 40%)", "hsl(185 48% 40%)", "hsl(220 50% 48%)",
  "hsl(262 44% 54%)", "hsl(320 44% 50%)", "hsl(15 58% 48%)",
  "hsl(165 38% 38%)", "hsl(55 62% 48%)",  "hsl(195 52% 44%)",
];
const NEUTRAL_PALETTE = [
  "hsl(35 18% 58%)", "hsl(30 14% 52%)", "hsl(45 16% 66%)",
  "hsl(200 10% 54%)", "hsl(25 20% 46%)", "hsl(50 14% 62%)",
  "hsl(210 12% 48%)", "hsl(15 16% 50%)",
];
const GENRE_PALETTE: Record<string, string> = {
  Spice:      "hsl(350 55% 50%)",
  Plot:       "hsl(220 48% 48%)",
  Vibe:       "hsl(280 42% 52%)",
  Romance:    "hsl(335 50% 54%)",
  Dark:       "hsl(240 30% 30%)",
  Comedy:     "hsl(48 65% 50%)",
  Mystery:    "hsl(240 35% 40%)",
  Fantasy:    "hsl(260 45% 52%)",
  Historical: "hsl(30 40% 46%)",
};

function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function getSpineColor(book: Book, style: BookcaseSpineStyle): string {
  switch (style) {
    case "colorful":
      return COLORFUL_PALETTE[hashCode(book.id) % COLORFUL_PALETTE.length];
    case "neutral":
      return NEUTRAL_PALETTE[hashCode(book.id) % NEUTRAL_PALETTE.length];
    case "mood-based": {
      const m = book.mood ? MOODS[book.mood] : null;
      if (m) return `hsl(${m.h} ${m.s}% ${Math.min(m.l + 5, 70)}%)`;
      return NEUTRAL_PALETTE[hashCode(book.id) % NEUTRAL_PALETTE.length];
    }
    case "genre-based": {
      const firstTrope = (book.tropes ?? [])[0];
      const cat = firstTrope ? tropeCategory(firstTrope) : null;
      if (cat && GENRE_PALETTE[cat.name]) return GENRE_PALETTE[cat.name];
      return COLORFUL_PALETTE[hashCode(book.id) % COLORFUL_PALETTE.length];
    }
    default:
      return COLORFUL_PALETTE[hashCode(book.id) % COLORFUL_PALETTE.length];
  }
}

type Props = {
  books: Book[];
  style: BookcaseStyle;
};

export function BookshelfView({ books, style }: Props) {
  const nav = useNavigate();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const cfg = SHELF_CONFIG[style.shelf] ?? SHELF_CONFIG["classic-wood"];

  const rows: Book[][] = [];
  for (let i = 0; i < books.length; i += BOOKS_PER_ROW) {
    rows.push(books.slice(i, i + BOOKS_PER_ROW));
  }

  const selectedBook = books.find((b) => b.id === selectedId) ?? null;

  if (books.length === 0) {
    return (
      <div
        className="rounded-2xl p-10 text-center"
        style={{ background: cfg.containerBg }}
      >
        <p
          className="text-sm"
          style={{ color: cfg.textDark ? "rgba(60,40,20,0.6)" : "rgba(255,255,255,0.5)" }}
        >
          Nothing on this shelf yet.
        </p>
      </div>
    );
  }

  return (
    <>
      <div
        className="relative rounded-2xl overflow-hidden select-none"
        style={{ background: cfg.containerBg }}
      >
        <div className="px-3 pt-5 pb-3 space-y-0">
          {rows.map((row, rowIdx) => (
            <div key={rowIdx}>
              {/* Books */}
              <div className="flex items-end gap-[3px]">
                {row.map((book) => {
                  const color = getSpineColor(book, style.spine);
                  const isSelected = selectedId === book.id;
                  return (
                    <motion.button
                      key={book.id}
                      onClick={() => setSelectedId(isSelected ? null : book.id)}
                      className="relative flex-1 min-w-0 rounded-t-[3px] overflow-hidden cursor-pointer"
                      style={{
                        height: 148,
                        background: color,
                        boxShadow: isSelected
                          ? `0 -10px 24px rgba(0,0,0,0.45), inset -2px 0 5px rgba(0,0,0,0.3)`
                          : `inset -2px 0 4px rgba(0,0,0,0.22), inset 1px 0 2px rgba(255,255,255,0.1)`,
                      }}
                      animate={{ y: isSelected ? -22 : 0, scale: isSelected ? 1.06 : 1 }}
                      transition={{ type: "spring", stiffness: 340, damping: 28 }}
                      aria-label={`View ${book.title}`}
                    >
                      {/* Spine text */}
                      <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                        <div
                          className="flex flex-col items-center gap-[2px] text-center pointer-events-none"
                          style={{ transform: "rotate(-90deg)", width: 136, maxWidth: 136 }}
                        >
                          <span
                            className="font-display text-[10px] leading-tight font-semibold"
                            style={{
                              color: "rgba(255,255,255,0.92)",
                              textShadow: "0 1px 3px rgba(0,0,0,0.45)",
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                              maxWidth: "100%",
                            }}
                          >
                            {book.title}
                          </span>
                          {book.author && (
                            <span
                              className="text-[8px] leading-tight truncate w-full text-center"
                              style={{ color: "rgba(255,255,255,0.65)" }}
                            >
                              {book.author}
                            </span>
                          )}
                        </div>
                      </div>
                      {/* Top gloss */}
                      <div
                        className="absolute top-0 inset-x-0 h-5 pointer-events-none"
                        style={{
                          background:
                            "linear-gradient(180deg,rgba(255,255,255,0.2) 0%,transparent 100%)",
                        }}
                      />
                      {/* Left spine edge (dark) */}
                      <div
                        className="absolute inset-y-0 left-0 w-1 pointer-events-none"
                        style={{
                          background:
                            "linear-gradient(90deg,rgba(0,0,0,0.35) 0%,transparent 100%)",
                        }}
                      />
                    </motion.button>
                  );
                })}
              </div>

              {/* Shelf plank */}
              <div
                style={{
                  height: 18,
                  background: cfg.plankBg,
                  boxShadow: cfg.plankShadow,
                  borderTop: `2px solid ${cfg.plankTop}`,
                  marginBottom: rowIdx < rows.length - 1 ? 18 : 4,
                  borderRadius: "0 0 2px 2px",
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Cover preview modal */}
      <AnimatePresence>
        {selectedBook && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 pb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedId(null)}
          >
            <div className="absolute inset-0 bg-black/65 backdrop-blur-sm" />
            <motion.div
              className="relative z-10 w-full max-w-[280px] rounded-3xl bg-background shadow-2xl overflow-hidden"
              initial={{ y: 72, scale: 0.88, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: 72, scale: 0.88, opacity: 0 }}
              transition={{ type: "spring", stiffness: 310, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Cover image */}
              <div className="aspect-[2/3] w-full bg-muted">
                {selectedBook.cover ? (
                  <img
                    src={selectedBook.cover}
                    alt={`Cover of ${selectedBook.title}`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div
                    className="h-full w-full flex items-center justify-center p-6 text-center"
                    style={{ background: getSpineColor(selectedBook, style.spine) }}
                  >
                    <span className="font-display text-xl text-white leading-snug drop-shadow">
                      {selectedBook.title}
                    </span>
                  </div>
                )}
              </div>

              {/* Info + actions */}
              <div className="p-5 space-y-4">
                <div>
                  <h3 className="font-display text-xl leading-tight">
                    {selectedBook.title}
                  </h3>
                  {selectedBook.author && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedBook.author}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedId(null);
                      nav(`/book/${selectedBook.id}`);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-foreground text-background py-3 text-sm font-medium active:scale-95 transition-transform"
                  >
                    <BookOpen className="h-4 w-4" />
                    Open book
                  </button>
                  <button
                    onClick={() => setSelectedId(null)}
                    className="rounded-2xl border border-border bg-card px-4 py-3 active:scale-95 transition-transform"
                    aria-label="Close"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
