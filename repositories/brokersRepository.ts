import { supabase } from '@/lib/supabase';
import { mapRowToBroker, type DbBrokerRow } from '@/lib/mappers';
import { AppError } from '@/lib/errors';
import type { Broker } from '@/types';

export async function getCurrentBroker(): Promise<
  (Broker & { nomeExibicao?: string }) | null
> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    throw new AppError('UNAUTHORIZED', 'Usuário não autenticado.');
  }

  const { data, error } = await supabase
    .from('brokers')
    .select('id, user_id, nome, nome_exibicao, telefone, email, empresa, creci')
    .eq('user_id', userData.user.id)
    .maybeSingle();

  if (error) {
    throw new AppError('EXTERNAL', `Erro ao carregar perfil: ${error.message}`, {
      cause: error,
    });
  }
  if (!data) return null;
  return mapRowToBroker(data as DbBrokerRow);
}

export async function upsertBrokerProfile(input: {
  nome: string;
  telefone: string;
  email?: string;
  empresa?: string;
  creci?: string;
  nome_exibicao?: string;
}): Promise<void> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    throw new AppError('UNAUTHORIZED', 'Usuário não autenticado.');
  }

  const { error } = await supabase.from('brokers').upsert(
    {
      user_id: userData.user.id,
      nome: input.nome,
      telefone: input.telefone,
      email: input.email || null,
      empresa: input.empresa || null,
      creci: input.creci || null,
      nome_exibicao: input.nome_exibicao || null,
    },
    { onConflict: 'user_id' }
  );

  if (error) {
    throw new AppError('EXTERNAL', `Erro ao salvar perfil: ${error.message}`, {
      cause: error,
    });
  }
}
