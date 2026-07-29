-- Migration: protect_admin_role
-- Objetivo: Garantir que o usuário admin principal sempre tenha role = 'admin'
-- após qualquer reset, seed ou refatoração de banco.
-- ATENÇÃO: Este arquivo NÃO deve ser removido em fases futuras de refatoração.

-- Atualiza o role para 'admin' caso tenha sido sobrescrito por valor padrão
UPDATE public.brokers
SET role = 'admin'
WHERE email = 'alexfs.corretor@gmail.com'
  AND role <> 'admin';
