import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Eye, Pencil } from "lucide-react";
import { api } from "@/lib/api";
import { Logo } from "@/components/Logo";
import { NoteEditor } from "@/components/NoteEditor";

type LoadState = "loading" | "ready" | "not_found" | "expired" | "locked";

export default function PublicNotePage() {
  const { token } = useParams();
  const [state, setState] = useState<LoadState>("loading");
  const [role, setRole] = useState<"VIEWER" | "EDITOR">("VIEWER");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    api
      .get(`/public/notes/${token}`)
      .then(({ data }) => {
        setRole(data.role);
        setTitle(data.note.title);
        setContent(data.note.content ?? "");
        setState("ready");
      })
      .catch((err) => {
        const code = err.response?.data?.error;
        if (code === "link_expired") setState("expired");
        else if (code === "note_locked") setState("locked");
        else setState("not_found");
      });
  }, [token]);

  function scheduleSave(next: { title?: string; content?: string; plainText?: string }) {
    if (role !== "EDITOR") return;
    setSaving(true);
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      await api.patch(`/public/notes/${token}`, next);
      setSaving(false);
    }, 500);
  }

  async function uploadImage(): Promise<string> {
    // Anonymous link viewers can't attach new files (no owner session to
    // own the upload) — this keeps the editor's image button a no-op here.
    throw new Error("Image upload isn't available on a shared link");
  }

  if (state === "loading") {
    return <div className="min-h-screen flex items-center justify-center">Loading…</div>;
  }

  if (state !== "ready") {
    const messages: Record<string, string> = {
      not_found: "This link doesn't exist or was revoked.",
      expired: "This link has expired.",
      locked: "This note is PIN-protected and no longer shareable by link.",
    };
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 px-4 text-center" style={{ backgroundColor: "var(--color-bg-subtle)" }}>
        <Logo size={32} />
        <p style={{ color: "var(--color-text-muted)" }}>{messages[state]}</p>
        <Link to="/login" className="text-brand-600 text-sm font-medium">Sign in to Notia</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--color-bg)" }}>
      <div className="flex items-center justify-between px-6 py-3 border-b" style={{ borderColor: "var(--color-border)" }}>
        <Logo size={24} />
        <div className="flex items-center gap-3 text-sm" style={{ color: "var(--color-text-muted)" }}>
          <span className="flex items-center gap-1">
            {role === "EDITOR" ? <Pencil size={14} /> : <Eye size={14} />}
            {role === "EDITOR" ? "Anyone with this link can edit" : "View only"}
          </span>
          {saving && <span>Saving…</span>}
          <Link to="/login" className="text-brand-600 font-medium">Sign in</Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-8 py-8">
        <input
          value={title}
          disabled={role !== "EDITOR"}
          onChange={(e) => { setTitle(e.target.value); scheduleSave({ title: e.target.value }); }}
          placeholder="Untitled"
          className="w-full text-2xl font-semibold outline-none mb-4 bg-transparent disabled:opacity-80"
        />
        <NoteEditor
          content={content}
          onChange={(html, text) => { setContent(html); scheduleSave({ content: html, plainText: text }); }}
          onUploadImage={uploadImage}
          editable={role === "EDITOR"}
        />
      </div>
    </div>
  );
}
