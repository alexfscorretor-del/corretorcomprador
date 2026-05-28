import { ensureBucketExists } from './uploadPhotos';

/**
 * Inicializa o armazenamento de fotos
 * Deve ser chamado uma vez quando o app inicia
 */
export async function initializePhotoStorage(): Promise<void> {
  try {
    await ensureBucketExists();
  } catch (error) {
    console.error('Falha ao inicializar armazenamento de fotos:', error);
    // Não interromper a aplicação se falhar
  }
}
