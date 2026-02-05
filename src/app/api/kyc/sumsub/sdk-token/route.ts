import { NextResponse } from "next/server";

import {
  UnauthorizedError,
  requireTelegramSession,
} from "@/lib/auth/requireTelegramSession";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  SumsubApiError,
  createApplicant,
  createSdkAccessToken,
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
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  const levelName = creds.sumsub.levelName;
  if (!levelName) {
    return NextResponse.json(
      { ok: false, error: "SUMSUB_LEVEL_NAME no configurado" },
      { status: 500 },
    );
  }

  const supabase = getSupabaseAdminClient();
  const { data: userRow, error: userError } = await supabase
    .from("users")
    .select(
      "id, telegram_id, telegram_first_name, telegram_last_name, sumsub_applicant_id, verification_status",
    )
    .eq("telegram_id", telegramId.toString())
    .single();

  if (userError || !userRow) {
    return NextResponse.json(
      { ok: false, error: "Usuario no encontrado" },
      { status: 404 },
    );
  }

  let applicantId = userRow.sumsub_applicant_id as string | null;
  if (!applicantId) {
    const externalUserId = telegramId.toString();
    try {
      const created = await createApplicant({
        externalUserId,
        levelName,
        type: "individual",
        fixedInfo: {
          firstName: userRow.telegram_first_name ?? undefined,
          lastName: userRow.telegram_last_name ?? undefined,
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
        return NextResponse.json(
          { ok: false, error: "Error creando applicant" },
          { status: 500 },
        );
      }

      const existing = await getApplicantByExternalUserId(externalUserId);
      applicantId = existing.id;
    }

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
  }

  const token = await createSdkAccessToken({
    userId: telegramId.toString(),
    levelName,
    ttlInSecs: 10 * 60,
  });

  return NextResponse.json(
    { ok: true, applicant_id: applicantId, token },
    { status: 200 },
  );
}
