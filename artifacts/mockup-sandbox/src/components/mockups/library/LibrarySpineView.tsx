import { useState } from "react";

const GRADIENT_BG = "linear-gradient(160deg, hsl(210 30% 94%) 0%, hsl(220 25% 91%) 40%, hsl(200 28% 93%) 100%)";

const SPINE_COLORS = [
  "#c0392b","#8e44ad","#2980b9","#16a085","#27ae60",
  "#e67e22","#2c3e50","#7f8c8d","#d35400","#1a252f",
  "#6c5ce7","#e17055","#00b894","#fdcb6e","#a29bfe",
  "#fd79a8","#55efc4","#0984e3","#e84393","#b2bec3",
];

const MOCK_BOOKS = [
  { id:"1", title:"Fourth Wing", author:"Rebecca Yarros", color:"#c0392b" },
  { id:"2", title:"A Court of Thorns", author:"Sarah J. Maas", color:"#8e44ad" },
  { id:"3", title:"The Cruel Prince", author:"Holly Black", color:"#2980b9" },
  { id:"4", title:"Kingdom of the Wicked", author:"Kerri Maniscalco", color:"#16a085" },
  { id:"5", title:"From Blood and Ash", author:"Jennifer L.", color:"#e67e22" },
  { id:"6", title:"House of Salt", author:"Cassandra Clare", color:"#2c3e50" },
  { id:"7", title:"Iron Flame", author:"Rebecca Yarros", color:"#6c5ce7" },
  { id:"8", title:"Onyx Storm", author:"Rebecca Yarros", color:"#d35400" },
];

const MOCK_TBR = [
  { id:"9",  title:"Our Infinite Fates", author:"Abigail Owen",   color:"#e17055" },
  { id:"10", title:"Dreadbound",         author:"Zoe Hawthorn",  color:"#00b894" },
  { id:"11", title:"Fairytale",          author:"Stephen King",  color:"#fdcb6e" },
  { id:"12", title:"Thrills of Fallen",  author:"Nora Roberts",  color:"#a29bfe" },
  { id:"13", title:"Last Starborn Seer", author:"Ana Huang",     color:"#fd79a8" },
  { id:"14", title:"Smoke and Scar",     author:"Elise Kova",    color:"#55efc4" },
];

const MOCK_DARK = [
  { id:"15", title:"Elrith Manor",  author:"Ana Huang",   color:"#2c3e50" },
  { id:"16", title:"I Will Break",  author:"Lexi Ryan",   color:"#7f8c8d" },
  { id:"17", title:"Den of Vipers", author:"K.A. Knight", color:"#c0392b" },
  { id:"18", title:"God of Malice", author:"Rina Kent",   color:"#1a252f" },
  { id:"19", title:"Brave Lullaby", author:"Sav R. Miller",color:"#6c5ce7" },
];

type Shelf = { id: string; name: string; books: typeof MOCK_BOOKS; isPublic: boolean };

const DEFAULT_SHELVES: Shelf[] = [
  { id: "s1", name: "Currently Reading", books: MOCK_BOOKS.slice(0,3), isPublic: true },
  { id: "s2", name: "My TBR List",       books: MOCK_TBR,              isPublic: true },
  { id: "s3", name: "Dark Romance",      books: MOCK_DARK,             isPublic: false },
  { id: "s4", name: "5 Star Reads",      books: MOCK_BOOKS.slice(3),   isPublic: true },
];

function BookSpine({ book, height = 120 }: { book: { title: string; color: string }; height?: number }) {
  const width = Math.round(height * 0.185);
  return (
    <div
      style={{
        width,
        height,
        background: `linear-gradient(90deg, ${book.color}dd 0%, ${book.color} 30%, ${book.color}cc 100%)`,
        borderRadius: "2px 4px 4px 2px",
        boxShadow: "inset -2px 0 4px rgba(0,0,0,0.25), 2px 0 6px rgba(0,0,0,0.18), inset 2px 0 3px rgba(255,255,255,0.08)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        flexShrink: 0,
        cursor: "pointer",
        position: "relative",
      }}
    >
      <span
        style={{
          writingMode: "vertical-rl",
          textOrientation: "mixed",
          transform: "rotate(180deg)",
          fontSize: 8,
          color: "rgba(255,255,255,0.92)",
          fontWeight: 600,
          letterSpacing: "0.04em",
          lineHeight: 1.2,
          padding: "6px 0",
          maxHeight: height - 12,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          textShadow: "0 1px 2px rgba(0,0,0,0.4)",
        }}
      >
        {book.title}
      </span>
      <div style={{
        position: "absolute",
        left: 0, top: 0, bottom: 0,
        width: 3,
        background: "rgba(255,255,255,0.12)",
        borderRadius: "2px 0 0 2px",
      }} />
    </div>
  );
}

