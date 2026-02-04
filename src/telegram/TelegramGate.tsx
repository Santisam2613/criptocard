"use client";

import { useMemo } from "react";

import { useTelegram } from "@/telegram/TelegramContext";
import { useI18n } from "@/i18n/i18n";

export default function TelegramGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const state = useTelegram();
  const { t } = useI18n();

  const message = useMemo(() => {
    if (state.status === "loading") return t("telegram.loading");
    if (state.status === "blocked") {
      return state.reason === "not_in_telegram"
        ? t("telegram.openInTelegram")
        : t("telegram.missingUser");
    }
    return "";
  }, [state, t]);

  if (state.status !== "ready") {
    return (
      <main className="min-h-screen bg-background px-4 py-10 text-foreground">
        <div className="mx-auto w-full max-w-[420px]">
          <div className="cc-glass cc-neon-outline rounded-3xl p-6 text-center">
            <div className="text-lg font-extrabold tracking-tight">
              {t("telegram.title")}
            </div>
            <div className="mt-3 text-sm leading-relaxed text-muted">
              {message}
            </div>
          </div>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
