CREATE TABLE IF NOT EXISTS system_modules (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  features JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE system_modules ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read active modules
DROP POLICY IF EXISTS "Public modules are viewable by everyone" ON system_modules;
CREATE POLICY "Public modules are viewable by everyone" ON system_modules
  FOR SELECT USING (true);

-- Insert initial data
INSERT INTO system_modules (id, label, price, description, features) VALUES
('dashboard', 'Dashboard', 0.00, 'Visão geral e métricas', '["Visão geral e métricas", "Acompanhamento de performance"]'),
('students', 'Gestão de Alunos/Clientes', 0.00, 'Cadastro e perfil de alunos', '["Cadastro e perfil de alunos", "Histórico de aulas e pagamentos", "Comunicação direta com alunos"]'),
('classes', 'Gestão de Aulas/Serviços', 0.00, 'Criação e agendamento de aulas', '["Criação e agendamento de aulas", "Controle de frequência", "Gestão de instrutores"]'),
('financial', 'Financeiro', 29.90, 'Controle de mensalidades e pagamentos', '["Controle de mensalidades e pagamentos", "Relatórios financeiros", "Gestão de despesas"]'),
('whatsapp', 'Integração WhatsApp', 49.90, 'Envio de mensagens automáticas', '["Envio de mensagens automáticas", "Atendimento via Chatbot", "Notificações personalizadas"]'),
('ai_chat', 'Chat IA', 39.90, 'Assistente virtual inteligente', '["Assistente virtual inteligente", "Respostas automatizadas", "Personalização de atendimento"]'),
('pos', 'Ponto de Venda (POS)', 19.90, 'Venda de produtos e serviços', '["Venda de produtos e serviços", "Controle de caixa", "Integração com estoque"]'),
('inventory', 'Controle de Estoque', 19.90, 'Gestão de produtos e suprimentos', '["Gestão de produtos e suprimentos", "Alertas de estoque mínimo", "Relatórios de movimentação"]'),
('gamification', 'Gamificação', 14.90, 'Pontuação e ranking de alunos', '["Pontuação e ranking de alunos", "Conquistas e recompensas", "Engajamento e motivação"]'),
('leads', 'Funil de Vendas (CRM)', 24.90, 'Captura e gestão de leads', '["Captura e gestão de leads", "Acompanhamento de vendas", "Automação de marketing"]'),
('scanner', 'Scanner de Entrada', 9.90, 'Controle de acesso', '["Controle de acesso", "Registro de presença", "Integração com catracas"]'),
('marketplace', 'Marketplace/Loja Virtual', 29.90, 'Venda de produtos online', '["Venda de produtos online", "Gestão de pedidos", "Vitrine personalizada"]'),
('erp', 'ERP Enterprise', 99.90, 'Gestão completa da empresa', '["Gestão completa da empresa", "Módulos personalizados", "Suporte premium"]'),
('multi_unit', 'Gestão Multi-unidade', 149.90, 'Gerenciamento de múltiplas filiais', '["Gerenciamento de múltiplas filiais", "Centralização de dados", "Relatórios consolidados"]'),
('service_orders', 'Ordens de Serviço (OS)', 19.90, 'Controle de consertos e manutenções', '["Controle de consertos e manutenções", "Assinatura digital do cliente", "Histórico de estados da OS"]')
ON CONFLICT (id) DO UPDATE SET
  label = EXCLUDED.label,
  description = EXCLUDED.description,
  features = EXCLUDED.features;
