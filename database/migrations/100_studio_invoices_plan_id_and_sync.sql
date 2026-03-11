-- 100. Adiciona plan_id em studio_invoices e RPC para sincronizar plano a partir da última fatura paga
-- Corrige: "plano não foi sincronizado corretamente" - permite recuperar plano da fatura paga

-- 1. Adicionar coluna plan_id em studio_invoices (para rastrear qual plano cada fatura representa)
ALTER TABLE studio_invoices ADD COLUMN IF NOT EXISTS plan_id VARCHAR(50);

-- 2. Atualizar create_studio_invoice para aceitar e armazenar plan_id
CREATE OR REPLACE FUNCTION create_studio_invoice(
  p_studio_id UUID,
  p_amount DECIMAL,
  p_currency VARCHAR(3) DEFAULT 'BRL',
  p_due_date DATE DEFAULT (CURRENT_DATE + INTERVAL '7 days'),
  p_plan_id VARCHAR(50) DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO studio_invoices (studio_id, amount, currency, due_date, status, plan_id)
  VALUES (p_studio_id, p_amount, p_currency, p_due_date, 'pending', p_plan_id)
  RETURNING studio_invoices.id INTO v_id;

  RETURN jsonb_build_object('id', v_id);
END;
$$;

-- 3. Atualizar mark_studio_invoice_as_paid para também gravar plan_id na fatura (consistência)
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
  -- 1. Marcar fatura como paga e registrar plan_id
  UPDATE studio_invoices
  SET status = 'paid', paid_at = NOW(), plan_id = COALESCE(plan_id, p_plan_id)
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

-- 4. Nova RPC: sincronizar plano do estúdio a partir da última fatura paga
-- Útil quando webhook/verify falharam e o plano exibido não bate com as faturas
CREATE OR REPLACE FUNCTION sync_studio_plan_from_latest_invoice(p_studio_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_invoice RECORD;
  v_plan_id VARCHAR(50);
BEGIN
  -- Buscar última fatura paga com plan_id preenchido
  SELECT id, plan_id, amount
  INTO v_invoice
  FROM studio_invoices
  WHERE studio_id = p_studio_id
    AND status = 'paid'
    AND plan_id IS NOT NULL
  ORDER BY paid_at DESC NULLS LAST, due_date DESC
  LIMIT 1;

  IF v_invoice.id IS NULL THEN
    -- Tentar última fatura paga mesmo sem plan_id (derivar pelo valor)
    SELECT id, plan_id, amount
    INTO v_invoice
    FROM studio_invoices
    WHERE studio_id = p_studio_id AND status = 'paid'
    ORDER BY paid_at DESC NULLS LAST, due_date DESC
    LIMIT 1;

    IF v_invoice.id IS NULL THEN
      RETURN jsonb_build_object('success', false, 'message', 'Nenhuma fatura paga encontrada');
    END IF;

    -- Se plan_id está vazio, derivar do system_plans pelo amount (tolerância 0.50 para arredondamento)
    SELECT id INTO v_plan_id
    FROM system_plans
    WHERE status = 'active'
      AND price > 0
      AND ABS(COALESCE(price, 0)::numeric - COALESCE(v_invoice.amount, 0)::numeric) < 0.50
    ORDER BY ABS(COALESCE(price, 0)::numeric - COALESCE(v_invoice.amount, 0)::numeric) ASC
    LIMIT 1;

    IF v_plan_id IS NULL THEN
      RETURN jsonb_build_object('success', false, 'message', 'Não foi possível identificar o plano pela fatura. Valor da fatura: ' || COALESCE(v_invoice.amount::text, 'null'));
    END IF;
  ELSE
    v_plan_id := v_invoice.plan_id;
  END IF;

  -- Atualizar estúdio
  UPDATE studios
  SET plan = v_plan_id, updated_at = NOW(),
      subscription_status = 'active',
      subscription_ends_at = (CURRENT_DATE + INTERVAL '1 month')::timestamp with time zone
  WHERE id = p_studio_id;

  -- Atualizar plan_id na fatura se estava vazio
  UPDATE studio_invoices
  SET plan_id = v_plan_id
  WHERE id = v_invoice.id AND (plan_id IS NULL OR plan_id = '');

  RETURN jsonb_build_object('success', true, 'plan_id', v_plan_id, 'message', 'Plano sincronizado com sucesso');
END;
$$;
