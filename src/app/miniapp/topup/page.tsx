"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import QRCode from "react-qr-code";
import Image from "next/image";

import NoticeDialog from "@/components/ui/NoticeDialog";
import Skeleton from "@/components/ui/Skeleton";
import { useI18n } from "@/i18n/i18n";
import { useBackendUser } from "@/miniapp/hooks/useBackendUser";
import { formatUsdt } from "@/lib/format/number";
import { CRYPTO_ICONS, NETWORK_NAMES, STATIC_CRYPTO_WALLETS } from "@/lib/config/manual-wallets";

function extractDigits(input: string) {
  return input.replace(/[^0-9]/g, "");
}

function addThousandsSeparators(integerPart: string) {
  return integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function formatUsdLikeAmountFromDigits(digits: string) {
  const normalized = digits.replace(/^0+/, "");
  if (!normalized) return "";
  if (normalized.length === 1) return `0.0${normalized}`;
  if (normalized.length === 2) return `0.${normalized}`;
  const integer = normalized.slice(0, -2);
  const decimals = normalized.slice(-2);
  return `${addThousandsSeparators(integer)}.${decimals}`;
}

function parseUsdLikeAmount(input: string) {
  return Number(input.replace(/,/g, ""));
}

type TopUpMethod = "coinbase" | "manual";
type CryptoCurrency = keyof typeof STATIC_CRYPTO_WALLETS;

export default function TopUpPage() {
  const router = useRouter();
  const { t } = useI18n();
  const { state, user } = useBackendUser();
  const [approvedGate, setApprovedGate] = useState(false);
  const [amount, setAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [minTopupUsdt, setMinTopupUsdt] = useState<number | null>(null);
  const [exchangeRates, setExchangeRates] = useState<Record<string, string> | null>(null);
  
  // States for BottomSheets and Steps
  const [showMethodSelector, setShowMethodSelector] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<TopUpMethod | null>(null);
  
  // Manual Flow States
  const [manualStep, setManualStep] = useState<"select-currency" | "select-network" | "show-wallet" | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState<CryptoCurrency | null>(null);
  const [selectedNetwork, setSelectedNetwork] = useState<string | null>(null);

  const [noticeOpen, setNoticeOpen] = useState(false);
  const [noticeTitle, setNoticeTitle] = useState("");
  const [noticeMessage, setNoticeMessage] = useState("");
  const [noticeLabel, setNoticeLabel] = useState("Aceptar");
  const [noticeAction, setNoticeAction] = useState<(() => void) | null>(null);

  const [checkoutData, setCheckoutData] = useState<{
    hosted_url: string;
    code: string;
    amount: number;
    serviceFee: number;
    totalToPay: number;
  } | null>(null);

  const isReady = state.status === "ready";
  const displayBalance = useMemo(() => {
    return Number(user?.balance_usdt ?? 0);
  }, [user?.balance_usdt]);

  const amountVal = parseUsdLikeAmount(amount);
  const estFee = amountVal > 0 ? amountVal * 0.01 : 0;
  const estTotal = amountVal + estFee;

  useEffect(() => {
    if (user?.verification_status === "approved") setApprovedGate(true);
  }, [user?.verification_status]);

  useEffect(() => {
    let canceled = false;
    async function loadMinTopup() {
      try {
        const res = await fetch("/api/config/min-topup", {
          credentials: "include",
          cache: "no-store",
        });
        const json = (await res.json().catch(() => null)) as
          | { ok: boolean; minTopupUsdt?: number }
          | null;
        if (!json?.ok) return;
        if (canceled) return;
        const min = Number.isFinite(Number(json.minTopupUsdt)) ? Number(json.minTopupUsdt) : 0;
        setMinTopupUsdt(min);
        
        // Initialize amount with min value
        if (min > 0) {
           const digits = (min * 100).toFixed(0);
           setAmount(formatUsdLikeAmountFromDigits(digits));
        }
      } catch {}
    }
    void loadMinTopup();
    return () => {
      canceled = true;
    };
  }, []);

  useEffect(() => {
    // Cargar tasas de cambio
    fetch("https://api.coinbase.com/v2/exchange-rates?currency=USD")
      .then((res) => res.json())
      .then((json) => {
        if (json?.data?.rates) {
          setExchangeRates(json.data.rates);
        }
      })
      .catch((err) => console.error("Error cargando tasas:", err));
  }, []);

  function openNotice(params: {
    title: string;
    message: string;
    confirmLabel: string;
    onClose?: () => void;
  }) {
    setNoticeTitle(params.title);
    setNoticeMessage(params.message);
    setNoticeLabel(params.confirmLabel);
    setNoticeAction(() => params.onClose ?? null);
    setNoticeOpen(true);
  }

  function handleStartTopUp() {
    const value = parseUsdLikeAmount(amount);
    if (!Number.isFinite(value) || value <= 0) {
      openNotice({
        title: t("topup.errors.invalidAmount.title"),
        message: t("topup.errors.invalidAmount.body"),
        confirmLabel: t("common.close"),
      });
      return;
    }
    if (minTopupUsdt !== null && value < minTopupUsdt) {
      openNotice({
        title: t("topup.errors.minAmount.title"),
        message: `${t("topup.errors.minAmount.bodyPrefix")} ${formatUsdt(minTopupUsdt)} USDT.`,
        confirmLabel: t("common.close"),
      });
      return;
    }
    
    // Open Method Selector
    setShowMethodSelector(true);
  }

  function handleSelectMethod(method: TopUpMethod) {
    setSelectedMethod(method);
    setShowMethodSelector(false);

    if (method === "coinbase") {
      processCoinbaseTopUp();
    } else {
      setManualStep("select-currency");
    }
  }

  async function processCoinbaseTopUp() {
    setIsSubmitting(true);
    const value = parseUsdLikeAmount(amount);
    try {
      const res = await fetch("/api/topup/coinbase/create", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount_usdt: value }),
      });
      const json = await res.json();
      
      if (!json.ok) {
        openNotice({
          title: t("topup.errors.failed.title"),
          message: json.error ?? t("errors.internal"),
          confirmLabel: t("common.close"),
        });
        return;
      }

      setCheckoutData({
        hosted_url: json.hosted_url,
        code: json.code,
        amount: json.details.amount,
        serviceFee: json.details.serviceFee,
        totalToPay: json.details.totalToPay
      });
    } catch (e) {
      openNotice({
        title: t("topup.errors.failed.title"),
        message: "Error de conexión",
        confirmLabel: t("common.close"),
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleSelectCurrency(currency: CryptoCurrency) {
    setSelectedCurrency(currency);
    setManualStep("select-network");
  }

  function handleSelectNetwork(network: string) {
    setSelectedNetwork(network);
    setManualStep("show-wallet");
  }

  async function handleConfirmManualTransfer() {
    if (!selectedCurrency || !selectedNetwork) return;
    
    setIsSubmitting(true);
    const value = parseUsdLikeAmount(amount);
    
    try {
      const res = await fetch("/api/topup/manual/create", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          amount_usdt: value,
          currency: selectedCurrency,
          network: selectedNetwork
        }),
      });
      
      const json = await res.json();
      if (!json.ok) {
        throw new Error(json.error);
      }

      openNotice({
        title: "Solicitud Recibida",
        message: "Hemos registrado tu solicitud de recarga. Un administrador verificará tu transferencia y acreditará el saldo en breve.",
        confirmLabel: "Entendido",
        onClose: () => {
          setManualStep(null);
          setSelectedMethod(null);
          setAmount("");
          router.push("/miniapp");
        }
      });

    } catch (e) {
      openNotice({
        title: "Error",
        message: "No se pudo registrar la solicitud. Intenta nuevamente.",
        confirmLabel: "Cerrar"
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      // Could add toast here
    } catch (err) {
      console.error("Failed to copy", err);
    }
  }

  // --- Render Helpers ---

  if (!approvedGate && user?.verification_status !== "approved") {
    if (state.status === "idle" || state.status === "loading") {
      return (
        <main className="relative min-h-screen bg-white px-4 py-10 text-zinc-950 dark:bg-black dark:text-white">
          <div className="mx-auto w-full max-w-[420px]">
            <Skeleton className="h-7 w-44" rounded="2xl" />
            <div className="mt-6 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5 dark:bg-zinc-900 dark:ring-white/10">
              <Skeleton className="h-32 w-full" rounded="2xl" />
            </div>
          </div>
        </main>
      );
    }
    return <div />;
  }

  // Coinbase Checkout View
  if (checkoutData) {
    return (
      <main className="relative min-h-screen bg-white px-4 py-10 text-zinc-950 dark:bg-black dark:text-white">
        <div className="mx-auto w-full max-w-[420px]">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-black/5 transition-transform hover:-translate-y-0.5 active:translate-y-0 dark:bg-zinc-900 dark:ring-white/10"
              onClick={() => setCheckoutData(null)}
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
            </button>
            <div className="text-2xl font-extrabold tracking-tight">Checkout</div>
          </div>

          <div className="mt-6 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5 dark:bg-zinc-900 dark:ring-white/10">
            <div className="mb-6 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500 dark:text-zinc-400">Monto solicitado</span>
                <span className="font-medium">{formatUsdt(checkoutData.amount)} USDT</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500 dark:text-zinc-400">Comisión estimada</span>
                <span className="font-medium">{formatUsdt(checkoutData.serviceFee)} USDT</span>
              </div>
              <div className="flex justify-between border-t border-gray-100 pt-2 text-lg font-bold dark:border-white/10">
                <span>Total a pagar</span>
                <span>{formatUsdt(checkoutData.totalToPay)} USD</span>
              </div>
            </div>

            <div className="mb-6 flex justify-center rounded-xl bg-white p-4 ring-1 ring-black/5">
              <QRCode value={checkoutData.hosted_url} size={200} />
            </div>

            <a
              href={checkoutData.hosted_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-blue-600 text-sm font-bold text-white shadow-lg transition-all hover:bg-blue-500 active:translate-y-0"
            >
              Pagar ahora (Coinbase)
            </a>

            <button
              onClick={() => setCheckoutData(null)}
              className="mt-3 inline-flex h-12 w-full items-center justify-center rounded-2xl bg-gray-100 text-sm font-bold text-zinc-900 hover:bg-gray-200 dark:bg-white/10 dark:text-white"
            >
              Cancelar
            </button>
          </div>
        </div>
      </main>
    );
  }

  // Main Render
  return (
    <main className="relative min-h-screen bg-white px-4 py-10 text-zinc-950 dark:bg-black dark:text-white">
      <div className="mx-auto w-full max-w-[420px]">
        <NoticeDialog
          open={noticeOpen}
          title={noticeTitle}
          message={noticeMessage}
          confirmLabel={noticeLabel}
          onClose={() => {
            const action = noticeAction;
            setNoticeOpen(false);
            setNoticeAction(null);
            if (action) action();
          }}
        />

        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label={t("common.backAria")}
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-black/5 transition-transform hover:-translate-y-0.5 active:translate-y-0 dark:bg-zinc-900 dark:ring-white/10"
            onClick={() => router.back()}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
          </button>
          <div className="text-2xl font-extrabold tracking-tight">{t("topup.title")}</div>
        </div>

        <div className="mt-6 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5 dark:bg-zinc-900 dark:ring-white/10">
          <div className="text-xs font-semibold text-zinc-500 dark:text-white/60">
            {t("topup.currentBalance")}
          </div>
          <div className="mt-1 text-3xl font-extrabold tracking-tight">
            {isReady ? `$${formatUsdt(displayBalance)}` : "—"}
          </div>

          <div className="mt-5 text-sm font-semibold text-zinc-500 dark:text-white/60">
            {t("topup.amountLabel")}
          </div>
          <input
            value={amount}
            onChange={(e) => setAmount(formatUsdLikeAmountFromDigits(extractDigits(e.target.value)))}
            onBlur={() => {
              if (minTopupUsdt !== null) {
                const val = parseUsdLikeAmount(amount);
                if (val < minTopupUsdt) {
                  const digits = (minTopupUsdt * 100).toFixed(0);
                  setAmount(formatUsdLikeAmountFromDigits(digits));
                }
              }
            }}
            inputMode="decimal"
            placeholder="0.00"
            className="mt-2 h-12 w-full rounded-2xl bg-gray-50 px-4 text-sm text-zinc-950 ring-1 ring-black/5 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-yellow-500/30 dark:bg-white/5 dark:text-white dark:ring-white/10 dark:placeholder:text-white/35"
          />

          {amountVal > 0 && (
            <div className="mt-2 flex justify-between px-1 text-xs text-zinc-500 dark:text-white/60">
              <span>Comisión estimada: {formatUsdt(estFee)}</span>
              <span>Total estimado: {formatUsdt(estTotal)}</span>
            </div>
          )}

          <div className="mt-4 rounded-2xl bg-gray-50 p-4 text-sm text-zinc-500 dark:bg-white/5 dark:text-white/60">
            {t("topup.minNoticePrefix")} {formatUsdt(minTopupUsdt ?? 0)} USDT
          </div>

          <div className="mt-4">
            <button
              type="button"
              disabled={isSubmitting}
              aria-busy={isSubmitting}
              onClick={handleStartTopUp}
              className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-yellow-500 text-sm font-bold text-black shadow-lg shadow-yellow-500/25 transition-all hover:-translate-y-0.5 hover:bg-yellow-400 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {isSubmitting ? t("topup.submitting") : t("topup.title")}
            </button>
          </div>
        </div>
      </div>

      {/* --- BOTTOM SHEETS --- */}

      {/* 1. Method Selector */}
      {showMethodSelector && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-[420px] rounded-t-3xl bg-white p-6 shadow-2xl dark:bg-zinc-900 animate-in slide-in-from-bottom duration-300">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold">Selecciona método</h3>
              <button onClick={() => setShowMethodSelector(false)} className="rounded-full p-1 hover:bg-gray-100 dark:hover:bg-zinc-800">
                <svg className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="space-y-3">
              <button 
                onClick={() => handleSelectMethod("coinbase")}
                className="flex w-full items-center gap-4 rounded-2xl bg-gray-50 p-4 hover:bg-gray-100 dark:bg-zinc-800 dark:hover:bg-zinc-700"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500 text-white">
                  <span className="font-bold">C</span>
                </div>
                <div className="text-left">
                  <div className="font-bold">Coinbase Commerce</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Automático, rápido y seguro.</div>
                </div>
              </button>

              <button 
                onClick={() => handleSelectMethod("manual")}
                className="flex w-full items-center gap-4 rounded-2xl bg-gray-50 p-4 hover:bg-gray-100 dark:bg-zinc-800 dark:hover:bg-zinc-700"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-500 text-black">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                </div>
                <div className="text-left">
                  <div className="font-bold">Depósito Manual</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Transferencia directa a wallet (BTC, ETH, USDT).</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Select Currency (Manual) */}
      {manualStep === "select-currency" && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-[420px] rounded-t-3xl bg-white p-6 shadow-2xl dark:bg-zinc-900 h-[80vh] flex flex-col animate-in slide-in-from-bottom duration-300">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button onClick={() => setManualStep(null)} className="rounded-full p-1 hover:bg-gray-100 dark:hover:bg-zinc-800">
                  <svg className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <h3 className="text-lg font-bold">Seleccionar moneda</h3>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-2">
              {(Object.keys(STATIC_CRYPTO_WALLETS) as CryptoCurrency[]).map((currency) => (
                <button
                  key={currency}
                  onClick={() => handleSelectCurrency(currency)}
                  className="flex w-full items-center gap-4 rounded-xl p-3 hover:bg-gray-50 dark:hover:bg-zinc-800"
                >
                  <Image src={CRYPTO_ICONS[currency]} alt={currency} width={32} height={32} className="rounded-full" />
                  <div className="flex-1 text-left font-bold">{currency}</div>
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. Select Network (Manual) */}
      {manualStep === "select-network" && selectedCurrency && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-[420px] rounded-t-3xl bg-white p-6 shadow-2xl dark:bg-zinc-900 animate-in slide-in-from-bottom duration-300">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button onClick={() => setManualStep("select-currency")} className="rounded-full p-1 hover:bg-gray-100 dark:hover:bg-zinc-800">
                  <svg className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <h3 className="text-lg font-bold">Elige la red ({selectedCurrency})</h3>
              </div>
            </div>
            
            <div className="space-y-2">
              {Object.keys(STATIC_CRYPTO_WALLETS[selectedCurrency]).map((networkKey) => (
                <button
                  key={networkKey}
                  onClick={() => handleSelectNetwork(networkKey)}
                  className="w-full rounded-xl border border-gray-200 p-4 text-left hover:bg-gray-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
                >
                  <div className="font-bold">{NETWORK_NAMES[networkKey as keyof typeof NETWORK_NAMES] || networkKey}</div>
                  <div className="text-xs text-gray-500">Tiempo estimado: ~5 min</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. Show Wallet (Manual) */}
      {manualStep === "show-wallet" && selectedCurrency && selectedNetwork && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-[420px] rounded-t-3xl bg-white p-6 shadow-2xl dark:bg-zinc-900 h-[90vh] flex flex-col animate-in slide-in-from-bottom duration-300">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button onClick={() => setManualStep("select-network")} className="rounded-full p-1 hover:bg-gray-100 dark:hover:bg-zinc-800">
                  <svg className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <h3 className="text-lg font-bold">Depositar {selectedCurrency}</h3>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="mt-4 flex justify-center">
                <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/10">
                  <QRCode 
                    value={(STATIC_CRYPTO_WALLETS[selectedCurrency] as Record<string, string>)[selectedNetwork]} 
                    size={200} 
                  />
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <div className="rounded-xl bg-gray-50 p-4 dark:bg-zinc-800">
                  <div className="text-xs text-gray-500 dark:text-gray-400">Dirección de depósito ({selectedNetwork})</div>
                  <div className="mt-1 flex items-center justify-between break-all font-mono text-sm font-medium">
                    {(STATIC_CRYPTO_WALLETS[selectedCurrency] as Record<string, string>)[selectedNetwork]}
                    <button 
                      onClick={() => copyToClipboard((STATIC_CRYPTO_WALLETS[selectedCurrency] as Record<string, string>)[selectedNetwork])}
                      className="ml-2 rounded-lg bg-white p-2 text-gray-600 shadow-sm hover:bg-gray-100 dark:bg-zinc-700 dark:text-white"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                    </button>
                  </div>
                </div>

                <div className="rounded-xl bg-yellow-50 p-4 text-sm text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200">
                  <p className="font-bold">⚠️ Advertencia Importante</p>
                  <p className="mt-1">
                    Envía solo <strong>{selectedCurrency}</strong> a través de la red <strong>{selectedNetwork}</strong>. 
                    Enviar cualquier otra moneda o usar otra red resultará en la pérdida permanente de tus fondos.
                  </p>
                </div>

                <div className="rounded-xl border border-gray-100 p-4 dark:border-zinc-800">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Monto a recargar</span>
                    <span className="font-bold">{formatUsdt(amountVal)} USDT</span>
                  </div>
                  
                  {exchangeRates && selectedCurrency && exchangeRates[selectedCurrency] && (
                    <div className="mt-2 flex justify-between border-t border-gray-100 pt-2 text-sm dark:border-zinc-700">
                      <span className="text-gray-500">Debes transferir:</span>
                      <div className="text-right">
                        <span className="block font-bold text-lg text-black dark:text-white">
                          {(amountVal * Number(exchangeRates[selectedCurrency])).toFixed(8).replace(/\.?0+$/, "")} {selectedCurrency}
                        </span>
                        <span className="text-xs text-gray-400">
                          (Aprox. según tasa actual)
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-2 border-t border-gray-100 dark:border-zinc-800">
              <button
                onClick={handleConfirmManualTransfer}
                disabled={isSubmitting}
                className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-green-600 text-sm font-bold text-white shadow-lg transition-all hover:bg-green-500 active:translate-y-0 disabled:opacity-50"
              >
                {isSubmitting ? "Procesando..." : "He realizado la transferencia"}
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}
