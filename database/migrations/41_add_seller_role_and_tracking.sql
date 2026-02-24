-- 41. Adicionar Papel de Vendedor e Vínculos de Clientes/OS
-- Este script adiciona suporte ao portal do vendedor no ecossistema.

-- 1. Atualizar a restrição de role na tabela users_internal
ALTER TABLE users_internal DROP CONSTRAINT users_internal_role_check;
ALTER TABLE users_internal ADD CONSTRAINT users_internal_role_check 
CHECK (role IN ('super_admin', 'admin', 'professional', 'receptionist', 'seller'));

-- 2. Adicionar seller_id na tabela de alunos (students) para vincular clientes aos vendedores
ALTER TABLE students ADD COLUMN IF NOT EXISTS seller_id UUID REFERENCES users_internal(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_students_seller ON students(seller_id);

-- 3. Adicionar seller_id na tabela de ordens de serviço (service_orders) para rastreio de vendas
ALTER TABLE service_orders ADD COLUMN IF NOT EXISTS seller_id UUID REFERENCES users_internal(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_service_orders_seller ON service_orders(seller_id);

-- 4. Atualizar RLS para permitir que vendedores vejam seus próprios dados
-- Vendedores podem ver alunos que eles cadastraram
CREATE POLICY "seller_view_own_students" ON students 
FOR SELECT USING (seller_id = auth.uid());

CREATE POLICY "seller_manage_own_students" ON students 
FOR ALL USING (seller_id = auth.uid());

-- Vendedores podem ver e criar OS que eles geraram
CREATE POLICY "seller_view_own_orders" ON service_orders 
FOR SELECT USING (seller_id = auth.uid());

CREATE POLICY "seller_manage_own_orders" ON service_orders 
FOR ALL USING (seller_id = auth.uid());
