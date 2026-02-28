-- Migration 78: AgroFlowAI - Ativar verticalização (status active)
-- Atualiza status de coming_soon para active

UPDATE verticalizations
SET status = 'active', updated_at = NOW()
WHERE slug = 'agroflowai';
