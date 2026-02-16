"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import DashboardView from "@/miniapp/dashboard/DashboardView";
import { useI18n } from "@/i18n/i18n";

function Splash({ phase }: { phase: "enter" | "exit" }) {
  const { t } = useI18n();
  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-white dark:bg-[#000] ${
        phase === "exit" ? "pointer-events-none opacity-0 transition-opacity duration-500" : "opacity-100"
      }`}
      aria-hidden="true"
    >
      <div className="relative flex flex-col items-center gap-6">
        <Image
          src="/assets/logo-header.png"
          alt={t("common.logoAlt")}
          width={180}
          height={46}
          priority
          className="h-auto w-[180px] dark:hidden"
        />
        <Image
          src="/assets/logo-header-blanco.png"
          alt={t("common.logoAlt")}
          width={180}
          height={46}
          priority
          className="hidden h-auto w-[180px] dark:block"
        />
        
        <div className="h-6 w-6 animate-spin rounded-full border-[2.5px] border-yellow-500/25 border-t-yellow-500" />
      </div>
    </div>
  );
}

function Spinner({ progress }: { progress: number }) {
  const { t } = useI18n();
  const clamped = Math.max(0, Math.min(1, progress));
  const opacity = 0.25 + clamped * 0.75;
  const scale = 0.9 + clamped * 0.1;
  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-40 flex justify-center pt-3"
      style={{ opacity, transform: `translateY(${clamped * 8}px) scale(${scale})` }}
      aria-hidden="true"
    >
      <div className="cc-glass cc-neon-outline inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold text-foreground">
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4 animate-spin"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 12a9 9 0 1 1-9-9" />
        </svg>
        {t("common.updating")}
      </div>
    </div>
  );
}

function PullToRefresh({
  children,
  onRefresh,
}: {
  children: ReactNode;
  onRefresh: () => Promise<void>;
}) {
  const startYRef = useRef<number | null>(null);
  const pullingRef = useRef(false);
  const [pullY, setPullY] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const threshold = 76;
  const progress = Math.min(1, pullY / threshold);

  // Solo iniciamos el gesto cuando el usuario está arriba del todo.
  function canStartPull() {
    if (typeof window === "undefined") return false;
    return window.scrollY <= 0;
  }

  function onTouchStart(e: React.TouchEvent) {
    if (refreshing) return;
    if (!canStartPull()) return;
    const y = e.touches[0]?.clientY ?? 0;
    startYRef.current = y;
    pullingRef.current = true;
  }

  function onTouchMove(e: React.TouchEvent) {
    if (!pullingRef.current) return;
    const startY = startYRef.current;
    if (startY === null) return;
    const y = e.touches[0]?.clientY ?? 0;
    const delta = y - startY;
    const next = delta > 0 ? Math.min(140, delta * 0.6) : 0;
    setPullY(next);
  }

  async function finishPull() {
    pullingRef.current = false;
    startYRef.current = null;
    if (refreshing) return;
    // Si no superó el umbral, vuelve a su posición sin refrescar.
    if (pullY < threshold) {
      setPullY(0);
      return;
    }
    // Dispara el refresco de datos sin recargar el navegador.
    setRefreshing(true);
    setPullY(threshold);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
      setPullY(0);
    }
  }

  useEffect(() => {
    if (!refreshing) return;
    function onScroll() {
      if (window.scrollY > 0) setPullY(threshold);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [refreshing]);

  return (
    <div onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={finishPull}>
      {(pullY > 0 || refreshing) && <Spinner progress={refreshing ? 1 : progress} />}
      <div style={{ transform: pullY > 0 ? `translateY(${pullY}px)` : undefined }}>
        {children}
      </div>
    </div>
  );
}

export default function MiniappPage() {
  const [nonce, setNonce] = useState(0);
  const [splashPhase, setSplashPhase] = useState<"enter" | "exit" | "done">("enter");

  useEffect(() => {
    const exitTimer = window.setTimeout(() => setSplashPhase("exit"), 2600);
    const doneTimer = window.setTimeout(() => setSplashPhase("done"), 3000);
    return () => {
      window.clearTimeout(exitTimer);
      window.clearTimeout(doneTimer);
    };
  }, []);

  return (
    <>
      {splashPhase === "done" ? null : <Splash phase={splashPhase} />}
      <PullToRefresh
        onRefresh={async () => {
          // Remonta el dashboard para que sus hooks vuelvan a pedir datos.
          setNonce((n) => n + 1);
          await new Promise((r) => window.setTimeout(r, 600));
        }}
      >
        <DashboardView key={nonce} />
      </PullToRefresh>
    </>
  );
}
