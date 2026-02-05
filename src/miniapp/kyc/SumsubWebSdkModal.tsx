"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

import { useI18n } from "@/i18n/i18n";

let webSdkScriptPromise: Promise<void> | null = null;

function loadSumsubWebSdkScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if ((window as unknown as { snsWebSdk?: unknown }).snsWebSdk) return Promise.resolve();
  if (webSdkScriptPromise) return webSdkScriptPromise;

  webSdkScriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://static.sumsub.com/idensic/static/sns-websdk-builder.js"]',
    );
    if (existing) {
      if ((window as unknown as { snsWebSdk?: unknown }).snsWebSdk) resolve();
      else existing.addEventListener("load", () => resolve(), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://static.sumsub.com/idensic/static/sns-websdk-builder.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("No se pudo cargar el WebSDK de Sumsub"));
    document.head.appendChild(script);
  });

  return webSdkScriptPromise;
}

async function fetchSdkToken(): Promise<{ token: string; userId: string }> {
  const res = await fetch("/api/kyc/sumsub/sdk-token", {
    method: "POST",
    credentials: "include",
  });
  const json = (await res.json().catch(() => null)) as
    | { ok: boolean; error?: string; token?: { token: string; userId: string } }
    | null;
  if (!json?.ok || !json.token) {
    const msg = json?.error ?? "No se pudo obtener token de verificación";
    throw new Error(msg);
  }
  return json.token;
}

export default function SumsubWebSdkModal(props: {
  open: boolean;
  onClose: () => void;
  onCompleted?: () => void;
}) {
  const { t, locale } = useI18n();
  const containerId = useId().replaceAll(":", "");
  const instanceRef = useRef<unknown>(null);
  const onCompletedRef = useRef<(() => void) | undefined>(undefined);
  const completedOnceRef = useRef(false);
  const [status, setStatus] = useState<
    | { state: "idle" }
    | { state: "loading" }
    | { state: "error"; message: string }
    | { state: "ready" }
  >({ state: "idle" });

  const theme = useMemo(() => {
    if (typeof document === "undefined") return undefined;
    const isDark = document.documentElement.classList.contains("dark");
    return isDark ? "dark" : "light";
  }, []);

  useEffect(() => {
    onCompletedRef.current = props.onCompleted;
  }, [props.onCompleted]);

  useEffect(() => {
    if (!props.open) {
      completedOnceRef.current = false;
      setStatus({ state: "idle" });
      if (typeof document !== "undefined") {
        const el = document.getElementById(containerId);
        if (el) el.innerHTML = "";
      }
    }
  }, [containerId, props.open]);

  useEffect(() => {
    if (!props.open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [props.open]);

  useEffect(() => {
    if (!props.open) return;

    let cancelled = false;
    setStatus({ state: "loading" });

    const start = async () => {
      try {
        const [token] = await Promise.all([fetchSdkToken(), loadSumsubWebSdkScript()]);
        if (cancelled) return;

        type SnsWebSdkInstance = { launch: (selector: string) => void };
        type SnsWebSdkBuilder = {
          withConf: (conf: Record<string, unknown>) => SnsWebSdkBuilder;
          withOptions: (opts: Record<string, unknown>) => SnsWebSdkBuilder;
          on: (event: string, cb: (payload: unknown) => void) => SnsWebSdkBuilder;
          onMessage: (cb: (type: string, payload: unknown) => void) => SnsWebSdkBuilder;
          build: () => SnsWebSdkInstance;
        };
        type SnsWebSdk = {
          init: (
            accessToken: string,
            tokenUpdateCallback: () => Promise<string>,
          ) => SnsWebSdkBuilder;
        };

        const sdk = (window as unknown as { snsWebSdk?: SnsWebSdk }).snsWebSdk;

        if (!sdk?.init) throw new Error("WebSDK no disponible");

        const selector = `#${containerId}`;

        const notifyCompleted = () => {
          if (completedOnceRef.current) return;
          completedOnceRef.current = true;
          onCompletedRef.current?.();
        };

        const instance = sdk
          .init(token.token, async () => {
            const refreshed = await fetchSdkToken();
            return refreshed.token;
          })
          .withConf({
            lang: locale,
            theme,
          })
          .withOptions({
            addViewportTag: false,
            adaptIframeHeight: true,
          })
          .on("idCheck.onApplicantSubmitted", notifyCompleted)
          .on("idCheck.onApplicantStatusChanged", notifyCompleted)
          .on("idCheck.onError", () => undefined)
          .build();

        instanceRef.current = instance;
        instance.launch(selector);

        setStatus({ state: "ready" });
      } catch (e) {
        const message = e instanceof Error ? e.message : "No se pudo iniciar verificación";
        setStatus({ state: "error", message });
      }
    };

    void start();

    return () => {
      cancelled = true;
      instanceRef.current = null;
    };
  }, [containerId, locale, props.open, theme]);

  if (!props.open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px] dark:bg-black/70" />

      <div className="absolute inset-0 mx-auto w-full max-w-[420px] px-4 py-6">
        <div className="cc-glass-strong cc-neon-outline flex h-full flex-col overflow-hidden rounded-[28px]">
          <div className="flex items-center justify-between gap-3 px-5 py-4">
            <div className="text-sm font-semibold text-foreground">
              {t("sheets.verifyAccount")}
            </div>
            <button
              type="button"
              className="cc-glass cc-neon-outline inline-flex h-9 w-9 items-center justify-center rounded-full"
              onClick={props.onClose}
              aria-label="Close"
            >
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 6L6 18" />
                <path d="M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-auto px-3 pb-3">
            {status.state === "loading" ? (
              <div className="cc-glass cc-neon-outline rounded-2xl px-4 py-5 text-sm font-semibold text-muted-2">
                {t("telegram.loading")}
              </div>
            ) : status.state === "error" ? (
              <div className="cc-glass cc-neon-outline rounded-2xl px-4 py-5 text-sm font-semibold text-muted-2">
                {status.message}
              </div>
            ) : null}

            <div id={containerId} className="min-h-[520px]" />
          </div>
        </div>
      </div>
    </div>
  );
}
