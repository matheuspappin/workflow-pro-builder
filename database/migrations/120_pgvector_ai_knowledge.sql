-- Migration 120: Adiciona busca semântica por vetores na ai_learned_knowledge
-- Requer extensão pgvector (disponível no Supabase por padrão).
-- O embedding é gerado pela aplicação (Gemini text-embedding-004, 768 dims)
-- antes de inserir/atualizar o registro.

-- Ativa a extensão (idempotente)
CREATE EXTENSION IF NOT EXISTS vector;

-- Adiciona coluna de embedding na tabela existente
ALTER TABLE ai_learned_knowledge
  ADD COLUMN IF NOT EXISTS embedding vector(768);

-- Índice HNSW para busca aproximada de vizinhos mais próximos (ANN)
-- HNSW > IVFFlat para latência em produção (sem necessidade de treino prévio)
CREATE INDEX IF NOT EXISTS idx_ai_knowledge_embedding
  ON ai_learned_knowledge
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Índice por studio para filtrar antes do vector search (evita full-scan cross-tenant)
CREATE INDEX IF NOT EXISTS idx_ai_knowledge_studio_embedding
  ON ai_learned_knowledge (studio_id)
  WHERE embedding IS NOT NULL;

-- Função RPC para busca semântica por studio (chamada pela aplicação)
-- p_embedding: vetor gerado pelo Gemini para a query do usuário
-- p_studio_id: isolamento por tenant
-- p_threshold: similaridade mínima (0.0 a 1.0) — recomendado 0.75
-- p_limit: máximo de resultados
CREATE OR REPLACE FUNCTION search_ai_knowledge(
  p_embedding vector(768),
  p_studio_id UUID,
  p_threshold FLOAT DEFAULT 0.75,
  p_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  question TEXT,
  answer TEXT,
  confidence_score FLOAT,
  usage_count INTEGER,
  similarity FLOAT
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT
    k.id,
    k.question,
    k.answer,
    k.confidence_score,
    k.usage_count,
    (1 - (k.embedding <=> p_embedding))::FLOAT AS similarity
  FROM ai_learned_knowledge k
  WHERE
    k.studio_id = p_studio_id
    AND k.embedding IS NOT NULL
    AND (1 - (k.embedding <=> p_embedding)) >= p_threshold
  ORDER BY k.embedding <=> p_embedding ASC
  LIMIT p_limit;
END;
$$;

COMMENT ON FUNCTION search_ai_knowledge IS
  'Busca semântica ANN na base de conhecimento de AI por estúdio. '
  'Requer que os registros tenham embedding pré-computado (via Gemini text-embedding-004). '
  'Retorna os K resultados mais similares acima do threshold de similaridade cosseno.';

-- Instrução: após aplicar esta migration, rodar o script de backfill:
-- scripts/backfill-ai-knowledge-embeddings.ts
-- Ele lê registros sem embedding e chama a Gemini Embedding API em batches.
COMMENT ON COLUMN ai_learned_knowledge.embedding IS
  'Vetor de embedding 768-dim gerado pelo modelo text-embedding-004 do Google. '
  'NULL = ainda não processado pelo backfill. Backfill: scripts/backfill-ai-knowledge-embeddings.ts';
