-- Migration 104: Fluxo completo de pagamento do professor (DanceFlow)
-- Para cada aula dada: gera valor congelado → estúdio libera → professor saca via PIX

-- 104.1 Configuração de compensação por estúdio (valor por aula)
-- Armazenado em organization_settings.theme_config ou studio_settings
-- Usamos organization_settings para DanceFlow (já tem theme_config)
-- Adiciona teacher_compensation_amount e teacher_compensation_overrides em theme_config
-- (não precisa de nova tabela - usa JSONB existente)

-- 104.2 Tabela teacher_payment_entries - lançamentos por aula
CREATE TABLE IF NOT EXISTS teacher_payment_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
  class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
  class_name VARCHAR(255),
  scheduled_date DATE NOT NULL,
  amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'released', 'withdrawn', 'cancelled')),
  released_at TIMESTAMP WITH TIME ZONE,
  released_by UUID REFERENCES auth.users(id),
  withdrawal_id UUID, -- FK para teacher_withdrawals (adicionada após criar a tabela)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(studio_id, professional_id, session_id)
);

CREATE INDEX IF NOT EXISTS idx_teacher_payment_entries_studio ON teacher_payment_entries(studio_id);
CREATE INDEX IF NOT EXISTS idx_teacher_payment_entries_professional ON teacher_payment_entries(professional_id);
CREATE INDEX IF NOT EXISTS idx_teacher_payment_entries_status ON teacher_payment_entries(status);
CREATE INDEX IF NOT EXISTS idx_teacher_payment_entries_scheduled_date ON teacher_payment_entries(scheduled_date);

-- 104.3 Tabela teacher_payout_settings - PIX do professor
CREATE TABLE IF NOT EXISTS teacher_payout_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE UNIQUE,
  pix_key VARCHAR(255) NOT NULL,
  pix_key_type VARCHAR(20) NOT NULL CHECK (pix_key_type IN ('cpf', 'cnpj', 'email', 'phone', 'random')),
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_teacher_payout_settings_professional ON teacher_payout_settings(professional_id);

-- 104.4 Tabela teacher_withdrawals - saques realizados
CREATE TABLE IF NOT EXISTS teacher_withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  pix_key VARCHAR(255) NOT NULL,
  pix_key_type VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  failure_reason TEXT,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_teacher_withdrawals_professional ON teacher_withdrawals(professional_id);
CREATE INDEX IF NOT EXISTS idx_teacher_withdrawals_studio ON teacher_withdrawals(studio_id);
CREATE INDEX IF NOT EXISTS idx_teacher_withdrawals_status ON teacher_withdrawals(status);

-- 104.5 FK de withdrawal em entries (teacher_withdrawals já criada)
ALTER TABLE teacher_payment_entries
  DROP CONSTRAINT IF EXISTS fk_teacher_payment_entries_withdrawal;
ALTER TABLE teacher_payment_entries
  ADD CONSTRAINT fk_teacher_payment_entries_withdrawal
  FOREIGN KEY (withdrawal_id) REFERENCES teacher_withdrawals(id) ON DELETE SET NULL;

-- 104.6 RLS
ALTER TABLE teacher_payment_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_payout_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_withdrawals ENABLE ROW LEVEL SECURITY;

-- Studio admin/finance: acesso total aos entries e withdrawals do seu estúdio
CREATE POLICY "teacher_payment_entries_studio" ON teacher_payment_entries FOR ALL USING (
  studio_id IN (
    SELECT studio_id FROM users_internal WHERE id = auth.uid()
    UNION
    SELECT studio_id::uuid FROM professionals WHERE user_id = auth.uid() AND studio_id IS NOT NULL
  )
  OR EXISTS (SELECT 1 FROM users_internal WHERE id = auth.uid() AND role = 'super_admin')
);

CREATE POLICY "teacher_payout_settings_own" ON teacher_payout_settings FOR ALL USING (
  professional_id IN (SELECT id FROM professionals WHERE user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM users_internal WHERE id = auth.uid() AND role = 'super_admin')
);

CREATE POLICY "teacher_withdrawals_studio" ON teacher_withdrawals FOR ALL USING (
  studio_id IN (
    SELECT studio_id FROM users_internal WHERE id = auth.uid()
    UNION
    SELECT studio_id::uuid FROM professionals WHERE user_id = auth.uid() AND studio_id IS NOT NULL
  )
  OR EXISTS (SELECT 1 FROM users_internal WHERE id = auth.uid() AND role = 'super_admin')
);

-- 104.7 Trigger updated_at
CREATE TRIGGER update_teacher_payment_entries_updated_at
  BEFORE UPDATE ON teacher_payment_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_teacher_payout_settings_updated_at
  BEFORE UPDATE ON teacher_payout_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_teacher_withdrawals_updated_at
  BEFORE UPDATE ON teacher_withdrawals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 104.8 Garantir que sessions tem coluna date (alguns ambientes usam scheduled_date)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sessions' AND column_name = 'date') THEN
    ALTER TABLE sessions ADD COLUMN date DATE;
    UPDATE sessions SET date = scheduled_date WHERE date IS NULL;
  END IF;
END $$;

