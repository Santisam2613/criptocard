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
    const { data, error } = await supabase
      .from("users")
      .select(
        "id, telegram_id, telegram_username, telegram_first_name, telegram_last_name, telegram_photo_url, sumsub_applicant_id, verification_status, verification_completed, verified_at",
      )
      .eq("telegram_id", telegramId.toString())
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { ok: false, error: "Error consultando usuario" },
        { status: 500 },
      );
    }

    if (!data) {
      return NextResponse.json({ ok: false, error: "No encontrado" }, { status: 404 });
    }

    return NextResponse.json(
      {
        ok: true,
        user: data,
      },
      { status: 200 },
    );
  } catch (e) {
    const status = e instanceof UnauthorizedError ? 401 : 500;
    const message = e instanceof Error ? e.message : "Error interno";
    return NextResponse.json(
      status === 401 ? { ok: false } : { ok: false, error: message },
      { status },
    );
  }
}
