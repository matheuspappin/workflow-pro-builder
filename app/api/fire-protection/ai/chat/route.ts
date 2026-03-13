import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { checkStudioAccess, allowInternalAiCall } from '@/lib/auth'
import logger from '@/lib/logger'
import { getNichePrompt, getContextTimestamp } from '@/lib/catarina'
import { aiLearning } from '@/lib/actions/ai-learning'
import { getCachedStudioContextFireProtection } from '@/lib/ai-context-cache'

const CHECKLIST_PADRAO = [
  { title: 'Extintores dentro do prazo de validade', order_index: 0 },
  { title: 'Extintores com carga adequada e lacres intactos', order_index: 1 },
  { title: 'Sinalização de emergência visível e legível', order_index: 2 },
  { title: 'Saídas de emergência desobstruídas', order_index: 3 },
  { title: 'Iluminação de emergência funcionando', order_index: 4 },
  { title: 'Sistema de hidrantes com pressão adequada', order_index: 5 },
  { title: 'Mangueiras de incêndio em bom estado', order_index: 6 },
  { title: 'Detectores de fumaça / calor funcionando', order_index: 7 },
  { title: 'Alarme de incêndio testado e funcionando', order_index: 8 },
  { title: 'Planta de emergência visível e atualizada', order_index: 9 },
  { title: 'Rotas de fuga sinalizadas corretamente', order_index: 10 },
  { title: 'Sprinklers sem obstruções e funcionando', order_index: 11 },
]

/** Declarações de funções para a IA - formato JSON Schema (lowercase) para evitar MALFORMED_FUNCTION_CALL */
const FIRE_TOOLS = {
  functionDeclarations: [
    {
      name: 'listar_clientes',
      description: 'Lista clientes. Retorna id e name. Use busca com parte do nome.',
      parameters: {
        type: 'object',
        properties: {
          busca: { type: 'string', description: 'Filtro opcional por nome (ex: Condomínio)' },
        },
      },
    },
    {
      name: 'listar_tecnicos',
      description: 'Lista técnicos e engenheiros disponíveis.',
      parameters: { type: 'object', properties: {} },
    },
    {
      name: 'agendar_vistoria',
      description: 'Agenda vistoria. Tipos: rotineira, hidrantes, AVCB, inicial, sprinklers.',
      parameters: {
        type: 'object',
        properties: {
          customer_id: { type: 'string', description: 'UUID do cliente (de listar_clientes)' },
          vistoria_type: { type: 'string', description: 'rotineira, hidrantes, AVCB, inicial, sprinklers' },
          professional_id: { type: 'string', description: 'UUID do técnico (opcional)' },
          scheduled_at: { type: 'string', description: 'YYYY-MM-DD ou YYYY-MM-DDTHH:mm' },
          description: { type: 'string', description: 'Observações' },
        },
        required: ['customer_id', 'vistoria_type'],
      },
    },
    {
      name: 'criar_os',
      description: 'Cria Ordem de Serviço (recarga, manutenção, instalação).',
      parameters: {
        type: 'object',
        properties: {
          customer_id: { type: 'string', description: 'UUID do cliente' },
          title: { type: 'string', description: 'Título (ex: Recarga extintores)' },
          professional_id: { type: 'string', description: 'UUID do técnico (opcional)' },
          scheduled_at: { type: 'string', description: 'YYYY-MM-DD ou YYYY-MM-DDTHH:mm' },
          description: { type: 'string', description: 'Descrição' },
          project_type: { type: 'string', description: 'common, recarga, instalacao, manutencao' },
        },
        required: ['customer_id', 'title'],
      },
    },
    {
      name: 'atualizar_vistoria',
      description: 'Atualiza status ou reagenda vistoria.',
      parameters: {
        type: 'object',
        properties: {
          vistoria_id: { type: 'string', description: 'UUID da vistoria' },
          status: { type: 'string', description: 'open, in_progress, finished, cancelled, nao_conforme' },
          scheduled_at: { type: 'string', description: 'Nova data' },
          professional_id: { type: 'string', description: 'UUID do técnico' },
          observations: { type: 'string', description: 'Observações' },
        },
        required: ['vistoria_id'],
      },
    },
    {
      name: 'atualizar_os',
      description: 'Atualiza status ou reagenda OS.',
      parameters: {
        type: 'object',
        properties: {
          os_id: { type: 'string', description: 'UUID da OS' },
          status: { type: 'string', description: 'open, in_progress, finished, cancelled' },
          scheduled_at: { type: 'string', description: 'Nova data' },
          professional_id: { type: 'string', description: 'UUID do técnico' },
          observations: { type: 'string', description: 'Observações' },
        },
        required: ['os_id'],
      },
    },
    {
      name: 'listar_vistorias',
      description: 'Lista vistorias. Filtros por status ou cliente.',
      parameters: {
        type: 'object',
        properties: {
          status: { type: 'string', description: 'open, in_progress, finished, todos' },
          customer_id: { type: 'string', description: 'UUID do cliente' },
        },
      },
    },
    {
      name: 'listar_os',
      description: 'Lista Ordens de Serviço.',
      parameters: {
        type: 'object',
        properties: {
          status: { type: 'string', description: 'open, in_progress, finished, todos' },
          customer_id: { type: 'string', description: 'UUID do cliente' },
        },
      },
    },
    {
      name: 'listar_extintores_vencendo',
      description: 'Lista extintores vencidos ou vencendo em X dias.',
      parameters: {
        type: 'object',
        properties: {
          dias: { type: 'number', description: 'Dias para vencer (default 30)' },
        },
      },
    },
  ],
}

