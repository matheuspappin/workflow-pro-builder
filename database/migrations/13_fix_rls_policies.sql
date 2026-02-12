
-- 1. Função auxiliar para obter o studio_id do usuário atual
CREATE OR REPLACE FUNCTION get_auth_studio_id()
RETURNS UUID AS $$
DECLARE
  v_studio_id UUID;
  v_role VARCHAR;
BEGIN
  -- Verifica se é Super Admin (acesso total)
  SELECT role INTO v_role FROM users_internal WHERE id = auth.uid();
  IF v_role = 'super_admin' THEN
    RETURN NULL; -- Retorna NULL para indicar que não deve filtrar por estúdio (lógica na policy)
  END IF;

  -- Busca em users_internal
  SELECT studio_id INTO v_studio_id
  FROM users_internal
  WHERE id = auth.uid();
  
  IF v_studio_id IS NOT NULL THEN
    RETURN v_studio_id;
  END IF;

  -- Busca em professionals
  SELECT studio_id INTO v_studio_id
  FROM professionals
  WHERE user_id = auth.uid();

  IF v_studio_id IS NOT NULL THEN
    RETURN v_studio_id;
  END IF;

  -- Busca em students
  SELECT studio_id INTO v_studio_id
  FROM students
  WHERE id = auth.uid();

  RETURN v_studio_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Função auxiliar para verificar se é Super Admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users_internal 
    WHERE id = auth.uid() AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Remover políticas antigas e inseguras
DROP POLICY IF EXISTS "studio_isolation_policy_students" ON students;
DROP POLICY IF EXISTS "studio_isolation_policy_users" ON users_internal;
DROP POLICY IF EXISTS "studio_isolation_policy_professionals" ON professionals;
DROP POLICY IF EXISTS "studio_isolation_policy_classes" ON classes;
DROP POLICY IF EXISTS "studio_isolation_policy_sessions" ON sessions;
DROP POLICY IF EXISTS "studio_isolation_policy_enrollments" ON enrollments;
DROP POLICY IF EXISTS "studio_isolation_policy_payments" ON payments;
DROP POLICY IF EXISTS "studio_isolation_policy_attendance" ON attendance;
DROP POLICY IF EXISTS "studio_isolation_policy_finances" ON professional_finances;
DROP POLICY IF EXISTS "studio_isolation_policy_gamif" ON gamifications;
DROP POLICY IF EXISTS "studio_isolation_policy_leads" ON lead_pipelines;
DROP POLICY IF EXISTS "studio_isolation_policy_settings" ON studio_settings;
DROP POLICY IF EXISTS "studio_isolation_policy_modalities" ON modalities;
DROP POLICY IF EXISTS "studio_isolation_policy_api_keys" ON studio_api_keys;
DROP POLICY IF EXISTS "studio_isolation_policy_wa_chats" ON whatsapp_chats;
DROP POLICY IF EXISTS "studio_isolation_policy_wa_messages" ON whatsapp_messages;
DROP POLICY IF EXISTS "studio_isolation_policy_packages" ON lesson_packages;
DROP POLICY IF EXISTS "studio_isolation_policy_credits" ON student_lesson_credits;
DROP POLICY IF EXISTS "studio_isolation_policy_usage" ON student_credit_usage;
DROP POLICY IF EXISTS "studio_isolation_policy_expenses" ON expenses;
DROP POLICY IF EXISTS "studio_isolation_policy_org_settings" ON organization_settings;

-- 4. Criar novas políticas seguras
-- A lógica é: (studio_id = get_auth_studio_id()) OR (is_super_admin())

CREATE POLICY "tenant_isolation_students" ON students FOR ALL 
USING (studio_id = get_auth_studio_id() OR is_super_admin());

CREATE POLICY "tenant_isolation_users" ON users_internal FOR ALL 
USING (studio_id = get_auth_studio_id() OR is_super_admin());

CREATE POLICY "tenant_isolation_professionals" ON professionals FOR ALL 
USING (studio_id = get_auth_studio_id() OR is_super_admin());

CREATE POLICY "tenant_isolation_classes" ON classes FOR ALL 
USING (studio_id = get_auth_studio_id() OR is_super_admin());

