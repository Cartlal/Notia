import { create } from "zustand";

type Theme = "light" | "dark" | "system";

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  // "system" is still a selectable preference (kept for anyone who sets it
  // explicitly), but it is never the *default* — a first-time visitor (or
  // one whose OS prefers dark) always lands on light, set explicitly here
  // rather than left unset for the prefers-color-scheme media query to
  // decide. See index.css: that query only applies when data-theme isn't
  // "light", so this is what keeps a dark-mode OS from hijacking first load.
  if (theme === "system") root.setAttribute("data-theme", "light");
  else root.setAttribute("data-theme", theme);
  localStorage.setItem("notia-theme", theme);
}

const initial = (localStorage.getItem("notia-theme") as Theme) ?? "light";
applyTheme(initial);

export const useThemeStore = create<ThemeState>((set) => ({
  theme: initial,
  setTheme: (theme) => {
    applyTheme(theme);
    set({ theme });
  },
}));
