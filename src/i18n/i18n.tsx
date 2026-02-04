"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { en } from "@/i18n/en";
import { es } from "@/i18n/es";

export type Locale = "en" | "es";

export const LOCALE_STORAGE_KEY = "cc-locale";

const dictionaries = { en, es } as const;

type Dict = typeof en;

type I18nContextValue = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (path: string) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

function detectBrowserLocale(): Locale {
  if (typeof navigator === "undefined") return "en";
  const lang = (navigator.language || "").toLowerCase();
  if (lang.startsWith("es")) return "es";
  return "en";
}

function readStoredLocale(): Locale | null {
  if (typeof window === "undefined") return null;
  const v = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  return v === "es" || v === "en" ? v : null;
}

function writeStoredLocale(locale: Locale) {
  window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
}

function getByPath(obj: unknown, path: string): unknown {
  const parts = path.split(".");
  let cur: unknown = obj;
  for (const p of parts) {
    if (!cur || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[p];
  }
  return cur;
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    const t = window.setTimeout(() => {
      const stored = readStoredLocale();
      setLocaleState(stored ?? detectBrowserLocale());
    }, 0);
    return () => window.clearTimeout(t);
  }, []);

  const dict = useMemo(() => dictionaries[locale] as Dict, [locale]);

  const value = useMemo<I18nContextValue>(() => {
    return {
      locale,
      setLocale: (l) => {
        setLocaleState(l);
        writeStoredLocale(l);
        window.dispatchEvent(new CustomEvent("cc-locale", { detail: l }));
      },
      t: (path) => {
        const v = getByPath(dict, path);
        if (typeof v === "string") return v;
        const fallback = getByPath(dictionaries.en, path);
        if (typeof fallback === "string") return fallback;
        return path;
      },
    };
  }, [dict, locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
