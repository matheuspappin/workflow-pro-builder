-- 63. Fire Protection: Evolução de extintores para técnico (retirado, em recarga, saindo, entregue)

-- 63.1 Status de evolução do extintor no fluxo da OS
ALTER TABLE assets ADD COLUMN IF NOT EXISTS evolution_status VARCHAR(30) DEFAULT 'no_cliente'
  CHECK (evolution_status IN ('no_cliente', 'retirado', 'em_recarga', 'pronto_entrega', 'entregue'));

COMMENT ON COLUMN assets.evolution_status IS 'Evolução no fluxo recarga: no_cliente, retirado, em_recarga, pronto_entrega, entregue';

-- 63.2 Vincular asset à OS em andamento (quando em fluxo)
ALTER TABLE assets ADD COLUMN IF NOT EXISTS current_service_order_id UUID REFERENCES service_orders(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_assets_evolution_service_order ON assets(current_service_order_id) WHERE current_service_order_id IS NOT NULL;

-- 63.3 Atualizar assets existentes em maintenance para evolution_status coerente
UPDATE assets SET evolution_status = 'em_recarga' WHERE status = 'maintenance' AND (evolution_status IS NULL OR evolution_status = 'no_cliente');
