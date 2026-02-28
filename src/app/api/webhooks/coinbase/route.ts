import { NextResponse } from "next/server";
import { Webhook } from "coinbase-commerce-node";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const WEBHOOK_SECRET = process.env.COINBASE_COMMERCE_WEBHOOK_SECRET;

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-cc-webhook-signature");

    if (!WEBHOOK_SECRET || !signature) {
      return NextResponse.json(
        { ok: false, error: "Missing secret or signature" },
        { status: 400 },
      );
    }

    let event;
    try {
      event = Webhook.verifyEventBody(rawBody, signature, WEBHOOK_SECRET);
    } catch (e) {
      console.error("Webhook signature verification failed:", e);
      return NextResponse.json(
        { ok: false, error: "Invalid signature" },
        { status: 401 },
      );
    }

    const { type, data } = event;

    // Solo nos interesa cuando el pago está confirmado
    if (type === "charge:confirmed") {
      const metadata = data.metadata as {
        user_id?: string;
        net_amount_usdt?: string;
        telegram_id?: string;
      };

      if (!metadata?.user_id || !metadata?.net_amount_usdt) {
        console.error("Missing metadata in charge:", data.code);
        return NextResponse.json({ ok: true }); // Acknowledge to stop retries
      }

      const userId = metadata.user_id;
      const amount = Number(metadata.net_amount_usdt);
      const chargeCode = data.code;

      if (!Number.isFinite(amount) || amount <= 0) {
        console.error("Invalid amount in metadata:", amount);
        return NextResponse.json({ ok: true });
      }

      const supabase = getSupabaseAdminClient();

      // Verificar idempotencia: ¿Ya existe una transacción con este charge_code?
      // Usamos metadata->>coinbase_code para buscar
      const { data: existingTx } = await supabase
        .from("transactions")
        .select("id")
        .eq("metadata->>coinbase_code", chargeCode)
        .maybeSingle();

      if (existingTx) {
        console.log(`Transaction for charge ${chargeCode} already processed.`);
        return NextResponse.json({ ok: true });
      }

      // Crear transacción de topup
      // Esto disparará el trigger update_wallet_balance automáticamente
      const { error: txError } = await supabase.from("transactions").insert({
        user_id: userId,
        type: "topup",
        amount_usdt: amount,
        status: "completed",
        metadata: {
          coinbase_code: chargeCode,
          coinbase_id: data.id,
          description: "Recarga vía Coinbase Commerce",
        },
      });

      if (txError) {
        console.error("Error creating transaction:", txError);
        return NextResponse.json(
          { ok: false, error: "DB Error" },
          { status: 500 },
        );
      }

      console.log(
        `Topup processed successfully for user ${userId}, amount ${amount}`,
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Webhook handler error:", e);
    return NextResponse.json(
      { ok: false, error: "Internal Error" },
      { status: 500 },
    );
  }
}
