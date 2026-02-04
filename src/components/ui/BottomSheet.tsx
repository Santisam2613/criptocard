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
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const startYRef = useRef<number | null>(null);
  const lastYRef = useRef<number>(0);
  const lastTsRef = useRef<number>(0);
  const velocityRef = useRef<number>(0);
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

  function canStartDragFromEvent(e: React.PointerEvent) {
    const sheet = sheetRef.current;
    if (!sheet) return false;
    const rect = sheet.getBoundingClientRect();
    const yInSheet = e.clientY - rect.top;
    return yInSheet >= 0 && yInSheet <= 90;
  }

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    if (!canStartDragFromEvent(e)) return;

    startYRef.current = e.clientY;
    lastYRef.current = 0;
    lastTsRef.current = e.timeStamp;
    velocityRef.current = 0;
    setDragging(true);
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (startYRef.current === null) return;
    const delta = e.clientY - startYRef.current;
    const raw = Math.max(0, delta);
    const next = raw > 240 ? 240 + (raw - 240) * 0.35 : raw;

    const dt = e.timeStamp - lastTsRef.current;
    if (dt > 0) {
      const v = (next - lastYRef.current) / dt;
      velocityRef.current = v * 0.75 + velocityRef.current * 0.25;
      lastTsRef.current = e.timeStamp;
    }

    lastYRef.current = next;
    setDragY(next);
  }

  function finishDrag() {
    const distance = lastYRef.current;
    const v = velocityRef.current;
    startYRef.current = null;
    lastYRef.current = 0;
    lastTsRef.current = 0;
    velocityRef.current = 0;
    setDragging(false);

    const shouldClose = distance > 120 || (distance > 48 && v > 0.9);
    if (shouldClose) {
      const rect = sheetRef.current?.getBoundingClientRect();
      const out = rect ? rect.height + 80 : 560;
      setDragY(out);
      window.setTimeout(() => onClose(), 220);
      return;
    }

    if (distance > 24) {
      setDragY(-8);
      window.setTimeout(() => setDragY(0), 120);
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
          ref={sheetRef}
          className={[
            "cc-glass-strong cc-neon-outline rounded-[28px]",
            dragging ? "" : "transition-transform duration-200 ease-out",
          ].join(" ")}
          style={{ transform: `translateY(${dragY}px)`, touchAction: "none" }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={finishDrag}
          onPointerCancel={finishDrag}
        >
          <div className="flex justify-center pt-3">
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
