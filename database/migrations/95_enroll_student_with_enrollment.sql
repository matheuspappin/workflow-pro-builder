-- Migration 95: enroll_student_in_class cria enrollment + attendance
-- Garante que ao matricular, o aluno aparece em "Minhas Turmas" e recebe QR único para check-in

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
  v_has_credits BOOLEAN;
  v_expiry_date DATE;
BEGIN
  -- 1. Se já tem reserva (attendance) para hoje nesta aula, retorna o ID existente para exibir o QR
  SELECT id INTO v_attendance_id
  FROM attendance
  WHERE student_id = p_student_id
    AND class_id = p_class_id
    AND date = v_today;

  IF v_attendance_id IS NOT NULL THEN
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
