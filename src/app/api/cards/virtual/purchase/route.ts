import { NextResponse } from "next/server";

import {
  UnauthorizedError,
  requireTelegramSession,
} from "@/lib/auth/requireTelegramSession";
import { stripeService } from "@/lib/stripe/issuing";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { telegramId } = requireTelegramSession(req);
    const supabase = getSupabaseAdminClient();

    const forwardedFor = req.headers.get("x-forwarded-for") ?? "";
    const ip = forwardedFor.split(",")[0]?.trim() || "127.0.0.1";
    const termsDate = Math.floor(Date.now() / 1000);

    // 0. Obtener usuario desde DB
    const { data: user } = await supabase
      .from("users")
      .select("*")
      .eq("telegram_id", telegramId.toString())
      .single();

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Usuario no encontrado" },
        { status: 404 },
      );
    }

    // 1. Verificar si ya tiene tarjeta activa (Regla de negocio)
    const { data: existingCard } = await supabase
      .from("cards")
      .select("id")
      .eq("user_id", user.id)
      .eq("type", "virtual")
      .eq("status", "active")
      .maybeSingle();

    if (existingCard) {
      return NextResponse.json(
        { ok: false, error: "Ya tienes una tarjeta activa" },
        { status: 400 },
      );
    }

    // 2. Obtener precio de la configuración (o default 30 USDT)
    const { data: configRow } = await supabase
      .from("config")
      .select("value")
      .eq("key", "virtual_card_price_usdt")
      .limit(1)
      .maybeSingle();

    const priceRaw = Number((configRow as { value?: string } | null)?.value);
    const price = Number.isFinite(priceRaw) && priceRaw > 0 ? priceRaw : 30;

    // 3. Verificar saldo y cobrar (RPC atómico)
    const { error: txError } = await supabase.rpc("deduct_balance_for_card", {
      p_user_id: user.id,
      p_amount: price,
    });

    if (txError) {
      console.error("Error deduciendo saldo:", txError);
      return NextResponse.json(
        { ok: false, error: txError.message || "Saldo insuficiente" },
        { status: 400 },
      );
    }

    try {
      // 4. Crear Cardholder en Stripe
      const cardholderId = await stripeService.getOrCreateCardholder({
        id: user.id,
        stripeCardholderId: user.stripe_cardholder_id,
        firstName: user.telegram_first_name || "",
        lastName: user.telegram_last_name || "",
        termsAcceptance: { ip, date: termsDate },
        // TODO: En producción, usar email/phone reales de la DB o KYC
      });

      // Guardar cardholder_id si es nuevo o cambió
      if (cardholderId !== user.stripe_cardholder_id) {
        await supabase
          .from("users")
          .update({ stripe_cardholder_id: cardholderId })
          .eq("id", user.id);
      }

      // 5. Emitir Tarjeta en Stripe
      const stripeCard = await stripeService.createVirtualCard(cardholderId);

      // Nombre del titular para mostrar en UI
      const cardholderName =
        (stripeCard.metadata?.cardholder_name as string) ||
        [user.telegram_first_name, user.telegram_last_name].filter(Boolean).join(" ") ||
        "Criptocard User";

      // 6. Guardar Tarjeta en Supabase
      const { data: localCard, error: dbError } = await supabase
        .from("cards")
        .insert({
          user_id: user.id,
          type: "virtual",
          status: "active",
          provider_card_id: stripeCard.id,
          last_4: stripeCard.last4,
          expiry_month: stripeCard.exp_month,
          expiry_year: stripeCard.exp_year,
          brand: stripeCard.brand,
          currency: stripeCard.currency.toUpperCase(),
          metadata: {
            stripe_cardholder_id: cardholderId,
            cardholder_name: cardholderName, // Importante para la UI
          },
        })
        .select()
        .single();

      if (dbError) {
        throw new Error(`Error guardando tarjeta en DB: ${dbError.message}`);
      }

      return NextResponse.json({ ok: true, purchase: localCard }, { status: 200 });
    } catch (stripeError) {
      console.error("Error en Stripe:", stripeError);
      // Rollback: Devolver el dinero si falla Stripe
      await supabase.rpc("refund_balance_for_card", {
        p_user_id: user.id,
        p_amount: price,
      });
      return NextResponse.json(
        { ok: false, error: "Error emitiendo tarjeta en el proveedor" },
        { status: 500 },
      );
    }
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
    console.error(e);
    return NextResponse.json(
      { ok: false, error: "Error interno procesando solicitud" },
      { status: 500 },
    );
  }
}
