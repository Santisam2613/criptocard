"use client";

import { useEffect } from "react";

function setViewportContent(content: string) {
  const meta = document.querySelector<HTMLMetaElement>('meta[name="viewport"]');
  if (!meta) return;
  if (meta.content === content) return;
  meta.content = content;
}

async function tryLockPortrait() {
  const orientation = (screen as unknown as { orientation?: { lock?: (o: string) => Promise<void> } })
    .orientation;
  if (!orientation?.lock) return;
  try {
    await orientation.lock("portrait");
  } catch {}
}

export default function ViewportLock() {
  useEffect(() => {
    const content =
      "width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=no, viewport-fit=cover";

    setViewportContent(content);
    void tryLockPortrait();

    let lastTouchEndAt = 0;

    const prevent = (e: Event) => {
      e.preventDefault();
    };

    const onGesture = (e: Event) => {
      e.preventDefault();
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 1) e.preventDefault();
    };

    const onTouchEnd = (e: TouchEvent) => {
      const now = Date.now();
      if (now - lastTouchEndAt <= 350) {
        e.preventDefault();
      }
      lastTouchEndAt = now;
    };

    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey) e.preventDefault();
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      if (e.key === "+" || e.key === "-" || e.key === "=" || e.key === "0") {
        e.preventDefault();
      }
    };

    const onOrientationChange = () => {
      setViewportContent(content);
      void tryLockPortrait();
      window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
    };

    document.addEventListener("gesturestart", onGesture, { passive: false } as AddEventListenerOptions);
    document.addEventListener("gesturechange", onGesture, { passive: false } as AddEventListenerOptions);
    document.addEventListener("gestureend", onGesture, { passive: false } as AddEventListenerOptions);
    document.addEventListener("dblclick", prevent, { passive: false });
    document.addEventListener("touchmove", onTouchMove, { passive: false });
    document.addEventListener("touchend", onTouchEnd, { passive: false });
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKeyDown, { passive: false });
    window.addEventListener("orientationchange", onOrientationChange, { passive: true });

    return () => {
      document.removeEventListener("gesturestart", onGesture as EventListener);
      document.removeEventListener("gesturechange", onGesture as EventListener);
      document.removeEventListener("gestureend", onGesture as EventListener);
      document.removeEventListener("dblclick", prevent as EventListener);
      document.removeEventListener("touchmove", onTouchMove as EventListener);
      document.removeEventListener("touchend", onTouchEnd as EventListener);
      window.removeEventListener("wheel", onWheel as EventListener);
      window.removeEventListener("keydown", onKeyDown as EventListener);
      window.removeEventListener("orientationchange", onOrientationChange as EventListener);
    };
  }, []);

  return null;
}

