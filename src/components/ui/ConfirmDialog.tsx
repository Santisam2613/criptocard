import { useEffect } from "react";

import Button from "@/components/ui/Button";

export type ConfirmDialogProps = {
  open: boolean;
  title: string;
  message: string;
  cancelLabel: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function ConfirmDialog(props: ConfirmDialogProps) {
  const { open, title, message, cancelLabel, confirmLabel, onCancel, onConfirm } = props;

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
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-5">
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
          <button
            type="button"
            className="cc-cta cc-glass inline-flex h-10 items-center justify-center rounded-full px-5 text-sm font-semibold text-foreground ring-1 ring-border"
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <Button variant="lime" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

