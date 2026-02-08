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
    const { searchParams } = new URL(req.url);
    const raw = (searchParams.get("q") ?? "").trim();
    const q = raw.startsWith("@") ? raw.slice(1) : raw;

    if (!q) {
      return NextResponse.json({ ok: true, users: [] }, { status: 200 });
    }

    const supabase = getSupabaseAdminClient();

    const base = supabase
      .from("users")
      .select(
        "telegram_id, telegram_username, telegram_first_name, telegram_last_name, telegram_photo_url",
      )
      .neq("telegram_id", telegramId.toString())
      .limit(10);

    const isNumeric = /^[0-9]+$/.test(q);

    const { data, error } = isNumeric
      ? await base.eq("telegram_id", q)
      : await base.ilike("telegram_username", `%${q}%`);

    if (error) {
      return NextResponse.json(
        { ok: false, error: "Error buscando usuarios" },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true, users: data ?? [] }, { status: 200 });
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

