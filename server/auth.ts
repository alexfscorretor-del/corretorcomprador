import 'server-only';

import { createSupabaseServerClient } from '@/server/supabase/server';
import { getServerEnv } from '@/lib/env';
import { AppError } from '@/lib/errors';

export async function getSessionUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;
  return user;
}

export async function requireSessionUser() {
  const user = await getSessionUser();
  if (!user) {
    throw new AppError('UNAUTHORIZED', 'Não autenticado.');
  }
  return user;
}

export async function requireAdminUser() {
  const user = await requireSessionUser();
  const { ADMIN_EMAIL } = getServerEnv();
  if ((user.email || '').toLowerCase() !== ADMIN_EMAIL) {
    throw new AppError('FORBIDDEN', 'Acesso negado.');
  }
  return user;
}

export function isAdminEmail(email: string | null | undefined): boolean {
  const admin = (
    process.env.ADMIN_EMAIL?.trim() || 'alexfs.corretor@gmail.com'
  ).toLowerCase();
  return (email || '').toLowerCase() === admin;
}
