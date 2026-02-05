import { createClient } from "@supabase/supabase-js";

import { getEnv } from "@/lib/env";

export function getSupabaseAdminClient() {
  const env = getEnv();
  if (!env.supabaseUrl || !env.supabaseServiceRoleKey) {
    throw new Error("Supabase no configurado");
  }
  return createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

