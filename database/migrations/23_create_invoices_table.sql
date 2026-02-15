-- Tabela para persistir Notas Fiscais
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES erp_orders(id) ON DELETE CASCADE,
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    access_key VARCHAR(44), -- Chave de acesso da NFe (44 dígitos)
    pdf_url TEXT,
    xml_url TEXT,
    status VARCHAR(20) DEFAULT 'emitted' CHECK (status IN ('emitted', 'cancelled', 'error')),
    amount DECIMAL(10,2) NOT NULL,
    customer_data JSONB, -- Cópia dos dados do cliente no momento da emissão
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar índices
CREATE INDEX IF NOT EXISTS idx_invoices_studio_id ON invoices(studio_id);
CREATE INDEX IF NOT EXISTS idx_invoices_order_id ON invoices(order_id);

-- RLS
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own studio invoices" ON invoices
    FOR SELECT USING (auth.uid() IN (
        SELECT id FROM users_internal WHERE studio_id = invoices.studio_id
    ));
