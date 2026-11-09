import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import DashboardLayout from "@/pages/DashboardLayout";
import NotesListPage from "@/pages/NotesListPage";
import NotePage from "@/pages/NotePage";
import { RequireAuth } from "@/components/RequireAuth";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route element={<RequireAuth />}>
            <Route element={<DashboardLayout />}>
              <Route path="/" element={<NotesListPage view="all" />} />
              <Route path="/favorites" element={<NotesListPage view="favorites" />} />
              <Route path="/pinned" element={<NotesListPage view="pinned" />} />
              <Route path="/archived" element={<NotesListPage view="archived" />} />
              <Route path="/trash" element={<NotesListPage view="trash" />} />
              <Route path="/folders/:folderId" element={<NotesListPage view="all" />} />
              <Route path="/notes/:id" element={<NotePage />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