type ToolHandler = (args: Record<string, unknown>, studioId: string) => Promise<unknown>

const toolHandlers: Record<string, ToolHandler> = {
  listar_clientes: async (args, studioId) => {
    const busca = (args.busca as string)?.trim()
    let q = supabaseAdmin
      .from('students')
      .select('id, name, phone, email')
      .eq('studio_id', studioId)
      .eq('status', 'active')
      .order('name')
      .limit(50)
    if (busca) q = q.ilike('name', `%${busca}%`)
    const { data, error } = await q
    if (error) throw error
    const clientes = data || []
    return {
      clientes: clientes.map((c: any) => ({ id: c.id, name: c.name, phone: c.phone })),
      instrucao: clientes.length ? 'Use o campo "id" de um cliente como customer_id em agendar_vistoria ou criar_os.' : 'Nenhum cliente encontrado. Cadastre clientes em Clientes / Edificações.',
    }
  },
  listar_tecnicos: async (_, studioId) => {
    const { data: techs } = await supabaseAdmin
      .from('professionals')
      .select('id, name, professional_type')
      .eq('studio_id', studioId)
      .in('professional_type', ['technician', 'engineer'])
      .eq('status', 'active')
    const tecnicos = techs || []
    return {
      tecnicos,
      instrucao: tecnicos.length ? 'Use o campo "id" como professional_id em agendar_vistoria ou criar_os (opcional).' : 'Nenhum técnico cadastrado.',
    }
  },
  agendar_vistoria: async (args, studioId) => {
    const customer_id = (args.customer_id as string)?.trim()
    const vistoria_type = (args.vistoria_type as string) || 'rotineira'
    const professional_id = (args.professional_id as string) || null
    const scheduled_at = normalizeScheduledAt(args.scheduled_at as string)
    const description = (args.description as string) || null
    if (!customer_id || !vistoria_type) throw new Error('customer_id e vistoria_type são obrigatórios. Chame listar_clientes(busca) para obter o ID do cliente.')
    const { data: cliente } = await supabaseAdmin.from('students').select('id').eq('id', customer_id).eq('studio_id', studioId).maybeSingle()
    if (!cliente) throw new Error(`Cliente com ID ${customer_id} não encontrado. Use listar_clientes para ver os clientes disponíveis.`)
    const { data: vistoria, error } = await supabaseAdmin
      .from('service_orders')
      .insert({
        studio_id: studioId,
        customer_id,
        professional_id,
        title: vistoria_type,
        vistoria_type,
        description,
        project_type: 'vistoria',
        scheduled_at,
        status: 'open',
        priority: 'normal',
      })
      .select('id, title, vistoria_type, scheduled_at, status')
      .single()
    if (error) throw error
    if (vistoria) {
      await supabaseAdmin.from('service_order_milestones').insert(
        CHECKLIST_PADRAO.map((item) => ({
          studio_id: studioId,
          service_order_id: vistoria.id,
          title: item.title,
          order_index: item.order_index,
          status: 'pending',
          category: 'vistoria',
        }))
      )
    }
    return { sucesso: true, vistoria }
  },
  criar_os: async (args, studioId) => {
    const customer_id = (args.customer_id as string)?.trim()
    const title = (args.title as string)?.trim()
    const professional_id = (args.professional_id as string) || null
    const scheduled_at = normalizeScheduledAt(args.scheduled_at as string)
    const description = (args.description as string) || null
    const project_type = (args.project_type as string) || 'common'
    if (!customer_id || !title) throw new Error('customer_id e title são obrigatórios. Chame listar_clientes(busca) para obter o ID do cliente.')
    const { data: cliente } = await supabaseAdmin.from('students').select('id').eq('id', customer_id).eq('studio_id', studioId).maybeSingle()
    if (!cliente) throw new Error(`Cliente com ID ${customer_id} não encontrado. Use listar_clientes para ver os clientes disponíveis.`)
    const { data: os, error } = await supabaseAdmin
      .from('service_orders')
      .insert({
        studio_id: studioId,
        customer_id,
        professional_id,
        title,
        description,
        project_type,
        scheduled_at,
        status: 'open',
      })
      .select('id, title, project_type, scheduled_at, status')
      .single()
    if (error) throw error
    return { sucesso: true, os }
  },
  atualizar_vistoria: async (args, studioId) => {
    const vistoria_id = args.vistoria_id as string
    if (!vistoria_id) throw new Error('vistoria_id é obrigatório')
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (args.status) updates.status = args.status
    const sa = normalizeScheduledAt(args.scheduled_at as string)
    if (sa) updates.scheduled_at = sa
    if (args.professional_id) updates.professional_id = args.professional_id
    if (args.observations) updates.observations = args.observations
    const { data, error } = await supabaseAdmin
      .from('service_orders')
      .update(updates)
      .eq('id', vistoria_id)
      .eq('studio_id', studioId)
      .eq('project_type', 'vistoria')
      .select()
      .single()
    if (error) throw error
    return { sucesso: true, vistoria: data }
  },
  atualizar_os: async (args, studioId) => {
    const os_id = args.os_id as string
    if (!os_id) throw new Error('os_id é obrigatório')
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (args.status) updates.status = args.status
    const sa = normalizeScheduledAt(args.scheduled_at as string)
    if (sa) updates.scheduled_at = sa
    if (args.professional_id) updates.professional_id = args.professional_id
    if (args.observations) updates.observations = args.observations
    const { data, error } = await supabaseAdmin
      .from('service_orders')
      .update(updates)
      .eq('id', os_id)
      .eq('studio_id', studioId)
      .neq('project_type', 'vistoria')
      .select()
      .single()
    if (error) throw error
    return { sucesso: true, os: data }
  },
  listar_vistorias: async (args, studioId) => {
    const status = args.status as string
    const customer_id = args.customer_id as string
    let q = supabaseAdmin
      .from('service_orders')
      .select('id, title, vistoria_type, status, scheduled_at, customer:students(name)')
      .eq('studio_id', studioId)
      .eq('project_type', 'vistoria')
      .order('scheduled_at', { ascending: true, nullsFirst: false })
    if (status && status !== 'todos') q = q.eq('status', status)
    if (customer_id) q = q.eq('customer_id', customer_id)
    const { data, error } = await q
    if (error) throw error
    return { vistorias: data || [] }
  },
  listar_os: async (args, studioId) => {
    const status = args.status as string
    const customer_id = args.customer_id as string
    let q = supabaseAdmin
      .from('service_orders')
      .select('id, title, project_type, status, scheduled_at, tracking_code, customer:students(name)')
      .eq('studio_id', studioId)
      .neq('project_type', 'vistoria')
      .order('created_at', { ascending: false })
    if (status && status !== 'todos') q = q.eq('status', status)
    if (customer_id) q = q.eq('customer_id', customer_id)
    const { data, error } = await q
    if (error) throw error
    return { ordens_servico: data || [] }
  },
  listar_extintores_vencendo: async (args, studioId) => {
    const dias = Number(args.dias) || 30
    const hoje = new Date()
    const limite = new Date()
    limite.setDate(limite.getDate() + dias)
    const hojeStr = hoje.toISOString().split('T')[0]
    const limiteStr = limite.toISOString().split('T')[0]
    const { data, error } = await supabaseAdmin
      .from('assets')
      .select('id, name, expiration_date, next_inspection_due, status, student:students(name)')
      .eq('studio_id', studioId)
      .not('expiration_date', 'is', null)
      .lte('expiration_date', limiteStr)
      .order('expiration_date')
    if (error) throw error
    const vencidos = (data || []).filter((a: any) => a.expiration_date <= hojeStr)
    const proximos = (data || []).filter((a: any) => a.expiration_date > hojeStr)
    return { vencidos, proximos, total: (data || []).length }
  },
}

