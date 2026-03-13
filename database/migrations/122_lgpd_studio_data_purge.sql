-- Migration 122: LGPD Art. 16 — Purge de dados de AI após churn de studio
-- Quando um studio cancela a assinatura e solicita exclusão, dados pessoais de AI devem
-- ser eliminados (embeddings, conversas, conhecimento aprendido) conforme LGPD Art. 16, I.
-- Dados anonimizados/agregados podem ser retidos para fins estatísticos (Art. 16, IV).

-- Tabela de solicitações de exclusão de dados (direito à portabilidade/exclusão - LGPD Art. 18)
CREATE TABLE IF NOT EXISTS studio_data_deletion_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL REFERENCES auth.users(id),
  reason TEXT,                                      -- motivo da solicitação
  status VARCHAR(20) NOT NULL DEFAULT 'pending'     -- pending | processing | completed | failed
    CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'), -- prazo legal: 30 dias
  completed_at TIMESTAMP WITH TIME ZONE,
  error_detail TEXT,
  -- Registro do que foi deletado (imutável para auditoria)
  deletion_log JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deletion_requests_studio ON studio_data_deletion_requests(studio_id);
CREATE INDEX IF NOT EXISTS idx_deletion_requests_status ON studio_data_deletion_requests(status)
  WHERE status IN ('pending', 'processing');
CREATE INDEX IF NOT EXISTS idx_deletion_requests_scheduled ON studio_data_deletion_requests(scheduled_for)
  WHERE status = 'pending';

ALTER TABLE studio_data_deletion_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "deletion_requests_admin_only" ON studio_data_deletion_requests;
CREATE POLICY "deletion_requests_admin_only" ON studio_data_deletion_requests
  FOR ALL USING (is_super_admin());

-- ─── Função de purge de dados AI por studio ────────────────────────────────────
-- Remove dados pessoais de AI mantendo apenas contagens anonimizadas para métricas.
-- Chamada pelo job de churn (CRON ou evento de webhook do Stripe).

CREATE OR REPLACE FUNCTION purge_studio_ai_data(
  p_studio_id UUID,
  p_request_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_deleted_knowledge INTEGER := 0;
  v_deleted_conversations INTEGER := 0;
  v_deleted_embeddings INTEGER := 0;
  v_deleted_consents INTEGER := 0;
  v_anonymized_interactions INTEGER := 0;
  v_log JSONB;
BEGIN
  -- 1. Deletar embeddings de knowledge (vetores com dados de conversas do studio)
  DELETE FROM ai_learned_knowledge
  WHERE studio_id = p_studio_id;
  GET DIAGNOSTICS v_deleted_knowledge = ROW_COUNT;

  -- 2. Deletar conversas de treinamento
  DELETE FROM ai_training_conversations
  WHERE studio_id = p_studio_id;
  GET DIAGNOSTICS v_deleted_conversations = ROW_COUNT;

  -- 3. Revogar todos os consentimentos ativos (não deletar — manter audit trail)
  UPDATE user_ai_consents
  SET
    revoked_at = NOW(),
    revocation_reason = 'studio_churned_lgpd_art16',
    updated_at = NOW()
  WHERE studio_id = p_studio_id
    AND revoked_at IS NULL;
  GET DIAGNOSTICS v_deleted_consents = ROW_COUNT;

  -- 4. Anonimizar interações de AI (manter para métricas agregadas - Art. 16, IV)
  -- Remove conteúdo das mensagens mas mantém metadata de contagem
  -- Colunas: message, ai_response (schema ai_interactions)
  UPDATE ai_interactions
  SET
    message = '[REMOVIDO - LGPD Art.16]',
    ai_response = '[REMOVIDO - LGPD Art.16]',
    action_data = COALESCE(action_data, '{}'::jsonb) || jsonb_build_object(
      'anonymized_at', NOW(),
      'reason', 'studio_churned_lgpd_art16'
    )
  WHERE studio_id = p_studio_id
    AND message != '[REMOVIDO - LGPD Art.16]';
  GET DIAGNOSTICS v_anonymized_interactions = ROW_COUNT;

  -- 5. Construir log de auditoria imutável
  v_log := jsonb_build_object(
    'purge_completed_at', NOW(),
    'studio_id', p_studio_id,
    'deleted_knowledge_items', v_deleted_knowledge,
    'deleted_training_conversations', v_deleted_conversations,
    'revoked_consents', v_deleted_consents,
    'anonymized_interactions', v_anonymized_interactions
  );

  -- 6. Marcar solicitação como concluída
  UPDATE studio_data_deletion_requests
  SET
    status = 'completed',
    completed_at = NOW(),
    deletion_log = v_log
  WHERE id = p_request_id;

  RETURN v_log;

EXCEPTION WHEN OTHERS THEN
  -- Registrar falha sem reverter — operação parcial é melhor que nenhuma
  UPDATE studio_data_deletion_requests
  SET
    status = 'failed',
    error_detail = SQLERRM
  WHERE id = p_request_id;

  RAISE;
END;
$$;

COMMENT ON FUNCTION purge_studio_ai_data IS
  'Purge LGPD Art.16 de dados de AI quando studio encerra contrato. '
  'Remove embeddings, conversas de treinamento e anonimiza histórico. '
  'Mantém audit trail de consentimentos (imutável) e metadata agregada. '
  'Chamar via CRON após 30 dias do churn ou imediatamente se solicitado pelo titular.';

COMMENT ON TABLE studio_data_deletion_requests IS
  'Registro de solicitações de exclusão de dados (LGPD Art.18, VI). '
  'Prazo legal para atendimento: 30 dias. '
  'Não deletar registros desta tabela — são o comprovante legal de conformidade.';
