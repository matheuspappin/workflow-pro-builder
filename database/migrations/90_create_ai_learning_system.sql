-- Migration 90: Sistema de Self-Learning para IA
-- Tabelas para armazenar conhecimento aprendido e feedback

-- Funções auxiliares (caso não existam ainda)
CREATE OR REPLACE FUNCTION get_auth_studio_id()
RETURNS UUID AS $$
DECLARE
  v_studio_id UUID;
  v_role VARCHAR;
BEGIN
  -- Verifica se é Super Admin (acesso total)
  SELECT role INTO v_role FROM users_internal WHERE id = auth.uid();
  IF v_role = 'super_admin' THEN
    RETURN NULL; -- Retorna NULL para indicar que não deve filtrar por estúdio (lógica na policy)
  END IF;

  -- Busca em users_internal
  SELECT studio_id INTO v_studio_id
  FROM users_internal
  WHERE id = auth.uid();
  
  IF v_studio_id IS NOT NULL THEN
    RETURN v_studio_id;
  END IF;

  -- Busca em professionals
  SELECT studio_id INTO v_studio_id
  FROM professionals
  WHERE user_id = auth.uid();

  IF v_studio_id IS NOT NULL THEN
    RETURN v_studio_id;
  END IF;

  -- Busca em students
  SELECT studio_id INTO v_studio_id
  FROM students
  WHERE id = auth.uid();

  RETURN v_studio_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users_internal 
    WHERE id = auth.uid() AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Tabela de conhecimento aprendido pela IA
CREATE TABLE IF NOT EXISTS public.ai_learned_knowledge (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    studio_id UUID NOT NULL REFERENCES public.studios(id) ON DELETE CASCADE,
    category TEXT NOT NULL, -- 'service_info', 'pricing', 'policies', 'faqs', 'responses'
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    confidence_score DECIMAL(3,2) DEFAULT 0.5, -- 0.00 a 1.00
    source_type TEXT NOT NULL, -- 'user_feedback', 'conversation', 'manual', 'correction'
    source_data JSONB, -- Dados originais que geraram o aprendizado
    usage_count INTEGER DEFAULT 0, -- Quantas vezes foi usado
    success_rate DECIMAL(3,2) DEFAULT 0.0, -- Taxa de sucesso
    last_used TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT valid_confidence CHECK (confidence_score >= 0.0 AND confidence_score <= 1.0),
    CONSTRAINT valid_success_rate CHECK (success_rate >= 0.0 AND success_rate <= 1.0)
);

-- Tabela de feedback das respostas da IA
CREATE TABLE IF NOT EXISTS public.ai_response_feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    studio_id UUID NOT NULL REFERENCES public.studios(id) ON DELETE CASCADE,
    interaction_id UUID REFERENCES public.ai_interactions(id) ON DELETE SET NULL,
    original_question TEXT NOT NULL,
    original_answer TEXT NOT NULL,
    user_feedback TEXT NOT NULL, -- 'positive', 'negative', 'neutral', 'correction'
    corrected_answer TEXT, -- Resposta corrigida pelo usuário
    feedback_reason TEXT, -- Porquê o feedback foi dado
    rating INTEGER CHECK (rating >= 1 AND rating <= 5), -- 1-5 stars
    improvement_suggestions TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de padrões e templates aprendidos
CREATE TABLE IF NOT EXISTS public.ai_response_patterns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    studio_id UUID NOT NULL REFERENCES public.studios(id) ON DELETE CASCADE,
    pattern_name TEXT NOT NULL,
    pattern_type TEXT NOT NULL, -- 'greeting', 'farewell', 'confirmation', 'apology', 'information'
    template TEXT NOT NULL, -- Template com placeholders {name}, {service}, etc.
    variables JSONB DEFAULT '[]'::jsonb, -- Lista de variáveis usadas no template
    context_keywords TEXT[], -- Palavras-chave que ativam este padrão
    success_rate DECIMAL(3,2) DEFAULT 0.0,
    usage_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de evolução e métricas de aprendizado
CREATE TABLE IF NOT EXISTS public.ai_learning_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    studio_id UUID NOT NULL REFERENCES public.studios(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    total_interactions INTEGER DEFAULT 0,
    successful_responses INTEGER DEFAULT 0,
    feedback_received INTEGER DEFAULT 0,
    new_knowledge_items INTEGER DEFAULT 0,
    confidence_improvement DECIMAL(5,2) DEFAULT 0.0,
    response_time_avg INTEGER, -- Tempo médio de resposta em ms
    top_intent_types JSONB DEFAULT '[]'::jsonb,
    learning_score DECIMAL(5,2) DEFAULT 0.0, -- Score geral de aprendizado
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(studio_id, date)
);

