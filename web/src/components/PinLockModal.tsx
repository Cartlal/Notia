import { useState } from "react";
import { Lock } from "lucide-react";

export function PinLockModal({
  mode,
  onSubmit,
  onCancel,
  error,
}: {
  mode: "set" | "unlock";
  onSubmit: (pin: string) => void;
  onCancel: () => void;
  error?: string | null;
}) {
  const [pin, setPin] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <form
        onSubmit={(e) => { e.preventDefault(); onSubmit(pin); }}
        className="w-full max-w-xs rounded-2xl p-6 note-card shadow-xl"
      >
        <div className="flex items-center gap-2 mb-3">
          <Lock size={18} className="text-brand-600" />
          <h2 className="font-semibold">{mode === "set" ? "Set a PIN" : "Enter PIN"}</h2>
        </div>
        <p className="text-sm mb-4" style={{ color: "var(--color-text-muted)" }}>
          {mode === "set"
            ? "This PIN will be required to open this note (also usable with fingerprint unlock on the mobile app)."
            : "This note is protected. Enter the PIN to continue."}
        </p>
        <input
          autoFocus
          type="password"
          inputMode="numeric"
          minLength={4}
          maxLength={12}
          required
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          placeholder="4–12 digit PIN"
          className="w-full rounded-lg border px-3 py-2 text-sm text-center tracking-widest outline-none focus:ring-2 focus:ring-brand-400 mb-2"
          style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg)" }}
        />
        {error && <p className="text-sm text-red-500 mb-2">{error}</p>}
        <div className="flex gap-2 mt-4">
          <button type="button" onClick={onCancel} className="flex-1 rounded-lg border py-2 text-sm" style={{ borderColor: "var(--color-border)" }}>
            Cancel
          </button>
          <button type="submit" className="flex-1 rounded-lg bg-brand-600 text-white py-2 text-sm font-medium hover:bg-brand-700">
            {mode === "set" ? "Save" : "Unlock"}
          </button>
        </div>
      </form>
    </div>
  );
}
