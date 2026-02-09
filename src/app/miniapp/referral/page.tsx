"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

import NoticeDialog from "@/components/ui/NoticeDialog";
import Skeleton from "@/components/ui/Skeleton";
import { useBackendUser } from "@/miniapp/hooks/useBackendUser";
import { useTelegram } from "@/telegram/TelegramContext";
import { formatInteger, formatUsdt } from "@/lib/format/number";

function PullSpinner({ progress }: { progress: number }) {
  const clamped = Math.max(0, Math.min(1, progress));
  const opacity = 0.2 + clamped * 0.8;
  const translateY = clamped * 10;
  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-40 flex justify-center pt-3"
      style={{ opacity, transform: `translateY(${translateY}px)` }}
      aria-hidden="true"
    >
      <div className="cc-glass cc-neon-outline inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold text-foreground">
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4 animate-spin"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 12a9 9 0 1 1-9-9" />
        </svg>
        Actualizando…
      </div>
    </div>
  );
}

function PullToRefresh({
  children,
  onRefresh,
}: {
  children: ReactNode;
  onRefresh: () => Promise<void>;
}) {
  const startYRef = useRef<number | null>(null);
  const pullingRef = useRef(false);
  const [pullY, setPullY] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const threshold = 76;
  const progress = Math.min(1, pullY / threshold);

  // Solo iniciamos el gesto si la página está en el tope.
  function canStartPull() {
    if (typeof window === "undefined") return false;
    return window.scrollY <= 0;
  }

  function onTouchStart(e: React.TouchEvent) {
    if (refreshing) return;
    if (!canStartPull()) return;
    startYRef.current = e.touches[0]?.clientY ?? 0;
    pullingRef.current = true;
  }

  function onTouchMove(e: React.TouchEvent) {
    if (!pullingRef.current) return;
    const startY = startYRef.current;
    if (startY === null) return;
    const y = e.touches[0]?.clientY ?? 0;
    const delta = y - startY;
    const next = delta > 0 ? Math.min(140, delta * 0.6) : 0;
    setPullY(next);
  }

  async function finishPull() {
    pullingRef.current = false;
    startYRef.current = null;
    if (refreshing) return;

    // Si no supera el umbral, vuelve sin refrescar.
    if (pullY < threshold) {
      setPullY(0);
      return;
    }

    setRefreshing(true);
    setPullY(threshold);
    try {
      // Refresca solo datos (no recarga el navegador).
      await onRefresh();
    } finally {
      setRefreshing(false);
      setPullY(0);
    }
  }

  return (
    <div onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={finishPull}>
      {(pullY > 0 || refreshing) && <PullSpinner progress={refreshing ? 1 : progress} />}
      <div style={{ transform: pullY > 0 ? `translateY(${pullY}px)` : undefined }}>
        {children}
      </div>
    </div>
  );
}

function CoinIcon() {
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
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12h8" />
      <path d="M12 8v8" />
    </svg>
  );
}

function DiamondIcon() {
  return (
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
      <path d="M6 3h12l4 6-10 13L2 9l4-6z" />
      <path d="M2 9h20" />
      <path d="M12 3l3 6-3 13-3-13 3-6z" />
    </svg>
  );
}

type ReferralStatus = "pending" | "eligible" | "claimed";

type ReferralItem = {
  id: string;
  status: ReferralStatus;
  reward_amount_usdt: number;
  created_at: string;
  referred: {
    telegram_id: string;
    telegram_username: string | null;
    telegram_first_name: string | null;
    telegram_last_name: string | null;
  } | null;
};

type ReferralSummary = {
  counts: { total: number; pending: number; eligible: number; claimed: number };
  diamond_to_usdt_rate: number;
  has_topup?: boolean;
  referrals: ReferralItem[];
  my_referrer:
    | {
        status: ReferralStatus;
        referrer: {
          telegram_id: string;
          telegram_username: string | null;
          telegram_first_name: string | null;
          telegram_last_name: string | null;
        } | null;
      }
    | null;
};

