import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Shelf, useLibrary } from "@/lib/store";
import { BookCover } from "./BookCover";
import { MoodChip } from "./MoodChip";
import { MOODS } from "@/lib/moods";
import { TROPE_CATEGORIES, tropeCategory } from "@/lib/tropes";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { usePremium } from "@/lib/usePremium";
import { ChevronUp, ChevronDown, Headphones, BookOpen, FolderPlus, Library, X, Plus, Heart, Lock, Pencil, Check, Star, ArrowUpDown, Search, Bookmark, LayoutGrid, BookMarked, Sliders, Globe, Eye, EyeOff } from "lucide-react";
import { ShareCardModal } from "./ShareCardModal";
import { TbrMoodIntentBadge, TbrIntentStrip } from "./TbrMoodIntent";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LockedFeature } from "@/components/premium/LockedFeature";
import { BookshelfView } from "./BookshelfView";
import { BookshelfCustomizer } from "./BookshelfCustomizer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

type TabKey = Shelf | "series";
const TABS: { key: TabKey; label: string }[] = [
  { key: "reading", label: "Reading" },
  { key: "want", label: "Want to read" },
  { key: "paused", label: "Paused" },
  { key: "finished", label: "Finished" },
  { key: "dnf", label: "DNF" },
  { key: "series", label: "Series" },
];

