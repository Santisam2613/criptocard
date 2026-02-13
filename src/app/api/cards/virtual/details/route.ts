import { NextResponse } from "next/server";

import {
  UnauthorizedError,
  requireTelegramSession,
} from "@/lib/auth/requireTelegramSession";
import { stripeService } from "@/lib/stripe/issuing";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const { telegramId } = requireTelegramSession(req);
    const supabase = getSupabaseAdminClient();

    const { data: user } = await supabase
      .from("users")
      .select("id")
      .eq("telegram_id", telegramId.toString())
      .single();

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Usuario no encontrado" },
        { status: 404, headers: { "cache-control": "no-store" } },
      );
    }

    const { data: card } = await supabase
      .from("cards")
      .select("id, status, provider_card_id")
      .eq("user_id", user.id)
      .eq("type", "virtual")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!card) {
      return NextResponse.json(
        { ok: false, error: "Tarjeta no encontrada" },
        { status: 404, headers: { "cache-control": "no-store" } },
      );
    }

    if (card.status === "blocked") {
      return NextResponse.json(
        { ok: false, error: "Tarjeta bloqueada" },
        { status: 400, headers: { "cache-control": "no-store" } },
      );
    }

    if (!card.provider_card_id) {
      return NextResponse.json(
        { ok: false, error: "Tarjeta no sincronizada con proveedor" },
        { status: 409, headers: { "cache-control": "no-store" } },
      );
    }

    const details = await stripeService.getIssuingCardSensitiveDetails(card.provider_card_id);

    return NextResponse.json(
      {
        ok: true,
        number: details.number,
        cvc: details.cvc,
        expMonth: details.expMonth,
        expYear: details.expYear,
        last4: details.last4,
      },
      { status: 200, headers: { "cache-control": "no-store" } },
    );
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      return NextResponse.json(
        { ok: false },
        { status: 401, headers: { "cache-control": "no-store" } },
      );
    }
    console.error(e);
    return NextResponse.json(
      { ok: false, error: "Error interno" },
      { status: 500, headers: { "cache-control": "no-store" } },
    );
  }
}
