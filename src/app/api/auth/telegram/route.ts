import { NextResponse } from "next/server";

import { createTelegramSessionToken } from "@/lib/auth/session";
import {
  TelegramInitDataError,
  validateTelegramInitData,
} from "@/lib/auth/telegramInitData";
import { getEnv } from "@/lib/env";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

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
  const env = getEnv();
  const initData = await getInitDataFromRequest(req);

  try {
    const validated = validateTelegramInitData({
      initData,
      botToken: env.telegramBotToken,
      maxAgeSeconds: env.telegramInitDataMaxAgeSeconds,
    });

    const supabase = getSupabaseAdminClient();
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
      ttlSeconds: env.sessionTtlSeconds,
      secret: env.sessionSecret,
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
      maxAge: env.sessionTtlSeconds,
    });

    return res;
  } catch (e) {
    const message =
      e instanceof TelegramInitDataError ? e.message : "initData inválido";
    return NextResponse.json({ ok: false, error: message }, { status: 401 });
  }
}
