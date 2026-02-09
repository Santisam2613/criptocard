"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import NoticeDialog from "@/components/ui/NoticeDialog";
import Skeleton from "@/components/ui/Skeleton";
import { useBackendUser } from "@/miniapp/hooks/useBackendUser";
import { formatUsdt } from "@/lib/format/number";

function extractDigits(input: string) {
  return input.replace(/[^0-9]/g, "");
}

function addThousandsSeparators(integerPart: string) {
  return integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function formatUsdLikeAmountFromDigits(digits: string) {
  const normalized = digits.replace(/^0+/, "");
  if (!normalized) return "";
  if (normalized.length === 1) return `0.0${normalized}`;
  if (normalized.length === 2) return `0.${normalized}`;
  const integer = normalized.slice(0, -2);
  const decimals = normalized.slice(-2);
  return `${addThousandsSeparators(integer)}.${decimals}`;
}

function parseUsdLikeAmount(input: string) {
  return Number(input.replace(/,/g, ""));
}

export default function TopUpPage() {
  const router = useRouter();
  const { state, user, refresh } = useBackendUser();
  const [approvedGate, setApprovedGate] = useState(false);
  const [amount, setAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [minTopupUsdt, setMinTopupUsdt] = useState<number | null>(null);
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [noticeTitle, setNoticeTitle] = useState("");
  const [noticeMessage, setNoticeMessage] = useState("");
  const [noticeLabel, setNoticeLabel] = useState("Aceptar");
  const [noticeAction, setNoticeAction] = useState<(() => void) | null>(null);

  const isReady = state.status === "ready";
  const isApproved = isReady && user?.verification_status === "approved";
  const displayBalance = useMemo(() => {
    return Number(user?.balance_usdt ?? 0);
  }, [user?.balance_usdt]);

  useEffect(() => {
    if (user?.verification_status === "approved") setApprovedGate(true);
  }, [user?.verification_status]);

  useEffect(() => {
    let canceled = false;
    async function loadMinTopup() {
      try {
        const res = await fetch("/api/config/min-topup", {
          credentials: "include",
          cache: "no-store",
        });
        const json = (await res.json().catch(() => null)) as
          | { ok: boolean; minTopupUsdt?: number }
          | null;
        if (!json?.ok) return;
        if (canceled) return;
        setMinTopupUsdt(
          Number.isFinite(Number(json.minTopupUsdt)) ? Number(json.minTopupUsdt) : 0,
        );
      } catch {}
    }
    void loadMinTopup();
    return () => {
      canceled = true;
    };
  }, []);

  if (!approvedGate && user?.verification_status !== "approved") {
    if (state.status === "idle" || state.status === "loading") {
      return (
        <main className="relative min-h-screen bg-transparent px-4 py-10 text-foreground">
          <div className="mx-auto w-full max-w-[420px]">
            <div className="flex items-center gap-3">
              <div className="cc-glass cc-neon-outline inline-flex h-9 w-9 items-center justify-center rounded-full">
                <Skeleton className="h-4 w-4" rounded="full" />
              </div>
              <Skeleton className="h-7 w-44" rounded="2xl" />
            </div>
            <div className="mt-6 cc-glass cc-neon-outline rounded-3xl p-5">
              <Skeleton className="h-4 w-28" rounded="md" />
              <Skeleton className="mt-3 h-10 w-32" rounded="2xl" />
              <Skeleton className="mt-5 h-12 w-full" rounded="2xl" />
              <Skeleton className="mt-4 h-12 w-full" rounded="2xl" />
            </div>
          </div>
        </main>
      );
    }
    return <div />;
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

  async function onTopUp() {
    const value = parseUsdLikeAmount(amount);
    if (!Number.isFinite(value) || value <= 0) {
      openNotice({
        title: "Monto inválido",
        message: "Ingresa un monto válido en USDT.",
        confirmLabel: "Cerrar",
      });
      return;
    }
    if (minTopupUsdt !== null && value < minTopupUsdt) {
      openNotice({
        title: "Monto mínimo",
        message: `El monto mínimo para recargar es ${formatUsdt(minTopupUsdt)} USDT.`,
        confirmLabel: "Cerrar",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/topup", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount_usdt: value }),
      });
      const json = (await res.json().catch(() => null)) as
        | { ok: boolean; error?: string }
        | null;
      if (!json?.ok) {
        openNotice({
          title: "No se pudo recargar",
          message: json?.error ?? "Error interno",
          confirmLabel: "Cerrar",
        });
        return;
      }

      setAmount("");
      await refresh().catch(() => undefined);
      openNotice({
        title: "Recarga exitosa",
        message: `Se acreditó ${formatUsdt(value)} USDT a tu cuenta.`,
        confirmLabel: "Ir al inicio",
        onClose: () => router.push("/miniapp"),
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="relative min-h-screen bg-transparent px-4 py-10 text-foreground">
      <div className="mx-auto w-full max-w-[420px]">
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
          <div className="text-2xl font-extrabold tracking-tight">Recargar</div>
        </div>

        <div className="cc-glass cc-neon-outline mt-6 rounded-3xl p-5">
          <div className="text-xs font-semibold text-muted">Balance actual</div>
          <div className="mt-1 text-3xl font-extrabold tracking-tight">
            {isReady ? `$${formatUsdt(displayBalance)}` : "—"}
          </div>

          <div className="mt-5 text-sm font-semibold text-muted">Monto (USDT)</div>
          <input
            value={amount}
            onChange={(e) =>
              setAmount(formatUsdLikeAmountFromDigits(extractDigits(e.target.value)))
            }
            inputMode="decimal"
            placeholder="0.00"
            className="cc-glass cc-neon-outline mt-2 h-12 w-full rounded-2xl px-4 text-sm text-foreground placeholder:text-muted"
          />
          <div className="mt-4 rounded-2xl bg-white/5 p-4 text-sm text-muted">
            El monto mínimo para recargar es {formatUsdt(minTopupUsdt ?? 0)} USDT
          </div>

          <div className="mt-4">
            <button
              type="button"
              disabled={isSubmitting}
              aria-busy={isSubmitting}
              onClick={onTopUp}
              className="cc-cta cc-gold-cta inline-flex h-12 w-full items-center justify-center rounded-2xl text-sm font-semibold text-black ring-1 ring-black/10 hover:brightness-[1.06] hover:-translate-y-0.5 hover:shadow-[0_26px_72px_var(--shadow-brand-strong)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Recargando..." : "Recargar"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
