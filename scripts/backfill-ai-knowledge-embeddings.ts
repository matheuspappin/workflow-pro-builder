/**
 * Backfill: gera embeddings para registros ai_learned_knowledge que ainda não têm vetor.
 * 
 * Uso: npx tsx scripts/backfill-ai-knowledge-embeddings.ts
 * 
 * Requer:
 *   - SUPABASE_SERVICE_ROLE_KEY
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - GOOGLE_AI_API_KEY
 */

import { createClient } from '@supabase/supabase-js'

const BATCH_SIZE = 50
const EMBEDDING_MODEL = 'text-embedding-004'
const GOOGLE_API_KEY = process.env.GOOGLE_AI_API_KEY
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!GOOGLE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Configure GOOGLE_AI_API_KEY, NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${EMBEDDING_MODEL}:batchEmbedContents?key=${GOOGLE_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: texts.map(text => ({
          model: `models/${EMBEDDING_MODEL}`,
          content: { parts: [{ text }] },
        })),
      }),
    }
  )

  if (!response.ok) {
    throw new Error(`Gemini Embedding API error: ${response.status} ${await response.text()}`)
  }

  const data = await response.json() as { embeddings: { values: number[] }[] }
  return data.embeddings.map(e => e.values)
}

async function main() {
  console.log('Iniciando backfill de embeddings...')
  let offset = 0
  let totalProcessed = 0

  while (true) {
    const { data: records, error } = await supabase
      .from('ai_learned_knowledge')
      .select('id, question, answer')
      .is('embedding', null)
      .range(offset, offset + BATCH_SIZE - 1)

    if (error) {
      console.error('Erro ao buscar registros:', error)
      process.exit(1)
    }

    if (!records || records.length === 0) {
      console.log(`Backfill concluído. Total processado: ${totalProcessed}`)
      break
    }

    console.log(`Processando batch: ${records.length} registros (offset ${offset})`)

    // Concatena question + answer para embedding mais rico
    const texts = records.map(r => `${r.question}\n${r.answer}`)

    const embeddings = await generateEmbeddings(texts)

    // Atualiza em paralelo
    await Promise.all(
      records.map((record, i) =>
        supabase
          .from('ai_learned_knowledge')
          .update({ embedding: embeddings[i] })
          .eq('id', record.id)
      )
    )

    totalProcessed += records.length
    offset += BATCH_SIZE

    // Throttle para respeitar rate limit da Google API (1500 req/min no free tier)
    await new Promise(resolve => setTimeout(resolve, 200))
  }
}

main().catch(err => {
  console.error('Backfill falhou:', err)
  process.exit(1)
})