-- 104.9 Função: criar teacher_payment_entry quando sessão é marcada como realizada
CREATE OR REPLACE FUNCTION create_teacher_payment_on_session_completed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_professional_id UUID;
  v_class_name VARCHAR(255);
  v_amount DECIMAL(10,2);
  v_config JSONB;
  v_override DECIMAL(10,2);
  v_sched_date DATE;
BEGIN
  -- Só dispara quando status muda para realizada
  IF NEW.status <> 'realizada' OR (OLD.status = 'realizada' AND NEW.status = 'realizada') THEN
    RETURN NEW;
  END IF;

  -- Professor: session.actual_professional_id ou class.professional_id
  v_professional_id := COALESCE(NEW.actual_professional_id, (
    SELECT professional_id FROM classes WHERE id = NEW.class_id
  ));

  IF v_professional_id IS NULL THEN
    RETURN NEW; -- Sem professor vinculado, não gera pagamento
  END IF;

  -- Data da aula
  v_sched_date := COALESCE(NEW.date, NEW.scheduled_date);

  -- Buscar valor em organization_settings.theme_config (DanceFlow)
  SELECT theme_config INTO v_config
  FROM organization_settings
  WHERE studio_id = NEW.studio_id AND (niche = 'dance' OR niche IS NULL)
  ORDER BY CASE WHEN niche = 'dance' THEN 0 ELSE 1 END
  LIMIT 1;

  v_amount := COALESCE((v_config->>'teacher_compensation_amount')::DECIMAL, 0);

  -- Override por professor
  IF v_config ? 'teacher_compensation_overrides' THEN
    v_override := (v_config->'teacher_compensation_overrides'->>v_professional_id::text)::DECIMAL;
    IF v_override IS NOT NULL THEN
      v_amount := v_override;
    END IF;
  END IF;

  IF v_amount <= 0 THEN
    RETURN NEW; -- Valor zero = não gera entrada
  END IF;

  -- Nome da turma
  SELECT name INTO v_class_name FROM classes WHERE id = NEW.class_id;

  -- Inserir entrada (ON CONFLICT ignora se já existir)
  INSERT INTO teacher_payment_entries (
    studio_id, professional_id, session_id, class_id, class_name,
    scheduled_date, amount, status
  ) VALUES (
    NEW.studio_id, v_professional_id, NEW.id, NEW.class_id, v_class_name,
    v_sched_date, v_amount, 'pending'
  )
  ON CONFLICT (studio_id, professional_id, session_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_create_teacher_payment_on_session ON sessions;
CREATE TRIGGER trg_create_teacher_payment_on_session
  AFTER UPDATE OF status ON sessions
  FOR EACH ROW
  EXECUTE FUNCTION create_teacher_payment_on_session_completed();

-- 104.10 RPC: liberar pagamentos em lote (estúdio)
CREATE OR REPLACE FUNCTION release_teacher_payments(
  p_entry_ids UUID[],
  p_released_by UUID DEFAULT auth.uid()
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INT;
BEGIN
  UPDATE teacher_payment_entries
  SET status = 'released', released_at = NOW(), released_by = p_released_by
  WHERE id = ANY(p_entry_ids)
    AND status = 'pending';

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN jsonb_build_object('success', true, 'released_count', v_count);
END;
$$;

-- 104.11 RPC: solicitar saque (professor)
CREATE OR REPLACE FUNCTION request_teacher_withdrawal(
  p_professional_id UUID,
  p_amount DECIMAL,
  p_pix_key VARCHAR,
  p_pix_key_type VARCHAR
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_available DECIMAL;
  v_studio_id UUID;
  v_withdrawal_id UUID;
BEGIN
  -- Validar que o professor tem saldo liberado suficiente
  SELECT COALESCE(SUM(amount), 0), MAX(studio_id) INTO v_available, v_studio_id
  FROM teacher_payment_entries
  WHERE professional_id = p_professional_id AND status = 'released';

  IF v_available < p_amount OR p_amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Saldo insuficiente ou valor inválido');
  END IF;

  IF v_studio_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Estúdio não encontrado');
  END IF;

  -- Criar withdrawal
  INSERT INTO teacher_withdrawals (professional_id, studio_id, amount, pix_key, pix_key_type, status)
  VALUES (p_professional_id, v_studio_id, p_amount, p_pix_key, p_pix_key_type, 'pending')
  RETURNING id INTO v_withdrawal_id;

  -- Marcar entries como withdrawn (FIFO - as mais antigas primeiro)
  -- Inclui entries até a soma cumulativa >= p_amount
  UPDATE teacher_payment_entries e
  SET status = 'withdrawn', withdrawal_id = v_withdrawal_id
  WHERE e.id IN (
    SELECT id FROM (
      SELECT id, amount, SUM(amount) OVER (ORDER BY scheduled_date ASC, created_at ASC) as running_sum
      FROM teacher_payment_entries
      WHERE professional_id = p_professional_id AND status = 'released'
    ) sub
    WHERE running_sum - amount < p_amount  -- esta entry contribui para atingir p_amount
  );

  RETURN jsonb_build_object('success', true, 'withdrawal_id', v_withdrawal_id);
END;
$$;
