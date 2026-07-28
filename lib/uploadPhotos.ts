import { supabase } from './supabase';
import { AppError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import {
  ALLOWED_IMAGE_MIME,
  MAX_UPLOAD_BYTES,
  base64ImageSchema,
} from '@/schemas/upload';

export const BUCKET_NAME = 'property-photos';

function base64ToBlob(base64: string, mimeType: string = 'image/jpeg'): Blob {
  const parts = base64.split(',');
  if (parts.length < 2) {
    throw new AppError('UPLOAD', 'Imagem base64 inválida.');
  }
  const byteCharacters = atob(parts[1]);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  if (byteArray.byteLength > MAX_UPLOAD_BYTES) {
    throw new AppError(
      'UPLOAD',
      `Arquivo excede o limite de ${MAX_UPLOAD_BYTES / (1024 * 1024)}MB.`
    );
  }
  return new Blob([byteArray], { type: mimeType });
}

function detectMime(base64: string): string {
  const match = /^data:([^;]+);base64,/i.exec(base64);
  return match?.[1]?.toLowerCase() || 'image/jpeg';
}

function assertAllowedMime(mime: string): void {
  const ok =
    ALLOWED_IMAGE_MIME.includes(mime as (typeof ALLOWED_IMAGE_MIME)[number]) ||
    mime.startsWith('image/');
  if (!ok || mime.includes('svg')) {
    throw new AppError(
      'UPLOAD',
      'Tipo de imagem não permitido. Use JPEG, PNG, WebP ou GIF.'
    );
  }
}

/**
 * Upload de uma foto base64 para o Supabase Storage.
 * Path: property-photos/{propertyId}/{propertyId}-{index}-{ts}.jpg
 */
export async function uploadPhoto(
  base64: string,
  propertyId: string,
  index: number
): Promise<string> {
  const parsed = base64ImageSchema.safeParse(base64);
  if (!parsed.success) {
    throw new AppError('UPLOAD', parsed.error.issues[0]?.message || 'Imagem inválida.');
  }

  const mime = detectMime(base64);
  assertAllowedMime(mime);

  const ext =
    mime === 'image/png'
      ? 'png'
      : mime === 'image/webp'
        ? 'webp'
        : mime === 'image/gif'
          ? 'gif'
          : 'jpg';

  try {
    const timestamp = Date.now();
    const safeProp = propertyId.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `${safeProp}-${index}-${timestamp}.${ext}`;
    const folder = `property-photos/${safeProp}`;
    const filepath = `${folder}/${filename}`;

    const blob = base64ToBlob(base64, mime);

    const { error } = await supabase.storage.from(BUCKET_NAME).upload(filepath, blob, {
      contentType: mime,
      upsert: false,
    });

    if (error) {
      throw new AppError('UPLOAD', `Erro ao fazer upload: ${error.message}`, {
        cause: error,
      });
    }

    const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filepath);
    return data.publicUrl;
  } catch (error) {
    logger.error('uploadPhoto failed', error, { propertyId, index }, 'uploadPhotos');
    throw error;
  }
}

export async function uploadPhotos(
  base64Array: string[],
  propertyId: string
): Promise<string[]> {
  try {
    return await Promise.all(
      base64Array.map((base64, index) => uploadPhoto(base64, propertyId, index))
    );
  } catch (error) {
    logger.error('uploadPhotos failed', error, { propertyId }, 'uploadPhotos');
    throw error;
  }
}

export async function deletePhoto(photoUrl: string): Promise<void> {
  try {
    const url = new URL(photoUrl);
    const filepath = url.pathname.split(
      `/storage/v1/object/public/${BUCKET_NAME}/`
    )[1];

    if (!filepath) {
      throw new AppError('UPLOAD', 'URL de foto inválida');
    }

    const { error } = await supabase.storage.from(BUCKET_NAME).remove([filepath]);

    if (error) {
      throw new AppError('UPLOAD', `Erro ao deletar foto: ${error.message}`, {
        cause: error,
      });
    }
  } catch (error) {
    logger.error('deletePhoto failed', error, undefined, 'uploadPhotos');
    throw error;
  }
}

export async function deletePhotos(photoUrls: string[]): Promise<void> {
  try {
    await Promise.all(photoUrls.map(deletePhoto));
  } catch (error) {
    logger.error('deletePhotos failed', error, undefined, 'uploadPhotos');
    throw error;
  }
}

/** Valida File do input antes de processar no browser. */
export function assertUploadFile(file: File): void {
  assertAllowedMime(file.type || 'application/octet-stream');
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new AppError(
      'UPLOAD',
      `Arquivo "${file.name}" excede ${MAX_UPLOAD_BYTES / (1024 * 1024)}MB.`
    );
  }
}
