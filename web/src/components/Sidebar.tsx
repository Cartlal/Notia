import { NavLink, useNavigate } from "react-router-dom";
import { Home, Star, Pin, Archive, Trash2, Folder as FolderIcon, Tag as TagIcon, Plus, LogOut, Sun, Moon, Users } from "lucide-react";
import { Logo } from "@/components/Logo";
import { useFolders, useTags } from "@/hooks/useNotes";
import { useAuthStore } from "@/store/authStore";
import { useThemeStore } from "@/store/themeStore";
import { api } from "@/lib/api";

const navItems = [
  { to: "/", icon: Home, label: "All notes" },
  { to: "/favorites", icon: Star, label: "Favorites" },
  { to: "/pinned", icon: Pin, label: "Pinned" },
  { to: "/shared", icon: Users, label: "Shared with me" },
  { to: "/archived", icon: Archive, label: "Archive" },
  { to: "/trash", icon: Trash2, label: "Trash" },
];

export function Sidebar() {
  const navigate = useNavigate();
  const { data: folders = [] } = useFolders();
  const { data: tags = [] } = useTags();
  const user = useAuthStore((s) => s.user);
  const clear = useAuthStore((s) => s.clear);
  const { theme, setTheme } = useThemeStore();

  async function logout() {
    await api.post("/auth/logout");
    clear();
    navigate("/login");
  }

  return (
    <aside className="w-64 h-screen flex flex-col border-r px-3 py-4" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg-subtle)" }}>
      <div className="px-2 mb-6"><Logo /></div>

      <button
        onClick={() => navigate("/notes/new")}
        className="mb-4 flex items-center justify-center gap-2 rounded-lg bg-brand-600 text-white py-2 text-sm font-medium hover:bg-brand-700"
      >
        <Plus size={16} /> New note
      </button>

      <nav className="space-y-1 text-sm">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-2 rounded-lg px-2.5 py-2 transition-colors ${isActive ? "bg-brand-100 text-brand-700 font-medium" : "hover-surface"}`
            }
          >
            <Icon size={16} /> {label}
          </NavLink>
        ))}
      </nav>

      {folders.length > 0 && (
        <div className="mt-6">
          <p className="px-2 text-xs font-semibold uppercase mb-1" style={{ color: "var(--color-text-muted)" }}>Folders</p>
          <nav className="space-y-1 text-sm">
            {folders.map((f) => (
              <NavLink key={f.id} to={`/folders/${f.id}`} className="flex items-center gap-2 rounded-lg px-2.5 py-2 hover-surface">
                <FolderIcon size={16} /> {f.name}
              </NavLink>
            ))}
          </nav>
        </div>
      )}

      {tags.length > 0 && (
        <div className="mt-4">
          <p className="px-2 text-xs font-semibold uppercase mb-1" style={{ color: "var(--color-text-muted)" }}>Tags</p>
          <nav className="space-y-1 text-sm">
            {tags.map((t) => (
              <NavLink key={t.id} to={`/tags/${t.id}`} className="flex items-center gap-2 rounded-lg px-2.5 py-2 hover-surface">
                <TagIcon size={16} /> {t.name}
              </NavLink>
            ))}
          </nav>
        </div>
      )}

      <div className="mt-auto space-y-1 text-sm pt-4 border-t" style={{ borderColor: "var(--color-border)" }}>
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 hover-surface"
        >
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />} Toggle theme
        </button>
        <div className="flex items-center gap-2 px-2.5 py-2 text-xs" style={{ color: "var(--color-text-muted)" }}>
          {user?.name}
        </div>
        <button onClick={logout} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 hover-surface text-red-500">
          <LogOut size={16} /> Log out
        </button>
      </div>
    </aside>
  );
}
