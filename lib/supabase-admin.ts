import 'server-only';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getServerEnv } from '@/lib/env';

let admin: SupabaseClient | null = null;

/**
 * Cliente Supabase com SERVICE ROLE.
 * Importável apenas em Server Components / Route Handlers / Server Actions.
 * `server-only` quebra o build se for puxado para o bundle client.
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (!admin) {
    const env = getServerEnv();
    admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return admin;
}
