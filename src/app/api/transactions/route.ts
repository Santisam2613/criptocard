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

    // 1. Obtener ID de usuario
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

    // 2. Obtener transacciones
    const { data: transactions, error: txError } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    if (txError) {
      console.error("Error fetching transactions:", txError);
      return NextResponse.json(
        { ok: false, error: "Error obteniendo historial" },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        ok: true,
        transactions,
      },
      { status: 200 },
    );
  } catch (e) {
    const status = e instanceof UnauthorizedError ? 401 : 500;
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Error interno" },
      { status },
    );
  }
}
