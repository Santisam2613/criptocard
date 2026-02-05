import { useCallback, useEffect, useMemo, useState } from "react";

import { useTelegram } from "@/telegram/TelegramContext";
import { getPublicCredentials } from "@/config/credentials";

export type VerificationStatus =
  | "not_started"
  | "pending"
  | "approved"
  | "rejected";

export type BackendUser = {
  id: string;
  telegram_id: string;
  telegram_username: string | null;
  telegram_first_name: string | null;
  telegram_last_name: string | null;
  telegram_photo_url: string | null;
  sumsub_applicant_id: string | null;
  verification_status: VerificationStatus;
  verification_completed: boolean;
  verified_at: string | null;
};

type BackendUserState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; user: BackendUser }
  | { status: "error"; error: string };

async function authWithTelegram(initData: string) {
  const res = await fetch("/api/auth/telegram", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ initData }),
  });
  return res.json() as Promise<{ ok: boolean; error?: string }>;
}

async function authWithDev() {
  const res = await fetch("/api/auth/dev", {
    method: "POST",
    credentials: "include",
  });
  return res.json().catch(() => ({ ok: false })) as Promise<{ ok: boolean; error?: string }>;
}

async function fetchMe() {
  const res = await fetch("/api/me", { credentials: "include", cache: "no-store" });
  return res.json() as Promise<{ ok: boolean; user?: BackendUser; error?: string }>;
}

export function useBackendUser() {
  const telegram = useTelegram();
  const [state, setState] = useState<BackendUserState>({ status: "idle" });
  const { bypassTelegramGate } = getPublicCredentials();

  const refresh = useCallback(async () => {
    try {
      setState({ status: "loading" });

      if (telegram.status === "ready") {
        const auth = await authWithTelegram(telegram.initData);
        if (!auth.ok) {
          const meAfterAuthFail = await fetchMe();
          if (!meAfterAuthFail.ok || !meAfterAuthFail.user) {
            setState({
              status: "error",
              error: auth.error ?? meAfterAuthFail.error ?? "No autenticado",
            });
            return;
          }
          setState({ status: "ready", user: meAfterAuthFail.user });
          return;
        }
      } else if (bypassTelegramGate) {
        const meBeforeDev = await fetchMe();
        if (!meBeforeDev.ok || !meBeforeDev.user) {
          const devAuth = await authWithDev();
          if (!devAuth.ok) {
            setState({
              status: "error",
              error: devAuth.error ?? meBeforeDev.error ?? "No autenticado",
            });
            return;
          }
        } else {
          setState({ status: "ready", user: meBeforeDev.user });
          return;
        }
      }

      const me = await fetchMe();
      if (!me.ok || !me.user) {
        setState({
          status: "error",
          error: me.error ?? "No autenticado",
        });
        return;
      }
      setState({ status: "ready", user: me.user });
    } catch {
      setState({ status: "error", error: "Error cargando perfil" });
    }
  }, [bypassTelegramGate, telegram]);

  useEffect(() => {
    if (!bypassTelegramGate && telegram.status !== "ready") return;
    if (state.status !== "idle") return;
    const t = window.setTimeout(() => {
      void refresh();
    }, 0);
    return () => window.clearTimeout(t);
  }, [bypassTelegramGate, telegram.status, refresh, state.status]);

  const user = useMemo(() => (state.status === "ready" ? state.user : null), [state]);

  return { state, user, refresh };
}
