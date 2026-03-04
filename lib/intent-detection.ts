import { supabase } from './supabase'
import logger from './logger'

// Tipos de intenção detectadas
export interface DetectedIntent {
  type: 'attendance_cancel' | 'attendance_confirm' | 'info_request' | 'general' | 'action_cancelled' | 'report_request' | 'analysis_request' | 'enrollment_request' | 'schedule_request' | 'price_inquiry' | 'service_info' | 'contact_request' | 'availability_check' | 'booking_confirmation'
  confidence: number
  data?: {
    studentId?: string
    classId?: string
    date?: string
    reason?: string
    entity?: 'student' | 'teacher' | 'class' | 'financial' | 'gamification' | 'lead'
    detail_level?: 'summary' | 'full'
    student_name?: string
    student_phone?: string
    dance_style?: string
    service_type?: string
    preferred_date?: string
    preferred_time?: string
    professional_id?: string
    duration?: number
  }
}

// Palavras-chave expandidas para detecção robusta
const KEYWORDS = {
  CANCEL: ['nao vou', 'nao irei', 'nao posso', 'cancelar', 'faltar', 'ausente', 'ausencia', 'desmarcar', 'remarcar', 'doente'],
  CONFIRM: ['irei', 'vou', 'comparecerei', 'estarei', 'presente', 'confirmar', 'sim', 'claro', 'pode', 'ok'],
  REPORT: ['relatorio', 'lista', 'quais sao', 'quem sao', 'todos', 'tabelas', 'extrato', 'resumo', 'quem esta', 'mostre'],
  ANALYSIS: ['analise', 'como esta', 'por que', 'melhorar', 'aumentar', 'tendencia', 'performa', 'saude', 'evasao', 'retencao'],
  STUDENT: ['aluno', 'estudante', 'matricula', 'frequencia', 'faltas'],
  TEACHER: ['professor', 'docente', 'titular', 'especialidade', 'salario'],
  FINANCIAL: ['financeiro', 'dinheiro', 'receita', 'faturamento', 'caixa', 'pagamento', 'devedor', 'atraso', 'vencido'],
  CLASS: ['turma', 'aula', 'grade', 'horario', 'sala', 'lotacao', 'vagas'],
  GAMIFICATION: ['badge', 'conquista', 'premio', 'medalha', 'pontos', 'gamificacao'],
  LEAD: ['lead', 'interessado', 'prospect', 'experimental', 'venda', 'pipeline'],
  ENROLLMENT: ['quero me matricular', 'fazer matricula', 'quero entrar', 'como faco para participar', 'quero ser aluno', 'fazer aula'],
  // Novos keywords para secretaria inteligente
  SCHEDULE: ['agendar', 'marcar', 'horario', 'consulta', 'agora', 'hoje', 'amanha', 'semana', 'agenda', 'disponivel', 'vagas'],
  PRICE: ['quanto custa', 'preco', 'valor', 'mensalidade', 'pacote', 'plano', 'cobrar', 'pagar'],
  SERVICE: ['o que e', 'como funciona', 'servico', 'aula', 'atividade', 'modalidade', 'tipo'],
  CONTACT: ['contato', 'telefone', 'endereco', 'local', 'onde fica', 'como chegar', 'whatsapp'],
  AVAILABILITY: ['tem horario', 'disponibilidade', 'livre', 'vaga', 'tem espaco', 'aceita'],
  BOOKING: ['confirmar agendamento', 'marcar horario', 'reservar', 'agendado', 'confirmado']
}

// Função para normalizar texto
const normalizeText = (text: string) => text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

