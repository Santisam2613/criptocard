"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

type Transaction = {
  id: string;
  created_at: string;
  amount_usdt: number;
  status: "pending" | "completed" | "rejected";
  type: "withdraw" | "topup_manual";
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
  const [filter, setFilter] = useState<"all" | "withdraw" | "topup_manual">("all");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [cards, setCards] = useState<any[]>([]); // New state for cards
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
      
      // Fetch Transactions
      const url = filter === "all" 
        ? "/api/admin/transactions" 
        : `/api/admin/transactions?type=${filter}`;
      
      const headers: Record<string, string> = {};
      if (process.env.NODE_ENV === "development") {
          headers["x-admin-bypass"] = "1";
      }

      // Add no-store to avoid caching issues
      const res = await fetch(url, { 
          cache: "no-store", 
          headers,
          next: { revalidate: 0 }
      });
      
      if (res.status === 401) {
         setError("Unauthorized: Please access via Telegram or check your credentials.");
         setLoading(false);
         return;
      }

      const json = await res.json();
      if (json.ok) {
        setTransactions(json.transactions);
      } else {
        setError(json.error || "Failed to fetch transactions");
      }

      // Fetch Pending Cards
      const resCards = await fetch("/api/admin/cards?status=frozen", { 
          cache: "no-store", 
          headers,
          next: { revalidate: 0 }
      });
      if (resCards.ok) {
          const jsonCards = await resCards.json();
          if (jsonCards.ok && Array.isArray(jsonCards.cards)) {
              setCards(jsonCards.cards);
          }
      }

    } catch (e) {
      setError("Error fetching data");
    } finally {
      setLoading(false);
    }
  }

  async function activateCard(cardId: string, last4: string, expMonth: string, expYear: string) {
    if (!last4 || !expMonth || !expYear) return alert("Fill all fields");
    try {
        const res = await fetch("/api/admin/cards", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                id: cardId,
                action: "activate",
                last_4: last4,
                expiry_month: parseInt(expMonth),
                expiry_year: parseInt(expYear)
            })
        });
        const json = await res.json();
        if (json.ok) {
            alert("Card activated!");
            // Refresh cards list
            const resCards = await fetch("/api/admin/cards?status=frozen", { cache: "no-store" });
            if (resCards.ok) {
                const jsonCards = await resCards.json();
                if (jsonCards.ok && Array.isArray(jsonCards.cards)) {
                    setCards(jsonCards.cards);
                }
            }
        } else {
            alert("Error: " + json.error);
        }
    } catch {
        alert("Failed to activate card");
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

  function CardRow({ card, onActivate }: { card: any; onActivate: any }) {
    const [last4, setLast4] = useState("");
    const [expMonth, setExpMonth] = useState("12");
    const [expYear, setExpYear] = useState(new Date().getFullYear() + 3);

    return (
        <tr className="hover:bg-gray-50/50 dark:hover:bg-white/5">
            <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                    {card.users?.telegram_photo_url && (
                        <Image
                            src={card.users.telegram_photo_url}
                            alt=""
                            width={32}
                            height={32}
                            className="h-8 w-8 rounded-full bg-gray-200 object-cover"
                        />
                    )}
                    <div>
                        <div className="font-semibold">
                            {card.users?.telegram_first_name} {card.users?.telegram_last_name}
                        </div>
                        <div className="text-xs text-gray-500">@{card.users?.telegram_username}</div>
                    </div>
                </div>
            </td>
            <td className="px-6 py-4 font-mono">{card.metadata?.cardholder_name}</td>
            <td className="px-6 py-4">
                <div className="flex gap-2">
                    <input
                        placeholder="Last 4"
                        className="w-20 rounded border px-2 py-1 text-xs dark:bg-black dark:border-zinc-700"
                        value={last4}
                        onChange={(e) => setLast4(e.target.value)}
                        maxLength={4}
                    />
                    <input
                        placeholder="MM"
                        className="w-12 rounded border px-2 py-1 text-xs dark:bg-black dark:border-zinc-700"
                        value={expMonth}
                        onChange={(e) => setExpMonth(e.target.value)}
                        maxLength={2}
                    />
                    <input
                        placeholder="YYYY"
                        className="w-16 rounded border px-2 py-1 text-xs dark:bg-black dark:border-zinc-700"
                        value={expYear}
                        onChange={(e) => setExpYear(Number(e.target.value))}
                        maxLength={4}
                    />
                </div>
            </td>
            <td className="px-6 py-4">
                <button
                    onClick={() => onActivate(card.id, last4, expMonth, expYear)}
                    className="rounded-lg bg-green-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-green-600"
                >
                    Activate
                </button>
            </td>
        </tr>
    );
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
            onClick={() => setFilter("withdraw")}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
              filter === "withdraw"
                ? "bg-black text-white dark:bg-white dark:text-black"
                : "bg-white text-gray-600 hover:bg-gray-50 dark:bg-zinc-800 dark:text-gray-300 dark:hover:bg-zinc-700"
            }`}
          >
            Withdrawals
          </button>
        </div>

        {/* Pending Cards Section */}
        {cards.length > 0 && (
            <div className="mb-8 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5 dark:bg-zinc-900 dark:ring-white/10">
                <div className="bg-yellow-50 px-6 py-4 dark:bg-yellow-900/20">
                    <h2 className="text-lg font-bold text-yellow-800 dark:text-yellow-200">
                        Pending Virtual Cards ({cards.length})
                    </h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-zinc-800/50 dark:text-gray-400">
                            <tr>
                                <th className="px-6 py-4">User</th>
                                <th className="px-6 py-4">Cardholder</th>
                                <th className="px-6 py-4">Details</th>
                                <th className="px-6 py-4">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                            {cards.map((card) => (
                                <CardRow key={card.id} card={card} onActivate={activateCard} />
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

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
                        {t.type === "withdraw" ? "-" : "+"}
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
