import { NextResponse } from "next/server";

import { createTelegramSessionToken } from "@/lib/auth/session";
import {
  TelegramInitDataError,
  validateTelegramInitData,
} from "@/lib/auth/telegramInitData";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getServerCredentials } from "@/config/credentials";

export const runtime = "nodejs";

function getInitDataFromRequest(req: Request): Promise<string> | string {
  const auth = req.headers.get("authorization") ?? "";
  if (auth.toLowerCase().startsWith("tma ")) return auth.slice(4);
  return req
    .json()
    .then((b: unknown) => (b as { initData?: string } | null)?.initData ?? "")
    .catch(() => "");
}

export async function POST(req: Request) {
  let creds: ReturnType<typeof getServerCredentials>;
  try {
    creds = getServerCredentials();
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error interno";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
  if (!creds.telegram.botToken) {
    return NextResponse.json(
      { ok: false, error: "TELEGRAM_BOT_TOKEN no configurado" },
      { status: 500 },
    );
  }
  const initData = await getInitDataFromRequest(req);

  try {
    const validated = validateTelegramInitData({
      initData,
      botToken: creds.telegram.botToken,
      maxAgeSeconds: creds.telegram.initDataMaxAgeSeconds,
    });

    let supabase: ReturnType<typeof getSupabaseAdminClient>;
    try {
      supabase = getSupabaseAdminClient();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Supabase no configurado";
      return NextResponse.json({ ok: false, error: message }, { status: 500 });
    }
    await supabase.from("telegram_initdata_replays").upsert(
      {
        telegram_id: validated.telegramId.toString(),
        init_data_hash: validated.hash,
        auth_date: validated.authDate,
      },
      { onConflict: "telegram_id,init_data_hash" },
    );

    const { data: userRow, error: upsertError } = await supabase
      .from("users")
      .upsert(
        {
          telegram_id: validated.telegramId.toString(),
          telegram_username: validated.user.username ?? null,
          telegram_first_name: validated.user.first_name ?? null,
          telegram_last_name: validated.user.last_name ?? null,
          telegram_photo_url: validated.user.photo_url ?? null,
        },
        { onConflict: "telegram_id" },
      )
      .select(
        "id, telegram_id, verification_status, verification_completed, verified_at, sumsub_applicant_id",
      )
      .single();

    if (upsertError) {
      return NextResponse.json(
        { ok: false, error: "No se pudo crear/actualizar el usuario" },
        { status: 500 },
      );
    }

    const sessionToken = createTelegramSessionToken({
      telegramId: validated.telegramId,
      ttlSeconds: creds.app.sessionTtlSeconds,
      secret: creds.app.sessionSecret,
    });

    const res = NextResponse.json(
      {
        ok: true,
        telegram_id: validated.telegramId.toString(),
        user_id: userRow.id,
        verification_status: userRow.verification_status,
        verification_completed: userRow.verification_completed,
        verified_at: userRow.verified_at,
        sumsub_applicant_id: userRow.sumsub_applicant_id,
        user: {
          id: validated.user.id,
          username: validated.user.username ?? null,
          first_name: validated.user.first_name ?? null,
          last_name: validated.user.last_name ?? null,
          photo_url: validated.user.photo_url ?? null,
        },
      },
      { status: 200 },
    );

    res.cookies.set({
      name: "cc_session",
      value: sessionToken,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: creds.app.sessionTtlSeconds,
    });

    return res;
  } catch (e) {
    const message =
      e instanceof TelegramInitDataError ? e.message : "initData inválido";
    return NextResponse.json({ ok: false, error: message }, { status: 401 });
  }
}
