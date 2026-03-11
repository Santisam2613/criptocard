"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

type Transaction = {
  id: string;
  created_at: string;
  amount_usdt: number;
  status: "pending" | "completed" | "rejected";
  type: "withdrawal" | "topup_manual";
  metadata: {
    address?: string;
    network?: string;
    currency?: string;
    description?: string;
  };
  users: {
    telegram_id: string;
    telegram_username: string | null;
    telegram_first_name: string | null;
    telegram_last_name: string | null;
    telegram_photo_url: string | null;
  };
};

export default function AdminPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | "withdrawal" | "topup_manual">("all");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmingAction, setConfirmingAction] = useState<{
    id: string;
    status: "completed" | "rejected";
  } | null>(null);

  useEffect(() => {
    fetchTransactions();
  }, [filter]);

  async function fetchTransactions() {
    try {
      setLoading(true);
      setError(null);
      const url = filter === "all" 
        ? "/api/admin/transactions" 
        : `/api/admin/transactions?type=${filter}`;
        
      const res = await fetch(url, { cache: "no-store" });
      
      if (res.status === 401) {
        setError("Unauthorized: Please access via Telegram or check your credentials.");
        return;
      }

      const json = await res.json();
      if (json.ok) {
        setTransactions(json.transactions);
      } else {
        setError(json.error || "Failed to fetch");
      }
    } catch (e) {
      setError("Error fetching data");
    } finally {
      setLoading(false);
    }
  }

  async function copyToClipboard(text: string) {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error("Failed to copy", err);
    }
  }

  function requestUpdate(id: string, status: "completed" | "rejected") {
    setConfirmingAction({ id, status });
  }

  async function performUpdate() {
    if (!confirmingAction) return;
    const { id, status } = confirmingAction;

    try {
      const res = await fetch("/api/admin/transactions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      const json = await res.json();
      if (json.ok) {
        await fetchTransactions(); // Refresh list
      } else {
        alert(json.error || "Failed to update");
      }
    } catch (e) {
      alert("Error updating status");
    } finally {
      setConfirmingAction(null);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4 text-zinc-900 dark:bg-black dark:text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Admin Panel - Transactions</h1>
          <button
            onClick={() => router.push("/miniapp")}
            className="rounded-xl bg-gray-200 px-4 py-2 text-sm font-semibold hover:bg-gray-300 dark:bg-zinc-800 dark:hover:bg-zinc-700"
          >
            Exit Admin
          </button>
        </div>

        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
              filter === "all"
                ? "bg-black text-white dark:bg-white dark:text-black"
                : "bg-white text-gray-600 hover:bg-gray-50 dark:bg-zinc-800 dark:text-gray-300 dark:hover:bg-zinc-700"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter("topup_manual")}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
              filter === "topup_manual"
                ? "bg-black text-white dark:bg-white dark:text-black"
                : "bg-white text-gray-600 hover:bg-gray-50 dark:bg-zinc-800 dark:text-gray-300 dark:hover:bg-zinc-700"
            }`}
          >
            Deposits
          </button>
          <button
            onClick={() => setFilter("withdrawal")}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
              filter === "withdrawal"
                ? "bg-black text-white dark:bg-white dark:text-black"
                : "bg-white text-gray-600 hover:bg-gray-50 dark:bg-zinc-800 dark:text-gray-300 dark:hover:bg-zinc-700"
            }`}
          >
            Withdrawals
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-red-100 p-4 text-red-800 dark:bg-red-900/30 dark:text-red-300">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-10">Loading...</div>
        ) : (
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5 dark:bg-zinc-900 dark:ring-white/10">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-zinc-800/50 dark:text-gray-400">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Type</th>
                    <th className="px-6 py-4 font-semibold">Date</th>
                    <th className="px-6 py-4 font-semibold">User</th>
                    <th className="px-6 py-4 font-semibold">Amount</th>
                    <th className="px-6 py-4 font-semibold">Details</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                    <th className="px-6 py-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                  {transactions.map((t) => (
                    <tr key={t.id} className="hover:bg-gray-50/50 dark:hover:bg-white/5">
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                            t.type === "topup_manual"
                              ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                              : "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300"
                          }`}
                        >
                          {t.type === "topup_manual" ? "DEPOSIT" : "WITHDRAWAL"}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-gray-500 dark:text-gray-400">
                        {new Date(t.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {t.users.telegram_photo_url ? (
                            <Image
                              src={t.users.telegram_photo_url}
                              alt=""
                              width={32}
                              height={32}
                              className="h-8 w-8 rounded-full bg-gray-200 object-cover"
                            />
                          ) : (
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-xs font-bold text-gray-500 dark:bg-zinc-800">
                              {t.users.telegram_first_name?.[0]}
                            </div>
                          )}
                          <div>
                            <div className="font-semibold">
                              {t.users.telegram_first_name} {t.users.telegram_last_name}
                            </div>
                            <div className="text-xs text-gray-500">
                              @{t.users.telegram_username || "N/A"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 font-mono font-medium">
                        {t.type === "withdrawal" ? "-" : "+"}
                        {Math.abs(t.amount_usdt).toFixed(2)} USDT
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-gray-500">
                        <div className="flex flex-col gap-1">
                          {t.metadata?.network && (
                            <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                              {t.metadata.currency} ({t.metadata.network})
                            </span>
                          )}
                          {t.metadata?.address && (
                            <div className="flex items-center gap-2">
                              <span className="max-w-[120px] truncate" title={t.metadata.address}>
                                {t.metadata.address}
                              </span>
                              <button
                                onClick={() => copyToClipboard(t.metadata.address || "")}
                                className="text-gray-400 hover:text-gray-600"
                              >
                                📋
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            t.status === "completed"
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                              : t.status === "rejected"
                                ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                                : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                          }`}
                        >
                          {t.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {t.status === "pending" && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => requestUpdate(t.id, "completed")}
                              className="rounded-lg bg-green-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-green-600"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => requestUpdate(t.id, "rejected")}
                              className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-600"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {transactions.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                        No transactions found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {confirmingAction && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white p-6 shadow-2xl dark:bg-zinc-900">
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Confirm Action</h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-gray-300">
                {confirmingAction.status === "completed"
                  ? "Are you sure you want to APPROVE this transaction? Balance will be updated."
                  : "Are you sure you want to REJECT this transaction?"}
              </p>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setConfirmingAction(null)}
                  className="rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-200 dark:bg-zinc-800 dark:text-gray-300 dark:hover:bg-zinc-700"
                >
                  Cancel
                </button>
                <button
                  onClick={performUpdate}
                  className={`rounded-xl px-4 py-2.5 text-sm font-bold text-white shadow-lg ${
                    confirmingAction.status === "completed"
                      ? "bg-green-500 hover:bg-green-600 shadow-green-500/20"
                      : "bg-red-500 hover:bg-red-600 shadow-red-500/20"
                  }`}
                >
                  {confirmingAction.status === "completed" ? "Approve" : "Reject"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
