import { NextResponse } from "next/server";
import { coinbaseClient } from "@/lib/coinbase/client";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("X-CC-Webhook-Signature");

    if (!signature || !coinbaseClient.verifyWebhookSignature(rawBody, signature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(rawBody);

    if (event.type === "charge:confirmed") {
      const { metadata, id: chargeId } = event.data;
      const telegramId = metadata?.telegram_id;
      const amount = Number(metadata?.net_amount_usdt);

      if (!telegramId || !amount) {
        console.error("Missing metadata in Coinbase webhook", metadata);
        return NextResponse.json({ error: "Invalid metadata" }, { status: 400 });
      }

      const supabase = getSupabaseAdminClient();

      // Idempotency check: Check if we already processed this charge
      const { data: existing } = await supabase
        .from("transactions")
        .select("id")
        .eq("metadata->>coinbase_charge_id", chargeId)
        .single();

      if (existing) {
        console.log(`Charge ${chargeId} already processed`);
        return NextResponse.json({ ok: true });
      }

      // Get user ID
      const { data: user } = await supabase
        .from("users")
        .select("id")
        .eq("telegram_id", telegramId)
        .single();

      if (!user) {
        console.error(`User not found for telegram_id ${telegramId}`);
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      // Insert transaction (Ledger)
      // The trigger `transactions_update_wallet` will automatically update the user's wallet balance
      const { error } = await supabase.from("transactions").insert({
        type: "topup",
        user_id: user.id,
        amount_usdt: amount,
        status: "completed",
        metadata: {
          description: "Recarga vía Coinbase Commerce",
          source: "coinbase_webhook",
          coinbase_charge_id: chargeId,
          service_fee: metadata.service_fee
        }
      });

      if (error) {
        console.error("Error creating transaction", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("Webhook error:", e);
    return NextResponse.json({ error: e.message || "Internal Error" }, { status: 500 });
  }
}
