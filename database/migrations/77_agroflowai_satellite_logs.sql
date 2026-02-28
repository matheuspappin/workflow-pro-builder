-- Migration 77: AgroFlowAI - Compliance Logs de Satélite e Suporte a Polígono
-- Registra histórico de processamento NDVI/imagem por propriedade

-- Adiciona coluna de polígono GeoJSON na tabela de propriedades
ALTER TABLE agroflowai_properties
  ADD COLUMN IF NOT EXISTS polygon_geojson  JSONB,         -- GeoJSON completo do polígono da fazenda
  ADD COLUMN IF NOT EXISTS satellite_source TEXT;          -- última coleção usada (CBERS4A, S2, etc)

-- Tabela de compliance logs (histórico de NDVI + imagem processada)
CREATE TABLE IF NOT EXISTS agroflowai_compliance_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id       UUID NOT NULL,
  property_id     UUID NOT NULL REFERENCES agroflowai_properties(id) ON DELETE CASCADE,
  processed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Resultado do processamento
  ndvi_mean       DECIMAL(6,4),                            -- NDVI médio da área
  ndvi_history    JSONB,                                   -- [{date, ndvi}, ...]
  image_url       TEXT,                                    -- URL pública no Supabase Storage (PNG)
  image_b64       TEXT,                                    -- base64 temporário (cache curto prazo)
  collection      TEXT,                                    -- coleção STAC usada
  items_found     INTEGER DEFAULT 0,

  -- Alerta gerado
  alert_level     TEXT CHECK (alert_level IN ('critical', 'warning', 'ok', NULL)),
  alert_message   TEXT,

  -- Metadados
  days_back       INTEGER DEFAULT 90,
  processing_ms   INTEGER,                                 -- tempo de processamento em ms
  error           TEXT                                     -- mensagem de erro se falhou
);

-- Índices para compliance logs
CREATE INDEX IF NOT EXISTS idx_compliance_studio      ON agroflowai_compliance_logs (studio_id);
CREATE INDEX IF NOT EXISTS idx_compliance_property    ON agroflowai_compliance_logs (property_id);
CREATE INDEX IF NOT EXISTS idx_compliance_processed   ON agroflowai_compliance_logs (processed_at DESC);
CREATE INDEX IF NOT EXISTS idx_compliance_alert       ON agroflowai_compliance_logs (alert_level);
CREATE INDEX IF NOT EXISTS idx_compliance_prop_date   ON agroflowai_compliance_logs (property_id, processed_at DESC);

-- View: último log por propriedade
CREATE OR REPLACE VIEW agroflowai_latest_compliance AS
  SELECT DISTINCT ON (property_id)
    cl.*,
    p.name        AS property_name,
    p.city,
    p.state,
    p.total_area_ha,
    p.car_status
  FROM agroflowai_compliance_logs cl
  JOIN agroflowai_properties p ON p.id = cl.property_id
  ORDER BY property_id, processed_at DESC;
