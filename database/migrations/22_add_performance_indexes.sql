/* Adicionar Índices para otimização de performance */

-- studios --
-- Índice em owner_id para buscas por proprietário
CREATE INDEX IF NOT EXISTS studios_owner_id_idx ON public.studios (owner_id);
-- Índice em slug para buscas rápidas por URL do estúdio
CREATE UNIQUE INDEX IF NOT EXISTS studios_slug_key ON public.studios (slug);

-- partners --
-- Índice em user_id para buscar parceiro pelo ID do usuário
CREATE UNIQUE INDEX IF NOT EXISTS partners_user_id_key ON public.partners (user_id);

-- studio_invites --
-- Índice em token para buscar convites rapidamente
CREATE UNIQUE INDEX IF NOT EXISTS studio_invites_token_key ON public.studio_invites (token) WHERE used_at IS NULL;
-- Índice em studio_id para buscar convites de um estúdio específico
CREATE INDEX IF NOT EXISTS studio_invites_studio_id_idx ON public.studio_invites (studio_id);

-- users_internal (já deve ter índice em 'id' como PK, mas garantimos para 'role')
CREATE INDEX IF NOT EXISTS users_internal_role_idx ON public.users_internal (role);

-- organization_settings --
CREATE INDEX IF NOT EXISTS organization_settings_studio_id_idx ON public.organization_settings (studio_id);

-- integration_channels --
CREATE INDEX IF NOT EXISTS integration_channels_studio_id_idx ON public.integration_channels (studio_id);

-- products --
CREATE INDEX IF NOT EXISTS products_studio_id_name_idx ON public.products (studio_id, name);
CREATE INDEX IF NOT EXISTS products_studio_id_sku_idx ON public.products (studio_id, sku);

-- erp_orders --
CREATE INDEX IF NOT EXISTS erp_orders_studio_id_created_at_idx ON public.erp_orders (studio_id, created_at DESC);
CREATE INDEX IF NOT EXISTS erp_orders_studio_id_status_idx ON public.erp_orders (studio_id, status);

-- inventory_transactions --
CREATE INDEX IF NOT EXISTS inventory_transactions_studio_id_product_id_idx ON public.inventory_transactions (studio_id, product_id);
CREATE INDEX IF NOT EXISTS inventory_transactions_studio_id_created_at_idx ON public.inventory_transactions (studio_id, created_at DESC);

-- suppliers --
CREATE INDEX IF NOT EXISTS suppliers_studio_id_name_idx ON public.suppliers (studio_id, name);

-- purchase_orders --
CREATE INDEX IF NOT EXISTS purchase_orders_studio_id_created_at_idx ON public.purchase_orders (studio_id, created_at DESC);

-- leads --
CREATE INDEX IF NOT EXISTS leads_studio_id_status_created_at_idx ON public.leads (studio_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS leads_studio_id_id_idx ON public.leads (studio_id, id);

-- affiliate_payout_settings --
CREATE INDEX IF NOT EXISTS affiliate_payout_settings_user_id_idx ON public.affiliate_payout_settings (user_id);

-- billing (organization_settings e studios já estão cobertos, mas vamos adicionar para teachers)
-- teachers --
CREATE INDEX IF NOT EXISTS teachers_studio_id_user_id_idx ON public.teachers (studio_id, user_id);

-- FIM --
