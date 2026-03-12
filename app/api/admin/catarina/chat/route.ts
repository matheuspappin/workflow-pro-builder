import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createClient } from '@/lib/supabase/server'
import { getContextTimestamp } from '@/lib/catarina'
import logger from '@/lib/logger'

/** Detecta se a mensagem pede dados do ecossistema (clientes, tenants, etc.) */
function wantsEcosystemData(message: string): boolean {
  const m = message.toLowerCase().trim()
  const terms = [
    'clientes', 'clientes que temos', 'tenants', 'empresas', 'estúdios', 'estudios',
    'quantos', 'quantas', 'lista de', 'listar', 'quem são', 'quem sao',
    'total de', 'número de', 'numero de', 'cadastrados', 'cadastradas',
  ]
  return terms.some((t) => m.includes(t))
}

/** Busca dados do ecossistema para injetar no contexto */
async function fetchAdminContextData(): Promise<string> {
  try {
    const [studiosRes, countRes] = await Promise.all([
      supabaseAdmin
        .from('studios')
        .select('name, plan, status, created_at')
        .order('created_at', { ascending: false })
        .limit(25),
      supabaseAdmin.from('studios').select('*', { count: 'exact', head: true }),
    ])

    const studios = studiosRes.data || []
    const total = countRes.count ?? 0

    if (total === 0) return 'Nenhum tenant/estúdio cadastrado no momento.'

    const lines = [
      `Total de tenants/empresas: ${total}`,
      '',
      'Lista (últimos 25):',
      ...studios.map((s: any, i: number) =>
        `${i + 1}. ${s.name || 'Sem nome'} | Plano: ${s.plan || '—'} | Status: ${s.status || 'active'}`
      ),
    ]
    return lines.join('\n')
  } catch (e) {
    logger.warn('Erro ao buscar contexto admin:', e)
    return 'Dados temporariamente indisponíveis.'
  }
}

/** Monta seção de contexto para ajuda na importação */
function buildImportContextSection(ctx: {
  headers?: string[]
  sample?: any[]
  mapping?: Record<string, string>
  errors?: string[]
  importType?: string
  dataQuality?: { completeness?: number; consistency?: number; validity?: number }
}): string {
  const parts: string[] = []
  if (ctx.headers?.length) parts.push(`Colunas do arquivo: ${ctx.headers.join(', ')}`)
  if (ctx.importType) parts.push(`Tipo de importação: ${ctx.importType}`)
  if (ctx.mapping && Object.keys(ctx.mapping).length > 0) {
    parts.push(`Mapeamento atual: ${JSON.stringify(ctx.mapping)}`)
  }
  if (ctx.sample?.length) {
    const sampleStr = JSON.stringify(ctx.sample.slice(0, 3), null, 0).slice(0, 500)
    parts.push(`Amostra (3 primeiros): ${sampleStr}`)
  }
  if (ctx.errors?.length) parts.push(`Erros: ${ctx.errors.join('; ')}`)
  if (ctx.dataQuality) {
    parts.push(`Qualidade: Completude ${ctx.dataQuality.completeness?.toFixed(1)}%, Consistência ${ctx.dataQuality.consistency?.toFixed(1)}%, Validade ${ctx.dataQuality.validity?.toFixed(1)}%`)
  }
  return parts.join('\n')
}

/** Prompt para chat admin - persona Catarina, sem expor LLM/Google */
function buildAdminChatPrompt(studioName: string, contextContent: string): string {
  const ts = getContextTimestamp()
  return `Você é a Catarina, assistente virtual do ecossistema "${studioName}".

IDENTIDADE (OBRIGATÓRIO):
- Apresente-se APENAS como "Catarina, assistente virtual do AKAAI Hub".
- NUNCA diga que é "modelo de linguagem", "IA", "treinada pelo Google", "LLM" ou similar.
- NUNCA exponha detalhes técnicos sobre como foi construída.

CONTEXTO:
- Você está conversando com o Super Admin (administrador do sistema).
- Data/hora: ${ts}

INSTRUÇÕES:
1. Responda de forma natural e amigável a saudações (olá, oi, como vai?), perguntas básicas e dúvidas gerais.
2. Pode explicar o que você faz, o que é o AKAAI Hub, funcionalidades do produto.
3. Use os DADOS DO ECOSSISTEMA abaixo quando o admin perguntar sobre clientes, tenants, empresas ou estúdios.
4. Seja objetiva: respostas curtas (2-4 frases quando possível). Use **negrito** para termos importantes.
5. Responda SEMPRE no idioma da mensagem do usuário (pt-BR, en, es).
6. Evite começar com "Ótima pergunta!" ou "Excelente dúvida!" — vá direto ao ponto.

DADOS DO ECOSSISTEMA (use para perguntas sobre clientes/tenants/empresas):
${contextContent}

Se não souber algo específico, diga de forma breve e sugira onde o admin pode encontrar a informação.`
}

