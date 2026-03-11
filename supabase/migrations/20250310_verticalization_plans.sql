-- 102 + 103: Planos por verticalização + seed Fire Protection e AgroFlowAI
-- Cada vertical define seus próprios planos e preços

-- 1. Tabela de planos por verticalização
CREATE TABLE IF NOT EXISTS verticalization_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  verticalization_id UUID NOT NULL REFERENCES verticalizations(id) ON DELETE CASCADE,
  plan_id VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  description TEXT,
  features TEXT[] DEFAULT '{}',
  max_students INTEGER DEFAULT 10,
  max_teachers INTEGER DEFAULT 1,
  modules JSONB DEFAULT '{}',
  stripe_price_id VARCHAR(255),
  is_popular BOOLEAN DEFAULT false,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  trial_days INTEGER DEFAULT 14,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(verticalization_id, plan_id)
);

CREATE INDEX IF NOT EXISTS idx_verticalization_plans_vertical ON verticalization_plans(verticalization_id);
CREATE INDEX IF NOT EXISTS idx_verticalization_plans_status ON verticalization_plans(status);

-- 2. Colunas em studios e studio_invoices
ALTER TABLE studios ADD COLUMN IF NOT EXISTS verticalization_id UUID REFERENCES verticalizations(id) ON DELETE SET NULL;
ALTER TABLE studios ADD COLUMN IF NOT EXISTS verticalization_plan_id UUID REFERENCES verticalization_plans(id) ON DELETE SET NULL;
ALTER TABLE studio_invoices ADD COLUMN IF NOT EXISTS verticalization_plan_id UUID REFERENCES verticalization_plans(id) ON DELETE SET NULL;

