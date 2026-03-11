import { NextResponse } from "next/server";
import { requireTelegramSession, UnauthorizedError } from "@/lib/auth/requireTelegramSession";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const { telegramId } = requireTelegramSession(req);
    // TODO: Verify admin

    const { searchParams } = new URL(req.url);
    const rawStatus = searchParams.get("status");
    const status = rawStatus === "active" || rawStatus === "frozen" || rawStatus === "blocked"
      ? rawStatus
      : "frozen";

    const supabase = getSupabaseAdminClient();
    const { data: cards, error } = await supabase
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
      .eq("status", status)
      .order("created_at", { ascending: false });

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
      const { telegramId } = await requireTelegramSession(req);
      // Verify admin...
  
      const body = await req.json();
      const { id, last_4, expiry_month, expiry_year, brand, action } = body;
  
      if (!id || action !== "activate") {
        return NextResponse.json({ ok: false, error: "Invalid action" }, { status: 400 });
      }
  
      if (!last_4 || !expiry_month || !expiry_year) {
        return NextResponse.json({ ok: false, error: "Missing card details" }, { status: 400 });
      }
  
      const supabase = getSupabaseAdminClient();
  
      const { error: updateError } = await supabase
        .from("cards")
        .update({
          status: "active",
          last_4,
          expiry_month,
          expiry_year,
          brand: brand || "visa",
          updated_at: new Date().toISOString()
        })
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
