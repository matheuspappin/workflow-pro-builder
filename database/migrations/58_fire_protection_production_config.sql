-- 58. Fire Protection: Configuração de capacidade de produção

-- 58.1 Configuração por estúdio (empresa)
CREATE TABLE IF NOT EXISTS fire_protection_production_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE UNIQUE,
  extintores_por_dia INTEGER NOT NULL DEFAULT 20,
  lead_time_minimo_dias INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 58.2 Capacidade por técnico
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS extintores_por_dia INTEGER;

-- 58.3 Índice
CREATE INDEX IF NOT EXISTS idx_fp_production_config_studio ON fire_protection_production_config(studio_id);

-- 58.4 RLS: Dono do studio ou usuário do studio pode gerenciar (admin usa service_role que ignora RLS)
ALTER TABLE fire_protection_production_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "studio_manage_production_config" ON fire_protection_production_config;
CREATE POLICY "studio_manage_production_config" ON fire_protection_production_config
FOR ALL USING (
  studio_id IN (
    SELECT id FROM studios WHERE owner_id = auth.uid()
    UNION
    SELECT studio_id FROM users_internal WHERE id = auth.uid()
  )
);
