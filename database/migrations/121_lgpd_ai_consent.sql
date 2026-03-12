-- Migration 121: Consentimento LGPD para uso de dados em treinamento de AI
-- Art. 7º, II da LGPD: tratamento para finalidade secundária requer consentimento explícito
-- ou legítimo interesse documentado. Uso de conversas para treinar AI é finalidade secundária.

-- Tabela de consentimentos por usuário
CREATE TABLE IF NOT EXISTS user_ai_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  -- Tipos de consentimento separados para granularidade
  consent_ai_training BOOLEAN NOT NULL DEFAULT FALSE,      -- uso em treinamento global
  consent_ai_personalization BOOLEAN NOT NULL DEFAULT TRUE, -- personalização por studio (legítimo interesse)
  consent_ai_analytics BOOLEAN NOT NULL DEFAULT TRUE,      -- métricas anônimas agregadas
  -- Rastreabilidade exigida pela LGPD
  ip_address INET,
  user_agent TEXT,
  consent_version VARCHAR(10) NOT NULL DEFAULT '1.0',      -- versionar a política de privacidade
  consented_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  revoked_at TIMESTAMP WITH TIME ZONE,
  revocation_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, studio_id, consent_version)
);

CREATE INDEX IF NOT EXISTS idx_ai_consents_user ON user_ai_consents(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_consents_studio ON user_ai_consents(studio_id);
CREATE INDEX IF NOT EXISTS idx_ai_consents_training 
  ON user_ai_consents(consent_ai_training) 
  WHERE consent_ai_training = TRUE AND revoked_at IS NULL;

ALTER TABLE user_ai_consents ENABLE ROW LEVEL SECURITY;

-- Usuário vê apenas seus próprios consentimentos; admin do studio vê todos do studio
CREATE POLICY "user_own_consents" ON user_ai_consents FOR ALL
  USING (
    user_id = auth.uid()
    OR studio_id = get_auth_studio_id()
    OR is_super_admin()
  );

-- View para filtrar apenas interações de estúdios com consentimento de treinamento ativo.
-- ai_interactions rastreia no nível de estúdio (não por user_id individual),
-- portanto o consentimento é verificado no nível do tenant.
-- Usada por scripts de exportação para treinamento de modelos.
CREATE OR REPLACE VIEW ai_training_eligible_interactions AS
SELECT i.*
FROM ai_interactions i
WHERE EXISTS (
  SELECT 1
  FROM user_ai_consents c
  WHERE c.studio_id = i.studio_id
    AND c.consent_ai_training = TRUE
    AND c.revoked_at IS NULL
);

-- RPC para registrar ou atualizar consentimento (chamado no onboarding e configurações)
CREATE OR REPLACE FUNCTION upsert_ai_consent(
  p_user_id UUID,
  p_studio_id UUID,
  p_consent_training BOOLEAN,
  p_consent_personalization BOOLEAN,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_version VARCHAR DEFAULT '1.0'
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO user_ai_consents (
    user_id, studio_id,
    consent_ai_training, consent_ai_personalization,
    ip_address, user_agent, consent_version,
    consented_at, revoked_at
  ) VALUES (
    p_user_id, p_studio_id,
    p_consent_training, p_consent_personalization,
    p_ip_address, p_user_agent, p_version,
    NOW(), NULL
  )
  ON CONFLICT (user_id, studio_id, consent_version) DO UPDATE SET
    consent_ai_training = EXCLUDED.consent_ai_training,
    consent_ai_personalization = EXCLUDED.consent_ai_personalization,
    revoked_at = CASE WHEN EXCLUDED.consent_ai_training = FALSE THEN NOW() ELSE NULL END,
    updated_at = NOW()
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

COMMENT ON TABLE user_ai_consents IS
  'Registro de consentimento LGPD (Art. 7º, II) para uso de dados em AI. '
  'consent_ai_training=TRUE: dados podem ser usados em treinamento global. '
  'Manter imutável para fins de auditoria — revogar via revoked_at, não deletar.';
