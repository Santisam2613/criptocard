import type { ReactNode } from "react";
import { useRouter } from "next/navigation";

import { useI18n } from "@/i18n/i18n";
import { useBackendUser } from "@/miniapp/hooks/useBackendUser";

function TelegramIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="currentColor">
      <path d="M21.9 4.6c.3-1.3-1-2.4-2.2-1.9L2.8 9.2c-1.4.5-1.4 2.5 0 3l4.3 1.5 1.6 5.2c.4 1.2 1.9 1.6 2.9.8l2.8-2.3 4.3 3.2c1 .7 2.4.2 2.7-1l2.7-15zM8.1 12.7l9.8-6.1c.2-.1.4.2.2.4l-8 7.3c-.3.3-.5.7-.5 1.1l-.3 3.1c0 .3-.4.4-.5.1l-1.1-3.7c-.2-.6.1-1.4.7-1.7z" />
    </svg>
  );
}

function BitcoinIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="currentColor">
      <path d="M14.7 11.3c1.1-.6 1.6-1.6 1.4-2.8-.3-1.8-2.1-2.5-4.4-2.6V4h-1.5v1.9H9V4H7.5v1.9H6v1.6h1.5v8.9H6V18h1.5V20H9v-2h1.2v2h1.5v-2c2.6-.1 4.8-1 5.1-3.3.2-1.6-.6-2.7-2.1-3.4Zm-4.5-3.5c1.2 0 2.9.1 3.1 1.3.2 1.4-1.5 1.8-3.1 1.8V7.8Zm.2 8.6h-.2v-3.1c1.8 0 3.8.2 3.6 1.8-.2 1.3-1.8 1.3-3.4 1.3Z" />
    </svg>
  );
}

function CitiIcon() {
  return (
    <svg viewBox="0 0 48 24" aria-hidden="true" className="h-6 w-auto" fill="currentColor">
      <path d="M10.4 9.2c-1.1 0-2.1.4-2.8 1.2-.7.8-1.1 1.9-1.1 3.2 0 1.3.4 2.4 1.1 3.2.7.8 1.7 1.2 2.8 1.2 1.1 0 2-.3 2.7-.9v2.1c-.8.4-1.8.6-3 .6-1.7 0-3.1-.6-4.2-1.7-1-1.2-1.6-2.7-1.6-4.5 0-1.9.6-3.4 1.7-4.6 1.1-1.2 2.6-1.8 4.3-1.8 1.1 0 2.1.2 2.8.5v2.1c-.7-.4-1.6-.6-2.7-.6Z" />
      <path d="M18.2 20.1h-2.2V7.8h2.2v12.3Z" />
      <path d="M26.5 9.6h-3v10.5h-2.2V9.6h-3V7.8h8.2v1.8Z" />
      <path d="M29.8 20.1h-2.2V7.8h2.2v12.3Z" />
      <path d="M41.8 20.1h-7.3V7.8h7v1.8h-4.8v3.4h4.4v1.8h-4.4v3.5h5.1v1.8Z" />
      <path d="M33 9.6c1.8-2.1 4.3-3.3 7.2-3.3 2.8 0 5.2 1.1 7 3.1l-1.5 1.1c-1.4-1.6-3.3-2.4-5.5-2.4-2.3 0-4.3.9-5.8 2.6L33 9.6Z" />
    </svg>
  );
}

function CardRow({
  title,
  subtitle,
  amount,
  leftIcon,
  emphasis,
}: {
  title: string;
  subtitle: string;
  amount: string;
  leftIcon: ReactNode;
  emphasis?: boolean;
}) {
  return (
    <div
      className={[
        "flex items-center justify-between gap-4 rounded-2xl px-5 py-4",
        emphasis
          ? "bg-white text-black shadow-[0_24px_60px_rgba(0,0,0,0.22)]"
          : "bg-white text-black shadow-[0_24px_60px_rgba(0,0,0,0.18)] dark:bg-white/10 dark:text-white dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.10)]",
      ].join(" ")}
    >
      <div className="flex items-center gap-4">
        <div
          className={[
            "inline-flex h-10 w-10 items-center justify-center rounded-full",
            emphasis
              ? "bg-black/5 text-black"
              : "bg-black/5 text-black dark:bg-black/20 dark:text-white",
          ].join(" ")}
        >
          {leftIcon}
        </div>
        <div>
          <div className="text-sm font-semibold">{title}</div>
          <div
            className={[
              "mt-0.5 text-xs font-medium",
              emphasis ? "text-black/60" : "text-black/60 dark:text-white/50",
            ].join(" ")}
          >
            {subtitle}
          </div>
        </div>
      </div>

      <div
        className={[
          "text-lg font-extrabold",
          emphasis ? "text-black" : "text-black/80 dark:text-white/80",
        ].join(" ")}
      >
        {amount}
      </div>
    </div>
  );
}