/** Normaliza data para ISO: YYYY-MM-DD vira YYYY-MM-DDTHH:mm para armazenar com horário */
function normalizeScheduledAt(val: string | null | undefined): string | null {
  if (!val || typeof val !== 'string') return null
  const s = String(val).trim()
  if (!s) return null
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(s)) return s
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return `${s}T09:00:00`
  return s
}

/** Detecta intenções óbvias para chamar ferramentas diretamente (fallback quando o Gemini falha) */
function detectDirectIntent(msg: string): { name: string; args: Record<string, unknown> } | null {
  const m = msg.replace(/\s+/g, ' ').trim()
  if (!m || m.length < 3) return null

  if (/\b(extintores?\s+venc(endo|idos?)|venc(endo|idos?)\s+este\s+m[eê]s|venc(endo|idos?)\s+nos?\s+pr[oó]ximos?\s+\d+\s+dias?)\b/i.test(m)) {
    const diasMatch = m.match(/(\d+)\s*dias?/)
    return { name: 'listar_extintores_vencendo', args: { dias: diasMatch ? parseInt(diasMatch[1], 10) : 30 } }
  }
  if (/\b(lista\s+de\s+clientes?|clientes?|quem\s+s[aã]o\s+os?\s+clientes?|mostre\s+(os?\s+)?clientes?)\b/i.test(m)) {
    const busca = m.replace(/^(lista\s+de\s+clientes?|clientes?|quem\s+s[aã]o\s+os?\s+clientes?|mostre\s+(os?\s+)?clientes?)\s*/i, '').trim()
    return { name: 'listar_clientes', args: busca ? { busca } : {} }
  }
  if (/\b(lista\s+de\s+t[eé]cnicos?|t[eé]cnicos?|mostre\s+(os?\s+)?t[eé]cnicos?)\b/i.test(m)) {
    return { name: 'listar_tecnicos', args: {} }
  }
  if (/\b(vistorias?|lista\s+de\s+vistorias?|vistorias?\s+pendentes?|vistorias?\s+abertas?)\b/i.test(m)) {
    return { name: 'listar_vistorias', args: {} }
  }
  if (/\b(os|ordens?\s+de\s+servi[çc]o|lista\s+de\s+os|os\s+abertas?|quantas?\s+os)\b/i.test(m) && !/\b(extintor|vistoria)\b/i.test(m)) {
    return { name: 'listar_os', args: {} }
  }

  return null
}

