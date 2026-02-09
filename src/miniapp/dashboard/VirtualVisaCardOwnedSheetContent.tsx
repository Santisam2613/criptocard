import type { ReactNode } from "react";
import Image from "next/image";

type VirtualVisaCardOwnedSheetContentProps = {
  header: string;
  cardholderName: string;
  last4: string;
  expiryMonth: number;
  expiryYear: number;
  rightBadge?: ReactNode;
  onUnlock?: () => void;
  onReplace?: () => void;
};

function formatExpiry(month: number, year: number) {
  const mm = String(month).padStart(2, "0");
  const yy = String(year).slice(-2);
  return `${mm}/${yy}`;
}

export default function VirtualVisaCardOwnedSheetContent({
  header,
  cardholderName,
  last4,
  expiryMonth,
  expiryYear,
  rightBadge,
  onUnlock,
  onReplace,
}: VirtualVisaCardOwnedSheetContentProps) {
  return (
    <div className="px-6 pt-4 pb-7 text-zinc-950 dark:text-white">
      <div className="relative overflow-hidden rounded-3xl bg-[#E6E6E6] p-6 shadow-[0_28px_70px_rgba(0,0,0,0.25)] dark:bg-white/10">
        <div className="absolute inset-0 opacity-70 [background-image:repeating-radial-gradient(circle_at_50%_50%,rgba(0,0,0,0.14)_0,rgba(0,0,0,0.14)_1px,transparent_2px,transparent_8px)] dark:opacity-40" />
        <div className="relative">
          <div className="flex items-start justify-between">
            <div className="text-[11px] font-semibold tracking-[0.22em] text-black/60 dark:text-white/70">
              {header}
            </div>
            {rightBadge ? <div className="shrink-0">{rightBadge}</div> : null}
          </div>

          <div className="mt-10 flex items-end justify-between gap-4">
            <div className="min-w-0">
              <div className="truncate rounded-full bg-black/10 px-3 py-1 text-xs font-semibold text-black/70 dark:bg-white/10 dark:text-white/70">
                {cardholderName}
              </div>
              <div className="mt-3 text-xl font-black tracking-[0.12em] text-black/80 dark:text-white/85">
                •••• •••• •••• {last4}
              </div>
              <div className="mt-2 text-xs font-semibold text-black/60 dark:text-white/70">
                Exp {formatExpiry(expiryMonth, expiryYear)}
              </div>
            </div>

            <div className="text-right">
              <div className="text-2xl font-black tracking-[0.10em] text-black/80 dark:text-white/85">
                VISA
              </div>
              <div className="-mt-1 text-sm font-semibold text-black/60 dark:text-white/70">
                Signature
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-black/10 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.10)] dark:bg-white/10 dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.10)]">
              <Image
                src="/assets/logo-header.png"
                alt="Criptocard"
                width={86}
                height={18}
                className="h-4 w-auto dark:hidden"
              />
              <Image
                src="/assets/logo-header-blanco.png"
                alt="Criptocard"
                width={86}
                height={18}
                className="hidden h-4 w-auto dark:block"
              />
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-black/10 px-3 py-1 text-xs font-semibold text-black/70 dark:bg-white/10 dark:text-white/70">
              <span className="inline-flex h-2 w-2 rounded-full bg-black/50 dark:bg-white/60" />
              Locked
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <button
          type="button"
          className="cc-cta cc-gold-cta inline-flex h-12 w-full items-center justify-center rounded-2xl text-sm font-semibold text-black ring-1 ring-black/10 hover:brightness-[1.06] hover:-translate-y-0.5 hover:shadow-[0_26px_72px_var(--shadow-brand-strong)] active:translate-y-0"
          onClick={onUnlock}
        >
          Unlock Card
        </button>
        <button
          type="button"
          className="cc-glass cc-neon-outline inline-flex h-12 w-full items-center justify-center rounded-2xl text-sm font-semibold text-foreground transition-transform hover:-translate-y-0.5 active:translate-y-0"
          onClick={onReplace}
        >
          Replace Card
        </button>
      </div>
    </div>
  );
}