-- Tabela de contexto dinâmico por estúdio
CREATE TABLE IF NOT EXISTS public.ai_dynamic_context (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    studio_id UUID NOT NULL REFERENCES public.studios(id) ON DELETE CASCADE,
    context_type TEXT NOT NULL, -- 'services', 'pricing', 'schedule', 'policies', 'custom'
    content JSONB NOT NULL,
    priority INTEGER DEFAULT 1, -- 1=alta, 2=média, 3=baixa
    expires_at TIMESTAMPTZ, -- Contexto expira em determinada data
    source TEXT NOT NULL, -- 'manual', 'auto_generated', 'user_input'
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.ai_learned_knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_response_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_response_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_learning_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_dynamic_context ENABLE ROW LEVEL SECURITY;

-- Políticas para learned_knowledge
CREATE POLICY "Studio users can read learned_knowledge" ON public.ai_learned_knowledge
    FOR SELECT TO authenticated
    USING (studio_id = get_auth_studio_id() OR is_super_admin());

CREATE POLICY "Admins can manage learned_knowledge" ON public.ai_learned_knowledge
    FOR ALL TO authenticated
    USING (studio_id = get_auth_studio_id() OR is_super_admin());

-- Políticas para response_feedback
CREATE POLICY "Studio users can create feedback" ON public.ai_response_feedback
    FOR INSERT TO authenticated
    WITH CHECK (studio_id = get_auth_studio_id() OR is_super_admin());

CREATE POLICY "Studio users can read feedback" ON public.ai_response_feedback
    FOR SELECT TO authenticated
    USING (studio_id = get_auth_studio_id() OR is_super_admin());

-- Políticas para response_patterns
CREATE POLICY "Studio users can read patterns" ON public.ai_response_patterns
    FOR SELECT TO authenticated
    USING (studio_id = get_auth_studio_id() OR is_super_admin());

CREATE POLICY "Admins can manage patterns" ON public.ai_response_patterns
    FOR ALL TO authenticated
    USING (studio_id = get_auth_studio_id() OR is_super_admin());

-- Políticas para learning_metrics
CREATE POLICY "Studio users can read metrics" ON public.ai_learning_metrics
    FOR SELECT TO authenticated
    USING (studio_id = get_auth_studio_id() OR is_super_admin());

CREATE POLICY "System can update metrics" ON public.ai_learning_metrics
    FOR UPDATE TO authenticated
    USING (studio_id = get_auth_studio_id() OR is_super_admin());

-- Políticas para dynamic_context
CREATE POLICY "Studio users can read context" ON public.ai_dynamic_context
    FOR SELECT TO authenticated
    USING (studio_id = get_auth_studio_id() OR is_super_admin());

CREATE POLICY "Admins can manage context" ON public.ai_dynamic_context
    FOR ALL TO authenticated
    USING (studio_id = get_auth_studio_id() OR is_super_admin());

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_ai_learned_knowledge_studio_category ON public.ai_learned_knowledge(studio_id, category);
CREATE INDEX IF NOT EXISTS idx_ai_learned_knowledge_question ON public.ai_learned_knowledge USING gin(to_tsvector('portuguese', question));
CREATE INDEX IF NOT EXISTS idx_ai_learned_knowledge_confidence ON public.ai_learned_knowledge(confidence_score DESC);

CREATE INDEX IF NOT EXISTS idx_ai_feedback_studio_date ON public.ai_response_feedback(studio_id, created_at);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_type ON public.ai_response_feedback(user_feedback);

CREATE INDEX IF NOT EXISTS idx_ai_patterns_studio_type ON public.ai_response_patterns(studio_id, pattern_type);
CREATE INDEX IF NOT EXISTS idx_ai_patterns_keywords ON public.ai_response_patterns USING gin(context_keywords);

CREATE INDEX IF NOT EXISTS idx_ai_metrics_studio_date ON public.ai_learning_metrics(studio_id, date);
CREATE INDEX IF NOT EXISTS idx_ai_metrics_score ON public.ai_learning_metrics(learning_score DESC);

CREATE INDEX IF NOT EXISTS idx_ai_context_studio_type ON public.ai_dynamic_context(studio_id, context_type);
CREATE INDEX IF NOT EXISTS idx_ai_context_priority ON public.ai_dynamic_context(priority);

-- Triggers para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ai_learned_knowledge_updated_at 
    BEFORE UPDATE ON public.ai_learned_knowledge 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_response_patterns_updated_at 
    BEFORE UPDATE ON public.ai_response_patterns 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Inserir conhecimento inicial básico
INSERT INTO public.ai_learned_knowledge (studio_id, category, question, answer, confidence_score, source_type)
SELECT 
    id,
    'greetings',
    'Olá|Oi|Bom dia|Boa tarde|Boa noite',
    'Olá! Sou o assistente virtual. Como posso ajudar você hoje?',
    0.8,
    'manual'
FROM public.studios;

INSERT INTO public.ai_learned_knowledge (studio_id, category, question, answer, confidence_score, source_type)
SELECT 
    id,
    'farewell',
    'Tchau|Até logo|Obrigado|Adeus',
    'Obrigado pelo contato! Estou sempre à disposição. Até logo!',
    0.8,
    'manual'
FROM public.studios;
