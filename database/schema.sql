-- Workflow AI Database Schema (Multi-Tenant Version)
-- Execute este arquivo no SQL Editor do Supabase para criar todas as tabelas com suporte a Multi-Empresas

-- 1. Tabela de Estúdios (Tenants)
DROP TABLE IF EXISTS studios CASCADE;
CREATE TABLE studios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  owner_id UUID, -- Referência ao auth.users do Supabase
  partner_id UUID REFERENCES partners(id) ON DELETE SET NULL, -- Parceiro que indicou
  plan VARCHAR(50) DEFAULT 'free',
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  -- Campos para Provisionamento e Assinatura
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  subscription_status VARCHAR(50) DEFAULT 'trialing', -- trialing, active, past_due, canceled, unpaid
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  subscription_ends_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 1.1 Tabela de Chaves de API e Instâncias por Estúdio
DROP TABLE IF EXISTS studio_api_keys CASCADE;
CREATE TABLE studio_api_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  service_name VARCHAR(50) NOT NULL, -- 'whatsapp', 'gemini', 'stripe', etc.
  api_key TEXT,
  api_secret TEXT,
  instance_id VARCHAR(255), -- ID da instância (ex: Evolution API)
  webhook_url TEXT,
  settings JSONB DEFAULT '{}'::jsonb,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'error')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(studio_id, service_name)
);

-- 2. Tabela de Usuários (Profiles/Auth Interno vinculado ao Auth do Supabase)
DROP TABLE IF EXISTS users_internal CASCADE;
CREATE TABLE users_internal (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  studio_id UUID REFERENCES studios(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  role VARCHAR(20) DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin', 'professional', 'receptionist')),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Tabela de Alunos
DROP TABLE IF EXISTS students CASCADE;
CREATE TABLE students (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  birth_date DATE,
  address TEXT,
  emergency_contact VARCHAR(255),
  medical_info TEXT,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  enrollment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(studio_id, email)
);

-- 3.1 Tabela de Notificações
DROP TABLE IF EXISTS notifications CASCADE;
CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- Se NULL, é para o sistema/admin do estúdio
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'info', -- 'info', 'warning', 'error', 'success'
  is_read BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb, -- Link para a turma, aluno, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_studio ON notifications(studio_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);

-- 3. Tabela de Professores
DROP TABLE IF EXISTS professionals CASCADE;
CREATE TABLE professionals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  cpf_cnpj VARCHAR(20),
  specialties TEXT[] DEFAULT '{}',
  hourly_rate DECIMAL(10,2) DEFAULT 0,
  bonus_per_student DECIMAL(10,2) DEFAULT 0,
  pix_key VARCHAR(255),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  hire_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(studio_id, email)
);

-- 4. Tabela de Turmas
DROP TABLE IF EXISTS classes CASCADE;
CREATE TABLE classes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  professional_id UUID REFERENCES professionals(id) ON DELETE SET NULL,
  dance_style VARCHAR(100) NOT NULL,
  level VARCHAR(20) DEFAULT 'beginner' CHECK (level IN ('beginner', 'intermediate', 'advanced')),
  max_students INTEGER DEFAULT 15,
  current_students INTEGER DEFAULT 0,
  schedule JSONB DEFAULT '[]'::jsonb,
  price DECIMAL(10,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 5. Tabela de Sessões (Ocorrência real da aula)
DROP TABLE IF EXISTS sessions CASCADE;
CREATE TABLE sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  scheduled_date DATE NOT NULL,
  actual_professional_id UUID REFERENCES professionals(id),
  status VARCHAR(20) DEFAULT 'agendada' CHECK (status IN ('agendada', 'realizada', 'cancelada', 'remarcada')),
  content_taught TEXT,
  notes TEXT,
  room_used VARCHAR(100),
  attendance_count INTEGER DEFAULT 0,
  reminders_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 6. Tabela de Matrículas (Vínculo Aluno-Turma)
DROP TABLE IF EXISTS enrollments CASCADE;
CREATE TABLE enrollments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  enrollment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'transferred', 'completed')),
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('paid', 'pending', 'overdue', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(studio_id, student_id, class_id)
);

