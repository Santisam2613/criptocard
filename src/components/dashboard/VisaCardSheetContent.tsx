import type { ReactNode } from "react";

type VisaCardSheetContentProps = {
  header: string;
  title: string;
  description: string;
  tags: [string, string, string, string];
  actionLabel: string;
  rightBadge?: ReactNode;
};

function LogoMark() {
  return (
    <svg
      viewBox="0 0 36 16"
      aria-hidden="true"
      className="h-5 w-auto text-black"
      fill="currentColor"
    >
      <path d="M11.8 8 1 3.6v8.8L11.8 8Z" />
      <path d="M14.5 8c3.7 0 6-3.1 7.5-5.2 1.1-1.6 2-2.8 3.4-2.8 1.9 0 3.6 2.2 4.9 4.1.9 1.3 1.6 2.2 2.2 2.2.6 0 1.3-.9 2.2-2.2 1.3-1.9 3-4.1 4.9-4.1v2c-1 0-2.3 1.8-3.3 3.2-1.2 1.7-2.3 3.2-3.8 3.2s-2.6-1.5-3.8-3.2C28.8 3.8 27.5 2 26.5 2c-.4 0-1.2 1-1.9 2.1C22.9 6.5 20.2 10 14.5 10V8Z" />
    </svg>
  );
}

export default function VisaCardSheetContent({
  header,
  title,
  description,
  tags,
  actionLabel,
  rightBadge,
}: VisaCardSheetContentProps) {
  return (
    <div className="px-6 pt-4 pb-7 text-zinc-950 dark:text-white">
      <div className="relative overflow-hidden rounded-3xl bg-brand p-6 shadow-[0_28px_70px_rgba(200,255,0,0.10)]">
        <div className="absolute inset-0 opacity-70 [background-image:repeating-radial-gradient(circle_at_50%_50%,rgba(0,0,0,0.18)_0,rgba(0,0,0,0.18)_1px,transparent_2px,transparent_7px)]" />
        <div className="relative">
          <div className="flex items-start justify-between">
            <LogoMark />
            <div className="text-right">
              <div className="text-2xl font-black tracking-[0.10em] text-black">
                VISA
              </div>
              <div className="-mt-1 text-sm font-semibold text-black/70">
                Signature
              </div>
            </div>
          </div>
          <div className="mt-16 flex justify-center">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-black/10 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.12)]">
              <LogoMark />
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
          className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-brand text-sm font-semibold text-black shadow-[0_18px_40px_rgba(200,255,0,0.18)] hover:bg-brand-hover"
        >
          {actionLabel}
        </button>
      </div>
    </div>
  );
}
