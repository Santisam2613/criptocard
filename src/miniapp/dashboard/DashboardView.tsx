"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import BottomSheet from "@/components/ui/BottomSheet";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import NoticeDialog from "@/components/ui/NoticeDialog";
import Skeleton from "@/components/ui/Skeleton";
import SettingsSheetContent from "@/miniapp/dashboard/SettingsSheetContent";
import SendSheetContent from "@/miniapp/dashboard/SendSheetContent";
import TopUpSheetContent from "@/miniapp/dashboard/TopUpSheetContent";
import VirtualAccountsSheetContent from "@/miniapp/dashboard/VirtualAccountsSheetContent";
import VisaCardSheetContent from "@/miniapp/dashboard/VisaCardSheetContent";
import VirtualVisaCardOwnedSheetContent from "@/miniapp/dashboard/VirtualVisaCardOwnedSheetContent";
import { useI18n } from "@/i18n/i18n";
import { useBackendUser } from "@/miniapp/hooks/useBackendUser";
import { getPublicCredentials } from "@/config/credentials";
import { useTelegram } from "@/telegram/TelegramContext";
import SumsubWebSdkModal from "@/miniapp/kyc/SumsubWebSdkModal";
import { formatInteger, formatUsdt } from "@/lib/format/number";

type Sheet =
  | "settings"
  | "topup"
  | "send"
  | "accounts"
  | "virtual"
  | "physical"
  | "privacy"
  | "terms"
  | null;

import PrivacyPolicyContent from "@/miniapp/dashboard/PrivacyPolicyContent";
import TermsAndConditionsContent from "@/miniapp/dashboard/TermsAndConditionsContent";
import TransactionList from "@/miniapp/dashboard/TransactionList";
import USDTPerformanceChart from "@/components/USDTPerformanceChart";
import CashbackCarousel from "@/miniapp/dashboard/CashbackCarousel";