-- 7. Tabela de Pagamentos
DROP TABLE IF EXISTS payments CASCADE;
CREATE TABLE payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  payment_date DATE,
  due_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('paid', 'pending', 'overdue', 'cancelled')),
  payment_method VARCHAR(50),
  reference_month VARCHAR(7) NOT NULL, -- formato: YYYY-MM
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 8. Tabela de Presenças
DROP TABLE IF EXISTS attendance CASCADE;
CREATE TABLE attendance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'present' CHECK (status IN ('present', 'absent', 'late', 'excused', 'confirmed', 'declined', 'pending')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(studio_id, student_id, class_id, date)
);

-- 9. Financeiro Professor
DROP TABLE IF EXISTS professional_finances CASCADE;
CREATE TABLE professional_finances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  professional_id UUID REFERENCES professionals(id) ON DELETE CASCADE,
  base_amount DECIMAL(10,2) NOT NULL,
  student_count INTEGER NOT NULL DEFAULT 0,
  bonus_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  payment_date DATE,
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('paid', 'pending', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 10. Gamificação
DROP TABLE IF EXISTS gamifications CASCADE;
CREATE TABLE gamifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  badge_name VARCHAR(255) NOT NULL,
  badge_description TEXT,
  badge_category VARCHAR(100),
  points_earned INTEGER DEFAULT 0,
  achievement_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 11. Pipeline de Leads
DROP TABLE IF EXISTS lead_pipelines CASCADE;
CREATE TABLE lead_pipelines (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  prospect_id UUID,
  source VARCHAR(100),
  interest_level INTEGER DEFAULT 1 CHECK (interest_level >= 1 AND interest_level <= 5),
  trial_class_date DATE,
  trial_class_feedback TEXT,
  follow_up_date DATE,
  conversion_probability DECIMAL(3,2) DEFAULT 0 CHECK (conversion_probability >= 0 AND conversion_probability <= 1),
  converted_to_student BOOLEAN DEFAULT false,
  conversion_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 12. Configurações do Estúdio
DROP TABLE IF EXISTS studio_settings CASCADE;
CREATE TABLE studio_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  setting_key VARCHAR(255) NOT NULL,
  setting_value TEXT NOT NULL,
  setting_description TEXT,
  setting_type VARCHAR(50) DEFAULT 'string' CHECK (setting_type IN ('string', 'number', 'boolean', 'json')),
  is_system BOOLEAN DEFAULT false,
  is_editable BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(studio_id, setting_key)
);

-- 13. Tabela de Modalidades
DROP TABLE IF EXISTS modalities CASCADE;
CREATE TABLE modalities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  color VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(studio_id, name)
);

-- 14. Conversas WhatsApp
DROP TABLE IF EXISTS whatsapp_chats CASCADE;
CREATE TABLE whatsapp_chats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  remote_jid VARCHAR(100) NOT NULL, -- Número do WhatsApp
  contact_name VARCHAR(255),
  contact_type VARCHAR(20) DEFAULT 'student' CHECK (contact_type IN ('admin', 'student', 'lead')),
  last_message TEXT,
  unread_count INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(studio_id, remote_jid)
);

DROP TABLE IF EXISTS whatsapp_messages CASCADE;
CREATE TABLE whatsapp_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  chat_id UUID NOT NULL REFERENCES whatsapp_chats(id) ON DELETE CASCADE,
  message_id VARCHAR(255), -- ID vindo da API do WhatsApp
  sender_number VARCHAR(20),
  sender_name VARCHAR(255),
  content TEXT NOT NULL,
  from_me BOOLEAN DEFAULT false,
  is_ai BOOLEAN DEFAULT false,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(studio_id, message_id)
);

-- 15. Sistema de Créditos e Pacotes
DROP TABLE IF EXISTS lesson_packages CASCADE;
CREATE TABLE lesson_packages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  lessons_count INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

