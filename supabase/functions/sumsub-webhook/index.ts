import { createClient } from "npm:@supabase/supabase-js@2";

type SumsubWebhookPayload = {
  type?: string;
  applicantId?: string;
  externalUserId?: string;
  reviewResult?: { reviewAnswer?: string };
};

function algoFromHeader(v: string | null): "SHA-256" | "SHA-512" | "SHA-1" | null {
  const alg = (v ?? "").toUpperCase();
  if (alg === "HMAC_SHA256_HEX") return "SHA-256";
  if (alg === "HMAC_SHA512_HEX") return "SHA-512";
  if (alg === "HMAC_SHA1_HEX") return "SHA-1";
  return null;
}

function timingSafeEqualHex(aHex: string, bHex: string): boolean {
  const a = new Uint8Array(
    aHex.match(/.{1,2}/g)?.map((byte) => Number.parseInt(byte, 16)) ?? [],
  );
  const b = new Uint8Array(
    bHex.match(/.{1,2}/g)?.map((byte) => Number.parseInt(byte, 16)) ?? [],
  );
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

async function hmacHex(params: {
  algo: "SHA-256" | "SHA-512" | "SHA-1";
  secret: string;
  data: Uint8Array;
}): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(params.secret),
    { name: "HMAC", hash: { name: params.algo } },
    false,
    ["sign"],
  );
  const sigBuf = new Uint8Array(await crypto.subtle.sign("HMAC", key, params.data));
  return Array.from(sigBuf)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ ok: false }), {
      status: 405,
      headers: { "content-type": "application/json" },
    });
  }

  const webhookSecret = Deno.env.get("SUMSUB_WEBHOOK_SECRET_KEY") ?? "";
  if (!webhookSecret) {
    return new Response(
      JSON.stringify({ ok: false, error: "SUMSUB_WEBHOOK_SECRET_KEY no configurado" }),
      { status: 500, headers: { "content-type": "application/json" } },
    );
  }

  const digestAlgHeader = req.headers.get("x-payload-digest-alg");
  const digestHeader = req.headers.get("x-payload-digest") ?? "";
  const algo = algoFromHeader(digestAlgHeader);
  if (!algo || !digestHeader) {
    return new Response(JSON.stringify({ ok: false }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const bodyBuf = new Uint8Array(await req.arrayBuffer());
  const computedDigest = await hmacHex({ algo, secret: webhookSecret, data: bodyBuf });
  if (!timingSafeEqualHex(computedDigest, digestHeader)) {
    return new Response(JSON.stringify({ ok: false }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }

  let payload: SumsubWebhookPayload;
  try {
    payload = JSON.parse(new TextDecoder().decode(bodyBuf)) as SumsubWebhookPayload;
  } catch {
    return new Response(JSON.stringify({ ok: false }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(JSON.stringify({ ok: false, error: "Supabase no configurado" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const eventHashBuf = new Uint8Array(await crypto.subtle.digest("SHA-256", bodyBuf));
  const eventHash = Array.from(eventHashBuf)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  const { error: insertError } = await supabase.from("sumsub_webhook_events").insert({
    event_hash: eventHash,
    applicant_id: payload.applicantId ?? null,
    external_user_id: (() => {
      if (!payload.externalUserId) return null;
      const n = Number(payload.externalUserId);
      return Number.isFinite(n) ? n : null;
    })(),
    payload: payload as unknown as Record<string, unknown>,
  });

  if (insertError) {
    const code = (insertError as { code?: string } | null)?.code ?? "";
    if (code === "23505") {
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ ok: false, error: "Error persistiendo evento" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }

  if (payload.type !== "applicantReviewed") {
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }

  const externalUserId = payload.externalUserId ?? "";
  if (!externalUserId) {
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }

  const reviewAnswer = (payload.reviewResult?.reviewAnswer ?? "").toUpperCase();
  const verificationStatus =
    reviewAnswer === "GREEN"
      ? "approved"
      : reviewAnswer === "RED"
        ? "rejected"
        : null;

  if (!verificationStatus) {
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }

  const { data: existingUser, error: existingUserError } = await supabase
    .from("users")
    .select("telegram_id, verification_status")
    .eq("telegram_id", externalUserId)
    .maybeSingle();

  if (existingUserError || !existingUser) {
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }

  if (existingUser.verification_status === verificationStatus) {
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }

  const update = {
    verification_status: verificationStatus,
    verification_completed: true,
    verified_at: verificationStatus === "approved" ? new Date().toISOString() : null,
  };

  const { error: updateError } = await supabase
    .from("users")
    .update(update)
    .eq("telegram_id", externalUserId);

  if (updateError) {
    return new Response(JSON.stringify({ ok: false, error: "Error actualizando usuario" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
});
