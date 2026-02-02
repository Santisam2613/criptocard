 "use client";

import Button from "@/components/Button";
import { useEffect, useId, useState } from "react";

import type { ThemeMode } from "@/components/theme/theme";
import { readStoredThemeMode, setThemeMode } from "@/components/theme/theme";

function TelegramIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-4 w-4"
      fill="currentColor"
    >
      <path d="M21.9 4.6c.3-1.3-1-2.4-2.2-1.9L2.8 9.2c-1.4.5-1.4 2.5 0 3l4.3 1.5 1.6 5.2c.4 1.2 1.9 1.6 2.9.8l2.8-2.3 4.3 3.2c1 .7 2.4.2 2.7-1l2.7-15zM8.1 12.7l9.8-6.1c.2-.1.4.2.2.4l-8 7.3c-.3.3-.5.7-.5 1.1l-.3 3.1c0 .3-.4.4-.5.1l-1.1-3.7c-.2-.6.1-1.4.7-1.7z" />
    </svg>
  );
}

function LogoMark() {
  return (
    <svg
      viewBox="0 0 36 16"
      aria-hidden="true"
      className="h-4 w-auto"
      fill="currentColor"
    >
      <path d="M11.8 8 1 3.6v8.8L11.8 8Z" />
      <path d="M14.5 8c3.7 0 6-3.1 7.5-5.2 1.1-1.6 2-2.8 3.4-2.8 1.9 0 3.6 2.2 4.9 4.1.9 1.3 1.6 2.2 2.2 2.2.6 0 1.3-.9 2.2-2.2 1.3-1.9 3-4.1 4.9-4.1v2c-1 0-2.3 1.8-3.3 3.2-1.2 1.7-2.3 3.2-3.8 3.2s-2.6-1.5-3.8-3.2C28.8 3.8 27.5 2 26.5 2c-.4 0-1.2 1-1.9 2.1C22.9 6.5 20.2 10 14.5 10V8Z" />
    </svg>
  );
}

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      {open ? (
        <>
          <path d="M6 6l12 12" />
          <path d="M18 6L6 18" />
        </>
      ) : (
        <>
          <path d="M4 7h16" />
          <path d="M4 12h16" />
          <path d="M4 17h16" />
        </>
      )}
    </svg>
  );
}

function ThemeModeButtons() {
  const [mode, setMode] = useState<ThemeMode>(() => readStoredThemeMode());

  useEffect(() => {
    const onTheme = (e: Event) => {
      const next = (e as CustomEvent).detail as ThemeMode | undefined;
      if (next === "light" || next === "dark" || next === "system") {
        setMode(next);
      }
    };
    window.addEventListener("cc-theme-mode", onTheme);
    return () => window.removeEventListener("cc-theme-mode", onTheme);
  }, []);

  function renderIcon(kind: ThemeMode) {
    if (kind === "light") {
      return (
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 3v2" />
          <path d="M12 19v2" />
          <path d="M4.2 6.2l1.4 1.4" />
          <path d="M18.4 16.4l1.4 1.4" />
          <path d="M3 12h2" />
          <path d="M19 12h2" />
          <path d="M4.2 17.8l1.4-1.4" />
          <path d="M18.4 7.6l1.4-1.4" />
          <path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" />
        </svg>
      );
    }

    if (kind === "dark") {
      return (
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 12.8A8.5 8.5 0 0 1 11.2 3a7 7 0 1 0 9.8 9.8z" />
        </svg>
      );
    }

    return (
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 6h16" />
        <path d="M4 18h16" />
        <path d="M6 6v9a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3V6" />
        <path d="M10 10h4" />
      </svg>
    );
  }

  return (
    <div
      className="inline-flex items-center gap-1 rounded-full border border-border bg-surface p-1"
      role="group"
      aria-label="Theme"
    >
      {(["system", "light", "dark"] as const).map((value) => {
        const selected = mode === value;
        return (
          <button
            key={value}
            type="button"
            aria-pressed={selected}
            onClick={() => {
              setMode(value);
              setThemeMode(value);
            }}
            className={[
              "inline-flex h-8 w-8 items-center justify-center rounded-full border transition-colors",
              selected
                ? "border-border bg-surface-2 text-foreground"
                : "border-transparent text-muted hover:bg-surface-2",
            ].join(" ")}
          >
            <span className="sr-only">{value}</span>
            {renderIcon(value)}
          </button>
        );
      })}
    </div>
  );
}

export default function Header() {
  const [open, setOpen] = useState(false);
  const menuId = useId();

  return (
    <header className="relative bg-background text-foreground">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5 lg:px-10">
        <div className="flex items-center gap-2">
          <LogoMark />
          <span className="text-base font-bold tracking-tight">Criptocard</span>
        </div>

        <div className="hidden items-center gap-3 sm:flex">
          <div className="inline-flex items-center gap-3">
            <div className="text-sm font-medium text-foreground">Personal</div>
            <div className="text-sm font-medium text-muted-2">
              Empresa <span className="text-muted">(Próximamente)</span>
            </div>
          </div>
          <ThemeModeButtons />
        </div>

        <div className="hidden sm:block">
          <Button href="#" variant="lime" leftIcon={<TelegramIcon />}>
            Get Your Criptocard
          </Button>
        </div>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls={menuId}
          onClick={() => setOpen((v) => !v)}
        >
          <MenuIcon open={open} />
        </button>
      </div>

      <div
        id={menuId}
        className={[
          "sm:hidden",
          "absolute left-0 right-0 top-full z-20 origin-top bg-background text-foreground shadow-[0_24px_50px_rgba(0,0,0,0.12)]",
          "transition-[transform,opacity] duration-200 ease-out",
          open ? "scale-y-100 opacity-100" : "pointer-events-none scale-y-95 opacity-0",
        ].join(" ")}
      >
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 pb-6 lg:px-10">
          <div className="flex items-center justify-between pt-2">
            <div className="text-sm font-medium text-foreground">Personal</div>
            <ThemeModeButtons />
          </div>
          <div className="text-sm font-medium text-muted-2">
            Empresa <span className="text-muted">(Próximamente)</span>
          </div>
          <Button
            href="#"
            variant="lime"
            leftIcon={<TelegramIcon />}
            className="w-full"
            onClick={() => setOpen(false)}
          >
            Get Your Criptocard
          </Button>
        </div>
      </div>
    </header>
  );
}
