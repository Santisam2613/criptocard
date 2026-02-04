export type ThemeMode = "system" | "light" | "dark";

export const THEME_STORAGE_KEY = "theme-mode";

export function readStoredThemeMode(): ThemeMode {
  if (typeof window === "undefined") return "system";
  const value = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (value === "light" || value === "dark" || value === "system") return value;
  return "system";
}

export function setStoredThemeMode(mode: ThemeMode) {
  window.localStorage.setItem(THEME_STORAGE_KEY, mode);
}

export function applyThemeMode(mode: ThemeMode) {
  const root = document.documentElement;
  root.classList.remove("light", "dark");

  if (mode === "light") {
    root.classList.add("light");
    return;
  }

  if (mode === "dark") {
    root.classList.add("dark");
    return;
  }

  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  root.classList.toggle("dark", prefersDark);
}

export function setThemeMode(mode: ThemeMode) {
  setStoredThemeMode(mode);
  window.dispatchEvent(new CustomEvent("cc-theme-mode", { detail: mode }));
  const setter = (window as unknown as { __setThemeMode?: (m: ThemeMode) => void })
    .__setThemeMode;
  if (setter) {
    setter(mode);
    return;
  }
  applyThemeMode(mode);
}
