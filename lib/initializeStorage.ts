import { supabase } from './supabase';

/**
 * Inicializa o armazenamento de fotos.
 * Em produção, a criação de bucket via client-side normalmente não é necessária;
 * o bucket já deve existir no projeto Supabase.
 * Esta função apenas valida acesso ao bucket configurado.
 */
export async function initializeStorage(): Promise<boolean> {
  try {
    const bucketName = 'property-photos';

    const { data, error } = await supabase.storage.from(bucketName).list('', {
      limit: 1,
    });

    if (error) {
      console.error('Erro ao acessar bucket de fotos:', error.message);
      return false;
    }

    return Array.isArray(data);
  } catch (error) {
    console.error('Erro ao inicializar storage:', error);
    return false;
  }
}