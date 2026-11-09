import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Menu } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { Logo } from "@/components/Logo";

export default function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex" style={{ backgroundColor: "var(--color-bg)" }}>
      {/* Mobile top bar: the 256px static sidebar doesn't fit phone widths,
          so below the md breakpoint it becomes a slide-in drawer instead. */}
      <div
        className="md:hidden fixed top-0 inset-x-0 z-30 flex items-center justify-between px-3 py-2 border-b"
        style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg)" }}
      >
        <button onClick={() => setMobileOpen(true)} className="p-2 rounded-lg hover-surface" aria-label="Open menu">
          <Menu size={20} />
        </button>
        <Logo size={22} />
        <div className="w-9" />
      </div>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/40" onClick={() => setMobileOpen(false)} />
      )}

      <div
        onClick={() => setMobileOpen(false)}
        className={`fixed inset-y-0 left-0 z-50 w-64 transition-transform duration-200 md:static md:translate-x-0 md:z-auto ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar />
      </div>

      <main className="flex-1 h-screen overflow-y-auto pt-12 md:pt-0">
        <Outlet />
      </main>
    </div>
  );
}
