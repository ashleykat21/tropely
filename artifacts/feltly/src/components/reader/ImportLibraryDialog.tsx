import { useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLibrary, type Shelf } from "@/lib/store";
import { MoodKey } from "@/lib/moods";
import { Upload, FileText, Loader2, Lock, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { usePremium } from "@/lib/usePremium";

type Row = Record<string, string>;

function parseCSV(text: string): Row[] {
  const lines = text.split(/\r?\n/).filter((l) => l.length > 0);
  if (lines.length < 2) return [];
  const splitLine = (line: string): string[] => {
    const out: string[] = [];
    let cur = "";
    let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (inQ) {
        if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; }
        else if (c === '"') { inQ = false; }
        else cur += c;
      } else {
        if (c === '"') inQ = true;
        else if (c === ",") { out.push(cur); cur = ""; }
        else cur += c;
      }
    }
    out.push(cur);
    return out;
  };
  const headers = splitLine(lines[0]).map((h) => h.trim().toLowerCase().replace(/^"|"$/g, ""));
  return lines.slice(1).map((line) => {
    const cells = splitLine(line);
    const row: Row = {};
    headers.forEach((h, i) => { row[h] = (cells[i] ?? "").trim().replace(/^"|"$/g, ""); });
    return row;
  });
}

function pick(row: Row, keys: string[]): string {
  for (const k of keys) {
    if (row[k] !== undefined && row[k] !== "") return row[k];
  }
  return "";
}

function mapShelf(raw: string): Shelf {
  const s = raw.toLowerCase();
  if (s.includes("read") && !s.includes("to-read") && !s.includes("currently")) return "finished";
  if (s.includes("currently")) return "reading";
  if (s.includes("did-not-finish") || s.includes("dnf")) return "dnf";
  if (s.includes("paused") || s.includes("on hold")) return "paused";
  return "want";
}

function mapMood(genre: string): MoodKey {
  const g = genre.toLowerCase();
  if (/(romance|cozy|comfort)/.test(g)) return "cozy";
  if (/(thriller|horror|dark|war)/.test(g)) return "intense";
  if (/(grief|literary|sad|memoir)/.test(g)) return "melancholy";
  if (/(fantasy|sci|adventure)/.test(g)) return "dreamy";
  if (/(humor|comic|funny)/.test(g)) return "joyful";
  if (/(myster|crime|noir)/.test(g)) return "mysterious";
  return "calm";
}

export function ImportLibraryDialog() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<{ added: number; skipped: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { books, addBook, autoAssignSeries } = useLibrary();
  const isPremium = usePremium((s) => s.isPremium);

  const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");

  const onFile = async (file: File) => {
    setBusy(true);
    setPreview(null);
    try {
      const text = await file.text();
      const rows = parseCSV(text);
      if (rows.length === 0) throw new Error("Empty or invalid CSV.");
      let added = 0;
      let skipped = 0;
      const existing = new Set(books.map((b) => `${norm(b.title)}|${norm(b.author)}`));
      for (const r of rows) {
        const title = pick(r, ["title", "book title"]);
        const author = pick(r, ["author", "authors", "primary author"]) || "Unknown";
        if (!title) { skipped++; continue; }
        const key = `${norm(title)}|${norm(author)}`;
        if (existing.has(key)) { skipped++; continue; }
        existing.add(key);
        const pages = parseInt(pick(r, ["number of pages", "pages", "page count"]), 10) || 280;
        const shelf = mapShelf(pick(r, ["exclusive shelf", "read status", "bookshelves", "status"]));
        const mood = mapMood(pick(r, ["genres", "tags", "shelves"]));
        const progress = shelf === "finished" ? pages : 0;
        const newId = addBook({ title, author, pages, mood, shelf, progress });
        autoAssignSeries(newId);
        added++;
      }
      setPreview({ added, skipped });
      toast.success(`Imported ${added} books${skipped ? ` · skipped ${skipped}` : ""}.`);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Import failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (v && !isPremium) {
          toast("Library import is a premium feature", {
            description: "Upgrade in the app store to bulk import from Goodreads & StoryGraph.",
            icon: <Sparkles className="h-4 w-4" />,
          });
          return;
        }
        setOpen(v);
      }}
    >
      <DialogTrigger asChild>
        <button
          type="button"
          className="w-full rounded-2xl border border-dashed border-border/70 bg-card/40 hover:bg-card/60 transition p-3 flex items-center gap-2 text-sm"
        >
          {isPremium ? (
            <Upload className="h-4 w-4" style={{ color: "var(--mood-strong)" }} />
          ) : (
            <Lock className="h-4 w-4 text-muted-foreground" />
          )}
          <div className="flex-1 text-left">
            <div className="font-medium flex items-center gap-1.5">
              Import from Goodreads / StoryGraph
              {!isPremium && (
                <span className="rounded-full border border-border/60 bg-background/80 px-1.5 py-0.5 text-[9px] uppercase tracking-widest">
                  Premium
                </span>
              )}
            </div>
            <div className="text-[11px] text-muted-foreground">Bulk add from a CSV export.</div>
          </div>
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Import library</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <div className="rounded-xl bg-muted/40 p-3 text-xs text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">How to export</p>
            <p>• <strong>Goodreads</strong>: My Books → Import and export → Export Library.</p>
            <p>• <strong>StoryGraph</strong>: Manage Account → Export Stats → CSV.</p>
            <p>Duplicates already in your library will be skipped automatically.</p>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onFile(f);
              e.target.value = "";
            }}
          />
          <Button
            className="w-full rounded-full gap-2"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
            {busy ? "Importing…" : "Choose CSV file"}
          </Button>
          {preview && (
            <div className="rounded-xl border border-border/50 p-3 text-xs">
              <div className="font-medium text-foreground">Done!</div>
              <div className="text-muted-foreground mt-1">
                Added <span className="text-foreground font-medium">{preview.added}</span> · skipped{" "}
                <span className="text-foreground font-medium">{preview.skipped}</span> duplicates / blank rows.
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}