function statusLabel(status: ReferralStatus) {
  if (status === "eligible") return "Listo para reclamar";
  if (status === "claimed") return "Reclamado";
  return "En espera";
}

function formatRate(rate: number) {
  if (!Number.isFinite(rate)) return "0.01";
  const s = rate.toFixed(6);
  return s.replace(/0+$/, "").replace(/\.$/, "");
}

function personLabel(person: {
  telegram_id: string;
  telegram_username: string | null;
  telegram_first_name: string | null;
  telegram_last_name: string | null;
}) {
  if (person.telegram_username) return `@${person.telegram_username}`;
  const full = [person.telegram_first_name, person.telegram_last_name].filter(Boolean).join(" ").trim();
  if (full) return full;
  return `ID: ${person.telegram_id}`;
}

function ConfirmDialog(props: {
  open: boolean;
  title: string;
  message: string;
  cancelLabel: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const { open, title, message, cancelLabel, confirmLabel, onCancel, onConfirm } = props;

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-5">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/45 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="cc-glass-strong cc-neon-outline relative w-full max-w-[380px] rounded-3xl p-6"
      >
        <div className="text-base font-extrabold tracking-tight text-foreground">
          {title}
        </div>
        <div className="mt-2 text-sm leading-relaxed text-muted">{message}</div>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            className="cc-cta cc-glass inline-flex h-10 items-center justify-center rounded-full px-5 text-sm font-semibold text-foreground ring-1 ring-border"
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className="cc-cta cc-gold-cta inline-flex h-10 items-center justify-center rounded-full px-5 text-sm font-semibold text-black ring-1 ring-black/10 hover:brightness-[1.06] active:brightness-[0.98]"
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ReferralPage() {
  const router = useRouter();
  const telegram = useTelegram();
  const { state, user, refresh } = useBackendUser();
  const [copied, setCopied] = useState(false);
  const [inviterId, setInviterId] = useState("");
  const [inviterStatus, setInviterStatus] = useState<string | null>(null);
  const [isValidatingInviter, setIsValidatingInviter] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [summary, setSummary] = useState<ReferralSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const isProfileLoading = state.status === "idle" || state.status === "loading";
  const rewardPageSize = 8;
  const [rewardPage, setRewardPage] = useState(1);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState("");
  const [confirmMessage, setConfirmMessage] = useState("");
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [noticeTitle, setNoticeTitle] = useState("");
  const [noticeMessage, setNoticeMessage] = useState("");
  const [noticeLabel, setNoticeLabel] = useState("Cerrar");
  const [noticeAction, setNoticeAction] = useState<(() => void) | null>(null);

  const referralId = useMemo(() => {
    if (telegram.status === "ready") {
      if (telegram.user?.username) return `@${telegram.user.username}`;
      if (telegram.user?.id) return String(telegram.user.id);
    }
    if (user?.telegram_username) return `@${user.telegram_username}`;
    if (user?.telegram_id) return String(user.telegram_id);
    return "";
  }, [telegram, user]);

  async function onCopyReferralId() {
    if (!referralId) return;
    try {
      await navigator.clipboard.writeText(referralId);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1300);
    } catch {
      setCopied(false);
    }
  }

  async function fetchSummary() {
    setSummaryError(null);
    setSummaryLoading(true);
    try {
      const res = await fetch("/api/referrals/summary", {
        credentials: "include",
        cache: "no-store",
      });
      const json = (await res.json().catch(() => null)) as
        | { ok: boolean; summary?: ReferralSummary; error?: string }
        | null;
      if (!json?.ok || !json.summary) {
        setSummary(null);
        setSummaryError(json?.error ?? "No se pudo cargar referidos");
        return;
      }
      setSummary(json.summary);
    } finally {
      setSummaryLoading(false);
    }
  }

  async function onValidateInviter() {
    const input = inviterId.trim();
    if (!input) return;
    setInviterStatus(null);
    setIsValidatingInviter(true);
    try {
      const res = await fetch("/api/referrals/validate", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviter: input }),
      });
      const json = (await res.json().catch(() => null)) as
        | {
            ok: boolean;
            error?: string;
            referral?: { status?: ReferralStatus } | null;
          }
        | null;
      if (!json?.ok) {
        const msg = json?.error ?? "No se pudo validar";
        setInviterStatus(msg);
        if (msg.toLowerCase().includes("ya existe")) {
          await fetchSummary();
        }
        return;
      }
      const st = json.referral?.status ?? "pending";
      setInviterStatus(
        st === "eligible"
          ? "Validado. Diamante listo para reclamar."
          : "Validado. Queda en espera hasta que el invitador recargue.",
      );
      await fetchSummary();
    } finally {
      setIsValidatingInviter(false);
    }
  }

  function openConfirm(params: {
    title: string;
    message: string;
    onConfirm: () => void;
  }) {
    setConfirmTitle(params.title);
    setConfirmMessage(params.message);
    setConfirmAction(() => params.onConfirm);
    setConfirmOpen(true);
  }

  function openNotice(params: {
    title: string;
    message: string;
    confirmLabel: string;
    onClose?: () => void;
  }) {
    setNoticeTitle(params.title);
    setNoticeMessage(params.message);
    setNoticeLabel(params.confirmLabel);
    setNoticeAction(() => params.onClose ?? null);
    setNoticeOpen(true);
  }

  async function onRequestValidateInviter() {
    const input = inviterId.trim();
    if (!input) return;
    openConfirm({
      title: "Confirmar invitador",
      message:
        `Vas a asociar tu cuenta con el invitador: ${input}\n\n` +
        "Esta acción es única y no podrás cambiar el invitador después.",
      onConfirm: () => void onValidateInviter(),
    });
  }

  async function onClaim() {
    if (isClaiming) return;
    if (summaryLoading) return;
    if (readyToClaim <= 0) return;

    openConfirm({
      title: "Canjear diamantes",
      message: `Canjear ${formatInteger(readyToClaim)} diamante(s) por ${formatUsdt(readyToClaim * rate)} USDT?`,
      onConfirm: async () => {
        setIsClaiming(true);
        try {
          const res = await fetch("/api/referrals/claim", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
          });
          const json = (await res.json().catch(() => null)) as
            | {
                ok: boolean;
                error?: string;
                claim?: {
                  claimed_count?: number;
                  total_usdt?: number;
                  claimed_from?: Array<{
                    telegram_id: string;
                    telegram_username: string | null;
                    telegram_first_name: string | null;
                    telegram_last_name: string | null;
                  }>;
                };
              }
            | null;

          if (!json?.ok) {
            openNotice({
              title: "No se pudo canjear",
              message: json?.error ?? "Error interno",
              confirmLabel: "Cerrar",
            });
            return;
          }

          const claimedCount = Number(json.claim?.claimed_count ?? 0);
          const totalUsdt = Number(json.claim?.total_usdt ?? 0);
          const from = (json.claim?.claimed_from ?? []).map(personLabel);
          const suffix = from.length ? `\n\nProviene de: ${from.join(", ")}` : "";

          await fetchSummary();
          await refresh().catch(() => undefined);

          openNotice({
            title: "Canje realizado",
            message: `Se agregaron ${formatUsdt(totalUsdt)} USDT a tu cuenta.${suffix}`,
            confirmLabel: "Cerrar",
          });
        } finally {
          setIsClaiming(false);
        }
      },
    });
  }

  useEffect(() => {
    void fetchSummary();
  }, []);

  const readyToClaim = summary?.counts.eligible ?? 0;
  const pendingDiamonds = summary?.counts.pending ?? 0;
  const invitedCount = summary?.counts.total ?? 0;
  const rate = summary?.diamond_to_usdt_rate ?? 0.01;
  const hasTopup = Boolean(summary?.has_topup);

  const rewardItems = summary?.referrals ?? [];
  const rewardTotalPages = Math.max(1, Math.ceil(rewardItems.length / rewardPageSize));
  const rewardCurrentPage = Math.min(rewardPage, rewardTotalPages);
  const rewardPageItems = useMemo(() => {
    const start = (rewardCurrentPage - 1) * rewardPageSize;
    return rewardItems.slice(start, start + rewardPageSize);
  }, [rewardCurrentPage, rewardItems]);
  const myReferrer = summary?.my_referrer ?? null;
  const myReferrerName = myReferrer?.referrer ? personLabel(myReferrer.referrer) : null;

  useEffect(() => {
    setRewardPage(1);
  }, [rewardItems.length]);

  return (
    <PullToRefresh
      onRefresh={async () => {
        await fetchSummary().catch(() => undefined);
        await refresh().catch(() => undefined);
      }}
    >
      <main className="relative min-h-screen bg-transparent px-4 py-10 text-foreground">
        <div className="mx-auto w-full max-w-[420px]">
        <ConfirmDialog
          open={confirmOpen}
          title={confirmTitle}
          message={confirmMessage}
          cancelLabel="Cancelar"
          confirmLabel="Confirmar"
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
          open={noticeOpen}
          title={noticeTitle}
          message={noticeMessage}
          confirmLabel={noticeLabel}
          onClose={() => {
            const action = noticeAction;
            setNoticeOpen(false);
            setNoticeAction(null);
            if (action) action();
          }}
        />

        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Volver"
            className="cc-glass cc-neon-outline inline-flex h-9 w-9 items-center justify-center rounded-full transition-transform hover:-translate-y-0.5 active:translate-y-0"
            onClick={() => router.back()}
          >
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
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <div className="text-2xl font-extrabold tracking-tight">Club de amigos</div>
        </div>

        <div className="cc-glass cc-neon-outline mt-6 overflow-hidden rounded-3xl p-5">
          <div className="text-center text-sm font-semibold text-muted">Listo para reclamar</div>
          <div className="mt-3 flex items-center justify-center gap-2">
            {summaryLoading ? (
              <Skeleton className="h-10 w-16" rounded="2xl" />
            ) : (
              <div className="text-4xl font-extrabold tracking-tight">{formatInteger(readyToClaim)}</div>
            )}
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-[var(--color-neon)] ring-1 ring-border">
              <DiamondIcon />
            </div>
          </div>
          {summaryLoading ? (
            <div className="mt-3 flex justify-center">
              <Skeleton className="h-4 w-44" rounded="2xl" />
            </div>
          ) : (
            <div className="mt-2 text-center text-sm font-semibold text-muted">
              1 DIAMANTE = {formatRate(rate)} USDT
            </div>
          )}

          <div className="mt-5 grid grid-cols-2 gap-3">
            <button
              type="button"
              disabled={summaryLoading || isClaiming || readyToClaim <= 0}
              aria-busy={isClaiming}
              onClick={onClaim}
              className="cc-cta cc-gold-cta col-span-2 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-sm font-semibold text-black ring-1 ring-black/10 hover:brightness-[1.06] hover:-translate-y-0.5 hover:shadow-[0_26px_72px_var(--shadow-brand-strong)] active:translate-y-0"
            >
              <CoinIcon />
              {isClaiming ? "Canjeando..." : "Reclamar"}
            </button>
          </div>

          <div className="mt-4 flex items-center justify-center gap-2 text-sm font-semibold text-muted">
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
              <path d="M12 8v4l3 2" />
              <circle cx="12" cy="12" r="10" />
            </svg>
            {summaryLoading ? (
              <div className="flex items-center gap-2">
                <span>Diamantes pendientes:</span>
                <Skeleton className="h-4 w-8" rounded="md" />
              </div>
            ) : (
              <>Diamantes pendientes: {formatInteger(pendingDiamonds)}</>
            )}
          </div>
        </div>

        <div className="cc-glass cc-neon-outline mt-4 overflow-hidden rounded-3xl p-5">
          <div className="text-sm font-semibold text-muted">Copiar ID de referido</div>
          <div className="mt-2 flex items-center gap-2">
            <div className="cc-glass cc-neon-outline flex h-12 w-full items-center rounded-2xl px-4 text-sm font-semibold text-foreground">
              {isProfileLoading && !referralId ? (
                <Skeleton className="h-4 w-40" rounded="md" />
              ) : (
                referralId || "—"
              )}
            </div>
            <button
              type="button"
              onClick={onCopyReferralId}
              disabled={!referralId}
              className="cc-cta cc-gold-cta inline-flex h-12 shrink-0 items-center justify-center rounded-2xl px-4 text-sm font-semibold text-black ring-1 ring-black/10 hover:brightness-[1.06] hover:-translate-y-0.5 hover:shadow-[0_26px_72px_var(--shadow-brand-strong)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {copied ? "Copiado" : "Copiar"}
            </button>
          </div>

          <div className="mt-4 text-sm font-semibold text-muted">
            ID del referido que te invitó
          </div>
          {myReferrer ? (
            <div className="mt-3 rounded-2xl bg-white/5 p-4">
              <div className="text-xs font-semibold text-muted">Invitador</div>
              <div className="mt-1 text-sm font-semibold text-foreground">
                {myReferrerName ?? "—"}
              </div>
              <div className="mt-1 text-xs font-semibold text-muted">
                {statusLabel(myReferrer.status)}
              </div>
              <div className="mt-3 text-xs text-muted">
                Tu cuenta ya quedó asociada a un invitador. No puedes cambiarlo.
              </div>
            </div>
          ) : summaryLoading ? (
            <div className="mt-3 rounded-2xl bg-white/5 p-4">
              <Skeleton className="h-3 w-64" rounded="md" />
              <Skeleton className="mt-3 h-3 w-48" rounded="md" />
            </div>
          ) : hasTopup ? (
            <div className="mt-3 rounded-2xl bg-white/5 p-4 text-sm font-semibold text-muted">
              Solo puedes ingresar el ID de tu invitador antes de realizar tu primera recarga.
            </div>
          ) : (
            <>
              <div className="mt-2 flex items-center gap-2">
                <input
                  value={inviterId}
                  onChange={(e) =>
                    setInviterId(e.target.value.replace(/[^0-9a-zA-Z_@]/g, ""))
                  }
                  placeholder="@username o telegram_id"
                  className="cc-glass cc-neon-outline h-12 w-full rounded-2xl px-4 text-sm text-foreground placeholder:text-muted"
                />
                <button
                  type="button"
                  disabled={isValidatingInviter || !inviterId.trim()}
                  aria-busy={isValidatingInviter}
                  onClick={onRequestValidateInviter}
                  className="cc-cta cc-gold-cta inline-flex h-12 shrink-0 items-center justify-center rounded-2xl px-4 text-sm font-semibold text-black ring-1 ring-black/10 hover:brightness-[1.06] hover:-translate-y-0.5 hover:shadow-[0_26px_72px_var(--shadow-brand-strong)] active:translate-y-0"
                >
                  {isValidatingInviter ? "Validando..." : "Validar"}
                </button>
              </div>
              {isValidatingInviter ? (
                <div className="mt-3 rounded-2xl bg-white/5 p-4">
                  <Skeleton className="h-3 w-56" rounded="md" />
                </div>
              ) : inviterStatus ? (
                <div className="mt-3 text-sm font-semibold text-muted">{inviterStatus}</div>
              ) : null}
            </>
          )}
        </div>

        <div className="cc-glass cc-neon-outline mt-4 overflow-hidden rounded-2xl">
          <div className="flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="text-2xl">👥</div>
              <div className="text-sm font-semibold text-foreground">Amigos invitados</div>
            </div>
            <div className="text-sm font-semibold text-foreground">
              {summaryLoading ? <Skeleton className="h-4 w-6" rounded="md" /> : formatInteger(invitedCount)}
            </div>
          </div>
        </div>

        <div className="mt-8 text-xl font-extrabold tracking-tight">Recompensas</div>
        {summaryError ? (
          <div className="cc-glass cc-neon-outline mt-4 overflow-hidden rounded-3xl p-5 text-sm font-semibold text-muted">
            {summaryError}
          </div>
        ) : summaryLoading ? (
          <div className="cc-glass cc-neon-outline mt-4 overflow-hidden rounded-3xl p-8">
            <div className="flex justify-center">
              <div className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-white/5 text-[var(--color-neon)] ring-1 ring-border">
                <DiamondIcon />
              </div>
            </div>
            <div className="mt-6 text-center text-2xl font-extrabold tracking-tight">…</div>
            <div className="mt-2 text-center text-sm font-semibold text-muted">Cargando</div>
          </div>
        ) : rewardItems.length === 0 ? (
          <div className="cc-glass cc-neon-outline mt-4 overflow-hidden rounded-3xl p-8">
            <div className="flex justify-center">
              <div className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-white/5 text-[var(--color-neon)] ring-1 ring-border">
                <DiamondIcon />
              </div>
            </div>
            <div className="mt-6 text-center text-2xl font-extrabold tracking-tight">
              Aún no hay diamantes
            </div>
            <div className="mt-2 text-center text-sm font-semibold text-muted">
              Empieza invitando amigos para ganar
            </div>
          </div>
        ) : (
          <div className="cc-glass cc-neon-outline mt-4 overflow-hidden rounded-3xl p-1">
            <div className="space-y-2 p-2">
              {rewardPageItems.map((r) => {
                const name =
                  r.referred?.telegram_username
                    ? `@${r.referred.telegram_username}`
                    : r.referred?.telegram_first_name || r.referred?.telegram_last_name
                      ? `${[r.referred?.telegram_first_name, r.referred?.telegram_last_name]
                          .filter(Boolean)
                          .join(" ")
                          .trim()}`
                      : r.referred?.telegram_id
                        ? `ID: ${r.referred.telegram_id}`
                        : "Usuario";
                return (
                  <div
                    key={r.id}
                    className="flex items-center justify-between rounded-2xl bg-white/5 p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[radial-gradient(circle_at_30%_30%,var(--color-neon),transparent_60%)] text-foreground ring-1 ring-border">
                        <DiamondIcon />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-foreground">{name}</div>
                        <div className="text-xs text-muted">{statusLabel(r.status)}</div>
                      </div>
                    </div>
                    <div className="text-sm font-bold text-foreground">
                      {formatUsdt(r.reward_amount_usdt)} USDT
                    </div>
                  </div>
                );
              })}
            </div>
            {rewardTotalPages > 1 ? (
              <div className="flex items-center justify-between gap-3 px-3 pb-3">
                <button
                  type="button"
                  disabled={rewardCurrentPage <= 1}
                  onClick={() => setRewardPage((p) => Math.max(1, p - 1))}
                  className="cc-glass cc-neon-outline inline-flex h-10 items-center justify-center rounded-full px-4 text-sm font-semibold text-foreground disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Anterior
                </button>
                <div className="text-xs font-semibold text-muted">
                  Página {rewardCurrentPage} de {rewardTotalPages}
                </div>
                <button
                  type="button"
                  disabled={rewardCurrentPage >= rewardTotalPages}
                  onClick={() => setRewardPage((p) => Math.min(rewardTotalPages, p + 1))}
                  className="cc-glass cc-neon-outline inline-flex h-10 items-center justify-center rounded-full px-4 text-sm font-semibold text-foreground disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Siguiente
                </button>
              </div>
            ) : null}
          </div>
        )}
        </div>
      </main>
    </PullToRefresh>
  );
}
