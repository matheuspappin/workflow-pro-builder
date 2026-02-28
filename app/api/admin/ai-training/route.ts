import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const VALID_SCENARIOS = ['enrollment', 'agendamento'] as const

async function requireSuperAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { ok: false as const, res: NextResponse.json({ error: 'Não autenticado' }, { status: 401 }) }
  }
  const { data: internalUser } = await supabaseAdmin
    .from('users_internal')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()
  const role = internalUser?.role ?? user.user_metadata?.role
  if (role !== 'super_admin' && role !== 'superadmin') {
    return { ok: false as const, res: NextResponse.json({ error: 'Acesso restrito a super administradores' }, { status: 403 }) }
  }
  return { ok: true as const }
}

/**
 * Parseia conteúdo .txt no formato:
 *
 * ---
 * MATRÍCULA (ou AGENDAMENTO)
 * Usuário: mensagem do aluno
 * IA: resposta da IA
 *
 * ---
 * AGENDAMENTO
 * U: outra mensagem
 * A: outra resposta
 *
 * Separação por --- ou ===
 * Cenário: MATRÍCULA -> enrollment, AGENDAMENTO -> agendamento (default: enrollment)
 * Marcadores: Usuário/U/USER/aluno: ou IA/A/AI/ia: (case insensitive)
 */
function parseConversations(content: string): { scenario_type: string; student_message: string; ai_response: string }[] {
  const results: { scenario_type: string; student_message: string; ai_response: string }[] = []
  const blocks = content.split(/(?:^|\n)\s*[-=]{3,}\s*(?:\n|$)/).map(b => b.trim()).filter(Boolean)

  for (const block of blocks) {
    let scenario_type = 'enrollment'
    let student_message = ''
    let ai_response = ''

    const lines = block.split('\n').map(l => l.trim()).filter(Boolean)

    for (const line of lines) {
      const upper = line.toUpperCase()
      if (upper.startsWith('MATRÍCULA') || upper.startsWith('MATRICULA') || upper === '[MATRÍCULA]' || upper === '[MATRICULA]') {
        scenario_type = 'enrollment'
        continue
      }
      if (upper.startsWith('AGENDAMENTO') || upper === '[AGENDAMENTO]') {
        scenario_type = 'agendamento'
        continue
      }

      const userMatch = line.match(/^(?:usu[aá]rio|u|user|aluno)\s*:\s*(.+)$/i)
      if (userMatch) {
        if (student_message && ai_response) {
          results.push({ scenario_type, student_message, ai_response })
          student_message = ''
          ai_response = ''
        }
        student_message = userMatch[1].trim()
        continue
      }

      const aiMatch = line.match(/^(?:ia|a|ai)\s*:\s*(.+)$/i)
      if (aiMatch) {
        ai_response = aiMatch[1].trim()
        continue
      }
    }

    if (student_message && ai_response) {
      results.push({ scenario_type, student_message, ai_response })
    }
  }

  return results
}

export async function POST(request: NextRequest) {
  const auth = await requireSuperAdmin()
  if (!auth.ok) return auth.res

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const customKnowledge = (formData.get('customKnowledge') as string) || ''

    if (!file) {
      return NextResponse.json(
        {
          error: 'Envie um arquivo .txt com conversas no formato correto.',
          hint: 'Exemplo: --- | MATRÍCULA | Usuário: oi | IA: olá! Como posso ajudar?',
        },
        { status: 400 }
      )
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Arquivo excede o limite de 5MB' },
        { status: 400 }
      )
    }

    if (file.type !== 'text/plain' && !file.name.toLowerCase().endsWith('.txt')) {
      return NextResponse.json(
        { error: 'Apenas arquivos .txt são aceitos' },
        { status: 400 }
      )
    }

    const content = await file.text()
    const conversations = parseConversations(content)

    if (conversations.length === 0) {
      return NextResponse.json(
        {
          error: 'Nenhuma conversa válida encontrada no arquivo',
          hint: 'Use o formato: --- | MATRÍCULA ou AGENDAMENTO | Usuário: mensagem | IA: resposta',
        },
        { status: 400 }
      )
    }

    const rows = conversations.map(c => ({
      scenario_type: c.scenario_type,
      student_message: c.student_message,
      ai_response: c.ai_response,
    }))

    const { data, error } = await supabaseAdmin
      .from('ai_training_conversations')
      .insert(rows)
      .select('id')

    if (error) {
      console.error('Erro ao inserir conversas:', error)
      return NextResponse.json(
        { error: error.message, hint: 'Verifique se a migration 83 (ai_training_conversations) foi aplicada no Supabase.' },
        { status: 500 }
      )
    }

    const inserted = data?.length ?? 0

    return NextResponse.json({
      success: true,
      inserted,
      total: conversations.length,
      message: `${inserted} conversa(s) adicionada(s) à base de treinamento.`,
      customKnowledgeReceived: !!customKnowledge,
    })
  } catch (error) {
    console.error('Erro no upload de treinamento:', error)
    return NextResponse.json({ error: 'Erro interno ao processar o arquivo' }, { status: 500 })
  }
}
