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
  onAction?: () => void;
};

export default function VisaCardSheetContent({
  header,
  title,
  description,
  tags,
  actionLabel,
  rightBadge,
  onAction,
}: VisaCardSheetContentProps) {
  const { t } = useI18n();
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

        {/* Chip & Contactless */}
        <div className="relative mb-8 flex items-center gap-4">
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

        <div className="relative flex items-end justify-between">
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
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {tags.map((t) => (
          <span
            key={t}
            className="inline-flex items-center rounded-full bg-yellow-500/15 px-3 py-1 text-xs font-semibold text-yellow-700 ring-1 ring-yellow-500/20 dark:bg-yellow-500/10 dark:text-yellow-300 dark:ring-yellow-500/20"
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
        {rightBadge ? <div className="shrink-0">{rightBadge}</div> : null}
      </div>

      <div className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-white/70">
        {description}
      </div>

      <div className="mt-6">
        <button
          type="button"
          className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-yellow-500 text-sm font-bold text-black shadow-lg shadow-yellow-500/25 transition-transform hover:-translate-y-0.5 hover:bg-yellow-400 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
          onClick={onAction}
        >
          {actionLabel}
        </button>
      </div>
    </div>
  );
}
