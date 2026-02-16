"use client";

import type { ReactNode } from "react";
import { useEffect, useId, useMemo, useState } from "react";
import Image from "next/image";

import BottomSheet from "@/components/ui/BottomSheet";
import { useI18n } from "@/i18n/i18n";
import PrivacyPolicyContent from "@/miniapp/dashboard/PrivacyPolicyContent";
import TermsAndConditionsContent from "@/miniapp/dashboard/TermsAndConditionsContent";
import { readStoredThemeMode, setThemeMode, type ThemeMode } from "@/styles/theme/theme";

function CtaLink({
  href,
  children,
  variant,
  className,
  onClick,
}: {
  href: string;
  children: ReactNode;
  variant: "primary" | "secondary" | "dark";
  className?: string;
  onClick?: () => void;
}) {
  const base =
    "inline-flex h-11 items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2";
  const styles =
    variant === "primary"
      ? "bg-[#FFC300] text-black ring-1 ring-black/10 hover:bg-[#E7B100] focus-visible:ring-black/40 focus-visible:ring-offset-white dark:ring-white/10 dark:hover:bg-[#E7B100] dark:focus-visible:ring-white/40 dark:focus-visible:ring-offset-zinc-950"
      : variant === "dark"
        ? "bg-black text-white ring-1 ring-black/10 hover:bg-zinc-900 focus-visible:ring-black/40 focus-visible:ring-offset-white dark:bg-white dark:text-black dark:hover:bg-zinc-100 dark:ring-white/10 dark:focus-visible:ring-white/40 dark:focus-visible:ring-offset-zinc-950"
        : "bg-transparent text-black ring-1 ring-black/25 hover:bg-black hover:text-white focus-visible:ring-black/40 focus-visible:ring-offset-white dark:text-white dark:ring-white/25 dark:hover:bg-white dark:hover:text-black dark:focus-visible:ring-white/40 dark:focus-visible:ring-offset-zinc-950";

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={[base, styles, className].filter(Boolean).join(" ")}
      onClick={onClick}
    >
      {children}
    </a>
  );
}

function AnchorButton({
  href,
  children,
  variant,
  className,
}: {
  href: string;
  children: ReactNode;
  variant: "primary" | "secondary";
  className?: string;
}) {
  const base =
    "inline-flex h-11 items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2";
  const styles =
    variant === "primary"
      ? "bg-[#FFC300] text-black ring-1 ring-black/10 hover:bg-[#E7B100] focus-visible:ring-black/40 focus-visible:ring-offset-white dark:focus-visible:ring-white/40 dark:focus-visible:ring-offset-zinc-950"
      : "bg-transparent text-black ring-1 ring-black/25 hover:bg-black hover:text-white focus-visible:ring-black/40 focus-visible:ring-offset-white dark:text-white dark:ring-white/25 dark:hover:bg-white dark:hover:text-black dark:focus-visible:ring-white/40 dark:focus-visible:ring-offset-zinc-950";

  return (
    <a href={href} className={[base, styles, className].filter(Boolean).join(" ")}>
      {children}
    </a>
  );
}

function TelegramIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="currentColor">
      <path d="M21.9 4.6c.3-1.3-1-2.4-2.2-1.9L2.8 9.2c-1.4.5-1.4 2.5 0 3l4.3 1.5 1.6 5.2c.4 1.2 1.9 1.6 2.9.8l2.8-2.3 4.3 3.2c1 .7 2.4.2 2.7-1l2.7-15zM8.1 12.7l9.8-6.1c.2-.1.4.2.2.4l-8 7.3c-.3.3-.5.7-.5 1.1l-.3 3.1c0 .3-.4.4-.5.1l-1.1-3.7c-.2-.6.1-1.4.7-1.7z" />
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
  const { t } = useI18n();
  const [mode, setMode] = useState<ThemeMode>("system");

  useEffect(() => {
    const timeout = window.setTimeout(() => setMode(readStoredThemeMode()), 0);
    const onTheme = (e: Event) => {
      const next = (e as CustomEvent).detail as ThemeMode | undefined;
      if (next === "light" || next === "dark" || next === "system") {
        setMode(next);
      }
    };
    window.addEventListener("cc-theme-mode", onTheme);
    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener("cc-theme-mode", onTheme);
    };
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
      className="inline-flex items-center gap-1 rounded-full border border-black/10 bg-white p-1 shadow-sm dark:border-white/10 dark:bg-zinc-950"
      role="group"
      aria-label={t("nav.theme")}
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
                ? "border-black/10 bg-black/5 text-black dark:border-white/10 dark:bg-white/10 dark:text-white"
                : "border-transparent text-zinc-600 hover:bg-black/5 dark:text-white/70 dark:hover:bg-white/10",
            ].join(" ")}
          >
            <span className="sr-only">
              {value === "system" ? t("nav.system") : value === "light" ? t("nav.light") : t("nav.dark")}
            </span>
            {renderIcon(value)}
          </button>
        );
      })}
    </div>
  );
}

function LocaleButtons() {
  const { locale, setLocale, t } = useI18n();
  return (
    <div
      className="inline-flex items-center gap-1 rounded-full border border-black/10 bg-white p-1 shadow-sm dark:border-white/10 dark:bg-zinc-950"
      role="group"
      aria-label={t("nav.language")}
    >
      {(
        [
          { value: "es", label: "ES" },
          { value: "en", label: "EN" },
        ] as const
      ).map(({ value, label }) => {
        const selected = locale === value;
        return (
          <button
            key={value}
            type="button"
            aria-pressed={selected}
            onClick={() => setLocale(value)}
            className={[
              "inline-flex h-8 items-center justify-center rounded-full border px-2 text-xs font-semibold tracking-wide transition-colors",
              selected
                ? "border-black/10 bg-black/5 text-black dark:border-white/10 dark:bg-white/10 dark:text-white"
                : "border-transparent text-zinc-600 hover:bg-black/5 dark:text-white/70 dark:hover:bg-white/10",
            ].join(" ")}
          >
            <span className="sr-only">{value === "es" ? t("nav.spanish") : t("nav.english")}</span>
            <span aria-hidden="true">{label}</span>
          </button>
        );
      })}
    </div>
  );
}

