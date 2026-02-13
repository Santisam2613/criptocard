export type PublicCredentials = {
  bypassTelegramGate: boolean;
};

export type ServerCredentials = {
  app: {
    sessionSecret: string;
    sessionTtlSeconds: number;
  };
  telegram: {
    botToken?: string;
    initDataMaxAgeSeconds: number;
  };
  supabase: {
    url?: string;
    serviceRoleKey?: string;
  };
  sumsub: {
    appToken?: string;
    secretKey?: string;
    baseUrl: string;
    levelName?: string;
    webhookSecretKey?: string;
  };
  stripe?: {
    secretKey?: string;
    webhookSecret?: string;
    issuingProfileId?: string;
  };
  dev: {
    bypassAuth: boolean;
    telegramId?: string;
  };
};

let cachedServer: ServerCredentials | null = null;
let cachedPublic: PublicCredentials | null = null;

function readString(name: string): string | undefined {
  const v = process.env[name];
  if (!v) return undefined;
  return v;
}

function readRequiredString(name: string): string {
  const v = readString(name);
  if (!v) throw new Error(`Falta variable de entorno ${name}`);
  return v;
}

function readNumber(name: string, fallback: number): number {
  const raw = readString(name);
  if (!raw) return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n)) throw new Error(`Variable inválida ${name}`);
  return n;
}

export function getPublicCredentials(): PublicCredentials {
  if (cachedPublic) return cachedPublic;
  cachedPublic = {
    bypassTelegramGate: process.env.NEXT_PUBLIC_BYPASS_TELEGRAM === "1",
  };
  return cachedPublic;
}

export function getServerCredentials(): ServerCredentials {
  if (cachedServer) return cachedServer;

  cachedServer = {
    app: {
      sessionSecret: readRequiredString("APP_SESSION_SECRET"),
      sessionTtlSeconds: readNumber("APP_SESSION_TTL_SECONDS", 60 * 60 * 24),
    },
    telegram: {
      botToken: readString("TELEGRAM_BOT_TOKEN"),
      initDataMaxAgeSeconds: readNumber("TELEGRAM_INITDATA_MAX_AGE_SECONDS", 300),
    },
    supabase: {
      url: readString("SUPABASE_URL"),
      serviceRoleKey: readString("SUPABASE_SERVICE_ROLE_KEY"),
    },
    sumsub: {
      appToken: readString("SUMSUB_APP_TOKEN"),
      secretKey: readString("SUMSUB_SECRET_KEY"),
      baseUrl: readString("SUMSUB_BASE_URL") ?? "https://api.sumsub.com",
      levelName: readString("SUMSUB_LEVEL_NAME"),
      webhookSecretKey: readString("SUMSUB_WEBHOOK_SECRET_KEY"),
    },
    stripe: {
      secretKey: readString("STRIPE_SECRET_KEY"),
      webhookSecret: readString("STRIPE_WEBHOOK_SECRET"),
      issuingProfileId: readString("STRIPE_ISSUING_PROFILE_ID"),
    },
    dev: {
      bypassAuth: readString("DEV_BYPASS_AUTH") === "1",
      telegramId: readString("DEV_TELEGRAM_ID"),
    },
  };

  return cachedServer;
}
