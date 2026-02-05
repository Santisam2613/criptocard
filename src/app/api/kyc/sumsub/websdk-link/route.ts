import { NextResponse } from "next/server";

import {
  UnauthorizedError,
  requireTelegramSession,
} from "@/lib/auth/requireTelegramSession";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  SumsubApiError,
  createApplicant,
  createWebSdkLink,
  getApplicantByExternalUserId,
} from "@/lib/sumsub/client";
import { getServerCredentials } from "@/config/credentials";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const creds = getServerCredentials();
  let telegramId: bigint;
  try {
    telegramId = requireTelegramSession(req).telegramId;
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
    const message = e instanceof Error ? e.message : "Error interno";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }

  const levelName = creds.sumsub.levelName;
  if (!levelName) {
    return NextResponse.json(
      { ok: false, error: "SUMSUB_LEVEL_NAME no configurado" },
      { status: 500 },
    );
  }

  type UserRow = {
    id: string;
    telegram_first_name: string | null;
    telegram_last_name: string | null;
    sumsub_applicant_id: string | null;
    verification_status: string;
  };

  let userRow: UserRow | null = null;

  try {
    const supabase = getSupabaseAdminClient();
    const { data: existing } = await supabase
      .from("users")
      .select(
        "id, telegram_first_name, telegram_last_name, sumsub_applicant_id, verification_status",
      )
      .eq("telegram_id", telegramId.toString())
      .maybeSingle();

    if (existing) {
      userRow = existing as UserRow;
    } else {
      const { data: created, error: createError } = await supabase
        .from("users")
        .upsert({ telegram_id: telegramId.toString() }, { onConflict: "telegram_id" })
        .select(
          "id, telegram_first_name, telegram_last_name, sumsub_applicant_id, verification_status",
        )
        .single();
      if (!createError && created) userRow = created as UserRow;
    }
  } catch {
    userRow = null;
  }

  let applicantId = (userRow?.sumsub_applicant_id as string | null) ?? null;
  if (!applicantId) {
    const externalUserId = telegramId.toString();
    try {
      const created = await createApplicant({
        externalUserId,
        levelName,
        type: "individual",
        fixedInfo: {
          firstName: userRow?.telegram_first_name ?? undefined,
          lastName: userRow?.telegram_last_name ?? undefined,
        },
      });
      applicantId = created.id;
    } catch (e) {
      const errName =
        e instanceof SumsubApiError
          ? ((e.body as { errorName?: string } | null)?.errorName ?? "")
          : "";
      const couldExist =
        e instanceof SumsubApiError &&
        (e.status === 409 || errName.toLowerCase().includes("exist"));

      if (!couldExist) {
        const baseMessage = e instanceof Error ? e.message : "Error creando applicant";
        const suffix = errName ? ` (${errName})` : "";
        return NextResponse.json(
          { ok: false, error: `${baseMessage}${suffix}` },
          { status: 500 },
        );
      }

      try {
        const existing = await getApplicantByExternalUserId(externalUserId);
        applicantId = existing.id;
      } catch (fetchExistingError) {
        const message =
          fetchExistingError instanceof Error
            ? fetchExistingError.message
            : "Error consultando applicant";
        return NextResponse.json({ ok: false, error: message }, { status: 500 });
      }
    }

    if (userRow) {
      try {
        const supabase = getSupabaseAdminClient();
        const { error: updateError } = await supabase
          .from("users")
          .update({
            sumsub_applicant_id: applicantId,
            verification_status:
              userRow.verification_status === "not_started"
                ? "pending"
                : userRow.verification_status,
          })
          .eq("id", userRow.id);

        if (updateError) {
          return NextResponse.json(
            { ok: false, error: "No se pudo persistir applicant" },
            { status: 500 },
          );
        }
      } catch {
        return NextResponse.json(
          { ok: false, error: "Supabase no configurado" },
          { status: 500 },
        );
      }
    }
  }

  let link: { url: string };
  try {
    link = await createWebSdkLink({
      userId: telegramId.toString(),
      levelName,
      ttlInSecs: 30 * 60,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error Sumsub";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }

  return NextResponse.json(
    { ok: true, applicant_id: applicantId, url: link.url },
    { status: 200 },
  );
}
