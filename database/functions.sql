-- Workflow AI Functions for Attendance and Credits

-- 1. Confirm Attendance with Credit Deduction
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

-- 2. Enroll Student in Class (Used for Booking/Reserving)
-- Cria matrícula (enrollment) + reserva do dia (attendance) com QR único por aluno/aula/data
CREATE OR REPLACE FUNCTION enroll_student_in_class(
  p_student_id UUID,
  p_class_id UUID,
  p_studio_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_attendance_id UUID;
  v_today DATE := CURRENT_DATE;
  v_already_attendance_today BOOLEAN;
  v_has_credits BOOLEAN;
  v_expiry_date DATE;
BEGIN
  -- 1. Verificar se já tem reserva (attendance) para hoje nesta aula
  SELECT id INTO v_attendance_id
  FROM attendance
  WHERE student_id = p_student_id
    AND class_id = p_class_id
    AND date = v_today;

  IF v_attendance_id IS NOT NULL THEN
    -- Já tem reserva hoje: retorna o attendance_id existente para exibir o QR
    RETURN jsonb_build_object(
      'success', true,
      'message', 'Você já tem reserva para esta aula hoje. Apresente o QR Code na portaria.',
      'attendance_id', v_attendance_id
    );
  END IF;

  -- 2. Verificar créditos e validade
  SELECT (remaining_credits > 0), expiry_date INTO v_has_credits, v_expiry_date
  FROM student_lesson_credits
  WHERE student_id = p_student_id;

  IF v_has_credits IS NULL OR NOT v_has_credits THEN
    RETURN jsonb_build_object('success', false, 'message', 'Você não possui créditos disponíveis. Compre um pacote para reservar.');
  END IF;

  -- Verificação de Congelamento (Expiração)
  IF v_expiry_date IS NOT NULL AND v_expiry_date < CURRENT_DATE THEN
    RETURN jsonb_build_object('success', false, 'message', 'Seus créditos estão congelados pois sua mensalidade expirou. Por favor, renove seu plano.');
  END IF;

  -- 3. Garantir matrícula permanente (enrollment) — ON CONFLICT ignora se já existir
  INSERT INTO enrollments (studio_id, student_id, class_id, status)
  VALUES (p_studio_id, p_student_id, p_class_id, 'active')
  ON CONFLICT (studio_id, student_id, class_id) DO NOTHING;

  -- 4. Criar registro de presença do dia (QR único por aluno + aula + data)
  INSERT INTO attendance (
    studio_id, student_id, class_id, date, status
  ) VALUES (
    p_studio_id, p_student_id, p_class_id, v_today, 'confirmed'
  ) RETURNING id INTO v_attendance_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Matrícula realizada! Apresente o QR Code na portaria para validar sua presença.',
    'attendance_id', v_attendance_id
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$;

-- 3. Adjust Student Credits (Includes membership logic)
CREATE OR REPLACE FUNCTION adjust_student_credits(
  p_student_id UUID,
  p_studio_id UUID,
  p_amount INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_credits INTEGER;
  v_new_credits INTEGER;
  v_expiry_date DATE;
  v_credits_id UUID;
BEGIN
  -- 1. Buscar créditos atuais
  SELECT id, remaining_credits, expiry_date 
  INTO v_credits_id, v_current_credits, v_expiry_date
  FROM student_lesson_credits
  WHERE student_id = p_student_id AND studio_id = p_studio_id;

  -- 2. Calcular novos créditos e data de expiração
  IF v_credits_id IS NULL THEN
    -- Primeiro pacote do aluno
    v_new_credits := GREATEST(0, p_amount);
    
    -- Se for adição, define expiração para 1 mês a partir de hoje
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
    -- Atualização de créditos existentes
    v_new_credits := GREATEST(0, v_current_credits + p_amount);
    
    -- Se for adição de créditos (pagamento de nova mensalidade)
    IF p_amount > 0 THEN
      -- Se os créditos estavam congelados (expirados), a nova expiração é a partir de hoje
      -- Se ainda estavam válidos, o usuário quer que conte a partir de hoje (renovação)
      v_expiry_date := CURRENT_DATE + INTERVAL '1 month';
      
      UPDATE student_lesson_credits
      SET 
        remaining_credits = v_new_credits,
        total_credits = total_credits + p_amount,
        expiry_date = v_expiry_date,
        last_purchase_date = NOW(),
        updated_at = NOW()
      WHERE id = v_credits_id;
    ELSE
      -- Apenas remoção de créditos, não altera a data de expiração
      UPDATE student_lesson_credits
      SET 
        remaining_credits = v_new_credits,
        updated_at = NOW()
      WHERE id = v_credits_id;
    END IF;
  END IF;

  -- 3. Registrar no histórico de uso
  INSERT INTO student_credit_usage (
    studio_id, student_id, credits_used, usage_type, notes
  ) VALUES (
    p_studio_id, p_student_id, ABS(p_amount), 
    'manual_adjustment',
    CASE WHEN p_amount > 0 THEN 'Renovação de Mensalidade / Adição de Créditos' ELSE 'Ajuste Manual (Remoção)' END
  );

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Créditos ajustados com sucesso',
    'new_balance', v_new_credits,
    'expiry_date', v_expiry_date
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$;

-- 4. Get Last Attendance Date for a student
CREATE OR REPLACE FUNCTION get_last_attendance_date(p_student_id UUID)
RETURNS DATE
LANGUAGE plpgsql
AS $$
DECLARE
  last_date DATE;
BEGIN
  SELECT MAX(date) INTO last_date
  FROM attendance
  WHERE student_id = p_student_id;
  
  RETURN last_date;
END;
$$; 