-- 114. PDV: Pagamento com créditos + suporte a créditos fracionários
-- Permite produtos de baixo valor (ex: água R$ 7 = 0,1 crédito) e novo usage_type pdv_product

-- 1. Créditos fracionários: alterar para NUMERIC(10,2)
ALTER TABLE student_lesson_credits 
  ALTER COLUMN remaining_credits TYPE NUMERIC(10,2) USING remaining_credits::NUMERIC(10,2),
  ALTER COLUMN total_credits TYPE NUMERIC(10,2) USING total_credits::NUMERIC(10,2);

-- 2. student_credit_usage: credits_used e usage_type pdv_product
ALTER TABLE student_credit_usage 
  ALTER COLUMN credits_used TYPE NUMERIC(10,2) USING credits_used::NUMERIC(10,2);

-- 3. Adicionar pdv_product ao CHECK de usage_type (se existir constraint)
DO $$
BEGIN
  ALTER TABLE student_credit_usage DROP CONSTRAINT IF EXISTS student_credit_usage_usage_type_check;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;
ALTER TABLE student_credit_usage ADD CONSTRAINT student_credit_usage_usage_type_check 
  CHECK (usage_type IN ('class_attendance', 'manual_adjustment', 'refund', 'pdv_product'));

-- 4. payments.credits_used: suportar fracionário
ALTER TABLE payments 
  ALTER COLUMN credits_used TYPE NUMERIC(10,2) USING credits_used::NUMERIC(10,2);

-- 5. Atualizar adjust_student_credits para NUMERIC (compatível com colunas alteradas)
CREATE OR REPLACE FUNCTION adjust_student_credits(
  p_student_id UUID,
  p_studio_id UUID,
  p_amount NUMERIC
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_credits NUMERIC(10,2);
  v_new_credits NUMERIC(10,2);
  v_expiry_date DATE;
  v_credits_id UUID;
BEGIN
  SELECT id, remaining_credits, expiry_date 
  INTO v_credits_id, v_current_credits, v_expiry_date
  FROM student_lesson_credits
  WHERE student_id = p_student_id AND studio_id = p_studio_id;

  IF v_credits_id IS NULL THEN
    v_new_credits := GREATEST(0, p_amount);
    IF p_amount > 0 THEN
      v_expiry_date := CURRENT_DATE + INTERVAL '1 month';
    ELSE
      v_expiry_date := NULL;
    END IF;
    INSERT INTO student_lesson_credits (
      studio_id, student_id, total_credits, remaining_credits, expiry_date, last_purchase_date
    ) VALUES (
      p_studio_id, p_student_id, v_new_credits, v_new_credits, v_expiry_date, NOW()
    ) RETURNING id INTO v_credits_id;
  ELSE
    v_new_credits := GREATEST(0, v_current_credits + p_amount);
    IF p_amount > 0 THEN
      v_expiry_date := CURRENT_DATE + INTERVAL '1 month';
      UPDATE student_lesson_credits
      SET remaining_credits = v_new_credits, total_credits = total_credits + p_amount,
          expiry_date = v_expiry_date, last_purchase_date = NOW(), updated_at = NOW()
      WHERE id = v_credits_id;
    ELSE
      UPDATE student_lesson_credits
      SET remaining_credits = v_new_credits, updated_at = NOW()
      WHERE id = v_credits_id;
    END IF;
  END IF;

  INSERT INTO student_credit_usage (studio_id, student_id, credits_used, usage_type, notes)
  VALUES (p_studio_id, p_student_id, ABS(p_amount), 'manual_adjustment',
    CASE WHEN p_amount > 0 THEN 'Renovação / Adição de Créditos' ELSE 'Ajuste Manual (Remoção)' END);

  RETURN jsonb_build_object('success', true, 'message', 'Créditos ajustados', 'new_balance', v_new_credits, 'expiry_date', v_expiry_date);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$;
