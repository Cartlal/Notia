import { Outlet } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";

export default function DashboardLayout() {
  return (
    <div className="flex" style={{ backgroundColor: "var(--color-bg)" }}>
      <Sidebar />
      <main className="flex-1 h-screen overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
