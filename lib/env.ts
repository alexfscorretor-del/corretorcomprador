/**
 * Validação centralizada de variáveis de ambiente.
 * - Chaves NEXT_PUBLIC_* podem ser lidas no client.
 * - Segredos (SERVICE_ROLE) só via getServerEnv() em contexto server.
 */

export type PublicEnv = {
  NEXT_PUBLIC_SUPABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
};

export type ServerEnv = PublicEnv & {
  SUPABASE_SERVICE_ROLE_KEY: string;
  ADMIN_EMAIL: string;
};

function readRequired(name: string, value: string | undefined): string {
  const trimmed = value?.trim();
  if (!trimmed) {
    throw new Error(
      `[env] Variável obrigatória ausente ou vazia: ${name}. ` +
        `Defina-a em .env.local (veja .env.example).`
    );
  }
  return trimmed;
}

let cachedPublic: PublicEnv | null = null;
let cachedServer: ServerEnv | null = null;

/** Env pública — segura para browser. */
export function getPublicEnv(): PublicEnv {
  if (cachedPublic) return cachedPublic;

  cachedPublic = {
    NEXT_PUBLIC_SUPABASE_URL: readRequired(
      'NEXT_PUBLIC_SUPABASE_URL',
      process.env.NEXT_PUBLIC_SUPABASE_URL
    ),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: readRequired(
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ),
  };

  return cachedPublic;
}

/**
 * Env de servidor (inclui service role).
 * Nunca importar/chamar a partir de Client Components.
 */
export function getServerEnv(): ServerEnv {
  if (typeof window !== 'undefined') {
    throw new Error(
      '[env] getServerEnv() não pode ser chamado no browser.'
    );
  }

  if (cachedServer) return cachedServer;

  const pub = getPublicEnv();
  cachedServer = {
    ...pub,
    SUPABASE_SERVICE_ROLE_KEY: readRequired(
      'SUPABASE_SERVICE_ROLE_KEY',
      process.env.SUPABASE_SERVICE_ROLE_KEY
    ),
    ADMIN_EMAIL: (
      process.env.ADMIN_EMAIL?.trim() || 'alexfs.corretor@gmail.com'
    ).toLowerCase(),
  };

  return cachedServer;
}

/** Helper para checagem de admin sem expor service role. */
export function getAdminEmail(): string {
  if (typeof window === 'undefined') {
    try {
      return getServerEnv().ADMIN_EMAIL;
    } catch {
      return (process.env.ADMIN_EMAIL?.trim() || 'alexfs.corretor@gmail.com').toLowerCase();
    }
  }
  return (process.env.NEXT_PUBLIC_ADMIN_EMAIL?.trim() || 'alexfs.corretor@gmail.com').toLowerCase();
}
