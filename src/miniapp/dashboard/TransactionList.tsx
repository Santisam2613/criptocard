import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { useTransactions, Transaction } from "@/miniapp/hooks/useTransactions";
import Skeleton from "@/components/ui/Skeleton";
import { formatUsdt } from "@/lib/format/number";

function TransactionIcon({ type }: { type: Transaction["type"] }) {
  const baseClass =
    "flex h-10 w-10 items-center justify-center rounded-full bg-[#F4F5F7] text-[#111] dark:bg-white/5 dark:text-white";

  switch (type) {
    case "topup":
      return (
        <div className={baseClass}>
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
        </div>
      );
    case "card_purchase":
      return (
        <div className={baseClass}>
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="6" width="18" height="12" rx="2" />
            <path d="M3 10h18" />
            <path d="M8 15h3" />
          </svg>
        </div>
      );
    case "card_authorization":
      return (
        <div className={baseClass}>
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" />
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
            <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" />
            <path d="M2 7h20" />
            <path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7" />
          </svg>
        </div>
      );
    case "referral_conversion":
      return (
        <div className={baseClass}>
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M16 20v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M19 8l1 1-1 1" />
            <path d="M21 9h-4" />
          </svg>
        </div>
      );
    case "transfer":
      return (
        <div className={baseClass}>
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M7 17l9.2-9.2M17 17V7H7" />
          </svg>
        </div>
      );
    case "withdraw":
      return (
        <div className={baseClass}>
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M12 19V5M5 12l7 7 7-7" />
          </svg>
        </div>
      );
    default:
      return (
        <div className={baseClass}>
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
          </svg>
        </div>
      );
  }
}

function getTransactionTitle(tx: Transaction) {
  // 1. Prioridad: Descripción explícita en metadata
  if (tx.metadata?.description) {
    if (tx.type === "card_purchase") {
      return tx.metadata.description.replace(/\s*\(Procesando\)\s*$/i, "");
    }
    return tx.metadata.description;
  }

  // 1.1 Soporte para metadata.reason (ej: "manual_credit")
  if (tx.metadata?.reason === "manual_credit") {
    return "Crédito manual";
  }
  
  // 2. Prioridad: Tipos específicos
  switch (tx.type) {
    case "topup":
      return "Recarga de saldo";
    case "transfer":
      // Si hay un nombre de contraparte en metadata, usarlo
      if (tx.metadata?.counterparty_name) {
        return `Transferencia a ${tx.metadata.counterparty_name}`;
      }
      return "Transferencia enviada";
    case "withdraw":
      return "Retiro de fondos";
    case "referral_conversion":
      return "Recompensa por referido";
    case "card_purchase":
      return "Compra tarjeta virtual";
    case "card_authorization":
    case "stripe_payment": // Backwards compatibility if needed
      return tx.metadata?.merchant || tx.metadata?.merchant_name || "Pago con tarjeta";
    case "diamond_conversion":
      return "Conversión de diamantes";
    default:
      return "Transacción";
  }
}

function getStatusLabel(status: Transaction["status"]) {
  switch (status) {
    case "pending":
      return "En espera";
    case "completed":
      return "Completado";
    case "rejected":
      return "Rechazado";
    default:
      return null;
  }
}

export default function TransactionList() {
  const { transactions, isLoading } = useTransactions();
  const pageSize = 8;
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [transactions.length]);

  const totalPages = Math.max(1, Math.ceil(transactions.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return transactions.slice(start, start + pageSize);
  }, [currentPage, transactions]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center justify-between rounded-2xl bg-white/5 p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10" rounded="full" />
              <div>
                <Skeleton className="h-4 w-32" rounded="md" />
                <Skeleton className="mt-2 h-3 w-20" rounded="md" />
              </div>
            </div>
            <Skeleton className="h-4 w-16" rounded="md" />
          </div>
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="flex h-44 flex-col items-center justify-center gap-5 bg-[radial-gradient(100%_90%_at_50%_0%,rgba(0,0,0,0.06),transparent_60%)] dark:bg-[radial-gradient(100%_90%_at_50%_0%,rgba(255,255,255,0.06),transparent_60%)]">
        <div className="text-5xl">🧐</div>
        <div className="text-base font-semibold text-zinc-950 dark:text-white/90">
          Aún no hay historial
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-2">
        {pageItems.map((tx) => {
        const isPositive = tx.amount_usdt > 0;
        const formattedDate = format(new Date(tx.created_at), "dd MMM, HH:mm");
        const statusLabel = tx.type === "withdraw" ? getStatusLabel(tx.status) : null;
        
        return (
          <div
            key={tx.id}
            className="flex items-center justify-between rounded-2xl bg-white p-3 transition-colors hover:bg-gray-50 dark:bg-[#1A1D24] dark:hover:bg-[#20242C]"
          >
            <div className="flex items-center gap-3">
              <TransactionIcon type={tx.type} />
              <div>
                <div className="text-sm font-semibold text-foreground">
                  {getTransactionTitle(tx)}
                </div>
                <div className="text-xs text-muted">
                  {statusLabel ? `${statusLabel} · ${formattedDate}` : formattedDate}
                </div>
              </div>
            </div>
            <div
              className={`text-sm font-bold ${
                isPositive ? "text-yellow-500" : "text-foreground"
              }`}
            >
              {isPositive ? "+" : ""}
              {formatUsdt(tx.amount_usdt)} USDT
            </div>
          </div>
        );
        })}
      </div>

      {totalPages > 1 ? (
        <div className="mt-3 flex items-center justify-between gap-3">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="cc-glass cc-neon-outline inline-flex h-10 items-center justify-center rounded-full px-4 text-sm font-semibold text-foreground disabled:cursor-not-allowed disabled:opacity-60"
          >
            Anterior
          </button>
          <div className="text-xs font-semibold text-muted">
            Página {currentPage} de {totalPages}
          </div>
          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="cc-glass cc-neon-outline inline-flex h-10 items-center justify-center rounded-full px-4 text-sm font-semibold text-foreground disabled:cursor-not-allowed disabled:opacity-60"
          >
            Siguiente
          </button>
        </div>
      ) : null}
    </div>
  );
}
