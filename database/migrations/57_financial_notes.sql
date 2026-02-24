-- 57. Notas Fiscais (NF-e) - Tabela genérica para múltiplas fontes (OS, PDV, ERP)

-- 57.1 Tabela financial_notes - suporta service_orders, erp_orders e outros
CREATE TABLE IF NOT EXISTS financial_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
    source_type VARCHAR(30) NOT NULL CHECK (source_type IN ('service_order', 'erp_order', 'manual')),
    source_id UUID, -- ID da OS, pedido ERP, etc.
    invoice_number VARCHAR(50),
    access_key VARCHAR(44),
    pdf_url TEXT,
    xml_url TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'emitted', 'cancelled', 'error')),
    amount DECIMAL(10,2) NOT NULL,
    customer_data JSONB,
    api_response JSONB, -- Resposta da API de NF-e para debug
    error_message TEXT, -- Em caso de erro
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_financial_notes_studio ON financial_notes(studio_id);
CREATE INDEX IF NOT EXISTS idx_financial_notes_source ON financial_notes(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_financial_notes_status ON financial_notes(status);

ALTER TABLE financial_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "financial_notes_studio_isolation" ON financial_notes FOR ALL USING (
    studio_id IN (SELECT studio_id FROM users_internal WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM users_internal WHERE id = auth.uid() AND role = 'super_admin')
);
