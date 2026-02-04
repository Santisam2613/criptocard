"use client";

import type { ReactNode } from "react";
import { useEffect, useId, useRef, useState } from "react";

type BottomSheetProps = {
  open: boolean;
  label: string;
  children: ReactNode;
  onClose: () => void;
};

export default function BottomSheet({
  open,
  label,
  children,
  onClose,
}: BottomSheetProps) {
  const labelId = useId();
  const startYRef = useRef<number | null>(null);
  const lastYRef = useRef<number>(0);
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    startYRef.current = e.clientY;
    lastYRef.current = 0;
    setDragging(true);
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (startYRef.current === null) return;
    const delta = e.clientY - startYRef.current;
    const next = Math.max(0, delta);
    lastYRef.current = next;
    setDragY(next);
  }

  function finishDrag() {
    const distance = lastYRef.current;
    startYRef.current = null;
    lastYRef.current = 0;
    setDragging(false);
    if (distance > 120) {
      onClose();
      return;
    }
    setDragY(0);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/30 backdrop-blur-[2px] dark:bg-black/70 animate-[ccOverlayIn_220ms_ease-out]"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelId}
        className={[
          "absolute inset-x-0 bottom-0 mx-auto w-full max-w-[420px] px-4 pb-6",
          dragging ? "" : "animate-[ccSheetIn_260ms_ease-out]",
        ].join(" ")}
      >
        <div
          className={[
            "cc-glass-strong cc-neon-outline rounded-[28px]",
            dragging ? "" : "transition-transform duration-200 ease-out",
          ].join(" ")}
          style={{ transform: `translateY(${dragY}px)` }}
        >
          <div
            className="flex justify-center pt-3"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={finishDrag}
            onPointerCancel={finishDrag}
          >
            <div className="h-1.5 w-12 rounded-full bg-black/15 dark:bg-white/15 shadow-[0_0_22px_var(--shadow-neon)]" />
          </div>

          <div id={labelId} className="sr-only">
            {label}
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}
