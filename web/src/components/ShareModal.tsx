import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { X, UserPlus, Eye, Pencil, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import type { Collaborator, CollaboratorRole } from "@/lib/types";

const MAX_COLLABORATORS = 5;

export function ShareModal({ noteId, onClose }: { noteId: string; onClose: () => void }) {
  const qc = useQueryClient();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<CollaboratorRole>("VIEWER");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { data: collaborators = [], isLoading } = useQuery({
    queryKey: ["collaborators", noteId],
    queryFn: async () => (await api.get<{ collaborators: Collaborator[] }>(`/notes/${noteId}/collaborators`)).data.collaborators,
  });

  function invalidate() {
    qc.invalidateQueries({ queryKey: ["collaborators", noteId] });
  }

  async function addCollaborator(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.post(`/notes/${noteId}/collaborators`, { email, role });
      setEmail("");
      invalidate();
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Couldn't add that person");
    } finally {
      setSubmitting(false);
    }
  }

  async function changeRole(id: string, newRole: CollaboratorRole) {
    await api.patch(`/notes/${noteId}/collaborators/${id}`, { role: newRole });
    invalidate();
  }

  async function remove(id: string) {
    await api.delete(`/notes/${noteId}/collaborators/${id}`);
    invalidate();
  }

  const atLimit = collaborators.length >= MAX_COLLABORATORS;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-2xl p-6 note-card shadow-xl">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-semibold text-lg">Share note</h2>
          <button onClick={onClose} className="p-1 rounded hover-surface"><X size={18} /></button>
        </div>
        <p className="text-sm mb-4" style={{ color: "var(--color-text-muted)" }}>
          Up to {MAX_COLLABORATORS} people, each with view-only or edit access.
        </p>

        <form onSubmit={addCollaborator} className="flex gap-2 mb-4">
          <input
            type="email"
            required
            disabled={atLimit}
            placeholder={atLimit ? `Limit of ${MAX_COLLABORATORS} reached` : "Email address"}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-400 disabled:opacity-50"
            style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg)" }}
          />
          <select
            value={role}
            disabled={atLimit}
            onChange={(e) => setRole(e.target.value as CollaboratorRole)}
            className="rounded-lg border px-2 py-2 text-sm outline-none disabled:opacity-50"
            style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg)" }}
          >
            <option value="VIEWER">Can view</option>
            <option value="EDITOR">Can edit</option>
          </select>
          <button
            type="submit"
            disabled={atLimit || submitting}
            className="rounded-lg bg-brand-600 text-white px-3 py-2 text-sm font-medium hover:bg-brand-700 disabled:opacity-50 flex items-center gap-1"
          >
            <UserPlus size={14} />
          </button>
        </form>
        {error && <p className="text-sm text-red-500 mb-3">{error}</p>}

        {isLoading && <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Loading…</p>}

        <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
          {collaborators.map((c) => (
            <div key={c.id} className="flex items-center justify-between gap-2 rounded-lg border p-2" style={{ borderColor: "var(--color-border)" }}>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{c.user.name}</p>
                <p className="text-xs truncate" style={{ color: "var(--color-text-muted)" }}>{c.user.email}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  title="View only"
                  onClick={() => changeRole(c.id, "VIEWER")}
                  className={`p-1.5 rounded ${c.role === "VIEWER" ? "bg-brand-100 text-brand-700" : "hover-surface"}`}
                >
                  <Eye size={14} />
                </button>
                <button
                  title="Can edit"
                  onClick={() => changeRole(c.id, "EDITOR")}
                  className={`p-1.5 rounded ${c.role === "EDITOR" ? "bg-brand-100 text-brand-700" : "hover-surface"}`}
                >
                  <Pencil size={14} />
                </button>
                <button title="Remove" onClick={() => remove(c.id)} className="p-1.5 rounded hover-surface text-red-500">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
          {!isLoading && collaborators.length === 0 && (
            <p className="text-sm text-center py-4" style={{ color: "var(--color-text-muted)" }}>Not shared with anyone yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
