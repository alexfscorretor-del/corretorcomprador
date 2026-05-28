-- =========================================================
-- 1) TABELA DE CONVITES / LIBERAÇÕES
-- =========================================================
create table if not exists public.broker_invites (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  nome text,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  used_at timestamptz,
  invited_by uuid references auth.users(id) on delete set null
);

create unique index if not exists broker_invites_email_unique
  on public.broker_invites (lower(email));

-- =========================================================
-- 2) AJUSTES NA TABELA BROKERS
-- =========================================================
alter table public.brokers
  alter column id set default gen_random_uuid();

alter table public.brokers
  alter column plano set default 'free';

alter table public.brokers
  alter column ativo set default true;

alter table public.brokers
  alter column created_at set default now();

-- =========================================================
-- 3) ATIVAR RLS
-- =========================================================
alter table public.brokers enable row level security;
alter table public.broker_invites enable row level security;

-- =========================================================
-- 4) LIMPAR POLICIES ANTIGAS SE EXISTIREM
-- =========================================================
drop policy if exists "brokers_select_own" on public.brokers;
drop policy if exists "brokers_insert_own" on public.brokers;
drop policy if exists "brokers_update_own" on public.brokers;

drop policy if exists "broker_invites_no_access_select" on public.broker_invites;
drop policy if exists "broker_invites_no_access_insert" on public.broker_invites;
drop policy if exists "broker_invites_no_access_update" on public.broker_invites;
drop policy if exists "broker_invites_no_access_delete" on public.broker_invites;

-- =========================================================
-- 5) POLICIES DA TABELA BROKERS
-- Cada usuário só vê e altera o próprio registro
-- =========================================================
create policy "brokers_select_own"
on public.brokers
for select
to authenticated
using (auth.uid() = user_id);

create policy "brokers_insert_own"
on public.brokers
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "brokers_update_own"
on public.brokers
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- =========================================================
-- 6) BLOQUEAR ACESSO DIRETO À TABELA DE CONVITES PELO FRONT
-- O front não deve listar convites livremente.
-- Vamos consultar via RPC SECURITY DEFINER.
-- =========================================================
create policy "broker_invites_no_access_select"
on public.broker_invites
for select
to authenticated
using (false);

create policy "broker_invites_no_access_insert"
on public.broker_invites
for insert
to authenticated
with check (false);

create policy "broker_invites_no_access_update"
on public.broker_invites
for update
to authenticated
using (false)
with check (false);

create policy "broker_invites_no_access_delete"
on public.broker_invites
for delete
to authenticated
using (false);

-- =========================================================
-- 7) FUNÇÃO PARA VALIDAR SE O E-MAIL ESTÁ LIBERADO
-- =========================================================
create or replace function public.is_broker_invited(p_email text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.broker_invites
    where lower(email) = lower(trim(p_email))
      and ativo = true
  );
$$;

grant execute on function public.is_broker_invited(text) to anon, authenticated;

-- =========================================================
-- 8) FUNÇÃO PARA CONSUMIR O CONVITE APÓS CADASTRO
-- =========================================================
create or replace function public.consume_broker_invite(p_email text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.broker_invites
  set used_at = now()
  where lower(email) = lower(trim(p_email))
    and ativo = true
    and used_at is null;
$$;

grant execute on function public.consume_broker_invite(text) to authenticated;