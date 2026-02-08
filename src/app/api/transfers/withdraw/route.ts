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

    const { data, error } = await supabase.rpc("create_withdraw_request", {
      p_sender_telegram_id: telegramId.toString(),
      p_amount_usdt: amount,
      p_address: address,
      p_network: network,
    });

    if (error) {
      const msg = error.message || "No se pudo crear solicitud";
      const looksLikeMissingRpc =
        msg.toLowerCase().includes("could not find the function") ||
        msg.toLowerCase().includes("schema cache") ||
        msg.toLowerCase().includes("pgrst202");

      return NextResponse.json(
        {
          ok: false,
          error: looksLikeMissingRpc
            ? "RPC create_withdraw_request no está instalada. Ejecuta supabase/sql/002_app_config.sql en tu proyecto Supabase."
            : msg,
        },
        { status: 400 },
      );
    }

    return NextResponse.json({ ok: true, request_id: data }, { status: 200 });
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