/** Formata resultado de tool como texto amigável quando o modelo não retorna resposta */
function formatToolResultAsText(tr: { name: string; result: unknown }): string {
  const r = tr.result as Record<string, unknown>
  if (tr.name === 'listar_clientes') {
    const clientes = (r.clientes as any[]) || []
    if (clientes.length === 0) return 'Nenhum cliente encontrado. Cadastre clientes em Clientes / Edificações.'
    const lista = clientes.slice(0, 20).map((c: any) => `• ${c.name} (ID: ${c.id})`).join('\n')
    const extra = clientes.length > 20 ? `\n... e mais ${clientes.length - 20} cliente(s).` : ''
    return `**Clientes cadastrados:**\n${lista}${extra}\n\nPara qual cliente deseja agendar?`
  }
  if (tr.name === 'listar_tecnicos') {
    const tecnicos = (r.tecnicos as any[]) || []
    if (tecnicos.length === 0) return 'Nenhum técnico cadastrado. Cadastre em Técnicos.'
    const lista = tecnicos.map((t: any) => `• ${t.name} (${t.professional_type || 'técnico'})`).join('\n')
    return `**Técnicos disponíveis:**\n${lista}`
  }
  if (tr.name === 'listar_vistorias') {
    const vistorias = (r.vistorias as any[]) || []
    if (vistorias.length === 0) return 'Nenhuma vistoria encontrada.'
    const lista = vistorias.slice(0, 15).map((v: any) => {
      const cliente = v.customer?.name || '—'
      const data = v.scheduled_at ? new Date(v.scheduled_at).toLocaleDateString('pt-BR') : '—'
      return `• ${v.vistoria_type || v.title} - ${cliente} - ${data} (${v.status})`
    }).join('\n')
    return `**Vistorias:**\n${lista}`
  }
  if (tr.name === 'listar_os') {
    const os = (r.ordens_servico as any[]) || []
    if (os.length === 0) return 'Nenhuma OS encontrada.'
    const lista = os.slice(0, 15).map((o: any) => {
      const cliente = o.customer?.name || '—'
      return `• ${o.title} - ${cliente} (${o.status})`
    }).join('\n')
    return `**Ordens de Serviço:**\n${lista}`
  }
  if (tr.name === 'listar_extintores_vencendo') {
    const vencidos = (r.vencidos as any[]) || []
    const proximos = (r.proximos as any[]) || []
    if (vencidos.length === 0 && proximos.length === 0) return 'Nenhum extintor vencendo no período.'
    const fmt = (arr: any[]) => arr.slice(0, 15).map((a: any) => {
      const cliente = a.student?.name || '—'
      const venc = a.expiration_date ? new Date(a.expiration_date).toLocaleDateString('pt-BR') : '—'
      return `• ${a.name || 'Extintor'} - ${cliente} - venc: ${venc}`
    }).join('\n')
    let txt = ''
    if (vencidos.length) txt += `**Vencidos (${vencidos.length}):**\n${fmt(vencidos)}${vencidos.length > 15 ? `\n... e mais ${vencidos.length - 15}` : ''}\n\n`
    if (proximos.length) txt += `**Próximos de vencer (${proximos.length}):**\n${fmt(proximos)}${proximos.length > 15 ? `\n... e mais ${proximos.length - 15}` : ''}`
    return txt.trim() || 'Nenhum extintor no período.'
  }
  if (tr.name === 'agendar_vistoria' && r.vistoria) {
    const v = r.vistoria as any
    const data = v.scheduled_at ? new Date(v.scheduled_at).toLocaleString('pt-BR') : 'agendada'
    return `✅ **Vistoria ${v.vistoria_type || v.title} agendada com sucesso** para ${data}.`
  }
  if (tr.name === 'criar_os' && r.os) {
    const o = r.os as any
    return `✅ **OS "${o.title}" criada com sucesso.**`
  }
  if (tr.name === 'atualizar_vistoria' || tr.name === 'atualizar_os') {
    return '✅ **Atualização realizada com sucesso.**'
  }
  return 'Ação executada. Como posso ajudar mais?'
}

