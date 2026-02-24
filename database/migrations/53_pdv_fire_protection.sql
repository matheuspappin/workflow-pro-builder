-- 53. PDV Fire Protection: Campos de venda, catálogo e portal do vendedor

-- 53.1 Campos adicionais em service_orders para transações de PDV
ALTER TABLE service_orders ADD COLUMN IF NOT EXISTS seller_id UUID REFERENCES professionals(id) ON DELETE SET NULL;
ALTER TABLE service_orders ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE service_orders ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);
ALTER TABLE service_orders ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'pending'
  CHECK (payment_status IN ('pending', 'paid', 'partial', 'cancelled'));
ALTER TABLE service_orders ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE service_orders ADD COLUMN IF NOT EXISTS change_amount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE service_orders ADD COLUMN IF NOT EXISTS amount_paid DECIMAL(10,2) DEFAULT 0;

-- 53.2 Catálogo de produtos padrão Fire Protection (se não existirem)
-- Estes são criados pela plataforma ao ativar a solução; cada studio poderá personalizar

-- 53.3 Campos de categoria em produtos (para filtrar no PDV)
ALTER TABLE products ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'Geral';
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 53.4 Campos de categoria em serviços
ALTER TABLE services ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'Geral';
ALTER TABLE services ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 53.5 Índices de performance para PDV
CREATE INDEX IF NOT EXISTS idx_service_orders_seller ON service_orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_service_orders_payment_status ON service_orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_services_category ON services(category);
