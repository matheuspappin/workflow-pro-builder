-- Migration 124: Planos anuais com desconto
-- Adiciona billing_interval, price_annual e annual_discount_percent para oferta mensal vs anual.

-- system_plans
ALTER TABLE system_plans ADD COLUMN IF NOT EXISTS billing_interval VARCHAR(20) DEFAULT 'monthly'
  CHECK (billing_interval IN ('monthly', 'yearly'));
ALTER TABLE system_plans ADD COLUMN IF NOT EXISTS price_annual DECIMAL(10,2);
ALTER TABLE system_plans ADD COLUMN IF NOT EXISTS annual_discount_percent INTEGER DEFAULT 17
  CHECK (annual_discount_percent >= 0 AND annual_discount_percent <= 50);

COMMENT ON COLUMN system_plans.billing_interval IS 'Intervalo de cobrança: monthly (padrão) ou yearly';
COMMENT ON COLUMN system_plans.price_annual IS 'Preço anual em BRL. Se null, calcula price * 12 * (1 - annual_discount_percent/100)';
COMMENT ON COLUMN system_plans.annual_discount_percent IS 'Desconto % no plano anual (ex: 17 = ~2 meses grátis)';

-- verticalization_plans
ALTER TABLE verticalization_plans ADD COLUMN IF NOT EXISTS billing_interval VARCHAR(20) DEFAULT 'monthly'
  CHECK (billing_interval IN ('monthly', 'yearly'));
ALTER TABLE verticalization_plans ADD COLUMN IF NOT EXISTS price_annual DECIMAL(10,2);
ALTER TABLE verticalization_plans ADD COLUMN IF NOT EXISTS annual_discount_percent INTEGER DEFAULT 17
  CHECK (annual_discount_percent >= 0 AND annual_discount_percent <= 50);

-- Atualizar preços anuais existentes (ex: Pro R$97/mês -> anual R$967 com 17% desc)
UPDATE system_plans SET
  price_annual = ROUND(price * 12 * (1 - COALESCE(annual_discount_percent, 17) / 100.0), 2),
  annual_discount_percent = COALESCE(annual_discount_percent, 17)
WHERE price > 0 AND (price_annual IS NULL OR price_annual = 0);

UPDATE verticalization_plans SET
  price_annual = ROUND(price * 12 * (1 - COALESCE(annual_discount_percent, 17) / 100.0), 2),
  annual_discount_percent = COALESCE(annual_discount_percent, 17)
WHERE price > 0 AND (price_annual IS NULL OR price_annual = 0);

-- Atualizar mark_studio_invoice_as_paid para suportar plano anual (subscription_ends_at +12 meses)
CREATE OR REPLACE FUNCTION mark_studio_invoice_as_paid(
  p_invoice_id UUID,
  p_plan_id VARCHAR(50),
  p_studio_id UUID,
  p_verticalization_plan_id UUID DEFAULT NULL,
  p_billing_interval VARCHAR(20) DEFAULT 'monthly'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_interval INTERVAL := INTERVAL '1 month';
BEGIN
  IF p_billing_interval = 'yearly' THEN
    v_interval := INTERVAL '12 months';
  END IF;

  -- 1. Marcar fatura como paga
  UPDATE studio_invoices
  SET status = 'paid', paid_at = NOW(),
      plan_id = COALESCE(plan_id, p_plan_id),
      verticalization_plan_id = COALESCE(verticalization_plan_id, p_verticalization_plan_id)
  WHERE id = p_invoice_id AND studio_id = p_studio_id;

  -- 2. Atualizar plano do estúdio
  UPDATE studios
  SET plan = p_plan_id,
      verticalization_plan_id = p_verticalization_plan_id,
      updated_at = NOW()
  WHERE id = p_studio_id;

  -- 3. Garantir subscription_status ativo (mensal ou anual)
  UPDATE studios
  SET subscription_status = 'active',
      subscription_ends_at = (CURRENT_DATE + v_interval)::timestamp with time zone
  WHERE id = p_studio_id;

  -- 4. Sincronizar enabled_modules com os módulos do plano (vertical ou system)
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
