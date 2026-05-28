-- Adiciona coluna de fotos (URLs) à tabela properties
alter table public.properties add column fotos jsonb default '[]'::jsonb;

-- Criar índice para melhorar performance
create index if not exists idx_properties_fotos on public.properties using gin(fotos);
