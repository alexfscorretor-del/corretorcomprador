import { supabase } from './supabase';
import { BUCKET_NAME } from './uploadPhotos';
import { logger } from './logger';

/**
 * Valida acesso ao bucket de fotos (não cria bucket no client).
 */
export async function initializeStorage(): Promise<boolean> {
  try {
    const { data, error } = await supabase.storage.from(BUCKET_NAME).list('', {
      limit: 1,
    });
    if (error) {
      logger.error('Erro ao acessar bucket de fotos', error, undefined, 'initializeStorage');
      return false;
    }
    return Array.isArray(data);
  } catch (error) {
    logger.error('Erro ao inicializar storage', error, undefined, 'initializeStorage');
    return false;
  }
}
