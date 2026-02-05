import crypto from "crypto";

export type TelegramSession = {
  telegramId: string;
  issuedAt: number;
  expiresAt: number;
};

function base64UrlEncode(input: Buffer | string): string {
  const buf = typeof input === "string" ? Buffer.from(input, "utf8") : input;
  return buf
    .toString("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function base64UrlDecodeToBuffer(input: string): Buffer {
  const padLen = (4 - (input.length % 4)) % 4;
  const padded = input
    .replaceAll("-", "+")
    .replaceAll("_", "/")
    .concat("=".repeat(padLen));
  return Buffer.from(padded, "base64");
}

function sign(secret: string, payloadB64: string): string {
  return base64UrlEncode(
    crypto.createHmac("sha256", secret).update(payloadB64).digest(),
  );
}

function timingSafeEqualBase64Url(a: string, b: string): boolean {
  const aBuf = base64UrlDecodeToBuffer(a);
  const bBuf = base64UrlDecodeToBuffer(b);
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

export function createTelegramSessionToken(params: {
  telegramId: bigint;
  ttlSeconds: number;
  secret: string;
  nowSeconds?: number;
}): string {
  const now = params.nowSeconds ?? Math.floor(Date.now() / 1000);
  const session: TelegramSession = {
    telegramId: params.telegramId.toString(),
    issuedAt: now,
    expiresAt: now + params.ttlSeconds,
  };
  const payloadB64 = base64UrlEncode(JSON.stringify(session));
  const sig = sign(params.secret, payloadB64);
  return `${payloadB64}.${sig}`;
}

export function verifyTelegramSessionToken(params: {
  token: string;
  secret: string;
  nowSeconds?: number;
}): TelegramSession | null {
  const { token, secret } = params;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payloadB64, sig] = parts;
  if (!payloadB64 || !sig) return null;

  const expectedSig = sign(secret, payloadB64);
  if (!timingSafeEqualBase64Url(expectedSig, sig)) return null;

  let session: unknown;
  try {
    session = JSON.parse(base64UrlDecodeToBuffer(payloadB64).toString("utf8"));
  } catch {
    return null;
  }

  const s = session as Partial<TelegramSession>;
  if (
    typeof s.telegramId !== "string" ||
    typeof s.issuedAt !== "number" ||
    typeof s.expiresAt !== "number"
  ) {
    return null;
  }

  const now = params.nowSeconds ?? Math.floor(Date.now() / 1000);
  if (now > s.expiresAt) return null;

  return s as TelegramSession;
}

