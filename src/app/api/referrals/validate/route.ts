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
      | { inviter?: string }
      | null;

    const inviter = String(body?.inviter ?? "").trim();
    if (!inviter) {
      return NextResponse.json(
        { ok: false, error: "ID de referido inválido" },
        { status: 400 },
      );
    }

    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase.rpc("referral_set_inviter", {
      p_referred_telegram_id: telegramId.toString(),
      p_referrer_identifier: inviter,
    });

    if (error) {
      const msg = error.message || "No se pudo validar el referido";
      const looksLikeMissingRpc =
        msg.toLowerCase().includes("could not find the function") ||
        msg.toLowerCase().includes("schema cache") ||
        msg.toLowerCase().includes("pgrst202");
      return NextResponse.json(
        {
          ok: false,
          error: looksLikeMissingRpc
            ? "RPC referral_set_inviter no está instalada. Ejecuta supabase/sql/002_app_config.sql en tu proyecto Supabase."
            : msg,
        },
        { status: 400 },
      );
    }

    const row = Array.isArray(data) ? data[0] : data;
    return NextResponse.json(
      {
        ok: true,
        referral: row ?? null,
      },
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

