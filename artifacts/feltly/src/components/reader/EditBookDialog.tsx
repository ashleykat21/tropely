import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { MOODS, MoodKey } from "@/lib/moods";
import { type AgeRating, type Book, useLibrary } from "@/lib/store";
import { Pencil, Trash2, Headphones, BookOpen, RotateCcw, Bookmark } from "lucide-react";
import { toast } from "sonner";
import { TropePicker } from "./TropePicker";

export function EditBookDialog({ book }: { book: Book }) {
  const { updateBook, removeBook, startReread, setNextRead } = useLibrary();
  const nextReadId = useLibrary((s) => s.nextReadId);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(book.title);
  const [author, setAuthor] = useState(book.author);
  const [translator, setTranslator] = useState(book.translator ?? "");
  const [narrator, setNarrator] = useState(book.narrator ?? "");
  const [pages, setPages] = useState<number>(book.pages);
  const [mood, setMood] = useState<MoodKey>(book.mood);
  const [cover, setCover] = useState(book.cover ?? "");
  const [tagsRaw, setTagsRaw] = useState((book.tags ?? []).join(", "));
  const [tropes, setTropes] = useState<string[]>(book.tropes ?? []);
  const [consumption, setConsumption] = useState<"read" | "listened" | undefined>(book.consumption);
  const [ageRating, setAgeRating] = useState<AgeRating | undefined>(book.ageRating);
  const [audioH, setAudioH] = useState<string>(
    book.audioMinutes ? String(Math.floor(book.audioMinutes / 60)) : ""
  );
  const [audioM, setAudioM] = useState<string>(
    book.audioMinutes ? String(book.audioMinutes % 60) : ""
  );

  useEffect(() => {
    if (open) {
      setTitle(book.title);
      setAuthor(book.author);
      setTranslator(book.translator ?? "");
      setNarrator(book.narrator ?? "");
      setPages(book.pages);
      setMood(book.mood);
      setCover(book.cover ?? "");
      setTagsRaw((book.tags ?? []).join(", "));
      setTropes(book.tropes ?? []);
      setConsumption(book.consumption);
      setAgeRating(book.ageRating);
      setAudioH(book.audioMinutes ? String(Math.floor(book.audioMinutes / 60)) : "");
      setAudioM(book.audioMinutes ? String(book.audioMinutes % 60) : "");
    }
  }, [open, book]);

  const save = () => {
    if (!title.trim()) { toast.error("Title is required."); return; }
    const totalAudio =
      consumption === "listened"
        ? Math.max(0, (parseInt(audioH || "0", 10) || 0) * 60 + (parseInt(audioM || "0", 10) || 0))
        : undefined;
    updateBook(book.id, {
      title: title.trim(),
      author: author.trim() || "Unknown",
      translator: translator.trim() || undefined,
      narrator: consumption === "listened" ? (narrator.trim() || undefined) : undefined,
      pages: Math.max(1, pages),
      mood,
      cover: cover.trim() || undefined,
      tags: tagsRaw
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      tropes,
      consumption,
      ageRating,
      ...(consumption === "listened" && totalAudio !== undefined
        ? { audioMinutes: totalAudio }
        : {}),
    });
    toast.success("Book updated.");
    setOpen(false);
  };

  const onDelete = () => {
    if (!confirm(`Remove "${book.title}" from your library?`)) return;
    removeBook(book.id);
    toast.success("Book removed.");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 rounded-full"
          aria-label="Edit book details"
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Edit details</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="et">Title</Label>
            <Input id="et" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="ea">Author</Label>
            <Input id="ea" value={author} onChange={(e) => setAuthor(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="etr">Translator <span className="text-muted-foreground text-xs">(optional)</span></Label>
            <Input id="etr" value={translator} onChange={(e) => setTranslator(e.target.value)} placeholder="e.g. Jennifer Croft" />
          </div>
          {consumption === "listened" && (
            <div>
              <Label htmlFor="enr">Narrator <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Input id="enr" value={narrator} onChange={(e) => setNarrator(e.target.value)} placeholder="e.g. Claire Danes" />
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="ep">Pages</Label>
              <Input
                id="ep"
                type="number"
                min={1}
                value={pages}
                onChange={(e) => setPages(parseInt(e.target.value) || 1)}
              />
            </div>
            <div>
              <Label htmlFor="ec">Cover URL</Label>
              <Input
                id="ec"
                value={cover}
                onChange={(e) => setCover(e.target.value)}
                placeholder="https://…"
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
                    mood === k
                      ? "bg-foreground text-background border-foreground"
                      : "bg-white/60 border-border hover:bg-white"
                  }`}
                >
                  {MOODS[k].emoji} {MOODS[k].label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label htmlFor="etg">Genres / themes</Label>
            <Input
              id="etg"
              value={tagsRaw}
              onChange={(e) => setTagsRaw(e.target.value)}
              placeholder="literary, grief, ocean"
            />
          </div>
          <div>
            <Label>Tropes <span className="text-muted-foreground text-xs">(optional)</span></Label>
            <div className="mt-1">
              <TropePicker
                selected={tropes}
                onChange={setTropes}
                bookTitle={book.title}
                bookTags={book.tags ?? []}
              />
            </div>
          </div>
          <div>
            <Label>How did you experience it?</Label>
            <div className="flex flex-wrap gap-2 pt-1">
              {([
                { k: "read" as const, label: "Read it", Icon: BookOpen },
                { k: "listened" as const, label: "Listened to it", Icon: Headphones },
              ]).map(({ k, label, Icon }) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setConsumption(consumption === k ? undefined : k)}
                  className={`rounded-full border px-3 py-1.5 text-sm inline-flex items-center gap-1.5 transition ${
                    consumption === k
                      ? "bg-foreground text-background border-foreground"
                      : "bg-white/60 border-border hover:bg-white"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" /> {label}
                </button>
              ))}
            </div>
          </div>
          {consumption === "listened" && (
            <div className="rounded-2xl border border-border/50 bg-background/40 p-3 space-y-2">
              <Label className="flex items-center gap-1.5">
                <Headphones className="h-3.5 w-3.5" /> Audiobook length
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  max={99}
                  inputMode="numeric"
                  value={audioH}
                  onChange={(e) => setAudioH(e.target.value.replace(/[^0-9]/g, "").slice(0, 2))}
                  placeholder="0"
                  className="h-9 w-16 text-center"
                  aria-label="Hours"
                />
                <span className="text-xs text-muted-foreground">hr</span>
                <Input
                  type="number"
                  min={0}
                  max={59}
                  inputMode="numeric"
                  value={audioM}
                  onChange={(e) => {
                    const n = Math.min(59, parseInt(e.target.value || "0", 10) || 0);
                    setAudioM(String(n));
                  }}
                  placeholder="0"
                  className="h-9 w-16 text-center"
                  aria-label="Minutes"
                />
                <span className="text-xs text-muted-foreground">min</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Used to track listening progress. Log minutes-listened from the book card.
              </p>
            </div>
          )}
          <div>
            <Label>Age rating <span className="text-muted-foreground text-xs">(optional)</span></Label>
            <div className="flex flex-wrap gap-2 pt-1">
              {([
                { key: "children" as AgeRating, label: "Children", sub: "0\u20137" },
                { key: "middle-grade" as AgeRating, label: "Middle Grade", sub: "8\u201312" },
                { key: "young-adult" as AgeRating, label: "Young Adult", sub: "13\u201317" },
                { key: "adult" as AgeRating, label: "Adult", sub: "18+" },
              ]).map(({ key, label, sub }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setAgeRating(ageRating === key ? undefined : key)}
                  className={`rounded-full border px-3 py-1.5 text-sm transition ${
                    ageRating === key
                      ? "bg-foreground text-background border-foreground"
                      : "bg-white/60 border-border hover:bg-white"
                  }`}
                >
                  {label} <span className="text-xs opacity-60">{sub}</span>
                </button>
              ))}
            </div>
          </div>
          {book.shelf === "want" && (
            <button
              type="button"
              onClick={() => {
                setNextRead(nextReadId === book.id ? null : book.id);
                toast.success(nextReadId === book.id ? "Unpinned as next read." : "Pinned as reading next.");
                setOpen(false);
              }}
              className={`w-full flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition ${
                nextReadId === book.id
                  ? "border-foreground/30 bg-foreground/5 text-foreground"
                  : "border-border/50 text-muted-foreground hover:text-foreground hover:border-foreground/30"
              }`}
            >
              <Bookmark className="h-3.5 w-3.5 shrink-0" />
              {nextReadId === book.id ? "Pinned as reading next" : "Pin as reading next"}
            </button>
          )}
          {book.shelf === "finished" && (
            <button
              type="button"
              onClick={() => {
                startReread(book.id);
                toast.success("Re-read started — back to page 0.");
                setOpen(false);
              }}
              className="w-full flex items-center gap-2 rounded-xl border border-border/50 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:border-foreground/30 transition"
            >
              <RotateCcw className="h-3.5 w-3.5 shrink-0" />
              Start a re-read
            </button>
          )}
          <div className="flex items-center gap-2 pt-2">
            <Button className="flex-1 rounded-full" onClick={save}>
              Save
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full"
              onClick={onDelete}
              aria-label="Remove book"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}