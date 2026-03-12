-- 117. Tabela ai_admin_feedback - Feedback do chat Admin Catarina (super admin)
-- Permite coletar feedback e correções para melhorar respostas gerais do ecossistema

CREATE TABLE IF NOT EXISTS public.ai_admin_feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  original_question TEXT NOT NULL,
  original_answer TEXT NOT NULL,
  user_feedback TEXT NOT NULL,
  corrected_answer TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_admin_feedback_created ON public.ai_admin_feedback(created_at DESC);

COMMENT ON TABLE public.ai_admin_feedback IS 'Feedback do super admin no chat Catarina. Usado para melhorar respostas gerais do ecossistema.';
