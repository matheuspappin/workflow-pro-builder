-- 106. Adicionar 'agroflowai' ao source de chat_sessions
-- Permite que o Chat IA do AgroFlowAI persista sessões na mesma tabela

-- Dropar o CHECK antigo do source (nome pode variar)
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE t.relname = 'chat_sessions' AND c.contype = 'c'
      AND pg_get_constraintdef(c.oid) LIKE '%danceflow%'
  LOOP
    EXECUTE format('ALTER TABLE chat_sessions DROP CONSTRAINT %I', r.conname);
    EXIT;
  END LOOP;
END $$;

ALTER TABLE chat_sessions ADD CONSTRAINT chat_sessions_source_check
  CHECK (source IN ('danceflow', 'fire_protection', 'agroflowai'));

COMMENT ON COLUMN chat_sessions.source IS 'Origem da sessão: danceflow, fire_protection ou agroflowai';
