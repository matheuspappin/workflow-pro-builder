-- 43. Suporte a Documentos e Anexos em Ordens de Serviço (Projetos PPCI)

CREATE TABLE IF NOT EXISTS service_order_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
    service_order_id UUID NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    file_url TEXT NOT NULL,
    file_type VARCHAR(50), -- pdf, dwg, png, jpg, etc
    category VARCHAR(50) DEFAULT 'general', -- laudo, planta, art, certificado, outro
    uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE service_order_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "studio_isolation_documents" ON service_order_documents 
FOR ALL USING (studio_id = (SELECT studio_id FROM users_internal WHERE id = auth.uid()));

-- Índices
CREATE INDEX IF NOT EXISTS idx_so_documents_order ON service_order_documents(service_order_id);
CREATE INDEX IF NOT EXISTS idx_so_documents_studio ON service_order_documents(studio_id);

-- Trigger updated_at
CREATE TRIGGER update_service_order_documents_updated_at 
BEFORE UPDATE ON service_order_documents 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
