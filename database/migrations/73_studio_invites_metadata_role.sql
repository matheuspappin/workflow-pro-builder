-- Migration 73: Adiciona colunas metadata, role e invite_type à tabela studio_invites
-- Necessário para suportar convites de profissionais (com role/metadata) e convites de ecossistema

ALTER TABLE studio_invites
  ADD COLUMN IF NOT EXISTS metadata  JSONB,
  ADD COLUMN IF NOT EXISTS role      TEXT,
  ADD COLUMN IF NOT EXISTS invite_type TEXT DEFAULT 'ecosystem';

-- Índice para consultas por tipo de convite
CREATE INDEX IF NOT EXISTS idx_studio_invites_invite_type ON studio_invites(invite_type);
CREATE INDEX IF NOT EXISTS idx_studio_invites_role ON studio_invites(role);
