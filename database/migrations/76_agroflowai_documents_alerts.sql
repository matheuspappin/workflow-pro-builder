-- Migration 76: AgroFlowAI - Tabela de Documentos Anexados e OS History
-- Gestão documental para compliance ambiental (ART, plantas, certidões, relatórios)

-- Tabela de documentos anexados
CREATE TABLE IF NOT EXISTS agroflowai_documents (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id   UUID NOT NULL,
  ref_id      UUID NOT NULL,           -- ID da OS, Laudo ou Propriedade
  ref_type    TEXT NOT NULL DEFAULT 'os'
              CHECK (ref_type IN ('os', 'laudo', 'property')),
  file_name   TEXT NOT NULL,
  file_url    TEXT NOT NULL,           -- URL pública no Supabase Storage
  file_type   TEXT NOT NULL DEFAULT 'application/octet-stream',
  file_size_kb INTEGER DEFAULT 0,
  uploaded_by TEXT,                    -- nome do usuário que fez upload
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para documentos
CREATE INDEX IF NOT EXISTS idx_agrodoc_studio   ON agroflowai_documents (studio_id);
CREATE INDEX IF NOT EXISTS idx_agrodoc_ref      ON agroflowai_documents (ref_id, ref_type);

-- Tabela de histórico das OS (timeline de eventos)
CREATE TABLE IF NOT EXISTS agroflowai_os_history (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id   UUID NOT NULL,
  os_id       UUID NOT NULL,           -- referência à service_orders.id
  event_type  TEXT NOT NULL DEFAULT 'comment'
              CHECK (event_type IN ('comment', 'status_change', 'assignment', 'document_added', 'system')),
  content     TEXT NOT NULL,           -- texto do comentário ou descrição do evento
  old_value   TEXT,                    -- valor anterior (ex: status antigo)
  new_value   TEXT,                    -- valor novo (ex: novo status)
  author_name TEXT,                    -- nome de quem fez a ação
  author_id   UUID,                    -- user_id de quem fez
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para histórico
CREATE INDEX IF NOT EXISTS idx_agrohist_studio ON agroflowai_os_history (studio_id);
CREATE INDEX IF NOT EXISTS idx_agrohist_os     ON agroflowai_os_history (os_id);

-- Tabela de alertas de vencimento (CAR, licenças, OS paradas)
CREATE TABLE IF NOT EXISTS agroflowai_alerts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id     UUID NOT NULL,
  ref_id        UUID,                  -- ID da propriedade, OS ou cliente
  ref_type      TEXT NOT NULL DEFAULT 'property'
                CHECK (ref_type IN ('property', 'os', 'laudo', 'lead')),
  alert_type    TEXT NOT NULL
                CHECK (alert_type IN ('car_expiry', 'os_stalled', 'laudo_expiry', 'licenca_expiry', 'ndvi_alert')),
  severity      TEXT NOT NULL DEFAULT 'warning'
                CHECK (severity IN ('critical', 'warning', 'info')),
  title         TEXT NOT NULL,
  description   TEXT NOT NULL,
  due_date      DATE,
  dismissed     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para alertas
CREATE INDEX IF NOT EXISTS idx_agroalert_studio    ON agroflowai_alerts (studio_id);
CREATE INDEX IF NOT EXISTS idx_agroalert_dismissed ON agroflowai_alerts (dismissed);
CREATE INDEX IF NOT EXISTS idx_agroalert_severity  ON agroflowai_alerts (severity);
