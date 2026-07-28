import { clientFormSchema } from '@/schemas/client';
import { validationErrorFromZod, getErrorMessage } from '@/lib/errors';
import { logger } from '@/lib/logger';
import type { Client } from '@/types';
import * as clientsRepo from '@/repositories/clientsRepository';
import * as propertiesRepo from '@/repositories/propertiesRepository';
import { deletePhotos } from '@/lib/uploadPhotos';

export function validateClientInput(input: unknown): Client {
  const parsed = clientFormSchema.safeParse(input);
  if (!parsed.success) {
    throw validationErrorFromZod(parsed.error);
  }
  const d = parsed.data;
  return {
    id: d.id ?? crypto.randomUUID(),
    createdAt: d.createdAt ?? new Date().toISOString(),
    nome: d.nome,
    telefone: d.telefone,
    email: d.email ?? '',
    cpf: d.cpf ?? '',
    aniversario: d.aniversario || undefined,
    sexo: d.sexo || undefined,
    estadoCivil: d.estadoCivil || undefined,
    temFilhos: d.temFilhos,
    quantFilhos: d.temFilhos ? d.quantFilhos : 0,
    prazo: d.prazo || undefined,
    tipoImovel: d.tipoImovel,
    precoMin: d.precoMin ?? undefined,
    precoMax: d.precoMax ?? undefined,
    orcamentoMin: d.precoMin ?? d.orcamentoMin ?? undefined,
    orcamentoMax: d.precoMax ?? d.orcamentoMax ?? undefined,
    bairro: d.bairro,
    bairrosSecundarios: d.bairrosSecundarios,
    tamanho: d.tamanho ?? undefined,
    quartosMin: d.quartosMin ?? undefined,
    suitesMin: d.suitesMin ?? undefined,
    banheirosMin: d.banheirosMin ?? undefined,
    vagasMin: d.vagasMin ?? undefined,
    tipoVaga: d.tipoVaga,
    condominioMax: d.condominioMax ?? undefined,
    prefAndar: d.prefAndar,
    andarApartir: d.andarApartir ?? null,
    novo: d.novo,
    reformado: d.reformado,
    aceitaFinanciamento: d.aceitaFinanciamento,
    mobiliado: d.mobiliado,
    varanda: d.varanda,
    areaLazer: d.areaLazer,
    aceitaPet: d.aceitaPet,
    statusNegocio: d.statusNegocio,
    observacoes: d.observacoes,
    archived: d.archived,
    properties: [],
  };
}

export async function saveClient(
  input: unknown,
  existingId?: string
): Promise<void> {
  const client = validateClientInput({
    ...(typeof input === 'object' && input ? input : {}),
    id: existingId,
  });

  try {
    if (existingId) {
      await clientsRepo.updateClientRecord(existingId, client);
    } else {
      await clientsRepo.insertClient(client);
    }
  } catch (err) {
    logger.error('saveClient failed', err, undefined, 'clientService');
    throw err;
  }
}

export async function removeClient(id: string): Promise<void> {
  await clientsRepo.deleteClientRecord(id);
}

export async function archiveClientWithProperties(clientId: string): Promise<void> {
  try {
    const props = await propertiesRepo.listPropertyPhotosForClient(clientId);
    const fotos = props.flatMap((p) => p.fotos);
    if (fotos.length > 0) {
      try {
        await deletePhotos(fotos);
      } catch (err) {
        logger.warn('Falha ao apagar fotos no arquivamento', { err }, 'clientService');
      }
    }
    await propertiesRepo.setPropertiesArchivedForClient(clientId, true, true);
    await clientsRepo.setClientArchived(clientId, true);
  } catch (err) {
    logger.error('archiveClient failed', err, { clientId }, 'clientService');
    throw err;
  }
}

export async function restoreClientWithProperties(clientId: string): Promise<void> {
  await propertiesRepo.setPropertiesArchivedForClient(clientId, false, false);
  await clientsRepo.setClientArchived(clientId, false);
}

export { getErrorMessage };