-- 3. create_studio_invoice com verticalization_plan_id
CREATE OR REPLACE FUNCTION create_studio_invoice(
  p_studio_id UUID,
  p_amount DECIMAL,
  p_currency VARCHAR(3) DEFAULT 'BRL',
  p_due_date DATE DEFAULT (CURRENT_DATE + INTERVAL '7 days'),
  p_plan_id VARCHAR(50) DEFAULT NULL,
  p_verticalization_plan_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO studio_invoices (studio_id, amount, currency, due_date, status, plan_id, verticalization_plan_id)
  VALUES (p_studio_id, p_amount, p_currency, p_due_date, 'pending', p_plan_id, p_verticalization_plan_id)
  RETURNING studio_invoices.id INTO v_id;

  RETURN jsonb_build_object('id', v_id);
END;
$$;

-- 4. mark_studio_invoice_as_paid com verticalization_plan_id
CREATE OR REPLACE FUNCTION mark_studio_invoice_as_paid(
  p_invoice_id UUID,
  p_plan_id VARCHAR(50),
  p_studio_id UUID,
  p_verticalization_plan_id UUID DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE studio_invoices
  SET status = 'paid', paid_at = NOW(),
      plan_id = COALESCE(plan_id, p_plan_id),
      verticalization_plan_id = COALESCE(verticalization_plan_id, p_verticalization_plan_id)
  WHERE id = p_invoice_id AND studio_id = p_studio_id;

  UPDATE studios
  SET plan = p_plan_id,
      verticalization_plan_id = p_verticalization_plan_id,
      updated_at = NOW()
  WHERE id = p_studio_id;

  UPDATE studios
  SET subscription_status = 'active',
      subscription_ends_at = (CURRENT_DATE + INTERVAL '1 month')::timestamp with time zone
  WHERE id = p_studio_id;

  IF p_verticalization_plan_id IS NOT NULL THEN
    UPDATE organization_settings os
    SET enabled_modules = COALESCE(vp.modules, os.enabled_modules),
        updated_at = NOW()
    FROM verticalization_plans vp
    WHERE os.studio_id = p_studio_id
      AND vp.id = p_verticalization_plan_id
      AND vp.modules IS NOT NULL
      AND vp.modules != '{}'::jsonb;
  ELSE
    UPDATE organization_settings os
    SET enabled_modules = COALESCE(sp.modules, os.enabled_modules),
        updated_at = NOW()
    FROM system_plans sp
    WHERE os.studio_id = p_studio_id
      AND sp.id = p_plan_id
      AND sp.modules IS NOT NULL
      AND sp.modules != '{}'::jsonb;
  END IF;
END;
$$;

-- 5. sync_studio_plan_from_latest_invoice com verticalization_plans
CREATE OR REPLACE FUNCTION sync_studio_plan_from_latest_invoice(p_studio_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_invoice RECORD;
  v_plan_id VARCHAR(50);
  v_verticalization_plan_id UUID;
BEGIN
  SELECT id, plan_id, amount, verticalization_plan_id
  INTO v_invoice
  FROM studio_invoices
  WHERE studio_id = p_studio_id
    AND status = 'paid'
    AND (plan_id IS NOT NULL OR verticalization_plan_id IS NOT NULL)
  ORDER BY paid_at DESC NULLS LAST, due_date DESC
  LIMIT 1;

  IF v_invoice.id IS NULL THEN
    SELECT id, plan_id, amount, verticalization_plan_id
    INTO v_invoice
    FROM studio_invoices
    WHERE studio_id = p_studio_id AND status = 'paid'
    ORDER BY paid_at DESC NULLS LAST, due_date DESC
    LIMIT 1;

    IF v_invoice.id IS NULL THEN
      RETURN jsonb_build_object('success', false, 'message', 'Nenhuma fatura paga encontrada');
    END IF;
  END IF;

  IF v_invoice.verticalization_plan_id IS NOT NULL THEN
    SELECT vp.plan_id INTO v_plan_id
    FROM verticalization_plans vp
    WHERE vp.id = v_invoice.verticalization_plan_id;
    v_verticalization_plan_id := v_invoice.verticalization_plan_id;
  ELSIF v_invoice.plan_id IS NOT NULL THEN
    v_plan_id := v_invoice.plan_id;
    v_verticalization_plan_id := NULL;
  ELSE
    SELECT sp.id INTO v_plan_id
    FROM system_plans sp
    WHERE sp.status = 'active'
      AND sp.price > 0
      AND ABS(COALESCE(sp.price, 0)::numeric - COALESCE(v_invoice.amount, 0)::numeric) < 0.50
    ORDER BY ABS(COALESCE(sp.price, 0)::numeric - COALESCE(v_invoice.amount, 0)::numeric) ASC
    LIMIT 1;
    v_verticalization_plan_id := NULL;

    IF v_plan_id IS NULL THEN
      RETURN jsonb_build_object('success', false, 'message', 'Não foi possível identificar o plano pela fatura. Valor: ' || COALESCE(v_invoice.amount::text, 'null'));
    END IF;
  END IF;

  UPDATE studios
  SET plan = v_plan_id,
      verticalization_plan_id = v_verticalization_plan_id,
      updated_at = NOW(),
      subscription_status = 'active',
      subscription_ends_at = (CURRENT_DATE + INTERVAL '1 month')::timestamp with time zone
  WHERE id = p_studio_id;

  UPDATE studio_invoices
  SET plan_id = COALESCE(plan_id, v_plan_id),
      verticalization_plan_id = COALESCE(verticalization_plan_id, v_verticalization_plan_id)
  WHERE id = v_invoice.id;

  IF v_verticalization_plan_id IS NOT NULL THEN
    UPDATE organization_settings os
    SET enabled_modules = COALESCE(vp.modules, os.enabled_modules),
        updated_at = NOW()
    FROM verticalization_plans vp
    WHERE os.studio_id = p_studio_id
      AND vp.id = v_verticalization_plan_id
      AND vp.modules IS NOT NULL
      AND vp.modules != '{}'::jsonb;
  ELSE
    UPDATE organization_settings os
    SET enabled_modules = COALESCE(sp.modules, os.enabled_modules),
        updated_at = NOW()
    FROM system_plans sp
    WHERE os.studio_id = p_studio_id
      AND sp.id = v_plan_id
      AND sp.modules IS NOT NULL
      AND sp.modules != '{}'::jsonb;
  END IF;

  RETURN jsonb_build_object('success', true, 'plan_id', v_plan_id, 'message', 'Plano sincronizado com sucesso');
END;
$$;

-- 6. RLS para verticalization_plans
ALTER TABLE verticalization_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "verticalization_plans_read" ON verticalization_plans;
CREATE POLICY "verticalization_plans_read" ON verticalization_plans
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "verticalization_plans_super_admin" ON verticalization_plans;
CREATE POLICY "verticalization_plans_super_admin" ON verticalization_plans
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users_internal
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- 7. Seed: Fire Protection
INSERT INTO verticalization_plans (verticalization_id, plan_id, name, price, description, modules, max_students, max_teachers, is_popular, status, trial_days)
SELECT v.id, 'basico', 'Inspeção Básica', 97.00,
  'Para pequenas empresas de vistoria e manutenção de extintores',
  '{"dashboard":true,"students":true,"classes":true,"financial":true,"service_orders":true,"scanner":true}'::jsonb,
  50, 3, false, 'active', 14
FROM verticalizations v WHERE v.slug = 'fire-protection'
ON CONFLICT (verticalization_id, plan_id) DO NOTHING;

INSERT INTO verticalization_plans (verticalization_id, plan_id, name, price, description, modules, max_students, max_teachers, is_popular, status, trial_days)
SELECT v.id, 'pro', 'Inspeção Pro', 197.00,
  'Vistorias completas, gestão de técnicos e inventário',
  '{"dashboard":true,"students":true,"classes":true,"financial":true,"service_orders":true,"scanner":true,"inventory":true,"whatsapp":true}'::jsonb,
  200, 10, true, 'active', 14
FROM verticalizations v WHERE v.slug = 'fire-protection'
ON CONFLICT (verticalization_id, plan_id) DO NOTHING;

INSERT INTO verticalization_plans (verticalization_id, plan_id, name, price, description, modules, max_students, max_teachers, is_popular, status, trial_days)
SELECT v.id, 'enterprise', 'Inspeção Enterprise', 497.00,
  'Escalabilidade total, multi-unidades e suporte prioritário',
  '{"dashboard":true,"students":true,"classes":true,"financial":true,"service_orders":true,"scanner":true,"inventory":true,"whatsapp":true,"ai_chat":true,"leads":true,"multi_unit":true}'::jsonb,
  1000, 50, false, 'active', 14
FROM verticalizations v WHERE v.slug = 'fire-protection'
ON CONFLICT (verticalization_id, plan_id) DO NOTHING;

-- 8. Seed: AgroFlowAI
INSERT INTO verticalization_plans (verticalization_id, plan_id, name, price, description, modules, max_students, max_teachers, is_popular, status, trial_days)
SELECT v.id, 'starter', 'CAR Starter', 97.00,
  'Regularização CAR para pequenas áreas e propriedades',
  '{"dashboard":true,"students":true,"classes":true,"financial":true,"service_orders":true}'::jsonb,
  30, 2, false, 'active', 14
FROM verticalizations v WHERE v.slug = 'agroflowai'
ON CONFLICT (verticalization_id, plan_id) DO NOTHING;

INSERT INTO verticalization_plans (verticalization_id, plan_id, name, price, description, modules, max_students, max_teachers, is_popular, status, trial_days)
SELECT v.id, 'pro', 'CAR Pro', 197.00,
  'Laudos completos, licenciamento e monitoramento satelital',
  '{"dashboard":true,"students":true,"classes":true,"financial":true,"service_orders":true,"whatsapp":true,"leads":true}'::jsonb,
  100, 8, true, 'active', 14
FROM verticalizations v WHERE v.slug = 'agroflowai'
ON CONFLICT (verticalization_id, plan_id) DO NOTHING;

INSERT INTO verticalization_plans (verticalization_id, plan_id, name, price, description, modules, max_students, max_teachers, is_popular, status, trial_days)
SELECT v.id, 'enterprise', 'CAR Enterprise', 497.00,
  'Gestão completa, multi-unidades e IA para consultoria',
  '{"dashboard":true,"students":true,"classes":true,"financial":true,"service_orders":true,"whatsapp":true,"ai_chat":true,"leads":true,"multi_unit":true}'::jsonb,
  500, 30, false, 'active', 14
FROM verticalizations v WHERE v.slug = 'agroflowai'
ON CONFLICT (verticalization_id, plan_id) DO NOTHING;
