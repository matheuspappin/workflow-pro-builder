-- 85. Tabela chat_sessions - Persistência de conversas do Chat IA
-- Usada por DanceFlow e Fire Protection para salvar e organizar conversas
CREATE TABLE IF NOT EXISTS chat_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  source VARCHAR(50) DEFAULT 'danceflow' CHECK (source IN ('danceflow', 'fire_protection')),
  title VARCHAR(255) NOT NULL DEFAULT 'Nova Conversa',
  messages JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Se a tabela já existia sem source, adicionar a coluna
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chat_sessions') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chat_sessions' AND column_name = 'source') THEN
      ALTER TABLE chat_sessions ADD COLUMN source VARCHAR(50) DEFAULT 'danceflow' CHECK (source IN ('danceflow', 'fire_protection'));
    END IF;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_chat_sessions_studio_source ON chat_sessions(studio_id, source);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_updated ON chat_sessions(updated_at DESC);

ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "studio_chat_sessions" ON chat_sessions;
CREATE POLICY "studio_chat_sessions" ON chat_sessions
  FOR ALL USING (
    studio_id = (SELECT studio_id FROM users_internal WHERE id = auth.uid())
  );

COMMENT ON TABLE chat_sessions IS 'Sessões de chat IA - DanceFlow e Fire Protection';
