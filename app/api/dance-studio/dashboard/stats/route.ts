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

const DAY_NAMES = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

/**
 * GET /api/dance-studio/dashboard/stats?studioId=xxx
 * Retorna stats consolidados para o dashboard: alunos, professores, turmas,
 * faturamento do mês, crescimento vs mês anterior, turmas de hoje.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const studioId = searchParams.get('studioId')

  if (!studioId) {
    return NextResponse.json({ error: 'studioId obrigatório' }, { status: 400 })
  }

  const access = await checkStudioAccess(request, studioId)
  if (!access.authorized) return access.response

  const supabase = getAdmin()

  try {
    const now = new Date()
    const todayDow = now.getDay() // 0=Dom, 1=Seg, ..., 6=Sab
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const prevMonth = now.getMonth() === 0
      ? `${now.getFullYear() - 1}-12`
      : `${now.getFullYear()}-${String(now.getMonth()).padStart(2, '0')}`

    const [
      studentsRes,
      teachersRes,
      classesRes,
      paymentsRes,
    ] = await Promise.all([
      supabase
        .from('students')
        .select('id', { count: 'exact', head: true })
        .eq('studio_id', studioId)
        .eq('status', 'active'),

      supabase
        .from('professionals')
        .select('id', { count: 'exact', head: true })
        .eq('studio_id', studioId)
        .eq('professional_type', 'teacher')
        .eq('status', 'active'),

      supabase
        .from('classes')
        .select(`
          id, name, dance_style, schedule, status,
          professional:professionals(id, name)
        `)
        .eq('studio_id', studioId)
        .eq('status', 'active'),

      supabase
        .from('payments')
        .select('amount, status, payment_date, due_date')
        .eq('studio_id', studioId),
    ])

    const studentsCount = studentsRes.count ?? 0
    const teachersCount = teachersRes.count ?? 0
    const classes = classesRes.data ?? []

    // Faturamento: pagamentos paid do mês atual
    const payments = paymentsRes.data ?? []
    const monthPaid = payments.filter(
      (p: any) =>
        p.status === 'paid' &&
        ((p.payment_date && p.payment_date.startsWith(currentMonth)) ||
          (p.due_date && p.due_date.startsWith(currentMonth)))
    )
    const faturamento = monthPaid.reduce((s: number, p: any) => s + Number(p.amount || 0), 0)

    // Mês anterior para crescimento
    const prevMonthPaid = payments.filter(
      (p: any) =>
        p.status === 'paid' &&
        ((p.payment_date && p.payment_date.startsWith(prevMonth)) ||
          (p.due_date && p.due_date.startsWith(prevMonth)))
    )
    const faturamentoAnterior = prevMonthPaid.reduce((s: number, p: any) => s + Number(p.amount || 0), 0)
    const growthPercent =
      faturamentoAnterior > 0
        ? Math.round(((faturamento - faturamentoAnterior) / faturamentoAnterior) * 100)
        : faturamento > 0 ? 100 : 0

    // Turmas de hoje: classes com schedule contendo day_of_week = todayDow
    const turmasDeHoje = classes
      .filter((c: any) => {
        const schedule = c.schedule ?? []
        return schedule.some((s: any) => s.day_of_week === todayDow)
      })
      .map((c: any) => {
        const schedule = c.schedule ?? []
        const todaySlots = schedule.filter((s: any) => s.day_of_week === todayDow)
        const teacherName = c.professional?.name ?? 'Não definido'
        return {
          id: c.id,
          name: c.name,
          dance_style: c.dance_style,
          teacherName,
          slots: todaySlots.map((s: any) => ({
            day: DAY_NAMES[todayDow],
            time: s.start_time ?? '—',
            end_time: s.end_time ?? null,
          })),
        }
      })
      .sort((a: any, b: any) => {
        const timeA = a.slots[0]?.time ?? '99:99'
        const timeB = b.slots[0]?.time ?? '99:99'
        return timeA.localeCompare(timeB)
      })

    return NextResponse.json({
      alunos: studentsCount,
      professores: teachersCount,
      turmas: classes.length,
      faturamento,
      faturamentoGrowth: growthPercent,
      turmasDeHoje,
    })
  } catch (error: any) {
    logger.error('❌ [DANCE-STUDIO/DASHBOARD/STATS] Erro:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
