import { propertyFormSchema } from '@/schemas/property';
import { validationErrorFromZod } from '@/lib/errors';
import { logger } from '@/lib/logger';
import type { Property } from '@/types';
import * as propertiesRepo from '@/repositories/propertiesRepository';
import { uploadPhotos, deletePhotos } from '@/lib/uploadPhotos';
import { MAX_PHOTOS_PER_PROPERTY, base64ImageSchema } from '@/schemas/upload';
import { AppError } from '@/lib/errors';

export function validatePropertyInput(input: unknown): Property {
  const parsed = propertyFormSchema.safeParse(input);
  if (!parsed.success) {
    throw validationErrorFromZod(parsed.error);
  }
  const d = parsed.data;
  return {
    id: d.id || String(Date.now()),
    clientId: d.clientId,
    createdAt: d.createdAt || new Date().toISOString(),
    titulo: d.titulo,
    tipoImovel: d.tipoImovel || '',
    preco: d.preco,
    bairro: d.bairro || '',
    descricao: d.descricao,
    tamanho: d.tamanho ?? undefined,
    quartos: d.quartos ?? undefined,
    suites: d.suites ?? undefined,
    banheiros: d.banheiros ?? undefined,
    vagas: d.vagas ?? undefined,
    andar: d.andar ?? null,
    tipoVaga: d.tipoVaga,
    tipoVagaCobertura: d.tipoVagaCobertura,
    tipoVagaModelo: d.tipoVagaModelo,
    condominio: d.condominio ?? null,
    predioNovo: d.predioNovo,
    reformado: d.reformado,
    aceitaFinanciamento: d.aceitaFinanciamento,
    mobiliado: d.mobiliado,
    varanda: d.varanda,
    areaLazer: d.areaLazer,
    aceitaPet: d.aceitaPet,
    link: d.link,
    fotos: d.fotos,
    rating: d.rating ?? 0,
    favorito: d.favorito ?? false,
    status: d.status || 'disponivel',
    observacoes: d.observacoes || '',
    anotacaoPrivada: d.anotacaoPrivada || '',
  };
}

export async function saveProperty(opts: {
  input: unknown;
  clientId: string;
  existing?: Property | null;
}): Promise<void> {
  const prop = validatePropertyInput({
    ...(typeof opts.input === 'object' && opts.input ? opts.input : {}),
    clientId: opts.clientId,
    id: opts.existing?.id,
  });

  const base64Fotos = prop.fotos?.filter((f) => f.startsWith('data:')) || [];
  const urlFotos = prop.fotos?.filter((f) => !f.startsWith('data:')) || [];

  if (base64Fotos.length + urlFotos.length > MAX_PHOTOS_PER_PROPERTY) {
    throw new AppError(
      'VALIDATION',
      `Máximo de ${MAX_PHOTOS_PER_PROPERTY} fotos por imóvel.`
    );
  }

  for (const b64 of base64Fotos) {
    const check = base64ImageSchema.safeParse(b64);
    if (!check.success) {
      throw validationErrorFromZod(check.error);
    }
  }

  try {
    let uploadedUrls: string[] = [];
    if (base64Fotos.length > 0) {
      const propertyId = opts.existing?.id || `temp_${Date.now()}`;
      uploadedUrls = await uploadPhotos(base64Fotos, propertyId);
    }

    const allFotos = [...uploadedUrls, ...urlFotos];

    if (opts.existing?.id) {
      const fotosAntigasRemover =
        opts.existing.fotos?.filter((f) => !allFotos.includes(f)) || [];
      if (fotosAntigasRemover.length > 0) {
        try {
          await deletePhotos(fotosAntigasRemover);
        } catch (err) {
          logger.warn('Erro ao deletar fotos antigas', { err }, 'propertyService');
        }
      }
      await propertiesRepo.updatePropertyRecord(
        opts.existing.id,
        prop,
        opts.clientId,
        allFotos
      );
    } else {
      await propertiesRepo.insertProperty(prop, opts.clientId, allFotos);
    }
  } catch (err) {
    logger.error('saveProperty failed', err, undefined, 'propertyService');
    throw err;
  }
}

export async function removeProperty(prop: Property): Promise<void> {
  if (prop.fotos && prop.fotos.length > 0) {
    try {
      await deletePhotos(prop.fotos);
    } catch (err) {
      logger.warn('Erro ao deletar fotos na exclusão', { err }, 'propertyService');
    }
  }
  await propertiesRepo.deletePropertyRecord(prop.id);
}