export async function detectIntent(message: string, context?: any): Promise<DetectedIntent> {
  const text = normalizeText(message)

  // 1. Verificar resposta a ação pendente
  if (context?.pendingAction) {
    if (KEYWORDS.CONFIRM.some(k => text.includes(k)) && !text.includes('nao')) {
      return { type: context.pendingAction.type, confidence: 0.95, data: context.pendingAction.data }
    }
    if (text.includes('nao') || text.includes('cancelar')) {
      return { type: 'action_cancelled', confidence: 0.9 }
    }
  }

  // 2. Detecção de Relatórios e Listas
  if (KEYWORDS.REPORT.some(k => text.includes(k))) {
    let entity: any = 'general'
    if (KEYWORDS.STUDENT.some(k => text.includes(k))) entity = 'student'
    else if (KEYWORDS.TEACHER.some(k => text.includes(k))) entity = 'teacher'
    else if (KEYWORDS.FINANCIAL.some(k => text.includes(k))) entity = 'financial'
    else if (KEYWORDS.CLASS.some(k => text.includes(k))) entity = 'class'
    else if (KEYWORDS.GAMIFICATION.some(k => text.includes(k))) entity = 'gamification'
    else if (KEYWORDS.LEAD.some(k => text.includes(k))) entity = 'lead'

    return { type: 'report_request', confidence: 0.85, data: { entity } }
  }

  // 3. Detecção de Análise e Insights
  if (KEYWORDS.ANALYSIS.some(k => text.includes(k))) {
    return { type: 'analysis_request', confidence: 0.8 }
  }

  // 4. Detecção de Cancelamento de Aula (Workflow específico)
  if (KEYWORDS.CANCEL.some(k => text.includes(k))) {
    const attendanceData = await extractAttendanceData(text, context)
    return { type: 'attendance_cancel', confidence: 0.8, data: attendanceData }
  }

  // 5. Pedido de Informação Geral
  if (text.includes('onde') || text.includes('como') || text.includes('qual')) {
    return { type: 'info_request', confidence: 0.7 }
  }

  // 6. Detecção de Matrícula (Workflow Estudante)
  if (KEYWORDS.ENROLLMENT.some(k => text.includes(k))) {
    const enrollmentData = await extractEnrollmentData(text, context)
    return { type: 'enrollment_request', confidence: 0.9, data: enrollmentData }
  }

  // 7. Novas detecções para secretária inteligente
  if (KEYWORDS.SCHEDULE.some(k => text.includes(k))) {
    const scheduleData = await extractScheduleData(text, context)
    return { type: 'schedule_request', confidence: 0.85, data: scheduleData }
  }

  if (KEYWORDS.PRICE.some(k => text.includes(k))) {
    return { type: 'price_inquiry', confidence: 0.8 }
  }

  if (KEYWORDS.SERVICE.some(k => text.includes(k))) {
    return { type: 'service_info', confidence: 0.75 }
  }

  if (KEYWORDS.CONTACT.some(k => text.includes(k))) {
    return { type: 'contact_request', confidence: 0.8 }
  }

  if (KEYWORDS.AVAILABILITY.some(k => text.includes(k))) {
    const availabilityData = await extractAvailabilityData(text, context)
    return { type: 'availability_check', confidence: 0.85, data: availabilityData }
  }

  if (KEYWORDS.BOOKING.some(k => text.includes(k))) {
    return { type: 'booking_confirmation', confidence: 0.9 }
  }

  return { type: 'general', confidence: 0.5 }
}

// Extração Inteligente de Dados de Matrícula
async function extractEnrollmentData(text: string, context?: any) {
  const data: any = {}
  
  // Tentar extrair nome
  const nameMatch = text.match(/(?:meu nome e|sou o|sou a|me chamo)\s+([a-zA-ZÀ-ÿ\s]+)/i)
  if (nameMatch) data.student_name = nameMatch[1].trim()

  // Tentar extrair estilo de dança
  const styles = ['ballet', 'jazz', 'hip hop', 'contemporaneo', 'salsa', 'zumba', 'tango']
  for (const style of styles) {
    if (text.includes(style)) {
      data.dance_style = style
      break
    }
  }

  return data
}

// Novas funções de extração para secretária inteligente
async function extractScheduleData(text: string, context?: any) {
  const data: any = {}
  const studioId = context?.studio_id || context?.studioId
  
  // Extrair data
  const today = new Date().toISOString().split('T')[0]
  if (text.includes('hoje')) data.preferred_date = today
  else if (text.includes('amanha')) {
    const d = new Date(); d.setDate(d.getDate() + 1)
    data.preferred_date = d.toISOString().split('T')[0]
  }
  
  // Extrair hora
  const timeMatch = text.match(/(\d{1,2}):(\d{2})/)
  if (timeMatch) data.preferred_time = timeMatch[0]
  
  // Extrair tipo de serviço
  if (text.includes('aula')) data.service_type = 'class'
  else if (text.includes('consulta')) data.service_type = 'consultation'
  else if (text.includes('avaliacao')) data.service_type = 'assessment'
  
  return data
}

