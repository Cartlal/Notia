import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

export default function RegisterPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { data } = await api.post("/auth/register", { name, email, password });
      setAuth(data.user, data.accessToken);
      navigate("/");
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: "var(--color-bg-subtle)" }}>
      <div className="w-full max-w-sm rounded-2xl p-8 note-card shadow-sm">
        <div className="mb-6 flex justify-center"><Logo size={36} /></div>
        <h1 className="text-xl font-semibold text-center mb-1">Create your account</h1>
        <p className="text-sm text-center mb-6" style={{ color: "var(--color-text-muted)" }}>Start capturing your ideas</p>
        <form onSubmit={onSubmit} className="space-y-4">
          <input
            required placeholder="Full name" value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-400"
            style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg)" }}
          />
          <input
            type="email" required placeholder="Email" value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-400"
            style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg)" }}
          />
          <input
            type="password" required minLength={8} placeholder="Password (min 8 chars)" value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-400"
            style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg)" }}
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button
            disabled={loading}
            className="w-full rounded-lg bg-brand-600 text-white py-2 text-sm font-medium hover:bg-brand-700 disabled:opacity-60"
          >
            {loading ? "Creating…" : "Create account"}
          </button>
        </form>
        <p className="text-sm text-center mt-6" style={{ color: "var(--color-text-muted)" }}>
          Already have an account? <Link to="/login" className="text-brand-600 font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
