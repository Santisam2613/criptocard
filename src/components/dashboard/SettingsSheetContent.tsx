"use client";

import { useMemo, useState } from "react";

import type { ThemeMode } from "@/components/theme/theme";
import { readStoredThemeMode, setThemeMode } from "@/components/theme/theme";

function SettingsIcon({
  type,
}: {
  type: "user" | "globe" | "palette" | "limits" | "question" | "privacy";
}) {
  switch (type) {
    case "user":
      return (
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20 21a8 8 0 0 0-16 0" />
          <path d="M12 11a4 4 0 1 0-4-4 4 4 0 0 0 4 4z" />
        </svg>
      );
    case "globe":
      return (
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 22a10 10 0 1 0-10-10 10 10 0 0 0 10 10z" />
          <path d="M2 12h20" />
          <path d="M12 2a15 15 0 0 1 0 20" />
          <path d="M12 2a15 15 0 0 0 0 20" />
        </svg>
      );
    case "palette":
      return (
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 22a10 10 0 1 0-10-10 10 10 0 0 0 10 10z" />
          <path d="M7 14a2 2 0 1 0 0-4" />
          <path d="M17 13a2 2 0 1 0 0-4" />
          <path d="M12 11a2 2 0 1 0 0-4" />
          <path d="M14 17a3 3 0 0 0-3-3" />
        </svg>
      );
    case "limits":
      return (
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M7 7h10" />
          <path d="M7 12h10" />
          <path d="M7 17h10" />
          <path d="M4 4h16v16H4z" />
        </svg>
      );
    case "question":
      return (
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15a4 4 0 0 1-4 4H8l-5 2V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
          <path d="M12 8a2 2 0 0 1 2 2c0 1.5-2 1.5-2 3" />
          <path d="M12 16h.01" />
        </svg>
      );
    case "privacy":
      return (
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 2l8 4v6c0 5-3.5 9.7-8 10-4.5-.3-8-5-8-10V6l8-4z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      );
  }
}

function Chevron() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

function LogoBadge() {
  return (
    <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-surface shadow-[inset_0_0_0_1px_rgba(0,0,0,0.08)]">
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="h-9 w-9 text-zinc-950 dark:text-brand"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 3l8 18H4L12 3z" />
      </svg>
    </div>
  );
}

function Row({
  icon,
  label,
  value,
  onClick,
}: {
  icon: "user" | "globe" | "palette" | "limits" | "question" | "privacy";
  label: string;
  value?: string;
  onClick?: () => void;
}) {
  const Root = onClick ? "button" : "div";
  return (
    <Root
      {...(onClick
        ? { type: "button", onClick }
        : {})}
      className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
    >
      <div className="flex items-center gap-3">
        <div className="text-muted">
          <SettingsIcon type={icon} />
        </div>
        <div className="text-sm font-semibold text-foreground">
          {label}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {value ? (
          <div className="text-sm font-semibold text-muted-2">
            {value}
          </div>
        ) : null}
        <div className="text-muted-2">
          <Chevron />
        </div>
      </div>
    </Root>
  );
}

export default function SettingsSheetContent() {
  const [mode, setMode] = useState<ThemeMode>(() => readStoredThemeMode());

  const appearanceValue = useMemo(() => {
    if (mode === "dark") return "Dark";
    if (mode === "light") return "Light";
    return "System";
  }, [mode]);

  function cycleAppearance() {
    const next: ThemeMode =
      mode === "system" ? "light" : mode === "light" ? "dark" : "system";
    setMode(next);
    setThemeMode(next);
  }

  return (
    <div className="px-6 pb-8 pt-6 text-foreground">
      <div className="flex flex-col items-center">
        <LogoBadge />
        <div className="mt-5 text-2xl font-extrabold tracking-tight">
          None None
        </div>
      </div>

      <div className="mt-8 space-y-4">
        <div className="overflow-hidden rounded-2xl border border-border bg-surface">
          <Row icon="user" label="Personal Details" value="Not verified" />
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-surface">
          <div className="border-b border-border">
            <Row icon="globe" label="Language" value="English" />
          </div>
          <Row
            icon="palette"
            label="Appearance"
            value={appearanceValue}
            onClick={cycleAppearance}
          />
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-surface">
          <Row icon="limits" label="Limits and Fees" />
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-surface">
          <div className="border-b border-border">
            <Row icon="question" label="Ask question" />
          </div>
          <Row icon="privacy" label="Privacy Policy" />
        </div>
      </div>
    </div>
  );
}
