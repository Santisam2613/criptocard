import { NextResponse } from "next/server";

import { requireTelegramSession, UnauthorizedError } from "@/lib/auth/requireTelegramSession";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const { telegramId } = requireTelegramSession(req);
    // TODO: Verify if telegramId is actually an admin
    
    const { searchParams } = new URL(req.url);
    const typeFilter = searchParams.get("type"); // 'withdrawal' | 'topup_manual' | null

    const supabase = getSupabaseAdminClient();

    let query = supabase
      .from("transactions")
      .select(`
        id,
        created_at,
        amount_usdt,
        status,
        type,
        metadata,
        users (
          telegram_id,
          telegram_username,
          telegram_first_name,
          telegram_last_name,
          telegram_photo_url
        )
      `)
      .order("created_at", { ascending: false })
      .limit(50);

    if (typeFilter && ["withdrawal", "topup_manual"].includes(typeFilter)) {
      query = query.eq("type", typeFilter);
    } else {
      query = query.in("type", ["withdrawal", "topup_manual"]);
    }

    const { data: txs, error } = await query;

    if (error) {
      console.error("Error fetching admin transactions:", error);
      return NextResponse.json({ ok: false, error: "DB Error" }, { status: 500 });
    }

    // Add logging to debug
    console.log(`Fetched ${txs?.length} transactions. Filter: ${typeFilter || "all"}`);
    
    return NextResponse.json({ ok: true, transactions: txs });
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      // In development, allow bypass if needed, or just return 401
      // return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
      
      // TEMPORARY FIX: If we are in admin panel via browser, we might not have initData.
      // For now, let's log and return 401, but the frontend should handle it.
      console.warn("Unauthorized admin access attempt:", e);
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    console.error("Admin API error:", e);
    return NextResponse.json({ ok: false, error: "Internal Error" }, { status: 500 });
  }
}

import { processFirstTopup } from "@/lib/transactions/processFirstTopup";

export async function PATCH(req: Request) {
  try {
    const { telegramId } = await requireTelegramSession(req);
    // Verificar rol admin aquí...

    const body = await req.json();
    const { id, status, rejection_reason } = body;

    if (!id || !["completed", "rejected"].includes(status)) {
      return NextResponse.json({ ok: false, error: "Invalid data" }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();

    // Obtener transacción original
    const { data: tx } = await supabase
      .from("transactions")
      .select("status, type, amount_usdt, user_id, metadata")
      .eq("id", id)
      .single();

    if (!tx) {
      return NextResponse.json({ ok: false, error: "Transaction not found" }, { status: 404 });
    }

    if (tx.status !== "pending") {
      return NextResponse.json({ ok: false, error: "Transaction already processed" }, { status: 400 });
    }

    // Actualizar estado
    const metadata = (tx.metadata as Record<string, any>) || {};
    const { error: updateError } = await supabase
      .from("transactions")
      .update({
        status,
        metadata: rejection_reason 
          ? { ...metadata, rejection_reason, admin_processed_at: new Date().toISOString() }
          : { ...metadata, admin_processed_at: new Date().toISOString() }
      })
      .eq("id", id);

    if (updateError) {
      return NextResponse.json({ ok: false, error: "Update failed" }, { status: 500 });
    }

    if (status === "completed" && tx.type === "topup_manual") {
      // Auto-purchase virtual card if first topup
      processFirstTopup(supabase, tx.user_id, Number(tx.amount_usdt)).catch(console.error);
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ ok: false, error: "Internal Error" }, { status: 500 });
  }
}
