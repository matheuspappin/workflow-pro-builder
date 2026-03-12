-- 115. Adicionar coluna niche em ai_training_conversations para treinamento por vertical
-- Permite filtrar exemplos por dance, fire_protection, agroflowai

ALTER TABLE public.ai_training_conversations
ADD COLUMN IF NOT EXISTS niche TEXT DEFAULT 'dance';

CREATE INDEX IF NOT EXISTS idx_ai_training_conversations_niche 
ON public.ai_training_conversations(niche);

COMMENT ON COLUMN public.ai_training_conversations.niche IS 'Vertical: dance, fire_protection, agroflowai. Default dance para retrocompatibilidade.';
