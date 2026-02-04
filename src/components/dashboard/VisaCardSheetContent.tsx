import type { ReactNode } from "react";
import Image from "next/image";

import { useI18n } from "@/i18n/i18n";

type VisaCardSheetContentProps = {
  header: string;
  title: string;
  description: string;
  tags: [string, string, string, string];
  actionLabel: string;
  rightBadge?: ReactNode;
};

export default function VisaCardSheetContent({
  header,
  title,
  description,
  tags,
  actionLabel,
  rightBadge,
}: VisaCardSheetContentProps) {
  const { t } = useI18n();
  return (
    <div className="px-6 pt-4 pb-7 text-zinc-950 dark:text-white">
      <div className="relative overflow-hidden rounded-3xl bg-brand p-6 shadow-[0_28px_70px_var(--shadow-brand)]">
        <div className="absolute inset-0 opacity-70 [background-image:repeating-radial-gradient(circle_at_50%_50%,rgba(0,0,0,0.18)_0,rgba(0,0,0,0.18)_1px,transparent_2px,transparent_7px)]" />
        <div className="relative">
          <div className="flex items-start justify-between">
            <Image
              src="/assets/logo-header.png"
              alt="Criptocard"
              width={300}
              height={60}
              className="h-9 w-auto dark:hidden"
            />
            <Image
              src="/assets/logo-header-blanco.png"
              alt="Criptocard"
              width={300}
              height={60}
              className="hidden h-9 w-auto dark:block"
            />
            <div className="text-right">
              <div className="text-2xl font-black tracking-[0.10em] text-black">
                VISA
              </div>
              <div className="-mt-1 text-sm font-semibold text-black/70">
                {t("visaCard.signatureLabel")}
              </div>
            </div>
          </div>
          <div className="mt-16 flex justify-center">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-black/10 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.12)]">
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
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {tags.map((t) => (
          <span
            key={t}
            className="inline-flex items-center rounded-full bg-brand px-3 py-1 text-xs font-semibold text-black"
          >
            {t}
          </span>
        ))}
      </div>

      <div className="mt-5 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-[11px] font-semibold tracking-[0.22em] text-zinc-500 dark:text-white/55">
            {header}
          </div>
          <div className="mt-3 text-2xl font-extrabold tracking-tight">
            {title}
          </div>
        </div>
        {rightBadge ? (
          <div className="shrink-0">{rightBadge}</div>
        ) : null}
      </div>

      <div className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-white/70">
        {description}
      </div>

      <div className="mt-6">
        <button
          type="button"
          className="cc-cta cc-gold-cta inline-flex h-12 w-full items-center justify-center rounded-2xl text-sm font-semibold text-black ring-1 ring-black/10 hover:brightness-[1.06] hover:-translate-y-0.5 hover:shadow-[0_26px_72px_var(--shadow-brand-strong)] active:translate-y-0"
        >
          {actionLabel}
        </button>
      </div>
    </div>
  );
}