async function extractAvailabilityData(text: string, context?: any) {
  const data: any = {}
  
  // Extrair data
  const today = new Date().toISOString().split('T')[0]
  if (text.includes('hoje')) data.preferred_date = today
  else if (text.includes('amanha')) {
    const d = new Date(); d.setDate(d.getDate() + 1)
    data.preferred_date = d.toISOString().split('T')[0]
  }
  
  // Extrair tipo de serviço
  if (text.includes('aula')) data.service_type = 'class'
  else if (text.includes('consulta')) data.service_type = 'consultation'
  
  return data
}

// Extração Inteligente de Dados de Presença
async function extractAttendanceData(text: string, context?: any) {
  const data: any = {}
  const studioId = context?.studio_id || context?.studioId
  
  if (!studioId) {
    logger.error('❌ Studio ID não encontrado no contexto para extração de presença')
  }

  // Identificar data
  const today = new Date().toISOString().split('T')[0]
  if (text.includes('amanha')) {
    const d = new Date(); d.setDate(d.getDate() + 1)
    data.date = d.toISOString().split('T')[0]
  } else {
    data.date = today
  }

  // Identificar Aluno (Usa o do contexto ou busca padrão para o estúdio)
  if (context?.studentId) {
    data.studentId = context.studentId
  } else if (studioId) {
    const { data: s } = await supabase.from('students')
      .select('id')
      .eq('studio_id', studioId)
      .eq('status', 'active')
      .limit(1)
      .single()
    if (s) data.studentId = s.id
  }

  // Identificar Turma do Aluno
  if (data.studentId && studioId) {
    const { data: enroll } = await supabase.from('enrollments')
      .select('class_id')
      .eq('studio_id', studioId)
      .eq('student_id', data.studentId)
      .limit(1)
      .single()
    if (enroll) data.classId = enroll.class_id
  }

  // Extrair motivo
  const match = text.match(/(?:porque|motivo|pois)\s+(.+)/i)
  if (match) data.reason = match[1].trim()

  return data
}

export function generateConfirmationMessage(intent: DetectedIntent): string {
  if (intent.type === 'attendance_cancel' && intent.data) {
    const dateStr = intent.data.date === new Date().toISOString().split('T')[0] ? 'hoje' : 'amanhã'
    return `Entendi que você deseja registrar uma ausência para ${dateStr}. Está correto? Responda **Sim** para confirmar no banco de dados.`
  }
  return ''
}

export async function executeIntent(intent: DetectedIntent, context?: any) {
  const studioId = context?.studio_id || context?.studioId
  
  if (!studioId) {
    return { success: false, message: 'ID do estúdio não identificado.' }
  }

  // Execução side-effect no banco
  if (intent.type === 'attendance_cancel' && intent.data?.studentId) {
    const { error } = await supabase.from('attendance').upsert({
      studio_id: studioId,
      student_id: intent.data.studentId,
      class_id: intent.data.classId,
      date: intent.data.date,
      status: 'absent',
      notes: `Registrado via Chat IA: ${intent.data.reason || 'Sem motivo informado'}`
    }, { onConflict: 'studio_id, student_id, class_id, date' })
    
    if (error) return { success: false, message: `Erro ao salvar: ${error.message}` }
    return { success: true, message: '✅ Ausência registrada com sucesso no banco de dados!' }
  }
  
  if (intent.type === 'action_cancelled') return { success: true, message: '✅ Ação cancelada. Nenhuma alteração foi feita.' }
  
  if (intent.type === 'enrollment_request') {
    // Criar um novo lead no pipeline
    const { error } = await supabase.from('lead_pipelines').insert({
      studio_id: studioId,
      source: 'WhatsApp',
      interest_level: 3,
      notes: `Interesse em ${intent.data?.dance_style || 'Dança'}. Nome: ${intent.data?.student_name || 'Prospect'}`
    })

    if (error) return { success: false, message: `Erro ao criar lead: ${error.message}` }
    return { 
      success: true, 
      message: `✅ Perfeito! Já registrei seu interesse em ${intent.data?.dance_style || 'nossas aulas'}. Um consultor entrará em contato em breve para finalizar sua matrícula!` 
    }
  }

  return { success: true, message: 'Entendido.' }
}
