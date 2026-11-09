import { useNavigate } from "react-router-dom";
import { useRef, useState } from "react";
import { Pin, Star, Archive, Trash2, Lock, Copy, Users, MoreVertical, RotateCcw, XCircle } from "lucide-react";
import type { Note } from "@/lib/types";
import { useNoteMutations } from "@/hooks/useNotes";
import { useAuthStore } from "@/store/authStore";

const LONG_PRESS_MS = 450;

export function NoteCard({ note }: { note: Note }) {
  const navigate = useNavigate();
  const { pin, favorite, archive, trash, duplicate, restore, remove } = useNoteMutations();
  const currentUserId = useAuthStore((s) => s.user?.id);
  const isOwner = note.userId === currentUserId;
  const [menuOpen, setMenuOpen] = useState(false);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const suppressClick = useRef(false);

  const plain = (note.content ?? "").replace(/<[^>]+>/g, " ").slice(0, 160);
  const image = note.attachments.find((a) => a.kind === "image");

  function startPress() {
    if (!isOwner) return;
    pressTimer.current = setTimeout(() => {
      suppressClick.current = true;
      setMenuOpen(true);
    }, LONG_PRESS_MS);
  }
  function endPress() {
    clearTimeout(pressTimer.current);
  }

  function openNote() {
    if (suppressClick.current) {
      suppressClick.current = false;
      return;
    }
    navigate(`/notes/${note.id}`);
  }

  function act(fn: () => void) {
    return () => {
      fn();
      setMenuOpen(false);
    };
  }

  return (
    <div
      onClick={openNote}
      onTouchStart={startPress}
      onTouchEnd={endPress}
      onTouchMove={endPress}
      onMouseDown={startPress}
      onMouseUp={endPress}
      onMouseLeave={endPress}
      onContextMenu={(e) => { if (isOwner) { e.preventDefault(); setMenuOpen(true); } }}
      className="note-card group relative flex flex-col rounded-xl p-4 cursor-pointer transition-shadow hover:shadow-md select-none"
      style={{ backgroundColor: note.color ?? "var(--color-surface)" }}
    >
      {image && <img src={image.url} alt="" className="mb-3 h-28 w-full rounded-lg object-cover" />}
      <div className="flex items-center justify-between mb-1 gap-2">
        <h3 className="font-medium truncate flex-1">{note.title || "Untitled"}</h3>
        <div className="flex items-center gap-1 shrink-0">
          {!isOwner && <Users size={14} style={{ color: "var(--color-text-muted)" }} />}
          {note.isProtected && <Lock size={14} style={{ color: "var(--color-text-muted)" }} />}
          {isOwner && (
            <button
              title="More actions"
              onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }}
              className="p-1 rounded hover-surface"
            >
              <MoreVertical size={16} />
            </button>
          )}
        </div>
      </div>
      <p className="text-sm line-clamp-3" style={{ color: "var(--color-text-muted)" }}>
        {note.isProtected ? "Protected note — enter PIN to view" : plain || "Empty note"}
      </p>

      <div className="mt-auto flex flex-wrap gap-1 pt-3">
        {note.tags.map((t) => (
          <span key={t.id} className="rounded-full bg-brand-100 text-brand-700 text-xs px-2 py-0.5">{t.name}</span>
        ))}
      </div>

      {menuOpen && (
        <>
          {/* Full-screen backdrop: click anywhere outside the menu to close it. */}
          <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setMenuOpen(false); }} />
          <div
            className="absolute top-10 right-2 z-20 flex flex-col rounded-lg shadow-lg border min-w-[160px] py-1 note-card"
            style={{ borderColor: "var(--color-border)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {note.isTrashed ? (
              <>
                <MenuItem icon={RotateCcw} label="Restore" onClick={act(() => restore.mutate(note.id))} />
                <MenuItem icon={XCircle} label="Delete permanently" danger onClick={act(() => remove.mutate(note.id))} />
              </>
            ) : (
              <>
                <MenuItem icon={Pin} label={note.isPinned ? "Unpin" : "Pin"} onClick={act(() => pin.mutate(note.id))} />
                <MenuItem icon={Star} label={note.isFavorite ? "Unfavorite" : "Favorite"} onClick={act(() => favorite.mutate(note.id))} />
                <MenuItem icon={Copy} label="Duplicate" onClick={act(() => duplicate.mutate(note.id))} />
                <MenuItem icon={Archive} label={note.isArchived ? "Unarchive" : "Archive"} onClick={act(() => archive.mutate(note.id))} />
                <MenuItem icon={Trash2} label="Move to trash" danger onClick={act(() => trash.mutate(note.id))} />
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function MenuItem({
  icon: Icon,
  label,
  onClick,
  danger,
}: {
  icon: typeof Pin;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-2 text-sm text-left hover-surface"
      style={danger ? { color: "#DC2626" } : undefined}
    >
      <Icon size={14} /> {label}
    </button>
  );
}
