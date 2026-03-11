import { NextResponse } from "next/server";

import { requireTelegramSession } from "@/lib/auth/requireTelegramSession";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { telegramId } = requireTelegramSession(req);
    const body = (await req.json().catch(() => null)) as {
      amount_usdt?: number | string;
      network?: string;
      currency?: string;
      tx_hash?: string; // Opcional, si el usuario lo provee
    } | null;

    const amount = Number(body?.amount_usdt);
    const network = body?.network;
    const currency = body?.currency;

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { ok: false, error: "Monto inválido" },
        { status: 400 },
      );
    }

    if (!network || !currency) {
      return NextResponse.json(
        { ok: false, error: "Faltan datos de red o moneda" },
        { status: 400 },
      );
    }

    const supabase = getSupabaseAdminClient();

    // 1. Obtener usuario (by telegramId)
    const { data: user } = await supabase
      .from("users")
      .select("id")
      .eq("telegram_id", telegramId.toString())
      .single();

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Usuario no encontrado" },
        { status: 404 },
      );
    }

    // 2. Crear transacción pendiente en Ledger
    // Tipo 'topup_manual' para diferenciar de Coinbase
    // Intentamos insert directo, si falla por RLS, usamos RPC o Service Role (que ya usamos)
    const { error: txError } = await supabase.from("transactions").insert({
      user_id: user.id,
      type: "topup_manual", // Usamos topup_manual ya que lo agregamos al enum
      amount_usdt: amount,
      status: "pending",
      metadata: {
        network,
        currency,
        tx_hash: body?.tx_hash,
        description: `Recarga Manual ${currency} (${network})`,
        user_confirmed: true,
        confirmed_at: new Date().toISOString(),
      },
    });

    if (txError) {
      console.error("Error creando solicitud de recarga manual:", txError);
      return NextResponse.json(
        { ok: false, error: "Error registrando solicitud: " + txError.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Manual topup error:", e);
    return NextResponse.json(
      { ok: false, error: "Error interno" },
      { status: 500 },
    );
  }
}
