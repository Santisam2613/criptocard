import { format } from "date-fns";
import { useTransactions, Transaction } from "@/miniapp/hooks/useTransactions";
import Skeleton from "@/components/ui/Skeleton";

function TransactionIcon({ type }: { type: Transaction["type"] }) {
  switch (type) {
    case "topup":
      return (
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/20 text-green-500">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </div>
      );
    case "transfer":
      return (
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/20 text-blue-500">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M7 17l9.2-9.2M17 17V7H7" />
          </svg>
        </div>
      );
    case "withdraw":
      return (
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/20 text-red-500">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 19V5M5 12l7 7 7-7" />
          </svg>
        </div>
      );
    default:
      return (
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-500/20 text-zinc-500">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
          </svg>
        </div>
      );
  }
}

function getTransactionTitle(tx: Transaction) {
  // 1. Prioridad: Descripción explícita en metadata
  if (tx.metadata?.description) {
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
    case "stripe_payment":
      return tx.metadata?.merchant_name || "Pago con tarjeta";
    case "diamond_conversion":
      return "Conversión de diamantes";
    default:
      return "Transacción";
  }
}

export default function TransactionList() {
  const { transactions, isLoading } = useTransactions();

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
    <div className="space-y-2">
      {transactions.map((tx) => {
        const isPositive = tx.amount_usdt > 0;
        const formattedDate = format(new Date(tx.created_at), "dd MMM, HH:mm");
        
        return (
          <div
            key={tx.id}
            className="flex items-center justify-between rounded-2xl bg-white/5 p-3 transition-colors hover:bg-white/10"
          >
            <div className="flex items-center gap-3">
              <TransactionIcon type={tx.type} />
              <div>
                <div className="text-sm font-semibold text-foreground">
                  {getTransactionTitle(tx)}
                </div>
                <div className="text-xs text-muted">{formattedDate}</div>
              </div>
            </div>
            <div
              className={`text-sm font-bold ${
                isPositive ? "text-green-500" : "text-foreground"
              }`}
            >
              {isPositive ? "+" : ""}
              {tx.amount_usdt.toFixed(2)} USDT
            </div>
          </div>
        );
      })}
    </div>
  );
}
