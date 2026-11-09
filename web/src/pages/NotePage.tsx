import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Lock, Unlock, Palette } from "lucide-react";
import { api } from "@/lib/api";
import type { Note, Attachment } from "@/lib/types";
import { NoteEditor, type PaperStyle } from "@/components/NoteEditor";
import { PinLockModal } from "@/components/PinLockModal";
import { AudioRecorder } from "@/components/AudioRecorder";
import { AttachmentsPanel } from "@/components/AttachmentsPanel";

const COLORS = [null, "#FEF3C7", "#DBEAFE", "#DCFCE7", "#FCE7F3", "#EDE9FE"];

export default function NotePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const isNew = id === "new";

  const { data: note, isLoading } = useQuery({
    queryKey: ["note", id],
    queryFn: async () => (await api.get<{ note: Note }>(`/notes/${id}`)).data.note,
    enabled: !isNew,
  });

  const [noteId, setNoteId] = useState<string | null>(isNew ? null : (id ?? null));
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [color, setColor] = useState<string | null>(null);
  const [unlocked, setUnlocked] = useState(isNew);
  const [showLockModal, setShowLockModal] = useState<"set" | "unlock" | null>(null);
  const [lockError, setLockError] = useState<string | null>(null);
  const [isProtected, setIsProtected] = useState(false);
  const [paperStyle, setPaperStyle] = useState<PaperStyle>("none");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content ?? "");
      setColor(note.color ?? null);
      setIsProtected(note.isProtected);
      setAttachments(note.attachments ?? []);
      if (note.isProtected && note.locked) {
        setUnlocked(false);
        setShowLockModal("unlock");
      } else {
        setUnlocked(true);
      }
    }
  }, [note]);

  async function ensureNoteCreated(): Promise<string> {
    if (noteId) return noteId;
    const { data } = await api.post<{ note: Note }>("/notes", { title, content });
    setNoteId(data.note.id);
    qc.invalidateQueries({ queryKey: ["notes"] });
    navigate(`/notes/${data.note.id}`, { replace: true });
    return data.note.id;
  }

  function scheduleSave(next: { title?: string; content?: string; plainText?: string; color?: string | null }) {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const nid = await ensureNoteCreated();
      await api.patch(`/notes/${nid}`, next);
      qc.invalidateQueries({ queryKey: ["notes"] });
    }, 500);
  }

  async function uploadAttachment(file: File): Promise<Attachment> {
    const nid = await ensureNoteCreated();
    const form = new FormData();
    form.append("file", file);
    const { data } = await api.post<{ attachment: Attachment }>(`/notes/${nid}/attachments`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    setAttachments((prev) => [...prev, data.attachment]);
    return data.attachment;
  }

  async function uploadImage(file: File): Promise<string> {
    const attachment = await uploadAttachment(file);
    return attachment.url;
  }

  async function handleUnlock(pin: string) {
    try {
      await api.post(`/notes/${id}/unlock`, { pin });
      setShowLockModal(null);
      setUnlocked(true);
      qc.invalidateQueries({ queryKey: ["note", id] });
    } catch {
      setLockError("Incorrect PIN");
    }
  }

  async function handleSetLock(pin: string) {
    const nid = await ensureNoteCreated();
    await api.post(`/notes/${nid}/lock`, { pin });
    setIsProtected(true);
    setShowLockModal(null);
  }

  async function handleRemoveLock() {
    if (!noteId) return;
    await api.delete(`/notes/${noteId}/lock`);
    setIsProtected(false);
  }

  if (!isNew && isLoading) return <div className="p-6" style={{ color: "var(--color-text-muted)" }}>Loading…</div>;

  if (!isNew && isProtected && !unlocked) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-full text-center" style={{ color: "var(--color-text-muted)" }}>
        <Lock size={32} className="mb-3 text-brand-600" />
        <p>This note is locked.</p>
        {showLockModal === "unlock" && (
          <PinLockModal mode="unlock" onSubmit={handleUnlock} onCancel={() => navigate(-1)} error={lockError} />
        )}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-6 py-3 border-b" style={{ borderColor: "var(--color-border)" }}>
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm" style={{ color: "var(--color-text-muted)" }}>
          <ArrowLeft size={16} /> Back
        </button>
        <div className="flex items-center gap-2">
          <div className="relative group">
            <button className="p-2 rounded-lg hover-surface"><Palette size={16} /></button>
            <div className="absolute right-0 mt-1 hidden group-hover:flex gap-1 p-2 rounded-lg shadow-md note-card z-10">
              {COLORS.map((c) => (
                <button
                  key={c ?? "none"}
                  onClick={() => { setColor(c); scheduleSave({ color: c }); }}
                  className="w-6 h-6 rounded-full border"
                  style={{ backgroundColor: c ?? "var(--color-surface)", borderColor: "var(--color-border)" }}
                />
              ))}
            </div>
          </div>
          <AudioRecorder onRecorded={(file) => uploadAttachment(file)} />
          {isProtected ? (
            <button onClick={handleRemoveLock} className="flex items-center gap-1 text-sm px-2 py-1.5 rounded-lg hover-surface">
              <Unlock size={14} /> Remove lock
            </button>
          ) : (
            <button onClick={() => setShowLockModal("set")} className="flex items-center gap-1 text-sm px-2 py-1.5 rounded-lg hover-surface">
              <Lock size={14} /> Lock note
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-6 max-w-3xl mx-auto w-full" style={{ backgroundColor: color ?? "transparent" }}>
        <input
          value={title}
          onChange={(e) => { setTitle(e.target.value); scheduleSave({ title: e.target.value }); }}
          placeholder="Untitled"
          className="w-full text-2xl font-semibold outline-none mb-4 bg-transparent"
        />
        <NoteEditor
          content={content}
          onChange={(html, text) => { setContent(html); scheduleSave({ content: html, plainText: text }); }}
          onUploadImage={uploadImage}
          paperStyle={paperStyle}
          onPaperStyleChange={setPaperStyle}
        />
        <AttachmentsPanel attachments={attachments} />
      </div>

      {showLockModal === "set" && (
        <PinLockModal mode="set" onSubmit={handleSetLock} onCancel={() => setShowLockModal(null)} />
      )}
    </div>
  );
}
