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
      <div className="relative overflow-hidden rounded-3xl bg-yellow-500 p-6 shadow-lg shadow-yellow-500/25 ring-1 ring-black/10">
        {/* Watermark pattern */}
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: "url(/favicon.ico)",
              backgroundSize: "60px 60px",
              backgroundRepeat: "repeat",
              transform: "rotate(-15deg) scale(1.5)",
              filter: "grayscale(100%) brightness(200%)",
            }}
          />
        </div>

        <div className="relative">
          <div className="flex items-start justify-between">
            <div className="text-[11px] font-semibold tracking-[0.22em] text-black/80">
              {header}
            </div>
            {rightBadge ? <div className="shrink-0">{rightBadge}</div> : null}
          </div>

          <div className="mt-6 flex items-center justify-between">
            <div className="text-2xl font-bold tracking-tight text-black">
              Criptocard
            </div>
            <div className="flex flex-col items-end">
              <div className="text-2xl font-black italic tracking-wider text-black drop-shadow-sm">
                VISA
              </div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-black/80">
                Signature
              </div>
            </div>
          </div>

          <div className="mt-8 flex items-end justify-between gap-4">
            <div className="min-w-0 w-full">
              {/* Chip & Contactless */}
              <div className="flex items-center gap-4 mb-6">
                <div className="h-9 w-11 rounded-md bg-yellow-100/80 ring-1 ring-yellow-600/20 flex items-center justify-center">
                  <div className="grid grid-cols-2 gap-[1px] opacity-40">
                    <div className="h-3 w-2 rounded-sm border border-yellow-700" />
                    <div className="h-3 w-2 rounded-sm border border-yellow-700" />
                    <div className="h-3 w-2 rounded-sm border border-yellow-700" />
                    <div className="h-3 w-2 rounded-sm border border-yellow-700" />
                  </div>
                </div>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-8 w-8 text-black/80 rotate-90"
                >
                  <path d="M5 12.55a11 11 0 0 1 14.08 0" />
                  <path d="M1.42 9a16 16 0 0 1 21.16 0" />
                  <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
                  <line x1="12" y1="20" x2="12.01" y2="20" />
                </svg>
              </div>

              <div className="mt-3 text-xl font-mono font-bold tracking-[0.15em] text-black shadow-black drop-shadow-md">
                {detailsVisible && pan ? formatPan(pan) : `•••• •••• •••• ${last4}`}
              </div>
              
              <div className="mt-4 flex justify-between items-end">
                <div>
                  <div className="text-[9px] font-bold uppercase tracking-wider text-black/60 mb-0.5">
                    CARDHOLDER
                  </div>
                  <div className="font-bold tracking-wider text-black uppercase text-sm truncate max-w-[180px]">
                    {cardholderName}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[9px] font-bold uppercase tracking-wider text-black/60 mb-0.5">
                    EXPIRES
                  </div>
                  <div className="font-mono font-bold tracking-wider text-black text-sm">
                    {formatExpiry(expiryMonth, expiryYear)}
                  </div>
                </div>
              </div>
            </div>
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
