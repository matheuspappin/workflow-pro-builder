-- 81. Tabela studio_ai_reports - Relatórios de contexto para IA (DanceFlow e FireControl)
-- Garante que a tabela exista para ambas as verticalizações
CREATE TABLE IF NOT EXISTS studio_ai_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_studio_ai_reports_studio ON studio_ai_reports(studio_id);
CREATE INDEX IF NOT EXISTS idx_studio_ai_reports_created ON studio_ai_reports(created_at DESC);
