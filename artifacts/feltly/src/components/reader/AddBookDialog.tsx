import { useRef, useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { MOODS, MoodKey } from "@/lib/moods";
import { AgeRating, Shelf, useLibrary } from "@/lib/store";
import { Plus, Camera, ScanLine, Sparkles, Loader2, AlertTriangle, Wand2, Search, AlertCircle, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { ImportLibraryDialog } from "./ImportLibraryDialog";
import { LockedFeature } from "@/components/premium/LockedFeature";
import { usePremium } from "@/lib/usePremium";
import { BarcodeScannerDialog } from "./BarcodeScannerDialog";
import { TropePicker } from "./TropePicker";
import { suggestTropes } from "@/lib/tropes";

type OLDoc = {
  title?: string;
  author_name?: string[];
  number_of_pages_median?: number;
  cover_i?: number;
  isbn?: string[];
  series?: string[];
};

async function searchOpenLibrary(query: string): Promise<OLDoc[]> {
  const q = encodeURIComponent(query.trim());
  const res = await fetch(
    `https://openlibrary.org/search.json?title=${q}&limit=6&fields=title,author_name,number_of_pages_median,cover_i,isbn,series`
  );
  if (!res.ok) return [];
  const data = await res.json() as { docs?: OLDoc[] };
  return data.docs ?? [];
}

type Format = "paperback" | "hardcover" | "ebook" | "audiobook";

export function AddBookDialog({ defaultShelf = "want" }: { defaultShelf?: Shelf }) {
  const add = useLibrary((s) => s.addBook);
  const books = useLibrary((s) => s.books);
  const autoAssignSeries = useLibrary((s) => s.autoAssignSeries);
  const isPremium = usePremium((s) => s.isPremium);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [translator, setTranslator] = useState("");
  const [narrator, setNarrator] = useState("");
  const [pages, setPages] = useState(300);
  const [basePages, setBasePages] = useState(300);
  const [format, setFormat] = useState<Format>("paperback");
  const [audioMinutes, setAudioMinutes] = useState(600); // 10h default
  const [mood, setMood] = useState<MoodKey>("calm");
  const [shelf, setShelf] = useState<Shelf>(defaultShelf);
  const [tagsRaw, setTagsRaw] = useState("");
  const [tropes, setTropes] = useState<string[]>([]);
  const [autoSuggested, setAutoSuggested] = useState(false);
  const [cover, setCover] = useState<string | undefined>();
  const [isbn, setIsbn] = useState("");
  const [seriesName, setSeriesName] = useState<string | undefined>();
  const [scanning, setScanning] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [autoMood, setAutoMood] = useState(false);
  const [pagesFromLookup, setPagesFromLookup] = useState(false);
  const [ageRating, setAgeRating] = useState<AgeRating | undefined>();
  const [isReread, setIsReread] = useState(false);
  const [searchResults, setSearchResults] = useState<OLDoc[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (title.trim().length < 2) { setSearchResults([]); setShowResults(false); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const docs = await searchOpenLibrary(title);
        setSearchResults(docs);
        setShowResults(docs.length > 0);
      } catch { setSearchResults([]); }
      finally { setSearching(false); }
    }, 400);
    return () => clearTimeout(t);
  }, [title]);

  // Auto-suggest tropes from title when user stops typing (only if none set yet).
  useEffect(() => {
    if (title.trim().length < 3 || tropes.length > 0) return;
    const t = setTimeout(() => {
      const tags = tagsRaw.split(",").map((s) => s.trim()).filter(Boolean);
      const suggestions = suggestTropes(title, tags);
      if (suggestions.length > 0) {
        setTropes(suggestions);
        setAutoSuggested(true);
      }
    }, 700);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, tagsRaw]);

  const selectResult = (doc: OLDoc) => {
    const pickedTitle = doc.title ?? title;
    setTitle(pickedTitle);
    setAuthor(doc.author_name?.[0] ?? "");
    const p = doc.number_of_pages_median;
    if (p) { setPages(p); setBasePages(p); setPagesFromLookup(true); }
    if (doc.cover_i) setCover(`https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`);
    if (doc.isbn?.[0]) setIsbn(doc.isbn[0]);
    setSeriesName(doc.series?.[0]?.trim() || undefined);
    setShowResults(false);
    if (doc.title) detectMood(doc.title, doc.author_name?.[0] ?? "");
    // Auto-suggest tropes from the picked title (always overwrite since this is an explicit pick).
    const suggestions = suggestTropes(pickedTitle, []);
    if (suggestions.length > 0) {
      setTropes(suggestions);
      setAutoSuggested(true);
    }
  };

  const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");
  const duplicate = title.trim()
    ? books.find(
        (b) =>
          norm(b.title) === norm(title) &&
          (author.trim() ? norm(b.author) === norm(author) : true)
      )
    : null;

  const fillFromLookup = async (body: { isbn?: string; image?: string }) => {
    setScanning(true);
    try {
      const res = await fetch("/api/book-lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Book lookup failed");
      const data = await res.json();
      const b = data?.book;
      if (!b) throw new Error("No book found");
      setTitle(b.title ?? "");
      setAuthor(b.author ?? "");
      if (b.pages) { setPages(b.pages); setBasePages(b.pages); setPagesFromLookup(true); }
      if (b.cover) setCover(b.cover);
      if (b.isbn) setIsbn(b.isbn);
      toast.success(`Found: ${b.title}`);
      // Auto-detect mood from the matched metadata.
      if (b.title) detectMood(b.title, b.author ?? "");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Couldn't identify the book.");
    } finally {
      setScanning(false);
    }
  };

  const [moodError, setMoodError] = useState<string | null>(null);
  const detectMood = async (titleArg?: string, authorArg?: string) => {
    const t = (titleArg ?? title).trim();
    const a = (authorArg ?? author).trim();
    if (!t) return;
    setAutoMood(true);
    setMoodError(null);
    try {
      const res = await fetch("/api/mood-tag-books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ books: [{ key: "", title: t, author: a || "Unknown" }], targetMood: "calm" }),
      });
      if (!res.ok) throw new Error(`Mood detection failed (${res.status})`);
      const data = await res.json() as { tags?: { mood: string }[] };
      const tag = data?.tags?.[0];
      if (tag?.mood && tag.mood in MOODS) {
        setMood(tag.mood as MoodKey);
        toast.success(`Mood detected: ${MOODS[tag.mood as MoodKey].label}`);
      } else {
        setMoodError("Couldn't detect a mood for this book — pick one below.");
      }
    } catch (e: unknown) {
      setMoodError(e instanceof Error ? e.message : "Couldn't reach mood detection.");
    } finally {
      setAutoMood(false);
    }
  };

  const onFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      fillFromLookup({ image: dataUrl });
    };
    reader.readAsDataURL(file);
  };

  const submit = () => {
    if (!title.trim()) return;
    if (duplicate) {
      toast.error(`"${duplicate.title}" is already on your ${duplicate.shelf} shelf.`);
      return;
    }
    const tags = tagsRaw
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean)
      .slice(0, 8);
    const newId = add({
      title,
      author: author || "Unknown",
      ...(translator.trim() ? { translator: translator.trim() } : {}),
      ...(format === "audiobook" && narrator.trim() ? { narrator: narrator.trim() } : {}),
      pages: format === "audiobook" ? Math.max(1, Math.round(audioMinutes / 2)) : pages, // ~2 min/page proxy
      mood,
      shelf,
      tags,
      tropes,
      cover,
      format,
      ageRating,
      ...(format === "audiobook" ? { audioMinutes, audioMinutesListened: 0 } : {}),
      ...(seriesName ? { series: seriesName } : {}),
      ...(isReread ? { rereadCount: 1 } : {}),
    });
    // Auto-create or extend a "series" collection when the title hints at one.
    const series = autoAssignSeries(newId);
    if (series) {
      toast.success(`Added to series: ${series.seriesName}`);
    } else {
      const shelfLabel =
        shelf === "want" ? "Want to read" :
        shelf === "reading" ? "Reading" :
        shelf === "finished" ? "Finished" :
        shelf === "paused" ? "Paused" : "DNF";
      toast.success(`"${title}" added to ${shelfLabel}.`);
    }
    setOpen(false);
    setTitle(""); setAuthor(""); setTranslator(""); setNarrator(""); setPages(300); setBasePages(300); setFormat("paperback"); setAudioMinutes(600);
    setMood("calm"); setTagsRaw(""); setTropes([]); setAutoSuggested(false); setCover(undefined); setIsbn(""); setAgeRating(undefined); setSeriesName(undefined); setPagesFromLookup(false); setIsReread(false);
  };

  // Adjust the page count when the user toggles format. Hardcover editions
  // typically run shorter (larger trim/leading); paperback/ebook track the base.
  const applyFormat = (f: Format) => {
    setFormat(f);
    if (!basePages) return;
    if (f === "audiobook") return; // pages not used for audiobooks
    const factor = f === "hardcover" ? 0.85 : f === "ebook" ? 1.05 : 1.0;
    setPages(Math.max(1, Math.round(basePages * factor)));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" className="rounded-full gap-2">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Add a book</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Add a new book</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Bulk import */}
          <ImportLibraryDialog />

          {/* Premium scan zone */}
          <LockedFeature description="Scan a physical book — snap the cover or paste an ISBN to autofill.">
          <div className="rounded-2xl border border-border/60 bg-card/60 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-sm font-medium">
                <Sparkles className="h-3.5 w-3.5" style={{ color: "var(--mood-strong)" }} />
                Scan a physical book
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground -mt-1">
              Snap the cover or paste an ISBN — we'll fill the rest.
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-full flex-1"
                disabled={scanning || !isPremium}
                onClick={() => fileRef.current?.click()}
              >
                {scanning ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Camera className="h-3.5 w-3.5 mr-1.5" />}
                Scan cover
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-full flex-1"
                disabled={scanning || !isPremium}
                onClick={() => setScannerOpen(true)}
              >
                <ScanLine className="h-3.5 w-3.5 mr-1.5" />
                Scan barcode
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="environment"
                hidden
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onFile(f);
                  e.target.value = "";
                }}
              />
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="ISBN (10 or 13 digits)"
                value={isbn}
                onChange={(e) => setIsbn(e.target.value)}
                disabled={scanning || !isPremium}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-full"
                disabled={scanning || !isbn.trim() || !isPremium}
                onClick={() => fillFromLookup({ isbn: isbn.trim() })}
              >
                {scanning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ScanLine className="h-3.5 w-3.5" />}
              </Button>
            </div>
            {cover && (
              <div className="flex items-center gap-2">
                <img src={cover} alt="cover preview" className="h-14 w-10 rounded object-cover border border-border/40" />
                <span className="text-xs text-muted-foreground">Cover attached</span>
              </div>
            )}
          </div>
          </LockedFeature>

          <BarcodeScannerDialog
            open={scannerOpen}
            onOpenChange={setScannerOpen}
            onDetected={(code) => {
              setIsbn(code);
              fillFromLookup({ isbn: code });
            }}
          />

          <div className="relative">
            <Label htmlFor="t">Title</Label>
            <div className="relative">
              <Input
                id="t"
                value={title}
                onChange={(e) => { setTitle(e.target.value); setShowResults(true); }}
                onBlur={() => setTimeout(() => setShowResults(false), 150)}
                onFocus={() => { if (searchResults.length > 0) setShowResults(true); }}
                placeholder="The Quiet Tide"
                className="pr-8"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                {searching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5 opacity-40" />}
              </span>
            </div>
            {showResults && searchResults.length > 0 && (
              <ul className="absolute z-50 left-0 right-0 mt-1 rounded-xl border border-border/60 bg-background shadow-lg overflow-hidden max-h-72 overflow-y-auto">
                {searchResults.map((doc, i) => (
                  <li key={i}>
                    <button
                      type="button"
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted/60 transition text-left"
                      onMouseDown={() => selectResult(doc)}
                    >
                      {doc.cover_i ? (
                        <img
                          src={`https://covers.openlibrary.org/b/id/${doc.cover_i}-S.jpg`}
                          alt=""
                          className="h-10 w-7 rounded object-cover flex-shrink-0 border border-border/30"
                        />
                      ) : (
                        <div className="h-10 w-7 rounded bg-muted flex-shrink-0 flex items-center justify-center">
                          <Search className="h-3 w-3 text-muted-foreground" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{doc.title}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {doc.author_name?.[0] ?? "Unknown author"}
                          {doc.number_of_pages_median ? ` \u00b7 ${doc.number_of_pages_median} pages` : ""}
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {duplicate && (
              <p className="text-[11px] text-amber-600 mt-1 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Already in library on &ldquo;{duplicate.shelf}&rdquo; shelf.
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="a">Author</Label>
            <Input id="a" value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Ela Marsh" />
          </div>
          <div>
            <Label htmlFor="tr">Translator <span className="text-muted-foreground text-xs">(optional)</span></Label>
            <Input
              id="tr"
              value={translator}
              onChange={(e) => setTranslator(e.target.value)}
              placeholder="e.g. Jennifer Croft"
            />
          </div>
          {format === "audiobook" && (
            <div>
              <Label htmlFor="nr">Narrator <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Input
                id="nr"
                value={narrator}
                onChange={(e) => setNarrator(e.target.value)}
                placeholder="e.g. Claire Danes"
              />
            </div>
          )}
          <div>
            {format !== "audiobook" ? (
              <>
                <Label htmlFor="p">Pages</Label>
                <Input
                  id="p"
                  type="number"
                  value={pages}
                  onChange={(e) => {
                    const v = parseInt(e.target.value) || 0;
                    setPages(v);
                    setBasePages(v);
                    setPagesFromLookup(false);
                  }}
                />
                {pagesFromLookup && (
                  <p className="text-[11px] mt-1 flex items-center gap-1" style={{ color: "var(--mood-strong)" }}>
                    ⚠ From Open Library — may not match your edition. Correct it if needed.
                  </p>
                )}
              </>
            ) : (
              <>
                <Label htmlFor="am">Total length (minutes)</Label>
                <Input
                  id="am"
                  type="number"
                  value={audioMinutes}
                  onChange={(e) => setAudioMinutes(Math.max(1, parseInt(e.target.value) || 0))}
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  e.g. 600 = 10 hours.
                </p>
              </>
            )}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Label className="text-xs text-muted-foreground">Format</Label>
              <div className="flex gap-1.5">
                {(["paperback", "hardcover", "ebook", "audiobook"] as Format[]).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => applyFormat(f)}
                    className={`rounded-full border px-2.5 py-1 text-[11px] capitalize transition ${
                      format === f
                        ? "bg-foreground text-background border-foreground"
                        : "bg-white/60 border-border hover:bg-white"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
            {format !== "audiobook" && (
              <p className="text-[11px] text-muted-foreground mt-1">
                Page count auto-adjusts for hardcover (typically ~15% fewer pages) and ebook editions.
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="tg">Genres / themes</Label>
            <Input
              id="tg"
              value={tagsRaw}
              onChange={(e) => setTagsRaw(e.target.value)}
              placeholder="literary, grief, ocean"
            />
            <p className="text-[11px] text-muted-foreground mt-1">Comma-separated, up to 8.</p>
          </div>
          <div>
            <Label>Tropes <span className="text-muted-foreground text-xs">(optional)</span></Label>
            <div className="mt-1">
              <TropePicker
                selected={tropes}
                onChange={(next) => { setTropes(next); setAutoSuggested(false); }}
                bookTitle={title}
                bookTags={tagsRaw.split(",").map((t) => t.trim()).filter(Boolean)}
                autoSuggested={autoSuggested}
                onClearAutoSuggested={() => setAutoSuggested(false)}
              />
            </div>
          </div>
          <div>
            <Label>Mood</Label>
            <div className="flex flex-wrap gap-2 pt-1">
              {(Object.keys(MOODS) as MoodKey[]).map((k) => (
                <button
                  key={k}
                  onClick={() => setMood(k)}
                  className={`rounded-full border px-3 py-1.5 text-sm transition ${
                    mood === k ? "bg-foreground text-background border-foreground" : "bg-white/60 border-border hover:bg-white"
                  }`}
                >
                  {MOODS[k].emoji} {MOODS[k].label}
                </button>
              ))}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="mt-2 h-7 rounded-full text-xs gap-1.5"
              onClick={() => detectMood()}
              disabled={autoMood || !title.trim()}
            >
              {autoMood ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3" />}
              Auto-detect mood
            </Button>
            {moodError && (
              <div
                role="alert"
                aria-live="polite"
                className="mt-2 rounded-lg border border-amber-300/60 bg-amber-50/70 px-2.5 py-2 flex items-start gap-2 text-xs"
              >
                <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0 text-amber-600" />
                <p className="flex-1 min-w-0 text-amber-900/90">{moodError}</p>
                <button
                  type="button"
                  onClick={() => detectMood()}
                  disabled={autoMood || !title.trim()}
                  className="inline-flex items-center gap-1 rounded-full border border-amber-400/60 bg-white/80 px-2 py-0.5 hover:bg-white transition shrink-0 disabled:opacity-50"
                >
                  <RotateCcw className="h-3 w-3" /> Retry
                </button>
              </div>
            )}
          </div>
          <div>
            <Label htmlFor="add-age-rating">Reader age <span className="text-muted-foreground text-xs">(optional)</span></Label>
            <input
              id="add-age-rating"
              type="number"
              inputMode="numeric"
              min={1}
              max={120}
              placeholder="e.g. 14"
              value={ageRating ?? ""}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                setAgeRating(isFinite(v) && v > 0 ? v : undefined);
              }}
              className="mt-1 w-28 rounded-md border border-border bg-white/60 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
            />
            <p className="text-[11px] text-muted-foreground mt-1">Helps keep recommendations age-appropriate.</p>
          </div>
          <div>
            <Label>Shelf</Label>
            <div className="flex flex-wrap gap-2 pt-1">
              {(["reading","want","paused","finished","dnf"] as Shelf[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setShelf(s)}
                  className={`rounded-full border px-3 py-1.5 text-sm capitalize transition ${
                    shelf === s ? "bg-foreground text-background border-foreground" : "bg-white/60 border-border hover:bg-white"
                  }`}
                >
                  {s === "want" ? "Want to read" : s === "dnf" ? "DNF" : s === "paused" ? "Paused" : s}
                </button>
              ))}
            </div>
          </div>
          <label className="flex items-center gap-2.5 cursor-pointer select-none rounded-xl border border-border/50 px-3 py-2.5 hover:bg-foreground/[0.02] transition">
            <input
              type="checkbox"
              checked={isReread}
              onChange={(e) => setIsReread(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-border accent-foreground"
            />
            <span className="text-sm text-muted-foreground">This is a re-read</span>
          </label>
          <Button className="w-full rounded-full" onClick={submit}>Add to library</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
