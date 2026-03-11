"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

type PromotionalSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  buttonText: string;
  onAction: () => void;
  imageSrc?: string;
  icon?: React.ReactNode;
};

export default function PromotionalSheet({
  isOpen,
  onClose,
  title,
  description,
  buttonText,
  onAction,
  imageSrc,
  icon,
}: PromotionalSheetProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setVisible(true);
    } else {
      const t = setTimeout(() => setVisible(false), 300);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  if (isOpen && !visible) return null; // Wait for initial render to animate in

  return (
    <div
      className={`fixed inset-0 z-[60] flex items-end justify-center transition-opacity duration-300 ${
        visible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <div 
        className={`relative z-10 w-full max-w-[420px] transform rounded-t-3xl bg-white p-6 shadow-2xl transition-transform duration-300 dark:bg-zinc-900 ${
          visible ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="mb-6 flex flex-col items-center text-center">
          {(imageSrc || icon) && (
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-yellow-50 dark:bg-yellow-900/20">
              {imageSrc ? (
                <Image 
                  src={imageSrc} 
                  alt="" 
                  width={48} 
                  height={48} 
                  className="object-contain"
                />
              ) : (
                icon
              )}
            </div>
          )}
          
          <h3 className="text-2xl font-extrabold text-zinc-900 dark:text-white">
            {title}
          </h3>
          
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            {description}
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={onAction}
            className="w-full rounded-2xl bg-yellow-500 py-4 text-sm font-bold text-black shadow-lg shadow-yellow-500/25 transition-transform active:scale-[0.98]"
          >
            {buttonText}
          </button>
          
          <button
            onClick={onClose}
            className="w-full rounded-2xl py-3 text-sm font-semibold text-zinc-500 hover:bg-gray-50 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            Quizás más tarde
          </button>
        </div>
      </div>
    </div>
  );
}
