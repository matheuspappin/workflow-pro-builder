-- Adiciona limite de unidades para gestão multi-unidade
ALTER TABLE organization_settings 
ADD COLUMN IF NOT EXISTS multi_unit_limit INTEGER DEFAULT 1;

-- Adicionar também na tabela studios para facilitar a checagem rápida
ALTER TABLE studios
ADD COLUMN IF NOT EXISTS multi_unit_limit INTEGER DEFAULT 1;
