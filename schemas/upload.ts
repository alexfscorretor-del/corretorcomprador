import { z } from 'zod';

export const ALLOWED_IMAGE_MIME = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
] as const;

/** Tamanho máximo por arquivo antes do processamento (10 MB). */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

/** Máximo de fotos por imóvel no submit. */
export const MAX_PHOTOS_PER_PROPERTY = 20;

export const uploadFileMetaSchema = z.object({
  name: z.string().min(1),
  type: z
    .string()
    .refine(
      (t) =>
        ALLOWED_IMAGE_MIME.includes(t as (typeof ALLOWED_IMAGE_MIME)[number]) ||
        t.startsWith('image/'),
      { message: 'Tipo de arquivo não permitido. Use JPEG, PNG, WebP ou GIF.' }
    ),
  size: z
    .number()
    .max(MAX_UPLOAD_BYTES, `Arquivo excede ${MAX_UPLOAD_BYTES / (1024 * 1024)}MB.`),
});

export const base64ImageSchema = z
  .string()
  .refine((s) => s.startsWith('data:image/'), {
    message: 'Imagem base64 inválida.',
  })
  .refine((s) => {
    const idx = s.indexOf(',');
    if (idx < 0) return false;
    // ~ estimativa: base64 ~ 4/3 do binário; limite ~12MB encoded
    return s.length - idx - 1 <= MAX_UPLOAD_BYTES * 1.4;
  }, { message: 'Imagem muito grande.' });

export type UploadFileMeta = z.infer<typeof uploadFileMetaSchema>;
