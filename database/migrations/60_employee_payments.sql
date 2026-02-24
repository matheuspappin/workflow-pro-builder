-- 60. Pagamentos a funcionários (técnicos, engenheiros e afins) - Portal Financeiro

-- 60.1 Tabela employee_payments - registro de pagamentos realizados
CREATE TABLE IF NOT EXISTS employee_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
    professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
    reference_month VARCHAR(7) NOT NULL, -- YYYY-MM
    amount DECIMAL(10,2) NOT NULL,
    source_type VARCHAR(30) DEFAULT 'mixed' CHECK (source_type IN ('commission', 'salary', 'bonus', 'mixed', 'manual')),
    payment_method VARCHAR(50), -- pix, transferencia, etc.
    paid_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_employee_payments_studio ON employee_payments(studio_id);
CREATE INDEX IF NOT EXISTS idx_employee_payments_professional ON employee_payments(professional_id);
CREATE INDEX IF NOT EXISTS idx_employee_payments_reference ON employee_payments(reference_month);

-- RLS
ALTER TABLE employee_payments ENABLE ROW LEVEL SECURITY;

-- Policy: usuários com acesso ao estúdio ou super_admin
CREATE POLICY "employee_payments_finance_access" ON employee_payments FOR ALL USING (
    studio_id = (SELECT studio_id FROM users_internal WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM users_internal WHERE id = auth.uid() AND role = 'super_admin')
);
