import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getPublicEnv } from '@/lib/env';

let client: SupabaseClient | null = null;

function createBrowserClient(): SupabaseClient {
  const env = getPublicEnv();
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}

/** Cliente Supabase browser (anon key). Lazy para falhar com mensagem clara se env faltar. */
export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    if (!client) client = createBrowserClient();
    const value = Reflect.get(client, prop, receiver);
    return typeof value === 'function' ? value.bind(client) : value;
  },
});
