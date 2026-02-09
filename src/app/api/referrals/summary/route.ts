import { NextResponse } from "next/server";

import {
  UnauthorizedError,
  requireTelegramSession,
} from "@/lib/auth/requireTelegramSession";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type ReferralRow = {
  id: string;
  status: "pending" | "eligible" | "claimed";
  reward_amount_usdt: number;
  referred: {
    telegram_id: string;
    telegram_username: string | null;
    telegram_first_name: string | null;
    telegram_last_name: string | null;
  } | null;
  created_at: string;
};

type ReferralRowRaw = Omit<ReferralRow, "referred" | "reward_amount_usdt"> & {
  reward_amount_usdt: unknown;
  referred:
    | {
        telegram_id: string;
        telegram_username: string | null;
        telegram_first_name: string | null;
        telegram_last_name: string | null;
      }
    | Array<{
        telegram_id: string;
        telegram_username: string | null;
        telegram_first_name: string | null;
        telegram_last_name: string | null;
      }>
    | null;
};

type MyReferrerRow = {
  status: "pending" | "eligible" | "claimed";
  referrer: {
    telegram_id: string;
    telegram_username: string | null;
    telegram_first_name: string | null;
    telegram_last_name: string | null;
  } | null;
} | null;

export async function GET(req: Request) {
  try {
    const { telegramId } = requireTelegramSession(req);
    const supabase = getSupabaseAdminClient();

    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("telegram_id", telegramId.toString())
      .maybeSingle();

    if (userError || !user) {
      return NextResponse.json(
        { ok: false, error: "Usuario no encontrado" },
        { status: 404 },
      );
    }

    const { data: configRow } = await supabase
      .from("config")
      .select("value")
      .eq("key", "diamond_to_usdt_rate")
      .maybeSingle();

    const diamondToUsdtRateRaw = Number(configRow?.value);
    const diamondToUsdtRate = Number.isFinite(diamondToUsdtRateRaw) && diamondToUsdtRateRaw > 0
      ? diamondToUsdtRateRaw
      : 0.01;

    try {
      await supabase.rpc("referral_refresh_eligibility", {
        p_referrer_telegram_id: telegramId.toString(),
      });
    } catch {}

    const { data: referrals, error: refError } = await supabase
      .from("referrals")
      .select(
        "id, status, reward_amount_usdt, created_at, referred:referred_user_id(telegram_id, telegram_username, telegram_first_name, telegram_last_name)",
      )
      .eq("referrer_user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (refError) {
      return NextResponse.json(
        { ok: false, error: "Error consultando referidos" },
        { status: 500 },
      );
    }

    const { data: myReferrer, error: myReferrerError } = await supabase
      .from("referrals")
      .select(
        "status, referrer:referrer_user_id(telegram_id, telegram_username, telegram_first_name, telegram_last_name)",
      )
      .eq("referred_user_id", user.id)
      .maybeSingle();

    if (myReferrerError) {
      return NextResponse.json(
        { ok: false, error: "Error consultando invitador" },
        { status: 500 },
      );
    }

    const safeReferrals: ReferralRow[] = (referrals ?? []).map((r) => {
      const row = r as ReferralRowRaw;
      const referred = Array.isArray(row.referred)
        ? (row.referred[0] ?? null)
        : row.referred;
      return {
        id: String(row.id),
        status: row.status,
        reward_amount_usdt: Number(row.reward_amount_usdt ?? 0),
        created_at: String(row.created_at),
        referred: referred ?? null,
      };
    });

    const totals = safeReferrals.reduce(
      (acc, r) => {
        acc.total += 1;
        if (r.status === "pending") acc.pending += 1;
        if (r.status === "eligible") acc.eligible += 1;
        if (r.status === "claimed") acc.claimed += 1;
        return acc;
      },
      { total: 0, pending: 0, eligible: 0, claimed: 0 },
    );

    return NextResponse.json(
      {
        ok: true,
        summary: {
          counts: totals,
          diamond_to_usdt_rate: diamondToUsdtRate,
          my_referrer:
            (myReferrer
              ? {
                  status: (myReferrer as any).status,
                  referrer: Array.isArray((myReferrer as any).referrer)
                    ? ((myReferrer as any).referrer[0] ?? null)
                    : ((myReferrer as any).referrer ?? null),
                }
              : null) ?? null,
          referrals: safeReferrals,
        },
      },
      { status: 200 },
    );
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
    return NextResponse.json(
      { ok: false, error: "Error interno" },
      { status: 500 },
    );
  }
}
