export default function ThemeScript() {
  return (
    <script
      id="theme-script"
      dangerouslySetInnerHTML={{
        __html: `
(() => {
  const key = "theme-mode";
  const root = document.documentElement;
  const mq = window.matchMedia("(prefers-color-scheme: dark)");

  function apply(mode) {
    root.classList.remove("light", "dark");
    if (mode === "light") {
      root.classList.add("light");
      return;
    }
    if (mode === "dark") {
      root.classList.add("dark");
      return;
    }
    root.classList.toggle("dark", mq.matches);
  }

  function setMode(mode) {
    window.__themeMode = mode;
    try { localStorage.setItem(key, mode); } catch {}
    try { window.dispatchEvent(new CustomEvent("cc-theme-mode", { detail: mode })); } catch {}
    apply(mode);
  }

  window.__setThemeMode = setMode;
  let stored = "system";
  try {
    const v = localStorage.getItem(key);
    if (v === "light" || v === "dark" || v === "system") stored = v;
  } catch {}
  window.__themeMode = stored;
  apply(stored);

  mq.addEventListener("change", () => {
    if (window.__themeMode === "system") apply("system");
  });
})();
        `,
      }}
    />
  );
}
