-- 44. Adicionar assinatura a documentos de OS
ALTER TABLE service_order_documents ADD COLUMN IF NOT EXISTS signed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE service_order_documents ADD COLUMN IF NOT EXISTS signed_by_id UUID REFERENCES auth.users(id);

-- Adicionar responsável a marcos de OS (Trabalho em Conjunto)
ALTER TABLE service_order_milestones ADD COLUMN IF NOT EXISTS assigned_professional_id UUID REFERENCES professionals(id);
