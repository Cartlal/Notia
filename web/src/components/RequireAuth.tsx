import { Navigate, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

export function RequireAuth() {
  const { accessToken, setAuth } = useAuthStore();
  const [checking, setChecking] = useState(!accessToken);

  useEffect(() => {
    if (accessToken) {
      setChecking(false);
      return;
    }
    api
      .post("/auth/refresh")
      .then(({ data }) => api.get("/auth/me", { headers: { Authorization: `Bearer ${data.accessToken}` } })
        .then((me) => setAuth(me.data.user, data.accessToken)))
      .catch(() => {})
      .finally(() => setChecking(false));
  }, []);

  if (checking) return null;
  if (!useAuthStore.getState().accessToken) return <Navigate to="/login" replace />;
  return <Outlet />;
}
