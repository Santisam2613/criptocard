import { useCallback, useEffect, useState } from "react";
import { useBackendUser } from "@/miniapp/hooks/useBackendUser";

export type TransactionType =
  | "topup"
  | "transfer"
  | "withdraw"
  | "referral_conversion"
  | "card_purchase"
  | "stripe_payment"
  | "diamond_conversion";

export type TransactionStatus = "pending" | "completed" | "rejected";

export type Transaction = {
  id: string;
  type: TransactionType;
  amount_usdt: number;
  status: TransactionStatus;
  metadata: Record<string, any>;
  created_at: string;
};

export function useTransactions() {
  const { state: userState } = useBackendUser();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(async () => {
    if (userState.status !== "ready") return;

    try {
      setIsLoading(true);
      // Usamos la misma autenticación que useBackendUser (cookie based)
      const res = await fetch("/api/transactions", {
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      const data = await res.json();
      
      if (data.ok) {
        setTransactions(data.transactions);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError("Error de conexión");
    } finally {
      setIsLoading(false);
    }
  }, [userState.status]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  return { transactions, isLoading, error, refetch: fetchTransactions };
}
