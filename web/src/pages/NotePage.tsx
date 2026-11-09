import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Lock, Unlock, Palette, Share2, Share as ShareIcon } from "lucide-react";
import { api } from "@/lib/api";
import type { Note, Attachment, NoteRole } from "@/lib/types";
import { NoteEditor, type PaperStyle } from "@/components/NoteEditor";
import { PinLockModal } from "@/components/PinLockModal";
import { AudioRecorder } from "@/components/AudioRecorder";
import { AttachmentsPanel } from "@/components/AttachmentsPanel";
import { ShareModal } from "@/components/ShareModal";
import { useAuthStore } from "@/store/authStore";
import { useSecureSessionStore } from "@/store/secureSessionStore";

const COLORS = [null, "#FEF3C7", "#DBEAFE", "#DCFCE7", "#FCE7F3", "#EDE9FE"];

export default function NotePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const isNew = id === "new";

  const { data: noteResponse, isLoading } = useQuery({
    queryKey: ["note", id],
    queryFn: async () => (await api.get<{ note: Note; role: NoteRole }>(`/notes/${id}`)).data,
    enabled: !isNew,
  });
  const note = noteResponse?.note;
  const role: NoteRole = isNew ? "OWNER" : (noteResponse?.role ?? "OWNER");
  const isOwner = role === "OWNER";
  const canWrite = role !== "VIEWER";
  const [showShareModal, setShowShareModal] = useState(false);

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

  // Guards against clobbering in-progress typing with server data. Without
  // this, creating a brand-new note mid-typing triggers a redirect from
  // /notes/new to /notes/<id>, which fires this note's first fetch — and
  // when that response lands, syncing it into state would overwrite
  // whatever the user kept typing in the meantime (the title field is a
  // controlled input, so this was visible as text vanishing mid-keystroke).
  // Each note id is only ever synced from the server once; afterwards the
  // locally-typed state is the source of truth until the user navigates to
  // a genuinely different note.
  const loadedNoteIdRef = useRef<string | null>(null);
  const user = useAuthStore((s) => s.user);
  const verifiedPin = useSecureSessionStore((s) => s.verifiedPin);
  const setVerifiedPin = useSecureSessionStore((s) => s.setVerifiedPin);

  useEffect(() => {
    if (note && loadedNoteIdRef.current !== note.id) {
      loadedNoteIdRef.current = note.id;
      setTitle(note.title);
      setContent(note.content ?? "");
      setColor(note.color ?? null);
      setIsProtected(note.isProtected);
      setAttachments(note.attachments ?? []);
      if (note.isProtected && note.locked) {
        // The whole point of a central lock: if this session already
        // verified the security PIN for some other note, reuse it here
        // silently instead of prompting again.
        if (verifiedPin) {
          api
            .post<{ note: Note }>(`/notes/${note.id}/unlock`, { pin: verifiedPin })
            .then(({ data }) => applyUnlockedNote(data.note))
            .catch(() => {
              setUnlocked(false);
              setShowLockModal("unlock");
            });
        } else {
          setUnlocked(false);
          setShowLockModal("unlock");
        }
      } else {
        setUnlocked(true);
      }
    }
  }, [note, verifiedPin, qc]);

  // The unlock endpoint's response already carries the real content (the
  // GET endpoint deliberately nulls it out for a locked note) — apply it
  // directly instead of relying on a refetch, since loadedNoteIdRef (see
  // above) would otherwise swallow that refetch as "already synced" and
  // leave the editor showing an empty note after a correct PIN.
  function applyUnlockedNote(unlockedNote: Note) {
    setTitle(unlockedNote.title);
    setContent(unlockedNote.content ?? "");
    setColor(unlockedNote.color ?? null);
    setAttachments(unlockedNote.attachments ?? []);
    setUnlocked(true);
    setShowLockModal(null);
  }

  async function ensureNoteCreated(): Promise<string> {
    if (noteId) return noteId;
    const { data } = await api.post<{ note: Note }>("/notes", { title, content });
    setNoteId(data.note.id);
    // Mark as already-synced before the redirect's fetch can land, so that
    // fetch (which only reflects this snapshot) never overwrites newer
    // local edits typed in the meantime.
    loadedNoteIdRef.current = data.note.id;
    qc.invalidateQueries({ queryKey: ["notes"] });
    navigate(`/notes/${data.note.id}`, { replace: true });
    return data.note.id;
  }

  function scheduleSave(next: { title?: string; content?: string; plainText?: string; color?: string | null }) {
    if (!canWrite) return;
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
      const { data } = await api.post<{ note: Note }>(`/notes/${id}/unlock`, { pin });
      setVerifiedPin(pin);
      applyUnlockedNote(data.note);
    } catch {
      setLockError("Incorrect PIN");
    }
  }

  // Locking a note is just "add it to the Secure section" — there's no
  // per-note PIN to type, that's the whole point of the central lock. The
  // one-time exception is a user who hasn't set a security PIN yet.
  async function handleToggleLock() {
    const nid = await ensureNoteCreated();
    if (isProtected) {
      await api.delete(`/notes/${nid}/lock`);
      setIsProtected(false);
      return;
    }
    if (!user?.hasSecurityPin) {
      navigate("/settings");
      return;
    }
    await api.post(`/notes/${nid}/lock`);
    setIsProtected(true);
  }

  async function shareViaDevice() {
    const plainText = document.createElement("div");
    plainText.innerHTML = content;
    const text = (plainText.textContent ?? "").slice(0, 500);

    // navigator.share hands off to the OS's own share sheet — the Android
    // share sheet, the Windows share flyout (Mail, WhatsApp Desktop,
    // Snapchat and anything else registered as a share target), or the
    // macOS/iOS share panel. There is no per-app integration to write:
    // whatever's installed and registered just shows up.
    if (navigator.share) {
      try {
        await navigator.share({ title: title || "Untitled note", text });
      } catch {
        // User cancelled the share sheet — not an error.
      }
      return;
    }

    // No Web Share API (older desktop browsers): fall back to copying
    // the note text so it can still be pasted into WhatsApp Web, Gmail, etc.
    await navigator.clipboard.writeText(`${title || "Untitled note"}\n\n${text}`);
    window.alert("Your browser doesn't support the native share sheet — the note was copied instead.");
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
      <div className="flex items-center gap-3 px-4 sm:px-6 py-3 border-b overflow-x-auto" style={{ borderColor: "var(--color-border)" }}>
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm shrink-0" style={{ color: "var(--color-text-muted)" }}>
          <ArrowLeft size={16} /> Back
        </button>
        <div className="flex items-center gap-2 ml-auto shrink-0">
          {!isOwner && (
            <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: "var(--color-hover)", color: "var(--color-text-muted)" }}>
              {canWrite ? "Can edit" : "View only"} · shared with you
            </span>
          )}
          {isOwner && (
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
          )}
          <button onClick={shareViaDevice} title="Share via WhatsApp, email, etc." className="flex items-center gap-1 text-sm px-2 py-1.5 rounded-lg hover-surface">
            <ShareIcon size={14} /> Share via…
          </button>
          {canWrite && <AudioRecorder onRecorded={(file) => uploadAttachment(file)} />}
          {isOwner && (
            <button onClick={() => setShowShareModal(true)} className="flex items-center gap-1 text-sm px-2 py-1.5 rounded-lg hover-surface">
              <Share2 size={14} /> Collaborators
            </button>
          )}
          {isOwner && (isProtected ? (
            <button onClick={handleToggleLock} className="flex items-center gap-1 text-sm px-2 py-1.5 rounded-lg hover-surface">
              <Unlock size={14} /> Remove from Secure
            </button>
          ) : (
            <button onClick={handleToggleLock} title={user?.hasSecurityPin ? undefined : "Set a security PIN first"} className="flex items-center gap-1 text-sm px-2 py-1.5 rounded-lg hover-surface">
              <Lock size={14} /> Add to Secure
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-4 sm:py-6 max-w-3xl mx-auto w-full" style={{ backgroundColor: color ?? "transparent" }}>
        <input
          value={title}
          disabled={!canWrite}
          onChange={(e) => { setTitle(e.target.value); scheduleSave({ title: e.target.value }); }}
          placeholder="Untitled"
          className="w-full text-2xl font-semibold outline-none mb-4 bg-transparent disabled:opacity-80"
        />
        <NoteEditor
          content={content}
          onChange={(html, text) => { setContent(html); scheduleSave({ content: html, plainText: text }); }}
          onUploadImage={uploadImage}
          paperStyle={paperStyle}
          onPaperStyleChange={canWrite ? setPaperStyle : undefined}
          editable={canWrite}
        />
        <AttachmentsPanel attachments={attachments} />
      </div>

      {showShareModal && noteId && <ShareModal noteId={noteId} onClose={() => setShowShareModal(false)} />}
    </div>
  );
}
