import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Shelf, useLibrary } from "@/lib/store";
import { BookCover } from "./BookCover";
import { MoodChip } from "./MoodChip";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { usePremium } from "@/lib/usePremium";
import { ChevronUp, ChevronDown, Headphones, BookOpen, FolderPlus, Library, X, Plus, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

type TabKey = Shelf;
const TABS: { key: TabKey; label: string }[] = [
  { key: "reading", label: "Reading" },
  { key: "want", label: "Want to read" },
  { key: "paused", label: "Paused" },
  { key: "finished", label: "Finished" },
  { key: "dnf", label: "DNF" },
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
  } = useLibrary();
  const nav = useNavigate();
  const shelfTheme = useLibrary((s) => s.shelfTheme);
  const isPremium = usePremium((s) => s.isPremium);
  const [active, setActive] = useState<TabKey>("reading");
  const [newCollName, setNewCollName] = useState("");
  const [isSeries, setIsSeries] = useState(false);
  const [expandedColl, setExpandedColl] = useState<string | null>(null);
  const filtered = useMemo(() => {
    const list = books.filter((b) => b.shelf === active);
    if (active === "want") {
      return [...list].sort((a, b) => {
        const pa = a.priority ?? Number.MAX_SAFE_INTEGER;
        const pb = b.priority ?? Number.MAX_SAFE_INTEGER;
        if (pa !== pb) return pa - pb;
        return b.addedAt - a.addedAt;
      });
    }
    return list;
  }, [books, active]);

  const reorder = (bookId: string, delta: -1 | 1) => {
    const list = filtered;
    const idx = list.findIndex((b) => b.id === bookId);
    const swapIdx = idx + delta;
    if (idx < 0 || swapIdx < 0 || swapIdx >= list.length) return;
    // Re-number priorities so they're stable
    const next = [...list];
    const [moved] = next.splice(idx, 1);
    next.splice(swapIdx, 0, moved);
    next.forEach((b, i) => setBookPriority(b.id, i));
  };
  const themed = isPremium && shelfTheme.texture !== "none";
  const themeStyle = themed
    ? {
        background: shelfTheme.background,
        // soft accent border
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
      {/* Collections / Series */}
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

      <div className="flex items-end justify-between gap-4 flex-wrap">
        <h3 className="font-display text-2xl" style={dark ? { color: "white" } : undefined}>
          Your library
        </h3>
        <div className="flex gap-1 rounded-full border border-border/60 bg-card/80 backdrop-blur p-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setActive(t.key)}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm transition",
                active === t.key
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={active}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3 }}
          className="grid gap-3 grid-cols-3 sm:grid-cols-5 lg:grid-cols-7"
        >
          {filtered.length === 0 && (
            <div className="col-span-full rounded-2xl border border-dashed border-border/60 p-10 text-center text-muted-foreground">
              Nothing here yet. Add a book to this shelf.
            </div>
          )}
          {filtered.map((b) => (
            <div key={b.id} className="relative group">
              <button
                onClick={() => {
                  setCurrent(b.id);
                  nav(`/book/${b.id}`);
                }}
                className={cn(
                  "w-full text-left space-y-1.5 rounded-xl p-1.5 transition",
                  currentId === b.id ? "bg-white/60 ring-1 ring-border" : "hover:bg-white/40"
                )}
              >
                <div className="transition-transform">
                  <BookCover src={b.cover} title={b.title} />
                </div>
                <div className="space-y-0.5">
                  <div className="font-display text-xs leading-tight line-clamp-2 flex items-center gap-1">
                    {b.consumption === "listened" ? (
                      <Headphones className="h-3 w-3 text-muted-foreground" />
                    ) : b.consumption === "read" ? (
                      <BookOpen className="h-3 w-3 text-muted-foreground" />
                    ) : null}
                    <span className="truncate">{b.title}</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground truncate">{b.author}</div>
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
              {active === "want" && (
                <div className="absolute top-2 right-2 flex flex-col gap-1">
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
          ))}
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