export default function DashboardView() {
  const router = useRouter();
  const [sheet, setSheet] = useState<Sheet | "card_selector">(null);
  const [kycOpen, setKycOpen] = useState(false);
  const [comingSoonOpen, setComingSoonOpen] = useState(false);
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [noticeTitle, setNoticeTitle] = useState("");
  const [noticeMessage, setNoticeMessage] = useState("");
  const [noticeLabel, setNoticeLabel] = useState("OK");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState("");
  const [confirmMessage, setConfirmMessage] = useState("");
  const [confirmLabel, setConfirmLabel] = useState("Confirmar");
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
  const [referralEligible, setReferralEligible] = useState<number | null>(null);
  const [referralRate, setReferralRate] = useState<number | null>(null);
  const [virtualCardLoading, setVirtualCardLoading] = useState(false);
  const [virtualCardPrice, setVirtualCardPrice] = useState<number | null>(null);
  const [virtualCard, setVirtualCard] = useState<null | {
    id: string;
    status: string;
    last4: string | null;
    expiryMonth: number | null;
    expiryYear: number | null;
    brand: string | null;
    currency: string | null;
    cardholderName: string;
  }>(null);
  const { t } = useI18n();
  const { state, user, refresh } = useBackendUser();
  const telegram = useTelegram();
  const avatarUrl =
    telegram.status === "ready"
      ? (telegram.user.photo_url ?? null)
      : (user?.telegram_photo_url ?? null);
  const isProfileLoading = state.status === "idle" || state.status === "loading";
  const comingSoonLabel = t("dashboard.comingSoon");
  const comingSoonMessage = t("dashboard.comingSoonMessage");
  const okLabel = t("dashboard.ok");
  const isPhysicalComingSoon = true;
  const isVirtualAccountsComingSoon = true;
  const isCashbackComingSoon = true;
  const isApproved = state.status === "ready" && user?.verification_status === "approved";

  useEffect(() => {
    if (state.status !== "ready") return;
    let canceled = false;
    async function loadReferral() {
      try {
        const res = await fetch("/api/referrals/summary", {
          credentials: "include",
          cache: "no-store",
        });
        const json = (await res.json().catch(() => null)) as
          | {
              ok: boolean;
              summary?: { counts?: { eligible?: number }; diamond_to_usdt_rate?: number };
            }
          | null;
        if (!json?.ok) return;
        if (canceled) return;
        setReferralEligible(Number(json.summary?.counts?.eligible ?? 0));
        setReferralRate(Number(json.summary?.diamond_to_usdt_rate ?? 0.01));
      } catch {
        if (canceled) return;
        setReferralEligible(0);
        setReferralRate(0.01);
      }
    }
    void loadReferral();
    return () => {
      canceled = true;
    };
  }, [state.status]);

  useEffect(() => {
    if (state.status !== "ready") return;
    if (sheet !== "virtual") return;
    let canceled = false;
    async function loadVirtualCard() {
      setVirtualCardLoading(true);
      try {
        const res = await fetch("/api/cards/virtual", {
          credentials: "include",
          cache: "no-store",
        });
        const json = (await res.json().catch(() => null)) as
          | { ok: boolean; priceUsdt?: number; card?: typeof virtualCard }
          | null;
        if (!json?.ok) return;
        if (canceled) return;
        setVirtualCardPrice(Number(json.priceUsdt ?? 30));
        setVirtualCard((json.card as any) ?? null);
      } finally {
        if (!canceled) setVirtualCardLoading(false);
      }
    }
    void loadVirtualCard();
    return () => {
      canceled = true;
    };
  }, [sheet, state.status]);

  function openNotice(params: { title: string; message: string; confirmLabel: string }) {
    setNoticeTitle(params.title);
    setNoticeMessage(params.message);
    setNoticeLabel(params.confirmLabel);
    setNoticeOpen(true);
  }

  function openConfirm(params: {
    title: string;
    message: string;
    confirmLabel: string;
    onConfirm: () => void;
  }) {
    setConfirmTitle(params.title);
    setConfirmMessage(params.message);
    setConfirmLabel(params.confirmLabel);
    setConfirmAction(() => params.onConfirm);
    setConfirmOpen(true);
  }

  async function performBuyVirtualCard() {
    if (!isApproved) return;
    try {
      const res = await fetch("/api/cards/virtual/purchase", {
        method: "POST",
        credentials: "include",
      });
      const json = (await res.json().catch(() => null)) as
        | { ok: boolean; error?: string }
        | null;
      if (!json?.ok) {
        openNotice({
          title: "No se pudo comprar",
          message: json?.error ?? "Error interno",
          confirmLabel: "Cerrar",
        });
        return;
      }
      await refresh().catch(() => undefined);
      const vr = await fetch("/api/cards/virtual", {
        credentials: "include",
        cache: "no-store",
      });
      const vj = (await vr.json().catch(() => null)) as
        | { ok: boolean; priceUsdt?: number; card?: any }
        | null;
      if (vj?.ok) {
        setVirtualCardPrice(Number(vj.priceUsdt ?? 30));
        setVirtualCard(vj.card ?? null);
      }
      openNotice({
        title: "Tarjeta adquirida",
        message: "Tu tarjeta virtual fue activada correctamente.",
        confirmLabel: "OK",
      });
    } catch {
      openNotice({
        title: "No se pudo comprar",
        message: "Error interno",
        confirmLabel: "Cerrar",
      });
    }
  }

  async function toggleVirtualCardLock() {
    if (!virtualCard) return;
    try {
      setVirtualCardLoading(true);
      const action = virtualCard.status === "active" ? "freeze" : "unfreeze";
      const res = await fetch("/api/cards/virtual/status", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action }),
      });
      const json = (await res.json().catch(() => null)) as
        | { ok: boolean; error?: string }
        | null;
      if (!json?.ok) {
        openNotice({
          title: "No se pudo actualizar",
          message: json?.error ?? "Error interno",
          confirmLabel: "Cerrar",
        });
        return;
      }

      const vr = await fetch("/api/cards/virtual", {
        credentials: "include",
        cache: "no-store",
      });
      const vj = (await vr.json().catch(() => null)) as
        | { ok: boolean; priceUsdt?: number; card?: any }
        | null;
      if (vj?.ok) {
        setVirtualCardPrice(Number(vj.priceUsdt ?? 30));
        setVirtualCard(vj.card ?? null);
      }
    } catch {
      openNotice({
        title: "No se pudo actualizar",
        message: "Error interno",
        confirmLabel: "Cerrar",
      });
    } finally {
      setVirtualCardLoading(false);
    }
  }

  function openSupport() {
    router.push("/soporte");
  }

  function notifyComingSoon() {
    setComingSoonOpen(true);
  }

  async function startVerification() {
    const { bypassTelegramGate } = getPublicCredentials();
    const webApp = window.Telegram?.WebApp;

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

      if (bypassTelegramGate) {
        const ok = await ensureDevSession();
        if (!ok) return;
      } else {
        const r = await refresh();
        if (!r.ok) {
          window.alert(r.error);
          return;
        }
      }

      const wa = webApp as unknown as {
        HapticFeedback?: { impactOccurred?: (style: string) => void };
      } | null;
      if (wa?.HapticFeedback?.impactOccurred) {
        try {
          wa.HapticFeedback.impactOccurred("light");
        } catch {}
      }

      setKycOpen(true);

      await refresh().catch(() => undefined);
    } catch {
      window.alert("No se pudo iniciar verificación");
    }
  }

  return (
    <main className="relative min-h-screen bg-[#F4F5F7] px-4 py-10 text-foreground dark:bg-[#0F1115]">
      <div className="mx-auto w-full max-w-[420px]">
        <ConfirmDialog
          open={confirmOpen}
          title={confirmTitle}
          message={confirmMessage}
          cancelLabel="Cancelar"
          confirmLabel={confirmLabel}
          onCancel={() => {
            setConfirmOpen(false);
            setConfirmAction(null);
          }}
          onConfirm={() => {
            const action = confirmAction;
            setConfirmOpen(false);
            setConfirmAction(null);
            if (action) action();
          }}
        />
        <NoticeDialog
          open={comingSoonOpen}
          title={comingSoonLabel}
          message={comingSoonMessage}
          confirmLabel={okLabel}
          onClose={() => setComingSoonOpen(false)}
        />
        <NoticeDialog
          open={noticeOpen}
          title={noticeTitle}
          message={noticeMessage}
          confirmLabel={noticeLabel}
          onClose={() => setNoticeOpen(false)}
        />
        <SumsubWebSdkModal
          open={kycOpen}
          onClose={() => setKycOpen(false)}
          onCompleted={() => void refresh()}
        />
        <div className="flex flex-col gap-6">
          <div className="relative w-full overflow-hidden rounded-[32px] border border-black/5 bg-white p-6 transition-colors duration-200 dark:border-white/5 dark:bg-[#1A1D24]">
            <div className="pointer-events-none absolute -mr-10 -mt-10 right-0 top-0 h-32 w-32 rounded-full bg-[var(--color-neon)]/5 blur-3xl" />

            <div className="mb-1 flex items-start justify-between">
              <div className="mt-1.5 text-sm font-medium text-gray-500 dark:text-gray-400">
                Your balance
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="relative p-1 text-gray-400 transition-colors hover:text-foreground dark:text-gray-500 dark:hover:text-white"
                  aria-label="Support"
                  onClick={openSupport}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-6 w-6"
                  >
                    <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
                    <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => setSheet("settings")}
                  className="h-9 w-9 overflow-hidden rounded-full ring-2 ring-black/5 dark:ring-white/10"
                >
                  {avatarUrl ? (
                    <Image
                      src={avatarUrl}
                      alt=""
                      width={36}
                      height={36}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-400 to-yellow-500 text-xs font-bold text-white">
                      CC
                    </div>
                  )}
                </button>
              </div>
            </div>

            {isProfileLoading ? (
              <Skeleton className="h-12 w-48" rounded="2xl" />
            ) : (
              <div className="flex items-baseline text-[#111] dark:text-white">
                <span className="text-5xl font-extrabold tracking-tight tabular-nums">
                  {`$${formatUsdt(user?.balance_usdt ?? 0).split(".")[0]}`}
                </span>
                <span className="ml-0.5 -mt-4 inline-block align-top text-2xl font-bold text-gray-500 dark:text-gray-400">
                  {`.${formatUsdt(user?.balance_usdt ?? 0).split(".")[1]}`}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between px-2">
          <button
            type="button"
            className="group flex flex-col items-center gap-2"
            onClick={() => setSheet("topup")}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#111] transition-all duration-200 group-hover:-translate-y-0.5 group-active:translate-y-0 dark:bg-[#1A1D24] dark:text-white">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </div>
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
              Top up
            </span>
          </button>

          <button
            type="button"
            className="group flex flex-col items-center gap-2"
            onClick={() => setSheet("send")}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#111] transition-all duration-200 group-hover:-translate-y-0.5 group-active:translate-y-0 dark:bg-[#1A1D24] dark:text-white">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6"
              >
                <line x1="12" y1="19" x2="12" y2="5" />
                <polyline points="5 12 12 5 19 12" />
              </svg>
            </div>
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
              Send
            </span>
          </button>

          <button
            type="button"
            className="group flex flex-col items-center gap-2"
            onClick={() => notifyComingSoon()}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#111] transition-all duration-200 group-hover:-translate-y-0.5 group-active:translate-y-0 dark:bg-[#1A1D24] dark:text-white">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6"
              >
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
              Cuenta virtual
            </span>
          </button>
        </div>

        {user?.verification_status !== "approved" ? (
          isProfileLoading ? (
            <div className="mt-5 w-full rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5 dark:bg-black dark:ring-white/10">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <Skeleton className="mt-0.5 h-10 w-10" rounded="2xl" />
                  <div className="flex-1">
                    <Skeleton className="h-3 w-44" rounded="md" />
                    <Skeleton className="mt-3 h-5 w-52" rounded="md" />
                    <Skeleton className="mt-2 h-4 w-56" rounded="md" />
                    <Skeleton className="mt-3 h-3 w-36" rounded="md" />
                  </div>
                </div>
                <Skeleton className="h-10 w-10" rounded="2xl" />
              </div>

              <div className="mt-5">
                <Skeleton className="h-2 w-full" rounded="full" />
                <Skeleton className="mt-3 h-3 w-40" rounded="md" />
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={startVerification}
              className="group relative mt-5 w-full overflow-hidden rounded-3xl bg-yellow-500 p-5 text-left shadow-lg shadow-yellow-500/25 ring-1 ring-white/15 transition-all hover:-translate-y-0.5 hover:bg-yellow-400 active:translate-y-0"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15 text-white ring-1 ring-white/20">
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
                    <div className="text-[11px] font-semibold tracking-[0.22em] text-white/70">
                      {t("dashboard.getCryptoCard")}
                    </div>
                    <div className="mt-1 text-lg font-extrabold text-white">
                      {t("dashboard.verifyTitle")}
                    </div>
                    <div className="mt-1 text-sm font-medium text-white/75">
                      {t("dashboard.verifySubtitle")}
                    </div>
                    {user ? (
                      <div className="mt-1 text-xs font-semibold text-white/80">
                        {t(`verification.${user.verification_status}`)}
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15 text-white ring-1 ring-white/20">
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
                <div className="h-2 w-full rounded-full bg-white/15">
                  <div className="h-2 w-0 rounded-full bg-white" />
                </div>
                <div className="mt-2 text-[11px] font-semibold tracking-[0.22em] text-white/70">
                  {t("dashboard.stepsDone")}
                </div>
              </div>
            </button>
          )
        ) : null}

        <CashbackCarousel />

        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setSheet("virtual")}
            className="group relative overflow-hidden rounded-3xl bg-white p-4 text-left shadow-sm ring-1 ring-black/5 transition-transform hover:-translate-y-0.5 hover:bg-gray-50 active:translate-y-0 dark:bg-[#1A1D24] dark:ring-white/10 dark:hover:bg-[#20242C]"
          >
            <div className="relative flex h-full min-h-[108px] flex-col justify-between">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#F4F5F7] text-[#111] ring-1 ring-black/5 dark:bg-white/5 dark:text-white dark:ring-white/10">
                <div className="h-5 w-7 rounded-md bg-[#F0A100] ring-1 ring-black/10" />
              </div>
              <div>
                <div className="text-sm font-extrabold text-[#111] dark:text-white">Visa Virtual</div>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => notifyComingSoon()}
            className="group relative overflow-hidden rounded-3xl bg-white p-4 text-left shadow-sm ring-1 ring-black/5 transition-transform hover:-translate-y-0.5 hover:bg-gray-50 active:translate-y-0 dark:bg-[#1A1D24] dark:ring-white/10 dark:hover:bg-[#20242C]"
          >
            <div className="relative flex h-full min-h-[108px] flex-col justify-between">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#F4F5F7] text-[#111] ring-1 ring-black/5 dark:bg-white/5 dark:text-white dark:ring-white/10">
                <div className="h-5 w-7 rounded-md bg-black/10 ring-1 ring-black/10 dark:bg-white/10 dark:ring-white/10" />
              </div>
              <div>
                <div className="text-sm font-extrabold text-[#111] dark:text-white">Visa Física</div>
                <div className="mt-1 text-xs font-semibold text-gray-500 dark:text-gray-400">
                  Próximamente disponible
                </div>
              </div>
            </div>
          </button>
        </div>

        <button
          type="button"
          onClick={() => router.push("/miniapp/referral")}
          className="group relative mt-4 w-full overflow-hidden rounded-3xl bg-white p-0 text-left transition-all active:scale-[0.98] dark:bg-[#1A1D24]"
        >
          <div className="absolute inset-0 z-0 overflow-hidden rounded-3xl">
            <div className="absolute -inset-[100%] animate-[spin_4s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,transparent_0%,#EAB308_50%,transparent_100%)] opacity-100" />
          </div>
          <div className="absolute inset-[1px] z-0 rounded-[23px] bg-white dark:bg-[#1A1D24]" />

          <div className="absolute inset-0 z-10 bg-gradient-to-r from-transparent via-black/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100 dark:via-white/5" />
          
          <div className="relative z-10 flex items-center justify-between gap-4 p-5">
            <div className="flex items-center gap-4">
              <div className="relative inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-yellow-400 to-yellow-600 text-white shadow-lg shadow-yellow-500/20 ring-1 ring-white/20">
                <div className="absolute inset-0 animate-pulse rounded-2xl bg-white/20" />
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  className="relative h-6 w-6"
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
                <div className="text-sm font-bold text-zinc-950 dark:text-white">
                  {t("dashboard.karat")}
                </div>
                <div className="mt-0.5 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  {t("dashboard.inviteFriends")}
                </div>
              </div>
            </div>

            <div className="text-right">
              {referralEligible === null || referralRate === null ? (
                <>
                  <Skeleton className="ml-auto h-4 w-10" rounded="md" />
                  <Skeleton className="ml-auto mt-2 h-3 w-16" rounded="md" />
                </>
              ) : (
                <>
                  <div className="text-sm font-bold text-zinc-950 dark:text-white">
                    {formatInteger(referralEligible)}
                  </div>
                  <div className="mt-0.5 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    {formatUsdt(referralEligible * referralRate)} USDT
                  </div>
                </>
              )}
            </div>
          </div>
          
          <div className="absolute bottom-0 left-0 z-10 h-1 w-full bg-gray-100 dark:bg-white/5">
            <div 
              className="h-full bg-gradient-to-r from-yellow-400 to-yellow-600 transition-all duration-1000"
              style={{ width: `${Math.min(((referralEligible ?? 0) / 100) * 100, 100)}%` }} 
            />
          </div>
        </button>

        <div className="mt-4 w-full overflow-hidden rounded-3xl bg-white p-5 dark:bg-[#1A1D24]">
          <USDTPerformanceChart />
        </div>

        <div className="mt-10">
          <div className="text-xl font-extrabold tracking-tight">
            {t("dashboard.transactions")}
          </div>
          <div className="mt-4 overflow-hidden rounded-3xl p-1">
            <TransactionList />
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
        <VirtualAccountsSheetContent onAction={() => setSheet(null)} />
      </BottomSheet>

      <BottomSheet
        open={sheet === "virtual"}
        label={t("dashboard.visaVirtualSheet")}
        onClose={() => setSheet(null)}
      >
        {isApproved && virtualCard ? (
          <VirtualVisaCardOwnedSheetContent
            header={t("dashboard.visaVirtualSheet")}
            status={(virtualCard.status as any) ?? "active"}
            cardholderName={virtualCard.cardholderName}
            last4={virtualCard.last4 ?? "0000"}
            expiryMonth={virtualCard.expiryMonth ?? 12}
            expiryYear={virtualCard.expiryYear ?? new Date().getFullYear() + 3}
            onToggleLock={() => void toggleVirtualCardLock()}
            onReplace={() => setComingSoonOpen(true)}
          />
        ) : (
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
            actionLabel={
              isApproved
                ? virtualCardLoading
                  ? "Cargando..."
                  : `Comprar por ${formatUsdt(virtualCardPrice ?? 30)} USDT`
                : t("sheets.verifyAccount")
            }
            onAction={() => {
              if (!isApproved) {
                setSheet(null);
                return;
              }
              if (virtualCardLoading) return;
              const price = Number(virtualCardPrice ?? 30);
              openConfirm({
                title: "Confirmar compra",
                message: `Comprar tarjeta virtual por ${formatUsdt(price)} USDT?`,
                confirmLabel: "Comprar",
                onConfirm: () => void performBuyVirtualCard(),
              });
            }}
          />
        )}
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

      <BottomSheet
        open={sheet === "privacy"}
        label={t("settings.privacy")}
        onClose={() => setSheet(null)}
      >
        <PrivacyPolicyContent />
      </BottomSheet>

      <BottomSheet
        open={sheet === "terms"}
        label="Términos y condiciones"
        onClose={() => setSheet(null)}
      >
        <TermsAndConditionsContent />
      </BottomSheet>

      <footer className="mt-12 flex flex-col items-center gap-2 pb-6 text-center text-xs text-muted">
        <p>&copy; 2026 CriptoCard. Todos los derechos reservados.</p>
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => setSheet("privacy")}
            className="text-xs text-muted underline decoration-muted/50 underline-offset-4 hover:text-foreground"
          >
            {t("settings.privacy")}
          </button>
          <button
            type="button"
            onClick={() => setSheet("terms")}
            className="text-xs text-muted underline decoration-muted/50 underline-offset-4 hover:text-foreground"
          >
            Términos y condiciones
          </button>
        </div>
      </footer>
    </main>
  );
}
