"use client";

import { useState } from "react";
import Image from "next/image";

import BottomSheet from "@/components/ui/BottomSheet";
import SettingsSheetContent from "@/miniapp/dashboard/SettingsSheetContent";
import SendSheetContent from "@/miniapp/dashboard/SendSheetContent";
import TopUpSheetContent from "@/miniapp/dashboard/TopUpSheetContent";
import VirtualAccountsSheetContent from "@/miniapp/dashboard/VirtualAccountsSheetContent";
import VisaCardSheetContent from "@/miniapp/dashboard/VisaCardSheetContent";
import { useI18n } from "@/i18n/i18n";
import { useBackendUser } from "@/miniapp/hooks/useBackendUser";
import { getPublicCredentials } from "@/config/credentials";
import { useTelegram } from "@/telegram/TelegramContext";

type Sheet =
  | "settings"
  | "topup"
  | "send"
  | "accounts"
  | "virtual"
  | "physical"
  | null;

export default function DashboardView() {
  const [sheet, setSheet] = useState<Sheet>(null);
  const { t } = useI18n();
  const { user, refresh } = useBackendUser();
  const telegram = useTelegram();
  const avatarUrl =
    telegram.status === "ready"
      ? (telegram.user.photo_url ?? null)
      : (user?.telegram_photo_url ?? null);

  async function startVerification() {
    const { bypassTelegramGate } = getPublicCredentials();
    const webApp = window.Telegram?.WebApp;
    const popup = webApp?.openLink
      ? null
      : window.open("about:blank", "_blank", "noopener,noreferrer");

    try {
      async function ensureDevSession(): Promise<boolean> {
        const r = await fetch("/api/auth/dev", {
          method: "POST",
          credentials: "include",
        });
        const json = (await r.json().catch(() => null)) as
          | { ok: boolean; error?: string }
          | null;
        if (r.status === 404) {
          window.alert(
            "Login de desarrollo desactivado. Activa DEV_BYPASS_AUTH=1 o abre en Telegram.",
          );
          return false;
        }
        if (!json?.ok) {
          window.alert(json?.error ?? "No se pudo autenticar (dev)");
          return false;
        }
        return true;
      }

      let res = await fetch("/api/kyc/sumsub/websdk-link", {
        method: "POST",
        credentials: "include",
      });
      if (res.status === 401) {
        if (bypassTelegramGate) {
          const ok = await ensureDevSession();
          if (!ok) return;
        } else {
          await refresh();
        }
        res = await fetch("/api/kyc/sumsub/websdk-link", {
          method: "POST",
          credentials: "include",
        });
      }

      if (res.status === 401) {
        window.alert(
          bypassTelegramGate
            ? "No autenticado. Activa DEV_BYPASS_AUTH=1 o abre en Telegram."
            : "No autenticado. Abre la miniapp dentro de Telegram.",
        );
        return;
      }

      const data = (await res.json().catch(() => null)) as
        | { ok: boolean; url?: string; error?: string }
        | null;
      if (!data || !data.ok || !data.url) {
        window.alert(data?.error ?? "No se pudo iniciar verificación");
        return;
      }

      if (webApp?.openLink) webApp.openLink(data.url);
      else if (popup) popup.location.href = data.url;
      else window.location.href = data.url;

      await refresh().catch(() => undefined);
    } catch {
      window.alert("No se pudo iniciar verificación");
    }
  }

  return (
    <main className="min-h-screen bg-background px-4 py-10 text-foreground">
      <div className="mx-auto w-full max-w-[420px]">
        <div className="flex items-center justify-between">
          <button
            type="button"
            className="cc-glass cc-neon-outline inline-flex h-10 w-10 items-center justify-center rounded-full transition-transform hover:-translate-y-0.5 active:translate-y-0"
            onClick={() => setSheet("settings")}
            aria-label="Settings"
          >
            <div className="relative h-full w-full">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt=""
                  width={40}
                  height={40}
                  className="h-full w-full rounded-full object-cover"
                  sizes="40px"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <Image
                    src="/assets/logo-header.png"
                    alt="Criptocard"
                    width={120}
                    height={24}
                    className="h-5 w-auto dark:hidden"
                  />
                  <Image
                    src="/assets/logo-header-blanco.png"
                    alt="Criptocard"
                    width={120}
                    height={24}
                    className="hidden h-5 w-auto dark:block"
                  />
                </div>
              )}

              <div className="cc-glass cc-neon-outline absolute -bottom-1 -right-1 inline-flex h-5 w-5 items-center justify-center rounded-full">
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  className="h-3.5 w-3.5 text-brand drop-shadow-[0_0_16px_var(--shadow-brand)]"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z" />
                  <path d="M19.4 15a8.7 8.7 0 0 0 .1-2l2-1.3-2-3.4-2.3.8a8.7 8.7 0 0 0-1.7-1L15.3 4h-4l-.2 2.4a8.7 8.7 0 0 0-1.7 1L7.1 6.6l-2 3.4 2 1.3a8.7 8.7 0 0 0 0 2l-2 1.3 2 3.4 2.3-.8a8.7 8.7 0 0 0 1.7 1L11.3 20h4l.2-2.4a8.7 8.7 0 0 0 1.7-1l2.3.8 2-3.4-2.1-1.3z" />
                </svg>
              </div>
            </div>
          </button>

          <div className="text-center">
            <div className="text-[11px] font-semibold tracking-[0.22em] text-muted">
              {t("dashboard.balanceLabel")}
            </div>
            <div className="mt-2 text-5xl font-extrabold tracking-tight">
              $0.00
            </div>
          </div>

          <div className="cc-glass cc-neon-outline inline-flex h-10 w-10 items-center justify-center rounded-full">
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
              <path d="M8 9h8" />
              <path d="M8 13h6" />
            </svg>
          </div>
        </div>

        <div className="mt-7 grid grid-cols-2 gap-4">
          <button
            type="button"
            className="cc-cta cc-gold-cta inline-flex h-12 items-center justify-center gap-2 rounded-2xl text-sm font-semibold text-black ring-1 ring-black/10 hover:brightness-[1.06] hover:-translate-y-0.5 hover:shadow-[0_26px_72px_var(--shadow-brand-strong)] active:translate-y-0"
            onClick={() => setSheet("topup")}
          >
            <span className="text-lg leading-none">+</span>
            <span>{t("dashboard.topUp")}</span>
          </button>
          <button
            type="button"
            className="cc-cta cc-gold-cta inline-flex h-12 items-center justify-center gap-2 rounded-2xl text-sm font-semibold text-black ring-1 ring-black/10 hover:brightness-[1.06] hover:-translate-y-0.5 hover:shadow-[0_26px_72px_var(--shadow-brand-strong)] active:translate-y-0"
            onClick={() => setSheet("send")}
          >
            <span className="text-lg leading-none">↑</span>
            <span>{t("dashboard.send")}</span>
          </button>
        </div>

        {user?.verification_status !== "approved" ? (
          <button
            type="button"
            onClick={startVerification}
            className="cc-glass-strong cc-neon-outline cc-holo mt-5 w-full rounded-3xl p-5 text-left transition-transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[radial-gradient(circle_at_30%_30%,var(--color-brand),transparent_60%)] ring-1 ring-black/10">
                  <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    className="h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 3c4 0 7 3 7 7 0 3.8-2.8 7.5-7 11-4.2-3.5-7-7.2-7-11 0-4 3-7 7-7z" />
                    <path d="M9 12l2 2 4-4" />
                  </svg>
                </div>

                <div>
                  <div className="text-[11px] font-semibold tracking-[0.22em] text-muted">
                    {t("dashboard.getCryptoCard")}
                  </div>
                  <div className="mt-1 text-lg font-extrabold text-foreground">
                    {t("dashboard.verifyTitle")}
                  </div>
                  <div className="mt-1 text-sm font-medium text-muted">
                    {t("dashboard.verifySubtitle")}
                  </div>
                  {user ? (
                    <div className="mt-1 text-xs font-semibold text-muted-2">
                      {t(`verification.${user.verification_status}`)}
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-surface ring-1 ring-border">
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M10 8l6 4-6 4V8z" />
                </svg>
              </div>
            </div>

            <div className="mt-5">
              <div className="h-2 w-full rounded-full bg-black/10 dark:bg-white/10">
                <div className="h-2 w-0 rounded-full bg-[linear-gradient(90deg,var(--color-brand-2),var(--color-brand),var(--color-neon))]" />
              </div>
              <div className="mt-2 text-[11px] font-semibold tracking-[0.22em] text-muted">
                {t("dashboard.stepsDone")}
              </div>
            </div>
          </button>
        ) : null}

        <div className="mt-6 grid grid-cols-2 gap-4">
          <button
            type="button"
            className="cc-glass cc-neon-outline rounded-3xl p-4 text-left transition-transform hover:-translate-y-0.5 active:translate-y-0"
            onClick={() => setSheet("virtual")}
          >
            <div className="relative h-9 w-14 overflow-hidden rounded-xl bg-brand shadow-[0_12px_30px_var(--shadow-brand)] ring-1 ring-black/10">
              <div className="absolute inset-0 opacity-55 [background-image:repeating-linear-gradient(135deg,rgba(0,0,0,0.20)_0,rgba(0,0,0,0.20)_1px,transparent_1px,transparent_6px)]" />
              <div className="absolute left-2 top-2 h-3.5 w-5 rounded-md bg-black/20 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.15)]" />
              <div className="absolute bottom-2 right-2 h-2 w-6 rounded-full bg-black/20" />
            </div>
            <div className="mt-8 text-sm font-semibold text-zinc-950 dark:text-white/90">
              {t("dashboard.visaVirtual")}
            </div>
          </button>
          <button
            type="button"
            className="cc-glass cc-neon-outline rounded-3xl p-4 text-left transition-transform hover:-translate-y-0.5 active:translate-y-0"
            onClick={() => setSheet("physical")}
          >
            <div className="relative h-9 w-14 overflow-hidden rounded-xl bg-[linear-gradient(135deg,rgba(0,0,0,0.06),rgba(0,0,0,0.02))] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.08)] dark:bg-[linear-gradient(135deg,rgba(255,255,255,0.16),rgba(255,255,255,0.06))] dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.10)]">
              <div className="absolute inset-0 opacity-60 [background-image:radial-gradient(circle_at_20%_30%,rgba(255,255,255,0.25),transparent_55%)]" />
              <div className="absolute inset-0 opacity-25 [background-image:repeating-linear-gradient(135deg,rgba(0,0,0,0.30)_0,rgba(0,0,0,0.30)_1px,transparent_1px,transparent_7px)] dark:opacity-40" />
              <div className="absolute left-2 top-2 h-3.5 w-5 rounded-md bg-white/15 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)]" />
              <div className="absolute bottom-2 right-2 h-2 w-6 rounded-full bg-white/15" />
            </div>
            <div className="mt-8 text-sm font-semibold text-zinc-950 dark:text-white/90">
              {t("dashboard.visaPhysical")}
            </div>
          </button>
        </div>

        <button
          type="button"
          className="cc-glass cc-neon-outline mt-4 w-full rounded-3xl p-5 text-left transition-transform hover:-translate-y-0.5 active:translate-y-0"
          onClick={() => setSheet("accounts")}
        >
          <div className="flex items-center gap-4">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-surface-2 text-foreground ring-1 ring-border">
              <span className="text-lg font-extrabold">$</span>
            </div>
            <div>
              <div className="text-sm font-semibold text-zinc-950 dark:text-white/90">
                {t("dashboard.virtualAccounts")}
              </div>
              <div className="mt-0.5 text-xs font-medium text-zinc-500 dark:text-white/50">
                {t("dashboard.notOpened")}
              </div>
            </div>
          </div>
        </button>

        <div className="cc-glass cc-neon-outline mt-4 rounded-3xl p-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[radial-gradient(circle_at_30%_30%,var(--color-neon),transparent_60%)] text-foreground ring-1 ring-border">
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
                  <path d="M6 3h12l4 6-10 13L2 9l4-6z" />
                  <path d="M2 9h20" />
                  <path d="M12 3l3 6-3 13-3-13 3-6z" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-semibold text-zinc-950 dark:text-white/90">
                  {t("dashboard.karat")}
                </div>
                <div className="mt-0.5 text-xs font-medium text-zinc-500 dark:text-white/50">
                  {t("dashboard.inviteFriends")}
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="text-sm font-semibold text-foreground">0.00</div>
              <div className="mt-0.5 text-xs font-medium text-zinc-500 dark:text-white/50">
                0.00 USDT
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10">
          <div className="text-xl font-extrabold tracking-tight">
            {t("dashboard.transactions")}
          </div>
          <div className="cc-glass cc-neon-outline mt-4 overflow-hidden rounded-3xl">
            <div className="flex h-44 flex-col items-center justify-center gap-5 bg-[radial-gradient(100%_90%_at_50%_0%,rgba(0,0,0,0.06),transparent_60%)] dark:bg-[radial-gradient(100%_90%_at_50%_0%,rgba(255,255,255,0.06),transparent_60%)]">
              <div className="text-5xl">🧐</div>
              <div className="text-base font-semibold text-zinc-950 dark:text-white/90">
                {t("dashboard.noHistory")}
              </div>
            </div>
          </div>
        </div>
      </div>

      <BottomSheet
        open={sheet === "settings"}
        label={t("dashboard.settings")}
        onClose={() => setSheet(null)}
      >
        <SettingsSheetContent />
      </BottomSheet>

      <BottomSheet
        open={sheet === "topup"}
        label={t("dashboard.instantTopUp")}
        onClose={() => setSheet(null)}
      >
        <TopUpSheetContent />
      </BottomSheet>

      <BottomSheet
        open={sheet === "send"}
        label={t("dashboard.sendMoney")}
        onClose={() => setSheet(null)}
      >
        <SendSheetContent />
      </BottomSheet>

      <BottomSheet
        open={sheet === "accounts"}
        label={t("dashboard.virtualAccountsSheet")}
        onClose={() => setSheet(null)}
      >
        <VirtualAccountsSheetContent />
      </BottomSheet>

      <BottomSheet
        open={sheet === "virtual"}
        label={t("dashboard.visaVirtualSheet")}
        onClose={() => setSheet(null)}
      >
        <VisaCardSheetContent
          header={t("dashboard.visaVirtualSheet")}
          title={t("visaCard.titleSignature")}
          description={t("visaCard.description")}
          tags={[
            t("visaCard.tagTopUp"),
            t("visaCard.tagAppleGoogle"),
            t("visaCard.tagNoLimits"),
            t("visaCard.tagVisaBenefits"),
          ]}
          actionLabel={t("sheets.verifyAccount")}
          onAction={startVerification}
        />
      </BottomSheet>

      <BottomSheet
        open={sheet === "physical"}
        label={t("dashboard.visaPhysicalSheet")}
        onClose={() => setSheet(null)}
      >
        <VisaCardSheetContent
          header={t("dashboard.visaPhysicalSheet")}
          title={t("visaCard.titlePhysical")}
          description={t("visaCard.description")}
          tags={[
            t("visaCard.tagTopUp"),
            t("visaCard.tagAppleGoogle"),
            t("visaCard.tagNoLimits"),
            t("visaCard.tagVisaBenefits"),
          ]}
          actionLabel={t("sheets.verifyAccount")}
          onAction={startVerification}
        />
      </BottomSheet>
    </main>
  );
}
