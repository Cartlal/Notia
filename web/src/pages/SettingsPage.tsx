import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block mb-4">
      <span className="block text-sm font-medium mb-1">{label}</span>
      {children}
    </label>
  );
}

const inputClass = "w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-400";
const inputStyle = { borderColor: "var(--color-border)", backgroundColor: "var(--color-bg)" };

export default function SettingsPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const clear = useAuthStore((s) => s.clear);

  const [name, setName] = useState(user?.name ?? "");
  const [savingName, setSavingName] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);

  async function saveName(e: React.FormEvent) {
    e.preventDefault();
    setSavingName(true);
    setNameSaved(false);
    try {
      const { data } = await api.patch("/auth/me", { name });
      setUser(data.user);
      setNameSaved(true);
    } finally {
      setSavingName(false);
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSaved(false);
    setSavingPassword(true);
    try {
      await api.post("/auth/change-password", { currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setPasswordSaved(true);
    } catch (err: any) {
      setPasswordError(err.response?.data?.message ?? "Couldn't change your password");
    } finally {
      setSavingPassword(false);
    }
  }

  async function deleteAccount() {
    setDeleting(true);
    try {
      await api.delete("/auth/me");
      clear();
      navigate("/login");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--color-bg)" }}>
      <div className="flex items-center gap-3 px-6 py-3 border-b" style={{ borderColor: "var(--color-border)" }}>
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm hover-surface rounded-lg px-2 py-1.5" style={{ color: "var(--color-text-muted)" }}>
          <ArrowLeft size={16} /> Back
        </button>
        <h1 className="text-lg font-semibold">Profile & settings</h1>
      </div>

      <div className="max-w-lg mx-auto px-6 py-8">
        <section className="mb-10">
          <h2 className="text-sm font-semibold uppercase mb-3" style={{ color: "var(--color-text-muted)" }}>Profile</h2>
          <form onSubmit={saveName} className="note-card rounded-xl p-4">
            <Field label="Email">
              <input value={user?.email ?? ""} disabled className={`${inputClass} opacity-60`} style={inputStyle} />
            </Field>
            <Field label="Full name">
              <input value={name} onChange={(e) => { setName(e.target.value); setNameSaved(false); }} className={inputClass} style={inputStyle} />
            </Field>
            <div className="flex items-center gap-3">
              <button type="submit" disabled={savingName} className="rounded-lg bg-brand-600 text-white px-4 py-2 text-sm font-medium hover:bg-brand-700 disabled:opacity-60">
                {savingName ? "Saving…" : "Save name"}
              </button>
              {nameSaved && <span className="text-sm text-green-600">Saved</span>}
            </div>
          </form>
        </section>

        <section className="mb-10">
          <h2 className="text-sm font-semibold uppercase mb-3" style={{ color: "var(--color-text-muted)" }}>Change password</h2>
          <form onSubmit={changePassword} className="note-card rounded-xl p-4">
            <Field label="Current password">
              <input type="password" required value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className={inputClass} style={inputStyle} />
            </Field>
            <Field label="New password (min 8 characters)">
              <input type="password" required minLength={8} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={inputClass} style={inputStyle} />
            </Field>
            {passwordError && <p className="text-sm text-red-500 mb-3">{passwordError}</p>}
            <div className="flex items-center gap-3">
              <button type="submit" disabled={savingPassword} className="rounded-lg bg-brand-600 text-white px-4 py-2 text-sm font-medium hover:bg-brand-700 disabled:opacity-60">
                {savingPassword ? "Updating…" : "Update password"}
              </button>
              {passwordSaved && <span className="text-sm text-green-600">Password updated</span>}
            </div>
          </form>
        </section>

        <section>
          <h2 className="text-sm font-semibold uppercase mb-3 text-red-600">Danger zone</h2>
          <div className="rounded-xl border p-4" style={{ borderColor: "#FCA5A5" }}>
            <p className="text-sm mb-3" style={{ color: "var(--color-text-muted)" }}>
              Permanently deletes your account and every note, folder, and attachment you own. This cannot be undone.
            </p>
            <input
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder={`Type "delete" to confirm`}
              className={inputClass}
              style={inputStyle}
            />
            <button
              onClick={deleteAccount}
              disabled={deleteConfirm.trim().toLowerCase() !== "delete" || deleting}
              className="mt-3 rounded-lg bg-red-600 text-white px-4 py-2 text-sm font-medium hover:bg-red-700 disabled:opacity-40"
            >
              {deleting ? "Deleting…" : "Delete my account"}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
