import { useParams } from "react-router-dom";
import { Search, LayoutGrid, List } from "lucide-react";
import { useState } from "react";
import { useNotes } from "@/hooks/useNotes";
import { NoteCard } from "@/components/NoteCard";

const viewTitles: Record<string, string> = {
  all: "All notes",
  favorites: "Favorites",
  pinned: "Pinned",
  archived: "Archive",
  trash: "Trash",
  shared: "Shared with me",
};

export default function NotesListPage({ view = "all" }: { view?: string }) {
  const { folderId } = useParams();
  const [query, setQuery] = useState("");
  const [layout, setLayout] = useState<"grid" | "list">("grid");

  const { data: notes = [], isLoading } = useNotes(view === "all" ? "" : view, folderId);

  const filtered = notes.filter(
    (n) => n.title.toLowerCase().includes(query.toLowerCase()) || (n.content ?? "").toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6 gap-4">
        <h1 className="text-xl font-semibold">{viewTitles[view] ?? "Notes"}</h1>
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--color-text-muted)" }} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search notes…"
              className="w-full rounded-lg border pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-400"
              style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}
            />
          </div>
          <button onClick={() => setLayout("grid")} className={`p-2 rounded-lg ${layout === "grid" ? "bg-brand-100 text-brand-700" : ""}`}>
            <LayoutGrid size={16} />
          </button>
          <button onClick={() => setLayout("list")} className={`p-2 rounded-lg ${layout === "list" ? "bg-brand-100 text-brand-700" : ""}`}>
            <List size={16} />
          </button>
        </div>
      </div>

      {isLoading && <p style={{ color: "var(--color-text-muted)" }}>Loading…</p>}
      {!isLoading && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center" style={{ color: "var(--color-text-muted)" }}>
          <p className="text-sm">No notes here yet.</p>
        </div>
      )}

      <div className={layout === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" : "flex flex-col gap-3"}>
        {filtered.map((note) => (
          <NoteCard key={note.id} note={note} />
        ))}
      </div>
    </div>
  );
}
