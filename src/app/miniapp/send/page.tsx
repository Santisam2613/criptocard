"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Skeleton from "@/components/ui/Skeleton";
import { useBackendUser } from "@/miniapp/hooks/useBackendUser";

async function redirectToKyc() {
  const res = await fetch("/api/kyc/sumsub/websdk-link", {
    method: "POST",
    credentials: "include",
  });
  const json = (await res.json().catch(() => null)) as
    | { ok: boolean; url?: string }
    | null;
  if (!json?.ok || !json.url) return;

  const wa = window.Telegram?.WebApp;
  if (wa?.openLink) {
    try {
      wa.openLink(json.url);
      return;
    } catch {}
  }
  window.location.href = json.url;
}

type SearchUser = {
  telegram_id: string;
  telegram_username: string | null;
  telegram_first_name: string | null;
  telegram_last_name: string | null;
  telegram_photo_url: string | null;
};

type SendType = "user" | "wallet";

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

function ConfirmDialog(props: {
  open: boolean;
  title: string;
  message: string;
  cancelLabel: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const { open, title, message, cancelLabel, confirmLabel, onCancel, onConfirm } =
    props;

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
          <Button variant="secondary" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant="lime" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

function NoticeDialog(props: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  onClose: () => void;
}) {
  const { open, title, message, confirmLabel, onClose } = props;

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
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-5">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/45 backdrop-blur-sm"
        onClick={onClose}
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
        <div className="mt-5 flex justify-end">
          <Button variant="lime" onClick={onClose}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

function SendPageLoading() {
  return (
    <main className="relative min-h-screen bg-transparent px-4 py-10 text-foreground">
      <div className="mx-auto w-full max-w-[420px]">
        <div className="flex items-center gap-3">
          <div className="cc-glass cc-neon-outline inline-flex h-9 w-9 items-center justify-center rounded-full">
            <Skeleton className="h-4 w-4" rounded="full" />
          </div>
          <Skeleton className="h-7 w-44" rounded="2xl" />
        </div>

        <div className="mt-3 flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3">
          <Skeleton className="h-3 w-20" rounded="md" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-2 w-10" rounded="full" />
            <Skeleton className="h-2 w-10" rounded="full" />
          </div>
        </div>

        <div className="mt-8">
          <Skeleton className="h-5 w-56" rounded="md" />
          <div className="cc-glass cc-neon-outline mt-4 rounded-3xl p-5">
            <Skeleton className="h-3 w-40" rounded="md" />
            <Skeleton className="mt-3 h-12 w-full" rounded="2xl" />
            <Skeleton className="mt-4 h-3 w-32" rounded="md" />
            <Skeleton className="mt-3 h-12 w-full" rounded="2xl" />
            <Skeleton className="mt-4 h-12 w-full" rounded="2xl" />
          </div>
        </div>
      </div>
    </main>
  );
}

export default function SendPage() {
  const router = useRouter();
  const { state, user, refresh } = useBackendUser();
  const [step, setStep] = useState<1 | 2>(1);
  const [sendType, setSendType] = useState<SendType | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState("");
  const [confirmMessage, setConfirmMessage] = useState("");
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [noticeTitle, setNoticeTitle] = useState("");
  const [noticeMessage, setNoticeMessage] = useState("");
  const [noticeConfirmLabel, setNoticeConfirmLabel] = useState("Aceptar");
  const [noticeAction, setNoticeAction] = useState<(() => void) | null>(null);
  const [pendingShown, setPendingShown] = useState(false);
  const [userTransferError, setUserTransferError] = useState<string | null>(null);
  const [recipientError, setRecipientError] = useState<string | null>(null);
  const [approvedGate, setApprovedGate] = useState(false);
  const [isCheckingBalance, setIsCheckingBalance] = useState(false);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  const [isCheckingWithdrawBalance, setIsCheckingWithdrawBalance] = useState(false);

  const [recipientQuery, setRecipientQuery] = useState("");
  const [recipientLoading, setRecipientLoading] = useState(false);
  const [recipient, setRecipient] = useState<SearchUser | null>(null);
  const [amountToUser, setAmountToUser] = useState("");
  const [withdrawAddress, setWithdrawAddress] = useState("");
  const [withdrawNetwork, setWithdrawNetwork] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");

  useEffect(() => {
    if (state.status === "idle" || state.status === "loading") return;
    if (state.status === "ready" && user?.verification_status === "approved") return;

    void (async () => {
      await refresh().catch(() => undefined);
      await redirectToKyc().catch(() => undefined);
    })();
  }, [refresh, state.status, user?.verification_status]);

  useEffect(() => {
    if (user?.verification_status === "approved") setApprovedGate(true);
  }, [user?.verification_status]);

  if (!approvedGate && user?.verification_status !== "approved") {
    if (state.status === "idle" || state.status === "loading") {
      return <SendPageLoading />;
    }
    return <div />;
  }

  const recipientDisplay = (() => {
    if (!recipient) return null;
    const name =
      recipient.telegram_username ||
      [recipient.telegram_first_name, recipient.telegram_last_name]
        .filter(Boolean)
        .join(" ")
        .trim() ||
      recipient.telegram_id;
    return name;
  })();

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
    setNoticeConfirmLabel(params.confirmLabel);
    setNoticeAction(() => params.onClose ?? null);
    setNoticeOpen(true);
  }

  function onContinue() {
    if (!sendType) return;
    setPendingShown(false);
    setStep(2);
  }

  function onBack() {
    setStep(1);
  }

  async function onRequestUserTransferConfirm() {
    setUserTransferError(null);

    if (!recipient) {
      setUserTransferError("Selecciona un destinatario antes de enviar.");
      return;
    }

    const amount = parseUsdLikeAmount(amountToUser);
    if (!Number.isFinite(amount) || amount <= 0) {
      setUserTransferError("Ingresa un monto válido en USDT.");
      return;
    }

    setIsCheckingBalance(true);
    try {
      const refreshed = await refresh().catch(() => ({ ok: false as const }));
      const available =
        refreshed && "ok" in refreshed && refreshed.ok && "user" in refreshed && refreshed.user
          ? Number((refreshed.user as { balance_usdt?: number }).balance_usdt ?? 0)
          : Number(user?.balance_usdt ?? 0);

      if (!Number.isFinite(available) || available < amount) {
        setUserTransferError(
          `Saldo insuficiente. Balance disponible: ${available.toFixed(2)} USDT.`,
        );
        return;
      }

      openConfirm({
        title: "Confirmar envío",
        message: `Enviar ${amount.toFixed(2)} USDT a ${recipientDisplay ?? "destinatario"}?`,
        onConfirm: () => void performSendToUser(),
      });
    } finally {
      setIsCheckingBalance(false);
    }
  }

  async function onRequestWithdrawConfirm() {
    setWithdrawError(null);

    const amount = parseUsdLikeAmount(withdrawAmount);
    if (!withdrawAddress.trim() || !withdrawNetwork.trim()) {
      setWithdrawError("Completa dirección y red antes de enviar.");
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      setWithdrawError("Ingresa un monto válido en USDT.");
      return;
    }

    setIsCheckingWithdrawBalance(true);
    try {
      const refreshed = await refresh().catch(() => ({ ok: false as const }));
      const available =
        refreshed && "ok" in refreshed && refreshed.ok && "user" in refreshed && refreshed.user
          ? Number((refreshed.user as { balance_usdt?: number }).balance_usdt ?? 0)
          : Number(user?.balance_usdt ?? 0);

      if (!Number.isFinite(available) || available < amount) {
        setWithdrawError(
          `Saldo insuficiente. Balance disponible: ${available.toFixed(2)} USDT.`,
        );
        return;
      }

      openConfirm({
        title: "Confirmar solicitud",
        message: `Solicitar retiro de ${amount.toFixed(2)} USDT a wallet externa?`,
        onConfirm: () => void performWithdraw(),
      });
    } finally {
      setIsCheckingWithdrawBalance(false);
    }
  }

  async function onSearchRecipient() {
    const q = recipientQuery.trim();
    if (!q) return;

    const normalized = q.startsWith("@") ? q.slice(1) : q;
    const selfId = String(user?.telegram_id ?? "").trim();
    const selfUsername = String(user?.telegram_username ?? "").trim().toLowerCase();
    if (
      (selfId && normalized === selfId) ||
      (selfUsername && normalized.toLowerCase() === selfUsername)
    ) {
      setRecipient(null);
      setRecipientError("No puedes enviarte a ti mismo.");
      return;
    }

    setRecipient(null);
    setRecipientError(null);
    setRecipientLoading(true);
    try {
      async function doFetch() {
        return fetch(`/api/users/search?q=${encodeURIComponent(normalized)}`, {
          credentials: "include",
          cache: "no-store",
        });
      }

      let res = await doFetch();
      if (res.status === 401) {
        await refresh().catch(() => undefined);
        res = await doFetch();
      }

      if (!res.ok) {
        setRecipientError("No se pudo buscar el usuario.");
        return;
      }

      const json = (await res.json().catch(() => null)) as
        | { ok: boolean; users?: SearchUser[]; error?: string }
        | null;
      if (!json?.ok) {
        setRecipientError(json?.error ?? "No se pudo buscar el usuario.");
        return;
      }

      if (!json.users?.length) {
        setRecipientError("No encontramos un usuario con ese dato.");
        return;
      }

      setRecipient(json.users[0]);
    } finally {
      setRecipientLoading(false);
    }
  }

  async function performSendToUser() {
    if (!recipient) return;
    const amount = parseUsdLikeAmount(amountToUser);
    if (!Number.isFinite(amount) || amount <= 0) return;

    const res = await fetch("/api/transfers/internal", {
      method: "POST",
        credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipient_telegram_id: recipient.telegram_id,
        amount_usdt: amount,
      }),
    });
    const json = (await res.json().catch(() => null)) as
      | { ok: boolean; error?: string }
      | null;
    if (!json?.ok) {
      openNotice({
        title: "No se pudo transferir",
        message: json?.error ?? "Error interno",
        confirmLabel: "Cerrar",
      });
      return;
    }

    setAmountToUser("");
    setRecipientQuery("");
    setRecipient(null);
    setRecipientError(null);
    await refresh().catch(() => undefined);

    openNotice({
      title: "Transferencia exitosa",
      message: `Se envió ${amount.toFixed(2)} USDT correctamente.`,
      confirmLabel: "Ir al inicio",
      onClose: () => router.push("/miniapp"),
    });
  }

  async function performWithdraw() {
    const amount = parseUsdLikeAmount(withdrawAmount);
    if (!withdrawAddress.trim() || !withdrawNetwork.trim()) return;
    if (!Number.isFinite(amount) || amount <= 0) return;

    const res = await fetch("/api/transfers/withdraw", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        address: withdrawAddress,
        network: withdrawNetwork,
        amount_usdt: amount,
      }),
    });
    const json = (await res.json().catch(() => null)) as
      | { ok: boolean; error?: string }
      | null;
    if (!json?.ok) {
      openNotice({
        title: "No se pudo enviar",
        message: json?.error ?? "Error interno",
        confirmLabel: "Cerrar",
      });
      return;
    }

    setPendingShown(true);
    setWithdrawAddress("");
    setWithdrawNetwork("");
    setWithdrawAmount("");
    await refresh().catch(() => undefined);

    openNotice({
      title: "Solicitud enviada",
      message:
        "La solicitud quedará en espera y puede tardar hasta 72 horas en ser aprobada.",
      confirmLabel: "Ir al inicio",
      onClose: () => router.push("/miniapp"),
    });
  }

  return (
    <main className="relative min-h-screen bg-transparent px-4 py-10 text-foreground">
      <div className="mx-auto w-full max-w-[420px]">
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
          <div className="text-2xl font-extrabold tracking-tight">Transferencias</div>
        </div>

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
          confirmLabel={noticeConfirmLabel}
          onClose={() => {
            const action = noticeAction;
            setNoticeOpen(false);
            setNoticeAction(null);
            if (action) action();
          }}
        />

        <div className="mt-3 flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3">
          <div className="text-xs font-semibold text-muted">Paso {step} de 2</div>
          <div className="flex items-center gap-2">
            <div
              className={[
                "h-2 w-10 rounded-full",
                step >= 1
                  ? "bg-[linear-gradient(90deg,var(--color-brand-2),var(--color-brand))]"
                  : "bg-white/10",
              ].join(" ")}
            />
            <div
              className={[
                "h-2 w-10 rounded-full",
                step >= 2
                  ? "bg-[linear-gradient(90deg,var(--color-brand),var(--color-neon))]"
                  : "bg-white/10",
              ].join(" ")}
            />
          </div>
        </div>

        {step === 1 ? (
          <div className="mt-8">
            <div className="text-lg font-bold">PASO 1: Tipo de envío</div>

            <div className="mt-4 space-y-3">
              <button
                type="button"
                onClick={() => setSendType("user")}
                className={[
                  "cc-glass cc-neon-outline w-full rounded-3xl p-5 text-left transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0",
                  sendType === "user"
                    ? "cc-holo bg-white/10 ring-2 ring-[var(--color-neon)] scale-[1.01]"
                    : sendType
                      ? "opacity-50 hover:bg-white/5"
                      : "hover:bg-white/5",
                ].join(" ")}
              >
                <div className="text-base font-extrabold">Enviar de usuario a usuario</div>
                <div className="mt-1 text-sm text-muted">
                  Busca por telegram_id o username y envía USDT.
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSendType("wallet")}
                className={[
                  "cc-glass cc-neon-outline w-full rounded-3xl p-5 text-left transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0",
                  sendType === "wallet"
                    ? "cc-holo bg-white/10 ring-2 ring-[var(--color-neon)] scale-[1.01]"
                    : sendType
                      ? "opacity-55 hover:bg-white/5"
                      : "hover:bg-white/5",
                ].join(" ")}
              >
                <div className="text-base font-extrabold">Enviar a wallet externa</div>
                <div className="mt-1 text-sm text-muted">
                  Ingresa dirección, red y monto. Quedará en espera.
                </div>
              </button>
            </div>

            <div className="mt-6">
              <button
                type="button"
                aria-disabled={!sendType}
                onClick={onContinue}
                className={[
                  "cc-cta cc-gold-cta inline-flex h-14 w-full items-center justify-center rounded-2xl text-base font-semibold text-black ring-1 ring-black/10",
                  !sendType
                    ? "cursor-not-allowed opacity-70"
                    : "hover:brightness-[1.06] hover:-translate-y-0.5 hover:shadow-[0_26px_72px_var(--shadow-brand-strong)] active:translate-y-0",
                ].join(" ")}
              >
                Continuar
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-8">
            <div className="flex items-center justify-between">
              <div className="text-lg font-bold">
                PASO 2: {sendType === "wallet" ? "Enviar a wallet externa" : "Enviar a usuario"}
              </div>
              <button
                type="button"
                onClick={onBack}
                className="text-xs font-semibold text-muted underline decoration-muted/50 underline-offset-4 hover:text-foreground"
              >
                Cambiar
              </button>
            </div>

            {sendType === "user" ? (
              <div className="cc-glass cc-neon-outline mt-4 rounded-3xl p-5">
                <div className="text-sm font-semibold text-muted">Buscar destinatario</div>
                <div className="mt-2 flex gap-2">
                  <input
                    value={recipientQuery}
                    onChange={(e) => setRecipientQuery(e.target.value)}
                    placeholder="telegram_id o @username"
                    className="cc-glass cc-neon-outline h-12 w-full rounded-2xl px-4 text-sm text-foreground placeholder:text-muted"
                  />
                  <button
                    type="button"
                    className="cc-cta cc-gold-cta inline-flex h-12 items-center justify-center rounded-2xl px-4 text-sm font-semibold text-black ring-1 ring-black/10 hover:brightness-[1.06] hover:-translate-y-0.5 hover:shadow-[0_26px_72px_var(--shadow-brand-strong)] active:translate-y-0"
                    onClick={onSearchRecipient}
                  >
                    {recipientLoading ? "..." : "Buscar"}
                  </button>
                </div>

                {recipient ? (
                  <div className="mt-4 rounded-2xl bg-white/5 p-4">
                    <div className="text-xs font-semibold text-muted">Usuario encontrado</div>
                    <div className="mt-1 text-sm font-semibold">{recipientDisplay}</div>
                    <div className="mt-1 text-xs text-muted">telegram_id: {recipient.telegram_id}</div>
                  </div>
                ) : (
                  <div className="mt-4 rounded-2xl bg-white/5 p-4 text-sm text-muted">
                    {recipientError ?? "Busca un usuario para continuar."}
                  </div>
                )}

                <div className="mt-4 text-sm font-semibold text-muted">Monto (USDT)</div>
                <input
                  value={amountToUser}
                  onChange={(e) =>
                    setAmountToUser(
                      formatUsdLikeAmountFromDigits(extractDigits(e.target.value)),
                    )
                  }
                  inputMode="decimal"
                  placeholder="0.00"
                  className="cc-glass cc-neon-outline mt-2 h-12 w-full rounded-2xl px-4 text-sm text-foreground placeholder:text-muted"
                />

                {userTransferError ? (
                  <div className="mt-4 rounded-2xl bg-white/5 p-4 text-sm font-semibold text-muted">
                    {userTransferError}
                  </div>
                ) : null}

                <div className="mt-4">
                  <button
                    type="button"
                    disabled={isCheckingBalance}
                    aria-busy={isCheckingBalance}
                    className="cc-cta cc-gold-cta inline-flex h-12 w-full items-center justify-center rounded-2xl text-sm font-semibold text-black ring-1 ring-black/10 hover:brightness-[1.06] hover:-translate-y-0.5 hover:shadow-[0_26px_72px_var(--shadow-brand-strong)] active:translate-y-0"
                    onClick={onRequestUserTransferConfirm}
                  >
                    {isCheckingBalance ? "Validando..." : "Enviar"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="cc-glass cc-neon-outline mt-4 rounded-3xl p-5">
                <div className="rounded-2xl bg-white/5 p-4 text-sm text-muted">
                  La solicitud quedará en espera y puede tardar hasta 72 horas en ser aprobada
                </div>

                {pendingShown ? (
                  <div className="mt-4 rounded-2xl bg-white/5 p-4">
                    <div className="text-sm font-semibold">En espera</div>
                    <div className="mt-1 text-xs text-muted">
                      Solicitud enviada con estado pendiente.
                    </div>
                  </div>
                ) : null}

                <div className="mt-4 text-sm font-semibold text-muted">Dirección</div>
                <input
                  value={withdrawAddress}
                  onChange={(e) => setWithdrawAddress(e.target.value)}
                  placeholder="0x..."
                  className="cc-glass cc-neon-outline mt-2 h-12 w-full rounded-2xl px-4 text-sm text-foreground placeholder:text-muted"
                />

                <div className="mt-4 text-sm font-semibold text-muted">Red</div>
                <input
                  value={withdrawNetwork}
                  onChange={(e) => setWithdrawNetwork(e.target.value)}
                  placeholder="TRC20 / ERC20 / ..."
                  className="cc-glass cc-neon-outline mt-2 h-12 w-full rounded-2xl px-4 text-sm text-foreground placeholder:text-muted"
                />

                <div className="mt-4 text-sm font-semibold text-muted">Monto (USDT)</div>
                <input
                  value={withdrawAmount}
                  onChange={(e) =>
                    setWithdrawAmount(
                      formatUsdLikeAmountFromDigits(extractDigits(e.target.value)),
                    )
                  }
                  inputMode="decimal"
                  placeholder="0.00"
                  className="cc-glass cc-neon-outline mt-2 h-12 w-full rounded-2xl px-4 text-sm text-foreground placeholder:text-muted"
                />

                {withdrawError ? (
                  <div className="mt-4 rounded-2xl bg-white/5 p-4 text-sm font-semibold text-muted">
                    {withdrawError}
                  </div>
                ) : null}

                <div className="mt-4">
                  <button
                    type="button"
                    disabled={isCheckingWithdrawBalance}
                    aria-busy={isCheckingWithdrawBalance}
                    className="cc-cta cc-gold-cta inline-flex h-12 w-full items-center justify-center rounded-2xl text-sm font-semibold text-black ring-1 ring-black/10 hover:brightness-[1.06] hover:-translate-y-0.5 hover:shadow-[0_26px_72px_var(--shadow-brand-strong)] active:translate-y-0"
                    onClick={onRequestWithdrawConfirm}
                  >
                    {isCheckingWithdrawBalance ? "Validando..." : "Enviar"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
