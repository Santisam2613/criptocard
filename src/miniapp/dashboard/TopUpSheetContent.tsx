import type { ReactNode } from "react";

import { useRouter } from "next/navigation";

import { useI18n } from "@/i18n/i18n";
import { useBackendUser } from "@/miniapp/hooks/useBackendUser";

function ChevronDown() {
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
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function EthereumIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    >
      <path d="M12 3l6 9-6 4-6-4 6-9z" />
      <path d="M6 12l6 9 6-9" />
      <path d="M12 16V7" />
    </svg>
  );
}

function WiseIcon() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className="h-5 w-5" fill="currentColor">
      <path d="M20.7 7.2 14 20h6.2l-2.6 4.8H22l5-9.3h-6.2l2-3.7H16l4.7-4.6z" />
    </svg>
  );
}

function RevolutIcon() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className="h-5 w-5" fill="currentColor">
      <path d="M20.4 8.2c2.5 0 4.3 1.6 4.3 4 0 2.1-1.4 3.6-3.6 4l4 7.6h-3.6l-3.7-7.2H14v7.2h-3.3V8.2h9.7Zm-6.4 3v6.5h5.8c1.3 0 2.2-.7 2.2-1.9 0-1.4-1-2.6-2.8-2.6H14Z" />
    </svg>
  );
}

function ToolsIcon() {
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
      <path d="M14.7 6.3a4.5 4.5 0 0 0-6.4 6.4L3 18l3 3 5.3-5.3a4.5 4.5 0 0 0 6.4-6.4L14 13l-3-3 3.7-3.7z" />
    </svg>
  );
}

function TetherIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="currentColor">
      <path d="M11 5h2v2.2c2.6.1 4.7.6 4.7 1.2S15.6 9.5 13 9.6V11c3.3.2 5.7.9 5.7 1.8S16.3 14.4 13 14.6V19h-2v-4.4c-3.3-.2-5.7-.9-5.7-1.8S7.7 11.2 11 11V9.6C8.4 9.5 6.3 9 6.3 8.4S8.4 7.3 11 7.2V5zm0 3.8c-2 .1-3.3.4-3.3.6s1.3.5 3.3.6V8.8zm2 0v1.2c2-.1 3.3-.4 3.3-.6s-1.3-.5-3.3-.6zm-2 3.8c-2.6.2-4.3.6-4.3 1s1.7.8 4.3 1v-2zm2 0v2c2.6-.2 4.3-.6 4.3-1s-1.7-.8-4.3-1z" />
    </svg>
  );
}

function SelectRow({
  label,
  value,
  leftIcon,
}: {
  label: string;
  value: string;
  leftIcon: ReactNode;
}) {
  return (
    <div className="relative">
      <div className="text-sm font-semibold text-zinc-500 dark:text-white/45">
        {label}
      </div>
      <div className="mt-2 flex items-center justify-between rounded-2xl bg-white px-5 py-4 text-black shadow-[0_24px_60px_rgba(0,0,0,0.22)]">
        <div className="flex items-center gap-3">
          <div className="text-black/80">{leftIcon}</div>
          <div className="text-base font-semibold">{value}</div>
        </div>
        <div className="text-black/50">
          <ChevronDown />
        </div>
      </div>
    </div>
  );
}

export default function TopUpSheetContent() {
  const router = useRouter();
  const { t } = useI18n();
  const { state, user } = useBackendUser();
  const isReady = state.status === "ready";
  const isApproved = isReady && user?.verification_status === "approved";
  return (
    <div className="px-6 pb-8 pt-6 text-zinc-950 dark:text-white">
      <div className="overflow-hidden rounded-3xl bg-white dark:bg-[#1A1D24]">
        <div className="relative h-72 overflow-hidden bg-gray-50 px-6 pt-7 dark:bg-white/5">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/5 dark:to-black/20" />

          <div className="relative flex justify-center">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-black/5 dark:bg-white/10 dark:ring-white/10">
              <EthereumIcon />
            </div>
          </div>

          <div className="relative mt-6 grid grid-cols-2 gap-6">
            <div className="col-span-2 sm:col-span-1">
              <SelectRow label={t("sheets.token")} value="USDT" leftIcon={<TetherIcon />} />
            </div>

            <div className="hidden sm:block" />

            <div className="hidden sm:flex items-center justify-center">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-yellow-500 text-black shadow-lg shadow-yellow-500/20">
                <ToolsIcon />
              </div>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <SelectRow
                label={t("sheets.bank")}
                value="Revolut"
                leftIcon={<RevolutIcon />}
              />
            </div>
          </div>

          <div className="relative mt-8 flex items-center justify-between px-4 opacity-50 blur-[1px]">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-black/5 dark:bg-white/10 dark:ring-white/10">
              <WiseIcon />
            </div>

            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-black/5 dark:bg-white/10 dark:ring-white/10">
              <div className="text-xl font-black">T</div>
            </div>
          </div>
        </div>

        <div className="px-6 pb-7 pt-6">
          <div className="text-center">
            <div className="text-3xl font-extrabold tracking-tight">
              {t("sheets.instantTopUpTitle")}
            </div>
            <div className="mt-4 text-base leading-relaxed text-zinc-600 dark:text-white/70">
              {t("sheets.instantTopUpBody")}
            </div>
          </div>

          <div className="mt-7">
            <button
              type="button"
              disabled={!isReady}
              aria-busy={!isReady}
              onClick={() => {
                if (!isReady) return;
                if (isApproved) {
                  router.push("/miniapp/topup");
                  return;
                }
                window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
              }}
              className="inline-flex h-14 w-full items-center justify-center rounded-2xl bg-yellow-500 text-base font-bold text-black shadow-lg shadow-yellow-500/25 transition-all hover:-translate-y-0.5 hover:bg-yellow-400 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {!isReady ? "Cargando..." : isApproved ? "Continuar" : t("sheets.verifyAccount")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
