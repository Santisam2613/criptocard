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

  const [isFlipped, setIsFlipped] = useState(false);
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

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement;
      if (isFlipped && !target.closest(".flip-card-container")) {
        setIsFlipped(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isFlipped]);

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
      <div
        className="flip-card-container group relative mx-auto h-56 w-full cursor-pointer"
        style={{ perspective: "1000px" }}
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <div
          className="relative h-full w-full"
          style={{
            transformStyle: "preserve-3d",
            transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
            transition: "transform 700ms cubic-bezier(0.2, 0.9, 0.2, 1)",
          }}
        >
          {/* FRONT */}
          <div
            className="absolute h-full w-full"
            style={{ backfaceVisibility: "hidden" }}
          >
            <div className="relative h-full overflow-hidden rounded-2xl bg-gradient-to-br from-yellow-400 to-yellow-500 p-6 shadow-xl shadow-yellow-500/20 ring-1 ring-black/5">
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

              <div className="relative flex h-full flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div className="flex flex-col gap-1">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-black/60">
                      {header}
                    </div>
                    <div className="text-lg font-extrabold tracking-tight text-black">
                      Criptocard
                    </div>
                  </div>
                  <div className="text-xl font-black italic tracking-tighter text-black/90">
                    VISA
                  </div>
                </div>

                <div className="mt-2 flex items-center gap-3">
                  <div className="h-8 w-11 rounded-md bg-yellow-200/50 ring-1 ring-yellow-600/20 flex items-center justify-center backdrop-blur-sm">
                    <div className="grid grid-cols-2 gap-[2px] opacity-60">
                      <div className="h-2.5 w-3.5 rounded-[1px] border border-yellow-800" />
                      <div className="h-2.5 w-3.5 rounded-[1px] border border-yellow-800" />
                    </div>
                  </div>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-6 w-6 text-black/60 rotate-90"
                  >
                    <path d="M5 12.55a11 11 0 0 1 14.08 0" />
                    <path d="M1.42 9a16 16 0 0 1 21.16 0" />
                    <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
                  </svg>
                </div>

                <div className="mt-auto flex items-end justify-between">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-black/50">
                    Tap to flip
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* BACK */}
          <div
            className="absolute h-full w-full"
            style={{ transform: "rotateY(180deg)", backfaceVisibility: "hidden" }}
          >
            <div className="relative h-full overflow-hidden rounded-2xl bg-gradient-to-br from-yellow-500 to-yellow-600 p-6 shadow-xl ring-1 ring-black/5">
              <div className="absolute left-0 top-6 h-10 w-full bg-zinc-900" />

              <div className="mt-16 flex h-full flex-col">
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-8 bg-white/40 rounded flex items-center justify-end px-3">
                    <span className="font-mono text-sm font-bold text-black italic">
                      {detailsVisible && cvv ? cvv : "•••"}
                    </span>
                  </div>
                  <div className="text-[8px] font-bold uppercase text-black/60">CVV</div>
                </div>

                <div className="mt-auto">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="text-lg font-mono font-bold tracking-[0.15em] text-black drop-shadow-sm">
                      {detailsVisible && pan ? formatPan(pan) : `•••• •••• •••• ${last4}`}
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        void toggleDetails();
                      }}
                      disabled={cvvLoading}
                      className="rounded-full bg-black/10 p-2 text-black/80 hover:bg-black/20 active:scale-95 transition-all disabled:opacity-60"
                      aria-label={detailsVisible ? "Ocultar datos" : "Ver datos"}
                    >
                      {detailsVisible ? (
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className="h-4 w-4"
                        >
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 9-13.66-8-10-10a14 14 0 0 1 4.98-5.54" />
                          <path d="M1 1l22 22" />
                        </svg>
                      ) : (
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className="h-4 w-4"
                        >
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>

                  <div className="flex justify-between items-end">
                    <div>
                      <div className="text-[8px] font-bold uppercase tracking-wider text-black/50">
                        Cardholder
                      </div>
                      <div className="font-bold uppercase tracking-wider text-black text-sm truncate max-w-[160px]">
                        {cardholderName}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[8px] font-bold uppercase tracking-wider text-black/50">
                        Expires
                      </div>
                      <div className="font-mono font-bold text-black text-sm">
                        {formatExpiry(expiryMonth, expiryYear)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Status & Actions */}
      <div className="mt-6 flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${badgeDotClass}`} />
          <span className="text-sm font-semibold text-zinc-600 dark:text-zinc-300">
            {badgeLabel}
          </span>
        </div>
        {rightBadge}
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
