-- Migration 71: Consolida DanceFlow como verticalização definitiva para estúdios de dança
-- Remove dependência do "Estúdio de Dança" (deletado) e ativa todos os módulos com páginas implementadas

UPDATE verticalizations
SET
  name        = 'DanceFlow',
  description = 'Plataforma completa para estúdios e escolas de dança. Gerencie alunos, turmas, matrículas, frequência, financeiro, professores, gamificação e IA — tudo em uma solução white-label moderna.',
  tags        = '["Alunos","Turmas","Matrículas","Financeiro","Professores","Gamificação","IA Chat","Scanner","WhatsApp","CRM"]'::jsonb,
  status      = 'active',
  modules     = '{
    "dashboard":      true,
    "students":       true,
    "classes":        true,
    "financial":      true,
    "service_orders": false,
    "scanner":        true,
    "inventory":      false,
    "whatsapp":       true,
    "ai_chat":        true,
    "pos":            true,
    "leads":          true,
    "gamification":   true,
    "marketplace":    false,
    "erp":            false,
    "multi_unit":     true
  }'::jsonb,
  updated_at  = NOW()
WHERE slug = 'estudio-de-danca'
  AND niche  = 'dance';
