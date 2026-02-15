-- Tabela de Configuração do Negócio (Para transformar Workflow em TattooFlow, etc)
CREATE TABLE IF NOT EXISTS organization_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    studio_id UUID REFERENCES studios(id) ON DELETE CASCADE,
    business_type TEXT DEFAULT 'dance_school', -- 'tattoo_studio', 'gym', 'clinic'
    nomenclature JSONB DEFAULT '{"client": "Aluno", "service": "Aula", "professional": "Professor"}',
    theme_config JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(studio_id)
);

-- Tabela de Canais de Integração (ERP)
CREATE TABLE IF NOT EXISTS integration_channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    studio_id UUID REFERENCES studios(id) ON DELETE CASCADE,
    platform TEXT NOT NULL, -- 'mercadolivre', 'amazon', 'woocommerce', 'nuvemshop'
    name TEXT NOT NULL,
    api_key TEXT,
    api_secret TEXT,
    status TEXT DEFAULT 'inactive', -- 'active', 'error', 'syncing'
    last_sync TIMESTAMP WITH TIME ZONE,
    config JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Pedidos Unificados (ERP - Centraliza vendas físicas e online)
CREATE TABLE IF NOT EXISTS erp_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    studio_id UUID REFERENCES studios(id) ON DELETE CASCADE,
    channel_id UUID REFERENCES integration_channels(id),
    external_id TEXT, -- ID do pedido no ML/Amazon
    customer_name TEXT,
    customer_document TEXT,
    total_amount DECIMAL(10,2),
    status TEXT DEFAULT 'pending', -- 'pending', 'paid', 'shipped', 'delivered', 'cancelled'
    items JSONB, -- Array com itens do pedido
    shipping_info JSONB, -- Dados de rastreio
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Fornecedores (Suprimentos)
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    studio_id UUID REFERENCES studios(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    contact_name TEXT,
    email TEXT,
    phone TEXT,
    category TEXT, -- 'products', 'equipment', 'services'
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Ordens de Compra (B2B)
CREATE TABLE IF NOT EXISTS purchase_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    studio_id UUID REFERENCES studios(id) ON DELETE CASCADE,
    supplier_id UUID REFERENCES suppliers(id),
    status TEXT DEFAULT 'draft', -- 'draft', 'sent', 'received', 'cancelled'
    total_amount DECIMAL(10,2),
    expected_date DATE,
    items JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS (Segurança Multi-tenant)
ALTER TABLE organization_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
CREATE POLICY "Studio Isolation Settings" ON organization_settings USING (studio_id = auth.uid()::uuid);
CREATE POLICY "Studio Isolation Channels" ON integration_channels USING (studio_id = auth.uid()::uuid);
CREATE POLICY "Studio Isolation Orders" ON erp_orders USING (studio_id = auth.uid()::uuid);
CREATE POLICY "Studio Isolation Suppliers" ON suppliers USING (studio_id = auth.uid()::uuid);
CREATE POLICY "Studio Isolation POs" ON purchase_orders USING (studio_id = auth.uid()::uuid);
