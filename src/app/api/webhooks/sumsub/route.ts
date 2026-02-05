import crypto from "crypto";
import { NextResponse } from "next/server";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendTelegramBotMessage } from "@/lib/telegram/bot";
import { getServerCredentials } from "@/config/credentials";

export const runtime = "nodejs";

function timingSafeEqualHex(aHex: string, bHex: string): boolean {
  const a = Buffer.from(aHex, "hex");
  const b = Buffer.from(bHex, "hex");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function algoFromHeader(v: string | null): "sha256" | "sha512" | "sha1" | null {
  const alg = (v ?? "").toUpperCase();
  if (alg === "HMAC_SHA256_HEX") return "sha256";
  if (alg === "HMAC_SHA512_HEX") return "sha512";
  if (alg === "HMAC_SHA1_HEX") return "sha1";
  return null;
}

export async function POST(req: Request) {
  const creds = getServerCredentials();
  const webhookSecret = creds.sumsub.webhookSecretKey;
  if (!webhookSecret) {
    return NextResponse.json(
      { ok: false, error: "SUMSUB_WEBHOOK_SECRET_KEY no configurado" },
      { status: 500 },
    );
  }

  const digestAlgHeader = req.headers.get("x-payload-digest-alg");
  const digestHeader = req.headers.get("x-payload-digest") ?? "";
  const algo = algoFromHeader(digestAlgHeader);
  if (!algo || !digestHeader) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const bodyBuf = Buffer.from(await req.arrayBuffer());
  const computedDigest = crypto
    .createHmac(algo, webhookSecret)
    .update(bodyBuf)
    .digest("hex");

  if (!timingSafeEqualHex(computedDigest, digestHeader)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(bodyBuf.toString("utf8"));
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const p = payload as {
    type?: string;
    applicantId?: string;
    externalUserId?: string;
    reviewResult?: { reviewAnswer?: string };
  };

  const supabase = getSupabaseAdminClient();

  const eventHash = crypto.createHash("sha256").update(bodyBuf).digest("hex");
  const { error: insertError } = await supabase
    .from("sumsub_webhook_events")
    .insert({
      event_hash: eventHash,
      applicant_id: p.applicantId ?? null,
      external_user_id: p.externalUserId ?? null,
      payload: payload as Record<string, unknown>,
    });

  if (insertError) {
    const code = (insertError as { code?: string } | null)?.code ?? "";
    if (code === "23505") {
      return NextResponse.json({ ok: true }, { status: 200 });
    }
    return NextResponse.json(
      { ok: false, error: "Error persistiendo evento" },
      { status: 500 },
    );
  }

  if (p.type !== "applicantReviewed") {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  const externalUserId = p.externalUserId ?? "";
  if (!externalUserId) {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  const reviewAnswer = (p.reviewResult?.reviewAnswer ?? "").toUpperCase();
  const verificationStatus =
    reviewAnswer === "GREEN"
      ? "approved"
      : reviewAnswer === "RED"
        ? "rejected"
        : null;

  if (!verificationStatus) {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  const { data: existingUser, error: existingUserError } = await supabase
    .from("users")
    .select("telegram_id, verification_status")
    .eq("telegram_id", externalUserId)
    .maybeSingle();

  if (existingUserError || !existingUser) {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  if (existingUser.verification_status === verificationStatus) {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  const update = {
    verification_status: verificationStatus,
    verification_completed: true,
    verified_at:
      verificationStatus === "approved" ? new Date().toISOString() : null,
  };

  const { error: updateError } = await supabase
    .from("users")
    .update(update)
    .eq("telegram_id", externalUserId);

  if (updateError) {
    return NextResponse.json(
      { ok: false, error: "Error actualizando usuario" },
      { status: 500 },
    );
  }

  const message =
    verificationStatus === "approved"
      ? "✅ Usuario verificado"
      : "❌ Verificación rechazada";
  void sendTelegramBotMessage({
    telegramId: existingUser.telegram_id,
    text: message,
  }).catch(() => null);

  return NextResponse.json({ ok: true }, { status: 200 });
}
