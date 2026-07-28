import { supabase } from '@/lib/supabase';
import {
  mapRowToProperty,
  propertyToDbPayload,
  type DbPropertyRow,
} from '@/lib/mappers';
import { AppError } from '@/lib/errors';
import type { Property } from '@/types';

async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    throw new AppError('UNAUTHORIZED', 'Usuário não autenticado.');
  }
  return data.user.id;
}

export async function listPropertiesByClient(
  clientId: string
): Promise<Property[]> {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('client_id', clientId)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new AppError('EXTERNAL', `Erro ao carregar imóveis: ${error.message}`, {
      cause: error,
    });
  }
  return (data || []).map((row) => mapRowToProperty(row as DbPropertyRow));
}

export async function insertProperty(
  prop: Property,
  clientId: string,
  fotos: string[]
): Promise<void> {
  const userId = await requireUserId();
  const payload = propertyToDbPayload(prop, userId, clientId, fotos);
  const { error } = await supabase.from('properties').insert(payload);
  if (error) {
    throw new AppError('EXTERNAL', `Erro ao salvar imóvel: ${error.message}`, {
      cause: error,
    });
  }
}

export async function updatePropertyRecord(
  id: string,
  prop: Property,
  clientId: string,
  fotos: string[]
): Promise<void> {
  const userId = await requireUserId();
  const payload = propertyToDbPayload(prop, userId, clientId, fotos);
  const { error } = await supabase
    .from('properties')
    .update(payload)
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    throw new AppError('EXTERNAL', `Erro ao atualizar imóvel: ${error.message}`, {
      cause: error,
    });
  }
}

export async function deletePropertyRecord(id: string): Promise<void> {
  const userId = await requireUserId();
  const { error } = await supabase
    .from('properties')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    throw new AppError('EXTERNAL', `Erro ao excluir imóvel: ${error.message}`, {
      cause: error,
    });
  }
}

export async function updatePropertyRating(
  id: string,
  rating: number
): Promise<void> {
  const userId = await requireUserId();
  const { error } = await supabase
    .from('properties')
    .update({ avaliacao: rating })
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    throw new AppError('EXTERNAL', `Erro ao salvar avaliação: ${error.message}`, {
      cause: error,
    });
  }
}

export async function listPropertyPhotosForClient(
  clientId: string
): Promise<Array<{ id: string; fotos: string[] }>> {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from('properties')
    .select('id, fotos')
    .eq('client_id', clientId)
    .eq('user_id', userId);

  if (error) {
    throw new AppError(
      'EXTERNAL',
      `Erro ao buscar imóveis do cliente: ${error.message}`,
      { cause: error }
    );
  }

  return (data || []).map((p) => ({
    id: p.id as string,
    fotos: Array.isArray(p.fotos) ? (p.fotos as string[]) : [],
  }));
}

export async function setPropertiesArchivedForClient(
  clientId: string,
  archived: boolean,
  clearFotos: boolean
): Promise<void> {
  const userId = await requireUserId();
  const patch: Record<string, unknown> = { archived };
  if (clearFotos) patch.fotos = [];

  const { error } = await supabase
    .from('properties')
    .update(patch)
    .eq('client_id', clientId)
    .eq('user_id', userId);

  if (error) {
    throw new AppError(
      'EXTERNAL',
      `Erro ao atualizar imóveis do cliente: ${error.message}`,
      { cause: error }
    );
  }
}