function Header() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const menuId = useId();

  return (
    <header className="sticky top-0 z-40 border-b border-black/10 bg-white text-black dark:border-white/10 dark:bg-zinc-950 dark:text-white">
      <div className="mx-auto max-w-6xl px-6 py-4 lg:px-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image
              src="/assets/logo-header.png"
              alt="Criptocard"
              width={260}
              height={60}
              priority
              className="h-9 w-auto dark:hidden"
            />
            <Image
              src="/assets/logo-header-blanco.png"
              alt="Criptocard"
              width={220}
              height={44}
              priority
              className="hidden h-9 w-auto dark:block"
            />
          </div>

          <div className="hidden items-center gap-3 sm:flex">
            <div className="inline-flex items-center gap-3">
              <div className="text-sm font-semibold text-zinc-950 dark:text-white">
                {t("nav.personal")}
              </div>
              <div className="text-sm font-semibold text-zinc-600 dark:text-white/70">
                {t("nav.company")} <span className="text-zinc-400 dark:text-white/40">{t("nav.comingSoon")}</span>
              </div>
            </div>
            <ThemeModeButtons />
            <LocaleButtons />
          </div>

          <div className="hidden sm:block">
            <CtaLink href="https://t.me/CriptoCardApp_bot" variant="primary">
              <span className="inline-flex h-5 w-5 items-center justify-center">
                <TelegramIcon />
              </span>
              {t("nav.getYourCard")}
            </CtaLink>
          </div>

          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-black transition-colors hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:text-white dark:hover:bg-white/10 dark:focus-visible:ring-white/40 dark:focus-visible:ring-offset-zinc-950 sm:hidden"
            aria-label={open ? t("nav.menuClose") : t("nav.menuOpen")}
            aria-expanded={open}
            aria-controls={menuId}
            onClick={() => setOpen((v) => !v)}
          >
            <MenuIcon open={open} />
          </button>
        </div>
      </div>

      <div
        id={menuId}
        className={[
          "sm:hidden",
          "absolute left-0 right-0 top-full z-20 origin-top bg-white dark:bg-zinc-950",
          "transition-[transform,opacity] duration-200 ease-out",
          open ? "scale-y-100 opacity-100" : "pointer-events-none scale-y-95 opacity-0",
        ].join(" ")}
      >
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 pb-6 lg:px-10">
          <div className="rounded-3xl border border-black/10 bg-white px-5 pb-5 pt-4 shadow-sm dark:border-white/10 dark:bg-zinc-950">
            <div className="flex items-center justify-between pt-2">
              <div className="text-sm font-semibold text-zinc-950 dark:text-white">{t("nav.personal")}</div>
              <ThemeModeButtons />
            </div>
            <div className="text-sm font-semibold text-zinc-600 dark:text-white/70">
              {t("nav.company")} <span className="text-zinc-400 dark:text-white/40">{t("nav.comingSoon")}</span>
            </div>
            <div className="pt-3">
              <LocaleButtons />
            </div>
            <div className="pt-4">
              <CtaLink
                href="https://t.me/CriptoCardApp_bot"
                variant="primary"
                className="w-full"
                onClick={() => setOpen(false)}
              >
                <span className="inline-flex h-5 w-5 items-center justify-center">
                  <TelegramIcon />
                </span>
                {t("nav.getYourCard")}
              </CtaLink>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

function HeroSection() {
  const { t } = useI18n();
  return (
    <section className="bg-white text-zinc-950 dark:bg-zinc-950 dark:text-white">
      <Header />
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-6 py-14 sm:py-20 lg:grid-cols-2 lg:gap-12 lg:px-10">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 shadow-sm dark:border-white/10 dark:bg-zinc-950 dark:text-white/70">
            <span className="h-1.5 w-1.5 rounded-full bg-[#FFC300]" />
            {t("hero.badge")}
          </div>
          <h1 className="mt-6 max-w-xl text-5xl font-extrabold leading-[0.98] tracking-tight sm:text-6xl lg:text-7xl">
            {t("hero.title.0")}
            <br />
            {t("hero.title.1")}
            <br />
            {t("hero.title.2")}
          </h1>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-zinc-700 dark:text-white/70 sm:text-xl">
            {t("hero.subtitle.0")}
            <br />
            {t("hero.subtitle.1")}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <CtaLink href="https://t.me/CriptoCardApp_bot" variant="primary">
              <span className="inline-flex h-5 w-5 items-center justify-center">
                <TelegramIcon />
              </span>
              {t("hero.ctaTelegram")}
            </CtaLink>
            <AnchorButton href="#benefits" variant="secondary">
              {t("home.hero.viewBenefits")}
            </AnchorButton>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-[#FFC300] opacity-25 dark:opacity-15" />
          <div className="absolute -bottom-10 -left-10 h-28 w-28 rounded-full bg-black opacity-[0.04] dark:bg-white dark:opacity-[0.06]" />
          <div className="relative overflow-hidden rounded-3xl border border-black/10 bg-white shadow-[0_18px_50px_rgba(0,0,0,0.08)] dark:border-white/10 dark:bg-zinc-950 dark:shadow-none">
            <div className="border-b border-black/10 px-5 py-4 dark:border-white/10">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-zinc-600 dark:text-white/60">CriptoCard</div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-black/15 dark:bg-white/15" />
                  <span className="h-2 w-2 rounded-full bg-black/15 dark:bg-white/15" />
                  <span className="h-2 w-2 rounded-full bg-black/15 dark:bg-white/15" />
                </div>
              </div>
            </div>
            <div className="relative h-[380px] w-full sm:h-[520px]">
              <Image
                src="/assets/imagen1-homee.png"
                alt={t("hero.imageAlt")}
                fill
                priority
                sizes="(min-width: 1024px) 520px, (min-width: 640px) 520px, 100vw"
                className="object-contain"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function BenefitsSection() {
  const { t } = useI18n();
  const items = [
    {
      title: t("sections.getCardTitle"),
      body: t("sections.getCardBody"),
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="6" width="18" height="12" rx="2" />
          <path d="M3 10h18" />
          <path d="M8 15h3" />
        </svg>
      ),
    },
    {
      title: t("sections.freeTopUpTitle"),
      body: `${t("sections.freeTopUpBody.0")} ${t("sections.freeTopUpBody.1")}`,
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 5v14" />
          <path d="M7 10l5-5 5 5" />
          <path d="M7 14l5 5 5-5" />
        </svg>
      ),
    },
    {
      title: t("sections.controlTitle"),
      body: `${t("sections.controlBody.0")} ${t("sections.controlBody.1")}`,
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2l7 4v6c0 5-3 9-7 10C8 21 5 17 5 12V6l7-4z" />
          <path d="M9 12l2 2 4-5" />
        </svg>
      ),
    },
    {
      title: t("features.visaBenefitsTitle"),
      body: t("features.visaBenefitsBody").split("\n")[0] ?? t("features.visaBenefitsBody"),
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 8V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v1" />
          <path d="M21 10v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7" />
          <path d="M3 10h18" />
        </svg>
      ),
    },
  ];

  return (
    <section id="benefits" className="bg-[#F7F7F7] text-zinc-950 dark:bg-zinc-900 dark:text-white">
      <div className="mx-auto max-w-6xl px-6 py-14 sm:py-20 lg:px-10">
        <div className="max-w-2xl">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-white/50">
            {t("home.benefits.label")}
          </div>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
            {t("home.benefits.title")}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-zinc-700 dark:text-white/70 sm:text-lg">
            {t("home.benefits.subtitle")}
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => (
            <div
              key={item.title}
              className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-zinc-950 dark:shadow-none"
            >
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#FFC300] text-black">
                {item.icon}
              </div>
              <div className="mt-4 text-base font-extrabold leading-tight tracking-tight">
                {item.title}
              </div>
              <div className="mt-3 text-sm leading-relaxed text-zinc-700 dark:text-white/70">
                {item.body}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const { t } = useI18n();
  const steps = [
    { title: t("home.how.steps.0.title"), body: t("home.how.steps.0.body") },
    { title: t("home.how.steps.1.title"), body: t("home.how.steps.1.body") },
    { title: t("home.how.steps.2.title"), body: t("home.how.steps.2.body") },
  ];

  return (
    <section id="how" className="bg-white text-zinc-950 dark:bg-zinc-950 dark:text-white">
      <div className="mx-auto max-w-6xl px-6 py-14 sm:py-20 lg:px-10">
        <div className="max-w-2xl">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-white/50">
            {t("home.how.label")}
          </div>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
            {t("home.how.title")}
          </h2>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {steps.map((s, idx) => (
            <div
              key={s.title}
              className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-zinc-950 dark:shadow-none"
            >
              <div className="flex items-center justify-between">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-black text-white dark:bg-white dark:text-black">
                  {idx + 1}
                </div>
                <div className="h-px flex-1 bg-black/10 dark:bg-white/10" />
              </div>
              <div className="mt-5 text-lg font-extrabold tracking-tight">{s.title}</div>
              <div className="mt-3 text-sm leading-relaxed text-zinc-700 dark:text-white/70">
                {s.body}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HighlightSection() {
  const { t } = useI18n();
  return (
    <section className="bg-black text-white">
      <div className="mx-auto max-w-6xl px-6 py-14 sm:py-20 lg:px-10">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-14">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">
              {t("home.highlight.label")}
            </div>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
              {t("home.highlight.title")}
            </h2>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-white/75 sm:text-lg">
              {t("home.highlight.subtitle")}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <CtaLink href="https://t.me/CriptoCardApp_bot" variant="primary" className="focus-visible:ring-white/40">
                <span className="inline-flex h-5 w-5 items-center justify-center">
                  <TelegramIcon />
                </span>
                {t("home.highlight.ctaTelegram")}
              </CtaLink>
              <AnchorButton href="#faq" variant="secondary" className="text-white ring-white/30 hover:bg-white hover:text-black">
                {t("home.highlight.ctaFaq")}
              </AnchorButton>
            </div>
          </div>

          <div className="rounded-3xl border border-white/12 bg-white/5 p-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-white/10 bg-black px-4 py-4">
                <div className="text-xs font-semibold text-white/60">
                {t("home.highlight.card.balanceLabel")}
                </div>
                <div className="mt-2 text-2xl font-extrabold tracking-tight">$10,240</div>
                <div className="mt-3 text-xs font-semibold text-white/60">
                {t("home.highlight.card.availableLabel")}
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black px-4 py-4">
                <div className="text-xs font-semibold text-white/60">
                {t("home.highlight.card.monthlySpendLabel")}
                </div>
                <div className="mt-2 text-2xl font-extrabold tracking-tight">$1,420</div>
                <div className="mt-3 text-xs font-semibold text-white/60">
                {t("home.highlight.card.summaryLabel")}
                </div>
              </div>
            </div>
            <div className="mt-4 rounded-2xl border border-white/10 bg-black px-4 py-4">
              <div className="text-xs font-semibold text-white/60">
              {t("home.highlight.card.notificationsLabel")}
              </div>
              <div className="mt-2 text-sm text-white/80">
              {t("home.highlight.card.notificationsBody")}
              </div>
              <div className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-white/60">
                <span className="h-1.5 w-1.5 rounded-full bg-[#FFC300]" />
              {t("home.highlight.card.realtimeLabel")}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function GetYourCardTodaySection() {
  const { t } = useI18n();
  return (
    <section className="bg-white text-zinc-950 dark:bg-zinc-950 dark:text-white">
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-6 py-14 sm:py-20 lg:grid-cols-2 lg:gap-12 lg:px-10">
        <div className="order-2 lg:order-1">
          <div className="overflow-hidden rounded-3xl border border-black/10 bg-white shadow-sm dark:border-white/10 dark:bg-zinc-950 dark:shadow-none">
            <div className="relative h-[340px] w-full sm:h-[460px]">
              <Image
                src="/assets/imagen-2-homee.png"
                alt={t("hero.imageAlt")}
                fill
                priority
                sizes="(min-width: 1024px) 520px, (min-width: 640px) 520px, 100vw"
                className="object-contain"
              />
            </div>
          </div>
        </div>

        <div className="order-1 lg:order-2">
          <div className="max-w-xl">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-white/50">
              {t("nav.personal")}
            </div>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
              {t("sections.getCardTitle")}
            </h2>
            <div className="mt-4 h-1 w-14 rounded-full bg-[#FFC300]" />
            <p className="mt-5 text-base leading-relaxed text-zinc-700 dark:text-white/70 sm:text-lg">
              {t("sections.getCardBody")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function FreeTopUpSection() {
  const { t } = useI18n();
  return (
    <section className="bg-[#F7F7F7] text-zinc-950 dark:bg-zinc-900 dark:text-white">
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-6 py-14 sm:py-20 lg:grid-cols-2 lg:gap-12 lg:px-10">
        <div className="max-w-xl">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-white/50">
            {t("home.sectionLabels.topUp")}
          </div>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
            {t("sections.freeTopUpTitle")}
          </h2>
          <div className="mt-4 h-1 w-14 rounded-full bg-[#FFC300]" />
          <p className="mt-5 text-base leading-relaxed text-zinc-700 dark:text-white/70 sm:text-lg">
            {t("sections.freeTopUpBody.0")} {t("sections.freeTopUpBody.1")}
          </p>
        </div>

        <div className="order-first flex justify-center lg:order-none lg:justify-end">
          <div className="w-full max-w-[520px] overflow-hidden rounded-3xl border border-black/10 bg-white shadow-sm dark:border-white/10 dark:bg-zinc-950 dark:shadow-none">
            <div className="relative h-[360px] w-full sm:h-[480px]">
              <Image
                src="/assets/imagen-3-homee.png"
                alt={t("hero.imageAlt")}
                fill
                priority
                unoptimized
                sizes="(min-width: 1024px) 520px, (min-width: 640px) 520px, 100vw"
                className="object-contain"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SpendWithFullControlSection() {
  const { t } = useI18n();
  return (
    <section className="bg-white text-zinc-950 dark:bg-zinc-950 dark:text-white">
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-6 py-14 sm:py-20 lg:grid-cols-2 lg:gap-12 lg:px-10">
        <div className="overflow-hidden rounded-3xl border border-black/10 bg-white shadow-sm dark:border-white/10 dark:bg-zinc-950 dark:shadow-none">
          <div className="relative h-[360px] w-full sm:h-[480px]">
            <Image
              src="/assets/imagen-4-home.png"
              alt={t("hero.imageAlt")}
              fill
              priority
              sizes="(min-width: 1024px) 520px, (min-width: 640px) 520px, 100vw"
              className="object-contain"
            />
          </div>
        </div>

        <div className="max-w-xl">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-white/50">
            {t("home.sectionLabels.security")}
          </div>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
            {t("sections.controlTitle")}
          </h2>
          <div className="mt-4 h-1 w-14 rounded-full bg-[#FFC300]" />
          <p className="mt-5 text-base leading-relaxed text-zinc-700 dark:text-white/70 sm:text-lg">
            {t("sections.controlBody.0")} {t("sections.controlBody.1")} {t("sections.controlBody.2")}
          </p>
        </div>
      </div>
    </section>
  );
}

function PlusIcon({ open }: { open: boolean }) {
  return (
    <span aria-hidden="true" className="relative inline-flex h-6 w-6 items-center justify-center">
      <span className="absolute h-[2px] w-4 rounded-full bg-black dark:bg-white" />
      <span
        className={[
          "absolute h-4 w-[2px] rounded-full bg-black transition-transform duration-200 dark:bg-white",
          open ? "scale-y-0" : "scale-y-100",
        ].join(" ")}
      />
    </span>
  );
}

function DarkFeaturesFaqSection() {
  const { t } = useI18n();
  const items = useMemo(
    () => [
      { q: t("faq.q1"), a: t("faq.a1") },
      { q: t("faq.q2"), a: t("faq.a2") },
      { q: t("faq.q3"), a: t("faq.a3") },
      { q: t("faq.q4"), a: t("faq.a4") },
    ],
    [t],
  );

  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="bg-[#F7F7F7] text-zinc-950 dark:bg-zinc-900 dark:text-white">
      <div className="mx-auto max-w-6xl px-6 py-14 sm:py-20 lg:px-10">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-black/10 bg-white p-7 shadow-sm dark:border-white/10 dark:bg-zinc-950 dark:shadow-none">
            <p className="text-xl font-extrabold leading-tight tracking-tight sm:text-2xl">
              {t("features.cardCountriesTitle")
                .split("\n")
                .map((line, idx) => (idx === 0 ? line : [<br key={`cc1-${idx}`} />, line]))}
            </p>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-zinc-700 dark:text-white/70 sm:text-base">
              {t("features.cardCountriesBody")
                .split("\n")
                .map((line, idx) => (idx === 0 ? line : [<br key={`cc2-${idx}`} />, line]))}
            </p>
          </div>

          <div className="rounded-3xl border border-black/10 bg-white p-7 shadow-sm dark:border-white/10 dark:bg-zinc-950 dark:shadow-none">
            <p className="text-xl font-extrabold leading-tight tracking-tight sm:text-2xl">
              {t("features.visaBenefitsTitle")}
            </p>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-zinc-700 dark:text-white/70 sm:text-base">
              {t("features.visaBenefitsBody")
                .split("\n")
                .map((line, idx) => (idx === 0 ? line : [<br key={`vb-${idx}`} />, line]))}
            </p>
          </div>
        </div>

        <div className="mt-8 rounded-3xl border border-black/10 bg-white px-6 py-5 shadow-sm dark:border-white/10 dark:bg-zinc-950 dark:shadow-none">
          <p className="text-center text-base font-semibold tracking-tight sm:text-lg">
            {t("features.allInTelegram")}
          </p>
        </div>

        <div className="mt-14 sm:mt-16">
          <h2 className="text-center text-3xl font-extrabold tracking-tight sm:text-4xl">
            {t("faq.title")}
          </h2>
          <div className="mx-auto mt-8 max-w-3xl rounded-3xl border border-black/10 bg-white px-6 py-2 shadow-sm dark:border-white/10 dark:bg-zinc-950 dark:shadow-none sm:px-8">
            {items.map((item, index) => {
              const open = openIndex === index;
              const contentId = `faq-${index}`;
              const last = index === items.length - 1;

              return (
                <div key={item.q} className={[last ? "" : "border-b border-black/10 dark:border-white/10", "py-6"].join(" ")}>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-6 text-left text-base font-semibold sm:text-lg"
                    aria-expanded={open}
                    aria-controls={contentId}
                    onClick={() => setOpenIndex(open ? null : index)}
                  >
                    <span>{item.q}</span>
                    <PlusIcon open={open} />
                  </button>

                  <div
                    id={contentId}
                    className={[
                      "grid transition-[grid-template-rows,opacity] duration-300 ease-out",
                      open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
                    ].join(" ")}
                  >
                    <div className="overflow-hidden">
                      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-zinc-700 dark:text-white/70 sm:text-base">
                        {item.a}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);

  return (
    <footer className="border-t border-black/10 bg-white pb-12 pt-10 text-center text-xs text-zinc-600 dark:border-white/10 dark:bg-zinc-950 dark:text-white/60">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-6 lg:px-10">
        <p className="font-semibold text-zinc-700 dark:text-white/70">
          &copy; 2026 CriptoCard. Todos los derechos reservados.
        </p>
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-3">
          <button
            type="button"
            onClick={() => setPrivacyOpen(true)}
            className="text-xs font-semibold text-zinc-700 underline decoration-zinc-300 underline-offset-4 hover:text-black dark:text-white/70 dark:decoration-white/20 dark:hover:text-white"
          >
            Política de privacidad.
          </button>
          <button
            type="button"
            onClick={() => setTermsOpen(true)}
            className="text-xs font-semibold text-zinc-700 underline decoration-zinc-300 underline-offset-4 hover:text-black dark:text-white/70 dark:decoration-white/20 dark:hover:text-white"
          >
            Términos y condiciones
          </button>
        </div>
      </div>

      <BottomSheet open={privacyOpen} label="Política de privacidad" onClose={() => setPrivacyOpen(false)}>
        <PrivacyPolicyContent />
      </BottomSheet>

      <BottomSheet open={termsOpen} label="Términos y condiciones" onClose={() => setTermsOpen(false)}>
        <TermsAndConditionsContent />
      </BottomSheet>
    </footer>
  );
}

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-white dark:bg-zinc-950">
      <HeroSection />
      <BenefitsSection />
      <HowItWorksSection />
      <GetYourCardTodaySection />
      <FreeTopUpSection />
      <SpendWithFullControlSection />
      <HighlightSection />
      <DarkFeaturesFaqSection />
      <Footer />
    </main>
  );
}
