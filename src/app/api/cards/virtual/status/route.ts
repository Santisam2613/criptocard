import { NextResponse } from "next/server";

import {
  UnauthorizedError,
  requireTelegramSession,
} from "@/lib/auth/requireTelegramSession";
import { stripeService } from "@/lib/stripe/issuing";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type Body = { action?: "freeze" | "unfreeze" };

export async function POST(req: Request) {
  try {
    const { telegramId } = requireTelegramSession(req);
    const body = (await req.json().catch(() => null)) as Body | null;
    const action = body?.action;

    if (action !== "freeze" && action !== "unfreeze") {
      return NextResponse.json(
        { ok: false, error: "Acción inválida" },
        { status: 400 },
      );
    }

    const supabase = getSupabaseAdminClient();

    const { data: user } = await supabase
      .from("users")
      .select("id")
      .eq("telegram_id", telegramId.toString())
      .single();

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Usuario no encontrado" },
        { status: 404 },
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
        { status: 404 },
      );
    }

    if (!card.provider_card_id) {
      return NextResponse.json(
        { ok: false, error: "Tarjeta no sincronizada con proveedor" },
        { status: 409 },
      );
    }

    if (card.status === "blocked") {
      return NextResponse.json(
        { ok: false, error: "Tarjeta bloqueada" },
        { status: 400 },
      );
    }

    const targetStripeStatus = action === "freeze" ? "inactive" : "active";
    const targetLocalStatus = action === "freeze" ? "frozen" : "active";

    await stripeService.updateIssuingCardStatus(card.provider_card_id, targetStripeStatus);

    const { data: updated, error: updateError } = await supabase
      .from("cards")
      .update({ status: targetLocalStatus })
      .eq("id", card.id)
      .select("id, status")
      .single();

    if (updateError || !updated) {
      return NextResponse.json(
        { ok: false, error: "No se pudo actualizar la tarjeta" },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { ok: true, card: { id: updated.id, status: updated.status } },
      { status: 200 },
    );
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
    console.error(e);
    return NextResponse.json({ ok: false, error: "Error interno" }, { status: 500 });
  }
}

