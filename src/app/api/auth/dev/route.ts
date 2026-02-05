import { NextResponse } from "next/server";

import { createTelegramSessionToken } from "@/lib/auth/session";
import { getServerCredentials } from "@/config/credentials";

export const runtime = "nodejs";

export async function POST() {
  let creds: ReturnType<typeof getServerCredentials>;
  try {
    creds = getServerCredentials();
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error interno";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }

  if (!creds.dev.bypassAuth) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  const telegramIdStr = creds.dev.telegramId ?? "";
  if (!telegramIdStr) {
    return NextResponse.json(
      { ok: false, error: "DEV_TELEGRAM_ID no configurado" },
      { status: 500 },
    );
  }

  const token = createTelegramSessionToken({
    telegramId: BigInt(telegramIdStr),
    ttlSeconds: creds.app.sessionTtlSeconds,
    secret: creds.app.sessionSecret,
  });

  const res = NextResponse.json({ ok: true, telegram_id: telegramIdStr }, { status: 200 });
  res.cookies.set({
    name: "cc_session",
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
    maxAge: creds.app.sessionTtlSeconds,
  });
  return res;
}
