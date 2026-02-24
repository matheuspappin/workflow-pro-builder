-- 51. Engenheiro: Aceite de Projetos e RLS para Profissionais

-- 51.1 Adicionar status pending_acceptance ao ENUM
ALTER TYPE service_order_status ADD VALUE IF NOT EXISTS 'pending_acceptance';

-- 51.2 Campos de aceite/rejeição do engenheiro
ALTER TABLE service_orders ADD COLUMN IF NOT EXISTS engineer_accepted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE service_orders ADD COLUMN IF NOT EXISTS engineer_rejected_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE service_orders ADD COLUMN IF NOT EXISTS engineer_rejection_reason TEXT;

-- 51.3 Campo de título amigável para o projeto
ALTER TABLE service_orders ADD COLUMN IF NOT EXISTS title VARCHAR(255);

-- 51.4 RLS: Engenheiro pode ler seus próprios projetos
DROP POLICY IF EXISTS "engineer_read_own_projects" ON service_orders;
CREATE POLICY "engineer_read_own_projects" ON service_orders
FOR SELECT USING (
    professional_id IN (
        SELECT id FROM professionals WHERE user_id = auth.uid()
    )
);

-- 51.5 RLS: Engenheiro pode atualizar status dos seus próprios projetos
DROP POLICY IF EXISTS "engineer_update_own_projects" ON service_orders;
CREATE POLICY "engineer_update_own_projects" ON service_orders
FOR UPDATE USING (
    professional_id IN (
        SELECT id FROM professionals WHERE user_id = auth.uid()
    )
);

-- 51.6 RLS: Engenheiro pode ler milestones dos seus projetos
DROP POLICY IF EXISTS "engineer_read_own_milestones" ON service_order_milestones;
CREATE POLICY "engineer_read_own_milestones" ON service_order_milestones
FOR SELECT USING (
    service_order_id IN (
        SELECT so.id FROM service_orders so
        JOIN professionals p ON p.id = so.professional_id
        WHERE p.user_id = auth.uid()
    )
);

-- 51.7 RLS: Engenheiro pode inserir/atualizar milestones dos seus projetos
DROP POLICY IF EXISTS "engineer_manage_own_milestones" ON service_order_milestones;
CREATE POLICY "engineer_manage_own_milestones" ON service_order_milestones
FOR ALL USING (
    service_order_id IN (
        SELECT so.id FROM service_orders so
        JOIN professionals p ON p.id = so.professional_id
        WHERE p.user_id = auth.uid()
    )
);

-- 51.8 Tabela de comentários/notas das ordens de serviço
CREATE TABLE IF NOT EXISTS service_order_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    studio_id UUID REFERENCES studios(id) ON DELETE CASCADE,
    service_order_id UUID NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    professional_id UUID REFERENCES professionals(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE service_order_comments ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_service_order_comments_order ON service_order_comments(service_order_id);
CREATE INDEX IF NOT EXISTS idx_service_order_comments_studio ON service_order_comments(studio_id);

-- 51.8 RLS: Engenheiro pode ler comentários dos seus projetos
DROP POLICY IF EXISTS "engineer_read_own_comments" ON service_order_comments;
CREATE POLICY "engineer_read_own_comments" ON service_order_comments
FOR SELECT USING (
    service_order_id IN (
        SELECT so.id FROM service_orders so
        JOIN professionals p ON p.id = so.professional_id
        WHERE p.user_id = auth.uid()
    )
);

-- 51.9 RLS: Engenheiro pode criar comentários nos seus projetos
DROP POLICY IF EXISTS "engineer_insert_own_comments" ON service_order_comments;
CREATE POLICY "engineer_insert_own_comments" ON service_order_comments
FOR INSERT WITH CHECK (
    service_order_id IN (
        SELECT so.id FROM service_orders so
        JOIN professionals p ON p.id = so.professional_id
        WHERE p.user_id = auth.uid()
    )
);

-- 51.10 RLS: Engenheiro pode ler documentos dos seus projetos
DROP POLICY IF EXISTS "engineer_read_own_documents" ON service_order_documents;
CREATE POLICY "engineer_read_own_documents" ON service_order_documents
FOR SELECT USING (
    service_order_id IN (
        SELECT so.id FROM service_orders so
        JOIN professionals p ON p.id = so.professional_id
        WHERE p.user_id = auth.uid()
    )
);

-- 51.11 RLS: Engenheiro pode inserir documentos nos seus projetos
DROP POLICY IF EXISTS "engineer_insert_own_documents" ON service_order_documents;
CREATE POLICY "engineer_insert_own_documents" ON service_order_documents
FOR INSERT WITH CHECK (
    service_order_id IN (
        SELECT so.id FROM service_orders so
        JOIN professionals p ON p.id = so.professional_id
        WHERE p.user_id = auth.uid()
    )
);

-- 51.12 Índices para performance
CREATE INDEX IF NOT EXISTS idx_service_orders_professional ON service_orders(professional_id);
CREATE INDEX IF NOT EXISTS idx_service_orders_status_professional ON service_orders(status, professional_id);
