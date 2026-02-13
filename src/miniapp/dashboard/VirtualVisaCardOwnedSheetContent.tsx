import { useEffect, useState, type ReactNode } from "react";

type VirtualVisaCardOwnedSheetContentProps = {
  header: string;
  status: "active" | "frozen" | "blocked";
  cardholderName: string;
  last4: string;
  expiryMonth: number;
  expiryYear: number;
  rightBadge?: ReactNode;
  onToggleLock?: () => void;
  onReplace?: () => void;
};

function formatExpiry(month: number, year: number) {
  const mm = String(month).padStart(2, "0");
  const yy = String(year).slice(-2);
  return `${mm}/${yy}`;
}

export default function VirtualVisaCardOwnedSheetContent({
  header,
  status,
  cardholderName,
  last4,
  expiryMonth,
  expiryYear,
  rightBadge,
  onToggleLock,
  onReplace,
}: VirtualVisaCardOwnedSheetContentProps) {
  const isLocked = status !== "active";
  const badgeLabel = status === "active" ? "Active" : status === "frozen" ? "Locked" : "Blocked";
  const badgeDotClass =
    status === "active"
      ? "bg-emerald-600 dark:bg-emerald-300"
      : status === "frozen"
        ? "bg-yellow-600 dark:bg-yellow-300"
        : "bg-red-600 dark:bg-red-300";
  const badgeClass =
    status === "active"
      ? "bg-emerald-500/15 text-emerald-800 ring-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200 dark:ring-emerald-500/20"
      : status === "frozen"
        ? "bg-yellow-500/15 text-yellow-800 ring-yellow-500/20 dark:bg-yellow-500/10 dark:text-yellow-200 dark:ring-yellow-500/20"
        : "bg-red-500/15 text-red-800 ring-red-500/20 dark:bg-red-500/10 dark:text-red-200 dark:ring-red-500/20";
  const lockButtonLabel = isLocked ? "Unlock Card" : "Lock Card";
  const lockButtonDisabled = status === "blocked";

  const [detailsVisible, setDetailsVisible] = useState(false);
  const [cvvLoading, setCvvLoading] = useState(false);
  const [cvv, setCvv] = useState<string | null>(null);
  const [pan, setPan] = useState<string | null>(null);

  useEffect(() => {
    if (!detailsVisible) return;
    const t = window.setTimeout(() => {
      setDetailsVisible(false);
    }, 30_000);
    return () => window.clearTimeout(t);
  }, [detailsVisible]);

  function formatPan(value: string) {
    const digits = value.replace(/\s+/g, "");
    const groups: string[] = [];
    for (let i = 0; i < digits.length; i += 4) {
      groups.push(digits.slice(i, i + 4));
    }
    return groups.join(" ");
  }

  async function ensureDetails() {
    try {
      setCvvLoading(true);
      const res = await fetch("/api/cards/virtual/details", {
        credentials: "include",
        cache: "no-store",
      });
      const json = (await res.json().catch(() => null)) as
        | { ok: boolean; cvc?: string | null; number?: string | null; error?: string }
        | null;
      if (!json?.ok) return;
      setCvv(json.cvc ?? null);
      setPan(json.number ?? null);
    } finally {
      setCvvLoading(false);
    }
  }

  async function toggleDetails() {
    if (detailsVisible) {
      setDetailsVisible(false);
      return;
    }
    if (!cvv || !pan) await ensureDetails();
    setDetailsVisible(true);
  }

  return (
    <div className="px-6 pt-4 pb-7 text-zinc-950 dark:text-white">
      <div className="relative overflow-hidden rounded-3xl bg-white p-6 shadow-lg shadow-black/10 ring-1 ring-black/5 dark:bg-[#1A1D24] dark:shadow-none dark:ring-white/10">
        <div className="absolute inset-0 opacity-35 [background-image:repeating-radial-gradient(circle_at_50%_50%,rgba(0,0,0,0.10)_0,rgba(0,0,0,0.10)_1px,transparent_2px,transparent_8px)] dark:opacity-20" />
        <div className="relative">
          <div className="flex items-start justify-between">
            <div className="text-[11px] font-semibold tracking-[0.22em] text-zinc-500 dark:text-white/60">
              {header}
            </div>
            {rightBadge ? <div className="shrink-0">{rightBadge}</div> : null}
          </div>

          <div className="mt-10 flex items-end justify-between gap-4">
            <div className="min-w-0">
              <div className="truncate rounded-full bg-yellow-500/15 px-3 py-1 text-xs font-semibold text-yellow-700 ring-1 ring-yellow-500/20 dark:bg-yellow-500/10 dark:text-yellow-300 dark:ring-yellow-500/20">
                {cardholderName}
              </div>
              <div className="mt-3 text-xl font-black tracking-[0.12em] text-zinc-900 dark:text-white">
                {detailsVisible && pan ? formatPan(pan) : `•••• ${last4}`}
              </div>
              <div className="mt-2 text-xs font-semibold text-zinc-500 dark:text-white/60">
                Exp {formatExpiry(expiryMonth, expiryYear)}
              </div>
            </div>

            <div />
          </div>

          <div className="mt-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label={detailsVisible ? "Ocultar datos" : "Ver datos"}
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-zinc-900 ring-1 ring-black/5 transition-transform hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0 dark:bg-white/10 dark:text-white dark:ring-white/10"
                onClick={() => void toggleDetails()}
                disabled={cvvLoading}
              >
                {detailsVisible ? (
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5"
                  >
                    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
                    <circle cx="12" cy="12" r="3" />
                    <path d="M3 3l18 18" />
                  </svg>
                ) : (
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5"
                  >
                    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
              <div className="inline-flex h-10 items-center justify-center rounded-2xl bg-black/5 px-3 text-xs font-black tracking-[0.18em] text-zinc-900 ring-1 ring-black/5 dark:bg-white/10 dark:text-white dark:ring-white/10">
                {detailsVisible && cvv ? cvv : "•••"}
              </div>
            </div>
            <div
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${badgeClass}`}
            >
              <span className={`inline-flex h-2 w-2 rounded-full ${badgeDotClass}`} />
              {badgeLabel}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <button
          type="button"
          className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-yellow-500 text-sm font-bold text-black shadow-lg shadow-yellow-500/25 transition-transform hover:-translate-y-0.5 hover:bg-yellow-400 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
          onClick={onToggleLock}
          disabled={lockButtonDisabled}
        >
          {lockButtonLabel}
        </button>
        <button
          type="button"
          className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-gray-100 text-sm font-bold text-zinc-900 ring-1 ring-black/5 transition-transform hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 dark:bg-white/10 dark:text-white dark:ring-white/10"
          onClick={onReplace}
        >
          Replace Card
        </button>
      </div>
    </div>
  );
}
