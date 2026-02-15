/* 27. Service Orders Module (Ordens de Serviço) */

-- 27.1 Services Catalog (Mão de Obra / Serviços Avulsos)
CREATE TABLE IF NOT EXISTS services (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) DEFAULT 0,
    duration_minutes INTEGER, -- Estimativa de tempo
    commission_rate DECIMAL(5,2) DEFAULT 0, -- % de comissão do técnico
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 27.2 Service Orders Header
CREATE TYPE service_order_status AS ENUM ('draft', 'open', 'in_progress', 'waiting_parts', 'finished', 'cancelled');

CREATE TABLE IF NOT EXISTS service_orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES students(id) ON DELETE SET NULL, -- Cliente/Aluno/Paciente
    professional_id UUID REFERENCES professionals(id) ON DELETE SET NULL, -- Técnico Responsável
    status service_order_status DEFAULT 'draft',
    
    -- Datas Importantes
    opened_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    scheduled_at TIMESTAMP WITH TIME ZONE,
    finished_at TIMESTAMP WITH TIME ZONE,
    
    -- Valores
    total_products DECIMAL(10,2) DEFAULT 0,
    total_services DECIMAL(10,2) DEFAULT 0,
    discount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) DEFAULT 0,
    
    -- Detalhes
    description TEXT, -- Problema relatado / Queixa principal
    observations TEXT, -- Diagnóstico / Laudo técnico
    private_notes TEXT, -- Notas internas
    
    -- Assinatura e Rastreio
    customer_signature_url TEXT,
    tracking_code VARCHAR(20) UNIQUE, -- Para o cliente consultar
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 27.3 Service Order Items (Products and Services)
CREATE TABLE IF NOT EXISTS service_order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
    service_order_id UUID NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
    
    -- Pode ser Produto ou Serviço
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    service_id UUID REFERENCES services(id) ON DELETE SET NULL,
    
    item_type VARCHAR(20) CHECK (item_type IN ('product', 'service')),
    description VARCHAR(255), -- Nome do item congelado no momento da venda
    
    quantity DECIMAL(10,2) DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT chk_item_reference CHECK (
        (item_type = 'product' AND product_id IS NOT NULL) OR 
        (item_type = 'service' AND service_id IS NOT NULL)
    )
);

-- 27.4 Service Order History (Audit Log)
CREATE TABLE IF NOT EXISTS service_order_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
    service_order_id UUID NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
    changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    previous_status service_order_status,
    new_status service_order_status,
    
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies

-- Enable RLS
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_order_history ENABLE ROW LEVEL SECURITY;

-- Studio Isolation Policies
CREATE POLICY "studio_isolation_services" ON services FOR ALL USING (studio_id IS NOT NULL);
CREATE POLICY "studio_isolation_orders" ON service_orders FOR ALL USING (studio_id IS NOT NULL);
CREATE POLICY "studio_isolation_order_items" ON service_order_items FOR ALL USING (studio_id IS NOT NULL);
CREATE POLICY "studio_isolation_order_history" ON service_order_history FOR ALL USING (studio_id IS NOT NULL);

-- Indexes for Performance
CREATE INDEX idx_services_studio ON services(studio_id);
CREATE INDEX idx_service_orders_studio ON service_orders(studio_id);
CREATE INDEX idx_service_orders_customer ON service_orders(customer_id);
CREATE INDEX idx_service_orders_professional ON service_orders(professional_id);
CREATE INDEX idx_service_orders_status ON service_orders(status);
CREATE INDEX idx_order_items_order ON service_order_items(service_order_id);
CREATE INDEX idx_order_history_order ON service_order_history(service_order_id);

-- Triggers for updated_at
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_service_orders_updated_at BEFORE UPDATE ON service_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to Generate Tracking Code on Insert
CREATE OR REPLACE FUNCTION generate_os_tracking_code()
RETURNS TRIGGER AS $$
BEGIN
    -- Gera um código tipo OS-YYYY-XXXX (Ex: OS-2024-A1B2)
    NEW.tracking_code := 'OS-' || TO_CHAR(NOW(), 'YYYY') || '-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_os_tracking_code
BEFORE INSERT ON service_orders
FOR EACH ROW
WHEN (NEW.tracking_code IS NULL)
EXECUTE FUNCTION generate_os_tracking_code();
