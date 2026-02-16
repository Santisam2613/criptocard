"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Skeleton from "@/components/ui/Skeleton";
import { useI18n } from "@/i18n/i18n";
import { useBackendUser } from "@/miniapp/hooks/useBackendUser";
import { formatUsdt } from "@/lib/format/number";

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
  const { t } = useI18n();
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
        aria-label={t("common.closeAria")}
        className="absolute inset-0 bg-black/60 backdrop-blur-md transition-all duration-300"
        onClick={onCancel}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative w-full max-w-[380px] scale-100 overflow-hidden rounded-[32px] bg-white p-0 shadow-2xl transition-all dark:bg-[#1A1D24]"
      >
        <div className="relative p-8 text-center">
          <div className="mb-5 inline-flex h-16 w-16 items-center justify-center rounded-full bg-yellow-50 text-yellow-600 dark:bg-yellow-500/10 dark:text-yellow-400">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="h-8 w-8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 9v4" />
              <path d="M12 17h.01" />
              <path d="M10.3 3.7h3.4L22 18.3a2 2 0 0 1-1.7 3H3.7a2 2 0 0 1-1.7-3L10.3 3.7z" />
            </svg>
          </div>

          <div className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
            {title}
          </div>
          <div className="mt-3 text-base leading-relaxed text-zinc-600 dark:text-white/70">
            {message}
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-gray-100 text-sm font-bold text-zinc-900 transition-transform active:scale-[0.98] dark:bg-white/10 dark:text-white"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-yellow-500 text-sm font-bold text-black shadow-lg shadow-yellow-500/25 transition-transform active:scale-[0.98]"
            >
              {confirmLabel}
            </button>
          </div>
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
  const { t } = useI18n();
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
        aria-label={t("common.closeAria")}
        className="absolute inset-0 bg-black/60 backdrop-blur-md transition-all duration-300"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative w-full max-w-[340px] scale-100 overflow-hidden rounded-[32px] bg-white p-0 shadow-2xl transition-all dark:bg-[#1A1D24]"
      >
        <div className="relative flex flex-col items-center p-8 text-center">
          <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-yellow-50 text-yellow-600 dark:bg-yellow-500/10 dark:text-yellow-400">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="h-12 w-12"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
            {title}
          </h2>
          <p className="mt-3 text-base leading-relaxed text-zinc-500 dark:text-zinc-400">
            {message}
          </p>

          <button
            type="button"
            onClick={onClose}
            className="mt-8 w-full rounded-2xl bg-yellow-500 py-4 text-base font-bold text-black shadow-lg shadow-yellow-500/25 transition-transform active:scale-[0.98]"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function SendPageLoading() {
  return (
    <main className="relative min-h-screen bg-white px-4 py-10 text-zinc-950 dark:bg-black dark:text-white">
      <div className="mx-auto w-full max-w-[420px]">
        <div className="flex items-center gap-3">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-black/5 dark:bg-zinc-900 dark:ring-white/10">
            <Skeleton className="h-4 w-4" rounded="full" />
          </div>
          <Skeleton className="h-7 w-44" rounded="2xl" />
        </div>

        <div className="mt-3 flex items-center justify-between rounded-2xl bg-gray-50 px-4 py-3 ring-1 ring-black/5 dark:bg-white/5 dark:ring-white/10">
          <Skeleton className="h-3 w-20" rounded="md" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-2 w-10" rounded="full" />
            <Skeleton className="h-2 w-10" rounded="full" />
          </div>
        </div>

        <div className="mt-8">
          <Skeleton className="h-5 w-56" rounded="md" />
          <div className="mt-4 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5 dark:bg-zinc-900 dark:ring-white/10">
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
  const { t } = useI18n();
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
  const [noticeConfirmLabel, setNoticeConfirmLabel] = useState("OK");
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
  const [minWithdrawalUsdt, setMinWithdrawalUsdt] = useState<number | null>(null);

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

  useEffect(() => {
    let canceled = false;
    async function loadMinWithdrawal() {
      try {
        const res = await fetch("/api/config/min-withdrawal", {
          credentials: "include",
          cache: "no-store",
        });
        const json = (await res.json().catch(() => null)) as
          | { ok: boolean; minWithdrawalUsdt?: number }
          | null;
        if (!json?.ok) return;
        if (canceled) return;
        setMinWithdrawalUsdt(
          Number.isFinite(Number(json.minWithdrawalUsdt)) ? Number(json.minWithdrawalUsdt) : 0,
        );
      } catch {}
    }
    void loadMinWithdrawal();
    return () => {
      canceled = true;
    };
  }, []);

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
      setUserTransferError(t("send.errors.noRecipient"));
      return;
    }

    const amount = parseUsdLikeAmount(amountToUser);
    if (!Number.isFinite(amount) || amount <= 0) {
      setUserTransferError(t("send.errors.invalidAmount"));
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
          `${t("send.errors.insufficientBalancePrefix")} ${formatUsdt(available)} USDT.`,
        );
        return;
      }

      openConfirm({
        title: t("send.confirm.userTransfer.title"),
        message: `${t("send.confirm.userTransfer.messagePrefix")} ${formatUsdt(amount)} USDT ${t("send.confirm.userTransfer.messageTo")} ${recipientDisplay ?? t("send.confirm.userTransfer.fallbackRecipient")}?`,
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
      setWithdrawError(t("send.errors.missingWithdrawFields"));
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      setWithdrawError(t("send.errors.invalidAmount"));
      return;
    }
    if (minWithdrawalUsdt !== null && amount < minWithdrawalUsdt) {
      setWithdrawError(
        `${t("send.errors.minWithdrawalPrefix")} ${formatUsdt(minWithdrawalUsdt)} USDT.`,
      );
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
          `${t("send.errors.insufficientBalancePrefix")} ${formatUsdt(available)} USDT.`,
        );
        return;
      }

      openConfirm({
        title: t("send.confirm.withdraw.title"),
        message: `${t("send.confirm.withdraw.messagePrefix")} ${formatUsdt(amount)} USDT ${t("send.confirm.withdraw.messageSuffix")}`,
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
      setRecipientError(t("send.errors.selfTransfer"));
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
        setRecipientError(t("send.errors.searchFailed"));
        return;
      }

      const json = (await res.json().catch(() => null)) as
        | { ok: boolean; users?: SearchUser[]; error?: string }
        | null;
      if (!json?.ok) {
        setRecipientError(json?.error ?? t("send.errors.searchFailed"));
        return;
      }

      if (!json.users?.length) {
        setRecipientError(t("send.errors.userNotFound"));
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
        title: t("send.errors.transferFailed.title"),
        message: json?.error ?? t("errors.internal"),
        confirmLabel: t("common.close"),
      });
      return;
    }

    setAmountToUser("");
    setRecipientQuery("");
    setRecipient(null);
    setRecipientError(null);
    await refresh().catch(() => undefined);

    openNotice({
      title: t("send.success.transfer.title"),
      message: `${t("send.success.transfer.bodyPrefix")} ${formatUsdt(amount)} USDT ${t("send.success.transfer.bodySuffix")}`,
      confirmLabel: t("common.goHome"),
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
        title: t("send.errors.withdrawFailed.title"),
        message: json?.error ?? t("errors.internal"),
        confirmLabel: t("common.close"),
      });
      return;
    }

    setPendingShown(true);
    setWithdrawAddress("");
    setWithdrawNetwork("");
    setWithdrawAmount("");
    await refresh().catch(() => undefined);

    openNotice({
      title: t("send.success.withdraw.title"),
      message: t("send.success.withdraw.body"),
      confirmLabel: t("common.goHome"),
      onClose: () => router.push("/miniapp"),
    });
  }

  return (
    <main className="relative min-h-screen bg-white px-4 py-10 text-zinc-950 dark:bg-black dark:text-white">
      <div className="mx-auto w-full max-w-[420px]">
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label={t("common.backAria")}
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-black/5 transition-transform hover:-translate-y-0.5 active:translate-y-0 dark:bg-zinc-900 dark:ring-white/10"
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
          <div className="text-2xl font-extrabold tracking-tight">{t("send.title")}</div>
        </div>

        <ConfirmDialog
          open={confirmOpen}
          title={confirmTitle}
          message={confirmMessage}
          cancelLabel={t("common.cancel")}
          confirmLabel={t("common.confirm")}
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

        <div className="mt-3 flex items-center justify-between rounded-2xl bg-gray-50 px-4 py-3 ring-1 ring-black/5 dark:bg-white/5 dark:ring-white/10">
          <div className="text-xs font-semibold text-zinc-500 dark:text-white/60">
            {t("send.stepIndicator").replace("{current}", String(step)).replace("{total}", "2")}
          </div>
          <div className="flex items-center gap-2">
            <div
              className={[
                "h-2 w-10 rounded-full",
                step >= 1
                  ? "bg-yellow-500"
                  : "bg-black/10 dark:bg-white/10",
              ].join(" ")}
            />
            <div
              className={[
                "h-2 w-10 rounded-full",
                step >= 2
                  ? "bg-yellow-500"
                  : "bg-black/10 dark:bg-white/10",
              ].join(" ")}
            />
          </div>
        </div>

        {step === 1 ? (
          <div className="mt-8">
            <div className="text-lg font-extrabold tracking-tight">{t("send.step1.title")}</div>
            <div className="mt-1 text-sm font-medium text-zinc-500 dark:text-white/60">
              {t("send.step1.subtitle")}
            </div>

            <div className="mt-4 space-y-3">
              <button
                type="button"
                onClick={() => setSendType("user")}
                className={[
                  "group relative w-full overflow-hidden rounded-3xl bg-white p-0 text-left shadow-sm ring-1 ring-black/5 transition-transform hover:-translate-y-0.5 active:translate-y-0 dark:bg-zinc-900 dark:ring-white/10",
                  sendType === "user"
                    ? "ring-2 ring-yellow-500/50 shadow-[0_28px_80px_rgba(234,179,8,0.18)]"
                    : sendType
                      ? "opacity-60"
                      : "",
                ].join(" ")}
              >
                {sendType === "user" ? (
                  <>
                    <div className="absolute inset-0 rounded-3xl">
                      <div className="absolute -inset-[100%] animate-[spin_3.5s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,transparent_0%,#EAB308_50%,transparent_100%)] opacity-100" />
                    </div>
                    <div className="absolute inset-[1px] rounded-[23px] bg-white dark:bg-zinc-900" />
                  </>
                ) : null}
                <div className="relative p-5">
                  <div className="text-base font-extrabold">{t("send.type.user.title")}</div>
                  <div className="mt-1 text-sm text-zinc-500 dark:text-white/60">
                    {t("send.type.user.body")}
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSendType("wallet")}
                className={[
                  "group relative w-full overflow-hidden rounded-3xl bg-white p-0 text-left shadow-sm ring-1 ring-black/5 transition-transform hover:-translate-y-0.5 active:translate-y-0 dark:bg-zinc-900 dark:ring-white/10",
                  sendType === "wallet"
                    ? "ring-2 ring-yellow-500/50 shadow-[0_28px_80px_rgba(234,179,8,0.18)]"
                    : sendType
                      ? "opacity-60"
                      : "",
                ].join(" ")}
              >
                {sendType === "wallet" ? (
                  <>
                    <div className="absolute inset-0 rounded-3xl">
                      <div className="absolute -inset-[100%] animate-[spin_3.5s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,transparent_0%,#EAB308_50%,transparent_100%)] opacity-100" />
                    </div>
                    <div className="absolute inset-[1px] rounded-[23px] bg-white dark:bg-zinc-900" />
                  </>
                ) : null}
                <div className="relative p-5">
                  <div className="text-base font-extrabold">{t("send.type.wallet.title")}</div>
                  <div className="mt-1 text-sm text-zinc-500 dark:text-white/60">
                    {t("send.type.wallet.body")}
                  </div>
                </div>
              </button>
            </div>

            <div className="mt-6">
              <button
                type="button"
                aria-disabled={!sendType}
                onClick={onContinue}
                className={[
                  "inline-flex h-14 w-full items-center justify-center rounded-2xl bg-yellow-500 text-base font-bold text-black shadow-lg shadow-yellow-500/25 transition-all",
                  !sendType
                    ? "cursor-not-allowed opacity-70"
                    : "hover:-translate-y-0.5 hover:bg-yellow-400 active:translate-y-0",
                ].join(" ")}
              >
                {t("common.continue")}
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-8">
            <div className="flex items-center justify-between">
              <div className="text-lg font-extrabold tracking-tight">
                {t("send.step2.titlePrefix")}{" "}
                {sendType === "wallet" ? t("send.step2.wallet") : t("send.step2.user")}
              </div>
              <button
                type="button"
                onClick={onBack}
                className="text-xs font-semibold text-zinc-500 underline decoration-zinc-400/40 underline-offset-4 hover:text-zinc-900 dark:text-white/60 dark:hover:text-white"
              >
                {t("common.change")}
              </button>
            </div>

            {sendType === "user" ? (
              <div className="mt-4 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5 dark:bg-zinc-900 dark:ring-white/10">
                <div className="text-sm font-semibold text-zinc-500 dark:text-white/60">
                  {t("send.recipient.searchTitle")}
                </div>
                <div className="mt-2 flex gap-2">
                  <input
                    value={recipientQuery}
                    onChange={(e) => setRecipientQuery(e.target.value)}
                    placeholder={t("send.recipient.placeholder")}
                    className="h-12 w-full rounded-2xl bg-gray-50 px-4 text-sm text-zinc-950 ring-1 ring-black/5 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-yellow-500/30 dark:bg-white/5 dark:text-white dark:ring-white/10 dark:placeholder:text-white/35"
                  />
                  <button
                    type="button"
                    className="inline-flex h-12 items-center justify-center rounded-2xl bg-yellow-500 px-4 text-sm font-bold text-black shadow-lg shadow-yellow-500/25 transition-transform hover:-translate-y-0.5 hover:bg-yellow-400 active:translate-y-0"
                    onClick={onSearchRecipient}
                  >
                    {recipientLoading ? t("common.loadingDots") : t("common.search")}
                  </button>
                </div>

                {recipient ? (
                  <div className="mt-4 rounded-2xl bg-gray-50 p-4 ring-1 ring-black/5 dark:bg-white/5 dark:ring-white/10">
                    <div className="text-xs font-semibold text-zinc-500 dark:text-white/60">
                      {t("send.recipient.found")}
                    </div>
                    <div className="mt-1 text-sm font-semibold">{recipientDisplay}</div>
                    <div className="mt-1 text-xs text-zinc-500 dark:text-white/60">
                      {t("send.recipient.telegramId")}: {recipient.telegram_id}
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 rounded-2xl bg-gray-50 p-4 text-sm text-zinc-500 ring-1 ring-black/5 dark:bg-white/5 dark:text-white/60 dark:ring-white/10">
                    {recipientError ?? t("send.recipient.emptyState")}
                  </div>
                )}

                <div className="mt-4 text-sm font-semibold text-zinc-500 dark:text-white/60">
                  {t("send.amountLabel")}
                </div>
                <input
                  value={amountToUser}
                  onChange={(e) =>
                    setAmountToUser(
                      formatUsdLikeAmountFromDigits(extractDigits(e.target.value)),
                    )
                  }
                  inputMode="decimal"
                  placeholder="0.00"
                  className="mt-2 h-12 w-full rounded-2xl bg-gray-50 px-4 text-sm text-zinc-950 ring-1 ring-black/5 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-yellow-500/30 dark:bg-white/5 dark:text-white dark:ring-white/10 dark:placeholder:text-white/35"
                />

                {userTransferError ? (
                  <div className="mt-4 rounded-2xl bg-yellow-50 p-4 text-sm font-semibold text-yellow-800 ring-1 ring-yellow-500/20 dark:bg-yellow-500/10 dark:text-yellow-200 dark:ring-yellow-500/20">
                    {userTransferError}
                  </div>
                ) : null}

                <div className="mt-4">
                  <button
                    type="button"
                    disabled={isCheckingBalance}
                    aria-busy={isCheckingBalance}
                    className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-yellow-500 text-sm font-bold text-black shadow-lg shadow-yellow-500/25 transition-transform hover:-translate-y-0.5 hover:bg-yellow-400 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                    onClick={onRequestUserTransferConfirm}
                  >
                    {isCheckingBalance ? t("common.validating") : t("common.send")}
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-4 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5 dark:bg-zinc-900 dark:ring-white/10">
                <div className="rounded-2xl bg-gray-50 p-4 text-sm text-zinc-500 ring-1 ring-black/5 dark:bg-white/5 dark:text-white/60 dark:ring-white/10">
                  {t("send.withdraw.notePrefix")} {formatUsdt(minWithdrawalUsdt ?? 0)} USDT.{" "}
                  {t("send.withdraw.noteSuffix")}
                </div>

                {pendingShown ? (
                  <div className="mt-4 rounded-2xl bg-yellow-50 p-4 ring-1 ring-yellow-500/20 dark:bg-yellow-500/10 dark:ring-yellow-500/20">
                    <div className="text-sm font-semibold">{t("tx.status.pending")}</div>
                    <div className="mt-1 text-xs text-zinc-500 dark:text-white/60">
                      {t("send.withdraw.pendingNotice")}
                    </div>
                  </div>
                ) : null}

                <div className="mt-4 text-sm font-semibold text-zinc-500 dark:text-white/60">
                  {t("send.withdraw.addressLabel")}
                </div>
                <input
                  value={withdrawAddress}
                  onChange={(e) => setWithdrawAddress(e.target.value)}
                  placeholder={t("send.withdraw.addressPlaceholder")}
                  className="mt-2 h-12 w-full rounded-2xl bg-gray-50 px-4 text-sm text-zinc-950 ring-1 ring-black/5 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-yellow-500/30 dark:bg-white/5 dark:text-white dark:ring-white/10 dark:placeholder:text-white/35"
                />

                <div className="mt-4 text-sm font-semibold text-zinc-500 dark:text-white/60">
                  {t("send.withdraw.networkLabel")}
                </div>
                <input
                  value={withdrawNetwork}
                  onChange={(e) => setWithdrawNetwork(e.target.value)}
                  placeholder={t("send.withdraw.networkPlaceholder")}
                  className="mt-2 h-12 w-full rounded-2xl bg-gray-50 px-4 text-sm text-zinc-950 ring-1 ring-black/5 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-yellow-500/30 dark:bg-white/5 dark:text-white dark:ring-white/10 dark:placeholder:text-white/35"
                />

                <div className="mt-4 text-sm font-semibold text-zinc-500 dark:text-white/60">
                  {t("send.amountLabel")}
                </div>
                <input
                  value={withdrawAmount}
                  onChange={(e) =>
                    setWithdrawAmount(
                      formatUsdLikeAmountFromDigits(extractDigits(e.target.value)),
                    )
                  }
                  inputMode="decimal"
                  placeholder="0.00"
                  className="mt-2 h-12 w-full rounded-2xl bg-gray-50 px-4 text-sm text-zinc-950 ring-1 ring-black/5 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-yellow-500/30 dark:bg-white/5 dark:text-white dark:ring-white/10 dark:placeholder:text-white/35"
                />

                {withdrawError ? (
                  <div className="mt-4 rounded-2xl bg-yellow-50 p-4 text-sm font-semibold text-yellow-800 ring-1 ring-yellow-500/20 dark:bg-yellow-500/10 dark:text-yellow-200 dark:ring-yellow-500/20">
                    {withdrawError}
                  </div>
                ) : null}

                <div className="mt-4">
                  <button
                    type="button"
                    disabled={isCheckingWithdrawBalance}
                    aria-busy={isCheckingWithdrawBalance}
                    className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-yellow-500 text-sm font-bold text-black shadow-lg shadow-yellow-500/25 transition-transform hover:-translate-y-0.5 hover:bg-yellow-400 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                    onClick={onRequestWithdrawConfirm}
                  >
                    {isCheckingWithdrawBalance ? t("common.validating") : t("common.send")}
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
