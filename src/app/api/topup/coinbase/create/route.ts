import { NextResponse } from "next/server";

import {
  UnauthorizedError,
  requireTelegramSession,
} from "@/lib/auth/requireTelegramSession";
import { Charge } from "@/lib/coinbase/client";
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

    if (user.verification_status !== "approved") {
      return NextResponse.json(
        { ok: false, error: "Usuario no verificado" },
        { status: 403 },
      );
    }

    // 2. Calcular fee (ejemplo 1%)
    const serviceFee = amount * 0.01;
    const totalToPay = amount + serviceFee;

    // 3. Crear Charge en Coinbase Commerce
    // Usamos metadata para rastrear user_id y el monto neto a acreditar
    const chargeData = {
      name: "Recarga de Saldo CriptoCard",
      description: `Recarga de ${amount} USDT para usuario ${telegramId}`,
      pricing_type: "fixed_price",
      local_price: {
        amount: totalToPay.toFixed(2),
        currency: "USD",
      },
      metadata: {
        user_id: user.id,
        telegram_id: telegramId.toString(),
        net_amount_usdt: amount.toString(),
        service_fee: serviceFee.toString(),
      },
      redirect_url: `${process.env.NEXT_PUBLIC_APP_URL || "https://t.me/CriptoCardBot"}/miniapp/topup?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || "https://t.me/CriptoCardBot"}/miniapp/topup?cancel=true`,
    };

    const charge = await Charge.create(chargeData as any);

    // 4. Guardar intento en DB (opcional, pero recomendado para auditoría)
    // Podríamos crear una transacción 'pending' aquí, pero Coinbase
    // maneja su propio estado. Lo dejaremos al webhook para crear la tx final.

    return NextResponse.json({
      ok: true,
      hosted_url: charge.hosted_url,
      code: charge.code,
      id: charge.id,
      details: {
        amount,
        serviceFee,
        totalToPay,
      },
    });
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
    console.error("Coinbase create error:", e);
    return NextResponse.json(
      { ok: false, error: "Error interno creando pago" },
      { status: 500 },
    );
  }
}
