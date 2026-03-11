-- Studio Invoice RPCs for System Plan Checkout
-- Fixes: "Erro ao gerar fatura" - create_studio_invoice and mark_studio_invoice_as_paid were missing

-- 1. Ensure studio_invoices table exists (from system_plans.sql)
CREATE TABLE IF NOT EXISTS studio_invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'BRL',
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('paid', 'pending', 'overdue', 'cancelled')),
  due_date DATE NOT NULL,
  paid_at TIMESTAMP WITH TIME ZONE,
  stripe_invoice_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- RLS
ALTER TABLE studio_invoices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "studio_invoices_isolation_policy" ON studio_invoices;
CREATE POLICY "studio_invoices_isolation_policy" ON studio_invoices FOR ALL USING (studio_id IS NOT NULL);

-- 2. create_studio_invoice: inserts a pending invoice and returns { id } for the checkout route
CREATE OR REPLACE FUNCTION create_studio_invoice(
  p_studio_id UUID,
  p_amount DECIMAL,
  p_currency VARCHAR(3) DEFAULT 'BRL',
  p_due_date DATE DEFAULT (CURRENT_DATE + INTERVAL '7 days')
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO studio_invoices (studio_id, amount, currency, due_date, status)
  VALUES (p_studio_id, p_amount, p_currency, p_due_date, 'pending')
  RETURNING studio_invoices.id INTO v_id;

  RETURN jsonb_build_object('id', v_id);
END;
$$;

-- 3. mark_studio_invoice_as_paid: marks invoice paid and upgrades studio plan
CREATE OR REPLACE FUNCTION mark_studio_invoice_as_paid(
  p_invoice_id UUID,
  p_plan_id VARCHAR(50),
  p_studio_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 1. Marcar fatura como paga
  UPDATE studio_invoices
  SET status = 'paid', paid_at = NOW()
  WHERE id = p_invoice_id AND studio_id = p_studio_id;

  -- 2. Atualizar plano do estúdio
  UPDATE studios
  SET plan = p_plan_id, updated_at = NOW()
  WHERE id = p_studio_id;

  -- 3. Garantir subscription_status ativo
  UPDATE studios
  SET subscription_status = 'active',
      subscription_ends_at = (CURRENT_DATE + INTERVAL '1 month')::timestamp with time zone
  WHERE id = p_studio_id;
END;
$$;
