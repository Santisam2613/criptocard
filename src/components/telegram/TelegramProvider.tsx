"use client";

import { useEffect, useState } from "react";

import { TelegramProviderBase } from "@/components/telegram/TelegramContext";
import type { TelegramState } from "@/components/telegram/TelegramContext";
import type { TelegramWebAppUser } from "@/components/telegram/telegram";

function readTelegramUser(): {
  ok: true;
  user: TelegramWebAppUser;
  initData: string;
  platform?: string;
  version?: string;
} | { ok: false; reason: "not_in_telegram" | "missing_user" } {
  const webApp = window.Telegram?.WebApp;
  if (!webApp) return { ok: false, reason: "not_in_telegram" };

  const initData = webApp.initData ?? "";
  const user = webApp.initDataUnsafe?.user;
  if (!initData || !user?.id) return { ok: false, reason: "missing_user" };

  return {
    ok: true,
    user,
    initData,
    platform: webApp.platform,
    version: webApp.version,
  };
}

export default function TelegramProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, setState] = useState<TelegramState>({ status: "loading" });

  useEffect(() => {
    const t = window.setTimeout(() => {
      const webApp = window.Telegram?.WebApp;
      if (webApp?.ready) webApp.ready();
      if (webApp?.expand) webApp.expand();

      const result = readTelegramUser();
      if (!result.ok) {
        setState({ status: "blocked", reason: result.reason });
        return;
      }
      setState({
        status: "ready",
        user: result.user,
        initData: result.initData,
        platform: result.platform,
        version: result.version,
      });
    }, 0);

    return () => window.clearTimeout(t);
  }, []);

  return <TelegramProviderBase value={state}>{children}</TelegramProviderBase>;
}

