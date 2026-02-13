import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";

import { getServerCredentials } from "@/config/credentials";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

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
    const stripe = new Stripe(creds.stripe.secretKey, {
      apiVersion: "2026-01-28.clover",
    });
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
    const auth = event.data.object as Stripe.Issuing.Authorization;
    const stripeCardId = auth.card.id;
    const amount = auth.amount / 100; // Stripe usa centavos
    // const currency = auth.currency;

    // Buscar usuario dueño de la tarjeta
    const { data: card } = await supabase
      .from("cards")
      .select("user_id, status")
      .eq("provider_card_id", stripeCardId)
      .single();

    if (!card || card.status !== "active") {
      // Rechazar si tarjeta no existe o está bloqueada localmente
      return NextResponse.json({
        approved: false,
        metadata: { reason: "card_inactive_or_missing" },
      });
    }

    // Verificar Saldo en Wallet (Atomicity is key here)
    const { data: balanceCheck } = await supabase.rpc("check_wallet_balance", {
      p_user_id: card.user_id,
      p_amount: amount,
    });

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
  }

  // 3. Manejar Captura (Gasto Real)
  if (event.type === "issuing_transaction.created") {
    const tx = event.data.object as Stripe.Issuing.Transaction;
    const stripeCardId = tx.card;
    const amount = Math.abs(tx.amount / 100); // Siempre positivo para restar

    // Buscar tarjeta y usuario
    const { data: card } = await supabase
      .from("cards")
      .select("user_id")
      .eq("provider_card_id", stripeCardId)
      .single();

    if (card) {
      // Registrar transacción en ledger y descontar saldo real
      await supabase.rpc("record_card_transaction", {
        p_user_id: card.user_id,
        p_amount: amount, // Se restará en la lógica del RPC
        p_stripe_tx_id: tx.id,
        p_merchant: tx.merchant_data.name,
      });
    }
  }

  return NextResponse.json({ received: true });
}