export default function SendSheetContent() {
  const router = useRouter();
  const { t } = useI18n();
  const { state, user, refresh } = useBackendUser();
  const isReady = state.status === "ready";
  const isApproved = isReady && user?.verification_status === "approved";

  async function onPrimaryAction() {
    if (!isReady) return;
    if (isApproved) {
      router.push("/miniapp/send");
      return;
    }

    await refresh().catch(() => undefined);
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
  }
  return (
    <div className="px-6 pb-8 pt-6 text-zinc-950 dark:text-white">
      <div className="cc-glass cc-neon-outline overflow-hidden rounded-3xl">
        <div className="relative h-72 overflow-hidden rounded-3xl bg-[radial-gradient(100%_80%_at_50%_0%,rgba(0,0,0,0.06),transparent_60%)] px-6 pt-7 dark:bg-[radial-gradient(100%_80%_at_50%_0%,rgba(255,255,255,0.10),transparent_60%)]">
          <div className="absolute inset-0 bg-[radial-gradient(70%_80%_at_50%_0%,rgba(0,0,0,0.10),transparent_60%)] dark:bg-[radial-gradient(70%_80%_at_50%_0%,rgba(0,0,0,0.28),transparent_60%)]" />

          <div className="relative flex flex-col items-center gap-4">
            <div className="flex w-full items-center justify-between">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#2A9DFF] text-white shadow-[0_22px_60px_rgba(42,157,255,0.16)]">
                <TelegramIcon />
              </div>
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#F0A100] text-black shadow-[0_22px_60px_rgba(240,161,0,0.14)]">
                <BitcoinIcon />
              </div>
            </div>

            <div className="w-full space-y-3">
              <CardRow
                title={t("sheets.toCryptoWallet")}
                subtitle={t("sheets.sendMoney")}
                amount="$47"
                leftIcon={<div className="text-sm font-black">T</div>}
              />
              <CardRow
                title={t("sheets.toBankAccount")}
                subtitle={t("sheets.sendMoney")}
                amount="$135"
                leftIcon={<div className="text-sm font-black">U</div>}
                emphasis
              />
              <CardRow
                title={t("sheets.toTelegramContact")}
                subtitle={t("sheets.sendMoney")}
                amount="$70"
                leftIcon={
                  <div className="h-7 w-7 rounded-full bg-white/25 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.14)]" />
                }
              />
            </div>

            <div className="mt-3 flex w-full items-center justify-between">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-white text-black shadow-[0_22px_60px_rgba(255,255,255,0.08)]">
                <div className="text-2xl font-black">R</div>
              </div>
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#2E6BFF] text-white shadow-[0_22px_60px_rgba(46,107,255,0.14)]">
                <CitiIcon />
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 pb-7 pt-6">
          <div className="text-center">
            <div className="text-3xl font-extrabold tracking-tight">
              {t("sheets.sendTitle")}
            </div>
            <div className="mt-4 text-base leading-relaxed text-zinc-600 dark:text-white/70">
              {t("sheets.sendBody")}
            </div>
          </div>

          <div className="mt-7">
            <button
              type="button"
              disabled={!isReady}
              aria-busy={!isReady}
              className="cc-cta cc-gold-cta inline-flex h-14 w-full items-center justify-center rounded-2xl text-base font-semibold text-black ring-1 ring-black/10 hover:brightness-[1.06] hover:-translate-y-0.5 hover:shadow-[0_26px_72px_var(--shadow-brand-strong)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:brightness-100 disabled:hover:shadow-none disabled:hover:translate-y-0"
              onClick={onPrimaryAction}
            >
              {!isReady ? "Cargando..." : isApproved ? "Continuar" : t("sheets.verifyAccount")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
