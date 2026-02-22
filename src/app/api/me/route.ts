import { NextResponse } from "next/server";

import {
  UnauthorizedError,
  requireTelegramSession,
} from "@/lib/auth/requireTelegramSession";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const { telegramId } = requireTelegramSession(req);
    const supabase = getSupabaseAdminClient();

    // 1. Consultar usuario básico
    const { data: user, error: userError } = await supabase
      .from("users")
      .select(
        "id, telegram_id, telegram_username, telegram_first_name, telegram_last_name, telegram_photo_url, sumsub_applicant_id, verification_status, verification_completed, verified_at, role",
      )
      .eq("telegram_id", telegramId.toString())
      .maybeSingle();

    if (userError) {
      console.error("Error fetching user:", userError);
      return NextResponse.json(
        { ok: false, error: "Error consultando usuario" },
        { status: 500 },
      );
    }

    if (!user) {
      return NextResponse.json({ ok: false, error: "No encontrado" }, { status: 404 });
    }

    // 2. Consultar wallet explícitamente usando el ID del usuario
    // Esto evita problemas si la relación (join) no está detectada correctamente
    const { data: wallet, error: walletError } = await supabase
      .from("wallets")
      .select("usdt_balance")
      .eq("user_id", user.id)
      .maybeSingle();

    if (walletError) {
      console.warn("Error fetching wallet (defaulting to 0):", walletError);
    }

    const balance_usdt = wallet?.usdt_balance ?? 0;

    const userData = {
      ...user,
      balance_usdt: Number(balance_usdt),
    };

    return NextResponse.json(
      {
        ok: true,
        user: userData,
      },
      { status: 200 },
    );
  } catch (e) {
    const status = e instanceof UnauthorizedError ? 401 : 500;
    const message = e instanceof Error ? e.message : "Error interno";
    console.error("API /me error:", e);
    return NextResponse.json(
      status === 401 ? { ok: false } : { ok: false, error: message },
      { status },
    );
  }
}
