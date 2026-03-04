-- Migration 91: Adicionar conhecimento inicial para Fire Protection AI
-- Popular base de conhecimento especializada para proteção contra incêndios

-- Inserir conhecimento específico para Fire Protection
-- Inserir para todos os studios (o conhecimento será filtrado por verticalização no frontend)
INSERT INTO public.ai_learned_knowledge (studio_id, category, question, answer, confidence_score, source_type)
SELECT 
    s.id,
    'service_info',
    'O que é vistoria de extintores|Como funciona vistoria|Quando fazer vistoria',
    'A vistoria de extintores é uma inspeção técnica obrigatória que verifica o estado de conservação, carga e funcionamento dos extintores. Deve ser realizada anualmente ou conforme exigência normativa. Inclui verificação da pressão, selo, mangueira e prazo de validade.',
    0.9,
    'manual'
FROM public.studios s;

INSERT INTO public.ai_learned_knowledge (studio_id, category, question, answer, confidence_score, source_type)
SELECT 
    s.id,
    'pricing',
    'Quanto custa recarga de extintor|Preço manutenção extintor|Valor laudo técnico',
    'Os valores variam conforme o tipo e capacidade do extintor: Extintor de Pó ABC 4kg: R$ 80-120, Extintor CO2 5kg: R$ 150-200, Extintor de Água 10L: R$ 100-150. Valores incluem recarga, certificado e selo do INMETRO. Laudos técnicos adicionais: R$ 200-400.',
    0.85,
    'manual'
FROM public.studios s;

INSERT INTO public.ai_learned_knowledge (studio_id, category, question, answer, confidence_score, source_type)
SELECT 
    s.id,
    'schedule',
    'Agendar vistoria|Marcar manutenção|Quando pode fazer inspeção',
    'Posso agendar vistoria técnica para sua empresa. Atendemos de segunda a sexta, das 8h às 18h. Para emergências, temos equipe 24/7. Informe o endereço, quantidade e tipo de extintores para orçamento preciso. O serviço leva aproximadamente 2-3 horas dependendo da quantidade.',
    0.9,
    'manual'
FROM public.studios s;

INSERT INTO public.ai_learned_knowledge (studio_id, category, question, answer, confidence_score, source_type)
SELECT 
    s.id,
    'contact',
    'Contato técnico|Telefone emergência|Falar com especialista',
    'Nossa equipe técnica está à disposição: Telefone: (11) 4000-0000, WhatsApp: (11) 99999-8888, E-mail: emergencia@fireprotection.com.br. Para emergências 24h: (11) 4000-1111. Nossa sede: Rua das Indústrias, 1234 - São Paulo/SP.',
    0.95,
    'manual'
FROM public.studios s;

INSERT INTO public.ai_learned_knowledge (studio_id, category, question, answer, confidence_score, source_type)
SELECT 
    s.id,
    'service_info',
    'Tipos de extintores|Qual extintor usar|Classes de fogo',
    'Tipos de extintores e aplicações: Classe A (madeira, papel): Água ou Espuma; Classe B (líquidos, gases): Pó ABC ou CO2; Classe C (elétrica): CO2 ou Pó ABC; Classe D (metais): Pó especial; Classe K (cozinha): Extintor específico para óleos e gorduras. Cada tipo tem agente extintor específico.',
    0.9,
    'manual'
FROM public.studios s;

-- Adicionar padrões de resposta para Fire Protection
INSERT INTO public.ai_response_patterns (studio_id, pattern_name, pattern_type, template, variables, context_keywords, success_rate)
SELECT 
    s.id,
    'fire_protection_greeting',
    'greeting',
    'Olá! Sou o assistente virtual da {studio_name}, especialista em proteção contra incêndios. Posso ajudar com vistorias, manutenção de extintores, sistemas de combate e certificações.',
    '["{studio_name}"]'::jsonb,
    ARRAY['fire_protection', 'extintor', 'vistoria'],
    0.8
FROM public.studios s;

INSERT INTO public.ai_response_patterns (studio_id, pattern_name, pattern_type, template, variables, context_keywords, success_rate)
SELECT 
    s.id,
    'fire_protection_emergency',
    'information',
    '⚠️ EMERGÊNCIA: Ligue imediatamente para (11) 4000-1111 - Equipe 24/7. Para acidentes com fogo, saia do local e ligue 193 (Corpo de Bombeiros). Não tente apagar incêndios grandes sem treinamento.',
    '[]'::jsonb,
    ARRAY['emergência', 'fogo', 'incêndio', 'perigo'],
    0.95
FROM public.studios s;

INSERT INTO public.ai_response_patterns (studio_id, pattern_name, pattern_type, template, variables, context_keywords, success_rate)
SELECT 
    s.id,
    'fire_protection_scheduling',
    'confirmation',
    '✅ Vistoria agendada! Data: {date} - Horário: {time}. Endereço: {address}. Nossa equipe chegará com equipamentos necessários. Valor estimado: R$ {price}. Confirme por WhatsApp (11) 99999-8888.',
    '["{date}", "{time}", "{address}", "{price}"]'::jsonb,
    ARRAY['agendar', 'marcar', 'confirmar'],
    0.85
FROM public.studios s;

-- Adicionar contexto dinâmico para Fire Protection
INSERT INTO public.ai_dynamic_context (studio_id, context_type, content, priority, source)
SELECT 
    s.id,
    'fire_safety_info',
    '{
      "services": [
        "Vistoria técnica de extintores",
        "Recarga e manutenção",
        "Instalação de sistemas",
        "Laudos técnicos",
        "Treinamento de brigada"
      ],
      "emergency_contacts": {
        "technical": "(11) 4000-0000",
        "emergency": "(11) 4000-1111",
        "firefighters": "193"
      },
      "regulations": [
        "NBR 10721 - Extintores de incêndio",
        "NBR 12693 - Sistemas de combate a incêndio",
        "NR 23 - Proteção contra incêndio"
      ]
    }',
    1,
    'manual'
FROM public.studios s;

-- Log da migração
INSERT INTO admin_system_logs (type, source, message, studio, created_at)
VALUES (
  'info',
  'migration',
  'Conhecimento especializado Fire Protection adicionado ao AI Chat',
  'system',
  NOW()
);