function ShelfRow({ shelf, onTogglePublic, onRename }: {
  shelf: Shelf;
  onTogglePublic: () => void;
  onRename: (name: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(shelf.name);

  return (
    <div style={{ marginBottom: 20 }}>
      {/* Shelf header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, paddingLeft: 2 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {editing ? (
            <form onSubmit={(e) => { e.preventDefault(); onRename(draft); setEditing(false); }} style={{ display: "flex", gap: 4 }}>
              <input
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                style={{
                  fontSize: 13, fontWeight: 700, fontFamily: "Georgia, serif",
                  border: "1px solid #cbd5e1", borderRadius: 6, padding: "2px 8px",
                  background: "rgba(255,255,255,0.8)", outline: "none", width: 130,
                }}
              />
              <button type="submit" style={{ fontSize: 11, padding: "2px 8px", borderRadius: 6, background: "#1e293b", color: "#fff", border: "none", cursor: "pointer" }}>✓</button>
              <button type="button" onClick={() => setEditing(false)} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 6, background: "#e2e8f0", border: "none", cursor: "pointer" }}>✕</button>
            </form>
          ) : (
            <button
              onClick={() => { setDraft(shelf.name); setEditing(true); }}
              style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, padding: 0 }}
            >
              <span style={{ fontSize: 13, fontWeight: 700, fontFamily: "Georgia, serif", color: "#1e293b" }}>{shelf.name}</span>
              <span style={{ fontSize: 10, color: "#94a3b8" }}>✎</span>
            </button>
          )}
          <span style={{ fontSize: 10, color: "#94a3b8", fontWeight: 500 }}>{shelf.books.length} books</span>
        </div>

        {/* Privacy toggle */}
        <button
          onClick={onTogglePublic}
          style={{
            display: "flex", alignItems: "center", gap: 4,
            padding: "3px 8px", borderRadius: 20,
            border: `1px solid ${shelf.isPublic ? "#bfdbfe" : "#e2e8f0"}`,
            background: shelf.isPublic ? "#eff6ff" : "#f8fafc",
            cursor: "pointer", fontSize: 10, fontWeight: 600,
            color: shelf.isPublic ? "#3b82f6" : "#94a3b8",
            transition: "all 0.2s",
          }}
        >
          <span>{shelf.isPublic ? "🌐" : "🔒"}</span>
          <span>{shelf.isPublic ? "Public" : "Private"}</span>
        </button>
      </div>

      {/* Horizontal spine scroll */}
      <div
        style={{
          display: "flex",
          gap: 3,
          overflowX: "auto",
          paddingBottom: 10,
          paddingLeft: 2,
          scrollbarWidth: "none",
        }}
      >
        {/* Wooden shelf backing */}
        <div style={{ display: "flex", gap: 3, alignItems: "flex-end", flexShrink: 0 }}>
          {shelf.books.map((book) => (
            <BookSpine key={book.id} book={book} height={118} />
          ))}
        </div>
      </div>

      {/* Shelf plank */}
      <div style={{
        height: 6,
        background: "linear-gradient(180deg, hsl(28 50% 62%) 0%, hsl(25 44% 54%) 100%)",
        borderRadius: "0 0 4px 4px",
        marginTop: -4,
        boxShadow: "0 3px 8px rgba(0,0,0,0.15)",
        marginLeft: 2,
      }} />
    </div>
  );
}

export function LibrarySpineView() {
  const [shelves, setShelves] = useState<Shelf[]>(DEFAULT_SHELVES);
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState("");

  const togglePublic = (id: string) =>
    setShelves((s) => s.map((sh) => sh.id === id ? { ...sh, isPublic: !sh.isPublic } : sh));

  const rename = (id: string, name: string) =>
    setShelves((s) => s.map((sh) => sh.id === id ? { ...sh, name } : sh));

  const createShelf = () => {
    if (!newName.trim()) return;
    setShelves((s) => [...s, { id: Date.now().toString(), name: newName.trim(), books: [], isPublic: true }]);
    setNewName("");
    setShowNew(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: GRADIENT_BG }}>
      {/* Header */}
      <div style={{
        padding: "16px 16px 8px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div>
          <h2 style={{ fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 700, margin: 0, color: "#1e293b" }}>
            Your Library
          </h2>
          <p style={{ fontSize: 11, color: "#64748b", margin: "2px 0 0", fontWeight: 500 }}>
            {shelves.reduce((a, s) => a + s.books.length, 0)} books across {shelves.length} shelves
          </p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          style={{
            display: "flex", alignItems: "center", gap: 5,
            padding: "6px 12px", borderRadius: 20,
            background: "#1e293b", color: "#fff",
            border: "none", cursor: "pointer",
            fontSize: 11, fontWeight: 600,
            boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
          }}
        >
          <span style={{ fontSize: 14 }}>+</span>
          <span>New Shelf</span>
        </button>
      </div>

      {/* New shelf form */}
      {showNew && (
        <div style={{ padding: "8px 16px 12px", background: "rgba(255,255,255,0.6)", backdropFilter: "blur(8px)", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
          <form onSubmit={(e) => { e.preventDefault(); createShelf(); }} style={{ display: "flex", gap: 8 }}>
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Shelf name (e.g. Cozy Reads)…"
              style={{
                flex: 1, fontSize: 13, border: "1px solid #cbd5e1", borderRadius: 8,
                padding: "7px 12px", background: "rgba(255,255,255,0.9)", outline: "none",
              }}
            />
            <button type="submit" style={{ padding: "7px 14px", borderRadius: 8, background: "#1e293b", color: "#fff", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>Create</button>
            <button type="button" onClick={() => setShowNew(false)} style={{ padding: "7px 10px", borderRadius: 8, background: "#e2e8f0", border: "none", cursor: "pointer", fontSize: 12 }}>Cancel</button>
          </form>
        </div>
      )}

      {/* Shelves */}
      <div style={{ padding: "12px 16px 24px" }}>
        {shelves.map((shelf) => (
          <ShelfRow
            key={shelf.id}
            shelf={shelf}
            onTogglePublic={() => togglePublic(shelf.id)}
            onRename={(name) => rename(shelf.id, name)}
          />
        ))}

        {shelves.length === 0 && (
          <div style={{ textAlign: "center", padding: "48px 0", color: "#94a3b8", fontSize: 13 }}>
            No shelves yet. Create your first shelf above.
          </div>
        )}
      </div>
    </div>
  );
}
