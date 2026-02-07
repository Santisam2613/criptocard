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
    <div className="fixed inset-0 z-50 flex items-center justify-center px-5">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/45 backdrop-blur-sm"
        onClick={onClose}
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
        <div className="mt-5 flex justify-end">
          <Button variant="lime" onClick={onClose}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
