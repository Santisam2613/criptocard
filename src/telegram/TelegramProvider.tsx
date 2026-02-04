"use client";

import { useEffect, useState } from "react";

import { TelegramProviderBase } from "@/telegram/TelegramContext";
import type { TelegramState } from "@/telegram/TelegramContext";
import type { TelegramWebAppUser } from "@/telegram/telegram";

function setAppViewportHeightVar() {
  const vv = window.visualViewport;
  const height = vv?.height ?? window.innerHeight;
  document.documentElement.style.setProperty("--cc-app-vh", `${height / 100}px`);
}

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
      if (webApp?.disableVerticalSwipes) webApp.disableVerticalSwipes();

      setAppViewportHeightVar();

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

    const onResize = () => setAppViewportHeightVar();
    window.addEventListener("resize", onResize, { passive: true });
    window.visualViewport?.addEventListener("resize", onResize, { passive: true });

    return () => {
      window.clearTimeout(t);
      window.removeEventListener("resize", onResize);
      window.visualViewport?.removeEventListener("resize", onResize);
    };
  }, []);

  return <TelegramProviderBase value={state}>{children}</TelegramProviderBase>;
}
