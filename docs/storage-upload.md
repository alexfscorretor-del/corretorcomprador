# Upload de fotos — políticas e limites

## Comportamento no app

- Bucket: `property-photos`
- Path: `property-photos/{propertyId}/{propertyId}-{index}-{timestamp}.{ext}`
- MIME aceitos: JPEG, PNG, WebP, GIF (SVG rejeitado)
- Tamanho máximo por arquivo: **10 MB** (antes do resize no client)
- Máximo de fotos por imóvel no submit: **20**
- Client redimensiona para max 800px e JPEG q=0.7 antes do upload
- Validação adicional de base64 em `schemas/upload.ts` + `lib/uploadPhotos.ts`

## O que o repositório **não** garante sozinho

Policies RLS/Storage no projeto Supabase remoto. Migration legada cria bucket `property-images` com INSERT autenticado amplo — **alinhar manualmente**:

1. Bucket público de leitura `property-photos` (ou manter o nome real em produção e atualizar `BUCKET_NAME`).
2. INSERT/UPDATE/DELETE apenas para `authenticated`, preferencialmente com path prefixado pelo `auth.uid()` (melhoria recomendada no backlog).
3. Não permitir upload anônimo.

## Erros

Falhas de upload sobem como `AppError` code `UPLOAD` e são logadas via `lib/logger`.