CREATE POLICY "tenant_isolation_sessions" ON sessions FOR ALL 
USING (studio_id = get_auth_studio_id() OR is_super_admin());

CREATE POLICY "tenant_isolation_enrollments" ON enrollments FOR ALL 
USING (studio_id = get_auth_studio_id() OR is_super_admin());

CREATE POLICY "tenant_isolation_payments" ON payments FOR ALL 
USING (studio_id = get_auth_studio_id() OR is_super_admin());

CREATE POLICY "tenant_isolation_attendance" ON attendance FOR ALL 
USING (studio_id = get_auth_studio_id() OR is_super_admin());

CREATE POLICY "tenant_isolation_finances" ON professional_finances FOR ALL 
USING (studio_id = get_auth_studio_id() OR is_super_admin());

CREATE POLICY "tenant_isolation_gamif" ON gamifications FOR ALL 
USING (studio_id = get_auth_studio_id() OR is_super_admin());

CREATE POLICY "tenant_isolation_leads" ON lead_pipelines FOR ALL 
USING (studio_id = get_auth_studio_id() OR is_super_admin());

CREATE POLICY "tenant_isolation_settings" ON studio_settings FOR ALL 
USING (studio_id = get_auth_studio_id() OR is_super_admin());

CREATE POLICY "tenant_isolation_modalities" ON modalities FOR ALL 
USING (studio_id = get_auth_studio_id() OR is_super_admin());

CREATE POLICY "tenant_isolation_api_keys" ON studio_api_keys FOR ALL 
USING (studio_id = get_auth_studio_id() OR is_super_admin());

CREATE POLICY "tenant_isolation_wa_chats" ON whatsapp_chats FOR ALL 
USING (studio_id = get_auth_studio_id() OR is_super_admin());

CREATE POLICY "tenant_isolation_wa_messages" ON whatsapp_messages FOR ALL 
USING (studio_id = get_auth_studio_id() OR is_super_admin());

CREATE POLICY "tenant_isolation_packages" ON lesson_packages FOR ALL 
USING (studio_id = get_auth_studio_id() OR is_super_admin());

CREATE POLICY "tenant_isolation_credits" ON student_lesson_credits FOR ALL 
USING (studio_id = get_auth_studio_id() OR is_super_admin());

CREATE POLICY "tenant_isolation_usage" ON student_credit_usage FOR ALL 
USING (studio_id = get_auth_studio_id() OR is_super_admin());

CREATE POLICY "tenant_isolation_expenses" ON expenses FOR ALL 
USING (studio_id = get_auth_studio_id() OR is_super_admin());

CREATE POLICY "tenant_isolation_org_settings" ON organization_settings FOR ALL 
USING (studio_id = get_auth_studio_id() OR is_super_admin());

-- Políticas para Produtos e ERP
-- (Assume que as tabelas products, erp_orders, inventory_transactions, suppliers, purchase_orders existem)

DROP POLICY IF EXISTS "studio_isolation_policy_products" ON products;
CREATE POLICY "tenant_isolation_products" ON products FOR ALL 
USING (studio_id = get_auth_studio_id() OR is_super_admin());

DROP POLICY IF EXISTS "studio_isolation_policy_erp_orders" ON erp_orders;
CREATE POLICY "tenant_isolation_erp_orders" ON erp_orders FOR ALL 
USING (studio_id = get_auth_studio_id() OR is_super_admin());

DROP POLICY IF EXISTS "studio_isolation_policy_inv_transactions" ON inventory_transactions;
CREATE POLICY "tenant_isolation_inv_transactions" ON inventory_transactions FOR ALL 
USING (studio_id = get_auth_studio_id() OR is_super_admin());

DROP POLICY IF EXISTS "studio_isolation_policy_suppliers" ON suppliers;
CREATE POLICY "tenant_isolation_suppliers" ON suppliers FOR ALL 
USING (studio_id = get_auth_studio_id() OR is_super_admin());

DROP POLICY IF EXISTS "studio_isolation_policy_purchase_orders" ON purchase_orders;
CREATE POLICY "tenant_isolation_purchase_orders" ON purchase_orders FOR ALL 
USING (studio_id = get_auth_studio_id() OR is_super_admin());
