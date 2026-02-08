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
      | { recipient_telegram_id?: string; amount_usdt?: number }
      | null;

    const recipientTelegramId = (body?.recipient_telegram_id ?? "").trim();
    const amount = Number(body?.amount_usdt);

    if (!recipientTelegramId || !/^[0-9]+$/.test(recipientTelegramId)) {
      return NextResponse.json(
        { ok: false, error: "Destinatario inválido" },
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

    const { data, error } = await supabase.rpc("create_internal_transfer", {
      p_sender_telegram_id: telegramId,
      p_recipient_telegram_id: BigInt(recipientTelegramId),
      p_amount_usdt: amount,
    });

    if (error) {
      const msg = error.message || "No se pudo transferir";
      return NextResponse.json({ ok: false, error: msg }, { status: 400 });
    }

    return NextResponse.json(
      { ok: true, transfer_group_id: data },
      { status: 200 },
    );
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