DROP TABLE IF EXISTS student_lesson_credits CASCADE;
CREATE TABLE student_lesson_credits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  total_credits INTEGER NOT NULL DEFAULT 0,
  remaining_credits INTEGER NOT NULL DEFAULT 0,
  expiry_date DATE,
  last_purchase_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(student_id)
);

DROP TABLE IF EXISTS student_credit_usage CASCADE;
CREATE TABLE student_credit_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
  session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
  credits_used INTEGER NOT NULL DEFAULT 1,
  usage_type VARCHAR(50) DEFAULT 'class_attendance' CHECK (usage_type IN ('class_attendance', 'manual_adjustment', 'refund')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 16. Despesas
DROP TABLE IF EXISTS expenses CASCADE;
CREATE TABLE expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  description VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  due_date DATE NOT NULL,
  payment_date DATE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('paid', 'pending', 'overdue', 'cancelled')),
  is_recurring BOOLEAN DEFAULT false,
  recurrence_period VARCHAR(20) CHECK (recurrence_period IN ('weekly', 'monthly', 'yearly')),
  parent_id UUID REFERENCES expenses(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ÍNDICES PARA PERFORMANCE
CREATE INDEX idx_wa_chats_studio ON whatsapp_chats(studio_id);
CREATE INDEX idx_wa_messages_chat ON whatsapp_messages(chat_id);
CREATE INDEX idx_students_studio ON students(studio_id);
CREATE INDEX idx_professionals_studio ON professionals(studio_id);
CREATE INDEX idx_classes_studio ON classes(studio_id);
CREATE INDEX idx_sessions_studio ON sessions(studio_id);
CREATE INDEX idx_enrollments_studio ON enrollments(studio_id);
CREATE INDEX idx_payments_studio ON payments(studio_id);
CREATE INDEX idx_attendance_studio ON attendance(studio_id);
CREATE INDEX idx_studio_settings_studio ON studio_settings(studio_id);

-- GATILHOS PARA UPDATED_AT
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_studios_updated_at BEFORE UPDATE ON studios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_internal_updated_at BEFORE UPDATE ON users_internal FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_professionals_updated_at BEFORE UPDATE ON professionals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON classes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_enrollments_updated_at BEFORE UPDATE ON enrollments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_attendance_updated_at BEFORE UPDATE ON attendance FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_professional_finances_updated_at BEFORE UPDATE ON professional_finances FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_gamifications_updated_at BEFORE UPDATE ON gamifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lead_pipelines_updated_at BEFORE UPDATE ON lead_pipelines FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_studio_settings_updated_at BEFORE UPDATE ON studio_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_modalities_updated_at BEFORE UPDATE ON modalities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_studio_api_keys_updated_at BEFORE UPDATE ON studio_api_keys FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lesson_packages_updated_at BEFORE UPDATE ON lesson_packages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_student_credits_updated_at BEFORE UPDATE ON student_lesson_credits FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 17. Configurações de Organização (Módulos e Nicho)
DROP TABLE IF EXISTS organization_settings CASCADE;
CREATE TABLE organization_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  business_type TEXT DEFAULT 'dance_school',
  niche TEXT DEFAULT 'dance',
  enabled_modules JSONB DEFAULT '{ "dashboard": true, "students": true, "classes": true, "financial": false, "ai_chat": false, "whatsapp": false, "pos": false }',
  nomenclature JSONB DEFAULT '{"client": "Aluno", "service": "Aula", "professional": "Profissional"}',
  vocabulary JSONB DEFAULT '{"client": "Aluno", "provider": "Profissional", "service": "Aula", "establishment": "Estúdio"}',
  theme_config JSONB DEFAULT '{}',
  theme_colors JSONB DEFAULT '{ "primary": "#7c3aed", "secondary": "#db2777" }',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(studio_id)
);

-- 18. Parceiros e Afiliados
DROP TABLE IF EXISTS partners CASCADE;
CREATE TABLE partners (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  commission_rate DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 19. Convites de Estúdio (Sistema de Resgate)
DROP TABLE IF EXISTS studio_invites CASCADE;
CREATE TABLE studio_invites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  studio_id UUID REFERENCES studios(id) ON DELETE CASCADE,
  email TEXT,
  token TEXT NOT NULL UNIQUE,
  used_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days')
);