export function Shelves() {
  const {
    books,
    setCurrent,
    currentId,
    setBookPriority,
    collections,
    createCollection,
    addToCollection,
    removeFromCollection,
    deleteCollection,
    renameCollection,
    toggleFavorite,
    customShelfNames,
    setCustomShelfName,
    setNextRead,
  } = useLibrary();
  const nextReadId = useLibrary((s) => s.nextReadId);
  const reflections = useLibrary((s) => s.reflections);
  const nav = useNavigate();
  const shelfTheme = useLibrary((s) => s.shelfTheme);
  const userAge = useLibrary((s) => s.age);
  const isPremium = usePremium((s) => s.isPremium);
  const bookcaseMode = useLibrary((s) => s.bookcaseMode);
  const setBookcaseMode = useLibrary((s) => s.setBookcaseMode);
  const bookcaseStyle = useLibrary((s) => s.bookcaseStyle);
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [active, setActive] = useState<TabKey>("reading");
  const [newCollName, setNewCollName] = useState("");
  const [isSeries, setIsSeries] = useState(false);
  const [expandedColl, setExpandedColl] = useState<string | null>(null);
  const [spineMode, setSpineMode] = useState(true);
  const [privateShelves, setPrivateShelves] = useState<Set<string>>(new Set());
  const toggleShelfPrivacy = (key: string) =>
    setPrivateShelves((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  const [editingShelf, setEditingShelf] = useState<TabKey | null>(null);
  const [shelfNameDraft, setShelfNameDraft] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [librarySearch, setLibrarySearch] = useState("");
  type SortKey = "recent" | "az" | "rating" | "pages";
  const [sortKey, setSortKey] = useState<SortKey>("recent");

  const ratingMap = useMemo(() => {
    const m = new Map<string, number>();
    reflections.forEach((r) => m.set(r.bookId, r.rating));
    return m;
  }, [reflections]);

  const filtered = useMemo(() => {
    const list = books.filter((b) => {
      if (b.shelf !== active) return false;
      if (b.ageRating && userAge != null && b.ageRating > userAge) return false;
      return true;
    });
    if (active === "want") {
      return [...list].sort((a, b) => {
        const pa = a.priority ?? Number.MAX_SAFE_INTEGER;
        const pb = b.priority ?? Number.MAX_SAFE_INTEGER;
        if (pa !== pb) return pa - pb;
        return b.addedAt - a.addedAt;
      });
    }
    return list;
  }, [books, active, userAge]);

  // Compute which trope categories are present in the current shelf
  const availableCategories = useMemo(() => {
    const catNames = new Set<string>();
    filtered.forEach((b) => {
      (b.tropes ?? []).forEach((t) => {
        const cat = tropeCategory(t);
        if (cat) catNames.add(cat.name);
      });
    });
    // Return in the canonical order defined by TROPE_CATEGORIES
    return TROPE_CATEGORIES.filter((c) => catNames.has(c.name));
  }, [filtered]);

  const displayFiltered = useMemo(() => {
    if (!categoryFilter) return filtered;
    const cat = TROPE_CATEGORIES.find((c) => c.name === categoryFilter);
    if (!cat) return filtered;
    const catTropes = new Set(cat.tropes);
    return filtered.filter((b) => (b.tropes ?? []).some((t) => catTropes.has(t)));
  }, [filtered, categoryFilter]);

  const searchFiltered = useMemo(() => {
    if (!librarySearch.trim()) return displayFiltered;
    const q = librarySearch.toLowerCase();
    return displayFiltered.filter(
      (b) => b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q)
    );
  }, [displayFiltered, librarySearch]);

  const sortedDisplayFiltered = useMemo(() => {
    if (active === "want") return searchFiltered;
    const arr = [...searchFiltered];
    switch (sortKey) {
      case "az": return arr.sort((a, b) => a.title.localeCompare(b.title));
      case "rating": return arr.sort((a, b) => (ratingMap.get(b.id) ?? 0) - (ratingMap.get(a.id) ?? 0));
      case "pages": return arr.sort((a, b) => (b.pages ?? 0) - (a.pages ?? 0));
      default: return arr.sort((a, b) => b.addedAt - a.addedAt);
    }
  }, [displayFiltered, sortKey, ratingMap, active]);

  const reorder = (bookId: string, delta: -1 | 1) => {
    const list = filtered;
    const idx = list.findIndex((b) => b.id === bookId);
    const swapIdx = idx + delta;
    if (idx < 0 || swapIdx < 0 || swapIdx >= list.length) return;
    const next = [...list];
    const [moved] = next.splice(idx, 1);
    next.splice(swapIdx, 0, moved);
    next.forEach((b, i) => setBookPriority(b.id, i));
  };
  const FREE_TEXTURES: string[] = ["linen"];
  const themed = (isPremium || FREE_TEXTURES.includes(shelfTheme.texture)) && shelfTheme.texture !== "none";
  const themeStyle = themed
    ? {
        background: shelfTheme.background,
        boxShadow: `inset 0 0 0 1px ${shelfTheme.accent}33`,
      }
    : undefined;
  const dark =
    themed &&
    (shelfTheme.background.startsWith("hsl(2") || shelfTheme.background.startsWith("hsl(28"));

  return (
    <section
      className={cn("space-y-5", themed && "rounded-3xl p-5 border border-border/40")}
      style={themeStyle}
    >
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <h3 className="font-display text-2xl" style={dark ? { color: "white" } : undefined}>
            Your library
          </h3>
          {/* View toggle */}
          <div className="flex gap-0.5 rounded-full border border-border/60 bg-card/80 backdrop-blur p-0.5">
            <button
              onClick={() => { setSpineMode(true); setBookcaseMode(false); setShowCustomizer(false); }}
              title="Spine view"
              className={cn(
                "flex items-center gap-1 rounded-full px-2.5 py-1 text-xs transition",
                spineMode && !bookcaseMode
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <BookMarked className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => { setSpineMode(false); setBookcaseMode(false); setShowCustomizer(false); }}
              title="Grid view"
              className={cn(
                "flex items-center gap-1 rounded-full px-2.5 py-1 text-xs transition",
                !spineMode && !bookcaseMode
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => {
                if (!isPremium) {
                  toast("Immersive bookshelf is a premium feature", {
                    description: "Upgrade to unlock the cozy bookshelf experience.",
                    action: { label: "Upgrade", onClick: () => nav("/premium") },
                  });
                  return;
                }
                setSpineMode(false);
                setBookcaseMode(true);
              }}
              title={isPremium ? "Immersive bookshelf" : "Premium — immersive bookshelf"}
              className={cn(
                "flex items-center gap-1 rounded-full px-2.5 py-1 text-xs transition",
                bookcaseMode
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Sliders className="h-3.5 w-3.5" />
              {!isPremium && <Lock className="h-2.5 w-2.5 opacity-60" />}
            </button>
          </div>
          {/* Customize button — bookshelf mode only */}
          {bookcaseMode && isPremium && (
            <button
              onClick={() => setShowCustomizer((v) => !v)}
              title="Customize shelf"
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition",
                showCustomizer
                  ? "border-foreground bg-foreground text-background"
                  : "border-border/60 bg-card/80 text-muted-foreground hover:text-foreground"
              )}
            >
              <Sliders className="h-3 w-3" />
              Customize
            </button>
          )}
        </div>
        {/* Tab bar — hidden in spine mode */}
        <div className={cn("flex gap-1 rounded-full border border-border/60 bg-card/80 backdrop-blur p-1", spineMode && "hidden")}>
          {TABS.map((t) => {
            const label = (t.key !== "series" ? customShelfNames[t.key as Shelf] : undefined) || t.label;
            const isEditing = isPremium && editingShelf === t.key;
            return isEditing ? (
              <form
                key={t.key}
                onSubmit={(e) => {
                  e.preventDefault();
                  setCustomShelfName(t.key as Shelf, shelfNameDraft);
                  setEditingShelf(null);
                  toast.success("Shelf renamed.");
                }}
                className="flex items-center gap-1 px-2"
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  autoFocus
                  value={shelfNameDraft}
                  onChange={(e) => setShelfNameDraft(e.target.value)}
                  className="w-24 rounded-md border border-border bg-background/80 px-2 py-0.5 text-sm focus:outline-none"
                  placeholder={t.label}
                />
                <button type="submit" className="p-1 hover:text-foreground text-muted-foreground"><Check className="h-3.5 w-3.5" /></button>
                <button type="button" onClick={() => setEditingShelf(null)} className="p-1 hover:text-foreground text-muted-foreground"><X className="h-3.5 w-3.5" /></button>
              </form>
            ) : (
              <button
                key={t.key}
                onClick={() => { setActive(t.key); setCategoryFilter(null); }}
                onDoubleClick={() => {
                  if (!isPremium || t.key === "series") return;
                  setEditingShelf(t.key as Shelf);
                  setShelfNameDraft(customShelfNames[t.key as Shelf] || "");
                }}
                className={cn(
                  "group/tab flex items-center gap-1 rounded-full px-2.5 py-1 text-xs transition",
                  active === t.key
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground"
                )}
                title={isPremium ? "Double-click to rename" : label}
              >
                {label}
                {isPremium && active === t.key && (
                  <Pencil
                    className="h-2.5 w-2.5 opacity-0 group-hover/tab:opacity-50 transition ml-0.5 cursor-pointer"
                    onClick={(e) => { e.stopPropagation(); if (t.key === "series") return; setEditingShelf(t.key as Shelf); setShelfNameDraft(customShelfNames[t.key as Shelf] || ""); }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Library search — hidden on series tab and in spine mode */}
      {!spineMode && active !== "series" && <div className="relative -mt-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <input
          value={librarySearch}
          onChange={(e) => setLibrarySearch(e.target.value)}
          placeholder="Search by title or author…"
          className="w-full rounded-xl border border-border/60 bg-card/60 pl-9 pr-9 py-2 text-sm outline-none focus:border-foreground/40 transition"
        />
        {librarySearch && (
          <button
            onClick={() => setLibrarySearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>}

      {/* Category-level trope filter — hidden on series tab and in spine mode */}
      {!spineMode && active !== "series" && availableCategories.length > 0 && (
        <div className="flex flex-wrap gap-1.5 -mt-1">
          <button
            onClick={() => setCategoryFilter(null)}
            className={cn(
              "rounded-full border px-2.5 py-1 text-[11px] transition",
              !categoryFilter
                ? "bg-foreground text-background border-foreground"
                : "border-border/60 text-muted-foreground hover:text-foreground hover:bg-foreground/5"
            )}
          >
            All
          </button>
          {availableCategories.map((cat) => (
            <button
              key={cat.name}
              onClick={() => setCategoryFilter(categoryFilter === cat.name ? null : cat.name)}
              className={cn(
                "rounded-full border px-2.5 py-1 text-[11px] transition flex items-center gap-1",
                categoryFilter === cat.name
                  ? "bg-foreground text-background border-foreground"
                  : "border-border/60 text-muted-foreground hover:text-foreground hover:bg-foreground/5"
              )}
            >
              <span>{cat.emoji}</span>
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Sort controls — hidden on series tab and in spine mode */}
      {!spineMode && active !== "want" && active !== "series" && sortedDisplayFiltered.length > 1 && (
        <div className="flex items-center gap-1.5 flex-wrap -mt-1">
          <ArrowUpDown className="h-3 w-3 text-muted-foreground shrink-0" />
          {(["recent", "az", "pages", ...(active === "finished" ? ["rating"] : [])] as SortKey[]).map((k) => {
            const label: Record<string, string> = { recent: "Recent", az: "A→Z", rating: "Rating", pages: "Pages" };
            return (
              <button
                key={k}
                onClick={() => setSortKey(k)}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-[11px] transition",
                  sortKey === k
                    ? "bg-foreground text-background border-foreground"
                    : "border-border/60 text-muted-foreground hover:text-foreground hover:bg-foreground/5"
                )}
              >
                {label[k]}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Spine view — all shelves as horizontal scrollable rows ─────────── */}
      {spineMode && !bookcaseMode && (
        <div className="space-y-6">
          {TABS.filter((t) => t.key !== "series").map((t) => {
            const shelfKey = t.key as Shelf;
            const label = customShelfNames[shelfKey] || t.label;
            const isPrivate = privateShelves.has(shelfKey);
            const isEditing = editingShelf === t.key;
            const shelfBooks = books
              .filter((b) => {
                if (b.shelf !== shelfKey) return false;
                if (b.ageRating && userAge != null && b.ageRating > userAge) return false;
                return true;
              })
              .sort((a, b) => b.addedAt - a.addedAt);

            return (
              <div key={shelfKey}>
                {/* Row header */}
                <div className="flex items-center justify-between mb-2 px-0.5">
                  <div className="flex items-center gap-2">
                    {isEditing ? (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          setCustomShelfName(shelfKey, shelfNameDraft);
                          setEditingShelf(null);
                          toast.success("Shelf renamed.");
                        }}
                        className="flex items-center gap-1.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          autoFocus
                          value={shelfNameDraft}
                          onChange={(e) => setShelfNameDraft(e.target.value)}
                          className="w-32 rounded-lg border border-border bg-background/80 px-2 py-0.5 text-sm font-display focus:outline-none"
                          placeholder={t.label}
                        />
                        <button type="submit" className="p-1 text-muted-foreground hover:text-foreground"><Check className="h-3.5 w-3.5" /></button>
                        <button type="button" onClick={() => setEditingShelf(null)} className="p-1 text-muted-foreground hover:text-foreground"><X className="h-3.5 w-3.5" /></button>
                      </form>
                    ) : (
                      <button
                        onClick={() => {
                          if (!isPremium) return;
                          setEditingShelf(shelfKey);
                          setShelfNameDraft(customShelfNames[shelfKey] || "");
                        }}
                        className="flex items-center gap-1.5 group/name"
                        title={isPremium ? "Click to rename shelf" : label}
                      >
                        <span className="font-display text-base font-semibold" style={dark ? { color: "white" } : undefined}>
                          {label}
                        </span>
                        {isPremium && (
                          <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover/name:opacity-60 transition" />
                        )}
                      </button>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {shelfBooks.length} {shelfBooks.length === 1 ? "book" : "books"}
                    </span>
                  </div>
                  {/* Privacy toggle */}
                  <button
                    onClick={() => toggleShelfPrivacy(shelfKey)}
                    className={cn(
                      "flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium transition",
                      isPrivate
                        ? "border-border/60 bg-card/60 text-muted-foreground"
                        : "border-blue-200 bg-blue-50/60 text-blue-500 dark:border-blue-800 dark:bg-blue-950/40"
                    )}
                    title={isPrivate ? "Private shelf — click to make public" : "Public shelf — click to make private"}
                  >
                    {isPrivate ? <EyeOff className="h-3 w-3" /> : <Globe className="h-3 w-3" />}
                    <span>{isPrivate ? "Private" : "Public"}</span>
                  </button>
                </div>

                {/* Horizontal spine scroll */}
                {shelfBooks.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border/50 py-6 text-center text-xs text-muted-foreground">
                    No books here yet
                  </div>
                ) : (
                  <div className="relative">
                    <div
                      className="flex gap-[3px] overflow-x-auto pb-2"
                      style={{ scrollbarWidth: "none" }}
                    >
                      {shelfBooks.map((b) => (
                        <button
                          key={b.id}
                          onClick={() => { setCurrent(b.id); nav(`/book/${b.id}`); }}
                          className="group/spine shrink-0 relative focus:outline-none"
                          title={`${b.title} · ${b.author}`}
                        >
                          {/* Spine card */}
                          <div
                            className="relative overflow-hidden transition-transform group-hover/spine:-translate-y-1"
                            style={{
                              width: 28,
                              height: 116,
                              borderRadius: "2px 4px 4px 2px",
                              boxShadow: "inset -2px 0 4px rgba(0,0,0,0.2), 2px 0 5px rgba(0,0,0,0.12), inset 1px 0 3px rgba(255,255,255,0.06)",
                            }}
                          >
                            {b.cover ? (
                              <img
                                src={b.cover}
                                alt={b.title}
                                className="absolute inset-0 w-full h-full object-cover"
                              />
                            ) : (
                              <div
                                className="absolute inset-0"
                                style={{
                                  background: `hsl(${(b.title.charCodeAt(0) * 37 + b.title.charCodeAt(1 % b.title.length) * 13) % 360} 45% 45%)`,
                                }}
                              />
                            )}
                            {/* Title overlay as vertical text */}
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                              <span
                                className="text-white font-semibold leading-none"
                                style={{
                                  writingMode: "vertical-rl",
                                  textOrientation: "mixed",
                                  transform: "rotate(180deg)",
                                  fontSize: 7,
                                  letterSpacing: "0.03em",
                                  textShadow: "0 1px 3px rgba(0,0,0,0.6)",
                                  maxHeight: 108,
                                  overflow: "hidden",
                                  whiteSpace: "nowrap",
                                  textOverflow: "ellipsis",
                                  padding: "4px 0",
                                }}
                              >
                                {b.title}
                              </span>
                            </div>
                            {/* Left edge highlight */}
                            <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-white/10 rounded-l-sm" />
                          </div>
                        </button>
                      ))}
                    </div>
                    {/* Wooden shelf plank */}
                    <div
                      className="h-[5px] rounded-b-sm"
                      style={{
                        background: "linear-gradient(180deg, hsl(28 48% 58%) 0%, hsl(25 42% 50%) 100%)",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.14)",
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Bookshelf view — premium immersive mode */}
      {bookcaseMode && active !== "series" && (
        <BookshelfView books={sortedDisplayFiltered} style={bookcaseStyle} />
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={active}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3 }}
          className={
            (bookcaseMode || spineMode) && active !== "series"
              ? "hidden"
              : active === "series"
              ? "space-y-3"
              : "grid gap-2 grid-cols-5 sm:grid-cols-7 lg:grid-cols-9"
          }
        >
          {/* Series browser */}
          {active === "series" && (() => {
            const seriesColls = collections.filter((c) => c.isSeries);
            if (seriesColls.length === 0) {
              return (
                <div className="rounded-2xl border border-dashed border-border/60 p-10 text-center space-y-2">
                  <p className="text-muted-foreground text-sm">No series yet.</p>
                  <p className="text-xs text-muted-foreground/60">
                    Create a series in the Collections panel below, or mark a collection as a series when adding it.
                  </p>
                </div>
              );
            }
            return seriesColls.map((c) => {
              const items = c.bookIds.map((id) => books.find((b) => b.id === id)).filter(Boolean) as typeof books;
              const isOpen = expandedColl === c.id;
              return (
                <div key={c.id} className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur overflow-hidden">
                  <button
                    onClick={() => setExpandedColl(isOpen ? null : c.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-foreground/[0.02] transition"
                  >
                    {/* Stacked mini covers */}
                    <div className="flex -space-x-2 shrink-0">
                      {items.slice(0, 4).map((b, i) => (
                        <div key={b.id} className="w-8 h-12 rounded-md overflow-hidden border border-background shadow-sm" style={{ zIndex: 4 - i }}>
                          <BookCover src={b.cover} title={b.title} />
                        </div>
                      ))}
                      {items.length > 4 && (
                        <div className="w-8 h-12 rounded-md border border-background bg-muted flex items-center justify-center text-[9px] text-muted-foreground font-medium shadow-sm">
                          +{items.length - 4}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="font-display text-base leading-tight truncate">{c.name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {items.length} {items.length === 1 ? "book" : "books"}
                        {items.length > 0 && ` · ${items.filter(b => b.shelf === "finished").length} finished`}
                      </div>
                    </div>
                    {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 grid grid-cols-3 sm:grid-cols-5 gap-3 border-t border-border/30 pt-3">
                      {items.map((b) => (
                        <button
                          key={b.id}
                          onClick={() => { setCurrent(b.id); nav("/"); }}
                          className="group flex flex-col gap-1 text-left"
                        >
                          <div className="transition-transform group-hover:scale-105">
                            <BookCover src={b.cover} title={b.title} />
                          </div>
                          <div className="text-[10px] leading-tight truncate text-muted-foreground">{b.title}</div>
                          {b.shelf === "finished" && (
                            <div className="text-[9px] text-muted-foreground/60">✓ finished</div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            });
          })()}

          {/* Regular shelf grid */}
          {active !== "series" && sortedDisplayFiltered.length === 0 && (
            <div className="col-span-full rounded-2xl border border-dashed border-border/60 p-10 text-center text-muted-foreground">
              {categoryFilter
                ? `No ${categoryFilter} books on this shelf yet.`
                : "Nothing here yet. Add a book to this shelf."}
            </div>
          )}
          {active !== "series" && sortedDisplayFiltered.map((b) => {
            const firstTrope = (b.tropes ?? [])[0];
            const cat = firstTrope ? tropeCategory(firstTrope) : undefined;
            return (
              <div key={b.id} className="relative group">
                <button
                  onClick={() => {
                    setCurrent(b.id);
                    nav(`/book/${b.id}`);
                  }}
                  className={cn(
                    "w-full text-left space-y-1 rounded-lg p-1 transition",
                    currentId === b.id ? "bg-white/60 ring-1 ring-border" : "hover:bg-white/40"
                  )}
                >
                  <div className="transition-transform">
                    <BookCover src={b.cover} title={b.title} />
                  </div>
                  <div className="space-y-0.5">
                    <div className="font-display text-[10px] leading-tight line-clamp-2 flex items-center gap-0.5">
                      {b.consumption === "listened" ? (
                        <Headphones className="h-2.5 w-2.5 shrink-0 text-muted-foreground" />
                      ) : b.consumption === "read" ? (
                        <BookOpen className="h-2.5 w-2.5 shrink-0 text-muted-foreground" />
                      ) : null}
                      <span className="truncate">{b.title}</span>
                    </div>
                    <div className="text-[9px] text-muted-foreground truncate">{b.author}</div>
                    {/* Trope category badge */}
                    {cat && (
                      <div className="flex items-center gap-0.5 text-[9px] bg-foreground/5 border border-border/40 rounded-full px-1.5 py-0.5 w-fit max-w-full leading-tight font-medium">
                        <span>{cat.emoji}</span>
                        <span className="truncate">{cat.name}</span>
                      </div>
                    )}
                    {b.mood && (
                      <div className="flex items-center gap-0.5 text-[9px] text-muted-foreground/70 leading-tight">
                        <span>{MOODS[b.mood].emoji}</span>
                        <span>{MOODS[b.mood].label}</span>
                      </div>
                    )}
                    {active === "want" && b.id === nextReadId && (
                      <div className="flex items-center gap-0.5 text-[9px] font-medium" style={{ color: "var(--mood-strong)" }}>
                        <Bookmark className="h-2.5 w-2.5 fill-current" />
                        next
                      </div>
                    )}
                    {active === "want" && Math.floor((Date.now() - b.addedAt) / 86400000) >= 7 && (
                      <div className="text-[9px] tabular-nums text-muted-foreground/50">
                        {Math.floor((Date.now() - b.addedAt) / 86400000)}d on shelf
                      </div>
                    )}
                    {active === "finished" && ratingMap.has(b.id) && (
                      <div className="flex items-center gap-0.5 pt-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={cn(
                              "h-2.5 w-2.5",
                              i < (ratingMap.get(b.id) ?? 0)
                                ? "fill-amber-400 text-amber-400"
                                : "fill-none text-muted-foreground/25"
                            )}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </button>
                <button
                  aria-label={b.favorite ? "Unfavorite" : "Favorite"}
                  onClick={(e) => { e.stopPropagation(); toggleFavorite(b.id); toast.success(b.favorite ? "Removed from Favorites" : "Added to Favorites ♥"); }}
                  className={cn(
                    "absolute top-2 left-2 rounded-full bg-background/90 border border-border/60 p-1 transition",
                    b.favorite ? "opacity-100" : "opacity-0 group-hover:opacity-100 hover:opacity-100"
                  )}
                  title={b.favorite ? "Unfavorite" : "Favorite"}
                >
                  <Heart className={cn("h-3.5 w-3.5", b.favorite ? "fill-red-500 text-red-500" : "text-muted-foreground")} />
                </button>
                {active === "finished" && isPremium && (
                  <ShareCardModal book={b} />
                )}
                {active === "want" && (
                  <TbrMoodIntentBadge book={b} />
                )}
                {active === "want" && (
                  <div className="absolute top-2 right-2 flex flex-col gap-1">
                    <button
                      aria-label={b.id === nextReadId ? "Unpin next read" : "Pin as reading next"}
                      title={b.id === nextReadId ? "Unpin" : "Read next"}
                      onClick={(e) => { e.stopPropagation(); setNextRead(b.id === nextReadId ? null : b.id); }}
                      className={cn(
                        "rounded-full bg-background/90 border border-border/60 p-1 transition",
                        b.id === nextReadId ? "opacity-100" : "opacity-0 group-hover:opacity-100 hover:opacity-100"
                      )}
                    >
                      <Bookmark
                        className="h-3.5 w-3.5"
                        style={b.id === nextReadId ? { fill: "var(--mood-strong)", color: "var(--mood-strong)" } : undefined}
                      />
                    </button>
                    <button
                      aria-label="Move up"
                      onClick={(e) => { e.stopPropagation(); reorder(b.id, -1); }}
                      className="rounded-full bg-background/90 border border-border/60 p-1 hover:bg-background"
                    >
                      <ChevronUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      aria-label="Move down"
                      onClick={(e) => { e.stopPropagation(); reorder(b.id, 1); }}
                      className="rounded-full bg-background/90 border border-border/60 p-1 hover:bg-background"
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </motion.div>
      </AnimatePresence>

      {/* Bookshelf customizer panel */}
      <AnimatePresence>
        {bookcaseMode && showCustomizer && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <BookshelfCustomizer />
          </motion.div>
        )}
      </AnimatePresence>

      {active === "want" && <TbrIntentStrip />}

      {/* Collections / Series */}
      <LockedFeature title="Collections" description="Group books into collections and series — perfect for themes, series, or moods you revisit. Upgrade to organize your library.">
      <div className="space-y-3 rounded-2xl border border-border/50 bg-card/60 backdrop-blur p-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Library className="h-4 w-4 text-muted-foreground" />
            <h4 className="font-display text-lg" style={dark ? { color: "white" } : undefined}>
              Collections {collections.length > 0 && (
                <span className="text-xs text-muted-foreground font-sans">({collections.length})</span>
              )}
            </h4>
          </div>
          <div className="flex items-center gap-2">
            <Input
              value={newCollName}
              onChange={(e) => setNewCollName(e.target.value)}
              placeholder="New collection or series…"
              className="h-8 w-56"
            />
            <label className="flex items-center gap-1 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={isSeries}
                onChange={(e) => setIsSeries(e.target.checked)}
                className="h-3 w-3"
              />
              Series
            </label>
            <Button
              size="sm"
              variant="outline"
              className="rounded-full h-8 gap-1.5"
              onClick={() => {
                if (!newCollName.trim()) return;
                createCollection(newCollName, isSeries);
                setNewCollName("");
                setIsSeries(false);
                toast.success("Collection created.");
              }}
            >
              <FolderPlus className="h-3.5 w-3.5" /> Add
            </Button>
          </div>
        </div>
        {collections.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Group books into collections — perfect for series, themes, or moods you revisit.
          </p>
        ) : (
          <div className="space-y-2">
            {collections.map((c) => {
              const items = c.bookIds
                .map((id) => books.find((b) => b.id === id))
                .filter(Boolean) as typeof books;
              const open = expandedColl === c.id;
              return (
                <div key={c.id} className="rounded-xl border border-border/40 bg-background/40">
                  <button
                    onClick={() => setExpandedColl(open ? null : c.id)}
                    className="w-full flex items-center justify-between gap-2 px-3 py-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm font-medium truncate">{c.name}</span>
                      {c.isSeries && (
                        <span className="text-[10px] uppercase tracking-widest rounded-full border border-border/60 px-1.5 py-0.5">
                          Series
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">{items.length}</span>
                    </div>
                    {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  </button>
                  {open && (
                    <div className="px-3 pb-3 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="outline" className="h-7 rounded-full gap-1 text-xs">
                              <Plus className="h-3 w-3" /> Add book
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="max-h-72 overflow-auto">
                            <DropdownMenuLabel>Library</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {books
                              .filter((b) => !c.bookIds.includes(b.id))
                              .map((b) => (
                                <DropdownMenuItem
                                  key={b.id}
                                  onClick={() => addToCollection(c.id, b.id)}
                                >
                                  {b.title} <span className="text-muted-foreground ml-1">· {b.author}</span>
                                </DropdownMenuItem>
                              ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 rounded-full text-xs"
                          onClick={() => {
                            const next = prompt("Rename collection", c.name);
                            if (next) renameCollection(c.id, next);
                          }}
                        >
                          Rename
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 rounded-full text-xs text-destructive"
                          onClick={() => {
                            if (confirm(`Delete collection "${c.name}"?`)) deleteCollection(c.id);
                          }}
                        >
                          Delete
                        </Button>
                      </div>
                      {items.length === 0 ? (
                        <p className="text-xs text-muted-foreground">No books here yet.</p>
                      ) : (
                        <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-3">
                          {items.map((b) => (
                            <div key={b.id} className="relative group">
                              <button
                                onClick={() => { setCurrent(b.id); nav(`/book/${b.id}`); }}
                                className="block w-full"
                                title={b.title}
                              >
                                <BookCover src={b.cover} title={b.title} />
                              </button>
                              <button
                                aria-label="Remove from collection"
                                onClick={() => removeFromCollection(c.id, b.id)}
                                className="absolute -top-1.5 -right-1.5 rounded-full bg-background border border-border p-0.5 opacity-0 group-hover:opacity-100 transition"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      </LockedFeature>

    </section>
  );
}
