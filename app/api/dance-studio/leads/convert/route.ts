import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import logger from '@/lib/logger'
import { checkStudioAccess } from '@/lib/auth'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

function getAdmin() {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

// POST /api/dance-studio/leads/convert — converte cliente (lead) em aluno
export async function POST(request: NextRequest) {
  const body = await request.json()
  const { leadId, studioId } = body

  if (!leadId || !studioId) {
    return NextResponse.json({ error: 'leadId e studioId são obrigatórios' }, { status: 400 })
  }

  const access = await checkStudioAccess(request, studioId)
  if (!access.authorized) return access.response

  const supabase = getAdmin()

  try {
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .eq('studio_id', studioId)
      .single()

    if (leadError || !lead) {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })
    }

    if (lead.converted_to_student_id) {
      return NextResponse.json({
        error: 'Este cliente já foi convertido em aluno',
        studentId: lead.converted_to_student_id,
      }, { status: 400 })
    }

    const email = lead.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email)
      ? lead.email.toLowerCase()
      : `convertido-${leadId.slice(0, 8)}@importado.local`

    const { data: existing } = await supabase
      .from('students')
      .select('id')
      .eq('studio_id', studioId)
      .eq('email', email)
      .maybeSingle()

    let finalEmail = email
    if (existing) {
      finalEmail = `convertido-${leadId.slice(0, 8)}-${Date.now()}@importado.local`
    }

    const name = lead.name && String(lead.name).trim() ? lead.name : 'Sem nome'
    const phone = lead.phone_1 || lead.phone || null

    const studentData: Record<string, any> = {
      studio_id: studioId,
      name,
      email: finalEmail,
      phone: phone && String(phone).trim() ? phone : null,
      first_name: lead.first_name || null,
      last_name: lead.last_name || null,
      email_2: lead.email_2 || null,
      phone_1: lead.phone_1 || null,
      phone_2: lead.phone_2 || null,
      phone_3: lead.phone_3 || null,
      address: lead.address || null,
      company: lead.company || null,
      tags: lead.tags || null,
      source: lead.source || null,
      language: lead.language || null,
      category: lead.category || 'geral',
      document: lead.document || null,
      email_subscriber_status: lead.email_subscriber_status || null,
      sms_subscriber_status: lead.sms_subscriber_status || null,
      last_activity_description: lead.last_activity_description || null,
      last_activity_at: lead.last_activity_at || null,
      status: 'active',
      metadata: lead.metadata && typeof lead.metadata === 'object' ? { ...lead.metadata, converted_from_lead_id: leadId } : { converted_from_lead_id: leadId },
    }

    const { data: student, error: insertError } = await supabase
      .from('students')
      .insert(studentData)
      .select('id, name, email')
      .single()

    if (insertError) {
      logger.error('❌ [LEADS CONVERT] Erro ao criar aluno:', insertError)
      return NextResponse.json({ error: `Falha ao criar aluno: ${insertError.message}` }, { status: 500 })
    }

    await supabase
      .from('leads')
      .update({
        stage: 'won',
        converted_to_student_id: student.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', leadId)
      .eq('studio_id', studioId)

    return NextResponse.json({
      success: true,
      student: { id: student.id, name: student.name, email: student.email },
      message: `${lead.name} foi convertido em aluno com sucesso.`,
    })
  } catch (error: any) {
    logger.error('❌ [LEADS CONVERT] Erro:', error)
    return NextResponse.json({ error: 'Erro ao converter cliente em aluno' }, { status: 500 })
  }
}
