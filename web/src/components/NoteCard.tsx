import { useNavigate } from "react-router-dom";
import { Pin, Star, Archive, Trash2, Lock, Copy } from "lucide-react";
import type { Note } from "@/lib/types";
import { useNoteMutations } from "@/hooks/useNotes";

export function NoteCard({ note }: { note: Note }) {
  const navigate = useNavigate();
  const { pin, favorite, archive, trash, duplicate } = useNoteMutations();

  const plain = (note.content ?? "").replace(/<[^>]+>/g, " ").slice(0, 160);
  const image = note.attachments.find((a) => a.kind === "image");

  return (
    <div
      onClick={() => navigate(`/notes/${note.id}`)}
      className="note-card group relative flex flex-col rounded-xl p-4 cursor-pointer transition-shadow hover:shadow-md"
      style={{ backgroundColor: note.color ?? "var(--color-surface)" }}
    >
      {image && <img src={image.url} alt="" className="mb-3 h-28 w-full rounded-lg object-cover" />}
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-medium truncate">{note.title || "Untitled"}</h3>
        {note.isProtected && <Lock size={14} className="shrink-0" style={{ color: "var(--color-text-muted)" }} />}
      </div>
      <p className="text-sm line-clamp-3" style={{ color: "var(--color-text-muted)" }}>
        {note.isProtected ? "Protected note — enter PIN to view" : plain || "Empty note"}
      </p>

      <div className="mt-auto flex flex-wrap gap-1 pt-3">
        {note.tags.map((t) => (
          <span key={t.id} className="rounded-full bg-brand-100 text-brand-700 text-xs px-2 py-0.5">{t.name}</span>
        ))}
      </div>

      <div
        className="absolute top-2 right-2 hidden group-hover:flex items-center gap-1 rounded-lg p-1 shadow-sm"
        style={{ backgroundColor: "var(--color-surface)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button title="Pin" onClick={() => pin.mutate(note.id)} className="p-1.5 rounded hover-surface">
          <Pin size={14} fill={note.isPinned ? "currentColor" : "none"} />
        </button>
        <button title="Favorite" onClick={() => favorite.mutate(note.id)} className="p-1.5 rounded hover-surface">
          <Star size={14} fill={note.isFavorite ? "currentColor" : "none"} />
        </button>
        <button title="Duplicate" onClick={() => duplicate.mutate(note.id)} className="p-1.5 rounded hover-surface">
          <Copy size={14} />
        </button>
        <button title="Archive" onClick={() => archive.mutate(note.id)} className="p-1.5 rounded hover-surface">
          <Archive size={14} />
        </button>
        <button title="Trash" onClick={() => trash.mutate(note.id)} className="p-1.5 rounded hover-surface text-red-500">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
