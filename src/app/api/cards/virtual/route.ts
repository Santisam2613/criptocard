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

    const { data: user } = await supabase
      .from("users")
      .select("id, telegram_id, telegram_username, telegram_first_name, telegram_last_name")
      .eq("telegram_id", telegramId.toString())
      .maybeSingle();

    if (!user) {
      return NextResponse.json({ ok: false, error: "No encontrado" }, { status: 404 });
    }

    const { data: configRow } = await supabase
      .from("config")
      .select("value")
      .eq("key", "virtual_card_price_usdt")
      .limit(1)
      .maybeSingle();

    const priceRaw = Number((configRow as { value?: string } | null)?.value);
    const priceUsdt = Number.isFinite(priceRaw) && priceRaw > 0 ? priceRaw : 30;

    const { data: card } = await supabase
      .from("cards")
      .select("id, type, status, last_4, expiry_month, expiry_year, brand, currency, metadata")
      .eq("user_id", user.id)
      .eq("type", "virtual")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const cardholderName =
      typeof (card as any)?.metadata?.cardholder_name === "string"
        ? String((card as any).metadata.cardholder_name)
        : [user.telegram_first_name, user.telegram_last_name].filter(Boolean).join(" ").trim() ||
          (user.telegram_username ? `@${user.telegram_username}` : String(user.telegram_id));

    return NextResponse.json(
      {
        ok: true,
        priceUsdt,
        card: card
          ? {
              id: (card as any).id as string,
              status: (card as any).status as string,
              last4: (card as any).last_4 as string | null,
              expiryMonth: (card as any).expiry_month as number | null,
              expiryYear: (card as any).expiry_year as number | null,
              brand: (card as any).brand as string | null,
              currency: (card as any).currency as string | null,
              cardholderName,
            }
          : null,
      },
      { status: 200 },
    );
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
    return NextResponse.json({ ok: false, error: "Error interno" }, { status: 500 });
  }
}

