-- seed.sql
-- Usado pelo Supabase CLI em ambiente local (supabase db reset).
-- Garante que o usuário admin principal tenha role correto após reset.
--
-- IMPORTANTE: Em produção, o role é gerenciado via migration.
-- Este arquivo serve apenas para desenvolvimento local.

-- Protege o role admin do usuário principal
-- Executado apenas se o registro já existir (não cria usuário novo)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.brokers WHERE email = 'alexfs.corretor@gmail.com'
  ) THEN
    UPDATE public.brokers
    SET role = 'admin'
    WHERE email = 'alexfs.corretor@gmail.com'
      AND role <> 'admin';

    RAISE NOTICE 'Admin role garantido para alexfs.corretor@gmail.com';
  ELSE
    RAISE NOTICE 'Usuário admin não encontrado no seed - crie o usuário manualmente após o primeiro login.';
  END IF;
END;
$$;
