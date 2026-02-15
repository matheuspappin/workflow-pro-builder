-- Tabela de Planos do Sistema (Workflow Global)
CREATE TABLE IF NOT EXISTS system_plans (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  description TEXT,
  features TEXT[] DEFAULT '{}',
  max_students INTEGER DEFAULT 10,
  max_teachers INTEGER DEFAULT 1,
  has_whatsapp BOOLEAN DEFAULT false,
  has_ai BOOLEAN DEFAULT false,
  has_finance BOOLEAN DEFAULT true,
  has_multi_unit BOOLEAN DEFAULT false,
  is_popular BOOLEAN DEFAULT false,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Inserir planos iniciais
INSERT INTO system_plans (id, name, price, description, features, max_students, max_teachers, has_whatsapp, has_ai, has_finance, has_multi_unit, is_popular, status)
VALUES 
('gratuito', 'Gratuito', 0, 'Ideal para começar sua jornada', '{"Até 10 alunos", "1 Profissional", "Gestão básica"}', 10, 1, false, false, true, false, false, 'active'),
('pro', 'Pro', 97.00, 'Tudo o que você precisa para crescer', '{"Até 100 alunos", "5 Profissionais", "WhatsApp Business", "Gestão Financeira"}', 100, 5, true, false, true, false, true, 'active'),
('pro-plus', 'Pro+', 197.00, 'O melhor custo-benefício para estúdios médios', '{"Clientes ilimitados", "Profissionais ilimitados", "WhatsApp + IA", "Financeiro Avançado"}', 1000, 1000, true, true, true, false, false, 'active'),
('enterprise', 'Enterprise', 497.00, 'Escalabilidade e suporte total', '{"Tudo ilimitado", "Multi-unidades", "Suporte VIP", "IA Customizada"}', 10000, 10000, true, true, true, true, false, 'active')
ON CONFLICT (id) DO NOTHING;

-- Tabela de Faturas de Estúdios (Cobrança da Plataforma)
CREATE TABLE IF NOT EXISTS studio_invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'BRL',
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('paid', 'pending', 'overdue', 'cancelled')),
  due_date DATE NOT NULL,
  paid_at TIMESTAMP WITH TIME ZONE,
  stripe_invoice_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Habilitar RLS para system_plans (Leitura pública, Escrita apenas super_admin)
ALTER TABLE system_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "system_plans_read_policy" ON system_plans FOR SELECT USING (true);

-- Habilitar RLS para studio_invoices (Dono do estúdio vê suas faturas)
ALTER TABLE studio_invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "studio_invoices_isolation_policy" ON studio_invoices FOR ALL USING (studio_id IS NOT NULL);
