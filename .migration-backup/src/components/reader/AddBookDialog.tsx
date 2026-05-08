import { useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { MOODS, MoodKey } from "@/lib/moods";
import { Shelf, useLibrary } from "@/lib/store";
import { Plus, Camera, ScanLine, Sparkles, Loader2, AlertTriangle, Wand2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ImportLibraryDialog } from "./ImportLibraryDialog";
import { LockedFeature } from "@/components/premium/LockedFeature";
import { usePremium } from "@/lib/usePremium";
import { BarcodeScannerDialog } from "./BarcodeScannerDialog";

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
  const [pages, setPages] = useState(300);
  const [basePages, setBasePages] = useState(300);
  const [format, setFormat] = useState<Format>("paperback");
  const [audioMinutes, setAudioMinutes] = useState(600); // 10h default
  const [mood, setMood] = useState<MoodKey>("calm");
  const [shelf, setShelf] = useState<Shelf>(defaultShelf);
  const [tagsRaw, setTagsRaw] = useState("");
  const [cover, setCover] = useState<string | undefined>();
  const [isbn, setIsbn] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [autoMood, setAutoMood] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

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
      const { data, error } = await supabase.functions.invoke("book-lookup", { body });
      if (error) throw error;
      const b = (data as any)?.book;
      if (!b) throw new Error("No book found");
      setTitle(b.title ?? "");
      setAuthor(b.author ?? "");
      if (b.pages) setPages(b.pages);
      if (b.pages) setBasePages(b.pages);
      if (b.cover) setCover(b.cover);
      if (b.isbn) setIsbn(b.isbn);
      toast.success(`Found: ${b.title}`);
      // Auto-detect mood from the matched metadata.
      if (b.title) detectMood(b.title, b.author ?? "");
    } catch (e: any) {
      toast.error(e?.message ?? "Couldn't identify the book.");
    } finally {
      setScanning(false);
    }
  };

  const detectMood = async (titleArg?: string, authorArg?: string) => {
    const t = (titleArg ?? title).trim();
    const a = (authorArg ?? author).trim();
    if (!t) return;
    setAutoMood(true);
    try {
      const { data, error } = await supabase.functions.invoke("mood-tag-books", {
        body: { books: [{ key: "", title: t, author: a || "Unknown" }], targetMood: "calm" },
      });
      if (error) throw error;
      const tag = (data as any)?.tags?.[0];
      if (tag?.mood && (MOODS as any)[tag.mood]) {
        setMood(tag.mood as MoodKey);
        toast.success(`Mood detected: ${MOODS[tag.mood as MoodKey].label}`);
      }
    } catch (e: any) {
      // silent; user can still pick manually
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
      pages: format === "audiobook" ? Math.max(1, Math.round(audioMinutes / 2)) : pages, // ~2 min/page proxy
      mood,
      shelf,
      tags,
      cover,
      format,
      ...(format === "audiobook" ? { audioMinutes, audioMinutesListened: 0 } : {}),
    });
    // Auto-create or extend a "series" collection when the title hints at one.
    const series = autoAssignSeries(newId);
    if (series) {
      toast.success(`Added to series: ${series.seriesName}`);
    }
    setOpen(false);
    setTitle(""); setAuthor(""); setTranslator(""); setPages(300); setBasePages(300); setFormat("paperback"); setAudioMinutes(600);
    setMood("calm"); setTagsRaw(""); setCover(undefined); setIsbn("");
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
          <Plus className="h-4 w-4" /> Add a book
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

          <div>
            <Label htmlFor="t">Title</Label>
            <Input id="t" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="The Quiet Tide" />
            {duplicate && (
              <p className="text-[11px] text-amber-600 mt-1 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Already in library on "{duplicate.shelf}" shelf.
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
                  }}
                />
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
          <Button className="w-full rounded-full" onClick={submit}>Add to library</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
