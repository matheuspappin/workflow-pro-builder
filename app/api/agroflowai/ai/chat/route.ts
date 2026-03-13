import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { checkStudioAccess, allowInternalAiCall } from '@/lib/auth'
import logger from '@/lib/logger'
import { buildCatarinaSystemPrompt, getContextTimestamp } from '@/lib/catarina'
import { resolveContactLayer } from '@/lib/ai-router'
import { aiLearning } from '@/lib/actions/ai-learning'
import { getCachedStudioContextAgroflowai } from '@/lib/ai-context-cache'

const AGRO_OS_TYPES = ['laudo_car', 'vistoria_ndvi', 'regularizacao', 'licenciamento', 'monitoramento', 'outro', 'environmental_os']

async function buildAgroFlowContext(studioId: string): Promise<string> {
  const [
    { data: clients },
    { data: osList },
    { data: properties },
    { data: engs },
    { data: techs },
    { data: finData },
  ] = await Promise.all([
    supabaseAdmin
      .from('students')
      .select('id, name, phone, metadata, status')
      .eq('studio_id', studioId)
      .eq('status', 'active')
      .limit(50),
    supabaseAdmin
      .from('service_orders')
      .select(`
        id, title, project_type, status, scheduled_at, observations,
        customer:students(name), professional:professionals!professional_id(name)
      `)
      .eq('studio_id', studioId)
      .in('project_type', AGRO_OS_TYPES)
      .order('created_at', { ascending: false })
      .limit(50),
    supabaseAdmin
      .from('agroflowai_properties')
      .select('id, name, city, state, total_area_ha, car_status, car_number')
      .eq('studio_id', studioId)
      .limit(30),
    supabaseAdmin
      .from('professionals')
      .select('id, name, professional_type, status')
      .eq('studio_id', studioId)
      .eq('professional_type', 'engineer')
      .eq('status', 'active'),
    supabaseAdmin
      .from('professionals')
      .select('id, name, professional_type, status')
      .eq('studio_id', studioId)
      .eq('professional_type', 'technician')
      .eq('status', 'active'),
    supabaseAdmin
      .from('financial_notes')
      .select('id, amount, status, source_type, created_at')
      .eq('studio_id', studioId)
      .in('status', ['pending', 'emitted', 'error'])
      .limit(30),
  ])

  const osAbertas = (osList || []).filter((o: any) => o.status === 'open' || o.status === 'in_progress')

  const formatDate = (d: string | null) => {
    if (!d) return '—'
    try {
      return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    } catch {
      return '—'
    }
  }

  let ctx = `
CONTEXTO DO AGROFLOW AI (FONTE DA VERDADE - USE APENAS ESTES DADOS):

👥 CLIENTES (Total: ${(clients || []).length})
${(clients || []).slice(0, 15).map((c: any) => {
  const m = (c.metadata || {}) as Record<string, any>
  return `- ${c.name} | ${c.phone || '—'} | Propriedade: ${m.property_name || '—'}`
}).join('\n')}

📋 ORDENS DE SERVIÇO (Total: ${(osList || []).length} | Abertas: ${osAbertas.length})
${(osList || []).slice(0, 12).map((o: any) => {
  const cust = (o as any).customer
  const prof = (o as any).professional
  return `- ${o.title || o.project_type} | Status: ${o.status} | Cliente: ${Array.isArray(cust) ? cust[0]?.name : cust?.name || '—'} | Técnico: ${Array.isArray(prof) ? prof[0]?.name : prof?.name || '—'} | Data: ${formatDate(o.scheduled_at)}`
}).join('\n')}

🏞️ PROPRIEDADES (Total: ${(properties || []).length})
${(properties || []).slice(0, 10).map((p: any) => `- ${p.name} | ${p.city || ''} ${p.state || ''} | ${p.total_area_ha || '—'} ha | CAR: ${p.car_status || '—'}`).join('\n') || 'Nenhuma propriedade cadastrada.'}

👨‍🔬 ENGENHEIROS: ${(engs || []).map((e: any) => e.name).join(', ') || '—'}
🔧 TÉCNICOS: ${(techs || []).map((t: any) => t.name).join(', ') || '—'}

${(finData || []).length > 0 ? `\n💰 PENDÊNCIAS FINANCEIRAS (EXCLUSIVO ADMIN): ${(finData || []).length} lançamentos` : ''}
`.trim()

  return ctx
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, history, model, context } = body
    if (!message?.trim()) {
      return NextResponse.json({ error: 'Mensagem é obrigatória' }, { status: 400 })
    }

    const contextStudioId = context?.studio_id || body?.studioId

    if (!contextStudioId) {
      return NextResponse.json({ error: 'studioId é obrigatório no contexto' }, { status: 400 })
    }

    if (!allowInternalAiCall(request)) {
      const access = await checkStudioAccess(request, contextStudioId)
      if (!access.authorized) return access.response
    }

    const [cached, learnedRes] = await Promise.all([
      getCachedStudioContextAgroflowai(contextStudioId),
      aiLearning.getLearnedKnowledge(contextStudioId, typeof message === 'string' ? message : (message?.content || '')).catch(() => []),
    ])
    const { reportRes, trainingRes, rulesRes } = cached

    const latestReport = (reportRes as any)?.data
    let contextContent: string
    if (latestReport?.content) {
      contextContent = latestReport.content
      logger.info(`AgroFlow Chat usando relatório de contexto`)
    } else {
      contextContent = await buildAgroFlowContext(contextStudioId)
    }

    const trainingRows = (trainingRes as any)?.data || []
    const fewShot = trainingRows.length > 0
      ? `\n--- EXEMPLOS ---\n${trainingRows.map((r: any) => `[U]: ${r.student_message}\n[IA]: ${r.ai_response}`).join('\n\n')}\n---\n`
      : ''
    const rulesRow = (rulesRes as any)?.data
    const rulesSection = rulesRow?.rules_text?.trim()
      ? `\n--- VALORES E REGRAS ESPECÍFICAS (USE ESTES DADOS) ---\n${rulesRow.rules_text.trim()}\n---\n`
      : ''
    const learned = (learnedRes || []) as { question?: string; answer?: string }[]
    const learnedSection = learned.length > 0
      ? `\n--- CONHECIMENTO APRENDIDO ---\n${learned.map((k: any) => `Q: ${k.question}\nR: ${k.answer}`).join('\n\n')}\n---\n`
      : ''
    contextContent = contextContent + rulesSection + fewShot + learnedSection

    const isAdmin = context?.is_admin || false
    const isStudent = context?.is_student || false
    const contactLayerFromContext = context?.contact_layer
    if (!isAdmin) {
      contextContent = contextContent.replace(/\(EXCLUSIVO ADMIN\)[\s\S]*?(?=\n\n|\n-|$)/g, '(oculto)')
    }

    const { data: studioRow } = await supabaseAdmin
      .from('studios')
      .select('name')
      .eq('id', contextStudioId)
      .maybeSingle()
    const studioName = studioRow?.name || 'AgroFlowAI'

    const contactLayer = resolveContactLayer(isAdmin, isStudent, 'agroflowai', contactLayerFromContext)
    const systemPrompt = buildCatarinaSystemPrompt({
      studioName,
      niche: 'agroflowai',
      contextContent,
      contactLayer: contactLayer as 'admin' | 'student' | 'lead',
      channel: 'whatsapp',
      includeLeadDetection: true,
      contextTimestamp: getContextTimestamp(),
      contactName: context?.contact_name,
      contactTypeLabel: context?.contact_type_label,
    })

    let apiKey = process.env.GOOGLE_AI_API_KEY
    let useGemini = true

    const { data: geminiKeys } = await supabaseAdmin
      .from('studio_api_keys')
      .select('api_key')
      .eq('studio_id', contextStudioId)
      .eq('service_name', 'gemini')
      .maybeSingle()

    if (geminiKeys?.api_key) apiKey = geminiKeys.api_key

    if (!apiKey) {
      const { data: openaiKeys } = await supabaseAdmin
        .from('studio_api_keys')
        .select('api_key')
        .eq('studio_id', contextStudioId)
        .eq('service_name', 'openai')
        .maybeSingle()
      if (openaiKeys?.api_key) {
        apiKey = openaiKeys.api_key
        useGemini = false
      } else {
        apiKey = process.env.OPENAI_API_KEY
        useGemini = false
      }
    }

    if (!apiKey) {
      return NextResponse.json({ error: 'Chave de API não configurada. Configure Gemini ou OpenAI em Configurações.' }, { status: 500 })
    }

    const validHistory = (history || []).filter((m: any) => m?.content?.trim())
    const lastMsg = typeof message === 'string' ? message.trim() : (message?.content || message?.message || String(message || '')).trim()

    if (useGemini && apiKey) {
      const contents: Array<{ role: string; parts: Array<{ text: string }> }> = []
      for (const msg of validHistory) {
        const role = msg.role === 'user' ? 'user' : 'model'
        contents.push({ role, parts: [{ text: msg.content }] })
      }
      contents.push({ role: 'user', parts: [{ text: lastMsg }] })

      const modelToUse = model || 'gemini-2.5-pro'
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelToUse}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents,
          generationConfig: { temperature: 0.25, maxOutputTokens: 1000 },
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        logger.error('Erro Gemini AgroFlow:', err)
        return NextResponse.json({ error: 'Erro ao processar com a IA' }, { status: 500 })
      }

      const result = await res.json()
      const text = result.candidates?.[0]?.content?.parts?.[0]?.text || 'Não foi possível gerar uma resposta.'
      if (text) {
        Promise.all([
          supabaseAdmin.from('ai_interactions').insert({
            studio_id: contextStudioId,
            customer_contact: context?.contact_name || 'chat_user',
            message: lastMsg,
            ai_response: text,
            intent_type: 'chat',
            channel: 'chat',
          }).then(() => {}, (e) => logger.warn('Erro ao salvar ai_interactions:', e)),
          aiLearning.learnFromInteraction({ studioId: contextStudioId, question: lastMsg, answer: text, confidence: 0.8 }).catch((e) => logger.warn('Erro learnFromInteraction:', e))
        ]).catch(() => {})
      }
      return NextResponse.json({ response: text })
    }

    const openaiKey = apiKey
    const messages: Array<{ role: string; content: string }> = [
      { role: 'system', content: systemPrompt },
      ...validHistory.map((m: any) => ({ role: m.role, content: m.content })),
      { role: 'user', content: lastMsg },
    ]

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages,
        max_tokens: 1000,
        temperature: 0.5,
      }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      logger.error('Erro OpenAI AgroFlow:', err)
      return NextResponse.json({ error: 'Erro ao processar com a IA' }, { status: 500 })
    }

    const data = await res.json()
    const text = data.choices?.[0]?.message?.content || 'Não foi possível gerar uma resposta.'
    if (text) {
      Promise.all([
        supabaseAdmin.from('ai_interactions').insert({
          studio_id: contextStudioId,
          customer_contact: context?.contact_name || 'chat_user',
          message: lastMsg,
          ai_response: text,
          intent_type: 'chat',
          channel: 'chat',
        }).then(() => {}, (e) => logger.warn('Erro ao salvar ai_interactions:', e)),
        aiLearning.learnFromInteraction({ studioId: contextStudioId, question: lastMsg, answer: text, confidence: 0.8 }).catch((e) => logger.warn('Erro learnFromInteraction:', e))
      ]).catch(() => {})
    }
    return NextResponse.json({ response: text })
  } catch (error: any) {
    logger.error('Erro agroflowai ai/chat:', error)
    return NextResponse.json({ error: error?.message || 'Erro interno' }, { status: 500 })
  }
}
