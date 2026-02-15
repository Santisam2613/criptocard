import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";

import { getServerCredentials } from "@/config/credentials";
import { createStripe } from "@/lib/stripe/client";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

function getCardId(card: Stripe.Issuing.Authorization["card"] | Stripe.Issuing.Transaction["card"]) {
  if (typeof card === "string") return card;
  return (card as unknown as { id?: string } | null)?.id ?? null;
}

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get("stripe-signature");
  const creds = getServerCredentials();

  if (!creds.stripe?.secretKey || !creds.stripe.webhookSecret) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
  }

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  // 1. Verificar firma (Seguridad Crítica)
  let event: Stripe.Event;
  try {
    const stripe = createStripe();
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      creds.stripe.webhookSecret,
    );
  } catch {
    return NextResponse.json(
      { error: "Webhook signature verification failed" },
      { status: 400 },
    );
  }

  const supabase = getSupabaseAdminClient();

  // 2. Manejar Autorización (Tiempo Real)
  if (event.type === "issuing_authorization.request") {
    try {
      const auth = event.data.object as Stripe.Issuing.Authorization;
      const stripeCardId = getCardId(auth.card);
      const amount = auth.amount / 100; // Stripe usa centavos
      // const currency = auth.currency;

      if (!stripeCardId) {
        return NextResponse.json({
          approved: false,
          metadata: { reason: "missing_card_id" },
        });
      }

      // Buscar usuario dueño de la tarjeta
      const { data: card } = await supabase
        .from("cards")
        .select("user_id, status")
        .eq("provider_card_id", stripeCardId)
        .maybeSingle();

      if (!card || card.status !== "active") {
        // Rechazar si tarjeta no existe o está bloqueada localmente
        return NextResponse.json({
          approved: false,
          metadata: { reason: "card_inactive_or_missing" },
        });
      }

      // Verificar Saldo en Wallet (Atomicity is key here)
      const { data: balanceCheck, error: balanceError } = await supabase.rpc(
        "check_wallet_balance",
        {
          p_user_id: card.user_id,
          p_amount: amount,
        },
      );

      if (balanceError) {
        return NextResponse.json({
          approved: false,
          metadata: { reason: "balance_check_failed" },
        });
      }

      // balanceCheck es un array porque RPC devuelve TABLE(...)
      const result = Array.isArray(balanceCheck) ? balanceCheck[0] : balanceCheck;

      if (!result?.sufficient) {
        return NextResponse.json({
          approved: false,
          metadata: { reason: "insufficient_funds" },
        });
      }

      // Aprobar
      return NextResponse.json({ approved: true });
    } catch (e) {
      console.error("Webhook issuing_authorization.request error:", e);
      return NextResponse.json(
        { approved: false, metadata: { reason: "internal_error" } },
        { status: 200 },
      );
    }
  }

  // 3. Manejar Captura (Gasto Real)
  if (event.type === "issuing_transaction.created") {
    try {
      const tx = event.data.object as Stripe.Issuing.Transaction;
      const stripeCardId = getCardId(tx.card);
      const amount = Math.abs(tx.amount / 100); // Siempre positivo para restar
      const merchant =
        (tx.merchant_data as { name?: string | null } | null)?.name ?? "Pago con tarjeta";

      if (!stripeCardId) {
        return NextResponse.json({ received: true });
      }

      // Buscar tarjeta y usuario
      const { data: card } = await supabase
        .from("cards")
        .select("user_id")
        .eq("provider_card_id", stripeCardId)
        .maybeSingle();

      if (!card) {
        return NextResponse.json({ received: true });
      }

      // Registrar transacción en ledger y descontar saldo real
      const { error: recordError } = await supabase.rpc("record_card_transaction", {
        p_user_id: card.user_id,
        p_amount: amount, // Se restará en la lógica del RPC
        p_stripe_tx_id: tx.id,
        p_merchant: merchant,
      });

      if (recordError) {
        throw new Error(recordError.message);
      }
    } catch (e) {
      console.error("Webhook issuing_transaction.created error:", e);
      return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
