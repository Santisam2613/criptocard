"use client";

import { createContext, useContext } from "react";

import type { TelegramWebAppUser } from "@/telegram/telegram";

export type TelegramState =
  | { status: "loading" }
  | {
      status: "blocked";
      reason: "not_in_telegram" | "missing_user";
    }
  | {
      status: "ready";
      user: TelegramWebAppUser;
      initData: string;
      platform?: string;
      version?: string;
    };

const TelegramContext = createContext<TelegramState>({ status: "loading" });

export function TelegramProviderBase({
  value,
  children,
}: {
  value: TelegramState;
  children: React.ReactNode;
}) {
  return (
    <TelegramContext.Provider value={value}>{children}</TelegramContext.Provider>
  );
}

export function useTelegram() {
  return useContext(TelegramContext);
}
