import { NextResponse } from "next/server";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET() {
  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("config")
      .select("value")
      .eq("key", "min_withdrawal_usdt")
      .limit(1)
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { ok: false, error: "Error consultando configuración" },
        { status: 500 },
      );
    }

    const raw = (data as { value?: string } | null)?.value ?? null;
    const parsed = Number(raw);
    const minWithdrawalUsdt = Number.isFinite(parsed) && parsed > 0 ? parsed : 0;

    return NextResponse.json(
      { ok: true, minWithdrawalUsdt },
      { status: 200 },
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error interno";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

