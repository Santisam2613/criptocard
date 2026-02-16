"use client";

import { useEffect, useState } from "react";

import { useI18n } from "@/i18n/i18n";

const SLIDES = [
  {
    key: "cashback",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6 text-current" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    key: "rewards",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6 text-current" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    key: "vip",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6 text-current" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
    ),
  },
];

export default function CashbackCarousel({ onClick }: { onClick?: () => void }) {
  const { t } = useI18n();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % SLIDES.length);
    }, 4000); // Cambia cada 4 segundos
    return () => clearInterval(timer);
  }, []);

  const current = SLIDES[index];

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative mt-4 w-full overflow-hidden rounded-3xl p-0 text-left transition-transform active:scale-[0.98]"
    >
      {/* Fondo animado con transición suave */}
      <div className="absolute inset-0 bg-[#F4F5F7] dark:bg-[#1A1D24]" />
      
      {/* Contenido del slide */}
      <div className="relative flex items-center gap-4 p-5">
        <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F4F5F7] text-[#111] shadow-sm transition-all duration-500 dark:bg-white/5 dark:text-white">
          {current.icon}
        </div>
        
        <div className="flex flex-col gap-0.5 overflow-hidden">
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 key={index}">
            <div className="text-sm font-bold text-zinc-900 dark:text-white">
              {t(`dashboard.carousel.${current.key}.title`)}
            </div>
            <div className="truncate text-xs font-medium text-zinc-500 dark:text-zinc-400">
              {t(`dashboard.carousel.${current.key}.subtitle`)}
            </div>
          </div>
        </div>

        {/* Indicadores de progreso/puntos */}
        <div className="absolute right-5 top-1/2 flex -translate-y-1/2 flex-col gap-1.5">
          {SLIDES.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 w-1.5 rounded-full transition-colors duration-300 ${
                i === index ? "bg-zinc-800 dark:bg-white" : "bg-zinc-300 dark:bg-white/10"
              }`}
            />
          ))}
        </div>
      </div>
    </button>
  );
}
