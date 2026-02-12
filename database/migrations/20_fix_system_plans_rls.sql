
-- Ajuste de RLS para system_plans
-- Permite que apenas Super Admins possam inserir, atualizar ou excluir planos

-- Primeiro, verificamos se a coluna max_professionals existe e renomeamos para max_teachers se necessário
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'system_plans' AND column_name = 'max_professionals') THEN
        ALTER TABLE system_plans RENAME COLUMN max_professionals TO max_teachers;
    END IF;
END $$;

-- Primeiro, removemos a política se ela já existir por algum motivo
DROP POLICY IF EXISTS "system_plans_admin_all" ON system_plans;

-- Criamos a política para permitir todas as operações para super_admins
-- Usamos uma subquery para verificar o papel na tabela users_internal
CREATE POLICY "system_plans_admin_all" ON system_plans 
FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM users_internal 
    WHERE id = auth.uid() AND role = 'super_admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users_internal 
    WHERE id = auth.uid() AND role = 'super_admin'
  )
);

-- Garantir que a leitura continue pública/para todos os autenticados
DROP POLICY IF EXISTS "system_plans_read_policy" ON system_plans;
CREATE POLICY "system_plans_read_policy" ON system_plans 
FOR SELECT 
USING (true);