async function requireSuperAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { ok: false, res: NextResponse.json({ error: 'Não autenticado' }, { status: 401 }) }
  }
  const { data: internalUser } = await supabaseAdmin
    .from('users_internal')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()
  const role = internalUser?.role ?? user.user_metadata?.role
  if (role !== 'super_admin' && role !== 'superadmin') {
    return { ok: false, res: NextResponse.json({ error: 'Acesso restrito a super administradores' }, { status: 403 }) }
  }
  return { ok: true }
}

export async function POST(request: NextRequest) {
  const auth = await requireSuperAdmin()
  if (!auth.ok) return auth.res!

  try {
    const body = await request.json()
    const { message, history, studioId, importContext } = body

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Mensagem é obrigatória' }, { status: 400 })
    }

    const contextStudioId = studioId || '00000000-0000-0000-0000-000000000000'
    let studioName = 'AKAAI Hub'
    let contextContent = 'Você está em modo de conversa com o Super Admin do ecossistema AKAAI Hub. Pode responder perguntas gerais, sobre o sistema, ou ajudar com dúvidas sobre o produto.'

    if (contextStudioId && contextStudioId !== '00000000-0000-0000-0000-000000000000') {
      const { data: studioRow } = await supabaseAdmin
        .from('studios')
        .select('name')
        .eq('id', contextStudioId)
        .maybeSingle()
      if (studioRow?.name) studioName = studioRow.name

      const { data: latestReport } = await supabaseAdmin
        .from('studio_ai_reports')
        .select('content')
        .eq('studio_id', contextStudioId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (latestReport?.content) contextContent = latestReport.content
    }

    const msg = message.trim()
    if (wantsEcosystemData(msg)) {
      const ecosystemData = await fetchAdminContextData()
      contextContent = ecosystemData
    }

    let systemPrompt = buildAdminChatPrompt(studioName, contextContent)
    if (importContext && typeof importContext === 'object') {
      const importSection = buildImportContextSection(importContext)
      systemPrompt += `\n\n--- CONTEXTO DE IMPORTAÇÃO (o admin está na tela de importação de dados) ---\n${importSection}\n\nUse estes dados para ajudar com mapeamento de colunas, correção de erros, formatação e dúvidas sobre a importação. Seja objetiva e sugira correções concretas.`
    }

    const validHistory = (history || []).filter((m: any) => m.content?.trim())
    const contents: { role: string; parts: { text: string }[] }[] = []
    let lastRole = ''
    for (const h of validHistory) {
      const role = h.role === 'user' ? 'user' : 'model'
      if (role !== lastRole) {
        contents.push({ role, parts: [{ text: h.content }] })
        lastRole = role
      }
    }
    if (contents.length > 0 && contents[0].role === 'model') contents.shift()
    contents.push({ role: 'user', parts: [{ text: message.trim() }] })

    const apiKey = process.env.GOOGLE_AI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Chave GOOGLE_AI_API_KEY não configurada no servidor.' },
        { status: 500 }
      )
    }

    const modelFallbacks = ['gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.0-flash']
    let lastError: string | null = null

    for (const modelToUse of modelFallbacks) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelToUse}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              systemInstruction: { parts: [{ text: systemPrompt }] },
              contents,
              generationConfig: { temperature: 0.5, maxOutputTokens: 800 },
            }),
          }
        )

        const result = await response.json()

        if (!response.ok) {
          const errMsg = result?.error?.message || result?.error?.status || `HTTP ${response.status}`
          lastError = errMsg
          logger.warn(`Gemini ${modelToUse} falhou:`, errMsg)
          continue
        }

        const aiResponse = result.candidates?.[0]?.content?.parts?.[0]?.text
        if (aiResponse) {
          return NextResponse.json({ response: aiResponse })
        }
      } catch (e: any) {
        lastError = e?.message || 'Erro de conexão'
        logger.warn(`Gemini ${modelToUse} erro:`, lastError)
      }
    }

    const userMsg =
      lastError?.toLowerCase().includes('api key') || lastError?.toLowerCase().includes('invalid')
        ? 'Chave da API inválida. Verifique GOOGLE_AI_API_KEY no .env.'
        : lastError || 'Não foi possível obter resposta da IA. Tente novamente.'
    return NextResponse.json({ error: userMsg }, { status: 500 })
  } catch (error: any) {
    logger.error('Erro no chat admin Catarina:', error)
    return NextResponse.json({ error: error?.message || 'Erro interno' }, { status: 500 })
  }
}