async function executeTool(name: string, args: Record<string, unknown>, studioId: string): Promise<unknown> {
  const handler = toolHandlers[name]
  if (!handler) throw new Error(`Função desconhecida: ${name}`)
  return handler(args, studioId)
}

async function buildFireProtectionContext(studioId: string): Promise<string> {
  const [
    { data: clients },
    { data: assets },
    { data: osList },
    { data: vistorias },
    { data: techs },
  ] = await Promise.all([
    supabaseAdmin.from('students').select('id, name, phone').eq('studio_id', studioId).eq('status', 'active').limit(50),
    supabaseAdmin.from('assets').select('id, name, expiration_date, student:students(name)').eq('studio_id', studioId).limit(50),
    supabaseAdmin
      .from('service_orders')
      .select('id, title, status, scheduled_at')
      .eq('studio_id', studioId)
      .neq('project_type', 'vistoria')
      .order('created_at', { ascending: false })
      .limit(30),
    supabaseAdmin
      .from('service_orders')
      .select('id, title, vistoria_type, status, scheduled_at')
      .eq('studio_id', studioId)
      .eq('project_type', 'vistoria')
      .order('scheduled_at', { ascending: true, nullsFirst: false })
      .limit(30),
    supabaseAdmin
      .from('professionals')
      .select('id, name, professional_type')
      .eq('studio_id', studioId)
      .in('professional_type', ['technician', 'engineer'])
      .eq('status', 'active'),
  ])

  const clientNames = (clients || []).slice(0, 5).map((c: any) => c?.name).filter(Boolean).join(', ') || 'nenhum'
  const techNames = (techs || []).slice(0, 3).map((t: any) => t?.name).filter(Boolean).join(', ') || 'nenhum'

  return `
RESUMO: Clientes ${(clients || []).length} | Extintores ${(assets || []).length} | OS ${(osList || []).length} | Vistorias ${(vistorias || []).length} | Técnicos ${(techs || []).length}
Exemplos de nomes: clientes (${clientNames}), técnicos (${techNames}). Use listar_clientes(busca) e listar_tecnicos() para obter IDs antes de agendar.
`.trim()
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

    // Fire Protection: contexto + treinamento + learned knowledge
    let contextContent: string
    try {
      contextContent = await buildFireProtectionContext(contextStudioId)
    } catch (ctxErr: any) {
      logger.error('Erro ao montar contexto FireProtection:', ctxErr)
      contextContent = 'Contexto indisponível.'
    }

    const [cached, learnedRes] = await Promise.all([
      getCachedStudioContextFireProtection(contextStudioId),
      aiLearning.getLearnedKnowledge(contextStudioId, typeof message === 'string' ? message : (message?.content || '')).catch(() => []),
    ])
    const { trainingRes, rulesRes, modelSettingRes } = cached
    const trainingRows = trainingRes.data || []
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

    const { data: studioRow } = await supabaseAdmin
      .from('studios')
      .select('name')
      .eq('id', contextStudioId)
      .maybeSingle()
    const studioName = studioRow?.name || 'FireControl'
    const nicheConfig = getNichePrompt('fire_protection', studioName)

    let apiKey = process.env.GOOGLE_AI_API_KEY
    const { data: geminiKeys } = await supabaseAdmin
      .from('studio_api_keys')
      .select('api_key')
      .eq('studio_id', contextStudioId)
      .eq('service_name', 'gemini')
      .maybeSingle()
    if (geminiKeys?.api_key) {
      const key = String(geminiKeys.api_key).trim()
      if (key) apiKey = key
    }
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Chave de API não configurada. Configure Gemini em Configurações > Integrações.' },
        { status: 500 }
      )
    }

    const contactName = context?.contact_name || 'Não informado'
    const contactTypeLabel = context?.contact_type_label || 'Admin'
    const contactSection = `\nCONTATO ATUAL: ${contactName} (${contactTypeLabel})\n`

    const systemPrompt = `Você é a Catarina, ${nicheConfig.identity} da "${studioName}".
Sua função é EXECUTAR AÇÕES no sistema (listar, agendar, criar), não dar instruções ao usuário.
${contactSection}
CONTEXTO TEMPORAL (use para "hoje", "próxima segunda", datas): ${getContextTimestamp()}

${contextContent}

VOCÊ DEVE AGIR COMO SECRETARIA:
- Quando o usuário pedir para agendar, marcar, criar vistoria ou OS → Chame as funções e EXECUTE.
- NUNCA diga "para agendar você precisa..." ou "entre em contato com...". SEMPRE chame a função.

QUANDO O USUÁRIO PEDIR "lista de clientes", "lista de técnicos", "quem são os clientes", "mostre os clientes" → Chame IMEDIATAMENTE listar_clientes() ou listar_tecnicos(). Não peça mais informações.

FLUXO OBRIGATÓRIO PARA AGENDAR:
1. Usuário: "Agende vistoria AVCB para o Condomínio XYZ na próxima segunda às 9h"
2. VOCÊ DEVE: listar_clientes(busca:"Condomínio XYZ") → pegar customer_id do resultado
3. VOCÊ DEVE: agendar_vistoria(customer_id, vistoria_type:"AVCB", scheduled_at:"2026-03-03T09:00:00")
4. Depois confirme: "Vistoria AVCB agendada para [data] no [cliente]."

FLUXO PARA CRIAR OS:
1. listar_clientes(busca) se não souber o ID
2. criar_os(customer_id, title:"Recarga extintores", scheduled_at)

Datas: use YYYY-MM-DD ou YYYY-MM-DDTHH:mm. "Próxima segunda" = calcule a data real.
Responda em português. Seja objetivo e CONFIRME o que foi feito.`

    const validHistory = (history || []).filter((m: any) => m?.content?.trim())
    const lastMsg =
      typeof message === 'string'
        ? message.trim()
        : (message?.content || message?.message || String(message || '')).trim()

    // Resposta rápida para mensagens genéricas (evita chamar Gemini à toa)
    const msgLower = lastMsg.toLowerCase().trim()
    if (/^(teste|oi|olá|ola|ola!|hey|oi!)$/i.test(msgLower)) {
      return NextResponse.json({
        response: `${nicheConfig.greeting}\n\nPosso listar **extintores vencendo**, **clientes**, **técnicos**, **vistorias** e **OS**. Também consigo **agendar vistorias** e **criar ordens de serviço**.\n\nO que precisa? 🔥`,
      })
    }

    // Atalho: detecta intenções óbvias e chama a ferramenta diretamente (não depende do Gemini)
    const directTool = detectDirectIntent(msgLower)
    if (directTool) {
      try {
        const result = await executeTool(directTool.name, directTool.args, contextStudioId)
        const text = formatToolResultAsText({ name: directTool.name, result })
        return NextResponse.json({ response: text })
      } catch (e: any) {
        logger.warn('FireProtection atalho falhou:', e?.message)
      }
    }

    const contents: Array<{ role: string; parts: Array<Record<string, unknown>> }> = []
    for (const msg of validHistory) {
      const role = msg.role === 'user' ? 'user' : 'model'
      contents.push({ role, parts: [{ text: msg.content }] })
    }
    contents.push({ role: 'user', parts: [{ text: lastMsg }] })

    const validModels = ['gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.0-flash']
    const configuredModel = (modelSettingRes as any)?.data?.setting_value?.trim()
    const preferredModel = configuredModel && validModels.includes(configuredModel) ? configuredModel : (model || 'gemini-2.5-pro')
    const modelFallbacks = [preferredModel, ...validModels.filter((m) => m !== preferredModel)]
    const maxTurns = 6
    let turn = 0
    let finalText = ''
    let usedModel = modelFallbacks[0]
    let lastToolResult: { name: string; result: unknown } | null = null

    const doRequest = (parts: typeof contents, m: string) =>
      fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents: parts,
            tools: [{ functionDeclarations: FIRE_TOOLS.functionDeclarations }],
            toolConfig: { functionCallingConfig: { mode: 'AUTO' } },
            generationConfig: { temperature: 0.2, maxOutputTokens: 2000 },
          }),
        }
      )

    while (turn < maxTurns) {
      turn++
      const res = await doRequest(contents, usedModel)
      if (!res.ok) {
        const errBody = (await res.json().catch(() => ({}))) as { error?: { message?: string; status?: string } }
        if (errBody?.error?.status === 'NOT_FOUND' && errBody?.error?.message?.includes('no longer available')) {
          const nextIdx = modelFallbacks.indexOf(usedModel) + 1
          if (nextIdx < modelFallbacks.length) {
            usedModel = modelFallbacks[nextIdx]
            logger.warn(`Modelo ${modelFallbacks[nextIdx - 1]} indisponível, tentando ${usedModel}`)
            turn--
            continue
          }
        }
        logger.error('Erro Gemini FireProtection:', errBody)
        return NextResponse.json({
          error: errBody?.error?.message || `Erro ${res.status}. Verifique a API Key.`,
        }, { status: 500 })
      }

      const result = await res.json()
      const candidate = result.candidates?.[0]
      const finishReason = candidate?.finishReason || result?.candidates?.[0]?.finishReason

      if (!candidate && !result.error) {
        logger.warn('Gemini retornou sem candidate:', JSON.stringify(result).slice(0, 300))
      }
      if (finishReason && finishReason !== 'STOP' && finishReason !== 'END_TURN') {
        logger.warn('Gemini finishReason inesperado:', finishReason, candidate?.safetyRatings)
      }

      const partsRes = candidate?.content?.parts || []
      const textPart = partsRes.find((p: any) => p.text)
      const funcPart = partsRes.find((p: any) => p.functionCall)

      if (textPart?.text) {
        finalText = textPart.text
        break
      }

      if (funcPart?.functionCall) {
        const { name, args } = funcPart.functionCall
        logger.info(`FireProtection tool call: ${name}`, args)
        let toolResult: unknown
        try {
          toolResult = await executeTool(name, args || {}, contextStudioId)
          lastToolResult = { name, result: toolResult }
        } catch (e: any) {
          const msg = e?.message || 'Erro ao executar'
          logger.warn(`FireProtection tool ${name} falhou:`, msg)
          toolResult = {
            erro: msg,
            sugestao:
              name === 'agendar_vistoria' || name === 'criar_os'
                ? 'Chame listar_clientes(busca) primeiro para obter o customer_id válido.'
                : undefined,
          }
          lastToolResult = { name, result: toolResult }
        }
        contents.push({
          role: 'model',
          parts: [{ functionCall: { name, args: args || {} } }],
        })
        contents.push({
          role: 'user',
          parts: [{ functionResponse: { name, response: toolResult } }],
        })
        continue
      }

      if (lastToolResult) {
        const r = lastToolResult.result as Record<string, unknown>
        if (r?.erro) {
          finalText = `Não foi possível concluir: ${r.erro}${r.sugestao ? `\n\n${r.sugestao}` : ''}`
        } else {
          finalText = formatToolResultAsText(lastToolResult)
        }
      } else {
        finalText = 'Não foi possível gerar uma resposta. Tente reformular a pergunta ou verifique a conexão.'
      }
      break
    }

    // Pós-processamento: salvar interação e aprender
    if (finalText) {
      Promise.all([
        supabaseAdmin.from('ai_interactions').insert({
          studio_id: contextStudioId,
          customer_contact: context?.contact_name || 'chat_user',
          message: lastMsg,
          ai_response: finalText,
          intent_type: 'chat',
          channel: 'chat',
        }).then(() => {}, (e) => logger.warn('Erro ao salvar ai_interactions:', e)),
        aiLearning.learnFromInteraction({ studioId: contextStudioId, question: lastMsg, answer: finalText, confidence: 0.8 }).catch((e) => logger.warn('Erro learnFromInteraction:', e))
      ]).catch(() => {})
    }

    return NextResponse.json({ response: finalText })
  } catch (error: any) {
    logger.error('Erro fire-protection ai/chat:', error)
    return NextResponse.json({ error: error?.message || 'Erro interno' }, { status: 500 })
  }
}
