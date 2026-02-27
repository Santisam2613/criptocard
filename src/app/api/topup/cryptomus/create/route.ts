import { NextResponse } from "next/server";

import {
  UnauthorizedError,
  requireTelegramSession,
} from "@/lib/auth/requireTelegramSession";
import { cryptomusClient } from "@/lib/cryptomus/client";
import { CryptomusPaymentPayload } from "@/lib/cryptomus/types";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { telegramId } = requireTelegramSession(req);
    const body = (await req.json().catch(() => null)) as {
      amount_usdt?: number | string;
    } | null;

    const amount = Number(body?.amount_usdt);

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { ok: false, error: "Monto inválido" },
        { status: 400 },
      );
    }

    const supabase = getSupabaseAdminClient();

    // 1. Obtener usuario
    const { data: user } = await supabase
      .from("users")
      .select("id, verification_status")
      .eq("telegram_id", telegramId.toString())
      .single();

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Usuario no encontrado" },
        { status: 404 },
      );
    }

    // 2. Generar Order ID único
    const orderId = `topup-${telegramId}-${Date.now()}`;
    const webhookUrl = `${
      process.env.NEXT_PUBLIC_APP_URL || "https://www.criptocard.com.co"
    }/api/webhooks/cryptomus`;
    const returnUrl = `${
      process.env.NEXT_PUBLIC_APP_URL || "https://www.criptocard.com.co"
    }/miniapp/topup`;

    // 3. Crear transacción pendiente en Ledger
    // Esto nos permite rastrear el intento de pago antes de ir a la pasarela
    const { data: tx, error: txError } = await supabase
      .from("transactions")
      .insert({
        user_id: user.id,
        type: "topup",
        amount_usdt: amount,
        status: "pending",
        metadata: {
          order_id: orderId,
          service: "cryptomus",
        },
      })
      .select()
      .single();

    if (txError) {
      console.error("Error creando transacción pendiente:", txError);
      return NextResponse.json(
        { ok: false, error: "Error iniciando transacción" },
        { status: 500 },
      );
    }

    // 4. Crear pago en Cryptomus
    const payload: CryptomusPaymentPayload = {
      amount: amount.toString(),
      currency: "USDT",
      order_id: orderId,
      url_callback: webhookUrl,
      url_return: returnUrl,
      url_success: `${returnUrl}?success=true`,
      is_payment_multiple: false,
      lifetime: 3600,
      to_currency: "USDT",
    };

    try {
      const result = await cryptomusClient.createPayment(payload);
      return NextResponse.json({
        ok: true,
        payment_url: result.result.url,
        order_id: orderId,
        amount: result.result.amount,
        currency: result.result.currency,
      });
    } catch (apiError) {
      console.error("Cryptomus API error:", apiError);
      // Marcar como fallida la transacción para no dejar basura pendiente
      await supabase
        .from("transactions")
        .update({ status: "rejected" })
        .eq("id", tx.id);

      return NextResponse.json(
        { ok: false, error: "Error contactando con Cryptomus" },
        { status: 502 },
      );
    }
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });
    }
    console.error("Topup create error:", e);
    return NextResponse.json(
      { ok: false, error: "Error interno" },
      { status: 500 },
    );
  }
}
