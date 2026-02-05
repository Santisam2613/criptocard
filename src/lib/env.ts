import { getServerCredentials } from "@/config/credentials";

export type AppEnv = {
  telegramBotToken?: string;
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

export function getEnv(): AppEnv {
  const creds = getServerCredentials();
  return {
    telegramBotToken: creds.telegram.botToken,
    telegramInitDataMaxAgeSeconds: creds.telegram.initDataMaxAgeSeconds,
    sessionSecret: creds.app.sessionSecret,
    sessionTtlSeconds: creds.app.sessionTtlSeconds,
    supabaseUrl: creds.supabase.url,
    supabaseServiceRoleKey: creds.supabase.serviceRoleKey,
    sumsubAppToken: creds.sumsub.appToken,
    sumsubSecretKey: creds.sumsub.secretKey,
    sumsubBaseUrl: creds.sumsub.baseUrl,
    sumsubLevelName: creds.sumsub.levelName,
    sumsubWebhookSecretKey: creds.sumsub.webhookSecretKey,
  };
}
