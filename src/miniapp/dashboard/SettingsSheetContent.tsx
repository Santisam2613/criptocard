"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";

import type { ThemeMode } from "@/styles/theme/theme";
import { readStoredThemeMode, setThemeMode } from "@/styles/theme/theme";
import { useI18n } from "@/i18n/i18n";
import { useBackendUser } from "@/miniapp/hooks/useBackendUser";
import { useTelegram } from "@/telegram/TelegramContext";

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

function LogoBadge({ avatarUrl }: { avatarUrl?: string | null }) {
  if (avatarUrl) {
    return (
      <div className="cc-glass inline-flex h-20 w-20 items-center justify-center rounded-full">
        <Image
          src={avatarUrl}
          alt=""
          width={80}
          height={80}
          className="h-20 w-20 rounded-full object-cover"
          sizes="80px"
        />
      </div>
    );
  }

  return (
    <div className="cc-glass inline-flex h-20 w-20 items-center justify-center rounded-full">
      <Image
        src="/assets/logo-header.png"
        alt="Criptocard"
        width={120}
        height={24}
        className="h-8 w-auto dark:hidden"
      />
      <Image
        src="/assets/logo-header-blanco.png"
        alt="Criptocard"
        width={120}
        height={24}
        className="hidden h-8 w-auto dark:block"
      />
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
  value?: ReactNode;
  onClick?: () => void;
}) {
  const content = (
    <>
      <div className="flex items-center gap-3">
        <div className="text-muted">
          <SettingsIcon type={icon} />
        </div>
        <div className="text-sm font-semibold text-foreground">{label}</div>
      </div>

      <div className="flex items-center gap-3">
        {value ? (
          <div className="text-sm font-semibold text-muted-2">{value}</div>
        ) : null}
        <div className="text-muted-2">
          <Chevron />
        </div>
      </div>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        onPointerDown={(e) => e.stopPropagation()}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
      >
        {content}
      </button>
    );
  }

  return (
    <div className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left">
      {content}
    </div>
  );
}

export default function SettingsSheetContent() {
  const { locale, setLocale, t } = useI18n();
  const [mode, setMode] = useState<ThemeMode>(() => readStoredThemeMode());
  const { user } = useBackendUser();
  const telegram = useTelegram();
  const avatarUrl =
    telegram.status === "ready"
      ? (telegram.user.photo_url ?? null)
      : (user?.telegram_photo_url ?? null);

  const displayName = useMemo(() => {
    if (telegram.status === "ready") {
      const first = telegram.user.first_name ?? "";
      const last = telegram.user.last_name ?? "";
      const full = `${first}${last ? ` ${last}` : ""}`.trim();
      if (full) return full;
      const username = telegram.user.username ? `@${telegram.user.username}` : "";
      if (username) return username;
      return `ID: ${telegram.user.id}`;
    }

    if (user) {
      if (user.telegram_first_name) {
        return `${user.telegram_first_name}${user.telegram_last_name ? ` ${user.telegram_last_name}` : ""}`;
      }
      if (user.telegram_username) return `@${user.telegram_username}`;
      if (user.telegram_id) return `ID: ${user.telegram_id}`;
    }

    return t("settings.placeholderName");
  }, [t, telegram, user]);

  const appearanceValue = useMemo(() => {
    if (mode === "dark") return t("nav.dark");
    if (mode === "light") return t("nav.light");
    return t("nav.system");
  }, [mode, t]);

  function cycleAppearance() {
    const next: ThemeMode =
      mode === "system" ? "light" : mode === "light" ? "dark" : "system";
    setMode(next);
    setThemeMode(next);
  }

  const languageValue = useMemo(() => {
    return locale === "es" ? t("nav.spanish") : t("nav.english");
  }, [locale, t]);

  function toggleLanguage() {
    setLocale(locale === "es" ? "en" : "es");
  }

  return (
    <div className="px-6 pb-8 pt-6 text-foreground">
      <div className="flex flex-col items-center">
        <LogoBadge avatarUrl={avatarUrl} />
        <div className="mt-5 text-2xl font-extrabold tracking-tight">
          {displayName}
        </div>
        {user ? (
          <div className="mt-1 text-sm font-semibold text-muted-2">
            {t(`verification.${user.verification_status}`)}
          </div>
        ) : null}
      </div>

      <div className="mt-8 space-y-4">
        <div className="cc-glass cc-neon-outline overflow-hidden rounded-2xl">
          <Row
            icon="user"
            label={t("settings.personalDetails")}
            value={
              user && user.verification_status === "approved"
                ? t("verification.approved")
                : t("settings.notVerified")
            }
          />
        </div>

        <div className="cc-glass cc-neon-outline overflow-hidden rounded-2xl">
          <div className="border-b border-glass-border">
            <Row
              icon="globe"
              label={t("settings.language")}
              value={languageValue}
              onClick={toggleLanguage}
            />
          </div>
          <Row
            icon="palette"
            label={t("settings.appearance")}
            value={appearanceValue}
            onClick={cycleAppearance}
          />
        </div>

        <div className="cc-glass cc-neon-outline overflow-hidden rounded-2xl">
          <Row icon="limits" label={t("settings.limitsFees")} />
        </div>

        <div className="cc-glass cc-neon-outline overflow-hidden rounded-2xl">
          <div className="border-b border-glass-border">
            <Row icon="question" label={t("settings.askQuestion")} />
          </div>
          <Row icon="privacy" label={t("settings.privacy")} />
        </div>
      </div>
    </div>
  );
}
