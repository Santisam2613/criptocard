import { NextResponse } from "next/server";
import { requireTelegramSession, UnauthorizedError } from "@/lib/auth/requireTelegramSession";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    requireTelegramSession(req);

    const { searchParams } = new URL(req.url);
    const rawStatus = searchParams.get("status");
    const rawType = searchParams.get("type");
    const status = rawStatus === "active" || rawStatus === "frozen" || rawStatus === "blocked" || rawStatus === "all"
      ? rawStatus
      : "all";
    const type = rawType === "physical" ? "physical" : "virtual";

    const supabase = getSupabaseAdminClient();
    let query = supabase
      .from("cards")
      .select(`
        *,
        users!user_id (
          telegram_id,
          telegram_first_name,
          telegram_last_name,
          telegram_username,
          telegram_photo_url
        )
      `)
      .eq("type", type)
      .order("created_at", { ascending: false });

    if (status !== "all") {
      query = query.eq("status", status);
    }

    const { data: cards, error } = await query;

    if (error) {
      console.error("Error fetching admin cards:", error);
      return NextResponse.json({ ok: false, error: "DB Error" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, cards });
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ ok: false, error: "Internal Error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    requireTelegramSession(req);

    const body = await req.json();
    const {
      id,
      last_4,
      expiry_month,
      expiry_year,
      brand,
      action,
      status,
      card_number,
      cvc,
      cardholder_name,
    } = body as {
      id?: string;
      last_4?: string;
      expiry_month?: number;
      expiry_year?: number;
      brand?: string;
      action?: string;
      status?: "active" | "frozen" | "blocked";
      card_number?: string;
      cvc?: string;
      cardholder_name?: string;
    };

    if (!id) {
      return NextResponse.json({ ok: false, error: "Invalid card id" }, { status: 400 });
    }

    const targetStatus =
      status === "active" || status === "frozen" || status === "blocked"
        ? status
        : action === "activate"
          ? "active"
          : undefined;

    const panDigits = typeof card_number === "string" ? card_number.replace(/\D+/g, "") : "";
    const resolvedLast4 =
      panDigits.length >= 4 ? panDigits.slice(-4) : typeof last_4 === "string" ? last_4 : "";

    const supabase = getSupabaseAdminClient();

    const { data: currentCard, error: currentCardError } = await supabase
      .from("cards")
      .select("metadata")
      .eq("id", id)
      .single();

    if (currentCardError || !currentCard) {
      return NextResponse.json({ ok: false, error: "Card not found" }, { status: 404 });
    }

    const currentMetadata = ((currentCard as { metadata?: Record<string, unknown> }).metadata ?? {}) as Record<string, unknown>;
    const nextMetadata: Record<string, unknown> = { ...currentMetadata };

    if (panDigits) nextMetadata.card_number = panDigits;
    if (typeof cvc === "string" && cvc.trim()) nextMetadata.cvc = cvc.trim();
    if (typeof cardholder_name === "string" && cardholder_name.trim()) {
      nextMetadata.cardholder_name = cardholder_name.trim();
    }

    const updatePayload: Record<string, unknown> = {
      metadata: nextMetadata,
      updated_at: new Date().toISOString(),
    };

    if (resolvedLast4) updatePayload.last_4 = resolvedLast4;
    if (Number.isFinite(Number(expiry_month))) updatePayload.expiry_month = Number(expiry_month);
    if (Number.isFinite(Number(expiry_year))) updatePayload.expiry_year = Number(expiry_year);
    if (typeof brand === "string" && brand.trim()) updatePayload.brand = brand.trim().toLowerCase();
    if (targetStatus) updatePayload.status = targetStatus;

    const { error: updateError } = await supabase
      .from("cards")
      .update(updatePayload)
      .eq("id", id);

    if (updateError) {
      return NextResponse.json({ ok: false, error: "Update failed" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ ok: false, error: "Internal Error" }, { status: 500 });
  }
}
