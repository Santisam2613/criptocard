import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireTelegramSession } from "@/lib/auth/requireTelegramSession";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const { telegramId } = requireTelegramSession(req);
    const supabase = getSupabaseAdminClient();

    // Verify admin role
    const { data: user } = await supabase
      .from("users")
      .select("role")
      .eq("telegram_id", telegramId.toString())
      .single();

    if (user?.role !== "admin") {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 403 });
    }

    const { data: withdrawals, error } = await supabase
      .from("transactions")
      .select(`
        *,
        users!user_id (
          telegram_id,
          telegram_username,
          telegram_first_name,
          telegram_last_name,
          telegram_photo_url
        )
      `)
      .eq("type", "withdraw")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching withdrawals:", error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, withdrawals });
  } catch (e) {
    console.error("Error in GET /api/admin/withdrawals:", e);
    return NextResponse.json({ ok: false, error: "Internal Error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { telegramId } = requireTelegramSession(req);
    const body = await req.json();
    const { id, status } = body;

    if (!id || !["completed", "rejected"].includes(status)) {
      return NextResponse.json({ ok: false, error: "Invalid parameters" }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();

    // Verify admin role
    const { data: user } = await supabase
      .from("users")
      .select("role")
      .eq("telegram_id", telegramId.toString())
      .single();

    if (user?.role !== "admin") {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 403 });
    }

    if (status === "completed") {
      // Fetch transaction to check balance
      const { data: tx } = await supabase
        .from("transactions")
        .select("user_id, amount_usdt")
        .eq("id", id)
        .single();

      if (tx) {
        // Get wallet balance
        const { data: wallet } = await supabase
          .from("wallets")
          .select("usdt_balance")
          .eq("user_id", tx.user_id)
          .single();

        const balance = Number(wallet?.usdt_balance ?? 0);
        const amount = Math.abs(Number(tx.amount_usdt)); // Withdrawal amount is negative

        // Check if balance is sufficient
        if (balance < amount) {
          // Automatically reject the withdrawal
          await supabase
            .from("transactions")
            .update({ status: "rejected" })
            .eq("id", id);
            
          return NextResponse.json({ 
            ok: false, 
            error: `Insufficient funds (Balance: ${balance}, Required: ${amount}). Withdrawal has been automatically REJECTED.` 
          }, { status: 400 });
        }
      }
    }

  const { error } = await supabase
      .from("transactions")
      .update({ status })
      .eq("id", id);

    if (error) {
      console.error("Error updating withdrawal:", error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Error in PATCH /api/admin/withdrawals:", e);
    return NextResponse.json({ ok: false, error: "Internal Error" }, { status: 500 });
  }
}
