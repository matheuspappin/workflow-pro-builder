-- Migration to fix RLS recursion error (42P17)
-- This migration drops recursive policies on users_internal and replaces them with safe versions using SECURITY DEFINER functions.

-- 1. Certificar que as funções auxiliares existem e são SECURITY DEFINER
-- Funções SECURITY DEFINER rodam com privilégios do criador, ignorando RLS da tabela consultada,
-- o que quebra o ciclo de recursão.
CREATE OR REPLACE FUNCTION public.check_is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users_internal 
    WHERE id = auth.uid() AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_auth_user_studio_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT studio_id FROM public.users_internal 
    WHERE id = auth.uid()
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Remover TODAS as políticas possivelmente recursivas da users_internal
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "users_admin_access" ON public.users_internal;
    DROP POLICY IF EXISTS "users_studio_isolation" ON public.users_internal;
    DROP POLICY IF EXISTS "studio_isolation_policy_users" ON public.users_internal;
    DROP POLICY IF EXISTS "tenant_isolation_users" ON public.users_internal;
    DROP POLICY IF EXISTS "users_read_own" ON public.users_internal;
    DROP POLICY IF EXISTS "users_super_admin_all" ON public.users_internal;
    DROP POLICY IF EXISTS "users_same_studio_read" ON public.users_internal;
EXCEPTION WHEN undefined_table THEN
    -- Table doesn't exist, ignore
END $$;

-- 3. Criar novas políticas NÃO RECURSIVAS para users_internal
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users_internal') THEN
        -- Permitir que usuários vejam seu próprio perfil
        CREATE POLICY "users_read_own" ON public.users_internal 
          FOR SELECT USING (auth.uid() = id);

        -- Permitir que Super Admins façam tudo
        CREATE POLICY "users_super_admin_all" ON public.users_internal 
          FOR ALL USING (public.check_is_super_admin());

        -- Permitir que usuários vejam outros do mesmo estúdio (usando a função para evitar recursão)
        CREATE POLICY "users_same_studio_read" ON public.users_internal 
          FOR SELECT USING (studio_id = public.get_auth_user_studio_id());
    END IF;
END $$;

-- 4. Corrigir políticas em support_tickets se a tabela existir
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'support_tickets') THEN
        DROP POLICY IF EXISTS "Users can view own tickets" ON public.support_tickets;
        DROP POLICY IF EXISTS "tenant_isolation_support_tickets_select" ON public.support_tickets;
        
        CREATE POLICY "tenant_isolation_support_tickets_select" ON public.support_tickets
          FOR SELECT USING (
            auth.uid() = user_id 
            OR 
            (studio_id = public.get_auth_user_studio_id())
            OR
            public.check_is_super_admin()
          );
    END IF;
END $$;
