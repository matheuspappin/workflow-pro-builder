-- Migration 119: Fila assíncrona para emissão de NF-e
-- Desacopla a emissão de NFe do fluxo síncrono do webhook Stripe.
-- O webhook registra na fila; um cron job /api/cron/process-nfe-queue processa.

CREATE TABLE IF NOT EXISTS nfe_emission_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  payload JSONB NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'done', 'failed', 'cancelled')),
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  last_error TEXT,
  -- Backoff exponencial: próxima tentativa após falha
  next_attempt_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_nfe_queue_pending
  ON nfe_emission_queue(next_attempt_at)
  WHERE status IN ('pending', 'failed') AND attempts < max_attempts;

CREATE INDEX IF NOT EXISTS idx_nfe_queue_studio
  ON nfe_emission_queue(studio_id, status);

ALTER TABLE nfe_emission_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_nfe_queue" ON nfe_emission_queue FOR ALL
  USING (studio_id = get_auth_studio_id() OR is_super_admin());

-- Função para enfileirar uma NFe (usada pelo webhook Stripe)
CREATE OR REPLACE FUNCTION enqueue_nfe_emission(
  p_studio_id UUID,
  p_invoice_id UUID,
  p_payload JSONB
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_queue_id UUID;
BEGIN
  INSERT INTO nfe_emission_queue (studio_id, invoice_id, payload, status, next_attempt_at)
  VALUES (p_studio_id, p_invoice_id, p_payload, 'pending', NOW())
  RETURNING id INTO v_queue_id;
  RETURN v_queue_id;
END;
$$;

-- Função atômica para "pegar" itens da fila (evita duplo processamento em concorrência)
-- Retorna os itens e os marca como 'processing' atomicamente.
CREATE OR REPLACE FUNCTION dequeue_nfe_batch(p_batch_size INTEGER DEFAULT 5)
RETURNS SETOF nfe_emission_queue
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  UPDATE nfe_emission_queue
  SET
    status = 'processing',
    attempts = attempts + 1,
    updated_at = NOW()
  WHERE id IN (
    SELECT id FROM nfe_emission_queue
    WHERE status IN ('pending', 'failed')
      AND attempts < max_attempts
      AND next_attempt_at <= NOW()
    ORDER BY created_at ASC
    LIMIT p_batch_size
    FOR UPDATE SKIP LOCKED
  )
  RETURNING *;
END;
$$;

-- Função para marcar como concluído ou com falha após processamento
CREATE OR REPLACE FUNCTION resolve_nfe_queue_item(
  p_queue_id UUID,
  p_success BOOLEAN,
  p_error TEXT DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_attempts INTEGER;
  v_max_attempts INTEGER;
BEGIN
  SELECT attempts, max_attempts INTO v_attempts, v_max_attempts
  FROM nfe_emission_queue WHERE id = p_queue_id;

  IF p_success THEN
    UPDATE nfe_emission_queue
    SET status = 'done', processed_at = NOW(), updated_at = NOW()
    WHERE id = p_queue_id;
  ELSE
    -- Backoff exponencial: 2^attempts minutos (1min, 2min, 4min)
    UPDATE nfe_emission_queue
    SET
      status = CASE WHEN v_attempts >= v_max_attempts THEN 'failed' ELSE 'pending' END,
      last_error = p_error,
      next_attempt_at = NOW() + (POWER(2, v_attempts) * INTERVAL '1 minute'),
      updated_at = NOW()
    WHERE id = p_queue_id;
  END IF;
END;
$$;

COMMENT ON TABLE nfe_emission_queue IS
  'Fila de emissão assíncrona de NF-e. '
  'Webhook Stripe → enfileira. Cron /api/cron/process-nfe-queue → processa em batch. '
  'Backoff exponencial em falhas, máximo 3 tentativas.';
