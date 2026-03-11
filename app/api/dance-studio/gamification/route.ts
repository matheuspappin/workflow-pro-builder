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

// GET /api/dance-studio/gamification?studioId=...
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
    // Ranking: soma de points_earned por aluno (gamifications) + nome do students
    const { data: gamifications, error: gamifErr } = await supabase
      .from('gamifications')
      .select('student_id, points_earned')
      .eq('studio_id', studioId)
      .eq('is_active', true)

    if (gamifErr) throw gamifErr

    const pointsByStudent: Record<string, number> = {}
    for (const g of gamifications || []) {
      if (!g.student_id) continue
      pointsByStudent[g.student_id] = (pointsByStudent[g.student_id] || 0) + (g.points_earned || 0)
    }

    // Buscar alunos: quem tem pontos ou todos (para mostrar pessoas reais)
    const { data: allStudents, error: studentsErr } = await supabase
      .from('students')
      .select('id, name')
      .eq('studio_id', studioId)
      .eq('status', 'active')
      .order('name')

    const studentsMap: Record<string, { name: string }> = {}
    const studentIds: string[] = []
    if (!studentsErr && allStudents) {
      allStudents.forEach((s) => {
        studentsMap[s.id] = { name: s.name }
        if (!(s.id in pointsByStudent)) pointsByStudent[s.id] = 0
        studentIds.push(s.id)
      })
    }
    // Incluir alunos que têm pontos mas não em allStudents (edge case)
    Object.keys(pointsByStudent).forEach((id) => {
      if (!studentsMap[id]) studentsMap[id] = { name: 'Aluno' }
      if (!studentIds.includes(id)) studentIds.push(id)
    })

    const ranking = studentIds
      .map((id) => ({
        student_id: id,
        name: studentsMap[id]?.name || 'Aluno',
        points: pointsByStudent[id],
      }))
      .sort((a, b) => b.points - a.points)
      .slice(0, 20)
      .map((r, i) => ({
        ...r,
        pos: i + 1,
        badge: i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}°`,
      }))

    // Stats: total alunos ativos, conquistas desbloqueadas, pontos distribuídos
    const { count: studentsCount } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true })
      .eq('studio_id', studioId)
      .eq('status', 'active')

    const totalAchievements = gamifications?.length || 0
    const totalPoints = Object.values(pointsByStudent).reduce((a, b) => a + b, 0)
    const engagementRate =
      (studentsCount || 0) > 0
        ? Math.round(((Object.keys(pointsByStudent).length / (studentsCount || 1)) * 100))
        : 0

    // Config e conquistas personalizadas
    const { data: settings } = await supabase
      .from('studio_settings')
      .select('setting_key, setting_value')
      .eq('studio_id', studioId)

    const map: Record<string, string> = {}
    settings?.forEach((s: any) => { map[s.setting_key] = s.setting_value })

    let config: any = {}
    if (map.gamification_config) {
      try {
        config = JSON.parse(map.gamification_config)
      } catch {}
    }

    const defaultAchievements = [
      { id: 'frequencia_perfeita', label: 'Frequência Perfeita', desc: 'Nunca faltou em um mês', points: 100, icon: 'Star' },
      { id: 'primeiro_mes', label: 'Primeiro Mês', desc: 'Completou o primeiro mês', points: 50, icon: 'Zap' },
      { id: 'em_evolucao', label: 'Em Evolução', desc: '5 semanas consecutivas', points: 75, icon: 'TrendingUp' },
      { id: 'destaque_turma', label: 'Destaque da Turma', desc: 'Melhor frequência da turma', points: 150, icon: 'Award' },
      { id: 'campea_mes', label: 'Campeã do Mês', desc: '1º lugar no ranking mensal', points: 200, icon: 'Crown' },
      { id: 'seis_meses', label: '6 Meses de Dança', desc: 'Meia ano sem parar', points: 300, icon: 'Medal' },
    ]

    const achievements = Array.isArray(config.achievements) && config.achievements.length > 0
      ? config.achievements
      : defaultAchievements

    return NextResponse.json({
      ranking,
      achievements,
      config: {
        enabled: config.enabled !== false,
        points_per_checkin: config.points_per_checkin ?? 10,
        points_per_referral: config.points_per_referral ?? 50,
        streak_bonus: config.streak_bonus ?? 5,
      },
      stats: {
        studentsActive: studentsCount || 0,
        achievementsUnlocked: totalAchievements,
        totalPoints,
        engagementRate,
      },
    })
  } catch (error: any) {
    logger.error('❌ [DANCE-STUDIO/GAMIFICATION] Erro:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
