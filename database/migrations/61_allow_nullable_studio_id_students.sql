-- 61. Permitir alunos/clientes sem estúdio (cadastro independente, ex: Fire Protection - condomínio)
-- Similar à migration 46 que fez o mesmo para professionals
ALTER TABLE students ALTER COLUMN studio_id DROP NOT NULL;

-- Evitar emails duplicados entre alunos sem estúdio (UNIQUE(studio_id,email) considera NULLs distintos)
CREATE UNIQUE INDEX IF NOT EXISTS students_email_unique_when_no_studio
ON students (email) WHERE studio_id IS NULL;

-- Atualizar RLS: alunos sem estúdio precisam acessar seu próprio perfil (id = auth.uid())
-- Usa get_auth_user_studio_id() e check_is_super_admin() (definidos na migration 35)
DROP POLICY IF EXISTS "tenant_isolation_students" ON students;
CREATE POLICY "tenant_isolation_students" ON students FOR ALL
USING (
  studio_id = public.get_auth_user_studio_id()
  OR public.check_is_super_admin()
  OR (studio_id IS NULL AND id = auth.uid())
);
