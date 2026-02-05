export type AppEnv = {
  telegramBotToken: string;
  telegramInitDataMaxAgeSeconds: number;
  sessionSecret: string;
  sessionTtlSeconds: number;
  supabaseUrl?: string;
  supabaseServiceRoleKey?: string;
  sumsubAppToken?: string;
  sumsubSecretKey?: string;
  sumsubBaseUrl: string;
  sumsubLevelName?: string;
  sumsubWebhookSecretKey?: string;
};

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Falta variable de entorno ${name}`);
  return v;
}

function numberEnv(name: string, fallback: number): number {
  const v = process.env[name];
  if (!v) return fallback;
  const n = Number(v);
  if (!Number.isFinite(n)) throw new Error(`Variable inválida ${name}`);
  return n;
}

export function getEnv(): AppEnv {
  return {
    telegramBotToken: requireEnv("TELEGRAM_BOT_TOKEN"),
    telegramInitDataMaxAgeSeconds: numberEnv(
      "TELEGRAM_INITDATA_MAX_AGE_SECONDS",
      300,
    ),
    sessionSecret: requireEnv("APP_SESSION_SECRET"),
    sessionTtlSeconds: numberEnv("APP_SESSION_TTL_SECONDS", 60 * 60 * 24),
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    sumsubAppToken: process.env.SUMSUB_APP_TOKEN,
    sumsubSecretKey: process.env.SUMSUB_SECRET_KEY,
    sumsubBaseUrl: process.env.SUMSUB_BASE_URL ?? "https://api.sumsub.com",
    sumsubLevelName: process.env.SUMSUB_LEVEL_NAME,
    sumsubWebhookSecretKey: process.env.SUMSUB_WEBHOOK_SECRET_KEY,
  };
}

