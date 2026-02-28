-- Migration 75: AgroFlowAI - Tabela de Propriedades Rurais e Notificações
-- Armazena fazendas, sítios, glebas e alertas do portal do cliente

-- Tabela de propriedades rurais
CREATE TABLE IF NOT EXISTS agroflowai_properties (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id   UUID NOT NULL,
  customer_id UUID,                         -- proprietário (referência a students.id)
  name        TEXT NOT NULL,               -- nome da fazenda/propriedade
  total_area_ha DECIMAL(10,2),             -- área total em hectares
  city        TEXT,                        -- município
  state       CHAR(2),                     -- sigla do estado
  car_number  TEXT,                        -- número CAR (ex: SP-3543402-xxxx)
  car_status  TEXT NOT NULL DEFAULT 'pendente'
              CHECK (car_status IN ('regularizado','em_processo','pendente','irregular')),
  biome       TEXT,                        -- Cerrado, Mata Atlântica, Amazônia, Pampa, Caatinga, Pantanal
  coordinates TEXT,                        -- "lat,lng" ou GeoJSON simplificado
  notes       TEXT,                        -- observações internas
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para propriedades
CREATE INDEX IF NOT EXISTS idx_agroprop_studio    ON agroflowai_properties (studio_id);
CREATE INDEX IF NOT EXISTS idx_agroprop_customer  ON agroflowai_properties (customer_id);
CREATE INDEX IF NOT EXISTS idx_agroprop_carstatus ON agroflowai_properties (car_status);

-- Tabela de notificações do portal do cliente
CREATE TABLE IF NOT EXISTS agroflowai_notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id   UUID NOT NULL,
  customer_id UUID,                         -- cliente destinatário (null = todos os clientes do studio)
  type        TEXT NOT NULL DEFAULT 'info'
              CHECK (type IN ('success','warning','info','error')),
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  read        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para notificações
CREATE INDEX IF NOT EXISTS idx_agronot_studio    ON agroflowai_notifications (studio_id);
CREATE INDEX IF NOT EXISTS idx_agronot_customer  ON agroflowai_notifications (customer_id);
CREATE INDEX IF NOT EXISTS idx_agronot_read      ON agroflowai_notifications (read);
