import { supabase } from '@/lib/supabase';
import {
  clientToDbPayload,
  mapRowToClient,
  type DbClientRow,
} from '@/lib/mappers';
import { AppError } from '@/lib/errors';
import type { Client } from '@/types';

async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    throw new AppError('UNAUTHORIZED', 'Usuário não autenticado.');
  }
  return data.user.id;
}

export async function listClients(opts?: {
  archived?: boolean;
}): Promise<Client[]> {
  const userId = await requireUserId();
  let query = supabase
    .from('clients')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (opts?.archived === true) {
    query = query.eq('archived', true);
  } else if (opts?.archived === false) {
    query = query.or('archived.is.null,archived.eq.false');
  }

  const { data, error } = await query;
  if (error) {
    throw new AppError('EXTERNAL', `Erro ao carregar clientes: ${error.message}`, {
      cause: error,
    });
  }
  return (data || []).map((row) => mapRowToClient(row as DbClientRow));
}

export async function getClientById(id: string): Promise<Client | null> {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw new AppError('EXTERNAL', `Erro ao carregar cliente: ${error.message}`, {
      cause: error,
    });
  }
  if (!data) return null;
  return mapRowToClient(data as DbClientRow);
}

export async function insertClient(client: Client): Promise<void> {
  const userId = await requireUserId();
  const payload = clientToDbPayload(client, userId);
  const { error } = await supabase.from('clients').insert(payload);
  if (error) {
    throw new AppError('EXTERNAL', `Erro ao criar cliente: ${error.message}`, {
      cause: error,
    });
  }
}

export async function updateClientRecord(
  id: string,
  client: Client
): Promise<Client> {
  const userId = await requireUserId();
  const payload = clientToDbPayload(client, userId);
  const { data, error } = await supabase
    .from('clients')
    .update(payload)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    throw new AppError('EXTERNAL', `Erro ao atualizar cliente: ${error.message}`, {
      cause: error,
    });
  }
  return mapRowToClient(data as DbClientRow);
}

export async function deleteClientRecord(id: string): Promise<void> {
  const userId = await requireUserId();
  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    throw new AppError('EXTERNAL', `Erro ao excluir cliente: ${error.message}`, {
      cause: error,
    });
  }
}

export async function setClientArchived(
  id: string,
  archived: boolean
): Promise<void> {
  const userId = await requireUserId();
  const { error } = await supabase
    .from('clients')
    .update({ archived })
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    throw new AppError(
      'EXTERNAL',
      `Erro ao ${archived ? 'arquivar' : 'desarquivar'} cliente: ${error.message}`,
      { cause: error }
    );
  }
}
