import { createClient } from "@supabase/supabase-js";

import { getServerCredentials } from "@/config/credentials";

export function getSupabaseAdminClient() {
  const creds = getServerCredentials();
  if (!creds.supabase.url || !creds.supabase.serviceRoleKey) {
    throw new Error("Supabase no configurado");
  }
  return createClient(creds.supabase.url, creds.supabase.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
