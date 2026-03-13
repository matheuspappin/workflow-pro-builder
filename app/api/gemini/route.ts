import { NextRequest, NextResponse } from 'next/server'
import { getStudentsData, getTeachersData, getFinancialData, getClassesData, getLeadsData, getInventoryData } from '@/lib/supabase'
import { getCachedStudioContextDance } from '@/lib/ai-context-cache'
import { supabase } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabase-admin'
import logger from '@/lib/logger'
import { buildCatarinaSystemPrompt, getContextTimestamp } from '@/lib/catarina'
import { resolveContactLayer } from '@/lib/ai-router'
import { aiLearning } from '@/lib/actions/ai-learning'
import { allowInternalAiCall, checkStudioAccess } from '@/lib/auth'
import { checkAiRateLimit } from '@/lib/rate-limit'

/**
 * ENGINE DE IA - Catarina (Secretária Virtual)
 * Dance/Estúdio de Dança - Atendimento via WhatsApp e Chat
 */
export async function POST(request: NextRequest) {
  try {
    const { message, history, context, model } = await request.json()
    if (!message) return NextResponse.json({ error: 'Mensagem vazia' }, { status: 400 })

    const studioId = context?.studio_id || context?.studioId || "00000000-0000-0000-0000-000000000000"
    const isAdmin = context?.is_admin || false
    const isStudent = context?.is_student || false
    const contactLayerFromContext = context?.contact_layer

    // Verificar autorização: chamadas internas (webhook WhatsApp) ou usuário autenticado com acesso ao studio
    const isInternal = allowInternalAiCall(request)
    if (!isInternal && studioId !== "00000000-0000-0000-0000-000000000000") {
      const access = await checkStudioAccess(request, studioId)
      if (!access.authorized) return access.response
    }

    // Rate limit por estúdio — protege cota da Google AI API contra abuso por tenant
    if (studioId !== "00000000-0000-0000-0000-000000000000") {
      const rateCheck = await checkAiRateLimit(studioId)
      if (!rateCheck.allowed) {
        return NextResponse.json(
          { error: 'Muitas requisições. Aguarde antes de enviar outra mensagem.' },
          {
            status: 429,
            headers: rateCheck.retryAfter
              ? { 'Retry-After': String(rateCheck.retryAfter) }
              : {},
          }
        )
      }
    }

    // 0. BUSCAR DADOS DO ESTÚDIO E CHAVE DE API
    let apiKey = process.env.GOOGLE_AI_API_KEY
    let studioName = "Workflow AI";

    const { data: studioData } = await supabase
      .from('studios')
      .select('name')
      .eq('id', studioId)
      .maybeSingle();
    
    if (studioData?.name) {
      studioName = studioData.name;
    }

    if (studioId && studioId !== "00000000-0000-0000-0000-000000000000") {
      const { data: studioKeys } = await supabase
        .from('studio_api_keys')
        .select('api_key')
        .eq('studio_id', studioId)
        .eq('service_name', 'gemini')
        .maybeSingle();
      if (studioKeys?.api_key) apiKey = studioKeys.api_key;
    }

    if (!apiKey) return NextResponse.json({ error: 'Chave API não configurada' }, { status: 500 })

    // 1. CARREGAR CONTEXTO — cache Redis para report/training/rules/leads/inv (1h TTL)
    // learnedKnowledge NÃO cacheado (depende da mensagem do usuário)
    const [cached, learnedRes] = await Promise.all([
      studioId !== "00000000-0000-0000-0000-000000000000" ? getCachedStudioContextDance(studioId) : Promise.resolve({
        reportRes: { data: null },
        trainingRes: { data: [] },
        rulesRes: { data: null },
        modelSettingRes: { data: null },
        leadsData: { total: 0, byStage: {}, recent: [] },
        invData: { totalProducts: 0, totalItems: 0, totalValue: 0, products: [], lowStock: [] },
      }),
      studioId !== "00000000-0000-0000-0000-000000000000" ? aiLearning.getLearnedKnowledge(studioId, message).catch(() => []) : Promise.resolve([]),
    ])
    const { reportRes, trainingRes, rulesRes, modelSettingRes, leadsData, invData } = cached

    const latestReport = reportRes?.data
    let contextContent = latestReport?.content || ""

    if (!contextContent) {
      const [sStats, tStats, fStats, cStats] = await Promise.all([
        getStudentsData(studioId), getTeachersData(studioId), getFinancialData(studioId), getClassesData(studioId)
      ])
      contextContent = `
RESUMO ATUAL (Sincronização Direta - USE ESTES DADOS para responder "quantos alunos", "quantas turmas", etc.):
- Total de Alunos: ${sStats.total}
- Alunos Ativos: ${sStats.active}
- Novos este mês: ${sStats.newThisMonth}
- Taxa de retenção: ${sStats.retentionRate}%
- Financeiro Mensal: R$ ${fStats.monthlyRevenue}
- Turmas Ativas: ${cStats.active}
- Professores Ativos: ${tStats.active}
`
    }

    // Sempre incluir CRM e Estoque (Catarina deve ter acesso a essas informações)
    const leadsByStage = Object.entries(leadsData.byStage).map(([s, n]) => `${s}: ${n}`).join(', ') || 'nenhum'
    const leadsRecent = leadsData.recent.length > 0
      ? leadsData.recent.map(l => `  - ${l.name}${l.phone ? ` (${l.phone})` : ''} - ${l.stage}`).join('\n')
      : '  (nenhum lead cadastrado)'
    const invProducts = invData.products.length > 0
      ? invData.products.map(p => `  - ${p.name}: ${p.quantity} un (mín: ${p.minStock})${p.price ? ` - R$ ${p.price}` : ''}`).join('\n')
      : '  (nenhum produto cadastrado)'
    const invLowStock = invData.lowStock.length > 0
      ? invData.lowStock.map(p => `  - ${p.name}: ${p.quantity} (mínimo: ${p.minStock})`).join('\n')
      : '  (nenhum produto abaixo do mínimo)'
    const crmInventorySection = `

--- CRM (LEADS/CLIENTES) - USE para "quantos clientes no CRM", listar leads ---
- Total de clientes no CRM: ${leadsData.total}
- Por estágio: ${leadsByStage}
- Últimos cadastrados:
${leadsRecent}

--- ESTOQUE - USE para perguntas sobre produtos, itens disponíveis, estoque baixo ---
- Total de produtos: ${invData.totalProducts}
- Total de itens em estoque: ${invData.totalItems}
- Valor total (preço de venda): R$ ${invData.totalValue.toFixed(2)}
- Produtos principais:
${invProducts}
- Produtos abaixo do mínimo:
${invLowStock}
`
    contextContent = contextContent + crmInventorySection

    // Few-shot: exemplos de treinamento
    const trainingRows = trainingRes.data || []
    const fewShotExamples = trainingRows.length > 0
      ? `\n--- EXEMPLOS DE CONVERSA (use como referência de estilo e tom) ---\n${trainingRows.map((r: any) => `[Usuário]: ${r.student_message}\n[IA]: ${r.ai_response}`).join('\n\n')}\n--- FIM DOS EXEMPLOS ---\n`
      : ""

    // Valores e regras específicas (Controlador)
    const rulesRow = (rulesRes as any)?.data
    const rulesSection = rulesRow?.rules_text?.trim()
      ? `\n--- VALORES E REGRAS ESPECÍFICAS (USE ESTES DADOS) ---\n${rulesRow.rules_text.trim()}\n--- FIM ---\n`
      : ""

    // Conhecimento aprendido
    const learned = (learnedRes || []) as { question?: string; answer?: string }[]
    const learnedSection = learned.length > 0
      ? `\n--- CONHECIMENTO APRENDIDO (use quando relevante) ---\n${learned.map((k: any) => `Q: ${k.question}\nR: ${k.answer}`).join('\n\n')}\n--- FIM ---\n`
      : ""

    contextContent = contextContent + rulesSection + fewShotExamples + learnedSection

    // 2. CONSTRUIR O SYSTEM PROMPT (Catarina)
    const contactLayer = resolveContactLayer(isAdmin, isStudent, 'dance', contactLayerFromContext)
    const systemPrompt = buildCatarinaSystemPrompt({
      studioName,
      niche: 'dance',
      contextContent,
      contactLayer: contactLayer as 'admin' | 'student' | 'lead',
      channel: 'whatsapp',
      includeLeadDetection: true,
      contextTimestamp: getContextTimestamp(),
      contactName: context?.contact_name,
      contactTypeLabel: context?.contact_type_label,
    })

    // 3. PREPARAR HISTÓRICO
    let contents = []
    const validHistory = (history || []).filter((msg: any) => msg.content && msg.content.trim() !== "")
    let lastRole = ""
    for (const msg of validHistory) {
      const role = msg.role === 'user' ? 'user' : 'model'
      if (role !== lastRole) {
        contents.push({ role: role, parts: [{ text: msg.content }] })
        lastRole = role
      }
    }
    if (contents.length > 0 && contents[0].role === 'model') contents.shift()
    contents.push({ role: 'user', parts: [{ text: message }] })

    // 4. CHAMADA AO GEMINI (com fallback de modelos)
    const configuredModel = (modelSettingRes as any)?.data?.setting_value?.trim()
    const validModels = ['gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.0-flash']
    const preferredModel = configuredModel && validModels.includes(configuredModel) ? configuredModel : (model || 'gemini-2.5-pro')
    const modelFallbacks = [preferredModel, ...validModels.filter((m) => m !== preferredModel)]
    let lastError: string | null = null

    const startTime = Date.now()
    for (const modelToUse of modelFallbacks) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelToUse}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents: contents,
            generationConfig: { temperature: 0.25, maxOutputTokens: 800 },
          }),
        })

        const result = await response.json()
        const latencyMs = Date.now() - startTime

        if (!response.ok) {
          const errMsg = result?.error?.message || result?.error?.status || `HTTP ${response.status}`
          lastError = errMsg
          const isRetryable = response.status >= 500 || response.status === 429
          logger.warn(`Gemini ${modelToUse} falhou (${latencyMs}ms):`, errMsg, isRetryable ? '- retrying' : '')
          if (isRetryable) await new Promise((r) => setTimeout(r, 500))
          continue
        }

        if (result.promptFeedback?.blockReason) {
          logger.warn('⚠️ Gemini bloqueou o prompt:', result.promptFeedback)
        }

        logger.info(`Gemini ${modelToUse} ok`, { studioId: studioId.slice(0, 8), latencyMs, model: modelToUse })

        const aiResponse = result.candidates?.[0]?.content?.parts?.[0]?.text
        if (aiResponse) {
          // Pós-processamento: salvar interação e aprender (fire-and-forget)
          if (studioId && studioId !== "00000000-0000-0000-0000-000000000000") {
            Promise.all([
              supabaseAdmin.from('ai_interactions').insert({
                studio_id: studioId,
                customer_contact: context?.contact_name || 'chat_user',
                message,
                ai_response: aiResponse,
                intent_type: 'chat',
                channel: 'chat',
              }).then(() => {}, (e) => logger.warn('Erro ao salvar ai_interactions:', e)),
              aiLearning.learnFromInteraction({ studioId, question: message, answer: aiResponse, confidence: 0.8 }).catch((e) => logger.warn('Erro learnFromInteraction:', e))
            ]).catch(() => {})
          }
          return NextResponse.json({ response: aiResponse })
        }
      } catch (e: any) {
        lastError = e?.message || 'Erro de conexão'
        logger.warn(`Gemini ${modelToUse} erro:`, lastError)
      }
    }

    const userMsg = lastError?.toLowerCase().includes('api key') || lastError?.toLowerCase().includes('invalid')
      ? 'Chave da API inválida. Verifique GOOGLE_AI_API_KEY no .env.'
      : lastError || 'Não foi possível obter resposta da IA. Tente novamente.'
    return NextResponse.json({ error: userMsg }, { status: 500 })

  } catch (error: any) {
    logger.error('💥 Erro Gemini:', error)
    const msg = error?.message || 'Erro interno no servidor.'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
