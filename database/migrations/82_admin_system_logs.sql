-- 82. Tabela admin_system_logs - Logs do sistema para painel admin
-- Armazena eventos reais (erros, alertas, auth, pagamentos, etc.)
CREATE TABLE IF NOT EXISTS admin_system_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('error', 'warning', 'success', 'info')),
  source TEXT NOT NULL,
  message TEXT NOT NULL,
  studio TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_admin_system_logs_created ON admin_system_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_system_logs_type ON admin_system_logs(type);
CREATE INDEX IF NOT EXISTS idx_admin_system_logs_source ON admin_system_logs(source);

-- RLS: só service role e super_admins podem ler/escrever
ALTER TABLE admin_system_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super_admin_select" ON admin_system_logs
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users_internal ui
      WHERE ui.id = auth.uid() AND ui.role = 'super_admin'
    )
  );

CREATE POLICY "super_admin_insert" ON admin_system_logs
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users_internal ui
      WHERE ui.id = auth.uid() AND ui.role = 'super_admin'
    )
  );

-- Service role bypassa RLS por padrão no Supabase
COMMENT ON TABLE admin_system_logs IS 'Logs do sistema para painel admin - dados reais';
