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
    const supabase = getSupabaseAdminClient();

    const { data, error } = await supabase.rpc("purchase_virtual_card", {
      p_buyer_telegram_id: telegramId.toString(),
    });

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message || "No se pudo comprar" },
        { status: 400 },
      );
    }

    const row = Array.isArray(data) ? data[0] : data;
    return NextResponse.json({ ok: true, purchase: row }, { status: 200 });
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
    return NextResponse.json({ ok: false, error: "Error interno" }, { status: 500 });
  }
}

