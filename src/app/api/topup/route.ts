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
      | { amount_usdt?: number }
      | null;

    const amount = Number(body?.amount_usdt);
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { ok: false, error: "Monto inválido" },
        { status: 400 },
      );
    }

    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase.rpc("create_topup", {
      p_sender_telegram_id: telegramId.toString(),
      p_amount_usdt: amount,
    });

    if (error) {
      const msg = error.message || "No se pudo recargar";
      const looksLikeMissingRpc =
        msg.toLowerCase().includes("could not find the function") ||
        msg.toLowerCase().includes("schema cache") ||
        msg.toLowerCase().includes("pgrst202");

      return NextResponse.json(
        {
          ok: false,
          error: looksLikeMissingRpc
            ? "RPC create_topup no está instalada. Ejecuta supabase/sql/002_app_config.sql en tu proyecto Supabase."
            : msg,
        },
        { status: 400 },
      );
    }

    return NextResponse.json({ ok: true, transaction_id: data }, { status: 200 });
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

