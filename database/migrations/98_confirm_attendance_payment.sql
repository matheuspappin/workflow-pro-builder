-- 98. Inserir cobrança ao confirmar presença com crédito (scanner)
-- Atualiza confirm_attendance_with_credit para registrar cobrança no financeiro

CREATE OR REPLACE FUNCTION confirm_attendance_with_credit(
  p_attendance_id UUID,
  p_admin_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_student_id UUID;
  v_studio_id UUID;
  v_class_id UUID;
  v_session_id UUID;
  v_remaining_credits INTEGER;
  v_expiry_date DATE;
  v_student_name TEXT;
  v_class_name TEXT;
  v_new_balance INTEGER;
  v_status TEXT;
BEGIN
  -- 1. Obter dados da presença
  SELECT 
    a.student_id, a.studio_id, a.class_id, a.session_id, a.status,
    s.name as student_name, c.name as class_name
  INTO 
    v_student_id, v_studio_id, v_class_id, v_session_id, v_status,
    v_student_name, v_class_name
  FROM attendance a
  JOIN students s ON s.id = a.student_id
  JOIN classes c ON c.id = a.class_id
  WHERE a.id = p_attendance_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Presença não encontrada');
  END IF;

  IF v_status = 'present' THEN
    RETURN jsonb_build_object('success', false, 'message', 'Esta presença já foi validada.');
  END IF;

  -- 2. Verificar créditos
  SELECT remaining_credits, expiry_date INTO v_remaining_credits, v_expiry_date
  FROM student_lesson_credits
  WHERE student_id = v_student_id;

  IF v_remaining_credits IS NULL OR v_remaining_credits <= 0 THEN
    RETURN jsonb_build_object('success', false, 'message', 'Aluno sem créditos suficientes');
  END IF;

  -- Verificação de Congelamento (Expiração)
  IF v_expiry_date IS NOT NULL AND v_expiry_date < CURRENT_DATE THEN
    RETURN jsonb_build_object('success', false, 'message', 'Créditos congelados. A mensalidade deste aluno expirou em ' || TO_CHAR(v_expiry_date, 'DD/MM/YYYY') || '.');
  END IF;

  -- 3. Atualizar Presença
  UPDATE attendance
  SET status = 'present', updated_at = NOW()
  WHERE id = p_attendance_id;

  -- 4. Debitar Crédito
  UPDATE student_lesson_credits
  SET remaining_credits = remaining_credits - 1, updated_at = NOW()
  WHERE student_id = v_student_id
  RETURNING remaining_credits INTO v_new_balance;

  -- 5. Registrar Uso do Crédito
  INSERT INTO student_credit_usage (
    studio_id, student_id, class_id, session_id, credits_used, usage_type, notes
  ) VALUES (
    v_studio_id, v_student_id, v_class_id, v_session_id, 1, 'class_attendance', 'Validado via Scanner Portaria'
  );

  -- 6. Registrar cobrança no financeiro (uso de crédito em aula)
  INSERT INTO payments (
    studio_id, student_id, amount, due_date, payment_date, status,
    payment_method, reference_month, description, payment_source, reference_id, credits_used
  ) VALUES (
    v_studio_id, v_student_id, 0, CURRENT_DATE, CURRENT_DATE, 'paid',
    'credit', TO_CHAR(NOW(), 'YYYY-MM'), 'Aula: ' || v_class_name,
    'credit_usage', v_class_id, 1
  );

  -- 7. Retornar Sucesso
  RETURN jsonb_build_object(
    'success', true,
    'student_name', v_student_name,
    'class_name', v_class_name,
    'new_balance', v_new_balance
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$;
