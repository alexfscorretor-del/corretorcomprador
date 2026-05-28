import { supabase } from './supabase';

const BUCKET_NAME = 'property-images';

/**
 * Converte uma string base64 em Blob
 */
function base64ToBlob(base64: string, mimeType: string = 'image/jpeg'): Blob {
  const byteCharacters = atob(base64.split(',')[1]);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}

/**
 * Faz upload de uma foto base64 para o Supabase Storage
 * Retorna a URL pública da foto
 */
export async function uploadPhoto(
  base64: string,
  propertyId: string,
  index: number
): Promise<string> {
  try {
    const timestamp = Date.now();
    const filename = `${propertyId}-${index}-${timestamp}.jpg`;
    const folder = `property-images/${propertyId}`;
    const filepath = `${folder}/${filename}`;

    const blob = base64ToBlob(base64, 'image/jpeg');

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filepath, blob, {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (error) {
      throw new Error(`Erro ao fazer upload: ${error.message}`);
    }

    // Obter a URL pública
    const { data } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filepath);

    return data.publicUrl;
  } catch (error) {
    console.error('Erro ao fazer upload de foto:', error);
    throw error;
  }
}

/**
 * Faz upload de múltiplas fotos base64 para o Supabase Storage
 * Retorna um array com as URLs públicas
 */
export async function uploadPhotos(
  base64Array: string[],
  propertyId: string
): Promise<string[]> {
  try {
    const urls = await Promise.all(
      base64Array.map((base64, index) => uploadPhoto(base64, propertyId, index))
    );
    return urls;
  } catch (error) {
    console.error('Erro ao fazer upload de fotos:', error);
    throw error;
  }
}

/**
 * Deleta uma foto do Supabase Storage
 */
export async function deletePhoto(photoUrl: string): Promise<void> {
  try {
    // Extrair o caminho do arquivo da URL pública
    const url = new URL(photoUrl);
    const filepath = url.pathname.split(`/storage/v1/object/public/${BUCKET_NAME}/`)[1];

    if (!filepath) {
      throw new Error('URL de foto inválida');
    }

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filepath]);

    if (error) {
      throw new Error(`Erro ao deletar foto: ${error.message}`);
    }
  } catch (error) {
    console.error('Erro ao deletar foto:', error);
    throw error;
  }
}

/**
 * Deleta múltiplas fotos do Supabase Storage
 */
export async function deletePhotos(photoUrls: string[]): Promise<void> {
  try {
    await Promise.all(photoUrls.map(deletePhoto));
  } catch (error) {
    console.error('Erro ao deletar fotos:', error);
    throw error;
  }
}
