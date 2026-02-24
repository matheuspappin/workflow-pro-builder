-- 45. Distinguir papéis de profissionais (Técnico vs Engenheiro)
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS professional_type VARCHAR(20) DEFAULT 'technician' CHECK (professional_type IN ('technician', 'engineer', 'other'));

-- Comentário: technician = Técnico de Campo (QR Code, Coleta, Entrega)
-- engineer = Engenheiro (Assinatura de Laudos, Projetos PPCI)
