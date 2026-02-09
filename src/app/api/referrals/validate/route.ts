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

    const normalized = inviter.startsWith("@") ? inviter.slice(1) : inviter;
    const isTelegramId = /^\d+$/.test(normalized);
    const isUsername = /^[a-zA-Z0-9_]{5,32}$/.test(normalized);
    if (!isTelegramId && !isUsername) {
      return NextResponse.json(
        { ok: false, error: "Ingresa un @username válido o el telegram_id numérico." },
        { status: 400 },
      );
    }

    const supabase = getSupabaseAdminClient();

    const { data: me } = await supabase
      .from("users")
      .select("id")
      .eq("telegram_id", telegramId.toString())
      .maybeSingle();

    if (!me?.id) {
      return NextResponse.json(
        { ok: false, error: "Usuario no encontrado" },
        { status: 404 },
      );
    }

    const { data: topupProbe } = await supabase
      .from("transactions")
      .select("id")
      .eq("user_id", me.id)
      .eq("type", "topup")
      .eq("status", "completed")
      .gt("amount_usdt", 0)
      .limit(1)
      .maybeSingle();

    if (topupProbe?.id) {
      return NextResponse.json(
        { ok: false, error: "No puedes asociar un invitador después de tu primera recarga." },
        { status: 400 },
      );
    }

    const { data, error } = await supabase.rpc("referral_set_inviter", {
      p_referred_telegram_id: telegramId.toString(),
      p_referrer_identifier: normalized,
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
