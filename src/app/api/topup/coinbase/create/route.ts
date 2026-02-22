import { NextResponse } from "next/server";
import { requireTelegramSession } from "@/lib/auth/requireTelegramSession";
import { coinbaseClient } from "@/lib/coinbase/client";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { telegramId } = requireTelegramSession(req);
    const body = await req.json();
    const amount = Number(body.amount_usdt);

    if (!amount || amount <= 0) {
      return NextResponse.json({ ok: false, error: "Monto inválido" }, { status: 400 });
    }

    // Calcular comisión estimada (1%)
    const serviceFee = amount * 0.01;
    const totalToPay = amount + serviceFee;

    // Crear cargo en Coinbase Commerce
    // Se cobra el total (monto + comisión)
    const charge = await coinbaseClient.createCharge({
      name: "Recarga Criptocard",
      description: `Recarga de ${amount} USDT`,
      amount: totalToPay,
      currency: "USD",
      metadata: {
        telegram_id: telegramId.toString(),
        net_amount_usdt: amount,
        service_fee: serviceFee
      },
      // URLs de redirección (ajustar según tu bot)
      redirectUrl: "https://t.me/CriptoCardBot",
      cancelUrl: "https://t.me/CriptoCardBot"
    });

    return NextResponse.json({
      ok: true,
      hosted_url: charge.data.hosted_url,
      code: charge.data.code,
      details: {
        amount,
        serviceFee,
        totalToPay
      }
    });

  } catch (e: any) {
    console.error("Error creating Coinbase charge:", e);
    return NextResponse.json({ ok: false, error: e.message || "Error interno" }, { status: 500 });
  }
}
