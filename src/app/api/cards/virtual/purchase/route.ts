import { NextResponse } from "next/server";

import {
  UnauthorizedError,
  requireTelegramSession,
} from "@/lib/auth/requireTelegramSession";
import { stripeService } from "@/lib/stripe/issuing";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getApplicantDetails } from "@/lib/sumsub/client";
import { getServerCredentials } from "@/config/credentials";

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

    if (user.verification_status !== "approved") {
      return NextResponse.json(
        { ok: false, error: "Debes completar la verificación para comprar la tarjeta" },
        { status: 403 },
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

    function pickString(obj: Record<string, unknown>, keys: string[]): string | null {
      for (const key of keys) {
        const v = obj[key];
        if (typeof v === "string" && v.trim()) return v.trim();
      }
      return null;
    }

    function pickObject(obj: Record<string, unknown>, keys: string[]): Record<string, unknown> | null {
      for (const key of keys) {
        const v = obj[key];
        if (v && typeof v === "object" && !Array.isArray(v)) return v as Record<string, unknown>;
      }
      return null;
    }

    function parseDob(dobRaw: string | null): { day: number; month: number; year: number } | null {
      if (!dobRaw) return null;
      const s = dobRaw.trim();
      const parts = s.includes("-") ? s.split("-") : s.includes("/") ? s.split("/") : [];
      if (parts.length !== 3) return null;
      const [a, b, c] = parts.map((x) => Number(x));
      if (![a, b, c].every((n) => Number.isFinite(n))) return null;
      const year = a > 31 ? a : c;
      const month = a > 31 ? b : b;
      const day = a > 31 ? c : a;
      if (year < 1900 || year > 2100) return null;
      if (month < 1 || month > 12) return null;
      if (day < 1 || day > 31) return null;
      return { day, month, year };
    }

    // 2.1 Obtener datos reales del KYC (Sumsub)
    const applicantId = (user.sumsub_applicant_id as string | null) ?? null;
    if (!applicantId) {
      return NextResponse.json(
        { ok: false, error: "KYC no encontrado para el usuario" },
        { status: 400 },
      );
    }
    const applicant = await getApplicantDetails(applicantId);
    const info =
      ((applicant.info ?? applicant.fixedInfo ?? {}) as Record<string, unknown>) ?? {};

    const kycFirstName =
      pickString(info, ["firstName", "first_name", "givenName", "given_name"]) ??
      (user.telegram_first_name as string | null) ??
      "";
    const kycLastName =
      pickString(info, ["lastName", "last_name", "familyName", "family_name"]) ??
      (user.telegram_last_name as string | null) ??
      "";
    const dob =
      parseDob(pickString(info, ["dob", "dateOfBirth", "birthDate", "birth_date"])) ?? null;

    const address =
      pickObject(info, ["address", "residenceAddress", "residence_address", "registeredAddress"]) ??
      (() => {
        const arr = info["addresses"];
        if (Array.isArray(arr) && arr[0] && typeof arr[0] === "object" && !Array.isArray(arr[0])) {
          return arr[0] as Record<string, unknown>;
        }
        return null;
      })();

    const country =
      (address ? pickString(address, ["country", "countryCode", "country_code"]) : null) ??
      pickString(info, ["country", "nationality", "residenceCountry", "residence_country"]) ??
      null;
    const line1 =
      (address
        ? pickString(address, ["line1", "street", "streetAddress", "street_address", "addressLine1"])
        : null) ?? null;
    const city = (address ? pickString(address, ["city", "town"]) : null) ?? null;
    const state = (address ? pickString(address, ["state", "region", "province"]) : null) ?? null;
    const postalCode =
      (address ? pickString(address, ["postal_code", "postalCode", "postCode", "zip"]) : null) ?? null;

    if (!dob) {
      return NextResponse.json(
        { ok: false, error: "KYC incompleto: falta fecha de nacimiento" },
        { status: 400 },
      );
    }
    if (!country) {
      return NextResponse.json(
        { ok: false, error: "KYC incompleto: falta país" },
        { status: 400 },
      );
    }

    const rawCountry = country.toUpperCase();
    const iso3ToIso2: Record<string, string> = {
      USA: "US",
      MEX: "MX",
      CAN: "CA",
      COL: "CO",
      ESP: "ES",
      ARG: "AR",
      BRA: "BR",
      CHL: "CL",
      PER: "PE",
    };
    const normalizedCountry =
      rawCountry.length === 3 ? (iso3ToIso2[rawCountry] ?? rawCountry) : rawCountry;
    const fallbackPostalCode = normalizedCountry === "US" ? "94111" : "00000";

    const creds = getServerCredentials();
    const testForceCountryRaw = (creds.stripe?.issuingTestForceCountry ?? "").trim();
    const stripeKey = creds.stripe?.secretKey ?? "";
    const isTestKey = stripeKey.startsWith("sk_live");
    const testForceCountry = testForceCountryRaw ? testForceCountryRaw.toUpperCase() : "";

    const effectiveCountry =
      isTestKey && testForceCountry ? testForceCountry : normalizedCountry;

    const issuingAllowedCountries = creds.stripe?.issuingAllowedCountries ?? ["US"];
    if (!issuingAllowedCountries.includes(effectiveCountry)) {
      return NextResponse.json(
        {
          ok: false,
          error: `Por ahora no podemos emitir tarjetas para el país  ${effectiveCountry}.`,
        },
        { status: 400 },
      );
    }

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
        firstName: kycFirstName,
        lastName: kycLastName,
        termsAcceptance: { ip, date: termsDate },
        billingAddress: {
          country: effectiveCountry,
          line1: line1 ?? "KYC Verified",
          city: city ?? "City",
          state: state ?? (effectiveCountry === "US" ? "CA" : undefined),
          postalCode: postalCode ?? fallbackPostalCode,
        },
        dob,
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
        [kycFirstName, kycLastName].filter(Boolean).join(" ") ||
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
      const err = stripeError as {
        message?: string;
        type?: string;
        code?: string;
        requestId?: string;
        raw?: { message?: string; type?: string; code?: string; requestId?: string };
      };
      const providerMessage =
        err?.raw?.message ?? err?.message ?? "Error emitiendo tarjeta en el proveedor";
      const providerType = err?.raw?.type ?? err?.type ?? null;
      const providerCode = err?.raw?.code ?? err?.code ?? null;
      const providerRequestId = err?.raw?.requestId ?? err?.requestId ?? null;

      console.error("Error en Stripe:", {
        message: providerMessage,
        type: providerType,
        code: providerCode,
        requestId: providerRequestId,
      });
      // Rollback: Devolver el dinero si falla Stripe
      await supabase.rpc("refund_balance_for_card", {
        p_user_id: user.id,
        p_amount: price,
      });
      return NextResponse.json(
        {
          ok: false,
          error: providerMessage,
          provider: {
            type: providerType,
            code: providerCode,
            requestId: providerRequestId,
          },
        },
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
