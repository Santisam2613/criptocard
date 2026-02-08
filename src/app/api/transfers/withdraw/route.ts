import { NextResponse } from "next/server";

import {
  UnauthorizedError,
  requireTelegramSession,
} from "@/lib/auth/requireTelegramSession";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { telegramId } = requireTelegramSession(req);
    const body = (await req.json().catch(() => null)) as
      | { address?: string; network?: string; amount_usdt?: number }
      | null;

    const address = (body?.address ?? "").trim();
    const network = (body?.network ?? "").trim();
    const amount = Number(body?.amount_usdt);

    if (!address || !network) {
      return NextResponse.json(
        { ok: false, error: "Datos inválidos" },
        { status: 400 },
      );
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { ok: false, error: "Monto inválido" },
        { status: 400 },
      );
    }

    const supabase = getSupabaseAdminClient();

    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("telegram_id", telegramId.toString())
      .maybeSingle();

    if (userError || !user) {
      return NextResponse.json(
        { ok: false, error: "Usuario no encontrado" },
        { status: 404 },
      );
    }

    const { data: wallet } = await supabase
      .from("wallets")
      .select("usdt_balance")
      .eq("user_id", user.id)
      .maybeSingle();

    const balance = Number(wallet?.usdt_balance ?? 0);
    if (!Number.isFinite(balance) || balance < amount) {
      return NextResponse.json(
        { ok: false, error: "Fondos insuficientes" },
        { status: 400 },
      );
    }

    const { error: insertError } = await supabase.from("transactions").insert({
      type: "withdraw",
      user_id: user.id,
      amount_usdt: -amount,
      status: "pending",
      metadata: {
        address,
        network,
        description: "Retiro a wallet externa",
      },
    });

    if (insertError) {
      return NextResponse.json(
        { ok: false, error: "No se pudo crear solicitud" },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
    return NextResponse.json(
      { ok: false, error: "Error interno" },
      { status: 500 },
    );
  }
}

