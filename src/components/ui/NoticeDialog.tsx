import { useEffect } from "react";

import Button from "@/components/ui/Button";

export type NoticeDialogProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  onClose: () => void;
};

export default function NoticeDialog(props: NoticeDialogProps) {
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
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-5">
      <button
        type="button"
        aria-label="Close"
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