-- ROW LEVEL SECURITY (RLS)
ALTER TABLE studios ENABLE ROW LEVEL SECURITY;
ALTER TABLE users_internal ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE professional_finances ENABLE ROW LEVEL SECURITY;
ALTER TABLE gamifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE studio_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE modalities ENABLE ROW LEVEL SECURITY;
ALTER TABLE studio_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_lesson_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_credit_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE studio_invites ENABLE ROW LEVEL SECURITY;

-- Políticas de Isolamento por Estúdio
CREATE POLICY "studio_isolation_policy_students" ON students FOR ALL USING (studio_id IS NOT NULL);
CREATE POLICY "users_admin_access" ON users_internal FOR ALL
  USING (auth.uid() = id OR (SELECT role FROM users_internal WHERE id = auth.uid()) = 'super_admin');
CREATE POLICY "users_studio_isolation" ON users_internal FOR SELECT
  USING (studio_id = (SELECT studio_id FROM users_internal WHERE id = auth.uid()));
CREATE POLICY "studio_isolation_policy_professionals" ON professionals FOR ALL USING (studio_id IS NOT NULL);
CREATE POLICY "studio_isolation_policy_classes" ON classes FOR ALL USING (studio_id IS NOT NULL);
CREATE POLICY "studio_isolation_policy_sessions" ON sessions FOR ALL USING (studio_id IS NOT NULL);
CREATE POLICY "studio_isolation_policy_enrollments" ON enrollments FOR ALL USING (studio_id IS NOT NULL);
CREATE POLICY "studio_isolation_policy_payments" ON payments FOR ALL USING (studio_id IS NOT NULL);
CREATE POLICY "studio_isolation_policy_attendance" ON attendance FOR ALL USING (studio_id IS NOT NULL);
CREATE POLICY "studio_isolation_policy_finances" ON professional_finances FOR ALL USING (studio_id IS NOT NULL);
CREATE POLICY "studio_isolation_policy_gamif" ON gamifications FOR ALL USING (studio_id IS NOT NULL);
CREATE POLICY "studio_isolation_policy_leads" ON lead_pipelines FOR ALL USING (studio_id IS NOT NULL);
CREATE POLICY "studio_isolation_policy_settings" ON studio_settings FOR ALL USING (studio_id IS NOT NULL);
CREATE POLICY "studio_isolation_policy_modalities" ON modalities FOR ALL USING (studio_id IS NOT NULL);
CREATE POLICY "studio_isolation_policy_api_keys" ON studio_api_keys FOR ALL USING (studio_id IS NOT NULL);
CREATE POLICY "studio_isolation_policy_wa_chats" ON whatsapp_chats FOR ALL USING (studio_id IS NOT NULL);
CREATE POLICY "studio_isolation_policy_wa_messages" ON whatsapp_messages FOR ALL USING (studio_id IS NOT NULL);
CREATE POLICY "studio_isolation_policy_packages" ON lesson_packages FOR ALL USING (studio_id IS NOT NULL);
CREATE POLICY "studio_isolation_policy_credits" ON student_lesson_credits FOR ALL USING (studio_id IS NOT NULL);
CREATE POLICY "studio_isolation_policy_usage" ON student_credit_usage FOR ALL USING (studio_id IS NOT NULL);
CREATE POLICY "studio_isolation_policy_expenses" ON expenses FOR ALL USING (studio_id IS NOT NULL);
CREATE POLICY "studio_isolation_policy_org_settings" ON organization_settings FOR ALL USING (studio_id IS NOT NULL);
CREATE POLICY "Partners view own data" ON partners FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins view all invites" ON studio_invites FOR ALL USING (true);
CREATE POLICY "Public read invite by token" ON studio_invites FOR SELECT USING (used_at IS NULL);

-- REALTIME
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime FOR TABLE 
  whatsapp_chats, whatsapp_messages, attendance, student_lesson_credits, payments;
