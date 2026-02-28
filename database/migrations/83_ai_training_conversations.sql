-- 83. Tabela ai_training_conversations - Dataset de treinamento da IA
-- Usada pelo Laboratório de IA (admin/testes) para conversas simuladas de matrícula/agendamento
CREATE TABLE IF NOT EXISTS ai_training_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  scenario_type TEXT NOT NULL CHECK (scenario_type IN ('enrollment', 'agendamento')),
  student_message TEXT NOT NULL,
  ai_response TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ai_training_conversations_created ON ai_training_conversations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_training_conversations_scenario ON ai_training_conversations(scenario_type);

-- RLS: só super_admins podem ler/escrever (painel admin)
ALTER TABLE ai_training_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super_admin_select" ON ai_training_conversations
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users_internal ui
      WHERE ui.id = auth.uid() AND ui.role = 'super_admin'
    )
  );

CREATE POLICY "super_admin_insert" ON ai_training_conversations
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users_internal ui
      WHERE ui.id = auth.uid() AND ui.role = 'super_admin'
    )
  );

CREATE POLICY "super_admin_update" ON ai_training_conversations
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users_internal ui
      WHERE ui.id = auth.uid() AND ui.role = 'super_admin'
    )
  );

CREATE POLICY "super_admin_delete" ON ai_training_conversations
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users_internal ui
      WHERE ui.id = auth.uid() AND ui.role = 'super_admin'
    )
  );

COMMENT ON TABLE ai_training_conversations IS 'Conversas simuladas para treinamento da IA - Laboratório admin/testes';
