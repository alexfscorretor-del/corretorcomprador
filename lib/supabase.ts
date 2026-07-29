import { createBrowserClient as createSSRBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getPublicEnv } from '@/lib/env';

let client: SupabaseClient | null = null;

function createBrowserClient(): SupabaseClient {
  const env = getPublicEnv();
  // IMPORTANTE: usar @supabase/ssr para que a sessão seja persistida em cookies
  // e não no localStorage. O middleware (server-side) lê cookies — não localStorage.
  // Trocar isso de volta para createClient puro quebrará o redirecionamento pós-login.
  return createSSRBrowserClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) as unknown as SupabaseClient;
}

/** Cliente Supabase browser (anon key). Usa @supabase/ssr para compatibilidade com middleware. */
export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    if (!client) client = createBrowserClient();
    const value = Reflect.get(client, prop, receiver);
    return typeof value === 'function' ? value.bind(client) : value;
  },
});
