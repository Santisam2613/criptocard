import crypto from "crypto";

export type TelegramWebAppUser = {
  id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  photo_url?: string;
};

export type TelegramValidatedInitData = {
  telegramId: bigint;
  user: TelegramWebAppUser;
  authDate: number;
  queryId?: string;
  raw: string;
  hash: string;
};

export class TelegramInitDataError extends Error {
  name = "TelegramInitDataError";
}

function timingSafeEqualHex(aHex: string, bHex: string): boolean {
  const a = Buffer.from(aHex, "hex");
  const b = Buffer.from(bHex, "hex");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function validateTelegramInitData(params: {
  initData: string;
  botToken: string;
  maxAgeSeconds: number;
  nowSeconds?: number;
}): TelegramValidatedInitData {
  const { initData, botToken, maxAgeSeconds, nowSeconds } = params;

  if (!initData || typeof initData !== "string") {
    throw new TelegramInitDataError("initData vacío");
  }
  if (!botToken) {
    throw new TelegramInitDataError("botToken no configurado");
  }
  if (!Number.isFinite(maxAgeSeconds) || maxAgeSeconds <= 0) {
    throw new TelegramInitDataError("maxAgeSeconds inválido");
  }

  const urlParams = new URLSearchParams(initData);
  const hash = urlParams.get("hash") ?? "";
  if (!hash) throw new TelegramInitDataError("hash faltante");
  urlParams.delete("hash");

  const entries = Array.from(urlParams.entries()).sort(([ak, av], [bk, bv]) => {
    const kc = ak.localeCompare(bk);
    if (kc !== 0) return kc;
    return av.localeCompare(bv);
  });
  const dataCheckString = entries.map(([k, v]) => `${k}=${v}`).join("\n");

  const secretKey = crypto
    .createHmac("sha256", "WebAppData")
    .update(botToken)
    .digest();

  const computedHash = crypto
    .createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  if (!timingSafeEqualHex(computedHash, hash)) {
    throw new TelegramInitDataError("hash inválido");
  }

  const authDateRaw = urlParams.get("auth_date") ?? "";
  const authDate = Number(authDateRaw);
  if (!Number.isFinite(authDate) || authDate <= 0) {
    throw new TelegramInitDataError("auth_date inválido");
  }

  const now = nowSeconds ?? Math.floor(Date.now() / 1000);
  const age = now - authDate;
  if (age < -60) throw new TelegramInitDataError("auth_date en el futuro");
  if (age > maxAgeSeconds) throw new TelegramInitDataError("initData expirado");

  const userRaw = urlParams.get("user") ?? "";
  if (!userRaw) throw new TelegramInitDataError("user faltante");

  let userJson: unknown;
  try {
    userJson = JSON.parse(userRaw);
  } catch {
    throw new TelegramInitDataError("user inválido");
  }

  const user = userJson as Partial<TelegramWebAppUser>;
  if (!user?.id || typeof user.id !== "number") {
    throw new TelegramInitDataError("user.id inválido");
  }

  return {
    telegramId: BigInt(user.id),
    user: {
      id: user.id,
      username: user.username,
      first_name: user.first_name,
      last_name: user.last_name,
      photo_url: user.photo_url,
    },
    authDate,
    queryId: urlParams.get("query_id") ?? undefined,
    raw: initData,
    hash,
  };
}

