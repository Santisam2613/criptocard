import { getEnv } from "@/lib/env";
import { verifyTelegramSessionToken } from "@/lib/auth/session";

export class UnauthorizedError extends Error {
  name = "UnauthorizedError";
}

function parseCookies(header: string): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    if (!k) continue;
    out[k] = decodeURIComponent(v);
  }
  return out;
}

export function requireTelegramSession(req: Request): { telegramId: bigint } {
  const env = getEnv();
  const cookieHeader = req.headers.get("cookie") ?? "";
  const cookies = parseCookies(cookieHeader);
  const token = cookies["cc_session"] ?? "";
  if (!token) throw new UnauthorizedError("No autenticado");

  const session = verifyTelegramSessionToken({
    token,
    secret: env.sessionSecret,
  });
  if (!session) throw new UnauthorizedError("Sesión inválida");

  let telegramId: bigint;
  try {
    telegramId = BigInt(session.telegramId);
  } catch {
    throw new UnauthorizedError("Sesión inválida");
  }

  return { telegramId };
}

